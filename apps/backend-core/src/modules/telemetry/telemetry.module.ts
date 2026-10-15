import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { TelemetryGateway } from './telemetry.gateway';
import { BatchDashboardModule } from '../batch-dashboard/batch-dashboard.module';

@Module({
  imports: [forwardRef(() => BatchDashboardModule)],
  providers: [MqttService, TelemetryGateway],
  exports: [MqttService, TelemetryGateway],
})
export class TelemetryModule {}
