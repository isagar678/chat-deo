import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { AuthService } from 'src/modules/auth/auth.service';

const onlineUsers = new Map<string, string>() //user id, client id

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly authService: AuthService) { }

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;

    const token_received =
      client.handshake.headers?.authorization?.split(' ')[1];

    try {
      const data = this.authService.verifySocketToken(token_received);
      client.userId = data?.userId;
      client.username = data?.username;
    } catch (err) {
      client.emit('unauthorized', { message: err.message });
      client.disconnect();
    }

    onlineUsers.set(client.userId, client.id)

    this.logger.log(`Client ${client.username} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: any) {
    onlineUsers.delete(client.userId)
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('privateMessage')
  sendPrivateMessage(
    @MessageBody() data: { recipientId: string; message: string },
    @ConnectedSocket() client,
  ) {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    const recipient = this.io.sockets.sockets.get(String(recipientSocketId))

    this.logger.log(`Message received from client id: ${client.id}`);

    if (recipient) {
      recipient.emit('privateMessageReceived', {
        message: data.message,
        from: client.userId,
      });

    } else {
      client.emit('privateMessageReceived', {
        message: 'wrong recepient',
        from: client.id,
      });
    }
  }

  @SubscribeMessage('getUserOnlineStatus')
  getUserStatus(
    @ConnectedSocket() client,
    @MessageBody() data:{recipientId:string}
  ){
    if (onlineUsers.get(data.recipientId)) {
      client.emit('availabilityStatus',{
        message:`Online`,
      })
    }
    else{
      client.emit('availabilityStatus',{
        message:`Offline`,
      })
    }
  }
}
