import { Body, Controller, Param, Post } from '@nestjs/common';
import { BidsService } from './bids.service';

@Controller('requests/:id/bids')
export class BidsController {
  constructor(private readonly svc: BidsService) {}
  @Post()
  create(
    @Param('id') id: string,
    @Body() body: { priceCents: number; etaMin: number },
  ) {
    return this.svc.create(id, Number(body.priceCents), Number(body.etaMin));
  }
}

@Controller('requests/:id/accept')
export class AcceptController {
  constructor(private readonly svc: BidsService) {}
  @Post()
  accept(@Param('id') id: string, @Body() body: { offerId: string }) {
    return this.svc.accept(id, body.offerId);
  }
}
