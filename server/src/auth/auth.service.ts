import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.userService.findOne(username);
        if (user && user.password === password) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    verifySocketToken(token: string) {
        try {
            const payload = this.jwtService.verify(token)
            return { userId: payload.sub, username: payload.username };
        } catch (error) {
            throw new UnauthorizedException()
        }
    }

    async login(user: any) {
        const payload = { username: user.userName, sub: user.id }

        return {
            access_token: this.jwtService.sign(payload)
        }
    }

    async register(userData) {
        const user = await this.userService.findUser(userData)

        if (!user) {
            await this.userService.create(userData)

            const payload = { username: userData.userName, sub: userData.id }

            return {
                access_token: this.jwtService.sign(payload)
            }
        }
        else {
            throw new ConflictException()
        }
    }
}
