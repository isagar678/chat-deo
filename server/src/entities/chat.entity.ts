import { Role } from "src/enum/role.enum";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: 'chats', schema: 'user' })
export class Chats extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { name: 'content' })
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User,{ onDelete: 'CASCADE' })
    @JoinColumn({ name: 'from_id' })
    from: User;

    @ManyToOne(() => User,{ onDelete: 'CASCADE' })
    @JoinColumn({ name: 'to_id' })
    to: User;
}