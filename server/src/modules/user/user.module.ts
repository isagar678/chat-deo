import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Chats } from 'src/entities/chat.entity';
import { FriendShip } from 'src/entities/friendship.entity';

@Module({
  controllers: [UserController],
  imports: [TypeOrmModule.forFeature([User,Chats,FriendShip])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
