import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingService } from '../../messaging/messaging.service';
import { BpmEvent } from '../../messaging/events/bpm.events';
import { CreateProcessDto, CreateStageDto } from './dto/create-process.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { MoveStageDto } from './dto/move-stage.dto';

@Injectable()
export class BpmService {
  private readonly logger = new Logger('[NexusCore] BpmService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  // ── Processes ────────────────────────────────────────────────────────────────

  async createProcess(dto: CreateProcessDto) {
    const process = await this.prisma.bpmProcess.create({
      data: {
        name: dto.name,
        module: dto.module,
        description: dto.description,
        stages: dto.stages
          ? { create: dto.stages.map((s) => ({ name: s.name, sequence: s.sequence, color: s.color, isTerminal: s.isTerminal })) }
          : undefined,
      },
      include: { stages: { orderBy: { sequence: 'asc' } } },
    });
    return { data: process, message: 'Process created' };
  }

  async findAllProcesses() {
    const processes = await this.prisma.bpmProcess.findMany({
      include: { stages: { orderBy: { sequence: 'asc' } }, _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: processes };
  }

  async findOneProcess(id: string) {
    const process = await this.prisma.bpmProcess.findUnique({
      where: { id },
      include: { stages: { orderBy: { sequence: 'asc' } } },
    });
    if (!process) throw new NotFoundException('BPM process not found');
    return { data: process };
  }

  async updateProcess(id: string, dto: Partial<CreateProcessDto>) {
    await this.findOneProcess(id);
    const process = await this.prisma.bpmProcess.update({
      where: { id },
      data: { name: dto.name, module: dto.module, description: dto.description },
      include: { stages: { orderBy: { sequence: 'asc' } } },
    });
    return { data: process, message: 'Process updated' };
  }

  async removeProcess(id: string) {
    await this.findOneProcess(id);
    await this.prisma.bpmProcess.delete({ where: { id } });
    return { message: 'Process deleted' };
  }

  // ── Stages ───────────────────────────────────────────────────────────────────

  async createStage(processId: string, dto: CreateStageDto) {
    await this.findOneProcess(processId);
    const stage = await this.prisma.bpmStage.create({
      data: { processId, ...dto },
    });
    return { data: stage, message: 'Stage created' };
  }

  async updateStage(processId: string, stageId: string, dto: Partial<CreateStageDto>) {
    const stage = await this.prisma.bpmStage.update({
      where: { id: stageId },
      data: dto,
    });
    return { data: stage, message: 'Stage updated' };
  }

  async removeStage(processId: string, stageId: string) {
    await this.prisma.bpmStage.delete({ where: { id: stageId } });
    return { message: 'Stage deleted' };
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  async findAllTasks(query: QueryTasksDto) {
    const { module, stageId, assignedTo, priority, entityType, search, page = 1, limit = 20 } = query;
    const where: any = {};
    if (stageId) where.stageId = stageId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;
    if (entityType) where.entityType = entityType;
    if (module) where.process = { module };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [tasks, total] = await Promise.all([
      this.prisma.bpmTask.findMany({
        where,
        include: {
          process: { select: { id: true, name: true, module: true } },
          stage: true,
          assignee: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bpmTask.count({ where }),
    ]);

    return { data: tasks, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findOneTask(id: string) {
    const task = await this.prisma.bpmTask.findUnique({
      where: { id },
      include: {
        process: { include: { stages: { orderBy: { sequence: 'asc' } } } },
        stage: true,
        assignee: { select: { id: true, name: true } },
        history: {
          orderBy: { createdAt: 'asc' },
          include: { task: { select: { id: true, title: true } } },
        },
      },
    });
    if (!task) throw new NotFoundException('BPM task not found');
    return { data: task };
  }

  async createTask(data: {
    processId: string;
    stageId: string;
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
    priority?: string;
    assignedTo?: string;
    createdBy?: string;
    dueDate?: Date;
    metadata?: any;
  }) {
    const task = await this.prisma.bpmTask.create({
      data,
      include: { process: true, stage: true },
    });
    await this.messaging.publish(BpmEvent.TASK_CREATED, { taskId: task.id, entityId: data.entityId });
    return { data: task, message: 'Task created' };
  }

  async moveStage(taskId: string, dto: MoveStageDto, changedBy: string) {
    const task = await this.prisma.bpmTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const stage = await this.prisma.bpmStage.findUnique({ where: { id: dto.toStageId } });
    if (!stage) throw new NotFoundException('Target stage not found');

    const updated = await this.prisma.bpmTask.update({
      where: { id: taskId },
      data: {
        stageId: dto.toStageId,
        completedAt: stage.isTerminal ? new Date() : null,
      },
      include: { stage: true, assignee: { select: { id: true, name: true } } },
    });

    await this.prisma.bpmTaskHistory.create({
      data: {
        taskId,
        fromStageId: task.stageId,
        toStageId: dto.toStageId,
        changedBy,
        comment: dto.comment,
      },
    });

    await this.messaging.publish(BpmEvent.TASK_STAGE_MOVED, {
      taskId,
      fromStageId: task.stageId,
      toStageId: dto.toStageId,
      assignedTo: task.assignedTo,
    });

    return { data: updated, message: 'Task moved to new stage' };
  }

  async getTaskHistory(taskId: string) {
    const history = await this.prisma.bpmTaskHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
    return { data: history };
  }

  async assignTask(taskId: string, assignedTo: string) {
    const task = await this.prisma.bpmTask.update({
      where: { id: taskId },
      data: { assignedTo },
      include: { assignee: { select: { id: true, name: true } } },
    });
    await this.messaging.publish(BpmEvent.TASK_ASSIGNED, { taskId, assignedTo });
    return { data: task, message: 'Task assigned' };
  }

  // ── Request Types ─────────────────────────────────────────────────────────────

  async findAllRequestTypes(companyId?: string, branchId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (branchId) where.branchId = branchId;
    return this.prisma.bpmRequestType.findMany({
      where,
      include: { process: { select: { id: true, name: true, module: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequestType(dto: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    prefix?: string;
    entityType?: string;
    customEntityName?: string;
    processId?: string;
    slaDays?: number;
    isActive?: boolean;
    companyId?: string;
    branchId?: string;
  }) {
    return this.prisma.bpmRequestType.create({
      data: dto,
      include: { process: { select: { id: true, name: true, module: true } } },
    });
  }

  async updateRequestType(id: string, dto: Partial<{
    name: string;
    description: string;
    color: string;
    icon: string;
    prefix: string;
    entityType: string;
    customEntityName: string;
    processId: string;
    slaDays: number;
    isActive: boolean;
  }>) {
    return this.prisma.bpmRequestType.update({
      where: { id },
      data: dto,
      include: { process: { select: { id: true, name: true, module: true } } },
    });
  }

  async removeRequestType(id: string) {
    await this.prisma.bpmRequestType.delete({ where: { id } });
    return { message: 'Request type deleted' };
  }

  // ── Seed ─────────────────────────────────────────────────────────────────────

  async seedProcesses() {
    const processes = [
      {
        name: 'Cutting Order Flow',
        module: 'cutting',
        description: 'Lifecycle for all cutting orders',
        stages: [
          { name: 'Draft', sequence: 1, color: '#94a3b8' },
          { name: 'Pending Approval', sequence: 2, color: '#f59e0b' },
          { name: 'Approved', sequence: 3, color: '#3b82f6' },
          { name: 'In Progress', sequence: 4, color: '#8b5cf6' },
          { name: 'Quality Check', sequence: 5, color: '#ec4899' },
          { name: 'Completed', sequence: 6, color: '#22c55e', isTerminal: true },
          { name: 'Cancelled', sequence: 7, color: '#ef4444', isTerminal: true },
        ],
      },
      {
        name: 'Fabric Request Flow',
        module: 'fabric',
        description: 'Fabric procurement lifecycle',
        stages: [
          { name: 'Requested', sequence: 1, color: '#94a3b8' },
          { name: 'Sourcing', sequence: 2, color: '#f59e0b' },
          { name: 'Received', sequence: 3, color: '#3b82f6' },
          { name: 'Quality Check', sequence: 4, color: '#ec4899' },
          { name: 'Available', sequence: 5, color: '#22c55e', isTerminal: true },
        ],
      },
      {
        name: 'WhatsApp Config Flow',
        module: 'whatsapp',
        description: 'WhatsApp Business API setup',
        stages: [
          { name: 'Pending Setup', sequence: 1, color: '#94a3b8' },
          { name: 'Meta Auth', sequence: 2, color: '#f59e0b' },
          { name: 'Verified', sequence: 3, color: '#3b82f6' },
          { name: 'Active', sequence: 4, color: '#22c55e', isTerminal: true },
        ],
      },
    ];

    for (const p of processes) {
      const exists = await this.prisma.bpmProcess.findFirst({ where: { name: p.name } });
      if (!exists) {
        await this.prisma.bpmProcess.create({
          data: {
            name: p.name,
            module: p.module,
            description: p.description,
            stages: { create: p.stages },
          },
        });
        this.logger.log(`Seeded BPM process: ${p.name}`);
      }
    }
  }

  async getCuttingOrderProcess() {
    return this.prisma.bpmProcess.findFirst({
      where: { module: 'cutting' },
      include: { stages: { orderBy: { sequence: 'asc' } } },
    });
  }
}
