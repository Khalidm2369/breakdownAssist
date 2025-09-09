import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MeController } from './me.controller';
import { ProfilesController } from './profiles.controller';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [MeController, ProfilesController],
  providers: [PrismaService, AuthService],
})
export class UsersModule {}
