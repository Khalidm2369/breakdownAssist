import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'ViaBolt API',
      time: new Date().toISOString(),
      routes: ['/requests', '/requests/:id/bids', '/requests/:id/messages']
    };
  }
}
