import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async completenessReport(branchId: string, q?: any) {
    const where: any = { branchId };
    if (q?.entityType) where.entityType = q.entityType;
    if (q?.status) where.status = q.status;
    if (q?.completenessMin || q?.completenessMax) {
      where.completeness = {};
      if (q.completenessMin) where.completeness.gte = parseFloat(q.completenessMin);
      if (q.completenessMax) where.completeness.lte = parseFloat(q.completenessMax);
    }
    if (q?.dateFrom || q?.dateTo) {
      where.createdAt = {};
      if (q.dateFrom) where.createdAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.createdAt.lte = new Date(q.dateTo);
    }
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.docket.findMany({
        where,
        select: {
          id: true,
          docketNumber: true,
          entityType: true,
          entityId: true,
          title: true,
          status: true,
          completeness: true,
          totalItems: true,
          approvedItems: true,
          pendingItems: true,
          missingItems: true,
          createdAt: true,
          template: { select: { id: true, name: true } },
        },
        orderBy: { completeness: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docket.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async missingDocumentsReport(branchId: string, q?: any) {
    const where: any = {
      status: { in: ['missing', 'rejected'] },
      docket: { branchId },
    };
    if (q?.entityType) where.docket = { ...where.docket, entityType: q.entityType };
    if (q?.isRequired !== undefined) where.isRequired = q.isRequired === 'true';
    if (q?.documentTypeCode) where.documentTypeCard = { code: q.documentTypeCode };
    if (q?.overdue === 'true') where.dueDate = { lt: new Date() };

    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.docketItem.findMany({
        where,
        include: {
          docket: {
            select: { id: true, docketNumber: true, entityType: true, entityId: true, title: true },
          },
          documentTypeCard: { select: { id: true, name: true, code: true, category: true } },
        },
        orderBy: [{ isRequired: 'desc' }, { dueDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docketItem.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async approvalStatusReport(branchId: string, q?: any) {
    const where: any = { docketItem: { docket: { branchId } } };
    if (q?.status) where.toStatus = q.status;
    if (q?.documentTypeCode) {
      where.docketItem = {
        ...where.docketItem,
        documentTypeCard: { code: q.documentTypeCode },
      };
    }
    if (q?.dateFrom || q?.dateTo) {
      where.createdAt = {};
      if (q.dateFrom) where.createdAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.createdAt.lte = new Date(q.dateTo);
    }
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.docketItemApproval.findMany({
        where,
        include: {
          docketItem: {
            include: {
              docket: { select: { id: true, docketNumber: true, entityType: true } },
              documentTypeCard: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docketItemApproval.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async versionHistoryReport(branchId: string, q?: any) {
    const where: any = { docketItem: { docket: { branchId } } };
    if (q?.docketId) {
      where.docketItem = { ...where.docketItem, docketId: q.docketId };
    }
    if (q?.documentTypeCode) {
      where.docketItem = {
        ...where.docketItem,
        documentTypeCard: { code: q.documentTypeCode },
      };
    }
    if (q?.uploadedBy) where.uploadedBy = q.uploadedBy;
    if (q?.dateFrom || q?.dateTo) {
      where.uploadedAt = {};
      if (q.dateFrom) where.uploadedAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.uploadedAt.lte = new Date(q.dateTo);
    }
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.docketDocument.findMany({
        where,
        include: {
          docketItem: {
            include: {
              docket: { select: { id: true, docketNumber: true } },
              documentTypeCard: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docketDocument.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async buyerAccessLogReport(branchId: string, q?: any) {
    const where: any = { shareLink: { docket: { branchId } } };
    if (q?.docketId) where.shareLink = { ...where.shareLink, docketId: q.docketId };
    if (q?.sharedWith) {
      where.shareLink = {
        ...where.shareLink,
        sharedWith: { contains: q.sharedWith, mode: 'insensitive' },
      };
    }
    if (q?.action) where.action = q.action;
    if (q?.dateFrom || q?.dateTo) {
      where.accessedAt = {};
      if (q.dateFrom) where.accessedAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.accessedAt.lte = new Date(q.dateTo);
    }
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.shareLinkAccessLog.findMany({
        where,
        include: {
          shareLink: {
            select: {
              id: true,
              title: true,
              sharedWith: true,
              docket: { select: { id: true, docketNumber: true, entityType: true } },
            },
          },
        },
        orderBy: { accessedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shareLinkAccessLog.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async documentExpiryReport(branchId: string, q?: any) {
    const expiresInDays = parseInt(q?.expiresInDays || '30');
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + expiresInDays * 86400000);

    const where: any = {
      docket: { branchId },
      expiryDate: { lte: expiryThreshold, gte: now },
    };
    if (q?.documentTypeCode) where.documentTypeCard = { code: q.documentTypeCode };

    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    const [data, total] = await Promise.all([
      this.prisma.docketItem.findMany({
        where,
        include: {
          docket: {
            select: { id: true, docketNumber: true, entityType: true, entityId: true },
          },
          documentTypeCard: { select: { id: true, name: true, code: true } },
          documents: { where: { isLatest: true }, take: 1 },
        },
        orderBy: { expiryDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.docketItem.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
