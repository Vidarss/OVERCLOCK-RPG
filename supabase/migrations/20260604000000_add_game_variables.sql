/*
  # Add Game Variables Table
  
  This migration adds a normalized game_variables table to store critical
  game state values that were previously only stored in the player_saves JSONB blob.
  
  Benefits:
  - Server-side validation of game progress
  - Analytics and leaderboard queries without JSONB parsing
  - Easier to query and index specific values
  - Anti-cheat verification
  
  ## Variables Tracked
  - Core progression: stage, highestStage, maxStage, gold, diamonds, scrap
  - Overclock system: overclockCount, overclockTier, totalOverclocks
  - Skills: skillPoints, claimedSkillPointMilestones
  - Equipment: motherboardTier, ramSlots, expansionSlots
  - Combat: totalDamageDealt
  - Hero upgrades and skill upgrades stored as JSONB for flexibility
  - Item/set progress stored as JSONB
*/

-- ============================================
-- GAME VARIABLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core progression
  stage integer NOT NULL DEFAULT 1,
  highest_stage integer NOT NULL DEFAULT 1,
  max_stage integer NOT NULL DEFAULT 1,
  gold bigint NOT NULL DEFAULT 0,
  diamonds integer NOT NULL DEFAULT 0,
  scrap integer NOT NULL DEFAULT 0,
  
  -- Overclock system
  overclock_count integer NOT NULL DEFAULT 0,
  overclock_tier integer NOT NULL DEFAULT 0,
  total_overclocks integer NOT NULL DEFAULT 0,
  overclock_upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Skills
  skill_points integer NOT NULL DEFAULT 0,
  claimed_skill_point_milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_cooldowns jsonb NOT NULL DEFAULT '{}'::jsonb,
  skill_upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Equipment / Motherboard
  motherboard_tier integer NOT NULL DEFAULT 0,
  ram_slots integer NOT NULL DEFAULT 1,
  expansion_slots integer NOT NULL DEFAULT 0,
  
  -- Combat stats
  total_damage_dealt bigint NOT NULL DEFAULT 0,
  
  -- Components (hardware modules) - stored as JSONB for flexibility
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Hero upgrades (tap power, crit chance, crit damage)
  hero_upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Inventory and equipped items
  inventory jsonb NOT NULL DEFAULT '[]'::jsonb,
  equipped_items jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Set items (Mythic collection)
  set_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  collected_sets jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Tournament tracking
  tournament_max_stage integer NOT NULL DEFAULT 0,
  tournament_session_id text,
  
  -- Timestamps
  last_save_time bigint NOT NULL DEFAULT 0,
  last_tick_time bigint NOT NULL DEFAULT 0,
  schema_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure one row per user
CREATE UNIQUE INDEX IF NOT EXISTS game_variables_user_id_idx ON game_variables(user_id);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_game_variables_highest_stage ON game_variables(highest_stage DESC);
CREATE INDEX IF NOT EXISTS idx_game_variables_overclock_count ON game_variables(overclock_count DESC);
CREATE INDEX IF NOT EXISTS idx_game_variables_total_damage ON game_variables(total_damage_dealt DESC);

-- Enable RLS
ALTER TABLE game_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own game variables"
  ON game_variables FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game variables"
  ON game_variables FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game variables"
  ON game_variables FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE TRIGGER
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_variables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on changes
DROP TRIGGER IF EXISTS game_variables_updated_at ON game_variables;
CREATE TRIGGER game_variables_updated_at
  BEFORE UPDATE ON game_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_game_variables_timestamp();

-- ============================================
-- USER PRESENCE TABLE (for online status tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS user_presence_user_id_idx ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online) WHERE is_online = true;

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upsert own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SYNC FUNCTION: player_saves -> game_variables
-- ============================================

-- Function to sync game variables from player_saves JSONB on save
CREATE OR REPLACE FUNCTION sync_game_variables_from_save()
RETURNS TRIGGER AS $$
DECLARE
  save_json jsonb;
