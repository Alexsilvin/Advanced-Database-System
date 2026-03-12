export interface Game {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export type TabType = 'store' | 'library' | 'friends' | 'bucket' | 'notifications';

export type FriendStatus = 'online' | 'offline' | 'playing';

export interface Friend {
  username: string;
  status: FriendStatus;
  game?: string;
}