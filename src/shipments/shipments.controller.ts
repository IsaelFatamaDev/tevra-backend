import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Shipments')
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly service: ShipmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all shipments (admin)' })
  findAll(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.service.findAll(tenantId, status);
  }

  @Public()
  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track shipment by tracking number (public)' })
  trackByNumber(@Param('trackingNumber') trackingNumber: string) {
    return this.service.findByTracking(trackingNumber);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipment by order ID' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrderId(orderId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create shipment (admin)' })
  create(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipment status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string; location?: string }) {
    return this.service.updateStatus(id, body.status, body.location);
  }

  @Post(':id/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add shipment event' })
  addEvent(@Param('id') id: string, @Body() dto: any) {
    return this.service.addEvent(id, dto);
  }
}
