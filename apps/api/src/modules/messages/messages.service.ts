import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  async list(requestId: string) {
    await this.ensureRequest(requestId);
    return this.prisma.message.findMany({
      where: { requestId },
      orderBy: { ts: 'asc' },
    });
  }

  async send(requestId: string, from: 'customer'|'provider', text: string) {
    await this.ensureRequest(requestId);
    const msg = await this.prisma.message.create({
      data: { requestId, from, text },
    });
    this.rt.emit('message.created', msg);
    return msg;
  }

  private async ensureRequest(id: string) {
    const found = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Request not found');
  }
}
