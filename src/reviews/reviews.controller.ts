import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List reviews with filters' })
  findAll(
    @TenantId() tenantId: string,
    @Query('productId') productId?: string,
    @Query('agentId') agentId?: string,
    @Query('search') search?: string,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(tenantId, {
      productId, agentId, search,
      rating: rating ? parseInt(rating) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews for a product' })
  findByProduct(@Param('productId') productId: string) {
    return this.service.findByProduct(productId);
  }

  @Public()
  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get reviews for an agent' })
  findByAgent(@Param('agentId') agentId: string) {
    return this.service.findByAgent(agentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create review' })
  create(@TenantId() tenantId: string, @Body() dto: any, @Request() req: any) {
    return this.service.create(tenantId, req.user.id, dto);
  }

  @Patch(':id/helpful')
  @Public()
  @ApiOperation({ summary: 'Mark review as helpful' })
  markHelpful(@Param('id') id: string) {
    return this.service.markHelpful(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (admin)' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.remove(id, tenantId);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a review (approve/reject)' })
  moderate(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('action') action: 'approve' | 'reject',
  ) {
    return this.service.moderate(id, tenantId, action);
  }
}
