import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { getDatabaseConfig } from './config/database.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CommissionsModule } from './commissions/commissions.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StorageModule } from './storage/storage.module';
import { MailModule } from './mail/mail.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: getDatabaseConfig,
        }),
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ([{
                ttl: config.get('THROTTLE_TTL', 60000),
                limit: config.get('THROTTLE_LIMIT', 100),
            }]),
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        EventEmitterModule.forRoot(),
        TenantsModule,
        UsersModule,
        AuthModule,
        AgentsModule,
        ProductsModule,
        OrdersModule,
        PaymentsModule,
        ShipmentsModule,
        ReviewsModule,
        CampaignsModule,
        CommissionsModule,
        MediaModule,
        NotificationsModule,
        AnalyticsModule,
        StorageModule,
        MailModule,
        WhatsAppModule,
    ],
})
export class AppModule { }
