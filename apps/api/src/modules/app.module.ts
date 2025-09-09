import { Module } from '@nestjs/common';

// NOTE: app.module.ts is in src/modules/, PrismaService is in src/
// so we go up one directory:
import { PrismaService } from '../prisma.service';

import { RealtimeModule } from '../realtime/realtime.module';

// Feature modules (these are siblings of app.module.ts under src/modules)
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
    RealtimeModule,
    RequestsModule,
    BidsModule,
    MessagesModule,
    PaymentsModule,
    UsersModule,
  ],
  controllers: [PricingController],
  providers: [PrismaService, PricingService],
})
export class AppModule {}
