# DATABASE SETUP GUIDE

Complete reference for Overclock's Supabase database — architecture, schemas, RLS policies, step-by-step setup, and how to add new tables.

---

## 0. Architecture Overview

The database layer is modular and configuration-driven. All database code lives in `src/lib/db/`:

```
src/lib/db/
├── index.ts      # Re-exports everything (single import point)
├── config.ts     # Configuration types and validation
├── client.ts     # Supabase client factory
├── queries.ts    # CRUD operations with retries and error handling
├── auth.ts       # Authentication operations
└── realtime.ts   # Presence and realtime subscriptions
```

### Importing

```ts
// Recommended: import from the db module
import { loadOne, upsert, signIn, createPresenceChannel } from '../lib/db';

// For plugins: use engine.storage (wraps the db module)
const { data } = await this.engine.storage.load('profiles', { id: userId });

// Legacy (deprecated but still works during migration)
import { supabase } from '../lib/supabase';
```

### Configuration

Database settings are centralized in `src/lib/db/config.ts`. You can customize:

- Connection details (URL, anon key)
- Auth behavior (token refresh, session persistence)
- Query defaults (timeout, retry count, retry delay)
- Realtime settings (presence channel name)

```ts
import { createDatabaseConfig, initializeClient } from '../lib/db';

// Create custom configuration
const config = createDatabaseConfig({
  query: {
    timeoutMs: 15000,    // 15 second timeout
    retryCount: 5,       // 5 retries
    retryDelayMs: 2000,  // 2 second delay between retries
  },
});

// Initialize client with custom config
initializeClient(config);
```

---

## 1. Quick Start

### Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- Your project's `.env` file filled in (see `.env.example`)

### Steps

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Paste each migration file (in order) into the editor and click **Run**.
5. Copy the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values from **Project Settings → API** into your `.env` file.
6. Start the dev server — the game connects automatically.

Migration files are in `supabase/migrations/`. Run them **in filename order** (they are prefixed with timestamps).

---

## 2. Environment Variables

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Find both values at: **Project Settings → API → Project URL / anon public key**.

Never commit `.env` to source control. The `.env.example` file in the repo root shows the expected keys.

---

## 3. Authentication

Overclock uses Supabase's built-in **email/password** auth. No extra configuration is required. Email confirmation is **disabled** by default.

To verify: **Authentication → Providers → Email** — make sure "Confirm email" is toggled **off** unless you want users to confirm their addresses.

---

## 4. Tables

### 4.1 `profiles`

Stores the player's display handle and avatar choice. Created automatically on registration via `AuthPlugin`.

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle       text    NOT NULL DEFAULT 'HACKER_' || floor(random() * 9999)::text,
  avatar_index integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Same as `auth.users.id` (1-to-1) |
| `handle` | text | Player's display name |
| `avatar_index` | integer | Index into the avatar sprite list |
| `created_at` | timestamptz | Row creation time |

**RLS Policies**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

### 4.2 `player_saves`

One row per player. Stores the full serialized `GameState` as a JSON blob plus a schema version number for future migrations.

```sql
CREATE TABLE IF NOT EXISTS player_saves (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_data      jsonb   NOT NULL DEFAULT '{}',
  schema_version integer NOT NULL DEFAULT 1,
  updated_at     timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS player_saves_user_id_idx ON player_saves(user_id);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | FK to `auth.users` |
| `save_data` | jsonb | Full `GameState` snapshot |
| `schema_version` | integer | Incremented when the save format changes |
| `updated_at` | timestamptz | Last save timestamp |

**RLS Policies**

```sql
ALTER TABLE player_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own save"
  ON player_saves FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own save"
  ON player_saves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own save"
  ON player_saves FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### 4.3 `leaderboard`

One row per player. Upserted after every save. Readable by all authenticated users (public scoreboard).

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle         text    NOT NULL DEFAULT '',
  highest_stage  integer NOT NULL DEFAULT 1,
  overclock_count integer NOT NULL DEFAULT 0,
  total_damage   numeric NOT NULL DEFAULT 0,
  updated_at     timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_user_id_idx ON leaderboard(user_id);
