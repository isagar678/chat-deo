import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: 'chats', schema: 'user' })
export class Chats extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { name: 'content' })
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (u) => u.chats, { onDelete: 'CASCADE' })
    @JoinColumn([{ name: 'from_id', referencedColumnName: "id" }])
    from: User;

    @ManyToOne(() => User, (u) => u.chats, { onDelete: 'CASCADE' })
    @JoinColumn([{ name: 'to_id', referencedColumnName: "id" }])
    to: User;
}