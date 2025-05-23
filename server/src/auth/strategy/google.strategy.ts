import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth2";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy,'google') {
    constructor(configService: ConfigService
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
            scope: ['email', 'profile']
        });
    }

    async validate(_accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback): Promise<any> {
        const { id, name, emails } = profile;

        const user = {
            
            name: `${name.givenName} ${name.familyName}`,
            userName: `${name.givenName}`,
            email: emails[0].value,
        };

        done(null, user);
    }
}