import { AdminOverviewResponse, AppNotification, AuthSessionResponse, Conversation, DirectMessage, DownloadUrlResponse, Friend, Game, GamePurchase, GroupMessage, MessageGroup, PosterEnrichmentResult, RegisterRomResponse, RomUploadUrlResponse, UserAccount, UserRole, Wallet, WalletTransaction } from '../types';

function normalizeGame(raw: unknown): Game | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = row.id != null ? String(row.id) : '';
  const price = Number(row.price);

  if (!id) return null;

  return {
    id,
    title: String(row.title ?? 'Unknown Game'),
    price: Number.isFinite(price) ? price : 0,
    description: String(row.description ?? ''),
    image: String((row.image as string | undefined) ?? (row.image_url as string | undefined) ?? ''),
    image_url: row.image_url ? String(row.image_url) : undefined,
    category: String(row.category ?? 'Unknown'),
    rating: row.rating ? String(row.rating) : undefined,
    is_downloadable: Boolean(row.is_downloadable),
    rom_filename: row.rom_filename ? String(row.rom_filename) : undefined,
    rom_size_bytes: typeof row.rom_size_bytes === 'number'
      ? row.rom_size_bytes
      : typeof row.rom_size_bytes === 'string'
      ? Number(row.rom_size_bytes)
      : undefined,
    poster_source: row.poster_source ? String(row.poster_source) : undefined,
    poster_source_url: row.poster_source_url ? String(row.poster_source_url) : undefined,
    poster_confidence: typeof row.poster_confidence === 'number' ? row.poster_confidence : undefined,
    poster_last_checked_at: row.poster_last_checked_at ? String(row.poster_last_checked_at) : undefined,
  };
}

async function readJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) {
      throw new Error(`${fallbackError} (HTTP ${res.status})`);
    }
    throw new Error(fallbackError);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (!res.ok) {
      const detail = text.trim().slice(0, 240);
      throw new Error(
        detail ? `${fallbackError} (HTTP ${res.status}): ${detail}` : `${fallbackError} (HTTP ${res.status})`
      );
    }
    throw new Error(fallbackError);
  }
}

export const fetchGames = async (): Promise<Game[]> => {
  try {
    const res = await fetch('/api/games');
    const data = await readJsonResponse<unknown>(res, 'FAILED_TO_FETCH_GAMES');
    if (Array.isArray(data)) {
      return data.map(normalizeGame).filter((game): game is Game => game !== null);
    } else {
      console.error('API returned non-array data:', data);
      if (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string') {
        throw new Error((data as { error: string }).error);
      }
      return [];
    }
  } catch (err) {
    console.error('Failed to fetch games', err);
    throw new Error('NETWORK_FAILURE: GRID_OFFLINE');
  }
};

export const fetchCurrentUser = async (): Promise<AuthSessionResponse | null> => {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (res.status === 401) {
    return null;
  }

  const data = await readJsonResponse<{ error?: string } & AuthSessionResponse>(res, 'FAILED_TO_FETCH_SESSION');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_FETCH_SESSION');
  }

  return data as AuthSessionResponse;
};

export const fetchAdminOverview = async (): Promise<AdminOverviewResponse> => {
  const res = await fetch('/api/admin/overview', { credentials: 'include' });
  const data = await readJsonResponse<{ error?: string } & AdminOverviewResponse>(res, 'FAILED_TO_FETCH_ADMIN_OVERVIEW');

  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_FETCH_ADMIN_OVERVIEW');
  }

  return data as AdminOverviewResponse;
};

export const signupUser = async (payload: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthSessionResponse> => {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: payload.username,
      email: payload.email,
      password: payload.password,
    }),
    credentials: 'include',
  });

  const data = await readJsonResponse<{ error?: string } & AuthSessionResponse>(res, 'FAILED_TO_SIGN_UP');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_SIGN_UP');
  }

  return data as AuthSessionResponse;
};

export const loginUser = async (payload: {
  username: string;
  password: string;
}): Promise<AuthSessionResponse> => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await readJsonResponse<{ error?: string } & AuthSessionResponse>(res, 'FAILED_TO_LOG_IN');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_LOG_IN');
  }

  return data as AuthSessionResponse;
};

export const logoutUser = async (): Promise<void> => {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
};

