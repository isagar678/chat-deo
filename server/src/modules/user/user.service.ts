import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { Chats } from 'src/entities/chat.entity';
import { FriendShip } from 'src/entities/friendship.entity';

interface FriendWithMessages {
  friendDetails: User;
  messages: {
    id: number;
    content: string;
    timestamp: Date;
    isSent: boolean;
  }[];
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FriendShip) private readonly friendshipRepo: Repository<FriendShip>,
    @InjectRepository(Chats) private readonly chatsRepo: Repository<Chats>
  ) { }

  async findOne(userName: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { userName } });
  }

  async testAvatarColumn(): Promise<any> {
    try {
      // Test if avatar column exists by trying to select it
      const result = await this.userRepository.createQueryBuilder('user')
        .select(['user.id', 'user.name', 'user.userName', 'user.avatar'])
        .limit(5)
        .getMany();
      
      console.log('Test avatar column result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error testing avatar column:', error);
      throw error;
    }
  }

  async findUser(userData): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ userName: userData.userName }, { email: userData.email }],
    });
  }

  async searchUsers(userName: string): Promise<any> {
    const foundUsers = await User.createQueryBuilder("user")
    .select(["user.id", "user.userName", "user.name", "user.avatar"])
    .where("(user.userName ILIKE :username OR user.name ILIKE :username)", { username: `%${userName}%` })
    .limit(10)
    .getMany();
    
    return foundUsers;
  }

  async create(userData): Promise<any> {
    return await this.userRepository.save(userData);
  }

  async getFriendsOfUser(userId): Promise<any> {

    const chats = await this.chatsRepo.createQueryBuilder('chat')
      .leftJoinAndSelect("chat.from", "from")
      .leftJoinAndSelect("chat.to", "to")
      .select(['chat.id', 'from.id', 'to.id'])
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

  async addChat(from, to, content, filePath?: string, fileName?: string, fileSize?: number, mimeType?: string) {
    await this.chatsRepo.insert({ 
      from, 
      to, 
      content,
      filePath,
      fileName,
      fileSize,
      mimeType
    })
  }

  async addFriend(userA, userB) {
    const [userLow, userHigh] = userA < userB ? [userA, userB] : [userB, userA];

    await this.friendshipRepo
      .createQueryBuilder()
      .insert()
      .into(FriendShip)
      .values({ userLow, userHigh })
      .orIgnore()
      .execute()
  }

  async getAllUnreadMessages(userId) {
    return await this.chatsRepo
    .createQueryBuilder("chat")
    .select([
      "chat.id", 
      "chat.content",
      "chat.from",
      "chat.filePath",
      "chat.fileName",
      "chat.fileSize",
      "chat.mimeType"
    ])
    .where("chat.read = :read", { read: false })
    .andWhere("chat.to= :userId", { userId })
    .getMany();  
  }

  async markMessagesAsRead(from, to) {
    return await this.chatsRepo.update(
      { from, to },         
      { read: true } 
    );
  }

  async updateAvatar(userId: number, avatarUrl?: string): Promise<User> {
    try {
      const updateData = avatarUrl ? { avatar: avatarUrl } : { avatar: undefined };
      
      await this.userRepository.update(userId, updateData);
      
      const updatedUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!updatedUser) {
        throw new Error('User not found after update');
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw new Error(`Failed to update user avatar: ${error.message}`);
    }
  }
  
  async findById(userId: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id: userId } });
  }
  
  async updateProfile(userId: number, updates: { name?: string }): Promise<Pick<User, 'id' | 'name' | 'userName' | 'email' | 'avatar' | 'role'>> {
    const payload: Partial<User> = {};
    if (typeof updates.name === 'string' && updates.name.trim().length > 0) {
      payload.name = updates.name.trim();
    }
    if (Object.keys(payload).length === 0) {
      // Nothing to update; return current public fields
      const current = await this.userRepository.findOne({ where: { id: userId } });
      if (!current) {
        throw new Error('User not found');
      }
      return {
        id: current.id,
        name: current.name,
        userName: current.userName,
        email: current.email,
        avatar: current.avatar,
        role: current.role,
      };
    }
    await this.userRepository.update(userId, payload);
    const updated = await this.userRepository.findOne({ where: { id: userId } });
    if (!updated) {
      throw new Error('User not found after update');
    }
    return {
      id: updated.id,
      name: updated.name,
      userName: updated.userName,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
    };
  }
  
  async getFriendsWithMessages(userId: number): Promise<{}> {
    const friendships = await this.friendshipRepo.createQueryBuilder("friendship")
      .leftJoinAndSelect("friendship.userLow", "userLow")
      .leftJoinAndSelect("friendship.userHigh", "userHigh")
      .where("userLow.id = :userId", { userId })
      .orWhere("userHigh.id = :userId", { userId })
      .getMany();




    const results: FriendWithMessages[] = [];

    for (const friendship of friendships) {
      // 2️⃣ Determine the friend's details
      const friend =
        friendship.userLow.id === userId
          ? friendship.userHigh
          : friendship.userLow;

      // 3️⃣ Get all chats between the user and this friend
      const messages = await this.chatsRepo.find({
        where: [
          { from: { id: userId }, to: { id: friend.id } },
          { from: { id: friend.id }, to: { id: userId } }
        ],
        order: { timeStamp: "ASC" },
        relations: ["from", "to"] // now will actually populate
      });

      // 4️⃣ Map messages to the required format
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content ?? '',
        timestamp: msg.timeStamp,
        isRead: msg.read || msg.from.id === userId, // Sent messages are always considered "read" by sender
        isSent: msg.from.id === userId,
        filePath: msg.filePath,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        mimeType: msg.mimeType
      }));

      // 5️⃣ Push result
      results.push({
        friendDetails: friend,
        messages: formattedMessages
      });
    }

    return { friends: results };
  }

}
