import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlmReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async delayedTasksReport(branchId: string, q?: Record<string, string>) {
    const where: any = {
      branchId,
      plannedEnd: { lt: new Date() },
      status: { notIn: ['completed', 'cancelled'] },
    };
    if (q?.departmentId) where.departmentId = q.departmentId;
    if (q?.assignedTo) where.assignedTo = q.assignedTo;
    if (q?.priority) where.priority = q.priority;

    const tasks = await this.prisma.plmTask.findMany({
      where,
      orderBy: { plannedEnd: 'asc' },
    });

    const withDelay = tasks.map((t) => ({
      ...t,
      delayDays: Math.floor((Date.now() - new Date(t.plannedEnd!).getTime()) / 86400000),
    }));

    const deptCounts: Record<string, number> = {};
    withDelay.forEach((t) => {
      if (t.departmentId) deptCounts[t.departmentId] = (deptCounts[t.departmentId] || 0) + 1;
    });
    const mostDelayedDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const avgDelayDays = withDelay.length
      ? Math.round(withDelay.reduce((s, t) => s + t.delayDays, 0) / withDelay.length)
      : 0;

    return {
      summary: { total: withDelay.length, avgDelayDays, criticalCount: withDelay.filter((t) => t.priority === 'urgent').length, mostDelayedDept },
      data: withDelay,
    };
  }

  async dailyTasksReport(branchId: string, q?: Record<string, string>) {
    const targetDate = q?.date ? new Date(q.date) : new Date();
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const where: any = {
      branchId,
      OR: [
        { plannedEnd: { gte: dayStart, lt: dayEnd } },
        { plannedStart: { gte: dayStart, lt: dayEnd } },
      ],
    };
    if (q?.departmentId) where.departmentId = q.departmentId;
    if (q?.assignedTo) where.assignedTo = q.assignedTo;

    const tasks = await this.prisma.plmTask.findMany({ where, orderBy: { plannedEnd: 'asc' } });
    const dueToday = tasks.filter((t) => t.plannedEnd && new Date(t.plannedEnd) >= dayStart && new Date(t.plannedEnd) < dayEnd).length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const notStarted = tasks.filter((t) => t.status === 'pending').length;

    return {
      summary: { dueToday, completed, inProgress, notStarted },
      data: tasks,
    };
  }

  async cancelledTasksReport(branchId: string, q?: Record<string, string>) {
    const where: any = { branchId, status: 'cancelled' };
    if (q?.taskType) where.taskType = q.taskType;
    if (q?.dateFrom || q?.dateTo) {
      where.updatedAt = {};
      if (q?.dateFrom) where.updatedAt.gte = new Date(q.dateFrom);
      if (q?.dateTo) where.updatedAt.lte = new Date(q.dateTo);
    }
    return this.prisma.plmTask.findMany({ where, orderBy: { updatedAt: 'desc' } });
  }

  async sampleCostReport(branchId: string, q?: Record<string, string>) {
    const where: any = { branchId };
    if (q?.styleCardId) where.styleCardId = q.styleCardId;
    if (q?.season) where.season = q.season;
    if (q?.year) where.year = parseInt(q.year);
    if (q?.sampleTypeId) where.sampleTypeId = q.sampleTypeId;

    const samples = await this.prisma.sampleCard.findMany({
      where,
      include: { sampleType: { select: { id: true, name: true, code: true } } },
      orderBy: { cost: 'desc' },
    });

    const totalCost = samples.reduce((s, sc) => s + Number(sc.cost || 0), 0);
    const mostExpensive = samples[0] || null;

    return {
      summary: {
        totalSamples: samples.length,
        totalCost,
        avgCostPerSample: samples.length ? Math.round(totalCost / samples.length) : 0,
        mostExpensive: mostExpensive ? { id: mostExpensive.id, title: mostExpensive.title, cost: mostExpensive.cost } : null,
      },
      data: samples.map((s) => ({
        sampleId: s.id,
        sampleNumber: s.sampleNumber,
        title: s.title,
        status: s.status,
        sampleType: s.sampleType,
        totalCost: Number(s.cost || 0),
        currency: s.currency,
      })),
    };
  }

  async sampleHistoryReport(branchId: string, q?: Record<string, string>) {
    const where: any = {};
    if (q?.styleCardId) where.styleCard = { styleCardId: q.styleCardId };
    if (q?.status) where.toStatus = q.status;
    if (q?.dateFrom || q?.dateTo) {
      where.createdAt = {};
      if (q?.dateFrom) where.createdAt.gte = new Date(q.dateFrom);
      if (q?.dateTo) where.createdAt.lte = new Date(q.dateTo);
    }

    return this.prisma.sampleCardHistory.findMany({
      where,
      include: { sampleCard: { select: { id: true, sampleNumber: true, title: true, styleCardId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async analyseCubesReport(branchId: string, q?: Record<string, string>) {
    const rowDim = q?.rowDimension || 'style';
    const colDim = q?.colDimension || 'month';
    const measure = q?.measure || 'tasks_count';

    const tasks = await this.prisma.plmTask.findMany({
      where: { branchId },
      include: {
        styleCard: { select: { id: true, title: true, season: true } },
        plmOrder: { select: { id: true, orderNumber: true } },
      },
    });

    const getRowKey = (t: any) => {
      if (rowDim === 'style') return t.styleCard?.title || 'None';
      if (rowDim === 'season') return t.styleCard?.season || 'Unknown';
      if (rowDim === 'department') return t.departmentId || 'None';
      if (rowDim === 'employee') return t.assignedTo || 'Unassigned';
      return 'Unknown';
    };

    const getColKey = (t: any) => {
      if (colDim === 'month') return new Date(t.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (colDim === 'style') return t.styleCard?.title || 'None';
      if (colDim === 'season') return t.styleCard?.season || 'Unknown';
      if (colDim === 'department') return t.departmentId || 'None';
      return 'Unknown';
    };

    const getMeasure = (cells: any[]) => {
      if (measure === 'tasks_count') return cells.length;
      if (measure === 'cost') return cells.reduce((s, t) => s + Number(t.actualHrs || t.estimatedHrs || 0), 0);
      if (measure === 'delay_days') {
        const delayed = cells.filter((t) => t.plannedEnd && new Date() > new Date(t.plannedEnd) && t.status !== 'completed');
        return delayed.reduce((s, t) => s + Math.floor((Date.now() - new Date(t.plannedEnd).getTime()) / 86400000), 0);
      }
      if (measure === 'efficiency_pct') {
        const completed = cells.filter((t) => t.status === 'completed' && t.estimatedHrs && t.actualHrs);
        if (!completed.length) return 0;
        const avg = completed.reduce((s, t) => s + (Number(t.estimatedHrs) / Number(t.actualHrs)) * 100, 0) / completed.length;
        return Math.round(avg);
      }
      return cells.length;
    };

    const rowKeys = [...new Set(tasks.map(getRowKey))].sort();
    const colKeys = [...new Set(tasks.map(getColKey))].sort();
    const matrix = rowKeys.map((row) => {
      const rowData: Record<string, any> = { _row: row };
      colKeys.forEach((col) => {
        const cells = tasks.filter((t) => getRowKey(t) === row && getColKey(t) === col);
        rowData[col] = getMeasure(cells);
      });
      return rowData;
    });

    return { rows: rowKeys, cols: colKeys, matrix, measure };
  }
}