BEGIN
  save_json := NEW.save_data;
  
  -- Upsert into game_variables with values from the save
  INSERT INTO game_variables (
    user_id,
    stage,
    highest_stage,
    max_stage,
    gold,
    diamonds,
    scrap,
    overclock_count,
    overclock_tier,
    total_overclocks,
    overclock_upgrades,
    skill_points,
    claimed_skill_point_milestones,
    skill_cooldowns,
    skill_upgrades,
    motherboard_tier,
    ram_slots,
    expansion_slots,
    total_damage_dealt,
    components,
    hero_upgrades,
    inventory,
    equipped_items,
    set_items,
    collected_sets,
    tournament_max_stage,
    tournament_session_id,
    last_save_time,
    last_tick_time,
    schema_version
  ) VALUES (
    NEW.user_id,
    COALESCE((save_json->>'stage')::integer, 1),
    COALESCE((save_json->>'highestStage')::integer, 1),
    COALESCE((save_json->>'maxStage')::integer, 1),
    COALESCE((save_json->>'gold')::bigint, 0),
    COALESCE((save_json->>'diamonds')::integer, 0),
    COALESCE((save_json->>'scrap')::integer, 0),
    COALESCE((save_json->>'overclockCount')::integer, 0),
    COALESCE((save_json->>'overclockTier')::integer, 0),
    COALESCE((save_json->>'totalOverclocks')::integer, 0),
    COALESCE(save_json->'overclockUpgrades', '{}'::jsonb),
    COALESCE((save_json->>'skillPoints')::integer, 0),
    COALESCE(save_json->'claimedSkillPointMilestones', '[]'::jsonb),
    COALESCE(save_json->'skillCooldowns', '{}'::jsonb),
    COALESCE(save_json->'skillUpgrades', '{}'::jsonb),
    COALESCE((save_json->>'motherboardTier')::integer, 0),
    COALESCE((save_json->>'ramSlots')::integer, 1),
    COALESCE((save_json->>'expansionSlots')::integer, 0),
    COALESCE((save_json->>'totalDamageDealt')::bigint, 0),
    COALESCE(save_json->'components', '{}'::jsonb),
    COALESCE(save_json->'heroUpgrades', '{}'::jsonb),
    COALESCE(save_json->'inventory', '[]'::jsonb),
    COALESCE(save_json->'equippedItems', '{}'::jsonb),
    COALESCE(save_json->'setItems', '[]'::jsonb),
    COALESCE(save_json->'collectedSets', '{}'::jsonb),
    COALESCE((save_json->>'tournamentMaxStage')::integer, 0),
    save_json->>'tournamentSessionId',
    COALESCE((save_json->>'lastSaveTime')::bigint, 0),
    COALESCE((save_json->>'lastTickTime')::bigint, 0),
    COALESCE(NEW.schema_version, 1)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stage = EXCLUDED.stage,
    highest_stage = EXCLUDED.highest_stage,
    max_stage = EXCLUDED.max_stage,
    gold = EXCLUDED.gold,
    diamonds = EXCLUDED.diamonds,
    scrap = EXCLUDED.scrap,
    overclock_count = EXCLUDED.overclock_count,
    overclock_tier = EXCLUDED.overclock_tier,
    total_overclocks = EXCLUDED.total_overclocks,
    overclock_upgrades = EXCLUDED.overclock_upgrades,
    skill_points = EXCLUDED.skill_points,
    claimed_skill_point_milestones = EXCLUDED.claimed_skill_point_milestones,
    skill_cooldowns = EXCLUDED.skill_cooldowns,
    skill_upgrades = EXCLUDED.skill_upgrades,
    motherboard_tier = EXCLUDED.motherboard_tier,
    ram_slots = EXCLUDED.ram_slots,
    expansion_slots = EXCLUDED.expansion_slots,
    total_damage_dealt = EXCLUDED.total_damage_dealt,
    components = EXCLUDED.components,
    hero_upgrades = EXCLUDED.hero_upgrades,
    inventory = EXCLUDED.inventory,
    equipped_items = EXCLUDED.equipped_items,
    set_items = EXCLUDED.set_items,
    collected_sets = EXCLUDED.collected_sets,
    tournament_max_stage = EXCLUDED.tournament_max_stage,
    tournament_session_id = EXCLUDED.tournament_session_id,
    last_save_time = EXCLUDED.last_save_time,
    last_tick_time = EXCLUDED.last_tick_time,
    schema_version = EXCLUDED.schema_version,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on player_saves to auto-sync to game_variables
DROP TRIGGER IF EXISTS sync_game_variables_trigger ON player_saves;
CREATE TRIGGER sync_game_variables_trigger
  AFTER INSERT OR UPDATE ON player_saves
  FOR EACH ROW
  EXECUTE FUNCTION sync_game_variables_from_save();

-- ============================================
-- BACKFILL: Sync existing player_saves to game_variables
-- ============================================

-- Backfill any existing saves
INSERT INTO game_variables (
  user_id,
  stage,
  highest_stage,
  max_stage,
  gold,
  diamonds,
  scrap,
  overclock_count,
  overclock_tier,
  total_overclocks,
  overclock_upgrades,
  skill_points,
  claimed_skill_point_milestones,
  skill_cooldowns,
  skill_upgrades,
  motherboard_tier,
  ram_slots,
  expansion_slots,
  total_damage_dealt,
  components,
  hero_upgrades,
  inventory,
  equipped_items,
  set_items,
  collected_sets,
  tournament_max_stage,
  tournament_session_id,
  last_save_time,
  last_tick_time,
  schema_version
)
SELECT
  ps.user_id,
  COALESCE((ps.save_data->>'stage')::integer, 1),
  COALESCE((ps.save_data->>'highestStage')::integer, 1),
  COALESCE((ps.save_data->>'maxStage')::integer, 1),
  COALESCE((ps.save_data->>'gold')::bigint, 0),
  COALESCE((ps.save_data->>'diamonds')::integer, 0),
  COALESCE((ps.save_data->>'scrap')::integer, 0),
  COALESCE((ps.save_data->>'overclockCount')::integer, 0),
  COALESCE((ps.save_data->>'overclockTier')::integer, 0),
  COALESCE((ps.save_data->>'totalOverclocks')::integer, 0),
  COALESCE(ps.save_data->'overclockUpgrades', '{}'::jsonb),
  COALESCE((ps.save_data->>'skillPoints')::integer, 0),
  COALESCE(ps.save_data->'claimedSkillPointMilestones', '[]'::jsonb),
  COALESCE(ps.save_data->'skillCooldowns', '{}'::jsonb),
  COALESCE(ps.save_data->'skillUpgrades', '{}'::jsonb),
  COALESCE((ps.save_data->>'motherboardTier')::integer, 0),
  COALESCE((ps.save_data->>'ramSlots')::integer, 1),
  COALESCE((ps.save_data->>'expansionSlots')::integer, 0),
  COALESCE((ps.save_data->>'totalDamageDealt')::bigint, 0),
  COALESCE(ps.save_data->'components', '{}'::jsonb),
  COALESCE(ps.save_data->'heroUpgrades', '{}'::jsonb),
  COALESCE(ps.save_data->'inventory', '[]'::jsonb),
  COALESCE(ps.save_data->'equippedItems', '{}'::jsonb),
  COALESCE(ps.save_data->'setItems', '[]'::jsonb),
  COALESCE(ps.save_data->'collectedSets', '{}'::jsonb),
  COALESCE((ps.save_data->>'tournamentMaxStage')::integer, 0),
  ps.save_data->>'tournamentSessionId',
  COALESCE((ps.save_data->>'lastSaveTime')::bigint, 0),
  COALESCE((ps.save_data->>'lastTickTime')::bigint, 0),
  COALESCE(ps.schema_version, 1)
FROM player_saves ps
ON CONFLICT (user_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  highest_stage = EXCLUDED.highest_stage,
  max_stage = EXCLUDED.max_stage,
  gold = EXCLUDED.gold,
  diamonds = EXCLUDED.diamonds,
  scrap = EXCLUDED.scrap,
  overclock_count = EXCLUDED.overclock_count,
  overclock_tier = EXCLUDED.overclock_tier,
  total_overclocks = EXCLUDED.total_overclocks,
  overclock_upgrades = EXCLUDED.overclock_upgrades,
  skill_points = EXCLUDED.skill_points,
  claimed_skill_point_milestones = EXCLUDED.claimed_skill_point_milestones,
  skill_cooldowns = EXCLUDED.skill_cooldowns,
  skill_upgrades = EXCLUDED.skill_upgrades,
  motherboard_tier = EXCLUDED.motherboard_tier,
  ram_slots = EXCLUDED.ram_slots,
  expansion_slots = EXCLUDED.expansion_slots,
  total_damage_dealt = EXCLUDED.total_damage_dealt,
  components = EXCLUDED.components,
  hero_upgrades = EXCLUDED.hero_upgrades,
  inventory = EXCLUDED.inventory,
  equipped_items = EXCLUDED.equipped_items,
  set_items = EXCLUDED.set_items,
  collected_sets = EXCLUDED.collected_sets,
  tournament_max_stage = EXCLUDED.tournament_max_stage,
  tournament_session_id = EXCLUDED.tournament_session_id,
  last_save_time = EXCLUDED.last_save_time,
  last_tick_time = EXCLUDED.last_tick_time,
  schema_version = EXCLUDED.schema_version,
  updated_at = now();
