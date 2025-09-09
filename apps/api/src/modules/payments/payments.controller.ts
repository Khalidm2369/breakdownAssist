import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}
  @Post('intent')
  intent(@Body() body: { amountCents: number }) {
    return this.svc.createIntent(Number(body.amountCents));
  }
}
