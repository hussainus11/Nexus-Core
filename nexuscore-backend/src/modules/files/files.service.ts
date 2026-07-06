import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── Folders ────────────────────────────────────────────────────────────────

  async getFolders(companyId: string, branchId?: string, parentFolderId?: string | null) {
    return this.prisma.folder.findMany({
      where: {
        ...this.scope(companyId, branchId),
        ...(parentFolderId !== undefined ? { parentFolderId } : {}),
      },
      include: { _count: { select: { subfolders: true, files: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getFolder(id: string, companyId: string) {
    const f = await this.prisma.folder.findFirst({
      where: { id, companyId },
      include: { subfolders: true, files: true },
    });
    if (!f) throw new NotFoundException('Folder not found');
    return f;
  }

  async createFolder(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.prisma.folder.create({ data: { ...dto, userId, ...this.scope(companyId, branchId) } });
  }

  async updateFolder(id: string, dto: any, companyId: string) {
    await this.getFolder(id, companyId);
    return this.prisma.folder.update({ where: { id }, data: dto });
  }

  async deleteFolder(id: string, companyId: string) {
    await this.getFolder(id, companyId);
    return this.prisma.folder.delete({ where: { id } });
  }

  // ── Media Files ────────────────────────────────────────────────────────────

  async getFiles(companyId: string, branchId?: string, folderId?: string, fileType?: string) {
    return this.prisma.mediaFile.findMany({
      where: {
        ...this.scope(companyId, branchId),
        ...(folderId ? { folderId } : {}),
        ...(fileType ? { fileType: fileType as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFile(id: string, companyId: string) {
    const f = await this.prisma.mediaFile.findFirst({ where: { id, companyId } });
    if (!f) throw new NotFoundException('File not found');
    return f;
  }

  async createFile(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.prisma.mediaFile.create({
      data: { ...dto, userId, ...this.scope(companyId, branchId) },
    });
  }

  async updateFile(id: string, dto: any, companyId: string) {
    await this.getFile(id, companyId);
    return this.prisma.mediaFile.update({ where: { id }, data: dto });
  }

  async deleteFile(id: string, companyId: string) {
    await this.getFile(id, companyId);
    return this.prisma.mediaFile.delete({ where: { id } });
  }

  // ── Storage Quota ──────────────────────────────────────────────────────────

  async getStorageQuota(companyId: string) {
    return this.prisma.storageQuota.findFirst({ where: { companyId } });
  }

  async upsertStorageQuota(companyId: string, branchId: string | undefined, dto: any) {
    const existing = await this.prisma.storageQuota.findFirst({ where: { companyId } });
    if (existing) {
      return this.prisma.storageQuota.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.storageQuota.create({ data: { ...dto, companyId, branchId } });
  }

  // ── Rich Documents ─────────────────────────────────────────────────────────

  async getRichDocuments(companyId: string, branchId?: string, filters?: any) {
    return this.prisma.richDocument.findMany({
      where: { ...this.scope(companyId, branchId), ...filters },
      include: { createdBy: { select: { id: true, name: true, image: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getRichDocument(id: string, companyId: string) {
    const doc = await this.prisma.richDocument.findFirst({ where: { id, companyId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async createRichDocument(dto: any, createdById: string, companyId: string, branchId?: string) {
    return this.prisma.richDocument.create({
      data: { ...dto, createdById, ...this.scope(companyId, branchId) },
    });
  }

  async updateRichDocument(id: string, dto: any, companyId: string) {
    await this.getRichDocument(id, companyId);
    return this.prisma.richDocument.update({ where: { id }, data: dto });
  }

  async deleteRichDocument(id: string, companyId: string) {
    await this.getRichDocument(id, companyId);
    return this.prisma.richDocument.delete({ where: { id } });
  }
}
