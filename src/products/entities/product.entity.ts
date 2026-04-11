import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Category } from './category.entity';
import { Brand } from './brand.entity';

export enum DemandLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum StockStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  OUT_OF_STOCK = 'out_of_stock',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'brand_id', nullable: true })
  brandId: string;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price_usd', type: 'decimal', precision: 10, scale: 2 })
  priceUsd: number;

  @Column({ name: 'price_ref_local', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceRefLocal: number;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'demand_level', type: 'enum', enum: DemandLevel, default: DemandLevel.MEDIUM })
  demandLevel: DemandLevel;

  @Column({ name: 'margin_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  marginPct: number;

  @Column({ name: 'stock_status', type: 'enum', enum: StockStatus, default: StockStatus.AVAILABLE })
  stockStatus: StockStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
