import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(payload: any) {
    // Enrich the request user object with full profile fields for convenience
    const user = await this.userService.findById(payload.id);
    if (user) {
      return {
        id: user.id,
        userName: user.userName,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      };
    }
    return { id: payload.id, userName: payload.username, role: payload.role };
  }
}
