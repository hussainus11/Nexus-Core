import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── Product Categories ─────────────────────────────────────────────────────

  async getCategories(companyId: string, branchId?: string) {
    return this.prisma.productCategory.findMany({
      where: this.scope(companyId, branchId),
      include: { subCategories: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: any, companyId: string, branchId?: string) {
    return this.prisma.productCategory.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateCategory(id: string, dto: any) {
    return this.prisma.productCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    return this.prisma.productCategory.delete({ where: { id } });
  }

  // ── Product Subcategories ──────────────────────────────────────────────────

  async getSubcategories(companyId: string, branchId?: string, categoryId?: string) {
    return this.prisma.productSubCategory.findMany({
      where: { ...this.scope(companyId, branchId), ...(categoryId ? { categoryId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async createSubcategory(dto: any, companyId: string, branchId?: string) {
    return this.prisma.productSubCategory.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateSubcategory(id: string, dto: any) {
    return this.prisma.productSubCategory.update({ where: { id }, data: dto });
  }

  async deleteSubcategory(id: string) {
    return this.prisma.productSubCategory.delete({ where: { id } });
  }

  // ── Products ───────────────────────────────────────────────────────────────

  async getProducts(companyId: string, branchId?: string, filters?: any) {
    return this.prisma.product.findMany({
      where: { ...this.scope(companyId, branchId), ...filters },
      orderBy: { name: 'asc' },
    });
  }

  async getProduct(id: string, companyId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: any, companyId: string, branchId?: string) {
    return this.prisma.product.create({
      data: { ...dto, ...this.scope(companyId, branchId) },
    });
  }

  async updateProduct(id: string, dto: any, companyId: string) {
    await this.getProduct(id, companyId);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async deleteProduct(id: string, companyId: string) {
    await this.getProduct(id, companyId);
    return this.prisma.product.delete({ where: { id } });
  }
}
