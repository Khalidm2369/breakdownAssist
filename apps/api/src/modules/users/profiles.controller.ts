import { Body, Controller, Get, Put, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// We use string roles because the DB (SQLite) doesn't support Prisma enums.
export const APP_ROLES = ['CUSTOMER', 'PROVIDER', 'ADMIN', 'FLEET'] as const;
export type Role = (typeof APP_ROLES)[number];

@UseGuards(RolesGuard)
@Controller('me')
export class ProfilesController {
  constructor(private prisma: PrismaService) {}

  // ----- CUSTOMER -----
  @Get('customer')
  @Roles('CUSTOMER', 'ADMIN')
  getCustomer(@Req() req: any) {
    return this.prisma.customerProfile.findUnique({
      where: { userId: req.userId },
    });
  }

  @Put('customer')
  @Roles('CUSTOMER', 'ADMIN')
  upCustomer(@Body() dto: any, @Req() req: any) {
    return this.prisma.customerProfile.upsert({
      where: { userId: req.userId },
      update: dto,
      create: { userId: req.userId, ...dto },
    });
  }

  // ----- PROVIDER -----
  @Get('provider')
  @Roles('PROVIDER', 'ADMIN')
  getProvider(@Req() req: any) {
    return this.prisma.providerProfile.findUnique({
      where: { userId: req.userId },
    });
  }

  @Put('provider')
  @Roles('PROVIDER', 'ADMIN')
  upProvider(@Body() dto: any, @Req() req: any) {
    return this.prisma.providerProfile.upsert({
      where: { userId: req.userId },
      update: dto,
      create: { userId: req.userId, ...dto },
    });
  }

  // ----- FLEET -----
  // NOTE: use 'FLEET' (not 'FLEET_MANAGER') to match the rest of the app.
  @Get('fleet')
  @Roles('FLEET', 'ADMIN')
  getFleet(@Req() req: any) {
    return this.prisma.fleetProfile.findUnique({
      where: { userId: req.userId },
    });
  }

  @Put('fleet')
  @Roles('FLEET', 'ADMIN')
  upFleet(@Body() dto: any, @Req() req: any) {
    return this.prisma.fleetProfile.upsert({
      where: { userId: req.userId },
      update: dto,
      create: { userId: req.userId, ...dto },
    });
  }
}
