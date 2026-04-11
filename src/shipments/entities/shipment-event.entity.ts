import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from './shipment.entity';

@Entity('shipment_events')
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({ length: 50 })
  status: string;

  @Column({ nullable: true, length: 255 })
  location: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'occurred_at', default: () => 'NOW()' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
