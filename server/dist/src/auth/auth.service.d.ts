import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly configService;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService);
    validateUser(username: string, password: string): Promise<any>;
    verifySocketToken(token: string): {
        userId: any;
        username: any;
    } | undefined;
    login(user: any): Promise<{
        access_token: string;
        refresh_token: string;
    } | undefined>;
    register(userData: any): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    googleRegister(userData: any): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    isTokenBlackListed(token: any): Promise<void>;
    generateAccessTokenFromRefreshToken(refreshToken: any): Promise<{
        access_token: string;
    } | undefined>;
}
