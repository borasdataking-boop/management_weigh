import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { TelemetryGateway } from './telemetry.gateway';

@Module({
  providers: [MqttService, TelemetryGateway],
  exports: [MqttService, TelemetryGateway],
})
export class TelemetryModule {}
