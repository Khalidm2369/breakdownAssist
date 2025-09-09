// apps/api/src/modules/tracking/tracking.controller.ts
import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtRequiredGuard } from '../auth/jwt-required.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@UseGuards(JwtRequiredGuard)
@Controller()
export class TrackingController {
  constructor(private prisma: PrismaService, private ws: RealtimeGateway) {}

  @Post('tracking/ping')
  @Roles(Role.PROVIDER, Role.ADMIN)
  async ping(@Body() dto: { requestId: string; lat: number; lng: number; speedKph?: number; headingDeg?: number; accuracyM?: number }, req: any) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: dto.requestId } });
    if (!request) throw new Error('Request not found');
    // ensure this provider is the accepted one (or admin)
    // if you store acceptedBy (userId), enforce it here.

    const ping = await this.prisma.trackingPing.create({
      data: { requestId: dto.requestId, providerId: req.userId, lat: dto.lat, lng: dto.lng, speedKph: dto.speedKph, headingDeg: dto.headingDeg, accuracyM: dto.accuracyM }
    });

    await this.prisma.serviceRequest.update({
      where: { id: dto.requestId },
      data: { lastLat: dto.lat, lastLng: dto.lng, lastPingAt: new Date() }
    });

    // broadcast to room
    this.ws.server.to(`req:${dto.requestId}`).emit('tracking.update', {
      requestId: dto.requestId, lat: dto.lat, lng: dto.lng, ts: ping.ts
    });

    return { ok: true };
  }

  @Post('tracking/phase')
  @Roles(Role.PROVIDER, Role.ADMIN)
  async setPhase(@Body() dto: { requestId: string; phase: 'EN_ROUTE'|'ARRIVED_PICKUP'|'PICKED_UP'|'IN_TRANSIT'|'ARRIVED_DROPOFF'|'COMPLETE'|'CANCELED' }) {
    const data: any = { phase: dto.phase };
    if (dto.phase === 'EN_ROUTE') data.startedAt = new Date();
    if (dto.phase === 'COMPLETE') data.completedAt = new Date();

    const updated = await this.prisma.serviceRequest.update({ where: { id: dto.requestId }, data });
    this.ws.server.to(`req:${dto.requestId}`).emit('tracking.phase', { requestId: dto.requestId, phase: dto.phase });
    return updated;
  }

  @Get('requests/:id/track')
  async getTrack(@Param('id') id: string) {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { id },
      select: { id: true, phase: true, lastLat: true, lastLng: true, lastPingAt: true, pickupLat: true, pickupLng: true, dropoffLat: true, dropoffLng: true }
    });
    if (!req) throw new Error('Not found');

    const pings = await this.prisma.trackingPing.findMany({ where: { requestId: id }, orderBy: { ts: 'desc' }, take: 100 });
    const etaMin = estimateETA(req, pings); // implement simple haversine/speed fallback

    return { request: req, etaMin, pings: pings.reverse() };
  }
}

// simple ETA fallback
function estimateETA(req: any, pings: any[]): number | null {
  if (!req?.lastLat || !req?.lastLng) return null;
  const target = req.phase && ['EN_ROUTE','ARRIVED_PICKUP'].includes(req.phase) ? { lat: req.pickupLat, lng: req.pickupLng } : { lat: req.dropoffLat, lng: req.dropoffLng };
  if (!target?.lat || !target?.lng) return null;

  const dKm = haversineKm(req.lastLat, req.lastLng, target.lat, target.lng);
  // use last 3 pings avg speed if available, else 40 km/h default
  const speeds = pings.slice(-3).map(p => p.speedKph).filter(Boolean) as number[];
  const v = speeds.length ? (speeds.reduce((a,b)=>a+b,0)/speeds.length) : 40;
  return Math.max(1, Math.round((dKm / Math.max(5, v)) * 60)); // cap min speed 5km/h
}
function haversineKm(lat1:number,lng1:number,lat2:number,lng2:number){const R=6371;const dLat=(lat2-lat1)*Math.PI/180;const dLng=(lng2-lng1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(a));}
