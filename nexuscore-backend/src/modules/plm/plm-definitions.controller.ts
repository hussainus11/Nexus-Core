import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlmDefinitionsService } from './plm-definitions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('PLM Definitions')
@Controller('plm')
export class PlmDefinitionsController {
  constructor(private readonly svc: PlmDefinitionsService) {}

  // Style Sample Types
  @Get('style-sample-types') listSampleTypes() { return this.svc.listSampleTypes(); }
  @Post('style-sample-types') createSampleType(@Body() dto: any) { return this.svc.createSampleType(dto); }
  @Get('style-sample-types/:id') getSampleType(@Param('id') id: string) { return this.svc.getSampleType(id); }
  @Put('style-sample-types/:id') updateSampleType(@Param('id') id: string, @Body() dto: any) { return this.svc.updateSampleType(id, dto); }
  @Delete('style-sample-types/:id') deleteSampleType(@Param('id') id: string) { return this.svc.deleteSampleType(id); }

  // Design Detail Types
  @Get('design-detail-types') listDesignDetailTypes() { return this.svc.listDesignDetailTypes(); }
  @Post('design-detail-types') createDesignDetailType(@Body() dto: any) { return this.svc.createDesignDetailType(dto); }
  @Get('design-detail-types/:id') getDesignDetailType(@Param('id') id: string) { return this.svc.getDesignDetailType(id); }
  @Put('design-detail-types/:id') updateDesignDetailType(@Param('id') id: string, @Body() dto: any) { return this.svc.updateDesignDetailType(id, dto); }
  @Delete('design-detail-types/:id') deleteDesignDetailType(@Param('id') id: string) { return this.svc.deleteDesignDetailType(id); }

  // Measurement Definitions
  @Get('measurement-definitions') listMeasurementDefs() { return this.svc.listMeasurementDefs(); }
  @Post('measurement-definitions') createMeasurementDef(@Body() dto: any) { return this.svc.createMeasurementDef(dto); }
  @Get('measurement-definitions/:id') getMeasurementDef(@Param('id') id: string) { return this.svc.getMeasurementDef(id); }
  @Put('measurement-definitions/:id') updateMeasurementDef(@Param('id') id: string, @Body() dto: any) { return this.svc.updateMeasurementDef(id, dto); }
  @Delete('measurement-definitions/:id') deleteMeasurementDef(@Param('id') id: string) { return this.svc.deleteMeasurementDef(id); }

  // Measurement Charts
  @Get('measurement-charts') listMeasurementCharts(@CurrentUser() u: any, @Query('branchId') branchId?: string) { return this.svc.listMeasurementCharts(branchId || u.branchId); }
  @Post('measurement-charts') createMeasurementChart(@Body() dto: any) { return this.svc.createMeasurementChart(dto); }
  @Get('measurement-charts/:id') getMeasurementChart(@Param('id') id: string) { return this.svc.getMeasurementChart(id); }
  @Put('measurement-charts/:id') updateMeasurementChart(@Param('id') id: string, @Body() dto: any) { return this.svc.updateMeasurementChart(id, dto); }
  @Delete('measurement-charts/:id') deleteMeasurementChart(@Param('id') id: string) { return this.svc.deleteMeasurementChart(id); }
  @Put('measurement-charts/:id/lines') upsertChartLines(@Param('id') id: string, @Body() lines: any[]) { return this.svc.upsertChartLines(id, lines); }

  // Departments
  @Get('department-cards') listDepartments(@CurrentUser() u: any, @Query('branchId') b?: string) { return this.svc.listDepartments(b || u.branchId); }
  @Post('department-cards') createDepartment(@Body() dto: any) { return this.svc.createDepartment(dto); }
  @Get('department-cards/:id') getDepartment(@Param('id') id: string) { return this.svc.getDepartment(id); }
  @Put('department-cards/:id') updateDepartment(@Param('id') id: string, @Body() dto: any) { return this.svc.updateDepartment(id, dto); }
  @Delete('department-cards/:id') deleteDepartment(@Param('id') id: string) { return this.svc.deleteDepartment(id); }
  @Get('department-cards/:id/employees') getDeptEmployees(@Param('id') id: string) { return this.svc.getDepartmentEmployees(id); }

