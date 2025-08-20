import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
  } from "typeorm";
import { User } from "./user.entity";
import { Group } from "./group.entity";

  
  @Entity('chats')
  export class Chats {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column('text', { name: 'content', nullable: true })
    content?: string; // optional if only sending a file
  
    @Column('boolean', { name: 'read', default: true, nullable: true })
    read?: boolean;
  
    @CreateDateColumn()
    timeStamp: Date;
  
    // Sender
    @ManyToOne(() => User, (u) => u.sentChats, { onDelete: 'CASCADE' })
    @JoinColumn([{ name: 'from_id', referencedColumnName: "id" }])
    from: User;
  
    // Receiver
    @ManyToOne(() => User, (u) => u.receivedChats, { onDelete: 'CASCADE' })
    @JoinColumn([{ name: 'to_id', referencedColumnName: "id" }])
    to: User;

    @ManyToOne(()=>Group,(group)=>group.chats)
    @JoinColumn([{name:'group_id',referencedColumnName:'id'}])
    group:Group
  
    // File metadata
    @Column('text', { name: 'file_path', nullable: true })
    filePath?: string; // Path in Supabase Storage
  
    @Column('text', { name: 'file_name', nullable: true })
    fileName?: string;
  
    @Column('bigint', { name: 'file_size', nullable: true })
    fileSize?: number;
  
    @Column('text', { name: 'mime_type', nullable: true })
    mimeType?: string;
  }
  