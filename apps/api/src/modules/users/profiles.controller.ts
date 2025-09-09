import { Body, Controller, Get, Put, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// We use string roles because the DB (SQLite) doesn't support Prisma enums.

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

// ----- FLEET MANAGER -----
  @Get('fleet')
  @Roles('FLEET_MANAGER', 'ADMIN')
  getFleet(@Req() req: any) {
    return this.prisma.fleetProfile.findUnique({
      where: { userId: req.userId },
    });
  }

  @Put('fleet')
  @Roles('FLEET_MANAGER', 'ADMIN')
  upFleet(@Body() dto: any, @Req() req: any) {
    return this.prisma.fleetProfile.upsert({
      where: { userId: req.userId },
      update: dto,
      create: { userId: req.userId, ...dto },
    });
  }
}
