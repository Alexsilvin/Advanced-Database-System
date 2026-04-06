export type GameId = string;

export interface Game {
  id: GameId;
  title: string;
  price: number;
  description: string;
  image: string;
  image_url?: string;
  category: string;
  is_downloadable?: boolean;
  rom_filename?: string;
  poster_source?: string;
  poster_source_url?: string;
  poster_confidence?: number;
  poster_last_checked_at?: string;
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

export interface DownloadUrlResponse {
  gameId: string;
  title: string;
  signedUrl: string;
  expiresInSeconds: number;
}

export type UserRole = 'admin' | 'player';

export interface UserAccount {
  id: string;
  username: string;
  avatar_url?: string | null;
  role: UserRole;
  email?: string | null;
}

export interface AuthSessionResponse extends UserAccount {}

export interface RomUploadUrlResponse {
  gameId: string;
  title: string;
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface RegisterRomResponse {
  game: {
    id: string;
    title: string;
    rom_storage_key: string | null;
    rom_filename: string | null;
    is_downloadable: boolean;
  };
}

export interface AdminOverviewResponse {
  summary: {
    totalUsers: number;
    adminUsers: number;
    playerUsers: number;
    totalGames: number;
  };
  recentUsers: Array<{
    id: string;
    username: string;
    role: UserRole;
    email?: string | null;
  }>;
  recentGames: Array<{
    id: GameId;
    title: string;
    category: string;
    price: number;
    image?: string;
  }>;
}

export interface PosterEnrichmentResult {
  attempted: number;
  updated: Array<{ id: string; title: string; source: string; confidence: number }>;
  skipped: Array<{ id: string; title: string; reason: string }>;
  minConfidence: number;
}

export type TabType = 'admin' | 'store' | 'library' | 'friends' | 'bucket' | 'notifications' | 'game-detail' | 'profile' | 'upload';

export type FriendStatus = 'online' | 'offline' | 'playing';

export interface Friend {
  username: string;
  status: FriendStatus;
  game?: string;
}