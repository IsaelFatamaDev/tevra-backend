import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      tenantId,
      { productId, agentId, page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 },
    );
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
}
