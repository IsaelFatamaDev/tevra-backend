import { Controller, Post, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('instance')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create WhatsApp instance' })
  createInstance() {
    return this.whatsAppService.createInstance();
  }

  @Get('qrcode')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get QR code to connect WhatsApp' })
  getQrCode() {
    return this.whatsAppService.getQrCode();
  }

  @Get('status')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Check WhatsApp connection status' })
  getStatus() {
    return this.whatsAppService.getConnectionStatus();
  }

  @Delete('logout')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Disconnect WhatsApp' })
  logout() {
    return this.whatsAppService.logout();
  }
}
