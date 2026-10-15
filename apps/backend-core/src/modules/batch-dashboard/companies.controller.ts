import { Controller, Get, Param } from '@nestjs/common';
import { BatchDashboardService } from './batch-dashboard.service';
import { CompanyItem, HubItem } from '@industrial-scale/types';

@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly dashboardService: BatchDashboardService) {}

  @Get()
  getCompanies(): CompanyItem[] {
    return this.dashboardService.getCompanies();
  }

  @Get(':companyId/hubs')
  getHubs(@Param('companyId') companyId: string): HubItem[] {
    return this.dashboardService.getHubs(companyId);
  }
}
