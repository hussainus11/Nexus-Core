import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLoginHistory(userId: string, companyId: string, limit = 50) {
    return this.prisma.loginHistory.findMany({
      where: { userId, companyId },
      orderBy: { loginAt: 'desc' },
      take: limit,
    });
  }

  async getCompanyLoginHistory(companyId: string, limit = 200) {
    return this.prisma.loginHistory.findMany({
      where: { companyId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { loginAt: 'desc' },
      take: limit,
    });
  }

  async createLoginHistory(dto: any, userId: string, companyId: string) {
    return this.prisma.loginHistory.create({ data: { ...dto, userId, companyId } });
  }

  async getExceptionLogs(companyId: string, limit = 100) {
    return this.prisma.exceptionLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createExceptionLog(dto: any, companyId: string) {
    return this.prisma.exceptionLog.create({ data: { ...dto, companyId } });
  }

  async deleteExceptionLog(id: string) {
    return this.prisma.exceptionLog.delete({ where: { id } });
  }

  async clearExceptionLogs(companyId: string) {
    return this.prisma.exceptionLog.deleteMany({ where: { companyId } });
  }
}
