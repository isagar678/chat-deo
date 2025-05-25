import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    io: Server;
    afterInit(): void;
    handleConnection(client: any, ...args: any[]): void;
    handleDisconnect(client: any): void;
    sendPrivateMessage(data: {
        recipientId: string;
        message: string;
    }, client: Socket): void;
}
