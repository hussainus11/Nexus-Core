import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── Deal Pipelines ─────────────────────────────────────────────────────────

  async getPipelines(companyId: string, branchId?: string) {
    return this.prisma.dealPipeline.findMany({
      where: this.scope(companyId, branchId),
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPipeline(id: string, companyId: string) {
    const p = await this.prisma.dealPipeline.findFirst({
      where: { id, companyId },
      include: {
        stages: { orderBy: { order: 'asc' }, include: { toConnections: true, fromConnections: true } },
      },
    });
    if (!p) throw new NotFoundException('Pipeline not found');
    return p;
  }

  async createPipeline(dto: any, companyId: string, branchId?: string) {
    return this.prisma.dealPipeline.create({
      data: { ...dto, ...this.scope(companyId, branchId) },
      include: { stages: true },
    });
  }

  async updatePipeline(id: string, dto: any, companyId: string) {
    await this.getPipeline(id, companyId);
    return this.prisma.dealPipeline.update({ where: { id }, data: dto, include: { stages: true } });
  }

  async deletePipeline(id: string, companyId: string) {
    await this.getPipeline(id, companyId);
    return this.prisma.dealPipeline.delete({ where: { id } });
  }

  // ── Pipeline Stages ────────────────────────────────────────────────────────

  async createStage(pipelineId: string, dto: any) {
    return this.prisma.pipelineStage.create({ data: { ...dto, pipelineId } });
  }

  async updateStage(id: string, dto: any) {
    return this.prisma.pipelineStage.update({ where: { id }, data: dto });
  }

  async deleteStage(id: string) {
    return this.prisma.pipelineStage.delete({ where: { id } });
  }

  // ── Pipeline Connections ───────────────────────────────────────────────────

  async createConnection(dto: any) {
    return this.prisma.pipelineConnection.create({ data: dto });
  }

  async deleteConnection(id: string) {
    return this.prisma.pipelineConnection.delete({ where: { id } });
  }

  // ── Deal Dashboards ────────────────────────────────────────────────────────

  async getDashboards(companyId: string, userId: string) {
    return this.prisma.dealDashboard.findMany({
      where: { companyId },
      include: {
        roleShares: true,
        userShares: true,
        userPrefs: { where: { userId } },
      },
    });
  }

  async getDashboard(id: string, companyId: string) {
    const d = await this.prisma.dealDashboard.findFirst({
      where: { id, companyId },
      include: { roleShares: true, userShares: true },
    });
    if (!d) throw new NotFoundException('Dashboard not found');
    return d;
  }

  async createDashboard(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.prisma.dealDashboard.create({
      data: { ...dto, userId, ...this.scope(companyId, branchId) },
    });
  }

  async updateDashboard(id: string, dto: any, companyId: string) {
    await this.getDashboard(id, companyId);
    return this.prisma.dealDashboard.update({ where: { id }, data: dto });
  }

  async deleteDashboard(id: string, companyId: string) {
    await this.getDashboard(id, companyId);
    return this.prisma.dealDashboard.delete({ where: { id } });
  }

  async upsertDashboardPref(dashboardId: string, userId: string, dto: any) {
    return this.prisma.dealDashboardUserPref.upsert({
      where: { dashboardId_userId: { dashboardId, userId } },
      create: { ...dto, dashboardId, userId },
      update: dto,
    });
  }
}
