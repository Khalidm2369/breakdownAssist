import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtRequiredGuard } from '../auth/jwt-required.guard';

@UseGuards(JwtRequiredGuard)
@Controller('me')
export class MeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async me(@Req() req: any) {
    // JwtRequiredGuard puts userId on req
    const userId = req?.userId as string | undefined;
    if (!userId) {
      // should never happen with the guard, but makes the error safe
      return { ok: false, error: 'Missing user' };
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        roles: { select: { role: true } }, // ['CUSTOMER','PROVIDER',...]
        Customer: { select: { stripeCustId: true } },
        Provider: { select: { businessName: true, services: true, connectAccount: true } },
        Fleet: { select: { orgName: true } },
      },
    });
  }

  @Patch()
  async update(@Body() dto: { name?: string }, @Req() req: any) {
    const userId = req?.userId as string;
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto?.name ?? undefined },
      select: { id: true, email: true, name: true },
    });
  }
}
