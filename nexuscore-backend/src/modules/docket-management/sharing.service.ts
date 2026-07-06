import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Share Links ───────────────────────────────────────────────────────────────

  async createShareLink(docketId: string, dto: any, sharedBy: string) {
    const docket = await this.prisma.docket.findUnique({ where: { id: docketId } });
    if (!docket) throw new NotFoundException('Docket not found');

    const token = uuidv4();
    const expiresAt = new Date(
      Date.now() + Number(dto.expiresInDays || 30) * 86400000,
    );

    const shareLink = await this.prisma.docketShareLink.create({
      data: {
        docketId,
        token,
        title: dto.title,
        accessType: dto.accessType || 'view',
        sharedWith: dto.sharedWith,
        sharedBy,
        expiresAt,
        isActive: true,
        accessCount: 0,
        allowedItems: dto.allowedItems,
        password: dto.password,
        watermark: dto.watermark,
      },
    });

    return { ...shareLink, shareUrl: `/shared/${token}` };
  }

  async listShareLinks(docketId: string) {
    return this.prisma.docketShareLink.findMany({
      where: { docketId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateShareLink(linkId: string) {
    const link = await this.prisma.docketShareLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Share link not found');
    return this.prisma.docketShareLink.update({ where: { id: linkId }, data: { isActive: false } });
  }

  async updateShareLink(linkId: string, dto: any) {
    const link = await this.prisma.docketShareLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Share link not found');
    const updateData: any = {};
    if (dto.expiresInDays) {
      updateData.expiresAt = new Date(Date.now() + Number(dto.expiresInDays) * 86400000);
    }
    if (dto.accessType) updateData.accessType = dto.accessType;
    return this.prisma.docketShareLink.update({ where: { id: linkId }, data: updateData });
  }

  async getBuyerAccessLog(docketId: string) {
    return this.prisma.shareLinkAccessLog.findMany({
      where: { shareLink: { docketId } },
      include: {
        shareLink: { select: { id: true, title: true, sharedWith: true, token: true } },
      },
      orderBy: { accessedAt: 'desc' },
    });
  }

  // ── External Reviews ──────────────────────────────────────────────────────────

  async createExternalReview(docketId: string, dto: any, createdBy: string) {
    const docket = await this.prisma.docket.findUnique({ where: { id: docketId } });
    if (!docket) throw new NotFoundException('Docket not found');

    const token = uuidv4();
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + Number(dto.expiresInDays) * 86400000)
      : new Date(Date.now() + 7 * 86400000);

    const review = await this.prisma.externalReviewRequest.create({
      data: {
        docketId,
        reviewerEmail: dto.reviewerEmail,
        reviewerName: dto.reviewerName,
        reviewerCompany: dto.reviewerCompany,
        message: dto.message,
        token,
        status: 'pending',
        expiresAt,
        createdBy,
      },
    });

    return { ...review, reviewUrl: `/review/${token}` };
  }

  async listExternalReviews(branchId: string, q?: any) {
    const page = parseInt(q?.page || '1');
    const limit = parseInt(q?.limit || '20');
    // ExternalReviewRequest has no typed Prisma relation to Docket — resolve branch via sub-query
    const branchDockets = await this.prisma.docket.findMany({
      where: { branchId },
      select: { id: true, docketNumber: true, title: true },
    });
    const docketIds = branchDockets.map((d) => d.id);
    const docketMap = Object.fromEntries(branchDockets.map((d) => [d.id, d]));

    const [data, total] = await Promise.all([
      this.prisma.externalReviewRequest.findMany({
        where: { docketId: { in: docketIds } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.externalReviewRequest.count({ where: { docketId: { in: docketIds } } }),
    ]);
    return {
      data: data.map((r) => ({ ...r, docket: docketMap[r.docketId] ?? null })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // ── Public Routes ─────────────────────────────────────────────────────────────

  async publicGetDocket(token: string, ipAddress?: string, userAgent?: string) {
    const shareLink = await this.prisma.docketShareLink.findFirst({
      where: { token, isActive: true },
      include: {
        docket: {
          include: {
            items: {
              where: { status: 'approved' },
              include: {
                documentTypeCard: true,
                documents: { where: { isLatest: true }, take: 1 },
              },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    if (!shareLink) throw new NotFoundException('Share link not found or inactive');

    if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
      throw new UnauthorizedException('Share link has expired');
    }

    await this.prisma.shareLinkAccessLog.create({
      data: {
        shareLinkId: shareLink.id,
        accessedAt: new Date(),
        ipAddress,
        userAgent,
        action: 'view',
      },
    });

    await this.prisma.docketShareLink.update({
      where: { id: shareLink.id },
      data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
    });

    let docketItems = (shareLink.docket as any).items as any[];
    const allowedItems = shareLink.allowedItems as any;
    if (allowedItems && Array.isArray(allowedItems) && allowedItems.length > 0) {
      docketItems = docketItems.filter((item: any) => allowedItems.includes(item.id));
    }

    return {
      docket: { ...(shareLink.docket as any), items: docketItems },
      shareLink: {
        id: shareLink.id,
        title: shareLink.title,
        accessType: shareLink.accessType,
        watermark: shareLink.watermark,
        expiresAt: shareLink.expiresAt,
      },
    };
  }

  async publicVerifyPassword(token: string, password: string) {
    const shareLink = await this.prisma.docketShareLink.findFirst({
      where: { token, isActive: true },
    });
    if (!shareLink) throw new NotFoundException('Share link not found');
    return { valid: shareLink.password === password };
  }

  async publicDownloadDocument(
    token: string,
    docId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const shareLink = await this.prisma.docketShareLink.findFirst({
      where: { token, isActive: true },
    });
    if (!shareLink) throw new NotFoundException('Share link not found or inactive');

    if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
      throw new UnauthorizedException('Share link has expired');
    }

    const doc = await this.prisma.docketDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.shareLinkAccessLog.create({
      data: {
        shareLinkId: shareLink.id,
        accessedAt: new Date(),
        ipAddress,
        userAgent,
        action: 'download',
        documentId: docId,
      },
    });

    const downloadUrl =
      shareLink.watermark && doc.watermarkedUrl ? doc.watermarkedUrl : doc.fileUrl;
    return { downloadUrl };
  }

  async publicGetReview(token: string) {
    // ExternalReviewRequest has no typed Prisma relation — fetch docket separately
    const review = await this.prisma.externalReviewRequest.findFirst({ where: { token } });
    if (!review) throw new NotFoundException('Review request not found');
    if (review.expiresAt && new Date() > new Date(review.expiresAt)) {
      throw new UnauthorizedException('Review link has expired');
    }
    const docket = await this.prisma.docket.findUnique({
      where: { id: review.docketId },
      include: {
        items: {
          where: { status: 'approved' },
          include: {
            documentTypeCard: true,
            documents: { where: { isLatest: true }, take: 1 },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    return { ...review, docket };
  }

  async publicSubmitReviewComment(token: string, dto: any) {
    const review = await this.prisma.externalReviewRequest.findFirst({ where: { token } });
    if (!review) throw new NotFoundException('Review request not found');
    if (review.expiresAt && new Date() > new Date(review.expiresAt)) {
      throw new UnauthorizedException('Review link has expired');
    }

    return this.prisma.externalReviewRequest.update({
      where: { id: review.id },
      data: {
        status: 'reviewed',
        comments: dto.comment,
        reviewedAt: new Date(),
      },
    });
  }
}
