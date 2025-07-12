import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';

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

  async searchUsers(userName):Promise<User[]|null>{
    return await User.createQueryBuilder("user").select("user.id","user.userName").where("(user.userName ILIKE :username)",{username:`%${userName}%`}).getRawMany()
  }

  async create(userData): Promise<any> {
    return await this.userRepository.save(userData);
  }

}
