import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.NEXUSCORE_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchange: process.env.NEXUSCORE_RABBITMQ_EXCHANGE || 'nexuscore.events',
  queues: {
    cutting: 'nexuscore.cutting.events',
    bpm: 'nexuscore.bpm.events',
    notifications: 'nexuscore.notifications',
    audit: 'nexuscore.audit.events',
  },
}));
