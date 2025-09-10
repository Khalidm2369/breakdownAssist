import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma.service';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const CURRENCY = (process.env.STRIPE_CURRENCY || 'eur').toLowerCase();

@Injectable()
export class PaymentsService {
  private stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });

  constructor(private prisma: PrismaService) {}

  async createIntent(amountCents: number, jobId?: string) {
    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: CURRENCY,
      // If you use Connect with destination charges, also set transfer/application_fee here.
      metadata: jobId ? { jobId } : {},
      automatic_payment_methods: { enabled: true },
    });

    if (jobId) {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { stripePaymentIntentId: intent.id },
      });
    }

    return { clientSecret: intent.client_secret };
  }
}
