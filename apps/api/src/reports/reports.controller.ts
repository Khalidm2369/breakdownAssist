import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

function parseDate(d?: string) {
  return d ? new Date(d) : undefined;
}

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('revenue')
  async revenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const gte = parseDate(from);
    const lt  = parseDate(to);

    const where = {
      paidAt: {
        ...(gte ? { gte } : {}),
        ...(lt  ? { lt } : {}),
      },
    };

    const jobs = await this.prisma.job.findMany({ where });

    const totals = jobs.reduce(
      (acc, j) => {
        acc.count += 1;
        acc.gmvCents += j.totalCents ?? 0;
        acc.revenueCents += j.platformFeeCents ?? 0;
        return acc;
      },
      { count: 0, gmvCents: 0, revenueCents: 0 },
    );

    return {
      from: gte ?? null,
      to: lt ?? null,
      jobs: totals.count,
      gmvCents: totals.gmvCents,
      revenueCents: totals.revenueCents,
    };
  }
}
