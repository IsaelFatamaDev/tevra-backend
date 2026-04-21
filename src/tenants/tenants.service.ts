import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) { }

  findAll() {
    return this.repo.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.repo.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateSettings(id: string, dto: { name?: string; settings?: Record<string, any> }) {
    const tenant = await this.findOne(id);
    if (dto.name) tenant.name = dto.name;
    if (dto.settings) tenant.settings = { ...tenant.settings, ...dto.settings };
    return this.repo.save(tenant);
  }

  async getPublicConfig(id: string) {
    const tenant = await this.repo.findOne({ where: { id } });
    const settings = tenant?.settings || {};
    return {
      whatsapp: settings.whatsapp || '+15102246683',
      instagramUrl: settings.instagramUrl || 'https://www.instagram.com/tevra.tech/',
      facebookUrl: settings.facebookUrl || null,
      tiktokUrl: settings.tiktokUrl || null,
      supportEmail: settings.supportEmail || null,
      name: tenant?.name || 'TeVra',
    };
  }
}
