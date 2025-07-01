"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const auth_service_1 = require("../auth/auth.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    authService;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(authService) {
        this.authService = authService;
    }
    io;
    afterInit() {
        this.logger.log('Initialized');
    }
    handleConnection(client, ...args) {
        const { sockets } = this.io.sockets;
        const token_received = client.handshake.headers?.authorization?.split(' ')[1];
        try {
            const { userId, username } = this.authService.verifySocketToken(token_received);
            client.userId = userId;
            client.username = username;
        }
        catch (err) {
            client.emit('unauthorized', { message: err.message });
            client.disconnect();
        }
        this.logger.log(`Client id: ${client.username} connected`);
        this.logger.debug(`Number of connected clients: ${sockets.size}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Cliend id:${client.id} disconnected`);
    }
    sendPrivateMessage(data, client) {
        const recipient = this.io.sockets.sockets.get(data.recipientId);
        this.logger.log(`Message received from client id: ${client.id}`);
        if (recipient) {
            recipient.emit('privateMessageReceived', {
                message: data.message,
                from: client.userId,
            });
        }
        else {
            client.emit('privateMessageReceived', {
                message: 'wrong recepient',
                from: client.id,
            });
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "io", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('privateMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "sendPrivateMessage", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map