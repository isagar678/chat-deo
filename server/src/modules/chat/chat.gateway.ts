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
import { UserService } from '../user/user.service';
import { Chats } from 'src/entities/chat.entity';

const onlineUsers = new Map() //<user id, client id>

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) { }

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  private async sendStatusUpdateToFriends(
    userId: string,
    username: string,
    isOnline: boolean,
  ) {
    try {
      // 1. Get the list of friends for the user whose status has changed
      //    This is where you'd fetch from your database
      const friends = await this.userService.getFriendsOfUser(userId); 

      // 2. Iterate through each friend
      for (const friend of friends) {
        // 3. Check if the friend is currently online
        //    (optional, but good for efficiency if you only want to send to online friends)
        const friendClientId = onlineUsers.get(friend);

        if (friendClientId) { // If the friend is online
          // 4. Emit the status change event directly to the friend's personal room (which is their userId)
          //    This means only clients who have joined 'friend.id' room will receive it.
          this.io.to(String(friend.id)).emit('userStatusChange', {
            userId: parseInt(userId), // The user whose status changed (A's ID)
            username: username, // A's username
            isOnline: isOnline, // 'online' or 'offline'
            timestamp: new Date().toISOString(),
          });
          this.logger.debug(`Sent status '${isOnline}' for ${username} to friend ${friend.userName} (${friend.id}).`);
        }
      }

      return friends
    } catch (error) {
      this.logger.error(`Error sending status update for ${username}: ${error.message}`);
    }
  }

  async handleConnection(client: any, ...args: any[]) {
    const token_received = client.handshake.auth?.token;
    try {
      const data = this.authService.verifySocketToken(token_received);
      client.userId = data?.userId;
      client.username = data?.username;

      // Make the client join a room named after their own userId
      // This is crucial for targeted messages TO this user.
      client.join(client.userId);

      // Handle duplicate connections (disconnect old one if new connection for same user)
      if (onlineUsers.has(client.userId)) {
        const previousClientId = onlineUsers.get(client.userId);
        const previousClient = this.io.sockets.sockets.get(String(previousClientId));
        if (previousClient && previousClient.id !== client.id) {
          previousClient.emit('duplicateConnection', { message: 'You have connected from another device.' });
          previousClient.disconnect();
          this.logger.warn(`Disconnected previous client for ${client.username} (${client.userId}) due to new connection.`);
        }
      }

      onlineUsers.set(client.userId, client.id); // Store current client ID for this user ID
      this.logger.log(`Client ${client.username} (${client.userId}) ${client.id} connected.`);

      // --- Send initial status of this user's friends TO this user ---
      // This is for the newly connected client A to know which of THEIR friends are currently online.
      const friendsOfThisUser =await this.sendStatusUpdateToFriends(client.userId, client.username, true);

      const initialFriendStatuses = friendsOfThisUser.map(friend => ({
        id: friend.id,
        name: friend.userName,
        isOnline: onlineUsers.has(friend.id), // Check if friend is in our global onlineUsers map
      }));
      client.emit('initialFriendsStatus', initialFriendStatuses);
      this.logger.debug(`Sent initial status of ${initialFriendStatuses.length} friends to ${client.username}.`);

      const allUnreadMessages = await this.userService.getAllUnreadMessages(client.userId)

      allUnreadMessages.forEach((msg)=>{
        client.emit('privateMessageReceived', {
          message: msg.content,
          from: msg.from,
          filePath: msg.filePath,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.mimeType
        });
      })
    } catch (err) {
      this.logger.error(`Error occured for user id ${client.userId}`);
      client.disconnect();
    }
    this.logger.debug(`Total connected clients: ${this.io.sockets.sockets.size}`);
  }

  async handleDisconnect(client: any) {
    onlineUsers.delete(client.userId);
    this.logger.log(`Client id:${client.id} disconnected`);
    
    // Notify friends about the user going offline
    if (client.userId && client.username) {
      await this.sendStatusUpdateToFriends(client.userId, client.username, false);
    }
  }

  @SubscribeMessage('privateMessage')
  async sendPrivateMessage(
    @MessageBody() data: { 
      recipientId: string; 
      message: string; 
      filePath?: string; 
      fileName?: string; 
      fileSize?: number; 
      fileType?: string; 
    },
    @ConnectedSocket() client,
  ) {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    const recipient = this.io.sockets.sockets.get(String(recipientSocketId));

    this.logger.log(`Message received from client id: ${client.id}`);

    try {
      // Always save the chat message first with file metadata
      await this.userService.addChat(
        client.userId, 
        data.recipientId, 
        data.message,
        data.filePath,
        data.fileName,
        data.fileSize,
        data.fileType
      );
      
      // Create friendship relationship (this will create friendship if it doesn't exist)
      await this.userService.addFriend(client.userId, data.recipientId);

      // If recipient is online, send the message immediately
      if (recipient) {
        recipient.emit('privateMessageReceived', {
          message: data.message,
          from: client.userId,
          fromName: client.username,
          filePath: data.filePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType
        });
        this.logger.log(`Message sent to online recipient: ${data.recipientId}`);
      } else {
        // If recipient is offline, the message is already saved and will be retrieved when they come online
        this.logger.log(`Message saved for offline recipient: ${data.recipientId}`);
      }

      // Send confirmation to sender
      client.emit('messageDelivered', {
        recipientId: data.recipientId,
        message: data.message,
        timestamp: new Date().toISOString(),
        filePath: data.filePath,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType
      });

    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('messageError', {
        error: 'Failed to send message',
        recipientId: data.recipientId
      });
    }
  }

  @SubscribeMessage('typingStart')
  async handleTypingStart(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client,
  ) {
    const recipientSocketId = onlineUsers.get(data.to);
    const recipient = this.io.sockets.sockets.get(String(recipientSocketId));

    if (recipient) {
      recipient.emit('typingStart', {
        from: client.userId,
        fromName: client.username
      });
    }
  }

  @SubscribeMessage('typingStop')
  async handleTypingStop(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client,
  ) {
    const recipientSocketId = onlineUsers.get(data.to);
    const recipient = this.io.sockets.sockets.get(String(recipientSocketId));

    if (recipient) {
      recipient.emit('typingStop', {
        from: client.userId,
        fromName: client.username
      });
    }
  }
}
