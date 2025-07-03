import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:'blackListTokens'})
export class BlackListTokens extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number
    
    @Column('text', { unique: true, name: 'token' })
    token:string
}