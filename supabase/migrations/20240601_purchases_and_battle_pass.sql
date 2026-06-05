-- ═══════════════════════════════════════════════════════════════════════════════
-- OVERCLOCK.EXE - Database Schema Migration
-- Battle Pass & Purchases System
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- PURCHASES TABLE
-- Records all in-app purchases from Stripe and Google Play
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product info
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('battle_pass', 'currency', 'cosmetic')),
  
  -- Stripe payment info (for web payments)
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  
  -- Google Play payment info (for Android)
  google_play_purchase_token TEXT,
  google_play_package_name TEXT,
  google_play_order_id TEXT,
  
  -- Apple App Store payment info (for iOS - future)
  apple_transaction_id TEXT,
  apple_receipt_data TEXT,
  
  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'google_play', 'app_store')),
  
  -- Timestamps
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for purchases table
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_google_play_token ON purchases(google_play_purchase_token) WHERE google_play_purchase_token IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BATTLE PASS TABLE
-- Tracks user's battle pass progression per season
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS battle_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL,
  
  -- Premium status
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  purchase_date BIGINT, -- Unix timestamp of purchase
  
  -- Progression
  current_xp INTEGER NOT NULL DEFAULT 0,
  current_tier INTEGER NOT NULL DEFAULT 1,
  
  -- Claimed rewards (stored as JSON arrays of tier numbers)
  claimed_free_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  claimed_premium_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Active boosts from battle pass rewards
  xp_boost_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  gold_boost_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint per user per season
  UNIQUE(user_id, season_id)
);

-- Indexes for battle_pass table
CREATE INDEX IF NOT EXISTS idx_battle_pass_user_id ON battle_pass(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_pass_season ON battle_pass(season_id);
CREATE INDEX IF NOT EXISTS idx_battle_pass_user_season ON battle_pass(user_id, season_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update purchases (via webhooks)
CREATE POLICY "Service role can manage purchases" ON purchases
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on battle_pass table
ALTER TABLE battle_pass ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own battle pass
CREATE POLICY "Users can view own battle pass" ON battle_pass
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own battle pass" ON battle_pass
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all battle pass records
CREATE POLICY "Service role can manage battle pass" ON battle_pass
  FOR ALL USING (auth.role() = 'service_role');

-- Users can insert their own battle pass record
CREATE POLICY "Users can insert own battle pass" ON battle_pass
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to battle_pass
DROP TRIGGER IF EXISTS update_battle_pass_updated_at ON battle_pass;
CREATE TRIGGER update_battle_pass_updated_at
  BEFORE UPDATE ON battle_pass
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
