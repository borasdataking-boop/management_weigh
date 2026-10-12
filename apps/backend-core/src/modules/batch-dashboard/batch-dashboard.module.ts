import { Module } from '@nestjs/common';
import { BatchDashboardService } from './batch-dashboard.service';
import { BatchDashboardController } from './batch-dashboard.controller';
import { BatchDashboardGateway } from './batch-dashboard.gateway';

@Module({
  controllers: [BatchDashboardController],
  providers: [BatchDashboardService, BatchDashboardGateway],
  exports: [BatchDashboardService, BatchDashboardGateway],
})
export class BatchDashboardModule {}
