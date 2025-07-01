import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
declare const GoogleStrategy_base: new (...args: [] | [options: import("passport-google-oauth2").StrategyOptionsWithRequest] | [options: import("passport-google-oauth2").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    constructor(configService: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback): Promise<any>;
}
export {};
