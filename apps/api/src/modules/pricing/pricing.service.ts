import { Injectable } from '@nestjs/common';

type Priority = 'standard' | 'sameday' | 'express';

function haversineKm(a: {lat:number,lng:number}, b:{lat:number,lng:number}) {
  const R = 6371; // km
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const la1 = a.lat * Math.PI/180;
  const la2 = b.lat * Math.PI/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

@Injectable()
export class PricingService {
  // env-tunable knobs with safe defaults
  private currency = process.env.STRIPE_CURRENCY?.toLowerCase() || 'eur';
  private perKmCents = Number(process.env.PRICING_BASE_PER_KM_CENTS ?? 120); // €1.20/km
  private baseFeeCents = Number(process.env.PRICING_BASE_FEE_CENTS ?? 300); // €3 pickup
  private minCents = Number(process.env.PRICING_MIN_CENTS ?? 800);          // €8 minimum
  private kgPerCents = Number(process.env.PRICING_PER_KG_CENTS ?? 5);       // +€0.05/kg
  private fragilePct = Number(process.env.PRICING_FRAGILE_PCT ?? 10);       // +10%
  private crossBorderPct = Number(process.env.PRICING_CROSS_BORDER_PCT ?? 8); // +8%
  private platformPct = Number(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE ?? 5);

  // priority multipliers
  private priorityMult(p: Priority) {
    switch (p) {
      case 'sameday': return 1.15;
      case 'express': return 1.30;
      default: return 1.0;
    }
  }

  estimate(params: {
    // you can pass either coords or just cities & country codes
    pickup: { lat?: number; lng?: number; city?: string; country?: string };
    dropoff:{ lat?: number; lng?: number; city?: string; country?: string };
    weightKg?: number;
    fragile?: boolean;
    priority?: Priority;
    distanceKmOverride?: number; // if the client already measured via Maps
  }) {
    const priority = params.priority ?? 'standard';
    const weightKg = Math.max(0, Math.round(params.weightKg ?? 0));
    const fragile = !!params.fragile;

    // Distance
    let km = Math.max(
      0,
      Number.isFinite(params.distanceKmOverride!) ? Number(params.distanceKmOverride) : (
        (params.pickup.lat && params.pickup.lng && params.dropoff.lat && params.dropoff.lng)
          ? haversineKm({lat: params.pickup.lat!, lng: params.pickup.lng!}, {lat: params.dropoff.lat!, lng: params.dropoff.lng!})
          : 10 // conservative fallback if we have only city names
      )
    );

    // cross-border heuristic: different country codes -> surcharge
    const crossBorder = params.pickup.country && params.dropoff.country
      ? params.pickup.country !== params.dropoff.country
      : false;

    // Base pricing
    const distanceCents = Math.round(km * this.perKmCents);
    const weightCents = Math.round(weightKg * this.kgPerCents);
    let subtotal = this.baseFeeCents + distanceCents + weightCents;

    if (fragile) subtotal = Math.round(subtotal * (1 + this.fragilePct/100));
    if (crossBorder) subtotal = Math.round(subtotal * (1 + this.crossBorderPct/100));
    subtotal = Math.round(subtotal * this.priorityMult(priority));
    if (subtotal < this.minCents) subtotal = this.minCents;

    const platformFeeCents = Math.round(subtotal * (this.platformPct / 100));
    const totalCents = subtotal + platformFeeCents;

    return {
      currency: this.currency,
      distanceKm: Number(km.toFixed(1)),
      subtotalCents: subtotal,
      platformFeeCents,
      totalCents,
      knobs: {
        perKmCents: this.perKmCents,
        baseFeeCents: this.baseFeeCents,
        minCents: this.minCents,
        kgPerCents: this.kgPerCents,
        fragilePct: this.fragilePct,
        crossBorderPct: this.crossBorderPct,
        priorityMult: this.priorityMult(priority),
        platformPct: this.platformPct,
      },
    };
  }
}
