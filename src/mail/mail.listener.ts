import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { UserRegisteredEvent } from '../common/events/user-registered.event';
import { OrderStatusUpdatedEvent } from '../common/events/order-status-updated.event';
import { CampaignLaunchedEvent } from '../common/events/campaign-launched.event';

@Injectable()
export class MailListener {
  private readonly logger = new Logger(MailListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.registered')
  async handleUserRegisteredEvent(event: UserRegisteredEvent) {
    this.logger.log(`Handling user.registered event for: ${event.email}`);
    await this.mailService.sendWelcomeEmail(
      event.email,
      event.firstName,
      event.password,
      event.verificationToken,
    );
  }

  @OnEvent('order.status-updated')
  async handleOrderStatusUpdatedEvent(event: OrderStatusUpdatedEvent) {
    this.logger.log(`Handling order.status-updated event for order: ${event.orderNumber}`);
		
		if (event.customerEmail) {
    	await this.mailService.sendOrderUpdateEmail(
      	event.customerEmail,
      	event.orderNumber,
      	event.newStatus,
      	event.customerName,
    	);
		}

		// Send separate email to agent if associated (Assuming agent email is passed)
    if (event.agentEmail) {
      await this.mailService.sendAgentOrderNotification(
        event.agentEmail,
        event.orderNumber,
        event.newStatus,
      );
    }
  }

  @OnEvent('campaign.launched')
  async handleCampaignLaunchedEvent(event: CampaignLaunchedEvent) {
    this.logger.log(`Handling campaign.launched event for campaign: ${event.campaignId}`);
    
    // Process emails in chunks or sequentially depending on size
    await this.mailService.sendCampaignEmails(
      event.targetAudienceEmails,
      event.subject,
      event.content,
    );
  }
}
