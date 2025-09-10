import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Prisma
import { PrismaService } from '../prisma.service';

// Realtime / feature modules
import { RealtimeModule } from '../realtime/realtime.module';
import { RequestsModule } from './requests/requests.module';
import { BidsModule } from './bids/bids.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

// Pricing (controller + service)
import { PricingController } from './pricing/pricing.controller';
import { PricingService } from './pricing/pricing.service';

@Module({
  imports: [
    // Make env vars available app-wide (loads .env automatically)
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // envFilePath: ['.env', '.env.local'], // uncomment if you keep multiple files
    }),

    // Feature modules
    RealtimeModule,
    RequestsModule,
    BidsModule,
    MessagesModule,
    PaymentsModule, // contains /webhooks/stripe
    UsersModule,
    // ReportsModule, // <-- add later when you build /reports/revenue
  ],
  controllers: [PricingController],
  providers: [PrismaService, PricingService],
  exports: [PrismaService],
})
export class AppModule {}
