import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { RefreshTokens } from '../entities/blackListToken.entity';
import { ConfigService } from '@nestjs/config';
import { handleTokenErrors } from 'src/UsefulFunction';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService:ConfigService
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
      const payload = this.jwtService.verify(token);
      return { userId: payload.sub, username: payload.username };
    } catch (error) {
      handleTokenErrors(error)
    }
  }

  async login(user: any) {
    try {
      const payload = { username: user.userName, sub: user.id };

      return {
        access_token: this.jwtService.sign(payload, { expiresIn: '15m', secret: this.configService.get('JWT_SECRET') }),
        refresh_token: this.jwtService.sign(payload, { expiresIn: '2d', secret: this.configService.get('JWT_REFRESH_SECRET') })
      };
    } catch (error) {
      handleTokenErrors(error)
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
    } else {
      throw new ConflictException();
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

  async isTokenBlackListed(requestToken) {
    const token = await RefreshTokens.findOne({ where: { token:requestToken } })
    if (token?.isBlacklisted) {
      throw new UnauthorizedException('Blacklisted')
    }
    return token;
  }

  async generateAccessTokenFromRefreshToken(refreshToken,ip:string) {
    try {
      const verifiedPayload = this.jwtService.verify(refreshToken, { secret: this.configService.get('JWT_REFRESH_SECRET') })

      const token = await this.isTokenBlackListed(refreshToken)

      if (token?.ip === ip) {
        throw new ConflictException('IP conflict')
      }

      const payload = { sub: verifiedPayload.sub, username: verifiedPayload.username };

      return {
        access_token: this.jwtService.sign(payload, { expiresIn: '15m', secret: this.configService.get('JWT_SECRET') })
      };
    } catch (error) {
      handleTokenErrors(error)
    }
  }
}
