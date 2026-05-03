import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Lock this down to your frontend URL in production
  },
  namespace: '/reviews',
})
export class ReviewsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ReviewsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Client sends { propertyId } to subscribe to a property's reviews room
  @SubscribeMessage('join:property')
  handleJoinProperty(
    @MessageBody() data: { propertyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `property:${data.propertyId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave:property')
  handleLeaveProperty(
    @MessageBody() data: { propertyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `property:${data.propertyId}`;
    client.leave(room);
    return { event: 'left', room };
  }

  // Called by ReviewsService when a new review is saved
  broadcastNewReview(propertyId: string, review: any) {
    this.server.to(`property:${propertyId}`).emit('review:new', review);
  }
}