import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@supabase/supabase-js';
import { Group } from 'src/entities/group.entity';
import { Repository } from 'typeorm';
import { User as UserEntity } from 'src/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class GroupService {
    private readonly logger = new Logger(GroupService.name);

    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ){
        // Initialize service - database schema is handled by TypeORM
        this.logger.log('GroupService initialized');
    }

    async createGroup(user: any, name: string, memberIds: number[] = []): Promise<Group> {
        try {
            // The user parameter is the JWT payload with { username, id, role, sub }
            const creatorId = user.id;
            
            this.logger.log(`Creating group "${name}" with creator ID: ${creatorId} and member IDs: [${memberIds.join(', ')}]`);
            
            // Use a transaction to ensure data consistency
            return await this.groupRepository.manager.transaction(async (transactionalEntityManager) => {
                // Get the creator user entity
                const creator = await transactionalEntityManager.findOne(UserEntity, {
                    where: { id: creatorId }
                });

                if (!creator) {
                    throw new Error('Creator user not found');
                }

                // Get all member entities including the creator
                const allMemberIds = [...new Set([creatorId, ...memberIds])];
                this.logger.debug(`Creating group with member IDs: ${allMemberIds.join(', ')}`);
                
                // Use find instead of findByIds (which might not exist in newer TypeORM versions)
                const members = await transactionalEntityManager.find(UserEntity, {
                    where: allMemberIds.map(id => ({ id }))
                });

                if (members.length === 0) {
                    throw new Error('No valid members found');
                }

                // Log the members being added
                this.logger.debug(`Adding members to group: ${members.map(m => `${m.name} (${m.id})`).join(', ')}`);

                const newGroup = transactionalEntityManager.create(Group, {
                    name,
                    users: members
                });
                
                const savedGroup = await transactionalEntityManager.save(Group, newGroup);
                
                // Verify the group was created with all members
                const verificationGroup = await transactionalEntityManager.findOne(Group, {
                    where: { id: savedGroup.id },
                    relations: ['users']
                });
                
                if (verificationGroup) {
                    this.logger.log(`Group "${name}" (ID: ${savedGroup.id}) created successfully with ${verificationGroup.users.length} members: ${verificationGroup.users.map(u => `${u.name} (${u.id})`).join(', ')}`);
                } else {
                    this.logger.warn(`Group created but verification failed - could not retrieve group with relations`);
                }
                
                return savedGroup;
            });
        } catch (error) {
            this.logger.error(`Error creating group "${name}": ${error.message}`);
            throw error;
        }
    }

    async getGroupsByUserId(id: number): Promise<Group[] | null> {
        try {
            this.logger.debug(`Searching for groups for user ID: ${id}`);
            
            // Use a proper query to find groups where the user is a member
            const groups = await this.groupRepository
                .createQueryBuilder('group')
                .leftJoinAndSelect('group.users', 'users')
                .leftJoinAndSelect('group.chats', 'chats')
                .leftJoinAndSelect('chats.from', 'fromUser')
                .where('users.id = :userId', { userId: id })
                .select([
                    'group.id',
                    'group.name',
                    'users.id',
                    'users.name',
                    'users.userName',
                    'users.avatar',
                    'chats.id',
                    'chats.content',
                    'chats.timeStamp',
                    'chats.filePath',
                    'chats.fileName',
                    'chats.fileSize',
                    'chats.mimeType',
                    'fromUser.id',
                    'fromUser.name',
                    'fromUser.userName',
                    'fromUser.avatar'
                ])
                .getMany();
            
            this.logger.debug(`Found ${groups.length} groups for user ${id}: ${groups.map(g => `${g.name} (${g.id})`).join(', ')}`);
            return groups || [];
        } catch (error) {
            this.logger.error(`Error getting groups for user ${id}: ${error.message}`);
            return [];
        }
    }

    async getGroupById(groupId: number): Promise<Group | null> {
        try {
            this.logger.debug(`Getting group by ID: ${groupId}`);
            
            // Use a proper query to get group with all relations
            const group = await this.groupRepository
                .createQueryBuilder('group')
                .leftJoinAndSelect('group.users', 'users')
                .leftJoinAndSelect('group.chats', 'chats')
                .leftJoinAndSelect('chats.from', 'fromUser')
                .where('group.id = :groupId', { groupId })
                .select([
                    'group.id',
                    'group.name',
                    'users.id',
                    'users.name',
                    'users.userName',
                    'users.avatar',
                    'chats.id',
                    'chats.content',
                    'chats.timeStamp',
                    'chats.filePath',
                    'chats.fileName',
                    'chats.fileSize',
                    'chats.mimeType',
                    'fromUser.id',
                    'fromUser.name',
                    'fromUser.userName',
                    'fromUser.avatar'
                ])
                .getOne();
            
            if (group) {
                this.logger.debug(`Found group: ${group.name} with ${group.users.length} users`);
            } else {
                this.logger.debug(`Group with ID ${groupId} not found`);
            }
            
            return group;
        } catch (error) {
            this.logger.error(`Error getting group ${groupId}: ${error.message}`);
            return null;
        }
    }

    async addMemberToGroup(groupId: number, userId: number): Promise<Group | null> {
        try {
            const group = await this.groupRepository.findOne({
                where: { id: groupId },
                relations: ['users']
            });

            if (!group) {
                throw new Error('Group not found');
            }

            const user = await this.userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is already in the group
            const isUserInGroup = group.users.some(u => u.id === userId);
            if (isUserInGroup) {
                this.logger.debug(`User ${userId} is already a member of group ${groupId}`);
                return group; // User already in group, return existing group
            }

            group.users.push(user);
            const updatedGroup = await this.groupRepository.save(group);
            this.logger.log(`User ${userId} added to group ${groupId}`);
            return updatedGroup;
        } catch (error) {
            this.logger.error(`Error adding user ${userId} to group ${groupId}: ${error.message}`);
            throw error;
        }
    }

    async removeMemberFromGroup(groupId: number, userId: number): Promise<Group | null> {
        try {
            const group = await this.groupRepository.findOne({
                where: { id: groupId },
                relations: ['users']
            });

            if (!group) {
                throw new Error('Group not found');
            }

            const user = await this.userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is in the group
            const isUserInGroup = group.users.some(u => u.id === userId);
            if (!isUserInGroup) {
                throw new Error('User is not a member of this group');
            }

            // Don't allow removing the last member (minimum 1 member required)
            if (group.users.length === 1) {
                throw new Error('Cannot remove the last member from a group');
            }

            group.users = group.users.filter(user => user.id !== userId);
            const updatedGroup = await this.groupRepository.save(group);
            this.logger.log(`User ${userId} removed from group ${groupId}`);
            return updatedGroup;
        } catch (error) {
            this.logger.error(`Error removing user ${userId} from group ${groupId}: ${error.message}`);
            throw error;
        }
    }

    async isUserInGroup(groupId: number, userId: number): Promise<boolean> {
        try {
            const group = await this.groupRepository.findOne({
                where: { id: groupId },
                relations: ['users']
            });

            if (!group) {
                return false;
            }

            const isInGroup = group.users.some(user => user.id === userId);
            this.logger.debug(`User ${userId} ${isInGroup ? 'is' : 'is not'} in group ${groupId}`);
            
            return isInGroup;
        } catch (error) {
            this.logger.error(`Error checking if user ${userId} is in group ${groupId}: ${error.message}`);
            return false;
        }
    }

    async getGroupMessages(groupId: number, limit: number = 50, offset: number = 0) {
        try {
            return await this.userService.getGroupMessages(groupId, limit, offset);
        } catch (error) {
            this.logger.error(`Error getting messages for group ${groupId}: ${error.message}`);
            return [];
        }
    }




}
