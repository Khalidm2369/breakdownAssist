import { Controller, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import Stripe from 'stripe';

@UseGuards(RolesGuard)
@Controller('provider/stripe')
export class ProviderStripeController {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

  constructor(private prisma: PrismaService) {}

  @Post('connect')
  @Roles(Role.PROVIDER, Role.ADMIN)
  async connect(req: any) {
    const userId = req.userId;
    let provider = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!provider?.connectAccount) {
      const acct = await this.stripe.accounts.create({ type: 'standard', country: process.env.STRIPE_COUNTRY || 'GB' });
      provider = await this.prisma.providerProfile.upsert({
        where: { userId }, update: { connectAccount: acct.id }, create: { userId, connectAccount: acct.id }
      });
    }
    const link = await this.stripe.accountLinks.create({
      account: provider.connectAccount!,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/provider/onboarding`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/provider`,
      type: 'account_onboarding',
    });
    return { url: link.url };
  }
}
