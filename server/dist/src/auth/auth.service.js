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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const blackListToken_entity_1 = require("./blackListToken.entity");
const config_1 = require("@nestjs/config");
const UsefulFunction_1 = require("../UsefulFunction");
let AuthService = class AuthService {
    userService;
    jwtService;
    configService;
    constructor(userService, jwtService, configService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(username, password) {
        const user = await this.userService.findOne(username);
        if (user && user.password === password) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    verifySocketToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            return { userId: payload.sub, username: payload.username };
        }
        catch (error) {
            (0, UsefulFunction_1.handleTokenErrors)(error);
        }
    }
    async login(user) {
        try {
            const payload = { username: user.userName, sub: user.id };
            return {
                access_token: this.jwtService.sign(payload, { expiresIn: '15m', secret: this.configService.get('JWT_SECRET') }),
                refresh_token: this.jwtService.sign(payload, { expiresIn: '2d', secret: this.configService.get('JWT_REFRESH_SECRET') })
            };
        }
        catch (error) {
            (0, UsefulFunction_1.handleTokenErrors)(error);
        }
    }
    async register(userData) {
        const user = await this.userService.findUser(userData);
        if (!user) {
            await this.userService.create(userData);
            const payload = { username: userData.userName, sub: userData.id };
            return {
                access_token: this.jwtService.sign(payload, { expiresIn: '15m', secret: this.configService.get('JWT_SECRET') }),
                refresh_token: this.jwtService.sign(payload, { expiresIn: '2d', secret: this.configService.get('JWT_REFRESH_SECRET') })
            };
        }
        else {
            throw new common_1.ConflictException();
        }
    }
    async googleRegister(userData) {
        const user = await this.userService.findUser(userData);
        if (!user) {
            await this.userService.create(userData);
        }
        const payload = { username: userData.userName, sub: userData.id };
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '15m', secret: this.configService.get('JWT_SECRET') }),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '2d', secret: this.configService.get('JWT_REFRESH_SECRET') })
        };
    }
    async isTokenBlackListed(token) {
        const isBlackListed = await blackListToken_entity_1.BlackListTokens.findOne({ where: { token } });
        if (isBlackListed) {
            throw new common_1.UnauthorizedException('Blacklisted');
        }
    }
    async generateAccessTokenFromRefreshToken(refreshToken) {
        try {
            const verifiedPayload = this.jwtService.verify(refreshToken, { secret: this.configService.get('JWT_REFRESH_SECRET') });
            await this.isTokenBlackListed(refreshToken);
            const payload = { sub: verifiedPayload.sub, username: verifiedPayload.username };
            return {
                access_token: this.jwtService.sign(payload, { expiresIn: '15m', secret: this.configService.get('JWT_SECRET') })
            };
        }
        catch (error) {
            (0, UsefulFunction_1.handleTokenErrors)(error);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map