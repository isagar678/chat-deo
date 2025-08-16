import { Role } from 'src/enum/role.enum';
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Chats } from './chat.entity';
import { FriendShip } from './friendship.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'user_name' })
  userName: string;

  @Column({ name: 'supabase_auth_id', type: 'uuid', unique: true, nullable: true })
  supabaseAuthId: string; 
  
  @Column('text', { name: 'email' })
  email: string;

  @Column('text', { name: 'password', nullable: true })
  password: string;

  @Column('enum', { name: 'role', default: Role.User, enum: Role })
  role: Role

  @OneToMany(type => FriendShip, (friend) => friend.id)
  friends: FriendShip[];

  @OneToMany(() => Chats, (c) => c.from)
  sentChats: Chats[];

  @OneToMany(() => Chats, (c) => c.to)
  receivedChats: Chats[];


  //for reference

  // @ManyToOne(() => Days, (d) => d.activities, { onDelete: 'CASCADE' })
  // @JoinColumn([{ name: "day_id", referencedColumnName: "id" }])
  // day: Days

  // @OneToOne(() => ActivityOtherDetails, (a) => a.activity, { cascade: true })
  // otherDetails: ActivityOtherDetails;

  // @OneToMany(() => ActivityMedia, (media) => media.activity, { cascade: true })
  // media: ActivityMedia[];
}
