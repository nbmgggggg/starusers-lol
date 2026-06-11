export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: "text" | "voice";
  position: number;
  serverId: string;
}

export interface ServerMember {
  id: string;
  userId: string;
  serverId: string;
  role: "owner" | "moderator" | "member";
  user: User;
  joinedAt: Date;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  owner: User;
  channels: Channel[];
  members: ServerMember[];
  boostLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  author: User;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelWithMessages extends Channel {
  messages: Message[];
}