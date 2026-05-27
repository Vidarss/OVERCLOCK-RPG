/*
  # Tournament brackets and set items

  1. Changes to `tournaments`
    - Add `entry_fee_diamonds` (int) — diamonds required to join
    - Add `player_cap` (int) — max players per bracket
    - Add `bracket_number` (int) — instance number within a template (e.g. "GENESIS CIRCUIT #3")
    - Add `template_name` (text) — the base event name without bracket number

  2. New Table: `set_items`
    - Stores Mythic set pieces owned by a player (equipped or in inventory)
    - `id`, `user_id`, `set_id`, `item_data` (jsonb), `obtained_at`

  3. Security
    - RLS on set_items: users can only read/insert their own rows

  4. Seeds
    - Multiple bracket instances of GENESIS CIRCUIT seeded with varying start times
*/

-- Add columns to tournaments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='entry_fee_diamonds') THEN
    ALTER TABLE tournaments ADD COLUMN entry_fee_diamonds int NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='player_cap') THEN
    ALTER TABLE tournaments ADD COLUMN player_cap int NOT NULL DEFAULT 32;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='bracket_number') THEN
    ALTER TABLE tournaments ADD COLUMN bracket_number int NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='template_name') THEN
    ALTER TABLE tournaments ADD COLUMN template_name text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Set items table
CREATE TABLE IF NOT EXISTS set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  set_id text NOT NULL,
  item_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  obtained_at timestamptz DEFAULT now()
);

ALTER TABLE set_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own set items"
  ON set_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own set items"
  ON set_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own set items"
  ON set_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update the existing seeded tournament with proper template fields
UPDATE tournaments
SET
  template_name = 'GENESIS CIRCUIT',
  bracket_number = 1,
  entry_fee_diamonds = 3,
  player_cap = 32
WHERE name = 'GENESIS CIRCUIT — Week 1' OR template_name = '';

-- Seed additional brackets for GENESIS CIRCUIT (active) with different caps
INSERT INTO tournaments (name, template_name, bracket_number, starts_at, ends_at, prize_diamonds, status, entry_fee_diamonds, player_cap)
VALUES
  ('GENESIS CIRCUIT #2', 'GENESIS CIRCUIT', 2, now(), now() + interval '4 hours', 200, 'active', 3, 16),
  ('GENESIS CIRCUIT #3', 'GENESIS CIRCUIT', 3, now(), now() + interval '4 hours', 500, 'active', 3, 64),
  ('GENESIS CIRCUIT #4', 'GENESIS CIRCUIT', 4, now() + interval '4 hours', now() + interval '8 hours', 200, 'upcoming', 3, 16),
  ('GENESIS CIRCUIT #5', 'GENESIS CIRCUIT', 5, now() + interval '4 hours', now() + interval '8 hours', 500, 'upcoming', 3, 64),
  ('GENESIS CIRCUIT #6', 'GENESIS CIRCUIT', 6, now() + interval '8 hours', now() + interval '12 hours', 200, 'upcoming', 3, 32),
  ('GENESIS CIRCUIT #7', 'GENESIS CIRCUIT', 7, now() + interval '8 hours', now() + interval '12 hours', 500, 'upcoming', 3, 64),
  ('GENESIS CIRCUIT #8', 'GENESIS CIRCUIT', 8, now() + interval '12 hours', now() + interval '16 hours', 200, 'upcoming', 3, 32),
  ('FROSTBYTE GAUNTLET #1', 'FROSTBYTE GAUNTLET', 1, now() + interval '2 hours', now() + interval '6 hours', 350, 'upcoming', 5, 32),
  ('FROSTBYTE GAUNTLET #2', 'FROSTBYTE GAUNTLET', 2, now() + interval '6 hours', now() + interval '10 hours', 350, 'upcoming', 5, 32),
  ('NULL_VOID TRIALS #1', 'NULL_VOID TRIALS', 1, now() + interval '1 hour', now() + interval '5 hours', 800, 'upcoming', 8, 16),
  ('NULL_VOID TRIALS #2', 'NULL_VOID TRIALS', 2, now() + interval '5 hours', now() + interval '9 hours', 800, 'upcoming', 8, 16)
ON CONFLICT DO NOTHING;

-- Index for bracket queries
CREATE INDEX IF NOT EXISTS idx_tournaments_template_status ON tournaments(template_name, status);
CREATE INDEX IF NOT EXISTS idx_tournaments_starts_at ON tournaments(starts_at);
