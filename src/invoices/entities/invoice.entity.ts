import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Si esta boleta está conectada a un pedido del e-commerce
  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'invoice_number', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ name: 'customer_name', length: 255 })
  customerName: string;

  @Column({ name: 'document_number', length: 50, nullable: true })
  documentNumber: string;

  @Column({ name: 'address', length: 500, nullable: true })
  address: string;

  // Guardamos los items de forma denormalizada como JSON ya que pueden ser servicios sueltos
  @Column({ type: 'jsonb' })
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ length: 20, default: 'pending' }) // pending, paid, cancelled
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
