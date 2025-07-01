import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: Request & {
        user: any;
    }): Promise<{
        access_token: string;
    }>;
    register(userData: RegisterDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: Request & {
        user: any;
    }): any;
    auth(): Promise<void>;
    googleAuthCallback(req: Request & {
        user: any;
    }, res: Response): Promise<void>;
}
