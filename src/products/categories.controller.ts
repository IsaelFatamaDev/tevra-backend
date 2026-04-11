import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: ProductsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories' })
  findAll(@TenantId() tenantId: string) {
    return this.service.findAllCategories(tenantId);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get category by ID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.service.findCategory(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  create(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.createCategory(tenantId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateCategory(id, dto);
  }
}
