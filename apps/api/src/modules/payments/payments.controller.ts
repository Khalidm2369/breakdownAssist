import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('intent')
  async createIntent(@Body() body: { amountCents: number; jobId?: string }) {
    return this.payments.createIntent(body.amountCents, body.jobId);
  }
}
