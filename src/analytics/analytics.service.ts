import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Agent } from '../agents/entities/agent.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Commission } from '../commissions/entities/commission.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Agent) private readonly agentRepo: Repository<Agent>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Commission) private readonly commissionRepo: Repository<Commission>,
  ) { }

  private getDateFrom(period?: string): Date | null {
    if (!period) return null;
    const now = new Date();
    switch (period) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default: return null;
    }
  }

  async getDashboardStats(tenantId: string) {
    const [totalOrders, totalAgents, totalCustomers, totalProducts] = await Promise.all([
      this.orderRepo.count({ where: { tenantId } }),
      this.agentRepo.count({ where: { tenantId } }),
      this.userRepo.count({ where: { tenantId, role: 'customer' as any } }),
      this.productRepo.count({ where: { tenantId } }),
    ]);

    const revenueResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total), 0)', 'totalRevenue')
      .addSelect('COALESCE(SUM(o.tevra_commission), 0)', 'totalTevraCommission')
      .addSelect('COALESCE(SUM(o.agent_commission), 0)', 'totalAgentCommission')
      .where('o.tenant_id = :tenantId', { tenantId })
      .andWhere("o.status != 'cancelled'")
      .getRawOne();

    const ordersByStatus = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.tenant_id = :tenantId', { tenantId })
      .groupBy('o.status')
      .getRawMany();

    return {
      totalOrders,
      totalAgents,
      totalCustomers,
      totalProducts,
      totalRevenue: parseFloat(revenueResult.totalRevenue),
      totalTevraCommission: parseFloat(revenueResult.totalTevraCommission),
      totalAgentCommission: parseFloat(revenueResult.totalAgentCommission),
      ordersByStatus,
    };
  }

  async getTopAgents(tenantId: string, limit = 10) {
    return this.orderRepo
      .createQueryBuilder('o')
      .select('o.agent_id', 'agentId')
      .addSelect("u.first_name || ' ' || u.last_name", 'displayName')
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(o.total), 0)', 'totalRevenue')
      .addSelect('COALESCE(SUM(o.agent_commission), 0)', 'totalCommission')
      .innerJoin('agents', 'a', 'a.id = o.agent_id')
      .innerJoin('users', 'u', 'u.id = a.user_id')
      .where('o.tenant_id = :tenantId', { tenantId })
      .andWhere('o.agent_id IS NOT NULL')
      .groupBy('o.agent_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopProducts(tenantId: string, limit = 10) {
    return this.orderRepo
      .createQueryBuilder('o')
      .select('oi.product_id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .addSelect('SUM(oi.subtotal)', 'totalRevenue')
      .innerJoin('order_items', 'oi', 'oi.order_id = o.id')
      .innerJoin('products', 'p', 'p.id = oi.product_id')
      .where('o.tenant_id = :tenantId', { tenantId })
      .groupBy('oi.product_id')
      .addGroupBy('p.name')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getRevenueByMonth(tenantId: string, period?: string) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select("TO_CHAR(o.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o.tenant_id = :tenantId', { tenantId })
      .andWhere("o.status != 'cancelled'");
    const dateFrom = this.getDateFrom(period);
    if (dateFrom) qb.andWhere('o.created_at >= :dateFrom', { dateFrom });
    return qb.groupBy("TO_CHAR(o.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  async getOrdersByCity(tenantId: string, period?: string) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select("o.shipping_address->>'city'", 'city')
      .addSelect("o.shipping_address->>'country'", 'country')
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(o.total), 0)', 'totalRevenue')
      .where('o.tenant_id = :tenantId', { tenantId })
      .andWhere("o.shipping_address->>'city' IS NOT NULL");
    const dateFrom = this.getDateFrom(period);
    if (dateFrom) qb.andWhere('o.created_at >= :dateFrom', { dateFrom });
    return qb.groupBy("o.shipping_address->>'city'")
      .addGroupBy("o.shipping_address->>'country'")
      .orderBy('"totalOrders"', 'DESC')
      .getRawMany();
  }

  async getOrdersByCategory(tenantId: string, period?: string) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select('c.name', 'category')
      .addSelect('COUNT(DISTINCT o.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(oi.subtotal), 0)', 'totalRevenue')
      .innerJoin('order_items', 'oi', 'oi.order_id = o.id')
      .innerJoin('products', 'p', 'p.id = oi.product_id')
      .leftJoin('categories', 'c', 'c.id = p.category_id')
      .where('o.tenant_id = :tenantId', { tenantId });
    const dateFrom = this.getDateFrom(period);
    if (dateFrom) qb.andWhere('o.created_at >= :dateFrom', { dateFrom });
    return qb.groupBy('c.name')
      .orderBy('"totalRevenue"', 'DESC')
      .getRawMany();
  }
}
