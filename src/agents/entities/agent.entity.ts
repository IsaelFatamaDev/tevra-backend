import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum AgentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true, length: 20 })
  dni: string;

  @Column({ nullable: true, length: 100 })
  city: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'coverage_areas', type: 'text', array: true, default: [] })
  coverageAreas: string[];

  @Column({ name: 'specialization_categories', type: 'text', array: true, default: [] })
  specializationCategories: string[];

  @Column({ name: 'referral_code', nullable: true, length: 50, unique: true })
  referralCode: string;

  @Column({ name: 'referred_by', nullable: true })
  referredBy: string;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 12.00 })
  commissionRate: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', nullable: true })
  verificationDate: Date;

  @Column({ name: 'total_sales', default: 0 })
  totalSales: number;

  @Column({ name: 'total_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.ACTIVE })
  status: AgentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
