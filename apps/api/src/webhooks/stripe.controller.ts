import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!; // set in env
const PLATFORM_PCT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE ?? 7);

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });

  constructor(private prisma: PrismaService) {}

  @Post()
  async handle(
    @Req() req: any,                      // raw buffer available
    @Headers('stripe-signature') sig: string,
    @Res() res: any,
  ) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // We care about successful payment — use PaymentIntent as source of truth
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;

      // Prefer application_fee_amount if using Connect destination charges.
      // Fallback to % calc if not present.
      const amount = (pi.amount_received ?? pi.amount) || 0; // cents
      const feeFromStripe =
        // @ts-ignore
        (pi.latest_charge as any)?.application_fee_amount as number | undefined;

      const jobId = (pi.metadata?.jobId as string | undefined) ?? null;

      // If we didn’t get jobId from metadata, try to find by PI id.
      let job = jobId
        ? await this.prisma.job.findUnique({ where: { id: jobId } })
        : await this.prisma.job.findFirst({ where: { stripePaymentIntentId: pi.id } });

      if (!job) {
        // nothing to update, but acknowledge
        return res.json({ received: true, note: 'no matching job' });
      }

      const platformFeeCents =
        typeof feeFromStripe === 'number' && feeFromStripe >= 0
          ? feeFromStripe
          : Math.round(amount * (PLATFORM_PCT / 100));

      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          totalCents: amount,
          platformFeeCents,
          paidAt: new Date(),
        },
      });
    }

    return res.json({ received: true });
  }
}
