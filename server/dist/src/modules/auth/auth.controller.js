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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const local_auth_guard_1 = require("./guard/local-auth.guard");
const jwt_auth_guard_1 = require("./guard/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
const o_auth_guard_1 = require("./guard/o-auth.guard");
const accessToken_dto_1 = require("./dto/accessToken.dto");
const role_decorator_1 = require("../../decorators/role.decorator");
const role_enum_1 = require("../../enum/role.enum");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(req) {
        return this.authService.login(req.user);
    }
    async register(userData) {
        return await this.authService.register(userData);
    }
    async getAccessToken(accessTokenDto, ip) {
        return await this.authService.generateAccessTokenFromRefreshToken(accessTokenDto?.refreshToken, ip);
    }
    getProfile(req) {
        return req.user;
    }
    async auth() { }
    async googleAuthCallback(req, res) {
        const data = await this.authService.googleRegister(req.user);
        res.cookie('access_token', data.access_token);
        res.cookie('refresh_token', data.refresh_token);
        res.redirect('http://localhost:3000/api');
    }
    async routeForAdmin() {
        return 'admin route';
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Login through username and password' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Api success' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Bad Request or API error message' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found!' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User Already Exist' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error!' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register user' }),
    (0, swagger_1.ApiBody)({ type: register_dto_1.RegisterDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Api success' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Bad Request or API error message' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found!' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User Already Exist' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error!' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get new access token from refresh token' }),
    (0, swagger_1.ApiBody)({ type: accessToken_dto_1.AccessTokenDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Api success' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Bad Request or API error message' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found!' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error!' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accessToken_dto_1.AccessTokenDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAccessToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Api success' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: ' Not found!' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error!' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(o_auth_guard_1.GoogleOAuthGuard),
    (0, common_1.Get)('google'),
    (0, swagger_1.ApiOperation)({ summary: 'OAuth endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Api success' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: ' Not found!' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error!' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "auth", null);
__decorate([
    (0, common_1.Get)('google/redirect'),
    (0, common_1.UseGuards)(o_auth_guard_1.GoogleOAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
__decorate([
    (0, common_1.Get)('admin/route/test'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "routeForAdmin", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map