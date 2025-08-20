import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Chats } from "./chat.entity";

@Entity({name:'groups'})
export class Group extends BaseEntity {
    @PrimaryGeneratedColumn()
    id:number

    @Column({name:'name',type:'varchar',length:255,nullable:false})
    name:string

    @OneToMany(()=>Chats,(chat)=>chat.group)
    chats:Chats[]

    @ManyToMany((type)=>User,(user)=>user.groups)
    @JoinTable({name:'group_users'})
    users:User[]
}   
