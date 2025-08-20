import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from 'src/entities/group.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GroupService {
    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>
    ){}

    async getGroupsByUserId(id:number):Promise<Group[] | null>{
        const group = await this.groupRepository.find({
            where:{
                users:{
                    id:id
                }
            },
            select:{
                id:true,
                name:true,
                chats:true,
                users:true
            }
        })
        return group
    }
}
