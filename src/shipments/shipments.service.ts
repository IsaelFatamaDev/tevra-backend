import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentEvent } from './entities/shipment-event.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentEvent)
    private readonly eventRepo: Repository<ShipmentEvent>,
  ) {}

  findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.shipmentRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const shipment = await this.shipmentRepo.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const events = await this.eventRepo.find({
      where: { shipmentId: id },
      order: { occurredAt: 'ASC' },
    });
    return { ...shipment, events };
  }

  async findByOrderId(orderId: string) {
    const shipment = await this.shipmentRepo.findOne({ where: { orderId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const events = await this.eventRepo.find({
      where: { shipmentId: shipment.id },
      order: { occurredAt: 'ASC' },
    });
    return { ...shipment, events };
  }

  async findByTracking(trackingNumber: string) {
    const shipment = await this.shipmentRepo.findOne({ where: { trackingNumber } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const events = await this.eventRepo.find({
      where: { shipmentId: shipment.id },
      order: { occurredAt: 'ASC' },
    });
    return { ...shipment, events };
  }

  async create(tenantId: string, dto: Partial<Shipment>) {
    const shipment = this.shipmentRepo.create({ ...dto, tenantId });
    return this.shipmentRepo.save(shipment);
  }

  async updateStatus(id: string, status: string, location?: string) {
    const update: any = { status, updatedAt: new Date() };
    if (location) update.currentLocation = location;
    if (status === 'delivered') update.actualArrival = new Date();
    await this.shipmentRepo.update(id, update);
    return this.findOne(id);
  }

  async addEvent(shipmentId: string, dto: { status: string; location: string; description: string; occurredAt?: Date }) {
    const event = this.eventRepo.create({
      shipmentId,
      status: dto.status,
      location: dto.location,
      description: dto.description,
      occurredAt: dto.occurredAt || new Date(),
    });
    await this.eventRepo.save(event);

    // Also update shipment status
    await this.shipmentRepo.update(shipmentId, {
      status: dto.status as any,
      currentLocation: dto.location,
      updatedAt: new Date(),
    });

    return this.findOne(shipmentId);
  }
}