```

**RLS Policies**

```sql
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (it's a public scoreboard)
CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own leaderboard entry"
  ON leaderboard FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry"
  ON leaderboard FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### 4.4 `daily_challenges`

Per-user daily challenge progress. Up to 3 challenges generated per day. Rows are deleted and recreated when the day rolls over.

```sql
CREATE TABLE IF NOT EXISTS daily_challenges (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) NOT NULL,
  challenge_date  date    NOT NULL DEFAULT CURRENT_DATE,
  challenge_type  text    NOT NULL,
  challenge_label text    NOT NULL DEFAULT '',
  target_value    integer NOT NULL DEFAULT 1,
  current_value   integer NOT NULL DEFAULT 0,
  completed       boolean NOT NULL DEFAULT false,
  reward_gold     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date
  ON daily_challenges(user_id, challenge_date);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `challenge_date` | date | UTC date this challenge belongs to |
| `challenge_type` | text | `kill_enemies`, `earn_gold`, `reach_stage`, `use_skills`, `defeat_bosses` |
| `challenge_label` | text | Human-readable label shown in UI |
| `target_value` | integer | Target count to complete the challenge |
| `current_value` | integer | Player's current progress |
| `completed` | boolean | Whether the reward has been claimed |
| `reward_gold` | integer | Gold awarded on completion |

**RLS Policies**

```sql
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily challenges"
  ON daily_challenges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily challenges"
  ON daily_challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily challenges"
  ON daily_challenges FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily challenges"
  ON daily_challenges FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

---

### 4.5 `achievements`

Permanent one-time unlocks. Each row records a single achievement a player has earned.

```sql
CREATE TABLE IF NOT EXISTS achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `achievement_id` | text | Matches an achievement `id` in `AchievementPlugin` |
| `unlocked_at` | timestamptz | When it was earned |

**RLS Policies**

```sql
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON achievements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
  ON achievements FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

---

### 4.6 `achievement_stats`

One row per player. Stores cumulative counters that can't be derived from `GameState` alone (kill counts persist across overclocks).

```sql
CREATE TABLE IF NOT EXISTS achievement_stats (
  user_id          uuid    PRIMARY KEY REFERENCES auth.users(id) NOT NULL,
  total_kills      integer NOT NULL DEFAULT 0,
  total_boss_kills integer NOT NULL DEFAULT 0,
  total_skills_used integer NOT NULL DEFAULT 0,
  total_gold_earned bigint  NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `total_kills` | integer | Cumulative enemy kills across all sessions |
| `total_boss_kills` | integer | Cumulative boss kills |
| `total_skills_used` | integer | Cumulative skill activations |
| `total_gold_earned` | bigint | Cumulative gold earned (bigint — can exceed int range at high stages) |

**RLS Policies**

```sql
ALTER TABLE achievement_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievement stats"
  ON achievement_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievement stats"
  ON achievement_stats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievement stats"
  ON achievement_stats FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### 4.7 `shop_purchases`

Append-only purchase history. One row per transaction.

```sql
CREATE TABLE IF NOT EXISTS shop_purchases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) NOT NULL,
  item_id      text NOT NULL,
  currency     text NOT NULL DEFAULT 'oct',
  price        int  NOT NULL DEFAULT 0,
  purchased_at timestamptz DEFAULT now()
);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `item_id` | text | Catalog item id (from `SHOP_CATALOG` in `game.config.ts`) |
| `currency` | text | `'oct'` or `'diamond'` |
| `price` | integer | Amount spent at time of purchase |

**RLS Policies**

```sql
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON shop_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON shop_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

### 4.8 `tournaments`

Admin-seeded tournament brackets. Players cannot insert or update rows here — a server or manual SQL seed controls the schedule.

```sql
CREATE TABLE IF NOT EXISTS tournaments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL DEFAULT '',
  template_name      text NOT NULL DEFAULT '',
  bracket_number     int  NOT NULL DEFAULT 1,
  starts_at          timestamptz NOT NULL,
  ends_at            timestamptz NOT NULL,
  prize_diamonds     int  NOT NULL DEFAULT 100,
  entry_fee_diamonds int  NOT NULL DEFAULT 0,
  player_cap         int  NOT NULL DEFAULT 32,
  status             text NOT NULL DEFAULT 'upcoming',
  created_at         timestamptz DEFAULT now()
);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `template_name` | text | Base event name, e.g. `'GENESIS CIRCUIT'` |
| `bracket_number` | integer | Instance number within the template |
| `status` | text | `'upcoming'`, `'active'`, or `'ended'` |
| `prize_diamonds` | integer | Diamond pool distributed to top finishers |
| `entry_fee_diamonds` | integer | Diamonds required to join |
| `player_cap` | integer | Max participants per bracket |

**RLS Policies**

```sql
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Read-only for all players
CREATE POLICY "Authenticated users can read tournaments"
  ON tournaments FOR SELECT TO authenticated
  USING (true);
```

**Seeding tournaments** — paste directly into the SQL Editor:

```sql
INSERT INTO tournaments (name, template_name, bracket_number, starts_at, ends_at, prize_diamonds, status, entry_fee_diamonds, player_cap)
VALUES (
  'MY EVENT #1', 'MY EVENT', 1,
  now(),
  now() + interval '4 hours',
  300, 'active', 5, 32
);
```

---

### 4.9 `tournament_entries`

One row per player per bracket. Score is updated as the player progresses; rank is set when the tournament ends.

```sql
CREATE TABLE IF NOT EXISTS tournament_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid REFERENCES tournaments(id) NOT NULL,
  user_id        uuid REFERENCES auth.users(id) NOT NULL,
  handle         text NOT NULL DEFAULT '',
  score          int  NOT NULL DEFAULT 0,
  rank           int,
  joined_at      timestamptz DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_entries_tournament_score
  ON tournament_entries(tournament_id, score DESC);
```

**RLS Policies**

```sql
ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;

-- All players can see the leaderboard
CREATE POLICY "Authenticated users can read tournament entries"
  ON tournament_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own tournament entries"
  ON tournament_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tournament entries"
  ON tournament_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### 4.10 `set_items`

Mythic set pieces owned by a player. One row per piece earned (no quantity — sets are unique items).

```sql
CREATE TABLE IF NOT EXISTS set_items (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid  REFERENCES auth.users(id) NOT NULL,
  set_id      text  NOT NULL,
  item_data   jsonb NOT NULL DEFAULT '{}'::jsonb,
  obtained_at timestamptz DEFAULT now()
);
```

**Columns**

| Column | Type | Description |
|--------|------|-------------|
| `set_id` | text | Matches a set `id` in `SET_CATALOG` (e.g. `'neural_nexus'`) |
| `item_data` | jsonb | Full `HardwareItem` object including stats and slot |

**RLS Policies**

```sql
ALTER TABLE set_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own set items"
  ON set_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own set items"
  ON set_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own set items"
  ON set_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

---

## 5. Module Reference

### Query Functions (`src/lib/db/queries.ts`)

All query functions include automatic retry logic and error handling.

```ts
import { loadOne, loadMany, upsert, insert, update, remove, rpc } from '../lib/db';

// Load a single record
const { data, error } = await loadOne<Profile>('profiles', { id: userId });

// Load multiple records with sorting and limiting
const { data: entries } = await loadMany<LeaderboardEntry>(
  'leaderboard',
  {},
  '*',
  { orderBy: 'highest_stage', ascending: false, limit: 100 }
);

// Upsert (insert or update on conflict)
await upsert('player_saves', { user_id: id, save_data: state }, 'user_id');

// Insert with returning
const { data: newRow } = await insert<Profile>('profiles', { id, handle }, 'id, handle');

// Update
await update('profiles', { handle: 'NEW_NAME' }, { id: userId });

// Delete
await remove('daily_challenges', { user_id: userId, challenge_date: oldDate });

// Raw RPC call
const { data: result } = await rpc('my_function', { arg1: 'value' });
```

### Authentication (`src/lib/db/auth.ts`)

```ts
import { signUp, signIn, signOut, getSession, resetPassword, onAuthStateChange } from '../lib/db';

// Sign up
const { user, error } = await signUp('user@example.com', 'password123');

// Sign in
const { user, error } = await signIn('user@example.com', 'password123');

// Sign out
await signOut();

// Get current session
const { session } = await getSession();

// Reset password
await resetPassword('user@example.com');

// Listen for auth changes
const unsubscribe = onAuthStateChange(({ event, session }) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user.email);
  }
});
// Later: unsubscribe();
```

### Realtime (`src/lib/db/realtime.ts`)

```ts
import { createPresenceChannel, subscribeToTable, createBroadcastChannel } from '../lib/db';

