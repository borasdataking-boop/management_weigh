import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BatchDashboardService } from './batch-dashboard.service';
import { Batch, BatchKPIResponse } from './batch-dashboard.interface';

@Controller('api/batches')
export class BatchDashboardController {
  constructor(private readonly dashboardService: BatchDashboardService) {}

  @Get()
  getBatches(): Batch[] {
    return this.dashboardService.getBatches();
  }

  @Get(':id/summary')
  getBatchSummary(@Param('id') id: string): BatchKPIResponse {
    return this.dashboardService.getBatchSummary(id);
  }

  @Post(':id/simulate-toggle')
  @HttpCode(HttpStatus.OK)
  toggleSimulation(@Param('id') id: string): { isSimulating: boolean } {
    return this.dashboardService.toggleSimulation(id);
  }

  @Post(':id/simulate-tick')
  @HttpCode(HttpStatus.OK)
  simulateTick(@Param('id') id: string) {
    return this.dashboardService.simulateWeighTick(id);
  }
}
