import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as mqtt from 'mqtt';
import { Subject, Observable } from 'rxjs';
import { ScaleTelemetryPayload, HubHeartbeatPayload } from '@industrial-scale/types';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;

  // RxJS Streams for Telemetry and Heartbeat events
  private readonly telemetrySubject = new Subject<ScaleTelemetryPayload>();
  private readonly heartbeatSubject = new Subject<HubHeartbeatPayload>();

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
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected successfully to EMQX Broker.');
      
      // Subscribe to all tenant telemetry & heartbeats
      // Topic schema:
      // Telemetry: tenants/{companyId}/hubs/{hubId}/scales/{scaleId}/telemetry
      // Heartbeat: tenants/{companyId}/hubs/{hubId}/heartbeat
      const telemetryPattern = 'tenants/+/hubs/+/scales/+/telemetry';
      const heartbeatPattern = 'tenants/+/hubs/+/heartbeat';

      this.client.subscribe([telemetryPattern, heartbeatPattern], (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to MQTT patterns: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to [${telemetryPattern}, ${heartbeatPattern}]`);
        }
      });
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      this.handleIncomingMessage(topic, message);
    });

    this.client.on('error', (err) => {
      this.logger.error(`EMQX Connection Error: ${err.message}`);
    });
  }

  private handleIncomingMessage(topic: string, message: Buffer) {
    try {
      const payloadString = message.toString();
      const data = JSON.parse(payloadString);

      if (topic.endsWith('/telemetry')) {
        this.telemetrySubject.next(data as ScaleTelemetryPayload);
      } else if (topic.endsWith('/heartbeat')) {
        this.heartbeatSubject.next(data as HubHeartbeatPayload);
      }
    } catch (error) {
      this.logger.warn(`Failed to parse incoming MQTT payload on topic ${topic}: ${error.message}`);
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
