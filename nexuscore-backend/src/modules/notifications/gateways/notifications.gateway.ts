import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/nexuscore',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('[NexusCore] Gateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized at /nexuscore');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      await client.join(`user_${userId}`);
      this.logger.log(`Client connected: ${client.id} → user_${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_order_room')
  handleJoinOrderRoom(client: Socket, orderId: string) {
    client.join(`order_${orderId}`);
    return { event: 'joined_room', data: `order_${orderId}` };
  }

  @SubscribeMessage('leave_order_room')
  handleLeaveOrderRoom(client: Socket, orderId: string) {
    client.leave(`order_${orderId}`);
  }

  // ── Emit helpers (called by services) ────────────────────────────────────────

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  emitToOrderRoom(orderId: string, event: string, data: any) {
    this.server.to(`order_${orderId}`).emit(event, data);
  }

  broadcastBpmUpdate(data: any) {
    this.server.emit('bpm.task.updated', data);
  }

  broadcastOrderStatus(orderId: string, status: string) {
    this.emitToOrderRoom(orderId, 'order.status.changed', { orderId, status });
  }
}
