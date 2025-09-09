import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma.service';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
})
export class MessagesModule {}
