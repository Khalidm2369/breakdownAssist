import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Use a stable “demo” user so unauthenticated requests can still be created */
  private async ensureDemoCustomerId(): Promise<string> {
    const demo = await this.prisma.user.upsert({
      where: { email: 'demo@viabolt.local' },
      update: {},
      create: {
        email: 'demo@viabolt.local',
        name: 'Demo Customer',
        // add passwordHash/roles here if your schema requires them
      },
    });
    return demo.id;
  }

  /** List latest requests first */
  async list() {
    return this.prisma.serviceRequest.findMany({
      // FIX: use `createdAt` (or `id`) — your model has no `ts` field
      orderBy: { createdAt: 'desc' }, // if you don't have createdAt, change to: { id: 'desc' }
      include: { offers: true, messages: true },
    });
  }

  /** Create a new request, always connecting a customer (logged-in or demo) */
  async create(dto: any, userId?: string) {
    const kind = String(dto.kind || 'BREAKDOWN').toUpperCase();
    const title =
      dto.title ??
      (kind === 'DELIVERY'
        ? `${dto.pickup ?? 'Pickup?'} → ${dto.dropoff ?? 'Drop-off?'}`
        : `${kind} request`);

    const customerId = userId ?? (await this.ensureDemoCustomerId());

    const created = await this.prisma.serviceRequest.create({
      data: {
        kind,
        title,
        pickup: dto.pickup ?? null,
        dropoff: dto.dropoff ?? null,
        status: 'OPEN',
        // FIX: required relation satisfied
        customer: { connect: { id: customerId } },
      },
      include: { offers: true, messages: true },
    });

    return created;
  }
}