export const requestGameDownloadUrl = async (payload: {
  gameId: string;
  userId?: string;
  expiresInSeconds?: number;
  adminKey?: string;
}): Promise<DownloadUrlResponse> => {
  const res = await fetch('/api/game-download-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payload.adminKey ? { 'x-admin-key': payload.adminKey } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      gameId: payload.gameId,
      userId: payload.userId,
      expiresInSeconds: payload.expiresInSeconds,
    }),
  });

  const data = await readJsonResponse<{ error?: string } & DownloadUrlResponse>(res, 'FAILED_TO_CREATE_DOWNLOAD_URL');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_CREATE_DOWNLOAD_URL');
  }

  return data as DownloadUrlResponse;
};

export const requestRomUploadUrl = async (payload: {
  gameId: string;
  filename: string;
  contentType?: string;
  expiresInSeconds?: number;
  adminKey?: string;
}): Promise<RomUploadUrlResponse> => {
  const res = await fetch('/api/rom-upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payload.adminKey ? { 'x-admin-key': payload.adminKey } : {}),
    },
    body: JSON.stringify({
      gameId: payload.gameId,
      filename: payload.filename,
      contentType: payload.contentType,
      expiresInSeconds: payload.expiresInSeconds,
    }),
  });

  const data = await readJsonResponse<{ error?: string } & RomUploadUrlResponse>(res, 'FAILED_TO_CREATE_UPLOAD_URL');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_CREATE_UPLOAD_URL');
  }

  return data as RomUploadUrlResponse;
};

export const registerRom = async (payload: {
  gameId: string;
  romStorageKey: string;
  romFilename?: string;
  romSizeBytes?: number;
  romSha256?: string;
  licenseType?: string;
  isDownloadable?: boolean;
  adminKey?: string;
}): Promise<RegisterRomResponse> => {
  const res = await fetch('/api/register-rom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payload.adminKey ? { 'x-admin-key': payload.adminKey } : {}),
    },
    body: JSON.stringify({
      gameId: payload.gameId,
      romStorageKey: payload.romStorageKey,
      romFilename: payload.romFilename,
      romSizeBytes: payload.romSizeBytes,
      romSha256: payload.romSha256,
      licenseType: payload.licenseType,
      isDownloadable: payload.isDownloadable,
    }),
  });

  const data = await readJsonResponse<{ error?: string } & RegisterRomResponse>(res, 'FAILED_TO_REGISTER_ROM');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_REGISTER_ROM');
  }

  return data as RegisterRomResponse;
};

export const uploadRomToServer = async (payload: {
  gameId: string;
  filename: string;
  file: File;
  licenseType?: string;
  isDownloadable?: boolean;
  romSha256?: string;
}): Promise<RegisterRomResponse> => {
  const uploadUrl = new URL('/api/admin/upload-rom', window.location.origin);
  uploadUrl.searchParams.set('gameId', payload.gameId);
  uploadUrl.searchParams.set('filename', payload.filename);
  uploadUrl.searchParams.set('licenseType', payload.licenseType || 'unknown');
  uploadUrl.searchParams.set('isDownloadable', String(payload.isDownloadable ?? true));
  if (payload.romSha256) {
    uploadUrl.searchParams.set('romSha256', payload.romSha256);
  }

  const res = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': payload.file.type || 'application/octet-stream',
    },
    body: await payload.file.arrayBuffer(),
    credentials: 'include',
  });

  const data = await readJsonResponse<{ error?: string } & RegisterRomResponse>(res, 'FAILED_TO_UPLOAD_ROM');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_UPLOAD_ROM');
  }

  return data as RegisterRomResponse;
};

export const runPosterEnrichment = async (payload?: {
  limit?: number;
  force?: boolean;
  minConfidence?: number;
  adminKey?: string;
}): Promise<PosterEnrichmentResult> => {
  const res = await fetch('/api/enrich-posters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payload?.adminKey ? { 'x-admin-key': payload.adminKey } : {}),
    },
    body: JSON.stringify({
      limit: payload?.limit,
      force: payload?.force,
      minConfidence: payload?.minConfidence,
    }),
  });

  const data = await readJsonResponse<{ error?: string } & PosterEnrichmentResult>(res, 'POSTER_ENRICHMENT_FAILED');
  if (!res.ok) {
    throw new Error(data.error || 'POSTER_ENRICHMENT_FAILED');
  }

  return data as PosterEnrichmentResult;
};

