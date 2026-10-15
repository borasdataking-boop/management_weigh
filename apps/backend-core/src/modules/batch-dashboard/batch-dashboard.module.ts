import { Module } from '@nestjs/common';
import { BatchDashboardService } from './batch-dashboard.service';
import { BatchDashboardController } from './batch-dashboard.controller';
import { CompaniesController } from './companies.controller';
import { ProcessesController } from './processes.controller';
import { WorkflowsController } from './workflows.controller';
import { BatchDashboardGateway } from './batch-dashboard.gateway';

@Module({
  controllers: [
    BatchDashboardController,
    CompaniesController,
    ProcessesController,
    WorkflowsController,
  ],
  providers: [BatchDashboardService, BatchDashboardGateway],
  exports: [BatchDashboardService, BatchDashboardGateway],
})
export class BatchDashboardModule {}

