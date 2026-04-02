# API Documentation

## Base URL
- Development: `http://localhost:3000`

## 1. GET `/api/games`
Returns game catalog data.

### Behavior
- If DB is connected and has records, returns DB games.
- If DB is disconnected or query fails, returns fallback mock games.

### Response (200)
```json
[
  {
    "id": 1,
    "title": "NEON STRIKE",
    "price": 29.99,
    "description": "High-speed glitch combat...",
    "image": "https://...",
    "category": "Action"
  }
]
```

### Error Handling
- Endpoint is resilient and usually still returns data through fallback mode.

## 2. GET `/api/users`
Returns user list from database.

### Response (200)
```json
[
  {
    "id": 1,
    "username": "player_one",
    "avatar": "https://..."
  }
]
```

### Error Response (500)
```json
{
  "error": "Failed to fetch users"
}
```

or

```json
{
  "error": "Database not configured"
}
```

## 3. POST `/api/game-download-url`
Creates a short-lived signed URL for downloading a ROM from object storage.

### Headers
- `Content-Type: application/json`
- `x-admin-key: <ROM_ADMIN_KEY>` (required only if `ROM_ADMIN_KEY` is configured)

### Request Body
```json
{
  "gameId": "uuid-of-game",
  "userId": "uuid-of-user-optional",
  "expiresInSeconds": 60
}
```

### Notes
- Requires `games.is_downloadable = true` and `games.rom_storage_key`.
- If `DOWNLOAD_REQUIRE_LIBRARY=true`, the API verifies ownership in `library_items`.

### Response (200)
```json
{
  "gameId": "uuid-of-game",
  "title": "NEON STRIKE",
  "signedUrl": "https://...",
  "expiresInSeconds": 60
}
```

### Error Response Examples
```json
{
  "error": "User does not own this game"
}
```

```json
{
  "error": "Failed to create signed download URL"
}
```

## 4. POST `/api/enrich-posters`
Runs poster enrichment for games using RAWG and/or IGDB, then updates `games.image_url`.

### Headers
- `Content-Type: application/json`
- `x-admin-key: <POSTER_ENRICH_ADMIN_KEY>` (required only if configured)

### Request Body
```json
{
  "limit": 10,
  "force": false,
  "minConfidence": 0.65
}
```

### Response (200)
```json
{
  "attempted": 10,
  "updated": [
    { "id": "...", "title": "NEON STRIKE", "source": "igdb", "confidence": 0.91 }
  ],
  "skipped": [
    { "id": "...", "title": "UNKNOWN GAME", "reason": "No confident match" }
  ],
  "minConfidence": 0.65
}
```

## 5. POST `/api/register-rom`
Registers ROM file metadata for an existing game after uploading the binary to object storage.

### Headers
- `Content-Type: application/json`
- `x-admin-key: <ROM_ADMIN_KEY>` (required only if configured)

### Request Body
```json
{
  "gameId": "uuid-of-game",
  "romStorageKey": "sfc/super-mario-world.zip",
  "romFilename": "super-mario-world.zip",
  "romSizeBytes": 1234567,
  "romSha256": "abc123...",
  "licenseType": "licensed",
  "isDownloadable": true
}
```

### Response (200)
```json
{
  "game": {
    "id": "uuid-of-game",
    "title": "NEON STRIKE",
    "rom_storage_key": "sfc/super-mario-world.zip",
    "rom_filename": "super-mario-world.zip",
    "is_downloadable": true
  }
}
```

## 6. POST `/api/rom-upload-url`
Creates a short-lived signed PUT URL for uploading a ROM to Filebase S3 storage.

### Headers
- `Content-Type: application/json`
- `x-admin-key: <ROM_ADMIN_KEY>` (required only if configured)

### Request Body
```json
{
  "gameId": "uuid-of-game",
  "filename": "super-mario-world.zip",
  "contentType": "application/zip",
  "expiresInSeconds": 300
}
```

### Response (200)
```json
{
  "gameId": "uuid-of-game",
  "title": "NEON STRIKE",
  "uploadUrl": "https://...",
  "storageKey": "roms/uuid-of-game/super-mario-world.zip",
  "expiresInSeconds": 300
}
```

## 7. Small Upload Page Flow
The admin upload page in the frontend does the following:
1. Requests `/api/rom-upload-url`.
2. Uploads the selected file directly to Filebase with the signed PUT URL.
3. Calls `/api/register-rom` to save the storage key and metadata.

## 8. Initialization Behavior (Not an endpoint)
On server startup:
1. Validates `DATABASE_URL` availability.
2. Creates required tables if they do not exist.
3. Seeds initial games if catalog table is empty.

## 9. Planned API Extensions
To support full commerce and social features:
- `POST /api/auth/login`
- `GET/POST/DELETE /api/bucket`
- `POST /api/orders`
- `GET /api/library/:userId`
- `POST /api/friends/request`
- `PATCH /api/friends/:id`
- `GET/PATCH /api/notifications`
