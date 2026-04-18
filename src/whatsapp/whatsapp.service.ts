import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

  /**
   * Create a WhatsApp instance in Evolution API
   */
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

  /**
   * Get QR code to connect WhatsApp
   */
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

  /**
   * Check connection status of the WhatsApp instance
   */
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

  /**
   * Send a text message via WhatsApp
   * @param phone Phone number with country code (e.g. "5511999999999")
   * @param text Message text
   */
  async sendText(phone: string, text: string): Promise<any> {
    try {
      // Normalize phone: remove spaces, dashes, plus, etc.
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
      return data;
    } catch (error) {
      this.logger.warn(`Failed to send WhatsApp to ${phone}: ${error.message}`);
      // Don't throw — WhatsApp is a secondary channel; we should not block flows
      return null;
    }
  }

  /**
   * Disconnect (logout) the WhatsApp instance
   */
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
}
