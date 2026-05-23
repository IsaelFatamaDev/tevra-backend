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

  // All fields exposed here are managed exclusively from Admin > Configuración.
  // No .env variable should ever override what the admin sets in the DB.
  async getPublicConfig(id: string) {
    const tenant = await this.repo.findOne({ where: { id } });
    const s = tenant?.settings || {};
    return {
      // Identity
      name: tenant?.name || 'TeVra',
      // Contact & social (configured in Settings > Datos de la empresa)
      whatsapp: s.whatsapp || null,
      supportEmail: s.supportEmail || null,
      supportPhone: s.supportPhone || null,
      instagramUrl: s.instagramUrl || null,
      facebookUrl: s.facebookUrl || null,
      tiktokUrl: s.tiktokUrl || null,
      // Platform defaults (configured in Settings > Comisiones)
      currency: s.currency || 'USD',
      timezone: s.timezone || 'America/Lima',
      welcomeMessage: s.welcomeMessage || '',
      baseShippingRate: s.baseShippingRate ?? 15,
      grossMarginPct: s.grossMarginPct ?? 30,
      agentCommissionPct: s.agentCommissionPct ?? 12,
      etcCommissionPct: s.etcCommissionPct ?? 3,
      exchangeRateBuy: s.exchangeRateBuy ?? 3.72,
      exchangeRateSell: s.exchangeRateSell ?? 3.78,
      maxAgentZones: s.maxAgentZones ?? 3,
      // Logo
      logoUrl: s.logoUrl || null,
    };
  }
}
