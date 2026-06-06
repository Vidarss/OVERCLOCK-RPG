-- ============================================================================
-- CLAN BOSS RAID
-- A shared, massive-HP boss that every clan member chips away at together.
-- HP is stored server-side; damage is applied atomically via RPC so concurrent
-- members never clobber each other's contributions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS clan_bosses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id      uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  name         text NOT NULL,
  tier         integer NOT NULL DEFAULT 1,
  max_hp       bigint NOT NULL,
  current_hp   bigint NOT NULL,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'defeated', 'expired')),
  spawned_by   uuid,
  spawned_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  defeated_at  timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clan_bosses_one_active
  ON clan_bosses (clan_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_clan_bosses_clan ON clan_bosses (clan_id);

CREATE TABLE IF NOT EXISTS clan_boss_contributions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id     uuid NOT NULL REFERENCES clan_bosses(id) ON DELETE CASCADE,
  clan_id     uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  handle      text NOT NULL,
  damage      bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (boss_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_boss_contrib_boss ON clan_boss_contributions (boss_id);

-- ---------------------------------------------------------------------------- RLS
ALTER TABLE clan_bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_boss_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read clan bosses" ON clan_bosses;
CREATE POLICY "read clan bosses" ON clan_bosses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read clan boss contributions" ON clan_boss_contributions;
CREATE POLICY "read clan boss contributions" ON clan_boss_contributions
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------- spawn
CREATE OR REPLACE FUNCTION spawn_clan_boss(
  p_clan_id          uuid,
  p_user_id          uuid,
  p_name             text,
  p_tier             integer,
  p_max_hp           bigint,
  p_duration_seconds integer
)
RETURNS clan_bosses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing clan_bosses;
  v_new      clan_bosses;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM clan_members WHERE clan_id = p_clan_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'not a clan member';
  END IF;

  UPDATE clan_bosses
     SET status = 'expired'
   WHERE clan_id = p_clan_id AND status = 'active' AND expires_at < now();

  SELECT * INTO v_existing
    FROM clan_bosses
   WHERE clan_id = p_clan_id AND status = 'active'
   LIMIT 1;

  IF FOUND THEN
    RETURN v_existing;
  END IF;

  INSERT INTO clan_bosses (clan_id, name, tier, max_hp, current_hp, spawned_by, expires_at)
  VALUES (
    p_clan_id,
    p_name,
    GREATEST(p_tier, 1),
    GREATEST(p_max_hp, 1),
    GREATEST(p_max_hp, 1),
    p_user_id,
    now() + make_interval(secs => GREATEST(p_duration_seconds, 60))
  )
  RETURNING * INTO v_new;

  RETURN v_new;
END;
$$;

-- ---------------------------------------------------------------------------- deal damage
CREATE OR REPLACE FUNCTION deal_clan_boss_damage(
  p_boss_id uuid,
  p_user_id uuid,
  p_handle  text,
  p_damage  bigint
)
RETURNS clan_bosses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boss    clan_bosses;
  v_applied bigint;
BEGIN
  SELECT * INTO v_boss FROM clan_bosses WHERE id = p_boss_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'boss not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM clan_members WHERE clan_id = v_boss.clan_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'not a clan member';
  END IF;

  IF v_boss.status <> 'active' THEN
    RETURN v_boss;
  END IF;

  IF v_boss.expires_at < now() THEN
    UPDATE clan_bosses SET status = 'expired' WHERE id = p_boss_id RETURNING * INTO v_boss;
    RETURN v_boss;
  END IF;

  v_applied := LEAST(GREATEST(p_damage, 0), v_boss.current_hp);

  INSERT INTO clan_boss_contributions (boss_id, clan_id, user_id, handle, damage, updated_at)
  VALUES (p_boss_id, v_boss.clan_id, p_user_id, p_handle, v_applied, now())
  ON CONFLICT (boss_id, user_id)
  DO UPDATE SET damage = clan_boss_contributions.damage + EXCLUDED.damage,
                handle = EXCLUDED.handle,
                updated_at = now();

  UPDATE clan_bosses
     SET current_hp  = current_hp - v_applied,
         status      = CASE WHEN current_hp - v_applied <= 0 THEN 'defeated' ELSE status END,
         defeated_at = CASE WHEN current_hp - v_applied <= 0 THEN now() ELSE defeated_at END
   WHERE id = p_boss_id
  RETURNING * INTO v_boss;

  RETURN v_boss;
END;
$$;

GRANT EXECUTE ON FUNCTION spawn_clan_boss(uuid, uuid, text, integer, bigint, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION deal_clan_boss_damage(uuid, uuid, text, bigint) TO authenticated;

-- ---------------------------------------------------------------------------- realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'clan_bosses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clan_bosses;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'clan_boss_contributions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clan_boss_contributions;
  END IF;
END $$;