// Track online presence
const presence = createPresenceChannel(
  userId,
  { user_id: userId, handle: playerHandle },
  {
    onSync: (state) => {
      // state is a map of user_id -> presence data[]
      const onlineCount = Object.keys(state).length;
    },
    onJoin: (key, current, joined) => { /* user joined */ },
    onLeave: (key, current, left) => { /* user left */ },
  }
);
// Later: presence.unsubscribe();

// Subscribe to table changes
const subscription = subscribeToTable<Profile>('profiles', {
  onInsert: (row) => console.log('New profile:', row),
  onUpdate: (row, oldRow) => console.log('Updated:', row),
  onDelete: (oldRow) => console.log('Deleted:', oldRow),
});
// Later: subscription.unsubscribe();

// Broadcast channel for custom events
const channel = createBroadcastChannel<{ message: string }>(
  'game_events',
  'player_action',
  (payload) => console.log('Received:', payload.message)
);
await channel.broadcast({ message: 'Player did something!' });
// Later: channel.unsubscribe();
```

---

## 6. Adding a New Table

### Step 1 — Write the migration

Create a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`:

```sql
/*
  # My new table

  Short description of what this table stores and why.
*/

CREATE TABLE IF NOT EXISTS my_table (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  some_data  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON my_table FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON my_table FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON my_table FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON my_table FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### Step 2 — Apply it

Paste the SQL into **Supabase → SQL Editor → New query → Run**.

### Step 3 — Register it in your plugin

```ts
async init(engine: IEngine): Promise<void> {
  engine.storage.registerTable(this.id, { table: 'my_table', userScoped: true });
}
```

### Step 4 — Use it

```ts
// Read one row
const { data } = await this.engine.storage.load('my_table', { user_id: this.userId });

