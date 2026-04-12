import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (admin)' })
  findAll(@TenantId() tenantId: string, @Query('role') role?: string, @Query('search') search?: string) {
    return this.service.findAll(tenantId, { role, search });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return this.service.getProfile(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Request() req: any, @Body() dto: any) {
    const { passwordHash, role, isActive, ...safe } = dto;
    return this.service.update(req.user.id, safe);
  }

  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAddresses(@Request() req: any) {
    return this.service.getAddresses(req.user.id);
  }

  @Post('me/addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createAddress(@Request() req: any, @Body() dto: any) {
    return this.service.createAddress(req.user.id, dto);
  }

  @Put('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateAddress(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateAddress(id, req.user.id, dto);
  }

  @Delete('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteAddress(@Request() req: any, @Param('id') id: string) {
    return this.service.deleteAddress(id, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id (admin)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (admin)' })
  updateUserAsAdmin(@Param('id') id: string, @Body() dto: any) {
    const { passwordHash, ...safe } = dto;
    return this.service.update(id, safe);
  }
}
