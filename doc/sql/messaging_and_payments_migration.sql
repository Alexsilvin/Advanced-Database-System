-- =============================================================================
-- MESSAGING AND PAYMENT SYSTEM MIGRATION
-- Adds direct messaging, group chats, and wallet/payment features
-- =============================================================================

BEGIN;

-- ============================================================
-- MESSAGING SYSTEM TABLES
-- ============================================================

-- Direct messages between users
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read);

-- Group chats / Communities for discussing games and trends
CREATE TABLE IF NOT EXISTS message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_groups_creator ON message_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_message_groups_public ON message_groups(is_public);

-- Group membership
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_admin ON group_members(group_id, is_admin);

-- Group messages
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(group_id, created_at DESC);

-- ============================================================
-- PAYMENT/WALLET SYSTEM TABLES
-- ============================================================

-- User wallets
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- Payment methods (credit card, PayPal, etc.)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'credit_card', 'paypal', 'debit_card', etc.
  provider VARCHAR(255), -- 'stripe', 'paypal', etc.
  external_id VARCHAR(255), -- ID from payment provider (e.g., Stripe token)
  last_four VARCHAR(4),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default);

-- Wallet transactions (adding funds)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'topup', 'purchase', 'refund', 'admin_credit'
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  description VARCHAR(255),
  provider_transaction_id VARCHAR(255), -- Reference from payment provider
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(user_id, created_at DESC);

-- Game purchases
CREATE TABLE IF NOT EXISTS game_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id VARCHAR(255) NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL CHECK (price_paid >= 0),
  transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_purchases_user ON game_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_game_purchases_game ON game_purchases(game_id);
CREATE INDEX IF NOT EXISTS idx_game_purchases_user_game ON game_purchases(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_game_purchases_purchased_at ON game_purchases(user_id, purchased_at DESC);

-- ============================================================
-- AUTO-CREATE WALLET ON USER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION create_user_wallet() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_wallet_on_signup ON users;
CREATE TRIGGER trigger_create_wallet_on_signup
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_wallet();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID) RETURNS BIGINT AS $$
DECLARE
  count BIGINT;
BEGIN
  SELECT COUNT(*) INTO count
  FROM messages
  WHERE recipient_id = user_id AND is_read = FALSE;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(user_id UUID, sender_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE, read_at = NOW()
  WHERE recipient_id = user_id AND sender_id = sender_id AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

COMMIT;
