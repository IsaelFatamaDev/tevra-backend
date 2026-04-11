import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Commissions')
@Controller('commissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommissionsController {
  constructor(private readonly service: CommissionsService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List commissions' })
  findAll(@TenantId() tenantId: string, @Query('agentId') agentId?: string, @Query('status') status?: string) {
    return this.service.findAll(tenantId, { agentId, status });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my commissions (agent, resolved from user ID)' })
  findMyCommissions(@Request() req: any) {
    return this.service.findByAgentUserId(req.user.id);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get commissions for an agent' })
  findByAgent(@Param('agentId') agentId: string) {
    return this.service.findByAgent(agentId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create commission' })
  create(@TenantId() tenantId: string, @Body() dto: any) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id/paid')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Mark commission as paid' })
  markPaid(@Param('id') id: string) {
    return this.service.markPaid(id);
  }
}
