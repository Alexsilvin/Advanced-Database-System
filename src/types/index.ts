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
  rom_size_bytes?: number;
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

export type TabType = 'admin' | 'store' | 'library' | 'friends' | 'bucket' | 'notifications' | 'messages' | 'groups' | 'wallet' | 'game-detail' | 'profile' | 'upload';

export type FriendStatus = 'online' | 'offline' | 'playing';

export interface Friend {
  username: string;
  status: FriendStatus;
  game?: string;
}

export interface AppNotification {
  id: string;
  type: 'friend' | 'system' | 'sale' | 'game';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Messaging Types
export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  sender_username?: string;
  recipient_username?: string;
}

export interface Conversation {
  other_user_id: string;
  username: string;
  avatar?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface MessageGroup {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  creator_id: string;
  creator_username?: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_username?: string;
}

// Wallet/Payment Types
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  payment_method_id?: string;
  transaction_type: 'topup' | 'purchase' | 'refund' | 'admin_credit';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GamePurchase {
  id: string;
  user_id: string;
  game_id: string;
  price_paid: number;
  purchased_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'credit_card' | 'paypal' | 'debit_card';
  provider: string;
  last_four?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}