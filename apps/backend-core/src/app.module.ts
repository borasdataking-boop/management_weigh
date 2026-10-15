import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { BatchDashboardModule } from './modules/batch-dashboard/batch-dashboard.module';

@Module({
  imports: [PrismaModule, TelemetryModule, BatchDashboardModule],
})
export class AppModule {}
