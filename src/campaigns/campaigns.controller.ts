import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.service.findAllCampaigns(tenantId, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Campaign stats' })
  getStats(@TenantId() tenantId: string) {
    return this.service.getStats(tenantId);
  }

  @Get('estimate')
  @ApiOperation({ summary: 'Estimate recipients based on channel and audience' })
  estimateRecipients(
    @TenantId() tenantId: string, 
    @Query('type') type: string, 
    @Query('audienceType') audienceType: string
  ) {
    return this.service.estimateRecipients(tenantId, type, audienceType);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List templates' })
  findTemplates(@TenantId() tenantId: string) {
    return this.service.findAllTemplates(tenantId);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create template' })
  createTemplate(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.createTemplate(tenantId, dto);
  }

  @Get('segments')
  @ApiOperation({ summary: 'List audience segments' })
  findSegments(@TenantId() tenantId: string) {
    return this.service.findAllSegments(tenantId);
  }

  @Post('segments')
  @ApiOperation({ summary: 'Create segment' })
  createSegment(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.createSegment(tenantId, dto);
  }

  @Get(':id')
  findCampaign(@Param('id') id: string) {
    return this.service.findCampaign(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and launch campaign' })
  async create(@TenantId() tenantId: string, @Body() dto: any, @Request() req: any) {
    const campaign = await this.service.createCampaign(tenantId, req.user.id, dto);
    // Auto-launch since we don't have a schedule flow yet
    return this.service.launchCampaign(campaign.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateCampaign(id, dto);
  }
}
