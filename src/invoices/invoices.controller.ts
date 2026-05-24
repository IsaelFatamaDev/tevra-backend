import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create manual invoice' })
  create(@Req() req, @Body() dto: any) {
    return this.invoicesService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List all invoices' })
  findAll(@Req() req) {
    return this.invoicesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get invoice details' })
  findOne(@Req() req, @Param('id') id: string) {
    return this.invoicesService.findOne(id, req.user.tenantId);
  }

  @Put(':id/status')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update invoice status' })
  updateStatus(@Req() req, @Param('id') id: string, @Body() body: { status: string }) {
    return this.invoicesService.updateStatus(id, req.user.tenantId, body.status);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Req() req, @Param('id') id: string) {
    return this.invoicesService.remove(id, req.user.tenantId);
  }
}
