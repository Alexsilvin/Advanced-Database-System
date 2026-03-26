# Database Design and Entity Relationship Report

## 1. Purpose
This document explains the current database schema, relationships, and interaction flows for the NEON-GRID game-selling platform.

## 2. Current Physical Schema (PostgreSQL)

### 2.1 `users`
- `id` (SERIAL, PK)
- `username` (TEXT, UNIQUE)
- `avatar` (TEXT)

### 2.2 `games`
- `id` (SERIAL, PK)
- `title` (TEXT)
- `price` (REAL)
- `description` (TEXT)
- `image` (TEXT)
- `category` (TEXT)

### 2.3 `library`
- `user_id` (INTEGER, FK -> `users.id`)
- `game_id` (INTEGER, FK -> `games.id`)

### 2.4 `friends`
- `user_id` (INTEGER, FK -> `users.id`)
- `friend_id` (INTEGER, FK -> `users.id`)
- `status` (TEXT, expected values: `pending`, `accepted`)

## 3. Relationship Mapping

1. One user can own many games through `library`.
2. One game can belong to many users through `library`.
3. `users` to `games` is therefore a many-to-many relationship via `library`.
4. Friendships are self-referential many-to-many relationships on `users`, represented via `friends`.

## 4. Cardinalities

- `users (1) -> (N) library`
- `games (1) -> (N) library`
- `users (1) -> (N) friends` as requester (`user_id`)
- `users (1) -> (N) friends` as recipient (`friend_id`)

## 5. Business Interaction Flows with Data

### 5.1 Browse Catalog
- Read from `games` table using `GET /api/games`.
- If DB is unavailable, server returns fallback mock catalog.

### 5.2 Acquire Game(s)
- Current UI behavior tracks bucket/library state in-memory.
- Target persisted behavior:
  1. Persist bucket entries.
  2. Create transaction/order.
  3. Insert ownership rows into `library`.
  4. Clear processed bucket.

### 5.3 Library Access
- Current UI uses local state from acquisition workflow.
- Target persisted behavior queries `library` joined with `games` per user.

### 5.4 Social Graph
- Current UI friends/notifications are mock-backed.
- Existing schema supports friendship relation persistence.

## 6. Integrity and Constraints (Current and Recommended)

### Current
- Primary keys on `users.id`, `games.id`
- Unique username on `users.username`
- Foreign keys in `library` and `friends`

### Recommended Additions
1. Add composite PK or unique constraint on `library(user_id, game_id)`.
2. Add composite unique constraint on `friends(user_id, friend_id)`.
3. Add check constraint for `friends.status IN ('pending', 'accepted', 'blocked')`.
4. Add NOT NULL constraints on required fields (`title`, `price`, etc.).
5. Add index on `games.category` and searchable title patterns.

## 7. Data Model Gaps for a Complete Commerce Platform

To fully model a production game store, add:
- `bucket_items` (persistent cart)
- `orders`
- `order_items`
- `payments`
- `reviews`
- `notifications`
- `user_sessions`

## 8. Conceptual ER Summary

- **User** owns **Game** via **Library**.
- **User** connects with **User** via **Friendship**.
- **User** receives **Notification** (target model).
- **User** creates **Order** with **OrderItems** for one or more **Game** entries (target model).

## 9. SQL Snapshot (Current Bootstrap)

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  title TEXT,
  price REAL,
  description TEXT,
  image TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS library (
  user_id INTEGER REFERENCES users(id),
  game_id INTEGER REFERENCES games(id)
);

CREATE TABLE IF NOT EXISTS friends (
  user_id INTEGER REFERENCES users(id),
  friend_id INTEGER REFERENCES users(id),
  status TEXT
);
```

## 10. Conclusion
The current schema supports core catalog and ownership foundations with social linkage. For complete end-to-end e-commerce durability and auditability, persistence should be extended to bucket, order, payment, and notification domains.
