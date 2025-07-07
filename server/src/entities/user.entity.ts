import { Role } from 'src/enum/role.enum';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user', schema: 'auth' })
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
}
