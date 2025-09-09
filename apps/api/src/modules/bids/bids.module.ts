import { Module } from '@nestjs/common';
import { BidsController, AcceptController } from './bids.controller';
import { BidsService } from './bids.service';
import { PrismaService } from '../../prisma.service';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [BidsController, AcceptController],
  providers: [BidsService, PrismaService],
})
export class BidsModule {}
