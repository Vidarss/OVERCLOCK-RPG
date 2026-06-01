-- Add missing columns to tournaments table for multiplayer support
ALTER TABLE tournaments 
  ADD COLUMN IF NOT EXISTS template_name text DEFAULT 'quick_clash',
  ADD COLUMN IF NOT EXISTS bracket_number integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_diamonds integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS entry_fee_diamonds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player_cap integer DEFAULT 100;

-- Allow join_closes_at to be nullable
ALTER TABLE tournaments ALTER COLUMN join_closes_at DROP NOT NULL;

-- Add missing columns to tournament_entries table  
ALTER TABLE tournament_entries
  ADD COLUMN IF NOT EXISTS rank integer,
  ADD COLUMN IF NOT EXISTS start_max_stage integer DEFAULT 1;

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_tournament_entries_score ON tournament_entries(tournament_id, score DESC);

-- Function to get or create current tournaments based on templates
-- This runs server-side to ensure all players see the same tournaments
CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void AS $$
DECLARE
  template RECORD;
  cycle_num integer;
  t_start timestamp with time zone;
  t_end timestamp with time zone;
  t_join_closes timestamp with time zone;
  existing_count integer;
BEGIN
  -- Template definitions (matching TOURNAMENT_CONFIG.localTemplates)
  FOR template IN 
    SELECT * FROM (VALUES 
      ('quick_clash', 'QUICK CLASH', 2, 1.5, 50, 0, 100),
      ('daily_grind', 'DAILY GRIND', 24, 20, 200, 10, 50),
      ('weekend_war', 'WEEKEND WAR', 48, 36, 500, 25, 200)
    ) AS t(id, name, duration_hours, join_window_hours, prize, entry_fee, cap)
  LOOP
    -- Calculate current cycle
    cycle_num := FLOOR(EXTRACT(EPOCH FROM NOW()) / (template.duration_hours * 3600));
    t_start := to_timestamp(cycle_num * template.duration_hours * 3600);
    t_end := t_start + (template.duration_hours || ' hours')::interval;
    t_join_closes := t_start + (template.join_window_hours || ' hours')::interval;
    
    -- Check if tournament for this cycle exists
    SELECT COUNT(*) INTO existing_count 
    FROM tournaments 
    WHERE template_name = template.id 
      AND bracket_number = cycle_num;
    
    -- Create if not exists
    IF existing_count = 0 THEN
      INSERT INTO tournaments (
        id, name, template_name, bracket_number, 
        starts_at, ends_at, join_closes_at,
        prize_diamonds, entry_fee_diamonds, player_cap, status
      ) VALUES (
        gen_random_uuid(),
        template.name || ' #' || (cycle_num % 1000),
        template.id,
        cycle_num,
        t_start,
        t_end,
        t_join_closes,
        template.prize,
        template.entry_fee,
        template.cap,
        CASE 
          WHEN NOW() < t_start THEN 'upcoming'
          WHEN NOW() >= t_start AND NOW() < t_end THEN 'active'
          ELSE 'ended'
        END
      );
    END IF;
    
    -- Also create next cycle tournament if it doesn't exist
    SELECT COUNT(*) INTO existing_count 
    FROM tournaments 
    WHERE template_name = template.id 
      AND bracket_number = cycle_num + 1;
    
    IF existing_count = 0 THEN
      INSERT INTO tournaments (
        id, name, template_name, bracket_number,
        starts_at, ends_at, join_closes_at,
        prize_diamonds, entry_fee_diamonds, player_cap, status
      ) VALUES (
        gen_random_uuid(),
        template.name || ' #' || ((cycle_num + 1) % 1000),
        template.id,
        cycle_num + 1,
        t_end,
        t_end + (template.duration_hours || ' hours')::interval,
        t_end + (template.join_window_hours || ' hours')::interval,
        template.prize,
        template.entry_fee,
        template.cap,
        'upcoming'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run immediately to seed tournaments
SELECT ensure_active_tournaments();

-- Update statuses of existing tournaments based on current time
UPDATE tournaments SET status = 
  CASE 
    WHEN NOW() < starts_at THEN 'upcoming'
    WHEN NOW() >= starts_at AND NOW() < ends_at THEN 'active'
    ELSE 'ended'
  END
WHERE status != 'ended' OR NOW() < ends_at;
