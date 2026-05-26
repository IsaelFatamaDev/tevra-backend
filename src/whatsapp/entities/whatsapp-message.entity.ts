import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('whatsapp_messages')
export class WhatsAppMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  
  @Column({ length: 50 })
  phoneNumber: string;

  
  @Column({ type: 'text' })
  text: string;

  
  @Column({ name: 'is_from_admin', default: false })
  isFromAdmin: boolean;

  
  @Column({ name: 'message_id', nullable: true })
  messageId: string;

  
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
