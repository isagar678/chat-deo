import { BaseEntity, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: 'friendship' })
@Unique('uq_friend_pair', ['userLow', 'userHigh'])
export class FriendShip extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    userLow: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    userHigh: User;

    @CreateDateColumn()
    createdAt: Date;

}