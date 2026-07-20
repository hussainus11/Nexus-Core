import { Injectable, NotFoundException } from '@nestjs/common';
import { RichDocumentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const createdBySelect = { select: { id: true, name: true, email: true, image: true } };

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string, branchId?: string, type?: string) {
    return this.prisma.richDocument.findMany({
      where: {
        companyId,
        ...(branchId ? { branchId } : {}),
        ...(type ? { type: type as RichDocumentType } : {}),
      },
      include: { createdBy: createdBySelect },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const doc = await this.prisma.richDocument.findFirst({
      where: { id, companyId },
      include: { createdBy: createdBySelect },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private create(
    type: RichDocumentType,
    dto: { name?: string; initialContent?: any },
    userId: string,
    companyId: string,
    branchId?: string,
  ) {
    return this.prisma.richDocument.create({
      data: {
        name: dto.name?.trim() || 'Untitled',
        type,
        content: dto.initialContent !== undefined ? JSON.stringify(dto.initialContent) : null,
        createdById: userId,
        companyId,
        ...(branchId ? { branchId } : {}),
      },
      include: { createdBy: createdBySelect },
    });
  }

  createWord(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.create(RichDocumentType.DOCUMENT, dto, userId, companyId, branchId);
  }

  createExcel(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.create(RichDocumentType.SPREADSHEET, dto, userId, companyId, branchId);
  }

  createPowerPoint(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.create(RichDocumentType.PRESENTATION, dto, userId, companyId, branchId);
  }

  createBoard(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.create(RichDocumentType.BOARD, dto, userId, companyId, branchId);
  }

  async update(
    id: string,
    dto: { name?: string; content?: string; isShared?: boolean; isPublished?: boolean },
    companyId: string,
  ) {
    await this.findOne(id, companyId);
    return this.prisma.richDocument.update({
      where: { id },
      data: dto,
      include: { createdBy: createdBySelect },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.richDocument.delete({ where: { id } });
  }
}
