-- Weekly tournament schedule: 7 distinct tournaments spread across the week
-- Each week the order is shuffled deterministically using the week number as seed
-- Week starts on Monday 00:00 UTC

CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void AS $$
DECLARE
  -- Current week number (weeks since epoch, starting Monday)
  week_num         bigint;
  week_start       timestamp with time zone;
  next_week_start  timestamp with time zone;

  -- Slot offsets within the week (hours from Monday 00:00 UTC)
  -- 7 slots spread across 7 days, each 20h long with 4h gap
  slot_offsets     integer[] := ARRAY[0, 24, 48, 72, 96, 120, 144];
  slot_durations   integer[] := ARRAY[20, 20, 20, 20, 20, 20, 20];

  -- Template pool: 7 templates (one per slot, shuffled each week)
  tpl_ids    text[]    := ARRAY['byte_rush',   'null_storm',  'packet_war',  'core_siege',  'signal_run',  'data_blitz',  'void_clash'];
  tpl_names  text[]    := ARRAY['BYTE RUSH',   'NULL STORM',  'PACKET WAR',  'CORE SIEGE',  'SIGNAL RUN',  'DATA BLITZ',  'VOID CLASH'];
  tpl_prizes integer[] := ARRAY[100,           250,           150,           500,           200,           75,            350];
  tpl_fees   integer[] := ARRAY[0,             10,            0,             25,            0,             0,             10];
  tpl_caps   integer[] := ARRAY[128,           64,            100,           32,            100,           64,            50];
  tpl_join   integer[] := ARRAY[4,             6,             4,             8,             4,             3,             6];  -- join window hours

  -- Shuffled order for this week (Fisher-Yates using week_num as seed)
  shuffle_order integer[];
  tmp_i         integer;
  rand_j        integer;
  i             integer;
  j             integer;

  -- Slot vars
  slot_idx    integer;
  t_start     timestamp with time zone;
  t_end       timestamp with time zone;
  t_join_cls  timestamp with time zone;
  tpl_i       integer;
  existing_id uuid;
BEGIN
  -- Monday-aligned week start (ISO week: epoch 1970-01-01 was Thursday, so offset by 3 days)
  week_num := FLOOR((EXTRACT(EPOCH FROM NOW()) + 3 * 86400) / (7 * 86400))::bigint;
  week_start := to_timestamp((week_num * 7 * 86400) - 3 * 86400);
  next_week_start := week_start + INTERVAL '7 days';

  -- Build identity order [1,2,3,4,5,6,7]
  shuffle_order := ARRAY[1, 2, 3, 4, 5, 6, 7];

  -- Deterministic Fisher-Yates shuffle using week_num as seed
  FOR i IN REVERSE 7..2 LOOP
    -- pseudo-random j in [1..i] based on week_num + i
    rand_j := 1 + ((week_num * 2654435761 + i * 1234567) % i)::integer;
    tmp_i             := shuffle_order[i];
    shuffle_order[i]  := shuffle_order[rand_j];
    shuffle_order[rand_j] := tmp_i;
  END LOOP;

  -- Create this week's 7 tournaments
  FOR i IN 1..7 LOOP
    tpl_i    := shuffle_order[i];  -- 1-based index into template arrays
    slot_idx := i - 1;             -- 0-based slot offset index

    t_start   := week_start + (slot_offsets[i] || ' hours')::interval;
    t_end     := t_start    + (slot_durations[i] || ' hours')::interval;
    t_join_cls := t_start   + (tpl_join[tpl_i] || ' hours')::interval;

    -- Skip if already exists for this week slot
    SELECT id INTO existing_id
    FROM tournaments
    WHERE template_name = tpl_ids[tpl_i]
      AND bracket_number = week_num::integer * 10 + slot_idx;

    IF existing_id IS NULL THEN
      INSERT INTO tournaments (
        id, name, template_name, bracket_number,
        starts_at, ends_at, join_closes_at,
        prize_diamonds, entry_fee_diamonds, player_cap, status
      ) VALUES (
        gen_random_uuid(),
        tpl_names[tpl_i] || ' W' || (week_num % 100),
        tpl_ids[tpl_i],
        week_num::integer * 10 + slot_idx,
        t_start,
        t_end,
        t_join_cls,
        tpl_prizes[tpl_i],
        tpl_fees[tpl_i],
        tpl_caps[tpl_i],
        CASE
          WHEN NOW() < t_start  THEN 'upcoming'
          WHEN NOW() < t_end    THEN 'active'
          ELSE 'ended'
        END
      );
    END IF;
  END LOOP;

  -- Create next week's 7 tournaments so players always see upcoming slots
  -- Shuffle with week_num + 1 as seed
  shuffle_order := ARRAY[1, 2, 3, 4, 5, 6, 7];
  FOR i IN REVERSE 7..2 LOOP
    rand_j := 1 + (((week_num + 1) * 2654435761 + i * 1234567) % i)::integer;
    tmp_i               := shuffle_order[i];
    shuffle_order[i]    := shuffle_order[rand_j];
    shuffle_order[rand_j] := tmp_i;
  END LOOP;

  FOR i IN 1..7 LOOP
    tpl_i    := shuffle_order[i];
    slot_idx := i - 1;

    t_start    := next_week_start + (slot_offsets[i] || ' hours')::interval;
    t_end      := t_start + (slot_durations[i] || ' hours')::interval;
    t_join_cls := t_start + (tpl_join[tpl_i] || ' hours')::interval;

    SELECT id INTO existing_id
    FROM tournaments
    WHERE template_name = tpl_ids[tpl_i]
      AND bracket_number = (week_num + 1)::integer * 10 + slot_idx;

    IF existing_id IS NULL THEN
      INSERT INTO tournaments (
        id, name, template_name, bracket_number,
        starts_at, ends_at, join_closes_at,
        prize_diamonds, entry_fee_diamonds, player_cap, status
      ) VALUES (
        gen_random_uuid(),
        tpl_names[tpl_i] || ' W' || ((week_num + 1) % 100),
        tpl_ids[tpl_i],
        (week_num + 1)::integer * 10 + slot_idx,
        t_start,
        t_end,
        t_join_cls,
        tpl_prizes[tpl_i],
        tpl_fees[tpl_i],
        tpl_caps[tpl_i],
        'upcoming'
      );
    END IF;
  END LOOP;

  -- Always sync status from timestamps (source of truth)
  UPDATE tournaments
  SET status = CASE
    WHEN NOW() < starts_at THEN 'upcoming'
    WHEN NOW() < ends_at   THEN 'active'
    ELSE 'ended'
  END
  WHERE ends_at > NOW() - INTERVAL '1 hour';

END;
$$ LANGUAGE plpgsql;

-- Run immediately to seed
SELECT ensure_active_tournaments();
