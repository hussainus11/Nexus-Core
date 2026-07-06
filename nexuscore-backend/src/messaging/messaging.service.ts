import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

// amqplib v0.10+ returns a ChannelModel from connect()
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('[NexusCore] MessagingService');
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private readonly exchange: string;
  private readonly queues: Record<string, string>;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.exchange = configService.get<string>('rabbitmq.exchange', 'nexuscore.events');
    this.queues = configService.get('rabbitmq.queues', {
      cutting: 'nexuscore.cutting.events',
      bpm: 'nexuscore.bpm.events',
      notifications: 'nexuscore.notifications',
      audit: 'nexuscore.audit.events',
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = this.configService.get<string>('rabbitmq.url', 'amqp://guest:guest@localhost:5672');

      // amqplib v0.10+: connect() returns a ChannelModel that wraps the connection
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      for (const queue of Object.values(this.queues)) {
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.bindQueue(queue, this.exchange, queue);
      }

      this.isConnected = true;
      this.logger.log('RabbitMQ connected');

      // ChannelModel exposes connection events directly
      (this.connection as any).on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error', err.message);
        this.isConnected = false;
      });

      (this.connection as any).on('close', () => {
        this.logger.warn('RabbitMQ connection closed, reconnecting in 5s...');
        this.isConnected = false;
        this.connection = null;
        this.channel = null;
        setTimeout(() => this.connect(), 5000);
      });
    } catch (err) {
      this.logger.warn(
        `RabbitMQ unavailable — running without messaging. ${(err as Error).message}`,
      );
      this.isConnected = false;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        // ChannelModel has close() in v0.10+
        await (this.connection as any).close();
        this.connection = null;
      }
    } catch {
      // ignore on shutdown
    }
  }

  async publish(routingKey: string, payload: Record<string, any>): Promise<void> {
    if (!this.isConnected || !this.channel) {
      this.logger.debug(`Messaging offline — dropped event: ${routingKey}`);
      return;
    }
    try {
      const content = Buffer.from(
        JSON.stringify({ ...payload, routingKey, timestamp: new Date().toISOString() }),
      );
      this.channel.publish(this.exchange, routingKey, content, {
        persistent: true,
        contentType: 'application/json',
      });
      this.logger.debug(`Published: ${routingKey}`);
    } catch (err) {
      this.logger.error(`Failed to publish event ${routingKey}`, (err as Error).message);
    }
  }

  async subscribe(
    queue: string,
    handler: (msg: Record<string, any>) => Promise<void>,
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn(`Cannot subscribe to ${queue}: messaging offline`);
      return;
    }
    const ch = this.channel;
    ch.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload);
        ch.ack(msg);
      } catch (err) {
        this.logger.error(`Handler error on queue ${queue}`, (err as Error).message);
        ch.nack(msg, false, false);
      }
    });
  }
}
