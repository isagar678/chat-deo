import { BaseEntity } from "typeorm";
export declare class User extends BaseEntity {
    id: number;
    name: string;
    userName: string;
    email: string;
    password: string;
}
