import { AdminOverviewResponse, AuthSessionResponse, DownloadUrlResponse, Game, PosterEnrichmentResult, RegisterRomResponse, RomUploadUrlResponse, UserAccount, UserRole } from '../types';

function normalizeGame(raw: unknown): Game | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const price = Number(row.price);

  if (!Number.isFinite(id)) return null;

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
    poster_source: row.poster_source ? String(row.poster_source) : undefined,
    poster_source_url: row.poster_source_url ? String(row.poster_source_url) : undefined,
    poster_confidence: typeof row.poster_confidence === 'number' ? row.poster_confidence : undefined,
    poster_last_checked_at: row.poster_last_checked_at ? String(row.poster_last_checked_at) : undefined,
  };
}

export const fetchGames = async (): Promise<Game[]> => {
  try {
    const res = await fetch('/api/games');
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(normalizeGame).filter((game): game is Game => game !== null);
    } else {
      console.error('API returned non-array data:', data);
      if (data.error) throw new Error(data.error);
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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_FETCH_SESSION');
  }

  return data as AuthSessionResponse;
};

export const fetchAdminOverview = async (): Promise<AdminOverviewResponse> => {
  const res = await fetch('/api/admin/overview', { credentials: 'include' });
  const data = await res.json();

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

  const data = await res.json();
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

  const data = await res.json();
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
    body: JSON.stringify({
      gameId: payload.gameId,
      userId: payload.userId,
      expiresInSeconds: payload.expiresInSeconds,
    }),
  });

  const data = await res.json();
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

  const data = await res.json();
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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'FAILED_TO_REGISTER_ROM');
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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'POSTER_ENRICHMENT_FAILED');
  }

  return data as PosterEnrichmentResult;
};