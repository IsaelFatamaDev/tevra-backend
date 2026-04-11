import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) { }

  @Get('dashboard')
  @Roles('admin', 'super_admin')
  getDashboardStats(@TenantId() tenantId: string) {
    return this.service.getDashboardStats(tenantId);
  }

  @Get('top-agents')
  @Roles('admin', 'super_admin')
  getTopAgents(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getTopAgents(tenantId, limit || 10);
  }

  @Get('top-products')
  @Roles('admin', 'super_admin')
  getTopProducts(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getTopProducts(tenantId, limit || 10);
  }

  @Get('revenue-by-month')
  @Roles('admin', 'super_admin')
  getRevenueByMonth(
    @TenantId() tenantId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getRevenueByMonth(tenantId, period);
  }

  @Get('orders-by-city')
  @Roles('admin', 'super_admin')
  getOrdersByCity(
    @TenantId() tenantId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getOrdersByCity(tenantId, period);
  }

  @Get('orders-by-category')
  @Roles('admin', 'super_admin')
  getOrdersByCategory(
    @TenantId() tenantId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getOrdersByCategory(tenantId, period);
  }
}
