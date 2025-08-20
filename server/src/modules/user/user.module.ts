import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Chats } from 'src/entities/chat.entity';
import { FriendShip } from 'src/entities/friendship.entity';
import { StorageModule } from '../storage/storage.module';
import { MulterModule } from '@nestjs/platform-express';
import { GroupModule } from '../group/group.module';

@Module({
  controllers: [UserController],
  imports: [TypeOrmModule.forFeature([User, Chats, FriendShip]),
  StorageModule, // 2. Add it to the imports array
  MulterModule.register({
    limits: {
      fileSize: 10 * 1024 * 1024, // Example: 10MB file size limit
    },
  }),
  forwardRef(() => GroupModule),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
