import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { Server, Socket } from "socket.io";

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log("Initialized");
  }

  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }
  
  @SubscribeMessage('privateMessage')
  sendPrivateMessage(@MessageBody() data: { recipientId: string; message: string },@ConnectedSocket() client:Socket) {
    const recipient = this.io.sockets.sockets.get(data.recipientId);
    this.logger.log(`Message received from client id: ${client.id}`);

    if (recipient) {
      recipient.emit('privateMessageReceived', {
        message: data.message,
        from: client.id,
      });
    } else {
      client.emit('privateMessageReceived', {
        message: 'wrong recepient',
        from: client.id,
      });
    }
  }
}