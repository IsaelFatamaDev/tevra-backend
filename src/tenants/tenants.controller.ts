import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active tenants' })
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get('current/info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant info' })
  getCurrent(@TenantId() tenantId: string) {
    return this.service.findOne(tenantId);
  }

  @Public()
  @Get('current/public-config')
  @ApiOperation({ summary: 'Get public tenant config (social media, contact info)' })
  getPublicConfig(@TenantId() tenantId: string) {
    return this.service.getPublicConfig(tenantId);
  }

  @Put('current/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current tenant settings' })
  updateSettings(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.updateSettings(tenantId, dto);
  }
}
