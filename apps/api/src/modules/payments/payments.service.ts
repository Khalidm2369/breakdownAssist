import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

const API_VERSION: Stripe.LatestApiVersion = '2024-06-20';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor() {
    const sk = process.env.STRIPE_SECRET_KEY || '';
    if (!sk.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY is missing or not a secret key (sk_...)');
    }
    this.stripe = new Stripe(sk, { apiVersion: API_VERSION });
  }

  async createIntent(amountCents: number, currency = process.env.STRIPE_CURRENCY || 'eur') {
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      throw new BadRequestException('amountCents must be >= 50');
    }
    const pi = await this.stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: pi.client_secret };
  }
}