export const fetchBucketItems = async (): Promise<string[]> => {
  const res = await fetch('/api/bucket', { credentials: 'include' });
  const data = await readJsonResponse<{ error?: string; gameIds?: string[] }>(res, 'FAILED_TO_FETCH_BUCKET');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_FETCH_BUCKET');
  }
  return Array.isArray(data.gameIds) ? data.gameIds.map((id) => String(id)) : [];
};

export const addBucketItem = async (gameId: string): Promise<void> => {
  const res = await fetch('/api/bucket', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameId }),
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_ADD_BUCKET_ITEM');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_ADD_BUCKET_ITEM');
  }
};

export const removeBucketItem = async (gameId: string): Promise<void> => {
  const res = await fetch(`/api/bucket?gameId=${encodeURIComponent(gameId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_REMOVE_BUCKET_ITEM');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_REMOVE_BUCKET_ITEM');
  }
};

export const replaceBucketItems = async (gameIds: string[]): Promise<void> => {
  const res = await fetch('/api/bucket', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameIds }),
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_SYNC_BUCKET');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_SYNC_BUCKET');
  }
};

export const fetchFriends = async (): Promise<Friend[]> => {
  const res = await fetch('/api/friends', { credentials: 'include' });
  const data = await readJsonResponse<{ error?: string; friends?: Array<{ username: string; status?: Friend['status']; game?: string }> }>(res, 'FAILED_TO_FETCH_FRIENDS');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_FETCH_FRIENDS');
  }

  if (!Array.isArray(data.friends)) return [];

  return data.friends.map((friend) => ({
    username: friend.username,
    status: friend.status ?? 'offline',
    game: friend.game,
  }));
};

export const addFriend = async (username: string): Promise<void> => {
  const res = await fetch('/api/friends', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_ADD_FRIEND');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_ADD_FRIEND');
  }
};

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  const data = await readJsonResponse<{ error?: string; notifications?: AppNotification[] }>(res, 'FAILED_TO_FETCH_NOTIFICATIONS');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_FETCH_NOTIFICATIONS');
  }
  return Array.isArray(data.notifications) ? data.notifications : [];
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const res = await fetch('/api/notifications?action=mark-all-read', {
    method: 'PATCH',
    credentials: 'include',
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_MARK_NOTIFICATIONS_READ');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_MARK_NOTIFICATIONS_READ');
  }
};

export const dismissNotification = async (id: string): Promise<void> => {
  const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_DISMISS_NOTIFICATION');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_DISMISS_NOTIFICATION');
  }
};

export const clearNotifications = async (): Promise<void> => {
  const res = await fetch('/api/notifications', {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await readJsonResponse<{ error?: string; ok?: boolean }>(res, 'FAILED_TO_CLEAR_NOTIFICATIONS');
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_CLEAR_NOTIFICATIONS');
  }
};

// ============================================================
// MESSAGING API HELPERS
// ============================================================

export const fetchConversations = async (): Promise<Conversation[]> => {
  const res = await fetch('/api/messages', {
    credentials: 'include',
  });
  const data = await readJsonResponse<Conversation[]>(res, 'FAILED_TO_FETCH_CONVERSATIONS');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_CONVERSATIONS');
  }
  return data;
};

export const fetchConversation = async (userId: string): Promise<DirectMessage[]> => {
  const res = await fetch(`/api/messages?with=${encodeURIComponent(userId)}`, {
    credentials: 'include',
  });
  const data = await readJsonResponse<DirectMessage[]>(res, 'FAILED_TO_FETCH_CONVERSATION');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_CONVERSATION');
  }
  return data;
};

export const sendMessage = async (recipientId: string, content: string): Promise<DirectMessage> => {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recipientId, content }),
  });
  const data = await readJsonResponse<DirectMessage | { error?: string }>(res, 'FAILED_TO_SEND_MESSAGE');
  if (!res.ok) {
    throw new Error(typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string' ? (data as any).error : 'FAILED_TO_SEND_MESSAGE');
  }
  return data as DirectMessage;
};

export const markMessagesAsRead = async (senderId: string): Promise<void> => {
  const res = await fetch('/api/messages', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ senderId }),
  });
  if (!res.ok) {
    throw new Error('FAILED_TO_MARK_MESSAGES_READ');
  }
};

// ============================================================
// GROUPS API HELPERS
// ============================================================

export const fetchGroups = async (): Promise<MessageGroup[]> => {
  const res = await fetch('/api/groups', {
    credentials: 'include',
  });
  const data = await readJsonResponse<MessageGroup[]>(res, 'FAILED_TO_FETCH_GROUPS');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_GROUPS');
  }
  return data;
};

export const createGroup = async (name: string, description?: string, isPublic = true): Promise<MessageGroup> => {
  const res = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, description, isPublic }),
  });
  const data = await readJsonResponse<MessageGroup | { error?: string }>(res, 'FAILED_TO_CREATE_GROUP');
  if (!res.ok) {
    throw new Error(typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string' ? (data as any).error : 'FAILED_TO_CREATE_GROUP');
  }
  return data as MessageGroup;
};

export const fetchGroupMessages = async (groupId: string): Promise<GroupMessage[]> => {
  const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/messages`, {
    credentials: 'include',
  });
  const data = await readJsonResponse<GroupMessage[]>(res, 'FAILED_TO_FETCH_GROUP_MESSAGES');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_GROUP_MESSAGES');
  }
  return data;
};

