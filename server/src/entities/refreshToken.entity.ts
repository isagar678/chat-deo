import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:'refreshTokens',schema:'auth',})
export class RefreshTokens extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number
    
    @Column('text', { unique: true, name: 'token' })
    token:string

    @Column('text',{name:'ip'})
    ip:string
    
    @Column('bool',{default:false,name:'is_blacklisted'})
    isBlacklisted:boolean
}