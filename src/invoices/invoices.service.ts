import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async create(tenantId: string, dto: any): Promise<Invoice> {
    // Generate a simple sequential-looking invoice number like BOL-2026-1029
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `BOL-${new Date().getFullYear()}-${randomNum}`;

    const totalAmount = dto.items.reduce((acc, item) => acc + item.subtotal, 0);

    const invoice = this.invoiceRepo.create({
      ...dto,
      tenantId,
      invoiceNumber,
      totalAmount,
    });

    return this.invoiceRepo.save(invoice);
  }

  async findAll(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateStatus(id: string, tenantId: string, status: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    invoice.status = status;
    return this.invoiceRepo.save(invoice);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const invoice = await this.findOne(id, tenantId);
    await this.invoiceRepo.remove(invoice);
  }
}
