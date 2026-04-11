import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly service: AgentsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List agents (public)' })
  findAll(
    @TenantId() tenantId: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(tenantId, { city, category, status, search });
  }

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'List all unique agent cities' })
  getCities(@TenantId() tenantId: string) {
    return this.service.getCities(tenantId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my agent profile' })
  getMyProfile(@Request() req: any) {
    return this.service.findByUserId(req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent statistics (admin)' })
  getStats(@TenantId() tenantId: string) {
    return this.service.getStats(tenantId);
  }

  @Public()
  @Get('profile/:code')
  @ApiOperation({ summary: 'Get agent public profile by referral code' })
  findByCode(@Param('code') code: string) {
    return this.service.findByReferralCode(code);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update agent' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update agent status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.updateStatus(id, status, req.user.id);
  }

  // Applications
  @Public()
  @Post('applications')
  @ApiOperation({ summary: 'Submit agent application' })
  createApplication(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.createApplication(
      tenantId, dto,
    );
  }

  @Get('applications/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all agent applications' })
  findAllApplications(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.service.findAllApplications(tenantId, status);
  }

  @Get('applications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  findApplication(@Param('id') id: string) {
    return this.service.findApplication(id);
  }

  @Patch('applications/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review (approve/reject) an application' })
  reviewApplication(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; notes?: string },
    @Request() req: any,
  ) {
    return this.service.reviewApplication(id, body.decision, req.user.id, body.notes);
  }
}
