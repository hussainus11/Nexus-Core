import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { nexuscoreValidationPipe } from './common/pipes/validation.pipe';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaService } from './prisma/prisma.service';
import { BpmService } from './modules/bpm/bpm.service';

async function bootstrap() {
  const logger = new Logger('[NexusCore] Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug'] });

  // ── Global config ───────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(nexuscoreValidationPipe);

  // RolesGuard needs PrismaService so we apply it here rather than via APP_GUARD
  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);
  app.useGlobalGuards(new RolesGuard(reflector, prisma));

  // ── Swagger ─────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexusCore API v1')
    .setDescription('NexusCore Backend — Modular NestJS monolith (fabric · cutting · BPM · notifications)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Seed BPM processes on startup ────────────────────────────────────────────
  try {
    const bpmService = app.get(BpmService);
    await bpmService.seedProcesses();
    logger.log('BPM processes seeded');
  } catch (e) {
    logger.warn(`BPM seed skipped: ${(e as Error).message}`);
  }

  // ── Start ────────────────────────────────────────────────────────────────────
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`NexusCore API running → http://localhost:${port}/api/v1`);
  logger.log(`Swagger docs       → http://localhost:${port}/api/docs`);
}

bootstrap();
