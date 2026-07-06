import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── Chats ──────────────────────────────────────────────────────────────────

  async getChats(userId: string, companyId: string) {
    return this.prisma.chat.findMany({
      where: {
        companyId,
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getChat(id: string, companyId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id, companyId },
      include: {
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, image: true } } },
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async createChat(dto: any, userId: string, companyId: string, branchId?: string) {
    const { participantIds = [], ...chatData } = dto;
    const allParticipants = [...new Set([userId, ...participantIds])];
    return this.prisma.chat.create({
      data: {
        ...chatData,
        ...this.scope(companyId, branchId),
        participants: {
          create: allParticipants.map((uid) => ({ userId: uid })),
        },
      },
      include: { participants: true },
    });
  }

  async sendMessage(chatId: string, dto: any, senderId: string) {
    return this.prisma.chatMessage.create({
      data: { ...dto, chatId, senderId },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });
  }

  async getChatMessages(chatId: string, skip = 0, take = 50) {
    return this.prisma.chatMessage.findMany({
      where: { chatId },
      include: { sender: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  }

  async deleteMessage(id: string) {
    return this.prisma.chatMessage.delete({ where: { id } });
  }

  // ── Mail / SMTP ─────────────────────────────────────────────────────────────

  async getMails(userId: string, companyId: string, folder?: string) {
    return this.prisma.mail.findMany({
      where: { userId, companyId, ...(folder ? { folder: folder as any } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMail(id: string, userId: string) {
    const mail = await this.prisma.mail.findFirst({ where: { id, userId } });
    if (!mail) throw new NotFoundException('Mail not found');
    return mail;
  }

  async createMail(dto: any, userId: string, companyId: string) {
    return this.prisma.mail.create({ data: { ...dto, userId, companyId } });
  }

  async updateMail(id: string, dto: any) {
    return this.prisma.mail.update({ where: { id }, data: dto });
  }

  async deleteMail(id: string) {
    return this.prisma.mail.delete({ where: { id } });
  }

  async getSmtpSettings(companyId: string) {
    return this.prisma.smtpSetting.findMany({ where: { companyId } });
  }

  async createSmtpSetting(dto: any, companyId: string) {
    return this.prisma.smtpSetting.create({ data: { ...dto, companyId } });
  }

  async updateSmtpSetting(id: string, dto: any) {
    return this.prisma.smtpSetting.update({ where: { id }, data: dto });
  }

  async deleteSmtpSetting(id: string) {
    return this.prisma.smtpSetting.delete({ where: { id } });
  }

  // ── Email Templates ────────────────────────────────────────────────────────

  async getEmailTemplates(companyId: string, branchId?: string, category?: string) {
    return this.prisma.emailTemplate.findMany({
      where: { ...this.scope(companyId, branchId), ...(category ? { category: category as any } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async createEmailTemplate(dto: any, companyId: string, branchId?: string) {
    return this.prisma.emailTemplate.create({ data: { ...dto, ...this.scope(companyId, branchId) } });
  }

  async updateEmailTemplate(id: string, dto: any) {
    return this.prisma.emailTemplate.update({ where: { id }, data: dto });
  }

  async deleteEmailTemplate(id: string) {
    return this.prisma.emailTemplate.delete({ where: { id } });
  }

  // ── Email Notifications ────────────────────────────────────────────────────

  async getEmailNotifications(companyId: string) {
    return this.prisma.emailNotification.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async createEmailNotification(dto: any, companyId: string) {
    return this.prisma.emailNotification.create({ data: { ...dto, companyId } });
  }

  async updateEmailNotification(id: string, dto: any) {
    return this.prisma.emailNotification.update({ where: { id }, data: dto });
  }

  // ── Email Signatures ───────────────────────────────────────────────────────

  async getEmailSignatures(userId: string, companyId: string) {
    return this.prisma.emailSignature.findMany({ where: { userId, companyId } });
  }

  async createEmailSignature(dto: any, userId: string, companyId: string) {
    return this.prisma.emailSignature.create({ data: { ...dto, userId, companyId } });
  }

  async updateEmailSignature(id: string, dto: any) {
    return this.prisma.emailSignature.update({ where: { id }, data: dto });
  }

  async deleteEmailSignature(id: string) {
    return this.prisma.emailSignature.delete({ where: { id } });
  }
}
