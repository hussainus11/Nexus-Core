import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('cutting/wastage')
  @ApiOperation({ summary: 'Cutting wastage report' })
  wastage(@Query('branchId') branchId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.wastageReport(branchId, from, to);
  }

  @Get('cutting/productivity')
  @ApiOperation({ summary: 'Cutter productivity report' })
  productivity(@Query('branchId') branchId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.productivityReport(branchId, from, to);
  }

  @Get('cutting/consumption')
  @ApiOperation({ summary: 'Fabric consumption report' })
  consumption(@Query('branchId') branchId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.consumptionReport(branchId, from, to);
  }

  @Get('cutting/defects')
  @ApiOperation({ summary: 'Defects report' })
  defects(@Query('branchId') branchId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.defectsReport(branchId, from, to);
  }

  @Get('cutting/shifts')
  @ApiOperation({ summary: 'Shift productivity report' })
  shifts(@Query('branchId') branchId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.shiftsReport(branchId, from, to);
  }

  @Get('sustainability')
  @ApiOperation({ summary: 'Sustainability (waste/water/carbon) report' })
  sustainability(@Query('branchId') branchId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.sustainabilityReport(branchId, from, to);
  }
}