  // Process Cards
  @Get('process-cards') listProcessCards(@Query('departmentId') d?: string) { return this.svc.listProcessCards(d); }
  @Post('process-cards') createProcessCard(@Body() dto: any) { return this.svc.createProcessCard(dto); }
  @Get('process-cards/:id') getProcessCard(@Param('id') id: string) { return this.svc.getProcessCard(id); }
  @Put('process-cards/:id') updateProcessCard(@Param('id') id: string, @Body() dto: any) { return this.svc.updateProcessCard(id, dto); }
  @Delete('process-cards/:id') deleteProcessCard(@Param('id') id: string) { return this.svc.deleteProcessCard(id); }

  // Employee Cards
  @Get('employee-cards') listEmployees(@CurrentUser() u: any, @Query('branchId') b?: string, @Query('departmentId') d?: string) { return this.svc.listEmployees(b || u.branchId, d); }
  @Post('employee-cards') createEmployee(@Body() dto: any) { return this.svc.createEmployee(dto); }
  @Get('employee-cards/:id') getEmployee(@Param('id') id: string) { return this.svc.getEmployee(id); }
  @Put('employee-cards/:id') updateEmployee(@Param('id') id: string, @Body() dto: any) { return this.svc.updateEmployee(id, dto); }
  @Delete('employee-cards/:id') deleteEmployee(@Param('id') id: string) { return this.svc.deleteEmployee(id); }

  // Resource Cards
  @Get('resource-cards') listResources(@CurrentUser() u: any, @Query('branchId') b?: string, @Query('type') t?: string) { return this.svc.listResources(b || u.branchId, t); }
  @Post('resource-cards') createResource(@Body() dto: any) { return this.svc.createResource(dto); }
  @Get('resource-cards/:id') getResource(@Param('id') id: string) { return this.svc.getResource(id); }
  @Put('resource-cards/:id') updateResource(@Param('id') id: string, @Body() dto: any) { return this.svc.updateResource(id, dto); }
  @Delete('resource-cards/:id') deleteResource(@Param('id') id: string) { return this.svc.deleteResource(id); }

  // Study Templates
  @Get('study-templates') listStudyTemplates(@CurrentUser() u: any, @Query('branchId') b?: string, @Query('styleCardId') s?: string) { return this.svc.listStudyTemplates(b || u.branchId, s); }
  @Post('study-templates') @ApiOperation({ summary: 'Create study template' }) createStudyTemplate(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createStudyTemplate(dto, u.id); }
  @Get('study-templates/:id') getStudyTemplate(@Param('id') id: string) { return this.svc.getStudyTemplate(id); }
  @Put('study-templates/:id') updateStudyTemplate(@Param('id') id: string, @Body() dto: any) { return this.svc.updateStudyTemplate(id, dto); }
  @Delete('study-templates/:id') deleteStudyTemplate(@Param('id') id: string) { return this.svc.deleteStudyTemplate(id); }
  @Put('study-templates/:id/lines') upsertTemplateLines(@Param('id') id: string, @Body() lines: any[]) { return this.svc.upsertStudyTemplateLines(id, lines); }
  @Delete('study-templates/:id/lines/:lineId') deleteTemplateLine(@Param('id') id: string, @Param('lineId') lineId: string) { return this.svc.deleteStudyTemplateLine(id, lineId); }

  // PLM Templates
  @Get('templates') listTemplates(@CurrentUser() u: any, @Query('branchId') b?: string, @Query('type') t?: string) { return this.svc.listTemplates(b || u.branchId, t); }
  @Post('templates') createTemplate(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createTemplate(dto, u.id); }
  @Get('templates/:id') getTemplate(@Param('id') id: string) { return this.svc.getTemplate(id); }
  @Put('templates/:id') updateTemplate(@Param('id') id: string, @Body() dto: any) { return this.svc.updateTemplate(id, dto); }
  @Delete('templates/:id') deleteTemplate(@Param('id') id: string) { return this.svc.deleteTemplate(id); }
  @Post('templates/:id/duplicate') duplicateTemplate(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.duplicateTemplate(id, u.id); }
}
