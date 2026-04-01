-- Neon PostgreSQL bootstrap script for Retro Game Store Platform
-- Run this script in Neon SQL Editor.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(140) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  min_specs JSONB,
  rec_specs JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bucket_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'pending_payment', 'paid', 'fulfilled', 'failed', 'refunded')),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  PRIMARY KEY (order_id, game_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(40) NOT NULL,
  status VARCHAR(25) NOT NULL CHECK (status IN ('initiated', 'authorized', 'captured', 'failed', 'refunded')),
  external_ref VARCHAR(120),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS library_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(25) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Seed users
INSERT INTO users (username, email, password_hash, avatar_url, role)
VALUES
  ('retro_admin', 'admin@retrogrid.com', 'demo_hash_admin', 'https://i.pravatar.cc/150?img=12', 'admin'),
  ('player_one', 'player1@retrogrid.com', 'demo_hash_player1', 'https://i.pravatar.cc/150?img=15', 'player'),
  ('pixel_runner', 'pixel@retrogrid.com', 'demo_hash_player2', 'https://i.pravatar.cc/150?img=21', 'player')
ON CONFLICT (email) DO NOTHING;

-- Seed games (image_url points to project assets used in your frontend)
INSERT INTO games (title, slug, price, category, description, image_url, rating_avg, rating_count, min_specs, rec_specs)
VALUES
  ('NEON STRIKE', 'neon-strike', 29.99, 'Action', 'High-speed glitch combat in the digital void.', '/src/assets/images/f3b7e9f1865a02d3618eb4f41c287bcf.jpg', 4.6, 120, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('VOID RUNNER', 'void-runner', 19.99, 'Racing', 'Escape the collapsing simulation in this racing experience.', '/src/assets/images/afca124bf35229da8841d24ab2ca8c0f.jpg', 4.2, 86, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('CYBER-SOUL', 'cyber-soul', 39.99, 'RPG', 'A deep RPG set in a decaying megacity.', '/src/assets/images/a0b725d92124a133cfb7e86adb934727.jpg', 4.8, 210, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('GLITCH-BIT', 'glitch-bit', 14.99, 'Platformer', 'Retro platforming with a broken twist.', '/src/assets/images/download.jfif', 3.9, 54, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('TERMINAL VELOCITY', 'terminal-velocity', 24.99, 'Shooter', 'Tactical shooter in a low-poly digital landscape.', '/src/assets/images/download (1).jfif', 4.3, 94, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('DATA DRIFTER', 'data-drifter', 9.99, 'Strategy', 'Zen-like strategy game about navigating data streams.', '/src/assets/images/download (2).jfif', 4.0, 70, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('SIGNAL LOST', 'signal-lost', 34.99, 'Horror', 'Investigate a silent satellite in deep space.', '/src/assets/images/download (3).jfif', 4.5, 132, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}'),
  ('GRID WALKER', 'grid-walker', 44.99, 'Action', 'Advanced physics-based parkour in a megastructure.', '/src/assets/images/download (4).jfif', 4.4, 145, '{"os":"Windows 10 64-bit","processor":"Intel Core i5-4460 / AMD FX-6300","memory":"8 GB RAM","graphics":"NVIDIA GeForce GTX 760 / AMD Radeon R7 260x","storage":"20 GB available space"}', '{"os":"Windows 11 64-bit","processor":"Intel Core i7-8700K / AMD Ryzen 5 3600X","memory":"16 GB RAM","graphics":"NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT","storage":"20 GB available space"}')
ON CONFLICT (slug) DO NOTHING;

-- Seed sample friendship and notifications
INSERT INTO friendships (requester_id, addressee_id, status)
SELECT u1.id, u2.id, 'accepted'
FROM users u1
JOIN users u2 ON u1.username = 'player_one' AND u2.username = 'pixel_runner'
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

INSERT INTO notifications (user_id, type, title, body)
SELECT u.id, 'sale', 'FLASH SALE: 48H ONLY', 'NEON STRIKE is discounted for a limited time.'
FROM users u
WHERE u.username = 'player_one';

COMMIT;

-- Quick sanity checks
-- SELECT COUNT(*) AS users_count FROM users;
-- SELECT COUNT(*) AS games_count FROM games;
-- SELECT title, price, image_url FROM games ORDER BY created_at DESC LIMIT 10;
