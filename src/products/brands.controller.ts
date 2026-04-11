import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly service: ProductsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all brands' })
  findAll(@TenantId() tenantId: string) {
    return this.service.findAllBrands(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  create(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.createBrand(tenantId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateBrand(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete brand' })
  remove(@Param('id') id: string) {
    return this.service.deleteBrand(id);
  }
}
