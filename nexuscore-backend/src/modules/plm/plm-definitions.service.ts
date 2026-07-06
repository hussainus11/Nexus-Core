import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlmDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Style Sample Types ────────────────────────────────────────────────────────
  async listSampleTypes() {
    return this.prisma.styleSampleType.findMany({ orderBy: { sequence: 'asc' } });
  }
  async createSampleType(dto: any) {
    return this.prisma.styleSampleType.create({ data: dto });
  }
  async getSampleType(id: string) {
    const r = await this.prisma.styleSampleType.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('StyleSampleType not found');
    return r;
  }
  async updateSampleType(id: string, dto: any) {
    await this.getSampleType(id);
    return this.prisma.styleSampleType.update({ where: { id }, data: dto });
  }
  async deleteSampleType(id: string) {
    await this.getSampleType(id);
    await this.prisma.styleSampleType.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Design Detail Types ───────────────────────────────────────────────────────
  async listDesignDetailTypes() {
    return this.prisma.designDetailType.findMany({ orderBy: { name: 'asc' } });
  }
  async createDesignDetailType(dto: any) {
    return this.prisma.designDetailType.create({ data: dto });
  }
  async getDesignDetailType(id: string) {
    const r = await this.prisma.designDetailType.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('DesignDetailType not found');
    return r;
  }
  async updateDesignDetailType(id: string, dto: any) {
    await this.getDesignDetailType(id);
    return this.prisma.designDetailType.update({ where: { id }, data: dto });
  }
  async deleteDesignDetailType(id: string) {
    await this.getDesignDetailType(id);
    await this.prisma.designDetailType.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Measurement Definitions ───────────────────────────────────────────────────
  async listMeasurementDefs() {
    return this.prisma.measurementDefinition.findMany({ orderBy: { sequence: 'asc' } });
  }
  async createMeasurementDef(dto: any) {
    return this.prisma.measurementDefinition.create({ data: dto });
  }
  async getMeasurementDef(id: string) {
    const r = await this.prisma.measurementDefinition.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('MeasurementDefinition not found');
    return r;
  }
  async updateMeasurementDef(id: string, dto: any) {
    await this.getMeasurementDef(id);
    return this.prisma.measurementDefinition.update({ where: { id }, data: dto });
  }
  async deleteMeasurementDef(id: string) {
    await this.getMeasurementDef(id);
    await this.prisma.measurementDefinition.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Measurement Charts ────────────────────────────────────────────────────────
  async listMeasurementCharts(branchId?: string) {
    return this.prisma.measurementChart.findMany({
      where: branchId ? { branchId } : undefined,
      include: { lines: { include: { measurementDefinition: true } } },
      orderBy: { name: 'asc' },
    });
  }
  async createMeasurementChart(dto: any) {
    const { lines, ...chartData } = dto;
    return this.prisma.measurementChart.create({
      data: { ...chartData, lines: lines ? { create: lines } : undefined },
      include: { lines: { include: { measurementDefinition: true } } },
    });
  }
  async getMeasurementChart(id: string) {
    const r = await this.prisma.measurementChart.findUnique({
      where: { id },
      include: { lines: { include: { measurementDefinition: true } } },
    });
    if (!r) throw new NotFoundException('MeasurementChart not found');
    return r;
  }
  async updateMeasurementChart(id: string, dto: any) {
    await this.getMeasurementChart(id);
    const { lines, ...chartData } = dto;
    return this.prisma.measurementChart.update({
      where: { id },
      data: chartData,
      include: { lines: { include: { measurementDefinition: true } } },
    });
  }
  async deleteMeasurementChart(id: string) {
    await this.getMeasurementChart(id);
    await this.prisma.measurementChart.delete({ where: { id } });
    return { message: 'Deleted' };
  }
  async upsertChartLines(chartId: string, lines: any[]) {
    await this.getMeasurementChart(chartId);
    await this.prisma.measurementChartLine.deleteMany({ where: { chartId } });
    return this.prisma.measurementChartLine.createMany({
      data: lines.map((l) => ({ ...l, chartId })),
    });
  }

  // ── Department Cards ──────────────────────────────────────────────────────────
  async listDepartments(branchId?: string) {
    return this.prisma.departmentCard.findMany({
      where: branchId ? { branchId } : undefined,
      include: { _count: { select: { employees: true, processCards: true } } },
      orderBy: { name: 'asc' },
    });
  }
  async createDepartment(dto: any) {
    return this.prisma.departmentCard.create({ data: dto });
  }
  async getDepartment(id: string) {
    const r = await this.prisma.departmentCard.findUnique({
      where: { id },
      include: { employees: true, processCards: true },
    });
    if (!r) throw new NotFoundException('DepartmentCard not found');
    return r;
  }
  async updateDepartment(id: string, dto: any) {
    await this.getDepartment(id);
    return this.prisma.departmentCard.update({ where: { id }, data: dto });
  }
  async deleteDepartment(id: string) {
    await this.getDepartment(id);
    await this.prisma.departmentCard.delete({ where: { id } });
    return { message: 'Deleted' };
  }
  async getDepartmentEmployees(id: string) {
    return this.prisma.employeeCard.findMany({ where: { departmentId: id }, orderBy: { name: 'asc' } });
  }

  // ── Process Cards ─────────────────────────────────────────────────────────────
  async listProcessCards(departmentId?: string) {
    return this.prisma.processCard.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: { department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }
  async createProcessCard(dto: any) {
    return this.prisma.processCard.create({
      data: dto,
      include: { department: { select: { id: true, name: true } } },
    });
  }
  async getProcessCard(id: string) {
    const r = await this.prisma.processCard.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!r) throw new NotFoundException('ProcessCard not found');
    return r;
  }
  async updateProcessCard(id: string, dto: any) {
    await this.getProcessCard(id);
    return this.prisma.processCard.update({ where: { id }, data: dto });
  }
  async deleteProcessCard(id: string) {
    await this.getProcessCard(id);
    await this.prisma.processCard.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Employee Cards ────────────────────────────────────────────────────────────
  async listEmployees(branchId?: string, departmentId?: string) {
    return this.prisma.employeeCard.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      include: { department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }
  async createEmployee(dto: any) {
    return this.prisma.employeeCard.create({
      data: dto,
      include: { department: { select: { id: true, name: true } } },
    });
  }
  async getEmployee(id: string) {
    const r = await this.prisma.employeeCard.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!r) throw new NotFoundException('EmployeeCard not found');
    return r;
  }
  async updateEmployee(id: string, dto: any) {
    await this.getEmployee(id);
    return this.prisma.employeeCard.update({ where: { id }, data: dto });
  }
  async deleteEmployee(id: string) {
    await this.getEmployee(id);
    await this.prisma.employeeCard.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Resource Cards ────────────────────────────────────────────────────────────
  async listResources(branchId?: string, type?: string) {
    return this.prisma.resourceCard.findMany({
      where: { ...(branchId ? { branchId } : {}), ...(type ? { type } : {}) },
      orderBy: { name: 'asc' },
    });
  }
  async createResource(dto: any) {
    return this.prisma.resourceCard.create({ data: dto });
  }
  async getResource(id: string) {
    const r = await this.prisma.resourceCard.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('ResourceCard not found');
    return r;
  }
  async updateResource(id: string, dto: any) {
    await this.getResource(id);
    return this.prisma.resourceCard.update({ where: { id }, data: dto });
  }
  async deleteResource(id: string) {
    await this.getResource(id);
    await this.prisma.resourceCard.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Study Template Cards ──────────────────────────────────────────────────────
  async listStudyTemplates(branchId?: string, styleCardId?: string) {
    return this.prisma.studyTemplateCard.findMany({
      where: { ...(branchId ? { branchId } : {}), ...(styleCardId ? { styleCardId } : {}) },
      include: {
        lines: { include: { processCard: { select: { id: true, name: true } } }, orderBy: { sequence: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }
  async createStudyTemplate(dto: any, createdBy: string) {
    const { lines, ...data } = dto;
    return this.prisma.studyTemplateCard.create({
      data: { ...data, createdBy, lines: lines ? { create: lines } : undefined },
      include: { lines: { include: { processCard: true }, orderBy: { sequence: 'asc' } } },
    });
  }
  async getStudyTemplate(id: string) {
    const r = await this.prisma.studyTemplateCard.findUnique({
      where: { id },
      include: { lines: { include: { processCard: true }, orderBy: { sequence: 'asc' } } },
    });
    if (!r) throw new NotFoundException('StudyTemplateCard not found');
    return r;
  }
  async updateStudyTemplate(id: string, dto: any) {
    await this.getStudyTemplate(id);
    const { lines, ...data } = dto;
    return this.prisma.studyTemplateCard.update({ where: { id }, data });
  }
  async deleteStudyTemplate(id: string) {
    await this.getStudyTemplate(id);
    await this.prisma.studyTemplateCard.delete({ where: { id } });
    return { message: 'Deleted' };
  }
  async upsertStudyTemplateLines(templateId: string, lines: any[]) {
    await this.getStudyTemplate(templateId);
    await this.prisma.studyTemplateLine.deleteMany({ where: { studyTemplateId: templateId } });
    return this.prisma.studyTemplateLine.createMany({
      data: lines.map((l) => ({ ...l, studyTemplateId: templateId })),
    });
  }
  async deleteStudyTemplateLine(templateId: string, lineId: string) {
    await this.prisma.studyTemplateLine.delete({ where: { id: lineId } });
    return { message: 'Line deleted' };
  }

  // ── PLM Templates ─────────────────────────────────────────────────────────────
  async listTemplates(branchId?: string, type?: string) {
    return this.prisma.plmTemplate.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(type ? { type } : {}),
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }
  async createTemplate(dto: any, createdBy: string) {
    return this.prisma.plmTemplate.create({ data: { ...dto, createdBy } });
  }
  async getTemplate(id: string) {
    const r = await this.prisma.plmTemplate.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('PlmTemplate not found');
    return r;
  }
  async updateTemplate(id: string, dto: any) {
    await this.getTemplate(id);
    return this.prisma.plmTemplate.update({ where: { id }, data: dto });
  }
  async deleteTemplate(id: string) {
    await this.getTemplate(id);
    await this.prisma.plmTemplate.delete({ where: { id } });
    return { message: 'Deleted' };
  }
  async duplicateTemplate(id: string, createdBy: string) {
    const t = await this.getTemplate(id);
    return this.prisma.plmTemplate.create({
      data: {
        name: `${t.name} (Copy)`,
        type: t.type,
        description: t.description,
        structure: t.structure ?? {},
        isDefault: false,
        isActive: t.isActive,
        branchId: t.branchId,
        createdBy,
      },
    });
  }
}
