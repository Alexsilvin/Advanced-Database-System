export interface Game {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
  rating?: string;
  minSpecs?: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  recSpecs?: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
}

export type TabType = 'store' | 'library' | 'friends' | 'bucket' | 'notifications' | 'game-detail';

export type FriendStatus = 'online' | 'offline' | 'playing';

export interface Friend {
  username: string;
  status: FriendStatus;
  game?: string;
}