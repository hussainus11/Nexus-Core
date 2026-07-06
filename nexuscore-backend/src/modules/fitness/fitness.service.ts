import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FitnessService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Fitness Activities ─────────────────────────────────────────────────────

  async getActivities(userId: string, companyId: string, filters?: any) {
    return this.prisma.fitnessActivity.findMany({
      where: { userId, companyId, ...filters },
      orderBy: { startTime: 'desc' },
    });
  }

  async createActivity(dto: any, userId: string, companyId: string) {
    return this.prisma.fitnessActivity.create({ data: { ...dto, userId, companyId } });
  }

  async updateActivity(id: string, dto: any) {
    return this.prisma.fitnessActivity.update({ where: { id }, data: dto });
  }

  async deleteActivity(id: string) {
    return this.prisma.fitnessActivity.delete({ where: { id } });
  }

  // ── Nutrition Entries ──────────────────────────────────────────────────────

  async getNutritionEntries(userId: string, companyId: string, date?: string) {
    return this.prisma.nutritionEntry.findMany({
      where: { userId, companyId, ...(date ? { date: new Date(date) } : {}) },
      orderBy: { date: 'desc' },
    });
  }

  async createNutritionEntry(dto: any, userId: string, companyId: string) {
    return this.prisma.nutritionEntry.create({ data: { ...dto, userId, companyId } });
  }

  async updateNutritionEntry(id: string, dto: any) {
    return this.prisma.nutritionEntry.update({ where: { id }, data: dto });
  }

  async deleteNutritionEntry(id: string) {
    return this.prisma.nutritionEntry.delete({ where: { id } });
  }

  // ── Sleep Records ──────────────────────────────────────────────────────────

  async getSleepRecords(userId: string, companyId: string) {
    return this.prisma.sleepRecord.findMany({
      where: { userId, companyId },
      orderBy: { date: 'desc' },
    });
  }

  async createSleepRecord(dto: any, userId: string, companyId: string) {
    return this.prisma.sleepRecord.create({ data: { ...dto, userId, companyId } });
  }

  async updateSleepRecord(id: string, dto: any) {
    return this.prisma.sleepRecord.update({ where: { id }, data: dto });
  }

  async deleteSleepRecord(id: string) {
    return this.prisma.sleepRecord.delete({ where: { id } });
  }
}
