import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingService } from '../../messaging/messaging.service';

@Injectable()
export class DocketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  private async nextNumber(prefix: string, model: string, field: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await (this.prisma as any)[model].findFirst({
      where: { [field]: { startsWith: `${prefix}-${year}-` } },
      orderBy: { [field]: 'desc' },
      select: { [field]: true },
    });
    const seq = last ? parseInt(last[field].split('-').pop()!) + 1 : 1;
    return `${prefix}-${year}-${String(seq).padStart(3, '0')}`;
  }

  async recalculateDocket(docketId: string): Promise<void> {
    const items = await this.prisma.docketItem.findMany({ where: { docketId } });
    const requiredItems = items.filter((i) => i.isRequired);
    const totalRequired = requiredItems.length;
    const approvedRequired = requiredItems.filter((i) => i.status === 'approved').length;

    const totalItems = items.length;
    const approvedItems = items.filter((i) => i.status === 'approved').length;
    const pendingItems = items.filter((i) => ['uploaded', 'in_review'].includes(i.status)).length;
    const missingItems = items.filter((i) => ['missing', 'rejected'].includes(i.status)).length;

    const completeness = totalRequired === 0 ? 100 : (approvedRequired / totalRequired) * 100;

    const docket = await this.prisma.docket.findUnique({ where: { id: docketId } });
    if (!docket) return;

    let status = docket.status;
    if (!['approved', 'locked'].includes(status)) {
      if (totalRequired === 0 || approvedRequired === totalRequired) {
        status = 'complete';
      } else if (requiredItems.some((i) => ['missing', 'rejected'].includes(i.status))) {
        status = 'incomplete';
      } else {
        status = 'in_progress';
      }
    }

    await this.prisma.docket.update({
      where: { id: docketId },
      data: { completeness, totalItems, approvedItems, pendingItems, missingItems, status },
    });
  }

  // ── Dockets ───────────────────────────────────────────────────────────────────

  async listDockets(branchId: string, q?: any) {
    const where: any = { branchId };
    if (q?.entityType) where.entityType = q.entityType;
    if (q?.status) where.status = q.status;
    if (q?.search) where.title = { contains: q.search, mode: 'insensitive' };
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.docket.findMany({
        where,
        include: {
          template: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docket.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getDocket(id: string) {
    const r = await this.prisma.docket.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            documentTypeCard: true,
            documents: { where: { isLatest: true }, take: 1 },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!r) throw new NotFoundException('Docket not found');
    return r;
  }

  async createDocket(dto: any, branchId: string, createdBy: string) {
    const { entityType, entityId, templateId, title, ...rest } = dto;
    const docketNumber = await this.nextNumber('DCK', 'docket', 'docketNumber');

    let resolvedTemplateId: string | undefined = templateId;
    if (!resolvedTemplateId) {
      const defaultTemplate = await this.prisma.docketTemplate.findFirst({
        where: { branchId, entityType, isDefault: true, isActive: true },
      });
      if (defaultTemplate) resolvedTemplateId = defaultTemplate.id;
    }

    let templateItems: any[] = [];
    if (resolvedTemplateId) {
      templateItems = await this.prisma.docketTemplateItem.findMany({
        where: { templateId: resolvedTemplateId },
        include: { documentTypeCard: true },
        orderBy: { sequence: 'asc' },
      });
    }

    const now = Date.now();
    const docketItemsData = templateItems.map((ti: any) => {
      const dueDate = ti.defaultDueDays ? new Date(now + ti.defaultDueDays * 86400000) : undefined;
      const expiryDate =
        ti.documentTypeCard?.expiryDays
          ? new Date(now + ti.documentTypeCard.expiryDays * 86400000)
          : undefined;
      return {
        documentTypeCardId: ti.documentTypeCardId,
        title: ti.documentTypeCard?.name || 'Document',
        isRequired: ti.isRequired,
        sequence: ti.sequence,
        status: 'missing',
        notes: ti.notes,
        dueDate,
        expiryDate,
      };
    });

    const docket = await this.prisma.docket.create({
      data: {
        docketNumber,
        entityType,
        entityId,
        templateId: resolvedTemplateId,
        title: title || `${entityType} Docket`,
        status: 'incomplete',
        completeness: 0,
        totalItems: docketItemsData.length,
        approvedItems: 0,
        pendingItems: 0,
        missingItems: docketItemsData.length,
        branchId,
        createdBy,
        items: { create: docketItemsData },
      },
      include: {
        items: {
          include: { documentTypeCard: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    await this.prisma.docketAuditLog.create({
      data: {
        docketId: docket.id,
        action: 'created',
        entityRef: docketNumber,
        changedBy: createdBy,
        newValues: { entityType, entityId, templateId: resolvedTemplateId },
      },
    });

    return docket;
  }

  async getDocketByEntity(entityType: string, entityId: string) {
    const r = await this.prisma.docket.findFirst({
      where: { entityType, entityId },
      include: {
        template: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            documentTypeCard: true,
            documents: { where: { isLatest: true }, take: 1 },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!r) throw new NotFoundException('Docket not found for this entity');
    return r;
  }

  async updateDocketStatus(id: string, status: string, notes: string, changedBy: string) {
    const docket = await this.getDocket(id);
    const items = await this.prisma.docketItem.findMany({ where: { docketId: id } });
    const requiredItems = items.filter((i) => i.isRequired);

    if (status === 'complete') {
      const allApproved = requiredItems.every((i) => i.status === 'approved');
      if (!allApproved) {
        throw new BadRequestException(
          'Cannot set status to complete: all required items must be approved',
        );
      }
    }

    if (status === 'locked') {
      const hasBlockers = requiredItems.some((i) =>
        ['missing', 'rejected', 'in_review'].includes(i.status),
      );
      if (hasBlockers) {
        throw new BadRequestException(
          'Cannot lock docket: required items have missing, rejected, or in-review documents',
        );
      }
    }

    const updated = await this.prisma.docket.update({
      where: { id },
      data: {
        status,
        lockedAt: status === 'locked' ? new Date() : undefined,
        lockedBy: status === 'locked' ? changedBy : undefined,
        approvedAt: status === 'approved' ? new Date() : undefined,
        approvedBy: status === 'approved' ? changedBy : undefined,
      },
    });

    await this.prisma.docketAuditLog.create({
      data: {
        docketId: id,
        action: 'status_changed',
        entityRef: docket.docketNumber,
        changedBy,
        oldValues: { status: docket.status },
        newValues: { status, notes },
      },
    });

    return updated;
  }

  async recalculateDocketPublic(id: string) {
    await this.getDocket(id);
    await this.recalculateDocket(id);
    return this.getDocket(id);
  }

  async deleteDocket(id: string) {
    const docket = await this.getDocket(id);
    if (docket.status !== 'incomplete') {
      throw new BadRequestException('Can only delete dockets with status: incomplete');
    }
    await this.prisma.docket.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Docket Items ──────────────────────────────────────────────────────────────

  async getDocketItems(docketId: string) {
    const items = await this.prisma.docketItem.findMany({
      where: { docketId },
      include: {
        documentTypeCard: true,
        documents: { where: { isLatest: true }, take: 1 },
      },
      orderBy: { sequence: 'asc' },
    });

    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      const cat = (item.documentTypeCard as any)?.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    return Object.entries(grouped).map(([category, categoryItems]) => ({
      category,
      items: categoryItems,
    }));
  }

  async addDocketItem(docketId: string, dto: any) {
    await this.getDocket(docketId);
    const lastItem = await this.prisma.docketItem.findFirst({
      where: { docketId },
      orderBy: { sequence: 'desc' },
    });
    const sequence = (lastItem?.sequence ?? 0) + 1;
    const item = await this.prisma.docketItem.create({
      data: { ...dto, docketId, sequence, status: 'missing' },
      include: { documentTypeCard: true },
    });
    await this.recalculateDocket(docketId);
    return item;
  }

  async getDocketItem(id: string) {
    const r = await this.prisma.docketItem.findUnique({
      where: { id },
      include: {
        documentTypeCard: true,
        documents: { orderBy: { uploadedAt: 'desc' } },
        approvalHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!r) throw new NotFoundException('Docket item not found');
    return r;
  }

  async updateDocketItem(id: string, dto: any) {
    await this.getDocketItem(id);
    return this.prisma.docketItem.update({ where: { id }, data: dto });
  }

  async deleteDocketItem(id: string) {
    const item = await this.getDocketItem(id);
    if (item.status !== 'missing') {
      throw new BadRequestException('Can only delete items with status: missing');
    }
    await this.prisma.docketItem.delete({ where: { id } });
    await this.recalculateDocket(item.docketId);
    return { message: 'Deleted' };
  }

  async getDocketItemHistory(id: string) {
    await this.getDocketItem(id);
    return this.prisma.docketItemApproval.findMany({
      where: { docketItemId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveItem(id: string, dto: any, approvedBy: string) {
    const item = await this.getDocketItem(id);
    const fromStatus = item.status;

    const updated = await this.prisma.docketItem.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await this.prisma.docketItemApproval.create({
      data: {
        docketItemId: id,
        action: 'approved',
        actionBy: approvedBy,
        fromStatus,
        toStatus: 'approved',
        comments: dto.comments,
        documentVersion: dto.documentVersion,
      },
    });

    const latestDoc = await this.prisma.docketDocument.findFirst({
      where: { docketItemId: id, isLatest: true },
    });

    if (latestDoc) {
      await this.messaging.publish('nexuscore.notifications', {
        type: 'docket_item_approved',
        title: 'Document Approved',
        message: `Your document "${item.title}" has been approved`,
        referenceId: id,
        referenceType: 'docket_item',
        userId: latestDoc.uploadedBy,
      });
    }

    await this.recalculateDocket(item.docketId);

    await this.prisma.docketAuditLog.create({
      data: {
        docketId: item.docketId,
        action: 'item_approved',
        entityRef: id,
        changedBy: approvedBy,
        oldValues: { status: fromStatus },
        newValues: { status: 'approved', comments: dto.comments },
      },
    });

    return updated;
  }

  async rejectItem(id: string, dto: any, rejectedBy: string) {
    const item = await this.getDocketItem(id);
    const fromStatus = item.status;

    const updated = await this.prisma.docketItem.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    await this.prisma.docketItemApproval.create({
      data: {
        docketItemId: id,
        action: 'rejected',
        actionBy: rejectedBy,
        fromStatus,
        toStatus: 'rejected',
        comments: dto.comments,
        documentVersion: dto.documentVersion,
      },
    });

    const latestDoc = await this.prisma.docketDocument.findFirst({
      where: { docketItemId: id, isLatest: true },
    });

    if (latestDoc) {
      await this.messaging.publish('nexuscore.notifications', {
        type: 'docket_item_rejected',
        title: 'Document Rejected',
        message: `Your document "${item.title}" has been rejected: ${dto.reason}`,
        referenceId: id,
        referenceType: 'docket_item',
        userId: latestDoc.uploadedBy,
      });
    }

    await this.recalculateDocket(item.docketId);

    return updated;
  }

  async requestRevision(id: string, dto: any, actionBy: string) {
    const item = await this.getDocketItem(id);
    const fromStatus = item.status;

    const updated = await this.prisma.docketItem.update({
      where: { id },
      data: { status: 'uploaded' },
    });

    await this.prisma.docketItemApproval.create({
      data: {
        docketItemId: id,
        action: 'revision_requested',
        actionBy,
        fromStatus,
        toStatus: 'uploaded',
        comments: dto.comments,
      },
    });

    return updated;
  }

  // ── Docket Documents ──────────────────────────────────────────────────────────

  async uploadDocument(itemId: string, dto: any, uploadedBy: string) {
    const item = await this.getDocketItem(itemId);
    const dtc = item.documentTypeCard as any;

    if (dtc?.allowedFormats && Array.isArray(dtc.allowedFormats) && dtc.allowedFormats.length > 0) {
      const ext = dto.fileName?.split('.').pop()?.toLowerCase();
      if (ext && !dtc.allowedFormats.includes(ext)) {
        throw new BadRequestException(
          `File type .${ext} is not allowed. Allowed formats: ${dtc.allowedFormats.join(', ')}`,
        );
      }
    }

    if (dtc?.maxSizeMb && Number(dto.fileSizeMb) > Number(dtc.maxSizeMb)) {
      throw new BadRequestException(
        `File size ${dto.fileSizeMb}MB exceeds maximum allowed ${dtc.maxSizeMb}MB`,
      );
    }

    const existingDocs = await this.prisma.docketDocument.findMany({
      where: { docketItemId: itemId },
    });
    const versionNum = existingDocs.length + 1;
    const version = `${versionNum}.0`;

    const documentNumber = await this.nextNumber('DDOC', 'docketDocument', 'documentNumber');

    if (existingDocs.length > 0) {
      await this.prisma.docketDocument.updateMany({
        where: { docketItemId: itemId, isLatest: true },
        data: { isLatest: false },
      });
    }

    const requiresApproval = dtc?.requiresApproval ?? true;

    const doc = await this.prisma.docketDocument.create({
      data: {
        documentNumber,
        docketItemId: itemId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSizeMb: dto.fileSizeMb,
        version,
        versionNotes: dto.versionNotes,
        isLatest: true,
        uploadedBy,
        uploadedAt: new Date(),
      },
    });

    const itemUpdateData: any = { currentVersion: version };

    if (!requiresApproval) {
      itemUpdateData.status = 'approved';
      itemUpdateData.approvedBy = uploadedBy;
      itemUpdateData.approvedAt = new Date();
    } else if (['missing', 'rejected'].includes(item.status)) {
      itemUpdateData.status = 'uploaded';
    }

    await this.prisma.docketItem.update({ where: { id: itemId }, data: itemUpdateData });

    await this.prisma.docketAuditLog.create({
      data: {
        docketId: item.docketId,
        action: 'document_uploaded',
        entityRef: documentNumber,
        changedBy: uploadedBy,
        newValues: { fileName: dto.fileName, version, itemId },
      },
    });

    await this.recalculateDocket(item.docketId);

    return doc;
  }

  async getItemDocuments(itemId: string) {
    await this.getDocketItem(itemId);
    return this.prisma.docketDocument.findMany({
      where: { docketItemId: itemId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getDocument(id: string) {
    const r = await this.prisma.docketDocument.findUnique({
      where: { id },
      include: { docketItem: { select: { id: true, docketId: true } } },
    });
    if (!r) throw new NotFoundException('Document not found');
    return r;
  }

  async deleteDocument(id: string) {
    const doc = await this.getDocument(id);
    if (!doc.isLatest) {
      throw new BadRequestException('Can only delete the latest version of a document');
    }

    const docketItemId = doc.docketItemId;
    const docketId = (doc.docketItem as any).docketId;

    await this.prisma.docketDocument.delete({ where: { id } });

    const prevDoc = await this.prisma.docketDocument.findFirst({
      where: { docketItemId },
      orderBy: { uploadedAt: 'desc' },
    });

    if (prevDoc) {
      await this.prisma.docketDocument.update({
        where: { id: prevDoc.id },
        data: { isLatest: true },
      });
      await this.prisma.docketItem.update({
        where: { id: docketItemId },
        data: { currentVersion: prevDoc.version },
      });
    } else {
      await this.prisma.docketItem.update({
        where: { id: docketItemId },
        data: { status: 'missing', currentVersion: null },
      });
    }

    await this.recalculateDocket(docketId);

    return { message: 'Deleted' };
  }

  async downloadDocument(id: string, userId: string) {
    const doc = await this.getDocument(id);
    const docketId = (doc.docketItem as any).docketId;

    await this.prisma.docketAuditLog.create({
      data: {
        docketId,
        action: 'document_downloaded',
        entityRef: id,
        changedBy: userId,
        newValues: { documentId: id, fileName: doc.fileName },
      },
    });

    return { downloadUrl: doc.fileUrl };
  }
}
