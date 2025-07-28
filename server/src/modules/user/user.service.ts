import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { Chats } from 'src/entities/chat.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findOne(userName: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { userName } });
  }

  async findUser(userData): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ userName: userData.userName }, { email: userData.email }],
    });
  }

  async searchUsers(userName): Promise<User[] | null> {
    return await User.createQueryBuilder("user").select("user.id", "user.userName").where("(user.userName ILIKE :username)", { username: `%${userName}%` }).getRawMany()
  }

  async create(userData): Promise<any> {
    return await this.userRepository.save(userData);
  }

  async getFriendsOfUser(userId): Promise<any> {
    console.log('userId', userId);

    const chats = await Chats.createQueryBuilder('chat')
    .leftJoinAndSelect("chat.from","from")
    .leftJoinAndSelect("chat.to","to")
      .select(['chat.id','from.id', 'to.id'])
      .where('from.id = :userId OR to.id = :userId', { userId })
      .getMany();

    // Extract unique friends from the chats
    const friendsSet = new Set();
    chats.forEach(chat => {
      if (chat.from.id !== userId) {
        friendsSet.add(chat.from);
      }
      if (chat.to.id !== userId) {
        friendsSet.add(chat.to);
      }
    });

    return Array.from(friendsSet);
  }

  async addChat(from,to,content){
    await Chats.insert({from,to,content})
  }

}
