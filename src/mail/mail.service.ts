import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    password: string,
    verificationToken: string,
  ) {
    const verificationUrl = `https://tevra.ddns.net/api/v1/auth/verify-email?token=${verificationToken}`;
    const loginUrl = 'https://tevra.ddns.net/login';

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to TeVra — Verify Your Account',
      template: './welcome',
      context: {
        firstName,
        email,
        password,
        verificationUrl,
        loginUrl,
      },
    });
    this.logger.log(`Welcome email sent to ${email}`);
  }

  async sendOrderUpdateEmail(email: string, orderNumber: string, status: string, name?: string) {
    const loginUrl = 'https://tevra.ddns.net/login';

    await this.mailerService.sendMail({
      to: email,
      subject: `Order Update: ${orderNumber}`,
      template: './order-update',
      context: {
        name,
        orderNumber,
        status,
        loginUrl,
      },
    });
    this.logger.log(`Order update email sent to ${email} for order ${orderNumber}`);
  }

  async sendAgentOrderNotification(agentEmail: string, orderNumber: string, status: string) {
    const loginUrl = 'https://tevra.ddns.net/login';

    await this.mailerService.sendMail({
      to: agentEmail,
      subject: `Assigned Order Update: ${orderNumber}`,
      template: './order-update',
      context: {
        name: 'TeVra Agent',
        orderNumber,
        status,
        loginUrl,
      },
    });
    this.logger.log(`Agent notification sent to ${agentEmail} for order ${orderNumber}`);
  }

  async sendCampaignEmails(emails: string[], subject: string, content: string) {
    const promises = emails.map(email =>
      this.mailerService.sendMail({
        to: email,
        subject: subject,
        template: './campaign',
        context: {
          content,
        },
      })
    );
    await Promise.all(promises);
    this.logger.log(`Campaign emails sent to ${emails.length} recipients`);
  }
}
