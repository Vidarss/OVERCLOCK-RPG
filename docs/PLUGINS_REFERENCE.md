# OVERCLOCK Plugins Reference

Complete reference for all 24 game plugins.

---

## Plugin Categories

| Category | Plugins |
|----------|---------|
| **Core Combat** | TapPlugin, EnemyPlugin, SkillPlugin |
| **Progression** | StagePlugin, GoldPlugin, OverclockPlugin |
| **Upgrades** | ComponentPlugin, HeroPlugin, MoboPlugin |
| **Items** | ItemPlugin, SetPlugin |
| **Meta Systems** | DailyPlugin, AchievementPlugin, TournamentPlugin |
| **Economy** | ShopPlugin, DataPacketPlugin |
| **Social** | LeaderboardPlugin, ClanPlugin |
| **Infrastructure** | AuthPlugin, SavePlugin, SupabasePlugin, SettingsPlugin |
| **Utility** | ZonePlugin, SkillPointPlugin |

---

## Core Combat Plugins

### TapPlugin
**File:** `src/plugins/TapPlugin.ts`
**Dependencies:** `enemy`

Handles player tap input and damage calculation.

```typescript
// Usage
const tapPlugin = engine.getPlugin<TapPlugin>('tap');
tapPlugin.tap(x, y); // Apply tap damage at screen position
```

**Events Emitted:**
- `damage_number` - Floating damage text

**Config:** `TAP_CONFIG` in game.config.ts
- `baseDamage` - Starting tap damage
- `baseCritChance` - Base crit chance
- `baseCritMultiplier` - Crit damage multiplier
- `comboWindowMs` - Time window for combo
- `comboThreshold` - Taps needed for combo
- `comboMultiplier` - Combo damage bonus

---

### EnemyPlugin
**File:** `src/plugins/EnemyPlugin.ts`
**Dependencies:** `stage`
**State Keys:** `enemy`, `isBossActive`, `bossTimeRemaining`, `pendingBossReturn`, `pendingBossStage`

Manages enemy spawning, HP, and death.

```typescript
// Usage
const enemyPlugin = engine.getPlugin<EnemyPlugin>('enemy');
enemyPlugin.applyDamage(100, isCrit);
enemyPlugin.spawnNext();
```

**Exported Functions:**
- `getEnemyHp(stage)` - Calculate enemy HP for stage
- `getBossHp(stage)` - Calculate boss HP for stage
- `getEnemyTier(stage)` - Get enemy tier (0-9) for stage
- `spawnEnemy(stage)` - Create enemy object

**Events Emitted:**
- `enemy_spawn` - New enemy appeared
- `enemy_hit` - Enemy took damage
- `enemy_death` - Enemy killed
- `boss_spawn` / `boss_defeat` / `boss_timeout`

**Config:** `ENEMY_CONFIG` in game.config.ts
- `normalHpBase` / `bossHpBase` - Base HP values
- `linearGrowth` / `scalingExponentEarly` / `scalingExponentLate` - HP scaling
- `bossEveryNStages` - Boss frequency (every 10)
- `bossTimeoutSeconds` - Boss timer
- `eliteChance` / `eliteHpMultiplier` / `eliteMinStage` - Elite enemies
- `enemyNamesByTier` - 2D array of enemy names per tier
- `bossNames` - Boss name pool

---

### SkillPlugin
**File:** `src/plugins/SkillPlugin.ts`
**Dependencies:** `enemy`
**State Keys:** `skillCooldowns`

Manages 10 active skills with cooldowns and effects.

```typescript
// Usage
const skillPlugin = engine.getPlugin<SkillPlugin>('skill');
skillPlugin.activateSkill('surge');
const isReady = skillPlugin.isReady('surge');
const remaining = skillPlugin.getCooldownRemaining('surge');
```

**Skills:**
| ID | Name | Effect |
|----|------|--------|
| `surge` | SURGE | Instant burst damage |
| `overclock_pulse` | OVERCLOCK PULSE | Temporary DPS boost |
| `gold_rush` | GOLD RUSH | Bonus gold on kills |
| `firewall` | FIREWALL | Damage shield |
| `chain_hack` | CHAIN HACK | Chain damage |
| `static_discharge` | STATIC DISCHARGE | AOE damage |
| `signal_jam` | SIGNAL JAM | Slow enemies |
| `meltdown` | MELTDOWN | DOT damage |
| `entropy_burst` | ENTROPY BURST | Random effects |
| `quantum_echo` | QUANTUM ECHO | Clone damage |

