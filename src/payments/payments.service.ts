import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  findAll(tenantId: string, orderId?: string) {
    const where: any = { tenantId };
    if (orderId) where.orderId = orderId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async create(tenantId: string, dto: Partial<Payment>) {
    const payment = this.repo.create({ ...dto, tenantId });
    return this.repo.save(payment);
  }

  async updateStatus(id: string, status: string, transactionId?: string) {
    const update: any = { status, updatedAt: new Date() };
    if (status === 'completed') update.paidAt = new Date();
    if (transactionId) update.transactionId = transactionId;
    await this.repo.update(id, update);
    return this.findOne(id);
  }
}
