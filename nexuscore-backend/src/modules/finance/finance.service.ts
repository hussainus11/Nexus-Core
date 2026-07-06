import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── Customers ──────────────────────────────────────────────────────────────

  async getCustomers(companyId: string, branchId?: string) {
    return this.prisma.customer.findMany({
      where: this.scope(companyId, branchId),
      orderBy: { name: 'asc' },
    });
  }

  async getCustomer(id: string, companyId: string) {
    const c = await this.prisma.customer.findFirst({ where: { id, companyId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async createCustomer(dto: any, companyId: string, branchId?: string) {
    return this.prisma.customer.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateCustomer(id: string, dto: any, companyId: string) {
    await this.getCustomer(id, companyId);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async deleteCustomer(id: string, companyId: string) {
    await this.getCustomer(id, companyId);
    return this.prisma.customer.delete({ where: { id } });
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  async getOrders(companyId: string, branchId?: string, filters?: any) {
    return this.prisma.order.findMany({
      where: { ...this.scope(companyId, branchId), ...filters },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(id: string, companyId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true,
        returns: { include: { items: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async createOrder(dto: any, companyId: string, branchId?: string) {
    const { items, ...orderData } = dto;
    return this.prisma.order.create({
      data: {
        ...orderData,
        ...this.scope(companyId, branchId),
        items: items ? { create: items } : undefined,
      },
      include: { items: true, customer: true },
    });
  }

  async updateOrder(id: string, dto: any, companyId: string) {
    await this.getOrder(id, companyId);
    const { items, ...orderData } = dto;
    return this.prisma.order.update({
      where: { id },
      data: orderData,
      include: { items: true, customer: true },
    });
  }

  async deleteOrder(id: string, companyId: string) {
    await this.getOrder(id, companyId);
    return this.prisma.order.delete({ where: { id } });
  }

  // ── Order Items ────────────────────────────────────────────────────────────

  async addOrderItem(orderId: string, dto: any) {
    return this.prisma.orderItem.create({ data: { ...dto, orderId } });
  }

  async updateOrderItem(id: string, dto: any) {
    return this.prisma.orderItem.update({ where: { id }, data: dto });
  }

  async deleteOrderItem(id: string) {
    return this.prisma.orderItem.delete({ where: { id } });
  }

  // ── Customer Payments ──────────────────────────────────────────────────────

  async getPayments(companyId: string, branchId?: string, filters?: any) {
    return this.prisma.customerPayment.findMany({
      where: { ...this.scope(companyId, branchId), ...filters },
      include: { customer: true, order: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async createPayment(dto: any, companyId: string, branchId?: string) {
    return this.prisma.customerPayment.create({
      data: { ...dto, ...this.scope(companyId, branchId) },
      include: { customer: true, order: true },
    });
  }

  async updatePayment(id: string, dto: any) {
    return this.prisma.customerPayment.update({ where: { id }, data: dto });
  }

  async deletePayment(id: string) {
    return this.prisma.customerPayment.delete({ where: { id } });
  }

  // ── Suppliers ──────────────────────────────────────────────────────────────

  async getSuppliers(companyId: string, branchId?: string) {
    return this.prisma.supplier.findMany({
      where: this.scope(companyId, branchId),
      orderBy: { name: 'asc' },
    });
  }

  async getSupplier(id: string, companyId: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, companyId } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async createSupplier(dto: any, companyId: string, branchId?: string) {
    return this.prisma.supplier.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateSupplier(id: string, dto: any, companyId: string) {
    await this.getSupplier(id, companyId);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async deleteSupplier(id: string, companyId: string) {
    await this.getSupplier(id, companyId);
    return this.prisma.supplier.delete({ where: { id } });
  }

  // ── Supplier Payments ──────────────────────────────────────────────────────

  async getSupplierPayments(companyId: string, branchId?: string, supplierId?: string) {
    return this.prisma.supplierPayment.findMany({
      where: { ...this.scope(companyId, branchId), ...(supplierId ? { supplierId } : {}) },
      include: { supplier: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async createSupplierPayment(dto: any, companyId: string, branchId?: string) {
    return this.prisma.supplierPayment.create({
      data: { ...dto, ...this.scope(companyId, branchId) },
      include: { supplier: true },
    });
  }

  async updateSupplierPayment(id: string, dto: any) {
    return this.prisma.supplierPayment.update({ where: { id }, data: dto });
  }

  async deleteSupplierPayment(id: string) {
    return this.prisma.supplierPayment.delete({ where: { id } });
  }

  // ── Order Returns ──────────────────────────────────────────────────────────

  async getOrderReturns(companyId: string, branchId?: string, orderId?: string) {
    return this.prisma.orderReturn.findMany({
      where: { ...this.scope(companyId, branchId), ...(orderId ? { orderId } : {}) },
      include: { items: true, order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrderReturn(dto: any, companyId: string, branchId?: string) {
    const { items, ...returnData } = dto;
    return this.prisma.orderReturn.create({
      data: {
        ...returnData,
        ...this.scope(companyId, branchId),
        items: items ? { create: items } : undefined,
      },
      include: { items: true, order: true },
    });
  }

  async updateOrderReturn(id: string, dto: any) {
    return this.prisma.orderReturn.update({ where: { id }, data: dto });
  }

  async deleteOrderReturn(id: string) {
    return this.prisma.orderReturn.delete({ where: { id } });
  }
}
