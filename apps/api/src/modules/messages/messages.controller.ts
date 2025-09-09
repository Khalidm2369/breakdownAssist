import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('requests/:id/messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}
  @Get() list(@Param('id') id: string) { return this.svc.list(id); }
  @Post() send(
    @Param('id') id: string,
    @Body() body: { from: 'customer'|'provider'; text: string }
  ) {
    return this.svc.send(id, body.from, body.text);
  }
}
