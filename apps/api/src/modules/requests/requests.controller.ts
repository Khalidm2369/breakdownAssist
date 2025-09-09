import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';

@UseGuards(JwtOptionalGuard) // injects req.userId if Authorization is present; otherwise leaves it undefined
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requests: RequestsService,
    private readonly rt: RealtimeGateway,
  ) {}

  @Get()
  list() {
    return this.requests.list();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    // optional helper if you need it later
    return this.requests.getOne?.(id) ?? this.requests.list(); // keep simple if getOne not implemented
  }

  @Post()
  async create(@Body() dto: any, @Req() req: any) {
    // FIX: inject request, then pass req.userId to the service (it can be undefined)
    const created = await this.requests.create(dto, req?.userId);
    this.rt.emit('request.created', created);
    return created;
  }
}