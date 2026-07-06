import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFabricTypeDto } from './dto/create-fabric-type.dto';
import { CreateFabricRollDto } from './dto/create-fabric-roll.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FabricService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Fabric Types ─────────────────────────────────────────────────────────────

  async createType(dto: CreateFabricTypeDto) {
    const type = await this.prisma.fabricType.create({ data: dto });
    return { data: type, message: 'Fabric type created' };
  }

  async findAllTypes() {
    const types = await this.prisma.fabricType.findMany({ include: { _count: { select: { rolls: true } } } });
    return { data: types };
  }

  async findOneType(id: string) {
    const type = await this.prisma.fabricType.findUnique({ where: { id }, include: { rolls: true } });
    if (!type) throw new NotFoundException('Fabric type not found');
    return { data: type };
  }

  async updateType(id: string, dto: Partial<CreateFabricTypeDto>) {
    await this.findOneType(id);
    const type = await this.prisma.fabricType.update({ where: { id }, data: dto });
    return { data: type, message: 'Fabric type updated' };
  }

  async removeType(id: string) {
    await this.findOneType(id);
    await this.prisma.fabricType.delete({ where: { id } });
    return { message: 'Fabric type deleted' };
  }

  // ── Fabric Rolls ─────────────────────────────────────────────────────────────

  async createRoll(dto: CreateFabricRollDto) {
    const exists = await this.prisma.fabricRoll.findUnique({ where: { rollNumber: dto.rollNumber } });
    if (exists) throw new ConflictException('Roll number already exists');

    const qrCode = `NC-ROLL-${dto.rollNumber}-${Date.now()}`;
    const roll = await this.prisma.fabricRoll.create({
      data: { ...dto, qrCode },
      include: { fabricType: true },
    });
    return { data: roll, message: 'Fabric roll created' };
  }

  async findAllRolls(fabricTypeId?: string, status?: string) {
    const rolls = await this.prisma.fabricRoll.findMany({
      where: {
        ...(fabricTypeId ? { fabricTypeId } : {}),
        ...(status ? { status } : {}),
      },
      include: { fabricType: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rolls };
  }

  async findAvailableRolls() {
    const rolls = await this.prisma.fabricRoll.findMany({
      where: { status: 'available' },
      include: { fabricType: true },
      orderBy: { availableMeters: 'desc' },
    });
    return { data: rolls };
  }

  async findOneRoll(id: string) {
    const roll = await this.prisma.fabricRoll.findUnique({
      where: { id },
      include: { fabricType: true, orderRolls: { include: { cuttingOrder: true } } },
    });
    if (!roll) throw new NotFoundException('Fabric roll not found');
    return { data: roll };
  }

  async updateRoll(id: string, dto: Partial<CreateFabricRollDto>) {
    await this.findOneRoll(id);
    const roll = await this.prisma.fabricRoll.update({
      where: { id },
      data: dto,
      include: { fabricType: true },
    });
    return { data: roll, message: 'Fabric roll updated' };
  }

  async removeRoll(id: string) {
    await this.findOneRoll(id);
    await this.prisma.fabricRoll.delete({ where: { id } });
    return { message: 'Fabric roll deleted' };
  }

  async getRollQr(id: string) {
    const roll = await this.prisma.fabricRoll.findUnique({
      where: { id },
      select: { id: true, rollNumber: true, qrCode: true },
    });
    if (!roll) throw new NotFoundException('Fabric roll not found');
    return { data: roll };
  }

  async consumeRoll(id: string, metersConsumed: number) {
    const roll = await this.prisma.fabricRoll.findUnique({ where: { id } });
    if (!roll) throw new NotFoundException('Fabric roll not found');

    const newAvailable = Number(roll.availableMeters) - metersConsumed;
    const updatedRoll = await this.prisma.fabricRoll.update({
      where: { id },
      data: {
        availableMeters: newAvailable,
        status: newAvailable <= 0 ? 'consumed' : 'available',
      },
    });
    return { data: updatedRoll, message: `Consumed ${metersConsumed}m from roll` };
  }
}
