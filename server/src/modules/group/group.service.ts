import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@supabase/supabase-js';
import { Group } from 'src/entities/group.entity';
import { Repository } from 'typeorm';
import { User as UserEntity } from 'src/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class GroupService {
    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ){}

    async createGroup(user: any, name: string): Promise<Group> {
        const newGroup = this.groupRepository.create({
            name,
            users: [user]
        });
        return await this.groupRepository.save(newGroup);
    }

    async getGroupsByUserId(id: number): Promise<Group[] | null> {
        const groups = await this.groupRepository.find({
            where: {
                users: {
                    id: id
                }
            },
            relations: ['users', 'chats'],
            select: {
                id: true,
                name: true,
                users: {
                    id: true,
                    name: true,
                    userName: true,
                    avatar: true
                },
                chats: {
                    id: true,
                    content: true,
                    timeStamp: true,
                    filePath: true,
                    fileName: true,
                    fileSize: true,
                    mimeType: true,
                    from: {
                        id: true,
                        name: true,
                        userName: true,
                        avatar: true
                    }
                }
            }
        });
        return groups;
    }

    async getGroupById(groupId: number): Promise<Group | null> {
        return await this.groupRepository.findOne({
            where: { id: groupId },
            relations: ['users', 'chats'],
            select: {
                id: true,
                name: true,
                users: {
                    id: true,
                    name: true,
                    userName: true,
                    avatar: true
                },
                chats: {
                    id: true,
                    content: true,
                    timeStamp: true,
                    filePath: true,
                    fileName: true,
                    fileSize: true,
                    mimeType: true,
                    from: {
                        id: true,
                        name: true,
                        userName: true,
                        avatar: true
                    }
                }
            }
        });
    }

    async addMemberToGroup(groupId: number, userId: number): Promise<Group | null> {
        const group = await this.groupRepository.findOne({
            where: { id: groupId },
            relations: ['users']
        });

        if (!group) {
            return null;
        }

        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            return null;
        }

        // Check if user is already in the group
        const isUserInGroup = group.users.some(u => u.id === userId);
        if (isUserInGroup) {
            return group;
        }

        group.users.push(user);
        return await this.groupRepository.save(group);
    }

    async removeMemberFromGroup(groupId: number, userId: number): Promise<Group | null> {
        const group = await this.groupRepository.findOne({
            where: { id: groupId },
            relations: ['users']
        });

        if (!group) {
            return null;
        }

        group.users = group.users.filter(user => user.id !== userId);
        return await this.groupRepository.save(group);
    }

    async isUserInGroup(groupId: number, userId: number): Promise<boolean> {
        const group = await this.groupRepository.findOne({
            where: { id: groupId },
            relations: ['users']
        });

        if (!group) {
            return false;
        }

        return group.users.some(user => user.id === userId);
    }

    async getGroupMessages(groupId: number, limit: number = 50, offset: number = 0) {
        return this.userService.getGroupMessages(groupId, limit, offset);
    }
}
