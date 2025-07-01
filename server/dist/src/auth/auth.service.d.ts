import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(username: string, password: string): Promise<any>;
    verifySocketToken(token: string): {
        userId: any;
        username: any;
    };
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(userData: any): Promise<{
        access_token: string;
    }>;
    googleRegister(userData: any): Promise<{
        access_token: string;
    }>;
}
