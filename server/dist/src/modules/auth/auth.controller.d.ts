import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { AccessTokenDto } from './dto/accessToken.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: Request & {
        user: any;
    }): Promise<{
        access_token: string;
        refresh_token: string;
    } | undefined>;
    register(userData: RegisterDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    getAccessToken(accessTokenDto: AccessTokenDto, ip: string): Promise<{
        access_token: string;
    } | undefined>;
    getProfile(req: Request & {
        user: any;
    }): any;
    auth(): Promise<void>;
    googleAuthCallback(req: Request & {
        user: any;
    }, res: Response): Promise<void>;
    routeForAdmin(): Promise<string>;
}
