import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List payments' })
  findAll(@TenantId() tenantId: string, @Query('orderId') orderId?: string) {
    return this.service.findAll(tenantId, orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a payment' })
  create(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update payment status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string; transactionId?: string }) {
    return this.service.updateStatus(id, body.status, body.transactionId);
  }
}
