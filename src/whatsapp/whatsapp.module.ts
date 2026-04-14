import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WhatsAppService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
