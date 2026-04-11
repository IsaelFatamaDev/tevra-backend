import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { CampaignTemplate } from './campaign-template.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @ManyToOne(() => CampaignTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: CampaignTemplate;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true, length: 255 })
  subject: string;

  @Column({ name: 'audience_type', length: 50, default: 'all_customers' })
  audienceType: string;

  @Column({ name: 'recipient_count', default: 0 })
  recipientCount: number;

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  @Column({ name: 'open_count', default: 0 })
  openCount: number;

  @Column({ name: 'click_count', default: 0 })
  clickCount: number;

  @Column({ name: 'scheduled_at', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
