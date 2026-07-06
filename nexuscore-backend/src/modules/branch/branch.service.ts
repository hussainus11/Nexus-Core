import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const branch = await this.prisma.branch.create({ data: dto });
    return { data: branch, message: 'Branch created' };
  }

  async findAll(companyId?: string) {
    const branches = await this.prisma.branch.findMany({
      where: companyId ? { companyId } : {},
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: branches };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { company: true, users: { select: { id: true, name: true, email: true } } },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return { data: branch };
  }

  async update(id: string, dto: Partial<CreateBranchDto>) {
    await this.findOne(id);
    const branch = await this.prisma.branch.update({ where: { id }, data: dto });
    return { data: branch, message: 'Branch updated' };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.branch.delete({ where: { id } });
    return { message: 'Branch deleted' };
  }

  async getWhatsappStatus(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: { id: true, name: true, waPhoneNumberId: true, waVerified: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return { data: branch };
  }
}
