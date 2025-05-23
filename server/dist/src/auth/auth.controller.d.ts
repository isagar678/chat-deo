import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
    }>;
    register(userData: RegisterDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): Promise<any>;
    auth(): Promise<void>;
    googleAuthCallback(req: any, res: Response): Promise<void>;
}
