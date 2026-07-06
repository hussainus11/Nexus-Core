import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private baseWhere(branchId?: string, from?: string, to?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    return where;
  }

  async wastageReport(branchId?: string, from?: string, to?: string) {
    const orders = await this.prisma.cuttingOrder.findMany({
      where: { ...this.baseWhere(branchId, from, to), status: 'completed' },
      select: {
        id: true,
        orderNumber: true,
        totalFabricAllocated: true,
        totalFabricConsumed: true,
        totalWastage: true,
        wastagePercent: true,
        wasteKg: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalWastage = orders.reduce((s, o) => s + Number(o.totalWastage || 0), 0);
    const avgWastagePct =
      orders.length > 0
        ? orders.reduce((s, o) => s + Number(o.wastagePercent || 0), 0) / orders.length
        : 0;

    return {
      data: orders,
      meta: { totalWastage, avgWastagePct: +avgWastagePct.toFixed(2), count: orders.length },
    };
  }

  async productivityReport(branchId?: string, from?: string, to?: string) {
    const batches = await this.prisma.cuttingBatch.findMany({
      where: {
        cuttingOrder: this.baseWhere(branchId, from, to),
        status: 'completed',
      },
      include: {
        cutter: { select: { id: true, name: true } },
        cuttingOrder: { select: { orderNumber: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return { data: batches, meta: { count: batches.length } };
  }

  async consumptionReport(branchId?: string, from?: string, to?: string) {
    const orders = await this.prisma.cuttingOrder.findMany({
      where: { ...this.baseWhere(branchId, from, to) },
      select: {
        id: true,
        orderNumber: true,
        totalFabricAllocated: true,
        totalFabricConsumed: true,
        waterUsageL: true,
        carbonScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalConsumed = orders.reduce((s, o) => s + Number(o.totalFabricConsumed || 0), 0);
    return { data: orders, meta: { totalConsumed: +totalConsumed.toFixed(2), count: orders.length } };
  }

  async defectsReport(branchId?: string, from?: string, to?: string) {
    const batches = await this.prisma.cuttingBatch.findMany({
      where: {
        cuttingOrder: this.baseWhere(branchId, from, to),
        status: 'completed',
        defectPieces: { gt: 0 },
      },
      include: {
        cutter: { select: { id: true, name: true } },
        cuttingOrder: { select: { orderNumber: true } },
      },
      orderBy: { endTime: 'desc' },
    });

    const totalDefects = batches.reduce((s, b) => s + (b.defectPieces || 0), 0);
    const totalActual = batches.reduce((s, b) => s + (b.actualPieces || 0), 0);
    const defectRate = totalActual > 0 ? (totalDefects / totalActual) * 100 : 0;

    return {
      data: batches,
      meta: { totalDefects, defectRate: +defectRate.toFixed(2), count: batches.length },
    };
  }

  async shiftsReport(branchId?: string, from?: string, to?: string) {
    const batches = await this.prisma.cuttingBatch.findMany({
      where: {
        cuttingOrder: this.baseWhere(branchId, from, to),
        shiftId: { not: null },
      },
      select: {
        shiftId: true,
        plannedPieces: true,
        actualPieces: true,
        defectPieces: true,
        startTime: true,
        endTime: true,
      },
    });

    const byShift: Record<string, any> = {};
    for (const b of batches) {
      const sid = b.shiftId!;
      if (!byShift[sid]) byShift[sid] = { shiftId: sid, batches: 0, planned: 0, actual: 0, defects: 0 };
      byShift[sid].batches++;
      byShift[sid].planned += b.plannedPieces;
      byShift[sid].actual += b.actualPieces || 0;
      byShift[sid].defects += b.defectPieces || 0;
    }

    return { data: Object.values(byShift) };
  }

  async sustainabilityReport(branchId?: string, from?: string, to?: string) {
    const orders = await this.prisma.cuttingOrder.findMany({
      where: { ...this.baseWhere(branchId, from, to), status: 'completed' },
      select: {
        id: true,
        orderNumber: true,
        wasteKg: true,
        waterUsageL: true,
        carbonScore: true,
        createdAt: true,
      },
    });

    const totals = orders.reduce(
      (acc, o) => ({
        wasteKg: acc.wasteKg + Number(o.wasteKg || 0),
        waterUsageL: acc.waterUsageL + Number(o.waterUsageL || 0),
        carbonScore: acc.carbonScore + Number(o.carbonScore || 0),
      }),
      { wasteKg: 0, waterUsageL: 0, carbonScore: 0 },
    );

    return {
      data: orders,
      meta: {
        totalWasteKg: +totals.wasteKg.toFixed(3),
        totalWaterUsageL: +totals.waterUsageL.toFixed(2),
        totalCarbonScore: +totals.carbonScore.toFixed(4),
        count: orders.length,
      },
    };
  }
}
