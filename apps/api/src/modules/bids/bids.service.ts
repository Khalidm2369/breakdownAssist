import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  async create(requestId: string, priceCents: number, etaMin: number) {
    const req = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');

    if (!Number.isFinite(priceCents) || priceCents < 50) {
      throw new BadRequestException('priceCents must be >= 50');
    }
    if (!Number.isFinite(etaMin) || etaMin <= 0) {
      throw new BadRequestException('etaMin must be > 0');
    }

    const offer = await this.prisma.offer.create({
      data: {
        requestId,
        provider: 'Demo Provider',
        priceCents: Math.round(priceCents),
        etaMin: Math.round(etaMin),
      },
    });

    this.rt.emit('offer.created', { requestId, offer });
    return offer;
  }

  async accept(requestId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.requestId !== requestId) {
      throw new NotFoundException('Offer not found for this request');
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED', acceptedBy: offer.provider },
      include: { offers: true, messages: true },
    });

    this.rt.emit('request.accepted', updated);
    return updated;
  }
}
