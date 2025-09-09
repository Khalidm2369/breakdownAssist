import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    RealtimeModule,
    forwardRef(() => AuthModule), // <-- make AuthService/guards visible here
  ],
  controllers: [RequestsController],
  providers: [PrismaService, RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
