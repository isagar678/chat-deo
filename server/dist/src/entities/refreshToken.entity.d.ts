import { BaseEntity } from "typeorm";
export declare class RefreshTokens extends BaseEntity {
    id: number;
    token: string;
    ip: string;
    isBlacklisted: boolean;
}
