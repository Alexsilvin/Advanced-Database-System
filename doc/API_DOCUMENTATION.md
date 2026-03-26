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

## 3. Initialization Behavior (Not an endpoint)
On server startup:
1. Validates `DATABASE_URL` availability.
2. Creates required tables if they do not exist.
3. Seeds initial games if catalog table is empty.

## 4. Planned API Extensions
To support full commerce and social features:
- `POST /api/auth/login`
- `GET/POST/DELETE /api/bucket`
- `POST /api/orders`
- `GET /api/library/:userId`
- `POST /api/friends/request`
- `PATCH /api/friends/:id`
- `GET/PATCH /api/notifications`
