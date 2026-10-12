import { Module } from '@nestjs/common';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { BatchDashboardModule } from './modules/batch-dashboard/batch-dashboard.module';

@Module({
  imports: [TelemetryModule, BatchDashboardModule],
})
export class AppModule {}
