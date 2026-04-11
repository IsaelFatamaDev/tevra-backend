import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission, CommissionStatus } from './entities/commission.entity';
import { Agent } from '../agents/entities/agent.entity';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectRepository(Commission)
    private readonly repo: Repository<Commission>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
  ) { }

  findAll(tenantId: string, query?: { agentId?: string; status?: string }) {
    const where: any = { tenantId };
    if (query?.agentId) where.agentId = query.agentId;
    if (query?.status) where.status = query.status;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findByAgent(agentId: string) {
    const commissions = await this.repo.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
    });
    const totalEarned = commissions.reduce((s, c) => s + parseFloat(String(c.amount)), 0);
    const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + parseFloat(String(c.amount)), 0);
    const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + parseFloat(String(c.amount)), 0);

    return {
      commissions,
      summary: {
        totalEarned: parseFloat(totalEarned.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        totalPending: parseFloat(totalPending.toFixed(2)),
        count: commissions.length,
      },
    };
  }

  async create(tenantId: string, dto: Partial<Commission>) {
    const commission = this.repo.create({ ...dto, tenantId });
    return this.repo.save(commission);
  }

  async markPaid(id: string) {
    await this.repo.update(id, { status: CommissionStatus.PAID, paidAt: new Date(), updatedAt: new Date() });
    return this.repo.findOne({ where: { id } });
  }

  async findByAgentUserId(userId: string) {
    const agent = await this.agentRepo.findOne({ where: { userId } });
    if (!agent) return { commissions: [], summary: { totalEarned: 0, totalPaid: 0, totalPending: 0, count: 0 } };
    return this.findByAgent(agent.id);
  }
}
