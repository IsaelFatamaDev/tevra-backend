import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { AudienceSegment } from './entities/audience-segment.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignTemplate)
    private readonly templateRepo: Repository<CampaignTemplate>,
    @InjectRepository(AudienceSegment)
    private readonly segmentRepo: Repository<AudienceSegment>,
  ) {}

  // Campaigns
  findAllCampaigns(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.campaignRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findCampaign(id: string) {
    const c = await this.campaignRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async createCampaign(tenantId: string, createdBy: string, dto: Partial<Campaign>) {
    const c = this.campaignRepo.create({ ...dto, tenantId, createdBy });
    return this.campaignRepo.save(c);
  }

  async updateCampaign(id: string, dto: Partial<Campaign>) {
    await this.campaignRepo.update(id, { ...dto, updatedAt: new Date() });
    return this.findCampaign(id);
  }

  async getStats(tenantId: string) {
    const campaigns = await this.campaignRepo.find({ where: { tenantId } });
    const totalReach = campaigns.reduce((s, c) => s + c.recipientCount, 0);
    const totalOpens = campaigns.reduce((s, c) => s + c.openCount, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clickCount, 0);
    return {
      totalCampaigns: campaigns.length,
      totalReach,
      totalOpens,
      totalClicks,
      avgOpenRate: totalReach > 0 ? parseFloat((totalOpens / totalReach * 100).toFixed(1)) : 0,
    };
  }

  // Templates
  findAllTemplates(tenantId: string) {
    return this.templateRepo.find({ where: { tenantId, isActive: true } });
  }

  async createTemplate(tenantId: string, dto: Partial<CampaignTemplate>) {
    const t = this.templateRepo.create({ ...dto, tenantId });
    return this.templateRepo.save(t);
  }

  // Segments
  findAllSegments(tenantId: string) {
    return this.segmentRepo.find({ where: { tenantId }, order: { memberCount: 'DESC' } });
  }

  async createSegment(tenantId: string, dto: Partial<AudienceSegment>) {
    const s = this.segmentRepo.create({ ...dto, tenantId });
    return this.segmentRepo.save(s);
  }
}