**Config:** `SKILLS_CONFIG` in game.config.ts

---

## Progression Plugins

### StagePlugin
**File:** `src/plugins/StagePlugin.ts`
**Dependencies:** none
**State Keys:** `stage`, `highestStage`, `maxStage`

Tracks stage progression and unlocks.

```typescript
// Usage
const stagePlugin = engine.getPlugin<StagePlugin>('stage');
stagePlugin.advanceStage();
stagePlugin.goToStage(100);
```

**Events Listened:**
- `enemy_death` - Advance to next stage

**Events Emitted:**
- `stage_clear` - Stage completed
- `zone_changed` - Entered new zone

---

### GoldPlugin
**File:** `src/plugins/GoldPlugin.ts`
**Dependencies:** `enemy`
**State Keys:** `gold`

Manages gold economy.

```typescript
// Usage
const goldPlugin = engine.getPlugin<GoldPlugin>('gold');
goldPlugin.addGold(100);
goldPlugin.spendGold(50); // Returns true if successful
```

**Events Emitted:**
- `gold_changed` - Gold amount changed

**Config:** `GOLD_CONFIG` in game.config.ts
- `baseGoldPerKill` - Base gold from enemies
- `goldScalingPerStage` - Gold increase per stage

---

### OverclockPlugin
**File:** `src/plugins/OverclockPlugin.ts`
**Dependencies:** `stage`, `gold`
**State Keys:** `overclockCount`, `overclockTier`, `totalOverclocks`, `overclockUpgrades`

Prestige system - reset progress for permanent bonuses.

```typescript
// Usage
const overclockPlugin = engine.getPlugin<OverclockPlugin>('overclock');
const canOC = overclockPlugin.canOverclock();
const octGain = overclockPlugin.getOctGain();
overclockPlugin.performOverclock();
```

**Config:** `OVERCLOCK_CONFIG` in game.config.ts
- `minStageToOverclock` - Minimum stage required
- `octBaseGain` / `octStageScaling` - OCT gain formula
- `perks` - Available permanent upgrades

---

## Upgrade Plugins

### ComponentPlugin
**File:** `src/plugins/ComponentPlugin.ts`
**Dependencies:** `gold`
**State Keys:** `components`

Manages 50+ hardware components that provide passive DPS.

```typescript
// Usage
const compPlugin = engine.getPlugin<ComponentPlugin>('component');
compPlugin.purchaseComponent('ram_stick');
compPlugin.levelUpComponent('ram_stick');
const dps = compPlugin.getTotalDps();
```

**Events Emitted:**
- `component_purchase` - Component bought
- `component_levelup` - Component upgraded

**Config:** `COMPONENTS_CONFIG` in game.config.ts

---

### HeroPlugin
**File:** `src/plugins/HeroPlugin.ts`
**Dependencies:** `gold`
**State Keys:** `heroUpgrades`

Upgrades for tap damage, crit chance, crit damage.

```typescript
// Usage
const heroPlugin = engine.getPlugin<HeroPlugin>('hero');
heroPlugin.upgradeHero('tap_power');
const level = heroPlugin.getLevel('tap_power');
const cost = heroPlugin.getCost('tap_power');
```

**Config:** `HERO_CONFIG` in game.config.ts

---

### MoboPlugin
**File:** `src/plugins/MoboPlugin.ts`
**Dependencies:** `gold`
**State Keys:** `motherboardTier`, `ramSlots`, `expansionSlots`

Motherboard upgrades that unlock item slots.

```typescript
// Usage
const moboPlugin = engine.getPlugin<MoboPlugin>('mobo');
moboPlugin.upgradeMobo();
const slots = moboPlugin.getSlots('RAM');
```

**Config:** `MOTHERBOARD_CONFIG` in game.config.ts

---

## Item Plugins

### ItemPlugin
**File:** `src/plugins/ItemPlugin.ts`
**Dependencies:** `enemy`, `mobo`
**State Keys:** `inventory`, `equippedItems`, `scrap`

