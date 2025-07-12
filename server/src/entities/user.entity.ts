import { Role } from 'src/enum/role.enum';
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Chats } from './chat.entity';

@Entity({ name: 'users', schema: 'user' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'user_name' })
  userName: string;

  @Column('text', { name: 'email' })
  email: string;

  @Column('text', { name: 'password', nullable: true })
  password: string;

  @Column('enum', { name: 'role', default: Role.User, enum: Role })
  role: Role
  
  @ManyToMany(type=>User)
  @JoinTable()
  friends: User[];

  @OneToMany(()=>Chats,(c)=>c.id)
  chats:Chats[]

  //for reference
  
  // @ManyToOne(() => Days, (d) => d.activities, { onDelete: 'CASCADE' })
  // @JoinColumn([{ name: "day_id", referencedColumnName: "id" }])
  // day: Days

  // @OneToOne(() => ActivityOtherDetails, (a) => a.activity, { cascade: true })
  // otherDetails: ActivityOtherDetails;

  // @OneToMany(() => ActivityMedia, (media) => media.activity, { cascade: true })
  // media: ActivityMedia[];
}
