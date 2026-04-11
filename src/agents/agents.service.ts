import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentStatus } from './entities/agent.entity';
import { AgentApplication, ApplicationStatus } from './entities/agent-application.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    @InjectRepository(AgentApplication)
    private readonly applicationRepo: Repository<AgentApplication>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async findAll(tenantId: string, query?: { city?: string; category?: string; status?: string }) {
    const qb = this.agentRepo.createQueryBuilder('agent')
      .leftJoinAndSelect('agent.user', 'user')
      .where('agent.tenantId = :tenantId', { tenantId });

    if (query?.city) {
      qb.andWhere(':city = ANY(agent.coverageAreas)', { city: query.city });
    }
    if (query?.category) {
      qb.andWhere(':category = ANY(agent.specializationCategories)', { category: query.category });
    }
    if (query?.status) {
      qb.andWhere('agent.status = :status', { status: query.status });
    }

    qb.orderBy('agent.totalRevenue', 'DESC');
    const agents = await qb.getMany();

    return agents.map(a => ({
      id: a.id,
      userId: a.userId,
      firstName: a.user?.firstName,
      lastName: a.user?.lastName,
      email: a.user?.email,
      phone: a.user?.phone,
      whatsapp: a.user?.whatsapp,
      avatarUrl: a.user?.avatarUrl,
      city: a.city,
      bio: a.bio,
      coverageAreas: a.coverageAreas,
      specializationCategories: a.specializationCategories,
      referralCode: a.referralCode,
      commissionRate: a.commissionRate,
      isVerified: a.isVerified,
      totalSales: a.totalSales,
      totalRevenue: a.totalRevenue,
      rating: a.rating,
      ratingCount: a.ratingCount,
      status: a.status,
      createdAt: a.createdAt,
    }));
  }

  async findOne(id: string) {
    const agent = await this.agentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return {
      id: agent.id,
      userId: agent.userId,
      firstName: agent.user?.firstName,
      lastName: agent.user?.lastName,
      email: agent.user?.email,
      phone: agent.user?.phone,
      whatsapp: agent.user?.whatsapp,
      avatarUrl: agent.user?.avatarUrl,
      city: agent.city,
      bio: agent.bio,
      coverageAreas: agent.coverageAreas,
      specializationCategories: agent.specializationCategories,
      referralCode: agent.referralCode,
      commissionRate: agent.commissionRate,
      isVerified: agent.isVerified,
      verificationDate: agent.verificationDate,
      totalSales: agent.totalSales,
      totalRevenue: agent.totalRevenue,
      rating: agent.rating,
      ratingCount: agent.ratingCount,
      status: agent.status,
      createdAt: agent.createdAt,
    };
  }

  async findByReferralCode(code: string) {
    const agent = await this.agentRepo.findOne({
      where: { referralCode: code },
      relations: ['user'],
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return this.findOne(agent.id);
  }

  async findByUserId(userId: string) {
    const agent = await this.agentRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!agent) throw new NotFoundException('Agent profile not found');
    return this.findOne(agent.id);
  }

  async update(id: string, dto: Partial<Agent>) {
    await this.agentRepo.update(id, { ...dto, updatedAt: new Date() });
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string, reviewerId?: string) {
    await this.agentRepo.update(id, { status, updatedAt: new Date() } as any);
    return this.findOne(id);
  }

  // Applications
  async createApplication(tenantId: string, dto: Partial<AgentApplication>) {
    const app = this.applicationRepo.create({ ...dto, tenantId });
    return this.applicationRepo.save(app);
  }

  async findAllApplications(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.applicationRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findApplication(id: string) {
    const app = await this.applicationRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async reviewApplication(id: string, decision: 'approved' | 'rejected', reviewerId: string, notes?: string) {
    const app = await this.findApplication(id);

    await this.applicationRepo.update(id, {
      status: decision === 'approved' ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
      reviewedBy: reviewerId,
      reviewNotes: notes,
      reviewedAt: new Date(),
    });

    if (decision === 'approved') {
      // Create user + agent
      let user = await this.userRepo.findOne({
        where: { email: app.email, tenantId: app.tenantId },
      });

      if (!user) {
        const names = app.fullName.split(' ');
        user = this.userRepo.create({
          tenantId: app.tenantId,
          email: app.email,
          firstName: names[0],
          lastName: names.slice(1).join(' ') || '',
          whatsapp: app.whatsapp,
          role: UserRole.AGENT,
          isActive: true,
          isVerified: true,
        });
        user = await this.userRepo.save(user);
      } else {
        await this.userRepo.update(user.id, { role: UserRole.AGENT });
      }

      const referralCode = app.fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const agent = this.agentRepo.create({
        tenantId: app.tenantId,
        userId: user.id,
        dni: app.dni,
        city: app.city,
        coverageAreas: app.coverageAreas,
        specializationCategories: app.categories,
        referralCode,
        commissionRate: 12.00,
        isVerified: true,
        verificationDate: new Date(),
        status: AgentStatus.ACTIVE,
      });
      await this.agentRepo.save(agent);
    }

    return this.findApplication(id);
  }

  // Stats for admin dashboard
  async getStats(tenantId: string) {
    const [activeCount] = await this.agentRepo.query(
      `SELECT COUNT(*) as count FROM agents WHERE tenant_id = $1 AND status = 'active'`, [tenantId]
    );
    const [pendingApps] = await this.agentRepo.query(
      `SELECT COUNT(*) as count FROM agent_applications WHERE tenant_id = $1 AND status = 'pending'`, [tenantId]
    );
    const [avgRevenue] = await this.agentRepo.query(
      `SELECT COALESCE(AVG(total_revenue), 0) as avg FROM agents WHERE tenant_id = $1 AND status = 'active'`, [tenantId]
    );
    const [avgRating] = await this.agentRepo.query(
      `SELECT COALESCE(AVG(rating), 0) as avg FROM agents WHERE tenant_id = $1 AND status = 'active' AND rating > 0`, [tenantId]
    );

    return {
      activeAgents: parseInt(activeCount.count),
      pendingApplications: parseInt(pendingApps.count),
      avgRevenuePerAgent: parseFloat(avgRevenue.avg),
      avgRating: parseFloat(parseFloat(avgRating.avg).toFixed(1)),
    };
  }
}
