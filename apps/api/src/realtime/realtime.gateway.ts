import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer() server!: Server;

  emit(event: string, payload: any) {
    try {
      this.server.emit(event, payload);
    } catch {
      // silent fail if gateway not ready; REST still works
    }
  }
}
