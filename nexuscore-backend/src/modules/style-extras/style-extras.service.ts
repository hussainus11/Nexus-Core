import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const BOM_LINE_FIELDS = [
  'lineType', 'fabricCode', 'fabricName', 'explanation', 'placement', 'process', 'variant',
  'rowColumn', 'swatchCardId', 'willBeCut', 'mainFabric', 'unit', 'quantity', 'wastePct',
  'dyeWastagePct', 'otherWastagePct', 'unitPrice', 'component', 'dia', 'gauge',
  'finishWidth', 'finishRoute', 'revision',
];

function pickBomLine(l: any) {
  const out: any = {};
  for (const f of BOM_LINE_FIELDS) if (l[f] !== undefined) out[f] = l[f];
  return out;
}

const WASH_CARE_FIELDS = [
  'washing', 'bleaching', 'tumbleDrying', 'naturalDrying', 'ironing', 'chemicalCleaning', 'wetCleaning',
];

function pickWashCare(dto: any) {
  const out: any = {};
  for (const f of WASH_CARE_FIELDS) if (dto[f] !== undefined) out[f] = dto[f];
  return out;
}

@Injectable()
export class StyleExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  private async findStyleCardOrThrow(styleCardId: string) {
    const style = await this.prisma.styleCard.findUnique({ where: { id: styleCardId } });
    if (!style) throw new NotFoundException('Style card not found');
    return style;
  }

  // ── BOM Lines ────────────────────────────────────────────────────────────────

  async getBomLines(styleCardId: string) {
    return this.prisma.styleBomLine.findMany({
      where: { styleCardId },
      include: { swatchCard: { select: { id: true, colorName: true, colorCode: true, pantoneCode: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upsertBomLines(styleCardId: string, lines: any[]) {
    await this.findStyleCardOrThrow(styleCardId);
    await this.prisma.styleBomLine.deleteMany({ where: { styleCardId } });
    if (lines?.length) {
      await this.prisma.styleBomLine.createMany({
        data: lines.map((l, i) => ({ ...pickBomLine(l), sortOrder: i, styleCardId })),
      });
    }
    return this.getBomLines(styleCardId);
  }

  // ── Wash & Care ──────────────────────────────────────────────────────────────

  async getWashCare(styleCardId: string) {
    return this.prisma.styleWashCare.findUnique({ where: { styleCardId } });
  }

  async upsertWashCare(styleCardId: string, dto: any) {
    await this.findStyleCardOrThrow(styleCardId);
    const data = pickWashCare(dto || {});
    return this.prisma.styleWashCare.upsert({
      where: { styleCardId },
      create: { ...data, styleCardId },
      update: data,
    });
  }

  // ── Expense Lines ────────────────────────────────────────────────────────────

  async getExpenseLines(styleCardId: string) {
    return this.prisma.styleExpenseLine.findMany({ where: { styleCardId }, orderBy: { sortOrder: 'asc' } });
  }

  async upsertExpenseLines(styleCardId: string, lines: any[]) {
    await this.findStyleCardOrThrow(styleCardId);
    await this.prisma.styleExpenseLine.deleteMany({ where: { styleCardId } });
    if (lines?.length) {
      await this.prisma.styleExpenseLine.createMany({
        data: lines.map((l, i) => ({
          expenseType: l.expenseType, explanation: l.explanation, quantity: l.quantity ?? 0,
          unitPrice: l.unitPrice ?? 0, forex: l.forex, sortOrder: i, styleCardId,
        })),
      });
    }
    return this.getExpenseLines(styleCardId);
  }
}
