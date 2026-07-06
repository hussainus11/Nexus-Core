import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingService } from '../../messaging/messaging.service';
import { NotificationsGateway } from './gateways/notifications.gateway';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger('[NexusCore] NotificationsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    await this.messaging.subscribe('nexuscore.notifications', async (msg) => {
      await this.handleNotificationMessage(msg);
    });
  }

  private async handleNotificationMessage(msg: Record<string, any>) {
    const { userId, userIds, type, title, message, referenceId, referenceType } = msg;
    const targets: string[] = userId ? [userId] : (userIds || []);

    for (const uid of targets) {
      const notification = await this.prisma.notification.create({
        data: { userId: uid, type, title, message, referenceId, referenceType },
      });
      this.gateway.emitToUser(uid, 'notification.new', notification);
    }
  }

  async sendNotification(data: {
    userId?: string;
    userIds?: string[];
    type: string;
    title: string;
    message: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    await this.messaging.publish('nexuscore.notifications', data);
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data: notifications, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { message: 'Notification marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { data: { count } };
  }
}