export const sendGroupMessage = async (groupId: string, content: string): Promise<GroupMessage> => {
  const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });
  const data = await readJsonResponse<GroupMessage | { error?: string }>(res, 'FAILED_TO_SEND_GROUP_MESSAGE');
  if (!res.ok) {
    throw new Error(typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string' ? (data as any).error : 'FAILED_TO_SEND_GROUP_MESSAGE');
  }
  return data as GroupMessage;
};

export const addGroupMember = async (groupId: string, userId: string): Promise<void> => {
  const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error('FAILED_TO_ADD_GROUP_MEMBER');
  }
};

// ============================================================
// WALLET API HELPERS
// ============================================================

export const fetchWallet = async (): Promise<Wallet> => {
  const res = await fetch('/api/wallet', {
    credentials: 'include',
  });
  const data = await readJsonResponse<Wallet>(res, 'FAILED_TO_FETCH_WALLET');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_WALLET');
  }
  return data;
};

export const topupWallet = async (amount: number, paymentMethodId?: string, description?: string): Promise<{ transaction: WalletTransaction; newBalance: number }> => {
  const res = await fetch('/api/wallet/topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount, paymentMethodId, description }),
  });
  const data = await readJsonResponse<{ transaction: WalletTransaction; newBalance: number } | { error?: string }>(res, 'FAILED_TO_TOPUP_WALLET');
  if (!res.ok) {
    throw new Error(typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string' ? (data as any).error : 'FAILED_TO_TOPUP_WALLET');
  }
  return data as { transaction: WalletTransaction; newBalance: number };
};

export const fetchWalletTransactions = async (limit = 50, offset = 0): Promise<WalletTransaction[]> => {
  const res = await fetch(`/api/wallet/transactions?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  });
  const data = await readJsonResponse<WalletTransaction[]>(res, 'FAILED_TO_FETCH_TRANSACTIONS');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_TRANSACTIONS');
  }
  return data;
};

export const purchaseGame = async (gameId: string, price: number): Promise<{ purchase: GamePurchase; newBalance: number }> => {
  const res = await fetch('/api/wallet/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ gameId, price }),
  });
  const data = await readJsonResponse<{ purchase: GamePurchase; newBalance: number } | { error?: string }>(res, 'FAILED_TO_PURCHASE_GAME');
  if (!res.ok) {
    throw new Error(typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string' ? (data as any).error : 'FAILED_TO_PURCHASE_GAME');
  }
  return data as { purchase: GamePurchase; newBalance: number };
};

export const fetchPurchaseHistory = async (): Promise<GamePurchase[]> => {
  const res = await fetch('/api/wallet/purchases', {
    credentials: 'include',
  });
  const data = await readJsonResponse<GamePurchase[]>(res, 'FAILED_TO_FETCH_PURCHASE_HISTORY');
  if (!res.ok) {
    throw new Error('FAILED_TO_FETCH_PURCHASE_HISTORY');
  }
  return data;
};