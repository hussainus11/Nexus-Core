import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  async getCategories(companyId: string, branchId?: string) {
    return this.prisma.tableCategory.findMany({
      where: this.scope(companyId, branchId),
      include: { tables: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: any, companyId: string, branchId?: string) {
    return this.prisma.tableCategory.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateCategory(id: string, dto: any) {
    return this.prisma.tableCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    return this.prisma.tableCategory.delete({ where: { id } });
  }

  async getTables(companyId: string, branchId?: string, categoryId?: string) {
    return this.prisma.restaurantTable.findMany({
      where: { ...this.scope(companyId, branchId), ...(categoryId ? { categoryId } : {}) },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async getTable(id: string, companyId: string) {
    const t = await this.prisma.restaurantTable.findFirst({ where: { id, companyId } });
    if (!t) throw new NotFoundException('Table not found');
    return t;
  }

  async createTable(dto: any, companyId: string, branchId?: string) {
    return this.prisma.restaurantTable.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateTable(id: string, dto: any, companyId: string) {
    await this.getTable(id, companyId);
    return this.prisma.restaurantTable.update({ where: { id }, data: dto });
  }

  async deleteTable(id: string, companyId: string) {
    await this.getTable(id, companyId);
    return this.prisma.restaurantTable.delete({ where: { id } });
  }
}
