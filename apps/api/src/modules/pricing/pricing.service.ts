// apps/api/src/modules/pricing/pricing.service.ts
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
  private currency = process.env.STRIPE_CURRENCY?.toLowerCase() || 'eur';

  // sensible defaults (override via env to tune)
  private baseFeeCents = Number(process.env.PRICING_BASE_FEE_CENTS ?? 300);    // €3 pickup
  private minCents     = Number(process.env.PRICING_MIN_CENTS ?? 1200);        // €12 minimum
  private kgPerCents   = Number(process.env.PRICING_PER_KG_CENTS ?? 2);        // +€0.02/kg
  private fragilePct   = Number(process.env.PRICING_FRAGILE_PCT ?? 5);         // +5%
  private crossBorderPct = Number(process.env.PRICING_CROSS_BORDER_PCT ?? 5);  // +5%
  private platformPct  = Number(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE ?? 7);

  // soft cap to keep long-haul sensible (override if needed)
  private capCents     = Number(process.env.PRICING_CAP_CENTS ?? 60000);       // default cap ~€600

  // tiered per-km cents -> much cheaper at long distances
  private tieredKmCents(km: number) {
    const n = Math.max(0, km);
    const t1 = Math.min(n, 10) * 100;                     // 0–10 km @ €1.00/km
    const t2 = Math.min(Math.max(n - 10, 0), 40) * 70;    // 10–50 km @ €0.70/km
    const t3 = Math.min(Math.max(n - 50, 0), 130) * 55;   // 50–180 km @ €0.55/km
    const t4 = Math.max(n - 180, 0) * 45;                 // 180+ km @ €0.45/km
    return Math.round(t1 + t2 + t3 + t4);
  }

  private priorityMult(p: Priority) {
    switch (p) {
      case 'sameday': return 1.12;
      case 'express': return 1.25;
      default: return 1.0;
    }
  }

  estimate(params: {
    pickup: { lat?: number; lng?: number; city?: string; country?: string };
    dropoff:{ lat?: number; lng?: number; city?: string; country?: string };
    weightKg?: number;
    fragile?: boolean;
    priority?: Priority;
    distanceKmOverride?: number; // optional
  }) {
    const priority = params.priority ?? 'standard';
    const weightKg = Math.max(0, Math.round(params.weightKg ?? 0));
    const fragile = !!params.fragile;

    // Distance (fallback to 10 km when we only have city names)
    let km = Number.isFinite(params.distanceKmOverride!)
      ? Number(params.distanceKmOverride)
      : (params.pickup.lat && params.pickup.lng && params.dropoff.lat && params.dropoff.lng)
        ? haversineKm({lat: params.pickup.lat!, lng: params.pickup.lng!}, {lat: params.dropoff.lat!, lng: params.dropoff.lng!})
        : 10;

    km = Math.max(0, km);
    const crossBorder = params.pickup.country && params.dropoff.country
      ? params.pickup.country !== params.dropoff.country
      : false;

    // Tiered distance cost + add-ons
    const distanceCents = this.tieredKmCents(km);
    const weightCents   = Math.round(weightKg * this.kgPerCents);

    let subtotal = this.baseFeeCents + distanceCents + weightCents;
    if (fragile)    subtotal = Math.round(subtotal * (1 + this.fragilePct/100));
    if (crossBorder)subtotal = Math.round(subtotal * (1 + this.crossBorderPct/100));
    subtotal = Math.round(subtotal * this.priorityMult(priority));
    if (subtotal < this.minCents) subtotal = this.minCents;

    // hard safety cap for UX sanity (you can remove if you want)
    subtotal = Math.min(subtotal, this.capCents);

    const platformFeeCents = Math.round(subtotal * (this.platformPct / 100));
    const totalCents = subtotal + platformFeeCents;

    return {
      currency: this.currency,
      distanceKm: Number(km.toFixed(1)),
      subtotalCents: subtotal,
      platformFeeCents,
      totalCents,
      knobs: {
        baseFeeCents: this.baseFeeCents,
        minCents: this.minCents,
        kgPerCents: this.kgPerCents,
        fragilePct: this.fragilePct,
        crossBorderPct: this.crossBorderPct,
        platformPct: this.platformPct,
        capCents: this.capCents,
        priorityMult: this.priorityMult(priority),
      },
    };
  }
}
