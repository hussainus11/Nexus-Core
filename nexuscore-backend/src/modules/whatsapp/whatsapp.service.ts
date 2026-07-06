import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingService } from '../../messaging/messaging.service';
import { NotificationEvent } from '../../messaging/events/notification.events';
import { SendWhatsappMessageDto } from './dto/send-message.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger('[NexusCore] WhatsappService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
    private readonly config: ConfigService,
  ) {}

  async setCompanyConfig(companyId: string, metaAppId: string, metaAppSecret: string) {
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { metaAppId, metaAppSecret },
    });
    return { data: company, message: 'Meta config saved' };
  }

  async verifyWebhook(mode: string, token: string, challenge: string) {
    const verifyToken = this.config.get<string>('META_VERIFY_TOKEN', 'nexuscore_verify');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    throw new BadRequestException('Webhook verification failed');
  }

  async sendMessage(dto: SendWhatsappMessageDto, sentBy?: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.waAccessToken || !branch.waPhoneNumberId) {
      throw new BadRequestException('Branch WhatsApp is not configured');
    }

    const apiVersion = this.config.get<string>('META_GRAPH_API_VERSION', 'v17.0');
    const url = `https://graph.facebook.com/${apiVersion}/${branch.waPhoneNumberId}/messages`;

    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      to: dto.to,
      type: 'text',
      text: { body: dto.message },
    });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${branch.waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new BadRequestException(`Meta API error: ${JSON.stringify(err)}`);
      }

      const result = await res.json();

      await this.messaging.publish(NotificationEvent.SEND, {
        branchId: dto.branchId,
        to: dto.to,
        message: dto.message,
        sentBy,
        metaResponse: result,
      });

      return { data: result, message: 'WhatsApp message sent' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Failed to send WhatsApp message: ${(err as Error).message}`);
    }
  }
}
