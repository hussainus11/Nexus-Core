import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjects(companyId: string, branchId?: string) {
    return this.prisma.project.findMany({
      where: { companyId, ...(branchId ? { branchId } : {}) },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(id: string, companyId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async createProject(dto: any, companyId: string, branchId?: string) {
    const { memberIds = [], ...projectData } = dto;
    return this.prisma.project.create({
      data: {
        ...projectData,
        companyId,
        ...(branchId ? { branchId } : {}),
        members: memberIds.length
          ? { create: memberIds.map((uid: string) => ({ userId: uid })) }
          : undefined,
      },
      include: { members: true },
    });
  }

  async updateProject(id: string, dto: any, companyId: string) {
    await this.getProject(id, companyId);
    const { memberIds, ...projectData } = dto;
    return this.prisma.project.update({
      where: { id },
      data: projectData,
      include: { members: true },
    });
  }

  async deleteProject(id: string, companyId: string) {
    await this.getProject(id, companyId);
    return this.prisma.project.delete({ where: { id } });
  }

  async addProjectMember(projectId: string, userId: string, role?: string) {
    return this.prisma.projectMember.create({ data: { projectId, userId, role } });
  }

  async removeProjectMember(projectId: string, userId: string) {
    return this.prisma.projectMember.deleteMany({ where: { projectId, userId } });
  }

  async updateProjectMember(projectId: string, userId: string, dto: any) {
    return this.prisma.projectMember.updateMany({ where: { projectId, userId }, data: dto });
  }
}
