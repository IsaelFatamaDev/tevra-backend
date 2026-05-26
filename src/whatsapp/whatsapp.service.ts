import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(WhatsAppMessage)
    private readonly messageRepo: Repository<WhatsAppMessage>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    this.baseUrl = this.configService.get('EVOLUTION_API_URL', 'http://localhost:9095');
    this.apiKey = this.configService.get('EVOLUTION_API_KEY', '');
    this.instanceName = this.configService.get('EVOLUTION_INSTANCE_NAME', 'tevra-whatsapp');
  }

  private get headers() {
    return {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  
  async createInstance(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/instance/create`,
          {
            instanceName: this.instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          },
          { headers: this.headers },
        ),
      );
      this.logger.log(`Instance "${this.instanceName}" created successfully`);
      return data;
    } catch (error) {
      this.logger.error(`Error creating instance: ${error.message}`);
      throw error;
    }
  }

  
  async getQrCode(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/instance/connect/${this.instanceName}`,
          { headers: this.headers },
        ),
      );
      return data;
    } catch (error) {
      this.logger.error(`Error getting QR code: ${error.message}`);
      throw error;
    }
  }

  
  async getConnectionStatus(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/instance/connectionState/${this.instanceName}`,
          { headers: this.headers },
        ),
      );
      return data;
    } catch (error) {
      this.logger.error(`Error checking connection status: ${error.message}`);
      throw error;
    }
  }

  
  async sendText(phone: string, text: string, tenantId?: string): Promise<any> {
    try {
      
      const normalizedPhone = phone.replace(/[\s\-\+\(\)]/g, '');

      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/message/sendText/${this.instanceName}`,
          {
            number: normalizedPhone,
            text: text,
          },
          { headers: this.headers },
        ),
      );
      this.logger.log(`WhatsApp message sent to ${normalizedPhone}`);

      if (tenantId) {
        const savedMsg = await this.messageRepo.save({
          tenantId,
          phoneNumber: normalizedPhone,
          text,
          isFromAdmin: true,
          messageId: data?.key?.id || `local-${Date.now()}`,
          isRead: true,
        });
        // Broadcast to admin frontend so the sender's UI updates
        this.chatGateway.emitMessageToAdmins(tenantId, savedMsg);
      }

      return data;
    } catch (error) {
      this.logger.warn(`Failed to send WhatsApp to ${phone}: ${error.message}`);
      
      return null;
    }
  }

  
  async logout(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/instance/logout/${this.instanceName}`,
          { headers: this.headers },
        ),
      );
      this.logger.log(`Instance "${this.instanceName}" logged out`);
      return data;
    } catch (error) {
      this.logger.error(`Error logging out: ${error.message}`);
      throw error;
    }
  }

  
  async handleWebhook(payload: any, tenantId: string): Promise<void> {
    const eventName = payload.event?.toLowerCase();
    if (eventName === 'messages.upsert' || eventName === 'messages.update') {
      let messages = [];
      if (Array.isArray(payload.data?.messages)) {
        messages = payload.data.messages; 
      } else if (payload.data?.key) {
        messages = [payload.data]; 
      } else if (Array.isArray(payload.data)) {
        messages = payload.data; 
      }

      for (const msg of messages) {
        
        if (msg.key?.fromMe) continue;

        const senderPhone = msg.key.remoteJid?.split('@')[0];
        if (!senderPhone || senderPhone.includes('status')) continue;

        let text = '';
        if (msg.message?.conversation) text = msg.message.conversation;
        else if (msg.message?.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
        
        if (!text) continue; // Only text supported for now

        const savedMsg = await this.messageRepo.save({
          tenantId,
          phoneNumber: senderPhone,
          text,
          isFromAdmin: false,
          messageId: msg.key.id,
          isRead: false,
        });

        // Broadcast to admin frontend
        this.chatGateway.emitMessageToAdmins(tenantId, savedMsg);
      }
    }
  }

  /**
   * Get messages for a tenant, grouped by conversation
   */
  async getConversations(tenantId: string) {
    // A raw query to get the latest message per phone number
    const subQuery = this.messageRepo
      .createQueryBuilder('wm')
      .select('wm.phoneNumber')
      .addSelect('MAX(wm.createdAt)', 'maxDate')
      .where('wm.tenantId = :tenantId', { tenantId })
      .groupBy('wm.phoneNumber');

    const conversations = await this.messageRepo
      .createQueryBuilder('m')
      .innerJoin(`(${subQuery.getQuery()})`, 'last_msg', 'm.phoneNumber = last_msg."wm_phoneNumber" AND m.createdAt = last_msg."maxDate"')
      .setParameters(subQuery.getParameters())
      .orderBy('m.createdAt', 'DESC')
      .getMany();

    return conversations;
  }

  async getMessagesByPhone(tenantId: string, phoneNumber: string) {
    return this.messageRepo.find({
      where: { tenantId, phoneNumber },
      order: { createdAt: 'ASC' },
    });
  }

  async markAsRead(tenantId: string, phoneNumber: string) {
    await this.messageRepo.update({ tenantId, phoneNumber, isRead: false }, { isRead: true });
  }
}
