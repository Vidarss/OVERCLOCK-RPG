# OVERCLOCK Engine Architecture

## Overview

OVERCLOCK uses an **event-driven plugin architecture**. The engine is a lightweight event bus that coordinates plugins, manages game state, and handles modifiers.

```
┌─────────────────────────────────────────────────────────────┐
│                        GameEngine                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Event Bus   │  │ State Store │  │ Modifier Registry   │ │
│  │ emit/on/off │  │ GameState   │  │ tap_damage, dps...  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                           │                                 │
│  ┌────────────────────────┼────────────────────────────┐   │
│  │                    Plugins                           │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │  │ Tap    │ │ Enemy  │ │ Stage  │ │ Gold   │  ...  │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Event System

The engine uses a pub/sub pattern. Plugins communicate through events:

```typescript
// Emit an event
engine.emit('enemy_death', { gold: 100, stage: 5 });

// Listen to events
const unsub = engine.on('enemy_death', (event) => {
  console.log('Enemy died, gold:', event.payload.gold);
});

// Cleanup
unsub(); // or engine.off('enemy_death', handler)
```

**Event Types** (defined in `src/engine/types.ts`):
- `tap` - Player tapped the screen
- `tick` - Game loop tick (10 times/second)
- `stage_clear` - Stage completed
- `boss_spawn` / `boss_defeat` / `boss_timeout`
- `enemy_hit` / `enemy_death` / `enemy_spawn`
- `damage_number` - Display floating damage text
- `skill_activated` - Skill used
- `gold_changed` / `diamonds_earned`
- `item_drop` / `item_equipped` / `item_unequipped`
- `save_requested` / `save_complete`
- `auth_success` / `auth_signout`
- And many more...

### 2. Game State

Single source of truth stored in `engine.state`:

```typescript
interface GameState {
  // Progression
  stage: number;
  highestStage: number;
  gold: number;
  diamonds: number;
  
  // Combat
  enemy: Enemy | null;
  isBossActive: boolean;
  bossTimeRemaining: number;
  
  // Upgrades
  components: Record<string, ComponentDef>;
  motherboardTier: number;
  overclockCount: number;
  
  // Items
  inventory: HardwareItem[];
  equippedItems: Record<ItemSlot, (HardwareItem | null)[]>;
  
  // Skills
  skillCooldowns: Record<SkillId, SkillCooldownState>;
  skillPoints: number;
  skillUpgrades: Record<SkillId, number>;
  
  // Meta
  lastSaveTime: number;
  lastTickTime: number;
  schemaVersion: number;
}
```

**Update state:**
```typescript
engine.updateState({ gold: engine.state.gold + 100 });
```

### 3. Modifier System

Plugins register modifiers that stack multiplicatively:

```typescript
// Register a modifier (in plugin init)
engine.addModifier('item_plugin', {
  type: 'tap_damage',
  value: 1.5, // +50% tap damage
  isMultiplier: true
});

// Get combined modifier value
const totalTapDamage = engine.getModifier('tap_damage'); // Returns product of all modifiers
```

**Modifier Types:**
- `tap_damage` - Base tap damage multiplier
- `idle_dps` - Passive DPS multiplier
- `gold_rate` - Gold earned multiplier
- `crit_chance` - Critical hit chance bonus
- `crit_multiplier` - Critical damage multiplier

### 4. Plugin Lifecycle

```typescript
interface IPlugin {
  id: string;                          // Unique identifier
  dependencies?: string[];             // Other plugins this depends on
  stateKeys?: (keyof GameState)[];     // State keys this plugin manages
  defaultState?: Partial<GameState>;   // Initial state values
  schema?: TableSchema[];              // Database tables needed
  
  init(engine: IEngine): Promise<void>;  // Called once on engine boot
  onTick?(delta: number, state: GameState): void;  // Called every tick
  onEvent?(event: GameEvent): void;      // Called on every event
  cleanup?(): void;                      // Called on engine shutdown
}
```

### 5. Plugin Storage

Plugins can persist data to Supabase:

```typescript
// Register a table
engine.storage.registerTable('my_plugin', { table: 'my_data', userScoped: true });

// Load data
const { data, error } = await engine.storage.load('profiles', { user_id: 'xxx' }, 'handle, gold');

// Save data
await engine.storage.save('profiles', { user_id: 'xxx', gold: 1000 }, 'user_id');

// Insert new record
await engine.storage.insert('items', { name: 'Sword', power: 10 });

// Delete
await engine.storage.remove('items', { id: 'xxx' });
```

## Game Loop

The engine runs at **10 ticks per second** (100ms intervals):

```
┌─────────────────────────────────────────────────┐
│                   GAME LOOP                     │
│                                                 │
│  1. Calculate delta time since last tick        │
│  2. Emit 'tick' event                          │
│  3. Each plugin's onTick() is called           │
│     - EnemyPlugin: Apply idle DPS damage       │
│     - SkillPlugin: Update cooldowns            │
│     - SavePlugin: Check auto-save interval     │
│  4. React components re-render via useSyncExternalStore │
│  5. Wait 100ms, repeat                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

## React Integration

Components subscribe to state using `useGameState`:

```typescript
// Subscribe to specific state values
const gold = useGameState(engine, s => s.gold);
const enemy = useGameState(engine, s => s.enemy);

// Engine updates trigger re-renders only when subscribed values change
```

## File Structure

```
src/
├── engine/
│   ├── types.ts         # All type definitions
│   └── GameEngine.ts    # Engine implementation (if exists)
├── plugins/
│   ├── TapPlugin.ts     # Tap damage handling
│   ├── EnemyPlugin.ts   # Enemy spawning, damage, death
│   ├── StagePlugin.ts   # Stage progression
│   ├── GoldPlugin.ts    # Gold economy
│   ├── SkillPlugin.ts   # Skill system
│   ├── ItemPlugin.ts    # Item drops and equipment
│   ├── SavePlugin.ts    # Auto-save to Supabase
│   └── ...24 total
├── config/
│   └── game.config.ts   # All balance values
└── components/
    └── game/            # React UI components
```

## Boot Sequence

1. Create engine instance
2. Register all plugins (respecting dependencies)
3. Call `plugin.init()` on each plugin
4. Load saved state from Supabase
5. Start game loop
6. Emit `boot_complete` event

## Adding a New System

To add a new game system:

1. Create plugin in `src/plugins/NewPlugin.ts`
2. Implement `IPlugin` interface
3. Add config values to `src/config/game.config.ts`
4. Register plugin in engine setup
5. Create React component to display UI
6. Add database migration if persistence needed

See `PLUGINS_REFERENCE.md` for detailed plugin documentation.
