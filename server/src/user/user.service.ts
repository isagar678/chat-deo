import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(userName: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { userName } });
  }

  async findUser(userData): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ userName: userData.userName }, { email: userData.email }],
    });
  }

  async create(userData): Promise<any> {
    return await this.userRepository.save(userData);
  }
}
