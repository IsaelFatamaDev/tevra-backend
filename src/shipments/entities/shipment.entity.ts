import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Order } from '../../orders/entities/order.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  PURCHASED = 'purchased',
  IN_TRANSIT = 'in_transit',
  IN_CUSTOMS = 'in_customs',
  READY = 'ready',
  DELIVERED = 'delivered',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'order_id' })
  orderId: string;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'tracking_number', nullable: true, length: 100, unique: true })
  trackingNumber: string;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ name: 'current_location', nullable: true, length: 255 })
  currentLocation: string;

  @Column({ name: 'origin_hub', default: 'Miami, FL USA', length: 100 })
  originHub: string;

  @Column({ nullable: true, length: 255 })
  destination: string;

  @Column({ name: 'estimated_arrival', type: 'date', nullable: true })
  estimatedArrival: string;

  @Column({ name: 'actual_arrival', nullable: true })
  actualArrival: Date;

  @Column({ nullable: true, length: 100 })
  carrier: string;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 6, scale: 2, nullable: true })
  weightKg: number;

  @Column({ name: 'is_insured', default: true })
  isInsured: boolean;

  @Column({ name: 'insurance_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  insuranceValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
