import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  findAll(
    @TenantId() tenantId: string,
    @Query('category') categorySlug?: string,
    @Query('brand') brandId?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.findAllProducts(
      tenantId,
      {
        categorySlug,
        brandId,
        search,
        featured: featured ? featured === 'true' : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        includeInactive: includeInactive === 'true',
      },
    );
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get product by ID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.service.findProduct(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (admin)' })
  create(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.createProduct(tenantId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (admin)' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateProduct(id, dto);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add base64 image to product' })
  addImage(@Param('id') id: string, @Body() body: { image: string }) {
    return this.service.addProductImage(id, body.image);
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from product' })
  removeImage(@Param('id') id: string, @Body() body: { index: number }) {
    return this.service.removeProductImage(id, body.index);
  }

  @Post(':id/image/remove')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from product (POST alternative)' })
  removeImagePost(@Param('id') id: string, @Body() body: { index: number }) {
    return this.service.removeProductImage(id, body.index);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete product (admin)' })
  remove(@Param('id') id: string) {
    return this.service.deleteProduct(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle product active/inactive' })
  toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }
}
