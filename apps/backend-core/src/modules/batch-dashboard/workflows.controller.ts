import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BatchDashboardService } from './batch-dashboard.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from '@industrial-scale/types';

@Controller('api/workflows')
export class WorkflowsController {
  constructor(private readonly dashboardService: BatchDashboardService) {}

  @Get()
  getWorkflows() {
    return this.dashboardService.getWorkflows();
  }

  @Get(':id')
  getWorkflow(@Param('id') id: string) {
    return this.dashboardService.getWorkflow(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createWorkflow(@Body() dto: CreateWorkflowDto) {
    return this.dashboardService.createWorkflow(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  updateWorkflow(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.dashboardService.updateWorkflow(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteWorkflow(@Param('id') id: string) {
    return this.dashboardService.deleteWorkflow(id);
  }

  @Post(':id/assign-batch/:batchId')
  @HttpCode(HttpStatus.OK)
  assignWorkflowToBatch(
    @Param('id') workflowId: string,
    @Param('batchId') batchId: string,
  ) {
    return this.dashboardService.assignWorkflowToBatch(batchId, workflowId);
  }
}
