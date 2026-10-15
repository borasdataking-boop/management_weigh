import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as mqtt from 'mqtt';
import { Subject, Observable } from 'rxjs';
import {
  ScaleTelemetryPayload,
  HubHeartbeatPayload,
  RecordWeighLogDto,
} from '@industrial-scale/types';
import { BatchDashboardService } from '../batch-dashboard/batch-dashboard.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;

  // RxJS Streams for Telemetry and Heartbeat events
  private readonly telemetrySubject = new Subject<ScaleTelemetryPayload>();
  private readonly heartbeatSubject = new Subject<HubHeartbeatPayload>();

  constructor(
    @Inject(forwardRef(() => BatchDashboardService))
    private readonly batchDashboardService?: BatchDashboardService,
  ) {}

  get telemetry$(): Observable<ScaleTelemetryPayload> {
    return this.telemetrySubject.asObservable();
  }

  get heartbeat$(): Observable<HubHeartbeatPayload> {
    return this.heartbeatSubject.asObservable();
  }

  onModuleInit() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const username = process.env.MQTT_USERNAME || 'hub_client';
    const password = process.env.MQTT_PASSWORD || 'hub_secret_password';

    this.logger.log(`Connecting to EMQX Broker at ${brokerUrl}...`);

    this.client = mqtt.connect(brokerUrl, {
      username,
      password,
      clientId: `backend_core_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected successfully to EMQX Broker.');

      // 1. Telemetry & Heartbeat topics
      const telemetryPattern = 'tenants/+/hubs/+/scales/+/telemetry';
      const heartbeatPattern = 'tenants/+/hubs/+/heartbeat';

      // 2. PMSL Weigh Station topics (real-time weigh events from scales)
      const pmslStationWeightPattern = 'pmsl/stations/+/weight';
      const pmslGeneralWeightPattern = 'pmsl/weight';

      const patterns = [
        telemetryPattern,
        heartbeatPattern,
        pmslStationWeightPattern,
        pmslGeneralWeightPattern,
      ];

      this.client.subscribe(patterns, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to MQTT patterns: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to PMSL MQTT patterns: [${patterns.join(', ')}]`);
        }
      });
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      this.handleIncomingMessage(topic, message);
    });

    this.client.on('error', (err) => {
      // Log connection error without crashing
      this.logger.warn(`EMQX Connection: ${err.message}`);
    });
  }

  private async handleIncomingMessage(topic: string, message: Buffer) {
    try {
      const payloadString = message.toString();
      const data = JSON.parse(payloadString);

      // Check if it's a PMSL Production Weight Log event
      if (
        topic.startsWith('pmsl/') ||
        topic.endsWith('/weight') ||
        topic.endsWith('/weigh')
      ) {
        if (this.batchDashboardService && data.batchId && data.stationId) {
          await this.batchDashboardService.recordWeighLog(
            data as RecordWeighLogDto,
          );
        }
        return;
      }

      if (topic.endsWith('/telemetry')) {
        this.telemetrySubject.next(data as ScaleTelemetryPayload);
      } else if (topic.endsWith('/heartbeat')) {
        this.heartbeatSubject.next(data as HubHeartbeatPayload);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to parse incoming MQTT payload on topic ${topic}: ${error.message}`,
      );
    }
  }

  publishCommand(topic: string, message: object): void {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message), { qos: 1 });
    } else {
      this.logger.warn('Cannot publish command: MQTT client disconnected');
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
      this.logger.log('EMQX client disconnected cleanly.');
    }
  }
}
