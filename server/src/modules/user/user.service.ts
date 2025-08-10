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

  async findUser(userData): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ userName: userData.userName }, { email: userData.email }],
    });
  }

  async searchUsers(userName): Promise<any> {
    const foundUsers = await User.createQueryBuilder("user")
    .select("user.id", "user.userName")
    .where("(user.userName ILIKE :username)", { username: `%${userName}%` })
    .limit(5)
    .getRawMany()    
  }

  async create(userData): Promise<any> {
    return await this.userRepository.save(userData);
  }

  async getFriendsOfUser(userId): Promise<any> {

    const chats = await Chats.createQueryBuilder('chat')
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

  async addChat(from, to, content) {
    await Chats.insert({ from, to, content })
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
    .select(["chat.id", "chat.content","chat.from"])
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
  
  async getFriendsWithMessages(userId: number): Promise<{}> {
    const friendships = await this.friendshipRepo.createQueryBuilder("friendship")
      .leftJoinAndSelect("friendship.userLow", "userLow")
      .leftJoinAndSelect("friendship.userHigh", "userHigh")
      .where("userLow.id = :userId", { userId })
      .orWhere("userHigh.id = :userId", { userId })
      .select([
        "friendship.id",
        "userLow.id",
        "userLow.userName",
        "userLow.name",
        "userHigh.id",
        "userHigh.userName",
        "userHigh.name"
      ])
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
        content: msg.content,
        timestamp: msg.timeStamp,
        isRead: msg.read,
        isSent: msg.from.id === userId
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
