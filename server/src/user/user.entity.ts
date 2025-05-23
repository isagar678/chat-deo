import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'user', schema: 'auth' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('text', {  name: 'name' })
    name: string

    @Column('text', { name: 'user_name' })
    userName: string

    @Column('text', { name: 'email' })
    email: string

    @Column('text', { name: 'password',nullable:true })
    password: string


}