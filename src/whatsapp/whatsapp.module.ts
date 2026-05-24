import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { ChatGateway } from './chat.gateway';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';

@Global()
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([WhatsAppMessage])
  ],
  providers: [WhatsAppService, ChatGateway],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, ChatGateway],
})
export class WhatsAppModule {}
