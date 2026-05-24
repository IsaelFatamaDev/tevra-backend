import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true, length: 100 })
  label: string;

  @Column({ name: 'recipient_name', nullable: true, length: 150 })
  recipientName: string;

  @Column({ nullable: true, length: 50 })
  phone: string;

  @Column({ name: 'address_line_1', type: 'text' })
  addressLine1: string;

  @Column({ name: 'address_line_2', nullable: true, type: 'text' })
  addressLine2: string;

  @Column({ length: 100 })
  city: string;

  @Column({ nullable: true, length: 100 })
  state: string;

  @Column({ length: 100, default: 'Peru' })
  country: string;

  @Column({ name: 'zip_code', nullable: true, length: 20 })
  zipCode: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
