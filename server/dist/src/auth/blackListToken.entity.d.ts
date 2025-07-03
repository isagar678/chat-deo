import { BaseEntity } from "typeorm";
export declare class BlackListTokens extends BaseEntity {
    id: number;
    token: string;
}