// Read many rows
const { data: rows } = await this.engine.storage.loadMany('my_table', { user_id: this.userId });

// Upsert (insert or update on conflict with 'user_id')
await this.engine.storage.save('my_table', { user_id: this.userId, some_data: {} }, 'user_id');

// Insert
await this.engine.storage.insert('my_table', { user_id: this.userId, some_data: {} });

// Delete
await this.engine.storage.remove('my_table', { id: rowId });
```

Never import `supabase` directly in a plugin. Always go through `engine.storage`.

---

## 6. Verifying Your Setup

### Check tables exist

In **Supabase → Table Editor** you should see all 10 tables listed.

Or run in SQL Editor:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Expected output:

```
achievement_stats
achievements
daily_challenges
leaderboard
player_saves
profiles
set_items
shop_purchases
tournament_entries
tournaments
```

### Check RLS is enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Every row should show `rowsecurity = true`.

### Check policies exist

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Test auth is working

1. Register an account in the game.
2. In Supabase → **Authentication → Users**, the new user should appear.
3. In **Table Editor → profiles**, a matching row should appear with a random handle.

---

## 7. Troubleshooting

**"new row violates row-level security policy"**
The INSERT policy is missing or its `WITH CHECK` does not match `auth.uid() = user_id`. Check that you are authenticated and that the policy targets `TO authenticated`.

**"permission denied for table X"**
RLS is enabled but no SELECT policy exists. Add one, or verify the existing policy condition returns `true` for your user.

**Save not loading after login**
Check `player_saves` for a row with your `user_id`. If it's missing, the first save has not completed yet — play for 30 seconds (auto-save interval) or trigger a manual save. If a row exists but `save_data` is `{}`, `SupabasePlugin` may have failed to write state — check the browser console.

**Leaderboard not updating**
`leaderboard` is upserted on every `save_requested` event. If the save completes but the leaderboard row does not update, confirm the upsert conflict target is `user_id` and the UPDATE policy is present.

**Tournament brackets not showing**
Tournaments are seeded manually via SQL. Verify rows exist in `tournaments` with `status = 'active'` and `ends_at > now()`. The client filters by those conditions.

**`schema_version` mismatch**
If the game adds new save fields and you need to migrate old saves, increment `SAVE_CONFIG.schemaVersion` in `src/config/game.config.ts`. Add migration logic in `SupabasePlugin.loadSave()` keyed on the saved `schema_version`.
