import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
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
    this.logger.log(`Evolution API configured: ${this.baseUrl} | instance: ${this.instanceName}`);
  }

  private get headers() {
    return {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private extractError(error: any): string {
    const data = error?.response?.data;
    if (data) return JSON.stringify(data);
    return error?.message || 'Unknown error';
  }

  /**
   * Create a WhatsApp instance in Evolution API v1.8.x
   */
  async createInstance(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/instance/create`,
          {
            instanceName: this.instanceName,
            qrcode: true,
          },
          { headers: this.headers },
        ),
      );
      this.logger.log(`Instance "${this.instanceName}" created`);
      return data;
    } catch (error) {
      const msg = this.extractError(error);
      if (msg.includes('already') || msg.includes('exists') || msg.includes('use') || error?.response?.status === 403) {
        this.logger.warn(`Instance "${this.instanceName}" already exists — reusing`);
        return { status: 'already_exists', instanceName: this.instanceName };
      }
      this.logger.error(`Error creating instance: ${msg}`);
      throw new HttpException(`Evolution API error: ${msg}`, error?.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get QR code to connect WhatsApp (v1.8.x)
   */
  async getQrCode(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/instance/connect/${this.instanceName}`,
          { headers: this.headers },
        ),
      );
      this.logger.log(`QR response keys: ${JSON.stringify(Object.keys(data || {}))}`);
      return data;
    } catch (error) {
      const msg = this.extractError(error);
      this.logger.error(`Error getting QR code: ${msg}`);
      throw new HttpException(`Evolution API error: ${msg}`, error?.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Check connection status (v1.8.x)
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
      this.logger.error(`Error checking status: ${this.extractError(error)}`);
      return { instance: { state: 'close' } };
    }
  }

  /**
   * Send a text message via WhatsApp (v1.8.x format)
   */
  async sendText(phone: string, text: string): Promise<any> {
    try {
      const normalizedPhone = phone.replace(/[\s\-\+\(\)]/g, '');

      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/message/sendText/${this.instanceName}`,
          {
            number: normalizedPhone,
            textMessage: { text },
          },
          { headers: this.headers },
        ),
      );
      this.logger.log(`WhatsApp message sent to ${normalizedPhone}`);
      return data;
    } catch (error) {
      this.logger.warn(`Failed to send WhatsApp to ${phone}: ${this.extractError(error)}`);
      return null;
    }
  }

  /**
   * Disconnect (logout) the WhatsApp instance (v1.8.x)
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
      const msg = this.extractError(error);
      this.logger.error(`Error logging out: ${msg}`);
      throw new HttpException(`Evolution API error: ${msg}`, error?.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }
}
