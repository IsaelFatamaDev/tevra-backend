import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { UserRegisteredEvent } from '../common/events/user-registered.event';
import { OrderStatusUpdatedEvent } from '../common/events/order-status-updated.event';
import { CampaignLaunchedEvent } from '../common/events/campaign-launched.event';

@Injectable()
export class MailListener {
  private readonly logger = new Logger(MailListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

    @OnEvent('user.registered')
  async handleUserRegisteredEvent(event: UserRegisteredEvent) {
    this.logger.log(`Handling user.registered for: ${event.email}`);

    
    await this.mailService.sendWelcomeEmail(
      event.email,
      event.firstName,
      event.password,
      event.verificationToken,
      event.tenantId,
    );

    
    if (event.whatsapp) {
      const message = [
        `🎉 Welcome to TeVra, ${event.firstName}!`,
        ``,
        `Your account has been created successfully.`,
        ``,
        `📧 Email: ${event.email}`,
        `🔑 Password: ${event.password}`,
        ``,
        `Please verify your email to activate your account.`,
        ``,
        `🔗 Login: https:
        ``,
        `— TeVra Team`,
      ].join('\n');

      await this.whatsAppService.sendText(event.whatsapp, message);
    }
  }

    @OnEvent('order.status-updated')
  async handleOrderStatusUpdatedEvent(event: OrderStatusUpdatedEvent) {
    this.logger.log(`Handling order.status-updated for: ${event.orderNumber}`);

    
    if (event.customerEmail) {
      await this.mailService.sendOrderUpdateEmail(
        event.customerEmail,
        event.orderNumber,
        event.newStatus,
        event.customerName,
      );
    }

    
    if (event.agentEmail) {
      await this.mailService.sendAgentOrderNotification(
        event.agentEmail,
        event.orderNumber,
        event.newStatus,
      );
    }

    
    if (event.customerWhatsapp) {
      const statusLabel = event.newStatus.replace(/_/g, ' ').toUpperCase();
      const message = [
        `📦 *TeVra — Order Update*`,
        ``,
        `Hello ${event.customerName}, your order *${event.orderNumber}* has been updated:`,
        ``,
        `📋 New status: *${statusLabel}*`,
        ``,
        `Track your order: https:
        ``,
        `— TeVra Team`,
      ].join('\n');

      await this.whatsAppService.sendText(event.customerWhatsapp, message);
    }

    
    if (event.agentWhatsapp) {
      const statusLabel = event.newStatus.replace(/_/g, ' ').toUpperCase();
      const message = [
        `🔔 *TeVra — Order ${event.orderNumber}*`,
        ``,
        `Status changed to: *${statusLabel}*`,
        `Client: ${event.customerName}`,
        ``,
        `— TeVra System`,
      ].join('\n');

      await this.whatsAppService.sendText(event.agentWhatsapp, message);
    }
  }

    @OnEvent('campaign.launched')
  async handleCampaignLaunchedEvent(event: CampaignLaunchedEvent) {
    this.logger.log(`Handling campaign.launched for: ${event.campaignId}`);

    
    await this.mailService.sendCampaignEmails(
      event.targetAudienceEmails,
      event.subject,
      event.content,
    );

    
    if (event.targetAudiencePhones?.length > 0) {
      const waMessage = [
        `📢 *TeVra — ${event.subject}*`,
        ``,
        event.content.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
        ``,
        `🔗 https:
        ``,
        `— TeVra Team`,
      ].join('\n');

      for (const phone of event.targetAudiencePhones) {
        await this.whatsAppService.sendText(phone, waMessage);
      }
    }
  }

    @OnEvent('commission.paid')
  async handleCommissionPaidEvent(event: any) {
    this.logger.log(`Handling commission.paid for: ${event.agentEmail}`);

    await this.mailService.sendGenericEmail(
      event.agentEmail,
      '¡Tu comisión ha sido pagada! - TeVra',
      `Hola ${event.agentName},<br><br>Nos complace informarte que hemos realizado el pago de tu comisión por <strong>$${event.amount} USD</strong> correspondiente al pedido <strong>${event.orderNumber || 'N/A'}</strong>.<br><br>Gracias por ser parte del equipo TeVra.<br><br>Saludos,<br>El equipo de TeVra`
    );
  }
}
