import { Body, Controller, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private pricing: PricingService) {}

  @Post('estimate')
  estimate(@Body() body: {
    pickup: { lat?: number; lng?: number; city?: string; country?: string };
    dropoff:{ lat?: number; lng?: number; city?: string; country?: string };
    weightKg?: number;
    fragile?: boolean;
    priority?: 'standard'|'sameday'|'express';
    distanceKmOverride?: number;
  }) {
    return this.pricing.estimate(body);
  }
}
