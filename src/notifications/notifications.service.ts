import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  findByUser(tenantId: string, userId: string) {
    return this.repo.find({
      where: { tenantId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    return n;
  }

  create(tenantId: string, data: Partial<Notification>) {
    const n = this.repo.create({ ...data, tenantId });
    return this.repo.save(n);
  }

  async markRead(id: string) {
    const n = await this.findOne(id);
    n.isRead = true;
    n.readAt = new Date();
    return this.repo.save(n);
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.repo.update(
      { tenantId, userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(tenantId: string, userId: string) {
    return this.repo.count({ where: { tenantId, userId, isRead: false } });
  }
}
