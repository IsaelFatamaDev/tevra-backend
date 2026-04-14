import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailListener } from './mail.listener';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST', 'smtp.gmail.com'),
          port: config.get('MAIL_PORT', 587),
          secure: config.get('MAIL_SECURE', false),
          auth: {
            user: config.get('MAIL_USER', 'tevrallc@gmail.com'),
            pass: config.get('MAIL_PASSWORD', 'pcqa uwiq enpe rxar'),
          },
        },
        defaults: {
          from: `"TeVra" <${config.get('MAIL_FROM', 'tevrallc@gmail.com')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, MailListener],
  exports: [MailService, MailerModule],
})
export class MailModule { }
