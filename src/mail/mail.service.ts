import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
  ) { }

  // Resolves the frontend URL from tenant settings (set by admin in platform),
  // falling back to FRONTEND_URL env var, then localhost.
  private async resolveFrontendUrl(tenantId?: string): Promise<string> {
    if (tenantId) {
      try {
        const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
        const configured = tenant?.settings?.frontendUrl;
        if (configured && configured.startsWith('http')) return configured.replace(/\/$/, '');
      } catch { /* ignore */ }
    }
    return this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    password: string,
    verificationToken: string,
    tenantId?: string,
  ) {
    const baseUrl = await this.resolveFrontendUrl(tenantId);
    const apiBase = this.configService.get('API_BASE_URL') || baseUrl.replace('5173', '3001/api/v1');
    const verificationUrl = `${apiBase}/auth/verify-email?token=${verificationToken}`;
    const loginUrl = `${baseUrl}/login`;

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

  async sendOrderUpdateEmail(email: string, orderNumber: string, status: string, name?: string, tenantId?: string) {
    const baseUrl = await this.resolveFrontendUrl(tenantId);
    const loginUrl = `${baseUrl}/login`;

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

  async sendAgentOrderNotification(agentEmail: string, orderNumber: string, status: string, tenantId?: string) {
    const baseUrl = await this.resolveFrontendUrl(tenantId);
    const loginUrl = `${baseUrl}/login`;

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

  async sendAgentApplicationEmail(
    email: string,
    fullName: string,
    decision: 'approved' | 'rejected',
    notes?: string,
    tenantId?: string,
  ) {
    const baseUrl = await this.resolveFrontendUrl(tenantId);
    const firstName = fullName.split(' ')[0];
    const subject = decision === 'approved'
      ? '¡Felicitaciones! Tu solicitud como agente TeVra fue aprobada'
      : 'Actualización sobre tu solicitud como agente TeVra';

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: './agent-application',
      context: {
        firstName,
        fullName,
        decision,
        notes: notes || null,
        loginUrl: `${baseUrl}/login`,
        applyUrl: `${baseUrl}/agentes`,
      },
    });
    this.logger.log(`Agent application ${decision} email sent to ${email}`);
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

  async sendContactFormEmail(name: string, senderEmail: string, subject: string, message: string) {
    const supportEmail = this.configService.get<string>('SUPPORT_EMAIL', this.configService.get<string>('MAIL_USER', 'tevrallc@gmail.com'));
    await this.mailerService.sendMail({
      to: supportEmail,
      replyTo: senderEmail,
      subject: `[Contacto] ${subject}`,
      template: './contact',
      context: { name, senderEmail, subject, message },
    });
    this.logger.log(`Contact form email from ${senderEmail} sent to ${supportEmail}`);
  }

  async sendGenericEmail(email: string, subject: string, htmlContent: string) {
    await this.mailerService.sendMail({
      to: email,
      subject,
      html: htmlContent, // Using direct html instead of template for generic emails
    });
    this.logger.log(`Generic email sent to ${email}`);
  }
}
