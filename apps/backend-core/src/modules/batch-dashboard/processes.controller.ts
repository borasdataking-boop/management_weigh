import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BatchDashboardService } from './batch-dashboard.service';
import {
  CreateProcessDto,
  UpdateProcessDto,
  AddStationToProcessDto,
  AddProductToProcessDto,
  ReorderProcessesDto,
  UpdateProcessMappingsDto,
} from '@industrial-scale/types';

@Controller('api/processes')
export class ProcessesController {
  constructor(private readonly dashboardService: BatchDashboardService) {}

  @Get()
  getProcesses(@Query('workflowId') workflowId?: string) {
    return this.dashboardService.getProcesses(workflowId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createProcess(
    @Body() dto: CreateProcessDto,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.createProcess(dto, workflowId);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  reorderProcesses(
    @Body() dto: ReorderProcessesDto,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.reorderProcesses(dto.processIds, workflowId);
  }

  @Put('bulk')
  @HttpCode(HttpStatus.OK)
  saveBulkProcesses(
    @Body() body: { processes: any[] },
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.saveBulkProcesses(body.processes, workflowId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  updateProcess(
    @Param('id') id: string,
    @Body() dto: UpdateProcessDto,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.updateProcess(id, dto, workflowId);
  }

  @Put(':id/mappings')
  @HttpCode(HttpStatus.OK)
  updateProcessMappings(
    @Param('id') id: string,
    @Body() dto: UpdateProcessMappingsDto,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.updateProcessMappings(
      id,
      dto.nextProcessIds,
      workflowId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteProcess(
    @Param('id') id: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.deleteProcess(id, workflowId);
  }

  @Post(':id/stations')
  @HttpCode(HttpStatus.CREATED)
  addStationToProcess(
    @Param('id') id: string,
    @Body() dto: AddStationToProcessDto,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.addStationToProcess(id, dto, workflowId);
  }

  @Delete(':processId/stations/:stationId')
  @HttpCode(HttpStatus.OK)
  deleteStationFromProcess(
    @Param('processId') processId: string,
    @Param('stationId') stationId: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.deleteStationFromProcess(processId, stationId, workflowId);
  }

  @Post(':id/products')
  @HttpCode(HttpStatus.CREATED)
  addProductToProcess(
    @Param('id') id: string,
    @Body() dto: AddProductToProcessDto,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.addProductToProcess(id, dto, workflowId);
  }

  @Delete(':processId/products/:productId')
  @HttpCode(HttpStatus.OK)
  deleteProductFromProcess(
    @Param('processId') processId: string,
    @Param('productId') productId: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.dashboardService.deleteProductFromProcess(processId, productId, workflowId);
  }
}
