import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  QUOTE_REQUESTED = 'quote_requested',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PURCHASED_IN_USA = 'purchased_in_usa',
  IN_TRANSIT = 'in_transit',
  IN_CUSTOMS = 'in_customs',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'order_number', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ name: 'tevra_commission', type: 'decimal', precision: 10, scale: 2, default: 0 })
  tevraCommission: number;

  @Column({ name: 'agent_commission', type: 'decimal', precision: 10, scale: 2, default: 0 })
  agentCommission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'shipping_address', type: 'jsonb', nullable: true })
  shippingAddress: Record<string, any>;

  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'product_link', type: 'text', nullable: true })
  productLink: string;

  @Column({ name: 'estimated_delivery_date', type: 'date', nullable: true })
  estimatedDeliveryDate: string;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
