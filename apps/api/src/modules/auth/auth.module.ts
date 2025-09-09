import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtRequiredGuard } from './jwt-required.guard';
import { JwtOptionalGuard } from './jwt-optional.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [],
  controllers: [AuthController],
  providers:[
    PrismaService,     
    AuthService,
    JwtRequiredGuard,
    JwtOptionalGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtRequiredGuard,
    JwtOptionalGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
