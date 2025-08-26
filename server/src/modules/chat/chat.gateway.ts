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
import { GroupService } from '../group/group.service';

const onlineUsers = new Map() //<user id as string, client socket id>

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly groupService: GroupService
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
        const friendClientId = onlineUsers.get(String(friend.id));

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
      if (onlineUsers.has(String(client.userId))) {
        const previousClientId = onlineUsers.get(String(client.userId));
        const previousClient = this.io.sockets.sockets.get(String(previousClientId));
        if (previousClient && previousClient.id !== client.id) {
          previousClient.emit('duplicateConnection', { message: 'You have connected from another device.' });
          previousClient.disconnect();
          this.logger.warn(`Disconnected previous client for ${client.username} (${client.userId}) due to new connection.`);
        }
      }

      onlineUsers.set(String(client.userId), client.id); // Store current client ID for this user ID
      this.logger.log(`Client ${client.username} (${client.userId}) ${client.id} connected.`);

      // --- Send initial status of this user's friends TO this user ---
      // This is for the newly connected client A to know which of THEIR friends are currently online.
      const friendsOfThisUser =await this.sendStatusUpdateToFriends(client.userId, client.username, true);

      // Add null check to prevent errors
      if (friendsOfThisUser && Array.isArray(friendsOfThisUser)) {
        const initialFriendStatuses = friendsOfThisUser.map(friend => ({
          id: friend.id,
          name: friend.userName,
          isOnline: onlineUsers.has(String(friend.id)), // Check if friend is in our global onlineUsers map
        }));
        client.emit('initialFriendsStatus', initialFriendStatuses);
        this.logger.debug(`Sent initial status of ${initialFriendStatuses.length} friends to ${client.username}.`);
      } else {
        this.logger.debug(`No friends found for user ${client.username} or error occurred.`);
        client.emit('initialFriendsStatus', []);
      }

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

      await this.handleGroupConnection(client)

    } catch (err) {
      this.logger.error(`Error occured for user id ${client.userId}`);
      client.disconnect();
    }
    this.logger.debug(`Total connected clients: ${this.io.sockets.sockets.size}`);
  }

  async handleGroupConnection(client: any, ...args: any[]) {
    try {
      const groups = await this.groupService.getGroupsByUserId(client.userId);

      if (groups && groups.length > 0) {
        groups.forEach(group => {
          client.join(group.id.toString());
          this.logger.debug(`User ${client.username} joined group ${group.name} (${group.id})`);
        });
        this.logger.debug(`User ${client.username} joined ${groups.length} groups`);
      } else {
        this.logger.debug(`User ${client.username} is not a member of any groups`);
      }
    } catch (err) {
      this.logger.error(`Error occurred for group joining of user ${client.username} (${client.userId}): ${err.message}`);
      // Don't disconnect the client for group errors, just log them
    }
  }

  async handleDisconnect(client: any) {
    onlineUsers.delete(client.userId);
    this.logger.log(`Client id:${client.id} disconnected`);
    
    // Notify friends about the user going offline
    if (client.userId && client.username) {
      await this.sendStatusUpdateToFriends(client.userId, client.username, false);
    }
  }

  @SubscribeMessage('groupMessage')
  async sendGroupMessage(
    @MessageBody() data: {
      groupId: number;
      message: string;
      filePath?: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
    },
    @ConnectedSocket() client,
  ){
    try {
      // Check if user is in the group
      const isUserInGroup = await this.groupService.isUserInGroup(data.groupId, client.userId);
      
      if (!isUserInGroup) {
        client.emit('groupMessageError', {
          error: 'You are not a member of this group',
          groupId: data.groupId
        });
        return;
      }

      // Save the group message
      await this.userService.addChat(
        client.userId, 
        null, // to is null for group messages
        data.message,
        data.filePath,
        data.fileName,
        data.fileSize,
        data.fileType,
        data.groupId // Pass groupId as the last parameter
      );

      // Emit to all group members EXCEPT the sender using Socket.IO rooms
      // The sender will see their message immediately through local state update
      const messageData = {
        message: data.message,
        from: client.userId,
        fromName: client.username,
        groupId: data.groupId,
        filePath: data.filePath,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        timestamp: new Date().toISOString()
      };

      this.logger.debug(`Preparing to send group message: ${JSON.stringify(messageData)}`);

      // Emit to the group room but exclude the sender
      // We need to manually emit to each member except the sender
      const group = await this.groupService.getGroupById(data.groupId);
      if (group) {
        this.logger.debug(`Group found with ${group.users.length} members`);
        
        group.users.forEach(member => {
          if (member.id !== client.userId) {
            this.logger.debug(`Sending message to member ${member.name} (${member.id})`);
            
            // Find the socket for this member if they're online
            const memberSocketId = onlineUsers.get(String(member.id));
            if (memberSocketId) {
              const memberSocket = this.io.sockets.sockets.get(memberSocketId);
              if (memberSocket) {
                memberSocket.emit('groupMessageReceived', messageData);
                this.logger.debug(`Message sent to online member ${member.name} (${member.id})`);
              } else {
                this.logger.warn(`Member socket not found for ${member.name} (${member.id})`);
              }
            } else {
              this.logger.debug(`Member ${member.name} (${member.id}) is offline`);
            }
          } else {
            this.logger.debug(`Skipping sender ${member.name} (${member.id})`);
          }
        });
      } else {
        this.logger.error(`Group ${data.groupId} not found`);
      }

      // Send confirmation to sender (delivered)
      client.emit('groupMessageDelivered', {
        groupId: data.groupId,
        message: data.message,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`Group message sent to group ${data.groupId} by ${client.username}`);
    } catch (error) {
      this.logger.error(`Error sending group message: ${error.message}`);
      client.emit('groupMessageError', {
        error: 'Failed to send group message',
        groupId: data.groupId
      });
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
      clientMessageId?: number;
    },
    @ConnectedSocket() client,
  ) {
    const recipientSocketId = onlineUsers.get(String(data.recipientId));
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

      // Send confirmation to sender (delivered)
      client.emit('messageDelivered', {
        recipientId: data.recipientId,
        message: data.message,
        timestamp: new Date().toISOString(),
        clientMessageId: data.clientMessageId,
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

  @SubscribeMessage('markMessagesRead')
  async markMessagesRead(
    @MessageBody() data: { from: string },
    @ConnectedSocket() client,
  ) {
    try {
      // Persist read status in DB
      await this.userService.markMessagesAsRead(data.from, client.userId);

      // Notify sender that their messages were read
      const senderSocketId = onlineUsers.get(String(data.from));
      const sender = this.io.sockets.sockets.get(String(senderSocketId));
      if (sender) {
        sender.emit('messagesRead', { from: client.userId });
      }
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
    }
  }

  @SubscribeMessage('markGroupMessagesRead')
  async markGroupMessagesRead(
    @MessageBody() data: { groupId: number },
    @ConnectedSocket() client,
  ) {
    try {
      // Check if user is in the group
      const isUserInGroup = await this.groupService.isUserInGroup(data.groupId, client.userId);
      
      if (!isUserInGroup) {
        client.emit('groupMessageError', {
          error: 'You are not a member of this group',
          groupId: data.groupId
        });
        return;
      }

      // Persist read status in DB
      await this.userService.markGroupMessagesAsRead(data.groupId, client.userId);

      // Notify all group members that messages were read
      this.io.to(data.groupId.toString()).emit('groupMessagesRead', { 
        groupId: data.groupId,
        readBy: client.userId 
      });
    } catch (error) {
      this.logger.error(`Error marking group messages as read: ${error.message}`);
    }
  }

  @SubscribeMessage('typingStart')
  async handleTypingStart(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client,
  ) {
    const recipientSocketId = onlineUsers.get(String(data.to));
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
    const recipientSocketId = onlineUsers.get(String(data.to));
    const recipient = this.io.sockets.sockets.get(String(recipientSocketId));

    if (recipient) {
      recipient.emit('typingStop', {
        from: client.userId,
        fromName: client.username
      });
    }
  }

  @SubscribeMessage('test')
  handleTestMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client,
  ) {
    this.logger.debug(`Received test message from client ${client.id}: ${JSON.stringify(data)}`);
    
    // Echo back the test message
    client.emit('testResponse', {
      message: 'Test response from server',
      receivedData: data,
      timestamp: new Date().toISOString()
    });
  }
}
