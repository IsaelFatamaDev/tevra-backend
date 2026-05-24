import { Controller, Post, Get, Delete, UseGuards, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

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

  @Public()
  @Post('webhook/:tenantId')
  @ApiOperation({ summary: 'Evolution API webhook receiver' })
  async handleWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
    await this.whatsAppService.handleWebhook(payload, tenantId);
    return { status: 'ok' };
  }

  // ---- CHAT INBOX ENDPOINTS ----

  @Get('conversations')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get recent chat conversations' })
  getConversations(@Req() req) {
    return this.whatsAppService.getConversations(req.user.tenantId);
  }

  @Get('messages/:phone')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get messages for a specific phone number' })
  getMessages(@Req() req, @Param('phone') phone: string) {
    return this.whatsAppService.getMessagesByPhone(req.user.tenantId, phone);
  }

  @Post('messages/send')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Send text from admin UI' })
  async sendMessage(@Req() req, @Body() body: { phone: string; text: string }) {
    await this.whatsAppService.sendText(body.phone, body.text, req.user.tenantId);
    return { success: true };
  }

  @Post('messages/:phone/read')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Mark messages as read' })
  markAsRead(@Req() req, @Param('phone') phone: string) {
    return this.whatsAppService.markAsRead(req.user.tenantId, phone);
  }
}
