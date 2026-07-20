import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosts(companyId: string, branchId?: string, skip = 0, take = 20) {
    return this.prisma.feedPost.findMany({
      where: { companyId, ...(branchId ? { branchId } : {}) },
      include: {
        user: { select: { id: true, name: true, image: true } },
        likes: true,
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getPost(id: string, companyId: string) {
    const post = await this.prisma.feedPost.findFirst({
      where: { id, companyId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        likes: true,
        comments: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async createPost(dto: any, userId: string, companyId: string, branchId?: string) {
    return this.prisma.feedPost.create({
      data: { ...dto, userId, companyId, ...(branchId ? { branchId } : {}) },
      include: {
        user: { select: { id: true, name: true, image: true } },
        likes: true,
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updatePost(id: string, dto: any, companyId: string) {
    await this.getPost(id, companyId);
    return this.prisma.feedPost.update({ where: { id }, data: dto });
  }

  async deletePost(id: string, companyId: string) {
    await this.getPost(id, companyId);
    return this.prisma.feedPost.delete({ where: { id } });
  }

  async toggleLike(postId: string, userId: string) {
    const existing = await this.prisma.feedLike.findFirst({ where: { postId, userId } });
    if (existing) {
      await this.prisma.feedLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.feedLike.create({ data: { postId, userId } });
    return { liked: true };
  }

  async addComment(postId: string, dto: any, userId: string) {
    return this.prisma.feedComment.create({
      data: { ...dto, postId, userId },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }

  async deleteComment(id: string) {
    return this.prisma.feedComment.delete({ where: { id } });
  }
}
