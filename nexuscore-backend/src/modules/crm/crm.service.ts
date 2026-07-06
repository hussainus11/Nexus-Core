import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // ── Notes (user-scoped, no companyId on model) ─────────────────────────────

  async getNotes(userId: string, filters?: any) {
    return this.prisma.note.findMany({
      where: { userId, ...filters },
      include: {
        labels: true,
        checklistItems: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getNote(id: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: { labels: true, checklistItems: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async createNote(dto: any, userId: string) {
    return this.prisma.note.create({
      data: { ...dto, userId },
      include: { labels: true, checklistItems: true },
    });
  }

  async updateNote(id: string, dto: any, userId: string) {
    await this.getNote(id, userId);
    return this.prisma.note.update({ where: { id }, data: dto, include: { labels: true, checklistItems: true } });
  }

  async deleteNote(id: string, userId: string) {
    await this.getNote(id, userId);
    return this.prisma.note.delete({ where: { id } });
  }

  // Note Labels (user-scoped)
  async getNoteLabels(userId: string) {
    return this.prisma.noteLabel.findMany({ where: { userId }, orderBy: { title: 'asc' } });
  }
  async createNoteLabel(dto: any, userId: string) {
    return this.prisma.noteLabel.create({ data: { ...dto, userId } });
  }
  async updateNoteLabel(id: string, dto: any) {
    return this.prisma.noteLabel.update({ where: { id }, data: dto });
  }
  async deleteNoteLabel(id: string) {
    return this.prisma.noteLabel.delete({ where: { id } });
  }

  // Note Checklists
  async createNoteChecklist(dto: any, noteId: string) {
    return this.prisma.noteChecklistItem.create({ data: { ...dto, noteId } });
  }
  async updateNoteChecklist(id: string, dto: any) {
    return this.prisma.noteChecklistItem.update({ where: { id }, data: dto });
  }
  async deleteNoteChecklist(id: string) {
    return this.prisma.noteChecklistItem.delete({ where: { id } });
  }

  // ── Todos (user-scoped) ────────────────────────────────────────────────────

  async getTodos(userId: string, filters?: any) {
    return this.prisma.todo.findMany({
      where: { userId, ...filters },
      include: {
        subTasks: true,
        comments: true,
        files: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTodo(id: string, userId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
      include: {
        subTasks: true,
        comments: true,
        files: true,
      },
    });
    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  async createTodo(dto: any, userId: string) {
    return this.prisma.todo.create({
      data: { ...dto, userId },
      include: { subTasks: true, files: true },
    });
  }

  async updateTodo(id: string, dto: any, userId: string) {
    await this.getTodo(id, userId);
    return this.prisma.todo.update({
      where: { id }, data: dto,
      include: { subTasks: true, files: true },
    });
  }

  async deleteTodo(id: string, userId: string) {
    await this.getTodo(id, userId);
    return this.prisma.todo.delete({ where: { id } });
  }

  async createTodoSubtask(todoId: string, dto: any) {
    return this.prisma.todoSubTask.create({ data: { ...dto, todoId } });
  }
  async updateTodoSubtask(id: string, dto: any) {
    return this.prisma.todoSubTask.update({ where: { id }, data: dto });
  }
  async deleteTodoSubtask(id: string) {
    return this.prisma.todoSubTask.delete({ where: { id } });
  }

  async createTodoComment(todoId: string, dto: any) {
    return this.prisma.todoComment.create({ data: { ...dto, todoId } });
  }
  async deleteTodoComment(id: string) {
    return this.prisma.todoComment.delete({ where: { id } });
  }

  // ── Activities (company-scoped, no User relation on model) ─────────────────

  async getActivities(companyId: string, branchId?: string, filters?: any) {
    return this.prisma.activity.findMany({
      where: { ...this.scope(companyId, branchId), ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.prisma.activity.create({
      data: { ...dto, userId, ...this.scope(companyId, branchId) },
    });
  }

  async deleteActivity(id: string) {
    return this.prisma.activity.delete({ where: { id } });
  }

  // ── Comments (company-scoped, no User relation on model) ───────────────────

  async getComments(companyId: string, filters?: any) {
    return this.prisma.comment.findMany({
      where: { companyId, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(dto: any, userId: string, companyId: string) {
    return this.prisma.comment.create({ data: { ...dto, userId, companyId } });
  }

  async updateComment(id: string, dto: any) {
    return this.prisma.comment.update({ where: { id }, data: dto });
  }

  async deleteComment(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }

  // ── Calendar Events ────────────────────────────────────────────────────────

  async getCalendarEvents(companyId: string, branchId?: string) {
    return this.prisma.calendarEvent.findMany({
      where: { ...this.scope(companyId, branchId) },
      orderBy: { start: 'asc' },
    });
  }

  async getCalendarEvent(id: string, companyId: string) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, companyId } });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }

  async createCalendarEvent(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.prisma.calendarEvent.create({
      data: { ...dto, userId, ...this.scope(companyId, branchId) },
    });
  }

  async updateCalendarEvent(id: string, dto: any, companyId: string) {
    await this.getCalendarEvent(id, companyId);
    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async deleteCalendarEvent(id: string, companyId: string) {
    await this.getCalendarEvent(id, companyId);
    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  // ── Reminders ──────────────────────────────────────────────────────────────

  async getReminders(userId: string, companyId: string) {
    return this.prisma.reminder.findMany({
      where: { userId, companyId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async createReminder(dto: any, userId: string, companyId: string) {
    return this.prisma.reminder.create({ data: { ...dto, userId, companyId } });
  }

  async updateReminder(id: string, dto: any) {
    return this.prisma.reminder.update({ where: { id }, data: dto });
  }

  async deleteReminder(id: string) {
    return this.prisma.reminder.delete({ where: { id } });
  }
}
