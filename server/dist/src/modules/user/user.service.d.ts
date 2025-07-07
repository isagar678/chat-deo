import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findOne(userName: string): Promise<User | null>;
    findUser(userData: any): Promise<User | null>;
    create(userData: any): Promise<any>;
}
