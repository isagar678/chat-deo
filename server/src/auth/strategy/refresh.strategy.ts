import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export class RefreshStrategy extends PassportStrategy(Strategy,'refresh') {
      constructor(configService: ConfigService) {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: true,
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? '',
        });
      }
    
    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username };
    }
}