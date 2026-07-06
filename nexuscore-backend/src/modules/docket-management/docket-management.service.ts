import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocketManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Document Type Cards ───────────────────────────────────────────────────────

  async listDocumentTypes(branchId: string, q?: any) {
    const where: any = { branchId };
    if (q?.category) where.category = q.category;
    if (q?.isActive !== undefined) where.isActive = q.isActive === 'true';
    if (q?.search) where.name = { contains: q.search, mode: 'insensitive' };
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '50');
    const [data, total] = await Promise.all([
      this.prisma.documentTypeCard.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.documentTypeCard.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async createDocumentType(dto: any, branchId: string) {
    return this.prisma.documentTypeCard.create({ data: { ...dto, branchId } });
  }

  async getDocumentType(id: string) {
    const r = await this.prisma.documentTypeCard.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Document type not found');
    return r;
  }

  async updateDocumentType(id: string, dto: any) {
    await this.getDocumentType(id);
    return this.prisma.documentTypeCard.update({ where: { id }, data: dto });
  }

  async deleteDocumentType(id: string) {
    await this.getDocumentType(id);
    await this.prisma.documentTypeCard.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async toggleDocumentType(id: string) {
    const r = await this.getDocumentType(id);
    return this.prisma.documentTypeCard.update({ where: { id }, data: { isActive: !r.isActive } });
  }

  // ── Docket Templates ──────────────────────────────────────────────────────────

  async listTemplates(branchId: string, q?: any) {
    const where: any = { branchId };
    if (q?.entityType) where.entityType = q.entityType;
    if (q?.isActive !== undefined) where.isActive = q.isActive === 'true';
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '50');
    const [data, total] = await Promise.all([
      this.prisma.docketTemplate.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docketTemplate.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async createTemplate(dto: any, branchId: string, createdBy: string) {
    const { items, ...templateData } = dto;
    return this.prisma.docketTemplate.create({
      data: {
        ...templateData,
        branchId,
        createdBy,
        items: items ? { create: items } : undefined,
      },
      include: {
        items: {
          include: { documentTypeCard: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async getTemplate(id: string) {
    const r = await this.prisma.docketTemplate.findUnique({
      where: { id },
      include: {
        items: {
          include: { documentTypeCard: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!r) throw new NotFoundException('Template not found');
    return r;
  }

  async updateTemplate(id: string, dto: any) {
    await this.getTemplate(id);
    const { items, ...templateData } = dto;
    return this.prisma.docketTemplate.update({ where: { id }, data: templateData });
  }

  async deleteTemplate(id: string) {
    await this.getTemplate(id);
    await this.prisma.docketTemplate.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async addTemplateItem(templateId: string, dto: any) {
    await this.getTemplate(templateId);
    const lastItem = await this.prisma.docketTemplateItem.findFirst({
      where: { templateId },
      orderBy: { sequence: 'desc' },
    });
    const sequence = dto.sequence ?? ((lastItem?.sequence ?? 0) + 1);
    return this.prisma.docketTemplateItem.create({
      data: { ...dto, templateId, sequence },
      include: { documentTypeCard: true },
    });
  }

  async updateTemplateItem(templateId: string, itemId: string, dto: any) {
    const item = await this.prisma.docketTemplateItem.findFirst({
      where: { id: itemId, templateId },
    });
    if (!item) throw new NotFoundException('Template item not found');
    return this.prisma.docketTemplateItem.update({ where: { id: itemId }, data: dto });
  }

  async deleteTemplateItem(templateId: string, itemId: string) {
    const item = await this.prisma.docketTemplateItem.findFirst({
      where: { id: itemId, templateId },
    });
    if (!item) throw new NotFoundException('Template item not found');
    await this.prisma.docketTemplateItem.delete({ where: { id: itemId } });
    return { message: 'Deleted' };
  }

  async duplicateTemplate(id: string, dto: any, branchId: string, createdBy: string) {
    const original = await this.getTemplate(id);
    return this.prisma.docketTemplate.create({
      data: {
        name: dto.name || `${original.name} (Copy)`,
        code: dto.code || `${(original as any).code}-COPY`,
        entityType: (original as any).entityType,
        description: (original as any).description,
        isDefault: false,
        isActive: true,
        branchId,
        createdBy,
        items: {
          create: (original as any).items.map((item: any) => ({
            documentTypeCardId: item.documentTypeCardId,
            isRequired: item.isRequired,
            sequence: item.sequence,
            defaultDueDays: item.defaultDueDays,
            approvalRequired: item.approvalRequired,
            approverRoleId: item.approverRoleId,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: { documentTypeCard: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async setDefaultTemplate(id: string, branchId: string) {
    const template = await this.getTemplate(id);
    await this.prisma.docketTemplate.updateMany({
      where: { branchId, entityType: (template as any).entityType, isDefault: true },
      data: { isDefault: false },
    });
    return this.prisma.docketTemplate.update({ where: { id }, data: { isDefault: true } });
  }

  // ── Approval Workflows ────────────────────────────────────────────────────────

  async listWorkflows(branchId: string, q?: any) {
    const where: any = { branchId };
    if (q?.entityType) where.entityType = q.entityType;
    if (q?.isActive !== undefined) where.isActive = q.isActive === 'true';
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '50');
    const [data, total] = await Promise.all([
      this.prisma.approvalWorkflow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.approvalWorkflow.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async createWorkflow(dto: any, branchId: string) {
    return this.prisma.approvalWorkflow.create({ data: { ...dto, branchId } });
  }

  async getWorkflow(id: string) {
    const r = await this.prisma.approvalWorkflow.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Approval workflow not found');
    return r;
  }

  async updateWorkflow(id: string, dto: any) {
    await this.getWorkflow(id);
    return this.prisma.approvalWorkflow.update({ where: { id }, data: dto });
  }

  async deleteWorkflow(id: string) {
    await this.getWorkflow(id);
    await this.prisma.approvalWorkflow.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
