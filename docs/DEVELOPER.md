# Overclock — Developer Reference

Complete guide to the codebase, plugin system, database, and game configuration.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Architecture Overview](#2-architecture-overview)
3. [The Config File](#3-the-config-file)
4. [Adding a Plugin](#4-adding-a-plugin)
5. [Adding New Game State](#5-adding-new-game-state)
6. [Adding a Database Table](#6-adding-a-database-table)
7. [Adding a Game Event](#7-adding-a-game-event)
8. [Adding a Modifier Type](#8-adding-a-modifier-type)
9. [Adding a Skill](#9-adding-a-skill)
10. [Adding an Overclock Perk / Branch](#10-adding-an-overclock-perk--branch)
11. [Adding a Shop Item](#11-adding-a-shop-item)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Apply all database migrations
# (See docs/DATABASE.md for full instructions)

# 4. Start the dev server
npm run dev

# 5. Build for production
npm run build
```

### Environment Variables

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key |

---

## 2. Architecture Overview

```
src/
├── config/
│   └── game.config.ts    ← ALL game constants live here
├── engine/
│   ├── Engine.ts          ← Singleton orchestrator; never touch for new features
│   ├── EventSystem.ts     ← Pub/sub event bus
│   ├── ModifierSystem.ts  ← Stacks numeric modifiers (tap_damage, idle_dps, etc.)
│   ├── PluginRegistry.ts  ← Resolves init order from dependencies[]
│   ├── PluginStorage.ts   ← Database access layer (wraps Supabase)
│   ├── StateManager.ts    ← Immutable GameState with subscriber notifications
│   └── types.ts           ← All TypeScript types (GameState, events, plugins)
├── plugins/               ← One file per feature; no cross-plugin imports
├── components/            ← React UI components
├── lib/
│   └── supabase.ts        ← Supabase client singleton (the ONLY place it lives)
└── App.tsx                ← Registers plugins, boots the engine, routes screens
```

### Boot Sequence

```
App mounts
  └── stableEngine = createEngine()   (module level, runs ONCE)
        └── engine.register(plugin1, plugin2, ...)
  └── useEffect runs
        └── engine.boot()
              └── PluginRegistry.initAll()  (respects dependencies[])
                    └── plugin.init(engine) for each plugin
              └── emit 'ALL SYSTEMS ONLINE'
              └── startTick()  ← 100ms interval, calls plugin.onTick()
        └── setTimeout(300ms) → check existing auth session
```

### Plugin Lifecycle

```
init(engine)   — called once at boot; NEVER await network here (fire-and-forget)
onTick(delta)  — called every 100ms; delta = seconds since last tick
cleanup()      — called on unmount; unsubscribe events, removeModifiers
```

### The Modifier System

All numeric stat boosts go through the modifier system. There are 5 modifier types:

| Type | Effect |
|---|---|
| `tap_damage` | Multiplies manual tap damage |
| `idle_dps` | Multiplies passive component DPS |
| `gold_rate` | Multiplies gold earned from kills |
| `crit_chance` | Additive crit probability bonus |
| `crit_multiplier` | Additive crit damage bonus |

Modifiers are stacked per-plugin and computed as:

- **Multipliers** (`isMultiplier: true`): all values multiplied together
- **Flat** (`isMultiplier: false`): all values added together, then added to base 1.0

```ts
// Add a modifier
engine.addModifier('my_plugin', { type: 'tap_damage', value: 1.5, isMultiplier: true });

// Read the current computed value (product of all registered modifiers)
const total = engine.getModifier('tap_damage');

// Remove all modifiers from your plugin (do this before re-adding and in cleanup)
engine.removeModifiers('my_plugin');
```

---

## 3. The Config File

**`src/config/game.config.ts`** is the single source of truth for every tunable game constant. Never hardcode numbers in plugin files.

### Sections and What to Change

| Section | Export | What it controls |
|---|---|---|
| Engine | `ENGINE_CONFIG` | Tick rate, boot timeout, auth delay |
| Save | `SAVE_CONFIG` | Auto-save interval, offline cap, schema version |
| Tap | `TAP_CONFIG` | Base damage, crit chance/multiplier, combo |
| Enemy | `ENEMY_CONFIG` | HP scaling, boss timer, elite chance, names |
| Overclock | `OVERCLOCK_CONFIG` + `OVERCLOCK_PERKS` | Tiers, milestones, all 25 perks |
| Skills | `BASE_SKILLS` + `BRANCH_SKILLS` + `SKILL_EFFECTS` | All 10 skills |
| Components | `INITIAL_COMPONENTS` | All 50 idle-DPS components |
| Motherboard | `MOBO_TIERS` | All 8 board tiers and costs |
| Items | `ITEM_CONFIG` | Drop rates, rarity weights, stat formulas |
| Shop | `OCT_CATALOG` + `DIAMOND_CATALOG` | All 26 shop items |
| Dailies | `DAILY_CONFIG` + `CHALLENGE_TEMPLATES` | Challenge types and rewards |
| Sets | `SET_CATALOG` | All 3 set item collections |

### Examples

**Change boss spawn frequency** (currently every 10th stage):
```ts
// src/config/game.config.ts
export const ENEMY_CONFIG = {
  bossEveryNStages: 5,  // bosses every 5 stages instead of 10
  ...
```

**Change the auto-save interval** (currently 30 seconds):
```ts
export const SAVE_CONFIG = {
  autoSaveIntervalMs: 60_000,  // save every 60 seconds
  ...
```

**Add a new overclock perk** (see Section 10 for the full workflow):
```ts
export const OVERCLOCK_PERKS: OverclockPerkDef[] = [
  ...existing perks...
  {
    id: 'my_new_perk',
    name: 'MY_NEW_PERK',
    flavor: 'Flavor text here.',
    description: '+50% tap damage per level',
    branch: 'VOLTAGE',
    branchRank: 6,
    maxLevel: 3,
    costPerLevel: 20,
    modifierType: 'tap_damage',
    valuePerLevel: 0.50,
    isMultiplier: true,
    color: '#00f5ff',
    requiresTier: 14,
  },
```

**Change a component's cost** (e.g. make GPU cheaper):
```ts
export const INITIAL_COMPONENTS: ComponentDef[] = [
  { id: 'gpu', ..., baseCost: 5, ... },  // was 10
```

---

## 4. Adding a Plugin

### Step 1: Create the plugin file

```ts
// src/plugins/MyPlugin.ts
import type { IPlugin, IEngine, GameState } from '../engine/types';

export class MyPlugin implements IPlugin {
  id = 'my_plugin';
  dependencies = ['auth'];           // ids of plugins that must init before this
  stateKeys = ['myField'] as (keyof GameState)[];
  defaultState = { myField: 0 };

  private engine!: IEngine;
  private unsubs: Array<() => void> = [];

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    // Register any DB tables you need
    engine.storage.registerTable(this.id, { table: 'my_table', userScoped: true });

    // Subscribe to events
    this.unsubs.push(engine.on('some_event', (event) => {
      // handle event
    }));

    // If you need data from the network, fire-and-forget
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    const userId = this.engine.getPlugin<AuthPlugin>('auth')?.getPlayer()?.id;
    if (!userId) return;
    const { data } = await this.engine.storage.load('my_table', { user_id: userId });
    if (data) this.engine.updateState({ myField: data.value });
  }

  onTick(delta: number, state: GameState): void {
    // runs every 100ms
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.engine?.removeModifiers(this.id);
  }
}
```

### Step 2: Register in App.tsx

```ts
// src/App.tsx
import { MyPlugin } from './plugins/MyPlugin';

function createEngine(): GameEngine {
  ...
  engine.register(new MyPlugin());
  return engine;
}
```

That's it. The registry resolves init order from `dependencies` automatically.

### Critical rules

| Rule | Why |
|---|---|
| Never `await` network in `init()` | Boot hangs until all `init()` calls return. Use `void this.loadData()`. |
| Never import `supabase` directly | Use `engine.storage` — this is the only path to the DB. |
| Always unsubscribe in `cleanup()` | React StrictMode double-mounts components; leaking handlers causes bugs. |
| Always use `?.` in `cleanup()` | `cleanup()` may be called before `init()` completes. |
| Never import another plugin's internals | Use `engine.getPlugin<OtherPlugin>('other_id')` for cross-plugin communication. |
| Check `auth_success` AND existing player | `auth_success` won't fire for already-logged-in users. At the end of `init()`, always call `engine.getPlugin<AuthPlugin>('auth')?.getPlayer()` directly. |

---

## 5. Adding New Game State

### Step 1: Add the field to `GameState`

```ts
// src/engine/types.ts
export interface GameState {
  // ...existing fields...
  myNewField: number;
}
```

### Step 2: Add the default to `DEFAULT_STATE`

```ts
// src/engine/StateManager.ts
export const DEFAULT_STATE: GameState = {
  // ...existing defaults...
  myNewField: 0,
};
```

### Step 3: Declare ownership in your plugin

```ts
export class MyPlugin implements IPlugin {
  stateKeys = ['myNewField'] as (keyof GameState)[];
  defaultState = { myNewField: 0 };
```

The engine automatically restores `stateKeys` from saved data when a save loads.

---

## 6. Adding a Database Table

### Step 1: Write and apply the migration

```sql
-- Apply via Supabase Dashboard → SQL Editor, or see docs/DATABASE.md

CREATE TABLE IF NOT EXISTS my_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  some_data jsonb DEFAULT '{}'::jsonb,
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

### Step 2: Register in your plugin's `init()`

```ts
engine.storage.registerTable(this.id, { table: 'my_table', userScoped: true });
```

### Step 3: Use the storage API

```ts
// Read one row
const { data, error } = await engine.storage.load(
  'my_table',
  { user_id: userId },
  'col1, col2'           // optional column select
);

// Read many rows
const { data: rows } = await engine.storage.loadMany(
  'my_table',
  { user_id: userId }
);

// Upsert (insert or update on conflict key)
await engine.storage.save(
  'my_table',
  { user_id: userId, some_data: { value: 42 } },
  'user_id'              // conflict key
);

// Insert new row
const { data: newRow } = await engine.storage.insert(
  'my_table',
  { user_id: userId, some_data: {} },
  'id, some_data'        // optional return columns
);

// Delete
await engine.storage.remove('my_table', { id: rowId });
```

---

## 7. Adding a Game Event

### Step 1: Add the event name to `GameEventType`

```ts
// src/engine/types.ts
export type GameEventType =
  | ...existing events...
  | 'my_new_event';
```

### Step 2: Emit it

```ts
engine.emit('my_new_event', { someData: 42 });
```

### Step 3: Listen anywhere

```ts
const unsub = engine.on('my_new_event', (event) => {
  const { someData } = event.payload as { someData: number };
  // handle it
});
// Store `unsub` and call it in cleanup()
```

---

## 8. Adding a Modifier Type

If you need a completely new stat multiplier (beyond the existing 5):

### Step 1: Add it to `ModifierDef`

```ts
// src/engine/types.ts
export interface ModifierDef {
  type: 'tap_damage' | 'idle_dps' | 'gold_rate' | 'crit_chance' | 'crit_multiplier' | 'my_new_stat';
  value: number;
  isMultiplier: boolean;
}
```

### Step 2: Use it like any other modifier

```ts
engine.addModifier('my_plugin', { type: 'my_new_stat', value: 1.5, isMultiplier: true });
const computed = engine.getModifier('my_new_stat');
```

---

## 9. Adding a Skill

### Step 1: Add the SkillId

```ts
// src/engine/types.ts
export type SkillId =
  | ...existing ids...
  | 'my_skill';
```

### Step 2: Add the skill definition to the config

```ts
// src/config/game.config.ts
export const BASE_SKILLS: SkillDef[] = [
  ...existing skills...
  {
    id: 'my_skill',
    name: 'MY SKILL',
    description: 'Does something cool for Xs',
    cooldown: 60,       // seconds between uses
    duration: 8,        // seconds the effect lasts (0 = instant)
    color: '#00f5ff',
    icon: 'Zap',        // Lucide icon name
    unlockStage: 25,    // stage required to unlock (9999 = branch-only)
  },
```

### Step 3: Define the effect

```ts
// src/config/game.config.ts
export const SKILL_EFFECTS: Record<SkillId, ...> = {
  ...existing effects...
  my_skill: [{ modifierType: 'tap_damage', value: 5, isMultiplier: true }],
```

If the skill has a complex effect (like `static_discharge` or `quantum_echo`), add a new `case` in `SkillPlugin.applySkillEffect()`.

### Step 4: Add the default cooldown state

```ts
// src/engine/StateManager.ts
export const DEFAULT_STATE: GameState = {
  ...
  skillCooldowns: {
    ...existing...
    my_skill: { readyAt: 0, activeUntil: 0 },
  },
```

Also add it in `SkillPlugin.defaultState`.

---

## 10. Adding an Overclock Perk / Branch

### Adding a perk to an existing branch

Just add an entry to `OVERCLOCK_PERKS` in `src/config/game.config.ts`:

```ts
{
  id: 'my_perk',
  name: 'MY_PERK',
  flavor: 'Flavor text.',
  description: '+X% something per level',
  branch: 'VOLTAGE',      // existing branch
  branchRank: 6,          // must be one higher than the current max rank in this branch
  maxLevel: 3,
  costPerLevel: 15,
  modifierType: 'tap_damage',
  valuePerLevel: 0.50,
  isMultiplier: true,
  color: '#00f5ff',
  requiresTier: 14,       // optional: requires this tier to unlock
},
```

No plugin changes needed — `OverclockPlugin` reads `OVERCLOCK_PERKS` from the config.

### Adding a new branch

1. Add the branch name to `PerkBranch` type in `src/config/game.config.ts`
2. Add a color to `OVERCLOCK_CONFIG.branchColors`
3. Add a branch skill unlock entry to `OVERCLOCK_CONFIG.branchSkillUnlocks`
4. Add the new `SkillId` (see Section 9)
5. Add perk entries to `OVERCLOCK_PERKS` with `branch: 'MY_BRANCH'`

---

## 11. Adding a Shop Item

### OCT shop item

```ts
// src/config/game.config.ts
export const OCT_CATALOG: ShopItemDef[] = [
  ...existing items...
  {
    id: 'oct_my_item',
    name: 'MY ITEM',
    description: '+X% something permanently',
    currency: 'oct',
    price: 100,
    modifierType: 'tap_damage',
    modifierValue: 1.50,
    isMultiplier: true,
    color: '#00f5ff',
    icon: 'Zap',
    maxPurchases: 3,
    tier: 'late',
  },
```

### Diamond shop item

Same structure with `currency: 'diamond'`. That's it — `ShopPlugin` reads the catalog from config.

---

## 12. Troubleshooting

### Boot hangs / black screen

**Cause:** A plugin is `await`-ing a network call inside `init()`.

**Fix:** Change `await this.loadData()` to `void this.loadData()`. The `init()` function must return immediately.

### Save resets on page navigation (dev mode)

**Cause:** Was a React StrictMode double-mount issue. Fixed by using a module-level engine singleton in `App.tsx`. If you see this again, check that `App.tsx` still uses `stableEngine` (module-level constant) and that `engine.isBooted` guards prevent a second boot.

### Auth state not available in plugin `init()`

**Cause:** `auth_success` fires asynchronously and may have already fired before your plugin initialized.

**Fix:** At the end of `init()`, always also check directly:

```ts
const existing = engine.getPlugin<AuthPlugin>('auth')?.getPlayer();
if (existing) {
  this.userId = existing.id;
  void this.loadData();
}
```

### State field is `undefined` after save load

**Cause:** The field is not declared in `stateKeys` or `defaultState` on the plugin, so `SupabasePlugin.autoRestoreState()` doesn't know to restore it.

**Fix:** Add it to both `stateKeys` and `defaultState` on your plugin. Also ensure it exists in `GameState` (types.ts) and `DEFAULT_STATE` (StateManager.ts).

### TypeScript error: "Property X does not exist on type GameState"

**Fix:** Add the field to `GameState` in `src/engine/types.ts` and to `DEFAULT_STATE` in `src/engine/StateManager.ts`.

### Supabase RLS error: "row-level security policy violation"

**Cause:** The table has RLS enabled but is missing the required policy for the operation.

**Fix:** Go to Supabase Dashboard → Authentication → Policies and add the missing policy. See `docs/DATABASE.md` for standard policy templates.

### Modifier not applying

**Common mistakes:**
1. Forgot to call `engine.removeModifiers(this.id)` before re-adding (values stack indefinitely)
2. Wrong `isMultiplier` value — multipliers need `value > 1` (e.g. `1.5` for +50%), flat bonuses use the raw additive value
3. Forgot to call `applyModifiers()` after loading saved upgrades in `state_sync` handler
