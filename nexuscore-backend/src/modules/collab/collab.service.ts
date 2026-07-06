import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollabService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Collabs ────────────────────────────────────────────────────────────────

  async getCollabs(userId: string, companyId: string) {
    return this.prisma.collab.findMany({
      where: {
        companyId,
        OR: [{ createdById: userId }, { members: { some: { userId } } }],
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCollab(id: string, companyId: string) {
    const c = await this.prisma.collab.findFirst({
      where: { id, companyId },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        invitations: true,
      },
    });
    if (!c) throw new NotFoundException('Collab not found');
    return c;
  }

  async createCollab(dto: any, createdById: string, companyId: string) {
    return this.prisma.collab.create({
      data: {
        ...dto,
        createdById,
        companyId,
        members: { create: [{ userId: createdById, role: 'ADMIN' }] },
      },
      include: { members: true },
    });
  }

  async updateCollab(id: string, dto: any, companyId: string) {
    await this.getCollab(id, companyId);
    return this.prisma.collab.update({ where: { id }, data: dto });
  }

  async deleteCollab(id: string, companyId: string) {
    await this.getCollab(id, companyId);
    return this.prisma.collab.delete({ where: { id } });
  }

  async addCollabMember(collabId: string, dto: any) {
    return this.prisma.collabMember.create({ data: { ...dto, collabId } });
  }

  async removeCollabMember(collabId: string, userId: string) {
    return this.prisma.collabMember.deleteMany({ where: { collabId, userId } });
  }

  async createCollabInvitation(collabId: string, dto: any, invitedById: string) {
    return this.prisma.collabInvitation.create({ data: { ...dto, collabId, invitedById } });
  }

  async updateCollabInvitation(id: string, dto: any) {
    return this.prisma.collabInvitation.update({ where: { id }, data: dto });
  }

  // ── Work Groups ────────────────────────────────────────────────────────────

  async getWorkGroups(companyId: string, branchId?: string) {
    return this.prisma.workGroup.findMany({
      where: { companyId, ...(branchId ? { branchId } : {}) },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkGroup(id: string, companyId: string) {
    const wg = await this.prisma.workGroup.findFirst({
      where: { id, companyId },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
    if (!wg) throw new NotFoundException('Work group not found');
    return wg;
  }

  async createWorkGroup(dto: any, companyId: string, branchId?: string) {
    return this.prisma.workGroup.create({
      data: { ...dto, companyId, ...(branchId ? { branchId } : {}) },
    });
  }

  async updateWorkGroup(id: string, dto: any, companyId: string) {
    await this.getWorkGroup(id, companyId);
    return this.prisma.workGroup.update({ where: { id }, data: dto });
  }

  async deleteWorkGroup(id: string, companyId: string) {
    await this.getWorkGroup(id, companyId);
    return this.prisma.workGroup.delete({ where: { id } });
  }

  async addWorkGroupMember(workGroupId: string, dto: any) {
    return this.prisma.workGroupMember.create({ data: { ...dto, workGroupId } });
  }

  async removeWorkGroupMember(workGroupId: string, userId: string) {
    return this.prisma.workGroupMember.deleteMany({ where: { workGroupId, userId } });
  }

  // ── User Connections ───────────────────────────────────────────────────────

  async getConnections(userId: string) {
    return this.prisma.userConnection.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: { select: { id: true, name: true, image: true } },
        user2: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async sendConnectionRequest(user1Id: string, user2Id: string) {
    return this.prisma.userConnection.create({ data: { user1Id, user2Id } });
  }

  async updateConnection(id: string, dto: any) {
    return this.prisma.userConnection.update({ where: { id }, data: dto });
  }

  async deleteConnection(id: string) {
    return this.prisma.userConnection.delete({ where: { id } });
  }
}
