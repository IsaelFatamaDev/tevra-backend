import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
  ) { }

  async findAll(tenantId: string, query?: {
    status?: string;
    customerId?: string;
    agentId?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.agent', 'agent')
      .leftJoinAndSelect('agent.user', 'agentUser')
      .where('o.tenantId = :tenantId', { tenantId });

    if (query?.status) qb.andWhere('o.status = :status', { status: query.status });
    if (query?.customerId) qb.andWhere('o.customerId = :customerId', { customerId: query.customerId });
    if (query?.agentId) qb.andWhere('o.agentId = :agentId', { agentId: query.agentId });

    qb.orderBy('o.createdAt', 'DESC');

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        total: o.total,
        currency: o.currency,
        customer: o.customer ? {
          id: o.customer.id,
          firstName: o.customer.firstName,
          lastName: o.customer.lastName,
          email: o.customer.email,
        } : null,
        agent: o.agent ? {
          id: o.agent.id,
          firstName: o.agent.user?.firstName,
          lastName: o.agent.user?.lastName,
        } : null,
        items: o.items,
        estimatedDeliveryDate: o.estimatedDeliveryDate,
        createdAt: o.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'customer', 'agent', 'agent.user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.orderRepo.findOne({
      where: { orderNumber },
      relations: ['items', 'customer', 'agent', 'agent.user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByCustomer(customerId: string) {
    return this.orderRepo.find({
      where: { customerId },
      relations: ['items', 'agent', 'agent.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAgent(agentId: string) {
    return this.orderRepo.find({
      where: { agentId },
      relations: ['items', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAgentUserId(userId: string) {
    return this.orderRepo.find({
      where: { agent: { userId } },
      relations: ['items', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(tenantId: string, dto: {
    customerId: string;
    agentId?: string;
    items: { productId?: string; productName: string; productImage?: string; quantity: number; unitPrice: number; variantInfo?: any }[];
    shippingAddress?: any;
    notes?: string;
    productLink?: string;
  }) {
    const orderNumber = `TV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;

    const subtotal = dto.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const shippingCost = subtotal > 500 ? 20 : 15;
    const commissionRate = 0.12;
    const tevraCommission = Number((subtotal * commissionRate).toFixed(2));
    const agentCommission = dto.agentId ? Number((subtotal * commissionRate).toFixed(2)) : 0;
    const total = Number((subtotal + shippingCost + tevraCommission + agentCommission).toFixed(2));

    const order = this.orderRepo.create({
      tenantId,
      orderNumber,
      customerId: dto.customerId,
      agentId: dto.agentId,
      status: OrderStatus.PENDING,
      subtotal,
      shippingCost,
      tevraCommission,
      agentCommission,
      total,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      productLink: dto.productLink,
    });
    const saved = await this.orderRepo.save(order) as Order;

    const items = dto.items.map(item => this.itemRepo.create({
      orderId: saved.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      variantInfo: item.variantInfo || {},
    }));
    await this.itemRepo.save(items);

    return this.findOne(saved.id);
  }

  async updateStatus(id: string, status: string) {
    const order = await this.findOne(id);
    order.status = status as any;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await this.orderRepo.save(order);
    return this.findOne(id);
  }

  // Stats for admin dashboard
  async getStats(tenantId: string) {
    const [totalSales] = await this.orderRepo.query(
      `SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = $1 AND status NOT IN ('cancelled','pending')`, [tenantId]
    );
    const [completedOrders] = await this.orderRepo.query(
      `SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND status NOT IN ('cancelled','pending')`, [tenantId]
    );
    const [avgOrderValue] = await this.orderRepo.query(
      `SELECT COALESCE(AVG(total), 0) as avg FROM orders WHERE tenant_id = $1 AND status NOT IN ('cancelled','pending')`, [tenantId]
    );
    const recentOrders = await this.orderRepo.find({
      where: { tenantId },
      relations: ['customer', 'agent', 'agent.user'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalSales: parseFloat(totalSales.total),
      completedOrders: parseInt(completedOrders.count),
      avgOrderValue: parseFloat(parseFloat(avgOrderValue.avg).toFixed(2)),
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        customerName: `${o.customer?.firstName} ${o.customer?.lastName}`,
        agentName: o.agent ? `${o.agent.user?.firstName} ${o.agent.user?.lastName}` : null,
        createdAt: o.createdAt,
      })),
    };
  }
}
