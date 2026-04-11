import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { TenantId, CurrentUser } from '../common/decorators/tenant.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findMyNotifications(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findByUser(tenantId, user.sub);
  }

  @Get('unread-count')
  getUnreadCount(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getUnreadCount(tenantId, user.sub);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }

  @Patch('read-all')
  markAllRead(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.markAllRead(tenantId, user.sub);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() body: Partial<any>,
  ) {
    return this.service.create(tenantId, body);
  }
}
