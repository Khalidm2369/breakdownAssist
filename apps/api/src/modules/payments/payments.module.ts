// apps/api/src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma.service';

// If you have the Stripe webhook controller in src/webhooks/stripe.controller.ts,
// you can register it here so it can also use PrismaService:
import { StripeWebhookController } from '../../webhooks/stripe.controller';

@Module({
  imports: [],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