Item drops, equipment, enchanting, scrapping.

```typescript
// Usage
const itemPlugin = engine.getPlugin<ItemPlugin>('item');
itemPlugin.equipItem(item, slotIndex);
itemPlugin.unequipItem('RAM', 0);
itemPlugin.scrapItem(itemId);
itemPlugin.enchantItem(itemId); // Uses scrap
itemPlugin.tierUpItem(itemId); // Upgrade rarity
```

**Events Emitted:**
- `item_drop` - Item dropped from enemy
- `item_equipped` / `item_unequipped`
- `item_enchanted` / `item_tier_up`
- `item_scrapped`

**Config:** `ITEM_CONFIG` in game.config.ts
- `dropChance` - Base drop rate
- `rarityWeights` - Rarity distribution
- `inventoryMax` - Max inventory size (500)
- `enchantScrapCost` - Cost to enchant
- `tierUpScrapCost` - Cost to upgrade tier

---

### SetPlugin
**File:** `src/plugins/SetPlugin.ts`
**Dependencies:** `item`
**State Keys:** `setItems`, `collectedSets`

Set item bonuses when wearing matching pieces.

```typescript
// Usage
const setPlugin = engine.getPlugin<SetPlugin>('set');
const bonus = setPlugin.getSetBonus('neural_network');
const progress = setPlugin.getSetProgress('neural_network');
```

**Config:** `SETS_CONFIG` in game.config.ts

---

## Meta Systems

### DailyPlugin
**File:** `src/plugins/DailyPlugin.ts`
**Dependencies:** `auth`
**State Keys:** none (uses Supabase)

Daily challenges with diamond rewards.

```typescript
// Usage
const dailyPlugin = engine.getPlugin<DailyPlugin>('daily');
const challenges = dailyPlugin.getChallenges();
dailyPlugin.claimReward(challengeId);
```

**Events Emitted:**
- `daily_completed` - Challenge completed

**Config:** `DAILIES_CONFIG` in game.config.ts

---

### AchievementPlugin
**File:** `src/plugins/AchievementPlugin.ts`
**Dependencies:** `auth`
**State Keys:** none (uses Supabase)

Achievement tracking and rewards.

```typescript
// Usage
const achPlugin = engine.getPlugin<AchievementPlugin>('achievement');
const achievements = achPlugin.getAchievements();
achPlugin.unlock('first_blood');
```

**Events Emitted:**
- `achievement_unlocked`

---

### TournamentPlugin
**File:** `src/plugins/TournamentPlugin.ts`
**Dependencies:** `auth`, `stage`
**State Keys:** `tournamentMaxStage`, `tournamentSessionId`

Weekly tournaments with leaderboards.

```typescript
// Usage
const tournPlugin = engine.getPlugin<TournamentPlugin>('tournament');
const active = tournPlugin.getActive();
const upcoming = tournPlugin.getUpcoming();
await tournPlugin.joinTournament(id);
await tournPlugin.submitScore();
```

**Config:** `TOURNAMENT_CONFIG` in game.config.ts

---

## Economy Plugins

### ShopPlugin
**File:** `src/plugins/ShopPlugin.ts`
**Dependencies:** `auth`, `gold`
**State Keys:** none

In-game shop for diamond purchases.

```typescript
// Usage
const shopPlugin = engine.getPlugin<ShopPlugin>('shop');
const items = shopPlugin.getShopItems();
await shopPlugin.purchase(itemId);
```

**Events Emitted:**
- `shop_purchase`

**Config:** `SHOP_CONFIG` in game.config.ts

---

### DataPacketPlugin
**File:** `src/plugins/DataPacketPlugin.ts`
**Dependencies:** none
**State Keys:** none

Spawns collectible data packets on screen.

```typescript
// Usage
const dataPlugin = engine.getPlugin<DataPacketPlugin>('datapacket');
const packets = dataPlugin.getActivePackets();
dataPlugin.collectPacket(id);
```

**Events Emitted:**
- `datapacket_spawned`
- `datapacket_collected`
- `datapacket_expired`

---

## Social Plugins

