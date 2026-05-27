/*
  # Add total_gold_earned to achievement_stats

  ## Changes
  - `achievement_stats` table: add `total_gold_earned` column (bigint, default 0)

  ## Notes
  - Uses bigint because total gold earned over thousands of stages can exceed integer range
  - Default 0 keeps existing rows valid without a backfill
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievement_stats' AND column_name = 'total_gold_earned'
  ) THEN
    ALTER TABLE achievement_stats ADD COLUMN total_gold_earned bigint NOT NULL DEFAULT 0;
  END IF;
END $$;
