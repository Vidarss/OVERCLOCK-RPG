-- Migration: Reset all player upgrades due to balance rebalancing
-- This resets heroUpgrades and components to empty/default state while preserving other save data
-- Timestamp: 2026-06-01

BEGIN;

-- Update all player_saves to reset heroUpgrades and components to empty objects
UPDATE player_saves
SET save_data = jsonb_set(
  jsonb_set(
    save_data,
    '{heroUpgrades}',
    '{}'::jsonb
  ),
  '{components}',
  '[]'::jsonb
)
WHERE save_data IS NOT NULL;

-- Log the migration
INSERT INTO audit_log (action, details, created_at)
VALUES (
  'UPGRADE_RESET',
  'Reset all player heroUpgrades and components due to balance changes',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;
