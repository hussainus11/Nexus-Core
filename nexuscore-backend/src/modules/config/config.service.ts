import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── System Settings ────────────────────────────────────────────────────────
  // Multiple key-value rows per company; upsert by key+companyId

  async getSystemSettings(companyId: string) {
    return this.prisma.systemSetting.findMany({ where: { companyId } });
  }

  async upsertSystemSetting(companyId: string, key: string, value: string, branchId?: string) {
    return this.prisma.systemSetting.upsert({
      where: { key_companyId_branchId: { key, companyId: companyId as string, branchId: (branchId ?? null) as string } },
      create: { key, value, companyId, branchId },
      update: { value },
    });
  }

  async upsertSystemSettings(companyId: string, dto: Record<string, string>, branchId?: string) {
    const results: any[] = [];
    for (const [key, value] of Object.entries(dto)) {
      results.push(await this.upsertSystemSetting(companyId, key, String(value), branchId));
    }
    return results;
  }

  // ── Menu Items ─────────────────────────────────────────────────────────────

  async getMenuItems(companyId: string, branchId?: string) {
    return this.prisma.menuItem.findMany({
      where: this.scope(companyId, branchId),
      orderBy: { order: 'asc' },
    });
  }

  async createMenuItem(dto: any, companyId: string, branchId?: string) {
    return this.prisma.menuItem.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateMenuItem(id: string, dto: any) {
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async deleteMenuItem(id: string) {
    return this.prisma.menuItem.delete({ where: { id } });
  }

  // ── Auto Numbering ─────────────────────────────────────────────────────────

  async getAutoNumberings(companyId: string) {
    return this.prisma.autoNumbering.findMany({ where: { companyId } });
  }

  async upsertAutoNumbering(companyId: string, entity: string, dto: any, branchId?: string) {
    return this.prisma.autoNumbering.upsert({
      where: { entity_companyId_branchId: { entity, companyId: companyId as string, branchId: (branchId ?? null) as string } },
      create: { ...dto, companyId, entity, branchId },
      update: dto,
    });
  }

  // ── Business Processes ─────────────────────────────────────────────────────

  async getBusinessProcesses(companyId: string, branchId?: string) {
    return this.prisma.businessProcess.findMany({
      where: this.scope(companyId, branchId),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBusinessProcess(dto: any, companyId: string, branchId?: string) {
    return this.prisma.businessProcess.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateBusinessProcess(id: string, dto: any) {
    return this.prisma.businessProcess.update({ where: { id }, data: dto });
  }

  async deleteBusinessProcess(id: string) {
    return this.prisma.businessProcess.delete({ where: { id } });
  }

  // ── Analytical Reports ─────────────────────────────────────────────────────

  async getAnalyticalReports(companyId: string, branchId?: string) {
    return this.prisma.analyticalReport.findMany({
      where: this.scope(companyId, branchId),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnalyticalReport(dto: any, companyId: string, branchId?: string) {
    return this.prisma.analyticalReport.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateAnalyticalReport(id: string, dto: any) {
    return this.prisma.analyticalReport.update({ where: { id }, data: dto });
  }

  async deleteAnalyticalReport(id: string) {
    return this.prisma.analyticalReport.delete({ where: { id } });
  }

  // ── Pricing Plans ──────────────────────────────────────────────────────────

  async getPricingPlans(companyId?: string) {
    return this.prisma.pricingPlan.findMany({
      where: companyId ? { OR: [{ companyId }, { companyId: null }] } : { companyId: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPricingPlan(dto: any) {
    return this.prisma.pricingPlan.create({ data: dto });
  }

  async updatePricingPlan(id: string, dto: any) {
    return this.prisma.pricingPlan.update({ where: { id }, data: dto });
  }

  async deletePricingPlan(id: string) {
    return this.prisma.pricingPlan.delete({ where: { id } });
  }

  // ── CRM Roles ──────────────────────────────────────────────────────────────

  async getCrmRoles(companyId: string, branchId?: string) {
    return this.prisma.crmRole.findMany({
      where: this.scope(companyId, branchId),
      orderBy: { name: 'asc' },
    });
  }

  async createCrmRole(dto: any, companyId: string, branchId?: string) {
    return this.prisma.crmRole.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateCrmRole(id: string, dto: any) {
    return this.prisma.crmRole.update({ where: { id }, data: dto });
  }

  async deleteCrmRole(id: string) {
    return this.prisma.crmRole.delete({ where: { id } });
  }

  // ── Access Control ─────────────────────────────────────────────────────────

  async getAccessControls(companyId: string) {
    return this.prisma.accessControl.findMany({ where: { companyId }, orderBy: { resource: 'asc' } });
  }

  async createAccessControl(companyId: string, dto: any) {
    return this.prisma.accessControl.create({ data: { ...dto, companyId } });
  }

  async updateAccessControl(id: string, dto: any) {
    return this.prisma.accessControl.update({ where: { id }, data: dto });
  }

  async deleteAccessControl(id: string) {
    return this.prisma.accessControl.delete({ where: { id } });
  }

  // ── Security Settings ──────────────────────────────────────────────────────

  async getSecuritySettings(companyId: string) {
    return this.prisma.security.findMany({ where: { companyId } });
  }

  async createSecuritySetting(companyId: string, dto: any) {
    return this.prisma.security.create({ data: { ...dto, companyId } });
  }

  async updateSecuritySetting(id: string, dto: any) {
    return this.prisma.security.update({ where: { id }, data: dto });
  }

  async deleteSecuritySetting(id: string) {
    return this.prisma.security.delete({ where: { id } });
  }

  // ── Permission Settings ────────────────────────────────────────────────────

  async getPermissionSettings(companyId: string, crmRoleId?: string) {
    return this.prisma.permissionSetting.findMany({
      where: { companyId, ...(crmRoleId ? { crmRoleId } : {}) },
    });
  }

  async createPermissionSetting(dto: any) {
    return this.prisma.permissionSetting.create({ data: dto });
  }

  async updatePermissionSetting(id: string, dto: any) {
    return this.prisma.permissionSetting.update({ where: { id }, data: dto });
  }

  async deletePermissionSetting(id: string) {
    return this.prisma.permissionSetting.delete({ where: { id } });
  }

  // ── Report Templates & PDF Reports ────────────────────────────────────────

  async getReportTemplates(companyId: string) {
    return this.prisma.reportTemplate.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async createReportTemplate(dto: any, companyId: string) {
    return this.prisma.reportTemplate.create({ data: { ...dto, companyId } });
  }

  async updateReportTemplate(id: string, dto: any) {
    return this.prisma.reportTemplate.update({ where: { id }, data: dto });
  }

  async deleteReportTemplate(id: string) {
    return this.prisma.reportTemplate.delete({ where: { id } });
  }

  async getPdfReports(companyId: string) {
    return this.prisma.pdfReport.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPdfReport(dto: any, companyId: string, createdById: string) {
    return this.prisma.pdfReport.create({ data: { ...dto, companyId, createdById } });
  }

  async deletePdfReport(id: string) {
    return this.prisma.pdfReport.delete({ where: { id } });
  }
}