### LeaderboardPlugin
**File:** `src/plugins/LeaderboardPlugin.ts`
**Dependencies:** `auth`

Global leaderboards.

```typescript
// Usage
const lbPlugin = engine.getPlugin<LeaderboardPlugin>('leaderboard');
const top100 = await lbPlugin.getLeaderboard();
```

---

### ClanPlugin
**File:** `src/plugins/ClanPlugin.ts`
**Dependencies:** `auth`

Clan system (NOT IMPLEMENTED - future feature).

---

## Infrastructure Plugins

### AuthPlugin
**File:** `src/plugins/AuthPlugin.ts`
**Dependencies:** none
**Roles:** `auth`

User authentication via Supabase.

```typescript
// Usage
const authPlugin = engine.getPlugin<AuthPlugin>('auth');
await authPlugin.signIn(email, password);
await authPlugin.signUp(email, password, handle);
await authPlugin.signOut();
const user = authPlugin.getUser();
```

**Events Emitted:**
- `auth_success` / `auth_failed` / `auth_signout`

---

### SavePlugin
**File:** `src/plugins/SavePlugin.ts`
**Dependencies:** `auth`
**Roles:** `persistence`

Auto-save and offline progress.

```typescript
// Usage
const savePlugin = engine.getPlugin<SavePlugin>('save');
await savePlugin.save();
await savePlugin.load();
```

**Config:** `SAVE_CONFIG` in game.config.ts
- `autoSaveIntervalMs` - Auto-save frequency
- `offlineGoldMultiplier` - Offline gold rate
- `offlineMaxHours` - Max offline time

---

### SupabasePlugin
**File:** `src/plugins/SupabasePlugin.ts`
**Dependencies:** none

Supabase client wrapper for storage operations.

---

### SettingsPlugin
**File:** `src/plugins/SettingsPlugin.ts`
**Dependencies:** none

User settings (SFX, BGM, vibration).

```typescript
// Usage
const settingsPlugin = engine.getPlugin<SettingsPlugin>('settings');
settingsPlugin.setSfxEnabled(false);
settingsPlugin.setBgmVolume(0.5);
```

---

## Utility Plugins

### ZonePlugin
**File:** `src/plugins/ZonePlugin.ts`
**Dependencies:** `stage`

Visual zones based on stage (colors, backgrounds).

```typescript
// Usage
const zonePlugin = engine.getPlugin<ZonePlugin>('zone');
const zone = zonePlugin.getCurrentZone();
// { name: 'SECTOR 1', accentColor: '#00f5ff', bgGradient: [...] }
```

**Config:** `ZONE_CONFIG` in game.config.ts

---

### SkillPointPlugin
**File:** `src/plugins/SkillPointPlugin.ts`
**Dependencies:** `stage`
**State Keys:** `skillPoints`, `claimedSkillPointMilestones`

Awards skill points at stage milestones.

```typescript
// Usage
const spPlugin = engine.getPlugin<SkillPointPlugin>('skillpoint');
spPlugin.spendSkillPoint('surge');
```

**Config:** `SKILL_POINT_CONFIG` in game.config.ts

---

## Creating a New Plugin

Template:

```typescript
import type { IPlugin, IEngine, GameState } from '../engine/types';
import { MY_CONFIG } from '../config/game.config';

export class MyPlugin implements IPlugin {
  id = 'my_plugin';
  dependencies = ['other_plugin']; // Optional
  stateKeys = ['myStateKey'] as (keyof GameState)[]; // Optional
  
  private engine!: IEngine;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    
    // Subscribe to events
    engine.on('enemy_death', this.onEnemyDeath.bind(this));
    
    // Register modifiers
    engine.addModifier('my_plugin', {
      type: 'tap_damage',
      value: 1.1,
      isMultiplier: true
    });
  }

  onTick(delta: number, state: GameState): void {
    // Called every 100ms
  }

  private onEnemyDeath(event: GameEvent): void {
    // Handle event
    this.engine.emit('my_event', { data: 123 });
  }

  // Public API
  doSomething(): void {
    this.engine.updateState({ gold: this.engine.state.gold + 100 });
  }

  cleanup(): void {
    this.engine.removeModifiers('my_plugin');
  }
}
```

Then register in engine setup and add config to `game.config.ts`.
