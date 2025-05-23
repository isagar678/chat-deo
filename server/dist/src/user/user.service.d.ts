import { User } from './user.entity';
import { Repository } from 'typeorm';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findOne(userName: string): Promise<User | null>;
    findUser(userData: any): Promise<User | null>;
    create(userData: any): Promise<any>;
}
