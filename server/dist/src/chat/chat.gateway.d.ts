import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    io: Server;
    afterInit(): void;
    handleConnection(client: any, ...args: any[]): void;
    handleDisconnect(client: any): void;
    sendPrivateMessage(data: {
        recipientId: string;
        message: string;
    }, client: any): void;
}
