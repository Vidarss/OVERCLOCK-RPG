# OVERCLOCK RPG - Modular Development Plan

> Master checklist for building OVERCLOCK RPG. Each module includes a detailed skeletal specification.

---

## Database Status

- [x] `profiles` - User profiles
- [x] `achievements` - Achievement definitions
- [x] `achievement_stats` - Player achievement progress
- [x] `leaderboard` - Global rankings
- [x] `clans` - Clan data
- [x] `clan_members` - Clan membership
- [x] `clan_invites` - Clan invitations
- [x] `tournaments` - Tournament definitions
- [x] `tournament_entries` - Tournament participation
- [x] `daily_challenges` - Daily challenge definitions
- [x] `shop_purchases` - Purchase history
- [x] `set_items` - Equipment set definitions
- [x] `game_variables` - Global game config
- [x] `user_presence` - Online status
- [x] `player_saves` - Cloud save game state

---

## Module 1: Combat Engine (Core Mechanics)
*Foundation of all combat interactions*

### Checklist
- [x] Tap damage calculation
- [x] Critical hit system (chance + multiplier)
- [x] Damage number display with formatting
- [x] Enemy HP bars
- [x] Stage/Phase progression (10 phases per stage)
- [x] Auto-attack system (DPS)
- [x] Combat event bus
- [ ] Damage types (physical, elemental, true)
- [ ] Damage resistance system
- [ ] Combo system (consecutive taps)
- [ ] Overkill damage tracking

### Skeletal Specification

#### Damage Types
- **Physical**: Default damage, reduced by armor
- **Elemental**: Fire/Ice/Lightning, reduced by elemental resist
- **True**: Ignores all resistances
- Needs: damage type enum, enemy resistance stats, UI indicators for damage type colors
- Formula: `finalDamage = baseDamage * (1 - resistance[type])`

#### Damage Resistance System
- Needs: resistance values per enemy (0-0.9 cap)
- Needs: resistance display on enemy info tooltip
- Needs: config for resistance by enemy tier/type
- Edge case: true damage bypasses all resistance

#### Combo System
- Trigger: consecutive taps within 0.5s window
- Combo counter: 1, 2, 3... up to max combo
- Combo bonus: +1% damage per combo stack (capped at 100 stacks = +100%)
- Combo reset: if no tap for 0.5s, combo drops to 0
- Needs: combo counter UI, combo milestone sounds (10, 25, 50, 100)
- Needs: combo persistence in game state

#### Overkill Damage Tracking
- Track damage dealt beyond enemy HP
- Overkill stat for achievements/leaderboards
- Overkill bonus: excess damage can carry to next enemy (optional upgrade)
- Needs: overkill counter, lifetime overkill stat in player_saves

---

## Module 2: Enemy System
*Enemy generation, types, and behaviors*

### Checklist
- [x] Enemy HP scaling formula
- [x] Elite enemies (chance spawn, HP multiplier)
- [x] Boss enemies (phase 10, timeout, regen)
- [x] Enemy sprites (10 monsters, 5 elites, 3 bosses)
- [x] Stage range system (minStage/maxStage per enemy)
- [x] Enemy death rewards (gold)
- [ ] Enemy special abilities
- [ ] Boss phases/mechanics
- [ ] Enemy armor/shields
- [ ] Miniboss system (phase 5)

### Skeletal Specification

#### Enemy Special Abilities
- **Types**: Heal, Shield, Enrage, Summon, Debuff
- Trigger: random on spawn OR at HP threshold (50%, 25%)
- Cooldown: prevent spam (5-10s per ability)
- Needs: ability icons on enemy, visual effects, ability config per enemy
- Needs: ability event emitter for UI notifications
- Example abilities:
  - CACHE_BREAKER: "Corrupt" - reduces player crit chance by 10% for 5s
  - KERNEL_LEAK_SPAWN: "Memory Leak" - spawns 2 mini enemies
  - FIREWALL_ORPHAN: "Firewall" - 50% damage reduction for 3s

#### Boss Phases/Mechanics
- Phase 1 (100-66% HP): Normal attacks
- Phase 2 (66-33% HP): Enraged (+50% damage dealt, -25% damage taken)
- Phase 3 (33-0% HP): Berserk (spawns adds, faster regen if not killed)
- Needs: phase transition animation, phase indicator UI
- Needs: phase-specific ability triggers
- Needs: alert popup when boss changes phase

#### Enemy Armor/Shields
- **Armor**: Flat damage reduction (e.g., 100 armor = -100 damage per hit, min 1)
- **Shield**: Absorbs damage before HP, regenerates after 5s of no damage
- Shield break: visual + sound effect, 3s vulnerability window
- Needs: shield bar UI (separate from HP), armor icon indicator
- Needs: "shield broken" event for bonus damage window

#### Miniboss System (Phase 5)
- Spawn condition: Phase 5 of every stage
- Stats: 3x normal HP, 1.5x gold reward
- No timeout (unlike boss), but slightly harder
- Needs: miniboss sprite variants (recolor of elites?)
- Needs: miniboss spawn announcement
- Needs: miniboss death celebration (smaller than boss)

---

## Module 3: Currency System
*All currency types and earning mechanics*

### Checklist
- [x] Credits (gold) - primary currency
- [x] Gold per kill (HP * multiplier)
- [x] Data Packets (ad rewards)
- [x] Encrypted Cache (premium ad rewards)
- [ ] Premium currency (Overclock Cores)
- [ ] Prestige currency (Quantum Bits)
- [ ] Event currency
- [ ] Currency conversion rates
- [ ] Offline earnings calculation

### Skeletal Specification

#### Premium Currency (Overclock Cores)
- Earn from: IAP, achievements, tournaments, daily login
- Spend on: gacha pulls, cosmetics, skip timers, premium items
- Needs: core balance in player_saves, core transaction log
- Needs: core display in header UI, core shop section
- Needs: "not enough cores" alert with link to shop
- IAP prices: $0.99 = 100 cores, $4.99 = 550 cores, $9.99 = 1200 cores

#### Prestige Currency (Quantum Bits)
- Earn from: prestige resets only
- Formula: `bits = floor(sqrt(highestStage / 10) * prestigeMultiplier)`
- Spend on: artifacts, prestige upgrades
- Needs: bit balance display, prestige shop
- Needs: prestige confirmation showing bits earned preview
- Needs: lifetime bits tracking for achievements

#### Event Currency
- Temporary currency during events
- Auto-converts to credits at event end (10:1 ratio)
- Needs: event currency config (name, icon, conversion rate)
- Needs: event currency display (only during event)
- Needs: alert when event ending "Convert your X before event ends!"
- Needs: event shop with exclusive items

#### Currency Conversion Rates
- Credits -> Premium: NOT ALLOWED (premium is premium)
- Event -> Credits: 10:1 at event end
- Needs: conversion UI in settings or shop
- Needs: conversion confirmation dialog

#### Offline Earnings Calculation
- Calculate on app open: `offlineGold = offlineSeconds * goldPerSecond * offlineMultiplier`
- `goldPerSecond` = auto-DPS * goldPerDamage (based on last active stage)
- `offlineMultiplier` = 0.1 base, can upgrade to 0.5 max
- Cap: 8 hours max offline time
- Needs: welcome back popup showing earnings
- Needs: "Watch ad to double offline earnings" option
- Needs: offline time display, offline earnings preview in settings

---

## Module 4: Upgrade System
*Permanent stat improvements*

### Checklist
- [x] Tap Damage upgrade
- [x] Critical Chance upgrade
- [x] Critical Damage upgrade
- [x] Upgrade cost scaling formula
- [x] Upgrade level caps
- [ ] Auto-DPS upgrade
- [ ] Gold multiplier upgrade
- [ ] Upgrade milestones (bonus at levels 25/50/100)
- [ ] Bulk purchase (x10, x100, MAX)
- [ ] Upgrade categories/tabs

### Skeletal Specification

#### Auto-DPS Upgrade
- Unlocks auto-attack dealing damage per second
- Base DPS: 1, scaling: +1 per level
- Cost formula: same as tap damage
- Needs: auto-DPS display in stats panel
- Needs: auto-DPS toggle (on/off) in settings
- Needs: visual indicator when auto-attacking

#### Gold Multiplier Upgrade
- Multiplies all gold earned
- Base: 1.0x, per level: +0.05x (level 100 = 6x gold)
- Cost: 2x tap damage upgrade cost
- Needs: gold multiplier display in stats
- Needs: gold multiplier in all gold calculations

#### Upgrade Milestones
- At levels 25, 50, 100, 200, 500, 1000: bonus effect
- Tap Damage milestones: +10% base damage permanently
- Crit Chance milestones: +1% crit chance
- Crit Damage milestones: +25% crit multiplier
- Needs: milestone indicator on upgrade button
- Needs: milestone unlock animation/popup
- Needs: milestone preview in upgrade tooltip

#### Bulk Purchase (x10, x100, MAX)
- x10: Buy 10 levels at total cost
- x100: Buy 100 levels at total cost  
- MAX: Buy as many as affordable
- Needs: bulk toggle buttons in upgrade UI
- Needs: cost preview for bulk amounts
- Needs: "Can't afford" visual feedback
- Needs: hold-to-buy for rapid purchasing

#### Upgrade Categories/Tabs
- **Offense**: Tap Damage, Crit Chance, Crit Damage
- **Defense**: HP (future), Regen (future)
- **Utility**: Auto-DPS, Gold Multiplier, Offline Earnings
- **Prestige**: Unlocked after first prestige
- Needs: tab navigation UI
- Needs: category totals display
- Needs: "new upgrade available" indicator

---

## Module 5: Skill Tree Framework
*Branching passive abilities*

### Checklist
- [ ] Skill tree data structure
- [ ] Node types (passive, active, keystone)
- [ ] Node connections/dependencies
- [ ] Skill point system
- [ ] Skill point gain (per X stages)
- [ ] Tree branches (Offense, Defense, Utility, Prestige)
- [ ] Respec system
- [ ] Skill tree UI

### Skeletal Specification

#### Skill Tree Data Structure
```typescript
interface SkillNode {
  id: string;
  name: string;
  description: string;
  branch: 'offense' | 'defense' | 'utility' | 'prestige';
  type: 'passive' | 'active' | 'keystone';
  tier: number; // 1-5, determines position in tree
  maxLevel: number;
  currentLevel: number;
  pointCost: number; // per level
  prerequisites: string[]; // node IDs that must be unlocked first
  effects: SkillEffect[];
  position: { x: number; y: number }; // for UI placement
}
```
- Needs: skill tree config file with all nodes
- Needs: skill tree state in player_saves.skill_tree

#### Node Types
- **Passive**: Always active once unlocked (e.g., +5% damage)
- **Active**: Grants an active skill to use (e.g., Power Surge)
- **Keystone**: Powerful node at end of branch, only 1 keystone active per branch
- Needs: visual distinction for node types
- Needs: keystone exclusivity enforcement

#### Node Connections/Dependencies
- Each node has prerequisites (parent nodes)
- Must unlock all prerequisites before unlocking node
- Visual: lines connecting nodes, grayed out if locked
- Needs: connection rendering in UI
- Needs: "unlock path" preview when hovering locked node

#### Skill Point System
- Earn 1 skill point every 5 stages cleared
- Earn 3 skill points per prestige
- Spend on unlocking/leveling nodes
- Needs: skill point balance display
- Needs: skill point gain notification
- Needs: skill point history/log

#### Tree Branches
- **Offense**: Damage, crit, attack speed bonuses
- **Defense**: HP, shields, damage reduction (future combat)
- **Utility**: Gold, offline earnings, cooldown reduction
- **Prestige**: Only visible after first prestige, powerful endgame bonuses
- Needs: branch selection tabs or scroll in UI
- Needs: branch completion percentage

#### Respec System
- Cost: 100 premium currency OR free once per prestige
- Full respec: refunds ALL skill points
- Partial respec: refund single branch (50% cost)
- Needs: respec confirmation dialog
- Needs: respec warning about losing progress
- Needs: "free respec available" indicator after prestige

#### Skill Tree UI
- Zoomable/pannable tree view
- Node tooltips with full info
- Locked nodes grayed, available nodes highlighted
- Allocated nodes glowing
- Needs: skill point counter in corner
- Needs: search/filter for nodes
- Needs: "recommended path" for new players (optional)

---

## Module 6: Active Skills
*Cooldown-based abilities*

### Checklist
- [ ] Skill slot system (4-6 slots)
- [ ] Skill cooldown management
- [ ] Skill unlock conditions
- [ ] Skill leveling
- [ ] Base skills (Power Surge, Gold Rush, Time Warp, Critical Storm, Shield Protocol)
- [ ] Skill effects system
- [ ] Skill UI (hotbar)

### Skeletal Specification

#### Skill Slot System
- 4 slots base, unlock 5th at stage 50, 6th at stage 100
- Drag-drop to assign skills to slots
- Empty slots show "+" to open skill selection
- Needs: slot unlock notifications
- Needs: slot persistence in player_saves.skills

#### Skill Cooldown Management
- Each skill has independent cooldown
- Cooldown starts after skill ends (not on use)
- Cooldown reduction stat from skill tree
- Needs: cooldown timer display on each slot
- Needs: cooldown "ready" animation/sound
- Needs: global cooldown option (prevent spam, 0.5s)

#### Skill Unlock Conditions
- Power Surge: Stage 10
- Gold Rush: Stage 25
- Time Warp: Stage 50
- Critical Storm: Stage 75
- Shield Protocol: Stage 100
- Advanced skills: Skill tree keystones
- Needs: unlock popup when condition met
- Needs: skill preview before unlock

#### Skill Leveling
- Each skill levels 1-10
- Level up cost: gold + skill points
- Each level: +10% effect power, -5% cooldown
- Needs: skill level display
- Needs: level up button with cost preview
- Needs: max level indicator

#### Base Skills
- **Power Surge**: Deal 500% tap damage instantly. CD: 60s. Duration: instant.
- **Gold Rush**: +200% gold for 30s. CD: 120s.
- **Time Warp**: +100% attack speed for 20s. CD: 90s.
- **Critical Storm**: 100% crit chance for 15s. CD: 90s.
- **Shield Protocol**: Invulnerable for 10s (for future PvP/damage). CD: 180s.
- Needs: skill icons, animations, sound effects
- Needs: buff indicator when skill active

#### Skill Effects System
```typescript
interface SkillEffect {
  type: 'damage' | 'buff' | 'debuff' | 'summon' | 'utility';
  target: 'self' | 'enemy' | 'all_enemies';
  stat?: string; // for buffs: 'damage', 'gold', 'crit_chance', etc.
  value: number;
  duration?: number; // seconds, 0 = instant
  stacks?: boolean;
}
```
- Needs: effect application system
- Needs: effect removal on duration end
- Needs: effect stacking rules

#### Skill UI (Hotbar)
- Fixed position at bottom of game screen
- Tap skill icon to activate (if off cooldown)
- Cooldown spiral overlay
- Skill level badge on icon
- Needs: skill selection modal
- Needs: skill info on long-press
- Needs: auto-cast toggle per skill (optional)

---

## Module 7: Equipment System
*Gear slots and stats*

### Checklist
- [ ] Equipment slots (6-8 slots)
- [ ] Rarity system (Common -> Mythic)
- [ ] Equipment stats (primary + secondary)
- [ ] Equipment level/enhancement
- [ ] Set bonuses
- [ ] Equipment drops from enemies
- [ ] Equipment inventory
- [ ] Compare/equip UI
- [ ] Salvage system

### Skeletal Specification

#### Equipment Slots
- **Weapon**: Primary damage source
- **Armor**: Defense stat
- **Helmet**: HP bonus
- **Gloves**: Crit stats
- **Boots**: Speed/utility
- **Accessory 1 & 2**: Flexible stats
- **Artifact Slot**: Special equip (unlocks at prestige)
- Needs: slot icons, empty slot indicators
- Needs: slot unlock progression (all unlocked by stage 50)

#### Rarity System
- **Common** (Gray): 1 stat, no bonus
- **Uncommon** (Green): 1-2 stats, +10% base
- **Rare** (Blue): 2-3 stats, +25% base
- **Epic** (Purple): 3-4 stats, +50% base
- **Legendary** (Orange): 4 stats, +100% base, unique effect
- **Mythic** (Red): 4 stats, +200% base, unique effect, glowing
- Needs: rarity colors in UI, rarity filters
- Needs: drop rate config per rarity

#### Equipment Stats
- **Primary**: Main stat (damage for weapon, defense for armor)
- **Secondary**: 0-3 random stats from pool:
  - +X% Tap Damage
  - +X% Crit Chance
  - +X% Crit Damage
  - +X% Gold Find
  - +X% Attack Speed
  - +X Flat Damage
  - +X% Skill Cooldown Reduction
- Needs: stat roll ranges per rarity
- Needs: stat display formatting

#### Equipment Level/Enhancement
- Enhance using gold + materials
- Each level: +10% to all stats
- Max level: 10 (Common) to 50 (Mythic)
- Enhancement cost scales exponentially
- Fail chance at high levels (optional hardcore mode)
- Needs: enhance button, level display
- Needs: enhancement animation
- Needs: material requirements display

#### Set Bonuses
- Sets: 2-4 pieces from same set
- 2-piece bonus: Minor effect (+10% damage)
- 4-piece bonus: Major effect (unique ability)
- Example sets:
  - "Overclocker": 2pc: +15% attack speed, 4pc: attacks chain to nearby enemies
  - "Data Miner": 2pc: +25% gold, 4pc: enemies drop bonus items
  - "Firewall": 2pc: +20% defense, 4pc: reflect 10% damage
- Needs: set detection logic
- Needs: set bonus display in equipment UI
- Needs: set_items table integration

#### Equipment Drops
- Drop chance: 5% from normal enemies, 25% from elites, 100% from bosses
- Rarity roll based on stage (higher stage = better odds)
- Boss drops guaranteed Rare+
- Needs: drop animation, loot popup
- Needs: auto-pickup or tap-to-pickup
- Needs: inventory full handling

#### Equipment Inventory
- Grid-based inventory (50 slots base)
- Sort by: rarity, level, slot type, recent
- Filter by: slot, rarity, set
- Needs: inventory expansion (premium)
- Needs: inventory count display
- Needs: "inventory full" warning

#### Compare/Equip UI
- Side-by-side comparison (equipped vs selected)
- Green/red stat diff indicators
- "Equip" and "Compare" buttons
- Needs: stat delta calculation
- Needs: set bonus preview if equipping

#### Salvage System
- Destroy equipment for materials
- Material type based on rarity
- Bulk salvage option (all below X rarity)
- Needs: salvage confirmation
- Needs: material inventory
- Needs: "lock" equipment to prevent accidental salvage

---

## Module 8: Prestige System (Soft Reset)
*Progress reset for permanent bonuses*

### Checklist
- [ ] Prestige currency formula
- [ ] Prestige requirements (stage minimum)
- [ ] Prestige bonuses (damage, gold, starting stage, unlocks)
- [ ] Prestige upgrades shop
- [ ] Prestige milestones
- [ ] Prestige statistics
- [ ] Confirmation UI

### Skeletal Specification

#### Prestige Currency Formula
```
quantumBits = floor(sqrt(highestStage / 10) * (1 + prestigeCount * 0.1))
```
- Stage 100 first prestige: ~3 bits
- Stage 500 fifth prestige: ~12 bits
- Needs: prestige preview showing bits earned
- Needs: "bits per stage" efficiency display

#### Prestige Requirements
- Minimum stage: 50 (first prestige)
- Subsequent: no minimum, but bits scale with stage
- Needs: prestige button disabled until stage 50
- Needs: "reach stage 50 to prestige" message

#### Prestige Bonuses (Automatic)
- +10% base damage per prestige (permanent)
- +5% gold per prestige (permanent)
- Unlock prestige skill tree branch at prestige 1
- Unlock artifact slot at prestige 3
- Needs: prestige bonus display in stats
- Needs: prestige unlock notifications

#### Prestige Upgrades Shop
- **Quantum Damage**: +25% damage per level (cost: 5 bits)
- **Quantum Gold**: +25% gold per level (cost: 3 bits)
- **Headstart**: Start at stage 5/10/15/20 (cost: 10/25/50/100 bits)
- **Keeper**: Keep 10/25/50% of gold on prestige (cost: 20/50/100 bits)
- **Time Dilation**: +10% offline earnings per level (cost: 5 bits)
- Needs: prestige shop UI
- Needs: upgrade purchase confirmation
- Needs: "not enough bits" feedback

#### Prestige Milestones
- 1 prestige: Unlock prestige skill tree
- 3 prestiges: Unlock artifact slot
- 5 prestiges: Unlock second artifact slot
- 10 prestiges: Unlock prestige-only equipment set
- 25 prestiges: Title "Overclocker"
- 50 prestiges: Title "Quantum Master"
- 100 prestiges: Title "Infinite Loop"
- Needs: milestone notification
- Needs: milestone rewards
- Needs: milestone progress display

#### Prestige Statistics
- Total prestiges
- Lifetime quantum bits earned
- Fastest prestige (time to stage X)
- Highest stage reached
- Total playtime across all prestiges
- Needs: statistics panel in prestige UI
- Needs: stat tracking in player_saves

#### Prestige Confirmation UI
- Show: bits to earn, bonuses to keep, what resets
- "Are you sure?" checkbox
- Animation on confirm
- What RESETS: stage, gold, upgrades, equipment (unless Keeper)
- What KEEPS: prestige upgrades, artifacts, achievements, statistics
- Needs: clear reset/keep lists
- Needs: cancel button
- Needs: prestige animation/cutscene

---

## Module 9: Artifact System
*Permanent prestige upgrades*

### Checklist
- [ ] Artifact slots (5-10)
- [ ] Artifact rarity
- [ ] Artifact effects
- [ ] Artifact leveling (prestige currency)
- [ ] Artifact discovery/unlock
- [ ] Artifact reroll
- [ ] Artifact set bonuses

### Skeletal Specification

#### Artifact Slots
- Slot 1: Unlocked at prestige 3
- Slot 2: Unlocked at prestige 5
- Slot 3: Unlocked at prestige 10
- Slot 4: Unlocked at prestige 25
- Slot 5: Unlocked at prestige 50
- Needs: slot unlock notifications
- Needs: locked slot preview

#### Artifact Rarity
- Same as equipment: Common to Mythic
- Higher rarity = stronger base effect + more levels
- Needs: rarity visual distinction
- Needs: rarity affects discovery cost

#### Artifact Effects
- **Damage Amplifier**: +X% all damage
- **Gold Magnet**: +X% gold find
- **Critical Core**: +X% crit damage
- **Swift Protocol**: +X% attack speed
- **Time Crystal**: +X% offline earnings
- **Stage Skipper**: Start +X stages after prestige
- **Bit Booster**: +X% quantum bits from prestige
- Needs: effect config per artifact
- Needs: effect stacking rules (additive)

#### Artifact Leveling
- Cost: quantum bits
- Each level: +10% to base effect
- Max level: 10 (Common) to 100 (Mythic)
- Cost scaling: level^1.5 * rarity_multiplier
- Needs: level up UI
- Needs: max level indicator
- Needs: level progress bar

#### Artifact Discovery
- Discover new artifacts using quantum bits
- Base cost: 10 bits, increases with artifacts owned
- Rarity roll: weighted random (Common 50%, Uncommon 30%, Rare 15%, Epic 4%, Legendary 0.9%, Mythic 0.1%)
- Duplicate protection: reduced chance for owned artifacts
- Needs: discovery animation
- Needs: "new artifact!" celebration
- Needs: artifact codex showing all possible

#### Artifact Reroll
- Change artifact's secondary stats
- Cost: 5 bits per reroll
- Keeps rarity and base effect
- Needs: reroll confirmation
- Needs: preview of possible stats

#### Artifact Set Bonuses
- 3 artifacts from same "set" = bonus
- Sets tied to themes:
  - "Quantum Set": 3pc = +50% quantum bit gain
  - "Chrono Set": 3pc = skills cooldown -25%
  - "Wealth Set": 3pc = +100% gold find
- Needs: set detection
- Needs: set bonus display

---

## Module 10: Companion System
*Helper units with abilities*

### Checklist
- [ ] Companion slots (3-5)
- [ ] Companion types
- [ ] Companion abilities (passive + active)
- [ ] Companion leveling
- [ ] Companion evolution
- [ ] Companion synergies
- [ ] Companion gacha/unlock
- [ ] Companion UI

### Skeletal Specification

#### Companion Slots
- Slot 1: Unlocked at stage 25
- Slot 2: Unlocked at stage 75
- Slot 3: Unlocked at stage 150
- Slot 4: Unlocked at prestige 5
- Slot 5: Unlocked at prestige 15
- Needs: slot unlock notifications
- Needs: "deploy" and "withdraw" actions

#### Companion Types
- **Attacker**: Deals damage to enemies
- **Support**: Buffs player stats
- **Collector**: Increases gold/drops
- **Tank**: Absorbs damage (for future PvP)
- **Specialist**: Unique abilities
- Needs: type icons, type filters

#### Companion Abilities
- **Passive**: Always active (e.g., +10% damage)
- **Active**: Cooldown ability (e.g., deal 1000% damage)
- Each companion has 1 passive + 1 active
- Needs: ability tooltips
- Needs: active ability button per companion

#### Companion Leveling
- XP from: enemy kills, daily activities, items
- Each level: +5% to all stats
- Max level: 50 (Common) to 100 (Mythic)
- Needs: XP bar display
- Needs: level up animation
- Needs: "feed" items to boost XP

#### Companion Evolution
- At max level, evolve to next rarity
- Evolution cost: materials + gold
- Evolution resets level to 1 but with higher base stats
- Visual change on evolution
- Needs: evolution confirmation
- Needs: evolution preview
- Needs: evolution materials

#### Companion Synergies
- Certain companions boost each other
- "Duo Bonus": 2 specific companions = +25% to both
- "Trio Bonus": 3 specific companions = unique effect
- Needs: synergy display in companion UI
- Needs: synergy guide/codex

#### Companion Gacha/Unlock
- Pull using premium currency (100 cores per pull)
- 10-pull: guaranteed Rare+
- Pity system: guaranteed Epic at 50 pulls, Legendary at 100
- Banner system: featured companions with rate-up
- Needs: gacha animation
- Needs: pity counter display
- Needs: banner schedule

#### Companion UI
- Grid view of owned companions
- Detail view: stats, abilities, synergies
- Deploy/swap buttons
- Level up button
- Needs: companion comparison
- Needs: "new" badge on recent pulls

---

## Module 11: Boss Rush Mode
*Time-limited boss challenges*

### Checklist
- [ ] Boss rush entry (cooldown/cost)
- [ ] Boss rush stages
- [ ] Boss rush timer
- [ ] Boss rush rewards
- [ ] Boss rush leaderboard
- [ ] Boss rush difficulty scaling
- [ ] Boss rush UI

### Skeletal Specification

#### Boss Rush Entry
- Entry cost: 1 Boss Rush Ticket OR 50 premium currency
- Tickets: earn 1/day free, buy more with currency
- Cooldown: none (limited by tickets)
- Needs: ticket display
- Needs: entry confirmation with cost
- Needs: "not enough tickets" alert with shop link

#### Boss Rush Stages
- 10 bosses in sequence
- Each boss = one of the 3 main bosses, scaled to difficulty
- No phases between bosses (boss after boss)
- Needs: boss queue display
- Needs: boss defeated counter

#### Boss Rush Timer
- Total time: 5 minutes
- Each boss has individual timer: 30 seconds
- Fail to kill in time = run ends
- Needs: main timer display
- Needs: boss timer display
- Needs: "time running out" warning at 10s

#### Boss Rush Rewards
- Rewards based on bosses defeated:
  - 1-3 bosses: 1000 gold
  - 4-6 bosses: 5000 gold + 10 cores
  - 7-9 bosses: 25000 gold + 25 cores + rare material
  - 10 bosses: 100000 gold + 50 cores + epic material + achievement
- Needs: reward preview before entry
- Needs: reward summary after run
- Needs: reward animation

#### Boss Rush Leaderboard
- Ranked by: bosses defeated, then time taken
- Reset: weekly
- Top 100 displayed
- Rewards for top 10/50/100
- Needs: leaderboard UI
- Needs: player rank display
- Needs: weekly reset notification

#### Boss Rush Difficulty Scaling
- Base difficulty: player's current stage
- Boss 1: stage * 0.5
- Boss 5: stage * 1.0
- Boss 10: stage * 2.0
- Needs: difficulty display per boss
- Needs: recommended stage display

#### Boss Rush UI
- Full-screen mode during rush
- Boss HP bar prominent
- Timer prominent
- Skip regular game UI
- Needs: exit button (forfeit run)
- Needs: pause NOT allowed (timed mode)

---

## Module 12: Daily Challenges
*Rotating objectives with rewards*

### Checklist
- [ ] Challenge types (kill X, reach stage Y, etc.)
- [ ] Daily reset system
- [ ] Challenge rewards
- [ ] Challenge streaks
- [ ] Challenge difficulty tiers
- [ ] Challenge progress tracking
- [ ] Challenge UI

### Skeletal Specification

#### Challenge Types
- **Kill Count**: Kill X enemies (100/500/1000)
- **Stage Progress**: Reach stage X
- **Boss Slayer**: Kill X bosses (3/5/10)
- **Gold Hoarder**: Earn X gold (10k/50k/100k)
- **Tap Master**: Tap X times (500/1000/5000)
- **Crit Hunter**: Deal X critical hits (50/100/500)
- **Speed Run**: Reach stage X in Y minutes
- **No Death**: Clear 10 stages without... (future combat)
- Needs: challenge type enum
- Needs: progress tracking per type

#### Daily Reset System
- Reset time: 00:00 UTC
- Generate 3 new challenges each day
- Uncompleted challenges are lost
- Needs: time until reset display
- Needs: reset notification
- Needs: timezone handling

#### Challenge Rewards
- **Easy**: 500 gold + 5 cores
- **Medium**: 2000 gold + 15 cores
- **Hard**: 10000 gold + 50 cores + rare material
- Bonus for completing all 3: additional 25 cores
- Needs: reward preview on challenge
- Needs: claim button after completion
- Needs: "all complete" bonus indicator

#### Challenge Streaks
- Track consecutive days with all 3 completed
- Streak bonuses:
  - 3 days: +10% all rewards
  - 7 days: +25% all rewards + 100 cores
  - 14 days: +50% all rewards + legendary item
  - 30 days: +100% all rewards + mythic item + title
- Streak resets on missed day
- Needs: streak counter display
- Needs: streak milestone notifications
- Needs: "streak at risk" warning

#### Challenge Difficulty Tiers
- Easy: Completable in ~10 minutes
- Medium: Completable in ~30 minutes
- Hard: Completable in ~1 hour or requires skill
- Difficulty based on player's highest stage
- Needs: difficulty indicator (star rating)
- Needs: scaling formulas

#### Challenge Progress Tracking
- Real-time progress update
- Progress bar per challenge
- Auto-complete when goal reached
- Needs: event listeners for each challenge type
- Needs: progress persistence (survives app close)

#### Challenge UI
- Daily challenges panel (3 cards)
- Each card: title, description, progress, reward
- Claim button when complete
- Streak display
- Reset timer
- Needs: notification badge when claimable

---

## Module 13: Tournament System
*Competitive events*

### Checklist
- [x] Tournament database tables
- [ ] Tournament types
- [ ] Tournament entry
- [ ] Tournament scoring
- [ ] Tournament brackets
- [ ] Tournament rewards
- [ ] Tournament history
- [ ] Live tournament updates
- [ ] Tournament UI

### Skeletal Specification

#### Tournament Types
- **Stage Rush**: Reach highest stage in time limit
- **Boss Blitz**: Kill most bosses in time limit
- **Gold Rush**: Earn most gold in time limit
- **Damage Derby**: Deal most total damage in time limit
- Needs: tournament type config
- Needs: type-specific scoring

#### Tournament Entry
- Entry fee: 50 premium currency OR free ticket
- Entry window: 24 hours before start
- Confirmation required
- Needs: entry confirmation dialog
- Needs: entry fee deduction
- Needs: "already entered" state
- **ALERT**: "Entering will reset your progress to stage 1 for fair competition. Continue?"

#### Tournament Scoring
- Score based on tournament type
- Stage Rush: highest stage = score
- Boss Blitz: bosses killed = score
- Tiebreaker: time taken
- Needs: real-time score updates
- Needs: score submission on tournament end

#### Tournament Brackets
- Bracket sizes: 50/100/500 players
- Matchmaking: based on highest stage (similar skill)
- Bracket fills, then tournament starts
- Needs: bracket display
- Needs: matchmaking queue UI
- Needs: "waiting for players" state

#### Tournament Rewards
- **1st place**: 500 cores + mythic equipment + title
- **2nd place**: 300 cores + legendary equipment
- **3rd place**: 200 cores + epic equipment
- **Top 10**: 100 cores + rare equipment
- **Top 50**: 50 cores + uncommon equipment
- **Participation**: 10 cores
- Needs: reward preview before entry
- Needs: reward distribution after end
- Needs: reward claim notification

#### Tournament History
- Store last 10 tournaments per player
- Show: rank, score, rewards, date
- Needs: history UI in tournament panel
- Needs: tournament_entries table updates

#### Live Tournament Updates
- Real-time leaderboard during tournament
- Position change notifications
- "You've been passed!" alert
- Time remaining display
- Needs: websocket or polling for updates
- Needs: efficient leaderboard queries

#### Tournament UI
- **Entry Screen**: Type, entry fee, rewards, rules
- **Queue Screen**: Waiting for bracket to fill
- **Active Screen**: Your score, leaderboard, timer
- **Results Screen**: Final standings, rewards
- Needs: tournament start notification
- Needs: tournament end notification
- **RESET ALERT**: "Tournament starting! Your stage will reset to 1."
- **END ALERT**: "Tournament ended! Your original progress has been restored."

---

## Module 14: Clan System
*Social guilds*

### Checklist
- [x] Clan database tables
- [ ] Clan creation
- [ ] Clan joining/leaving
- [ ] Clan roles (leader, officer, member)
- [ ] Clan chat
- [ ] Clan perks
- [ ] Clan boss (shared damage)
- [ ] Clan leaderboard
- [ ] Clan UI

### Skeletal Specification

#### Clan Creation
- Cost: 500 premium currency
- Requirements: not in a clan, stage 25+
- Input: clan name (3-20 chars), clan tag (3-5 chars), clan description
- Validation: name not taken, no profanity
- Creator becomes leader
- Needs: creation form UI
- Needs: name availability check
- Needs: creation confirmation
- **ALERT**: "Creating a clan costs 500 Overclock Cores. Continue?"

#### Clan Joining/Leaving
- **Join**:
  - Browse clan list or search by name/tag
  - Apply to clan (pending approval) OR join open clan
  - Needs: clan search UI
  - Needs: application message
  - Needs: "application sent" confirmation
- **Leave**:
  - Confirm leave
  - 24-hour cooldown before joining another
  - Leader cannot leave (must transfer or disband)
  - Needs: leave confirmation
  - **ALERT**: "Leaving the clan has a 24-hour cooldown before you can join another. Continue?"
- **Kick**:
  - Officers+ can kick members
  - Kicked players have 48-hour cooldown for that clan
  - Needs: kick confirmation
  - Needs: kick notification to kicked player

#### Clan Roles
- **Leader** (1): Full control, transfer leadership, disband clan
- **Officer** (up to 5): Approve applications, kick members, start clan boss
- **Member**: Participate in clan activities
- Needs: role management UI for leader
- Needs: role badges in member list

#### Clan Chat
- Text chat for clan members
- Message history: last 100 messages
- System messages: joins, leaves, boss started, etc.
- Needs: chat UI panel
- Needs: chat input
- Needs: message timestamps
- Needs: profanity filter

#### Clan Perks
- **Level 1**: +5% gold for all members
- **Level 2**: +5% damage for all members
- **Level 3**: +1 daily challenge
- **Level 4**: +10% offline earnings
- **Level 5**: Clan shop unlocked
- Clan XP from: member activity, clan boss, tournaments
- Needs: clan level display
- Needs: perk list UI
- Needs: clan XP progress bar

#### Clan Boss
- See Module 15 for full specification
- Needs: clan boss entry from clan UI

#### Clan Leaderboard
- Ranked by: clan level, then total member stages
- Weekly and all-time leaderboards
- Top clans get rewards (distributed to members)
- Needs: leaderboard UI
- Needs: clan rank display

#### Clan UI
- **Clan Home**: Name, level, perks, member count, message board
- **Members Tab**: List with roles, last active, contribution
- **Applications Tab**: Pending applications (officers+)
- **Clan Boss Tab**: Current boss, history
- **Settings Tab**: Edit description, manage roles (leader)
- Needs: tab navigation
- Needs: notification badges

---

## Module 15: Clan Boss
*Cooperative boss fights*

### Checklist
- [ ] Clan boss HP (based on clan level)
- [ ] Damage contribution tracking
- [ ] Clan boss phases
- [ ] Clan boss rewards (individual + clan)
- [ ] Clan boss cooldown
- [ ] Clan boss history
- [ ] Clan boss UI

### Skeletal Specification

#### Clan Boss HP
- Formula: `baseHp * (clanLevel ^ 1.5) * memberCount`
- Example: Level 5 clan, 20 members = massive HP pool
- Scaled to require cooperation
- Needs: HP calculation on boss start
- Needs: HP display with clan context

#### Damage Contribution Tracking
- Track each member's damage dealt
- Real-time leaderboard during fight
- Contribution percentage for rewards
- Needs: contribution table in database
- Needs: contribution display in UI
- Needs: contribution history

#### Clan Boss Phases
- **Phase 1** (100-66%): Normal
- **Phase 2** (66-33%): Enraged, deals debuffs to attackers
- **Phase 3** (33-0%): Berserk, must kill within time or resets to 50%
- Needs: phase transition announcements
- Needs: phase-specific visuals
- **ALERT at Phase 3**: "Clan Boss is BERSERK! Kill within 5 minutes or it heals!"

#### Clan Boss Rewards
- **Individual**: Based on contribution %
  - Top contributor: 100 cores + rare material
  - Top 3: 50 cores + uncommon material
  - Participated: 10 cores + gold
- **Clan**: XP for clan leveling
- Needs: reward calculation
- Needs: reward distribution
- Needs: reward notification

#### Clan Boss Cooldown
- 48-hour cooldown after defeat
- Boss available immediately on clan creation (first boss free)
- Officer+ can start boss when off cooldown
- Needs: cooldown timer display
- Needs: "start boss" button (officers+)
- **ALERT**: "Starting clan boss! All members have 24 hours to deal damage."

#### Clan Boss History
- Last 10 clan boss fights
- Show: damage dealt, rank, rewards, date
- Needs: history UI
- Needs: personal best tracking

#### Clan Boss UI
- **Pre-fight**: Boss preview, HP, start button (if officer)
- **During fight**: Boss HP, your damage, leaderboard, timer
- **Post-fight**: Results, contributions, rewards
- Needs: fight entry from clan UI
- Needs: notification when boss started
- Needs: notification when boss phase changes

---

## Module 16: PvP Arena
*Player vs player combat*

### Checklist
- [ ] Arena matchmaking
- [ ] Arena combat simulation
- [ ] Arena rewards
- [ ] Arena ranks/tiers
- [ ] Arena seasons
- [ ] Arena defense setup
- [ ] Arena attack attempts
- [ ] Arena UI

### Skeletal Specification

#### Arena Matchmaking
- Match based on Arena Points (Elo-like system)
- Show 3 opponents near your point range
- Refresh opponents every 10 minutes OR spend 10 cores
- Needs: opponent selection UI
- Needs: opponent power preview
- Needs: "refresh" button

#### Arena Combat Simulation
- Auto-battle based on stats
- Factors: damage, HP, crit, skills, equipment
- Fight duration: 30 seconds simulated
- Winner: higher % HP remaining OR more damage dealt
- Needs: combat simulation engine
- Needs: fight replay/log (optional)
- Needs: "skip" option to see result instantly

#### Arena Rewards
- **Win**: +15-30 Arena Points, gold, small core reward
- **Lose**: -10-20 Arena Points, consolation gold
- Daily rewards based on rank
- Needs: reward display after fight
- Needs: daily reward claim

#### Arena Ranks/Tiers
- **Bronze**: 0-999 points
- **Silver**: 1000-2499 points
- **Gold**: 2500-4999 points
- **Platinum**: 5000-9999 points
- **Diamond**: 10000-19999 points
- **Champion**: 20000+ points
- Needs: rank badges
- Needs: rank up/down notifications
- **ALERT on rank up**: "You've reached Silver rank! New daily rewards unlocked!"

#### Arena Seasons
- Season length: 4 weeks
- Season end: rewards based on highest rank achieved
- Soft reset: points reduced by 25% at season start
- Needs: season timer
- Needs: season rewards preview
- Needs: season history

#### Arena Defense Setup
- Set your "defense team" (passive)
- Defense = your current build snapshot
- Update manually or auto-update daily
- Needs: defense setup UI
- Needs: "defense log" showing who attacked you

#### Arena Attack Attempts
- 5 free attempts per day
- Refresh at daily reset
- Buy more attempts: 20 cores each
- Needs: attempt counter
- Needs: "no attempts left" alert
- Needs: purchase more attempts button

#### Arena UI
- **Main**: Your rank, points, attempts, opponent list
- **Opponent Card**: Name, rank, power, rewards preview
- **Fight Screen**: Combat animation, result
- **Defense Tab**: Your defense setup, attack log
- **Leaderboard Tab**: Top 100 players
- **Rewards Tab**: Current and upcoming rewards

---

## Module 17: Shop System
*In-game purchases*

### Checklist
- [x] Purchase tracking (shop_purchases)
- [ ] Shop categories
- [ ] Item pricing
- [ ] Bundle deals
- [ ] Limited time offers
- [ ] Daily deals rotation
- [ ] Purchase confirmation
- [ ] Shop UI

### Skeletal Specification

#### Shop Categories
- **Currency**: Buy premium currency (IAP)
- **Resources**: Buy materials, items
- **Equipment**: Buy equipment crates
- **Companions**: Companion gacha
- **Cosmetics**: Skins, titles, effects
- **Special**: Limited time, bundles
- Needs: category tabs
- Needs: category icons

#### Item Pricing
- Currency packs (IAP):
  - 100 cores: $0.99
  - 550 cores: $4.99 (10% bonus)
  - 1200 cores: $9.99 (20% bonus)
  - 2600 cores: $19.99 (30% bonus)
  - 7000 cores: $49.99 (40% bonus)
- Resources (cores):
  - Gold pack: 50 cores
  - Material pack: 100 cores
  - Equipment crate: 200 cores
- Needs: price display
- Needs: "best value" badges

#### Bundle Deals
- Starter Pack: $4.99 - 500 cores + equipment + materials (one-time)
- Weekly Pack: $1.99 - 100 cores + daily rewards for 7 days
- Monthly Pass: $9.99 - 300 cores + daily login bonus for 30 days
- Needs: bundle display with contents
- Needs: one-time purchase tracking
- Needs: subscription management

#### Limited Time Offers
- Flash sales: 50% off for 2 hours
- Event bundles: during events only
- New player offers: first 3 days only
- Needs: countdown timer
- Needs: expiration handling
- **ALERT**: "This offer expires in 1 hour!"

#### Daily Deals Rotation
- 3 deals refresh daily at reset
- Discounted items (20-50% off)
- One free item per day
- Needs: daily rotation logic
- Needs: deal refresh timer
- Needs: free item highlight

#### Purchase Confirmation
- Show item, price, current balance
- Confirm button
- For IAP: system purchase flow
- Needs: confirmation dialog
- Needs: insufficient funds handling
- **ALERT for IAP**: "You are about to purchase X for $Y. This is a real money transaction."
- **ALERT for in-game**: "Purchase X for 100 Overclock Cores?"

#### Shop UI
- Category navigation
- Item grid/list view
- Item detail on tap
- Purchase button
- Balance display
- Needs: search/filter
- Needs: "owned" indicator for one-time items

---

## Module 18: Gacha System
*Random item acquisition*

### Checklist
- [ ] Gacha banners
- [ ] Pull rates (pity system)
- [ ] Gacha currency costs
- [ ] Guaranteed rates
- [ ] Banner rotation
- [ ] Pull history
- [ ] Gacha UI (animations)

### Skeletal Specification

#### Gacha Banners
- **Standard Banner**: All items, no rate-up
- **Featured Banner**: Rate-up on specific items
- **Limited Banner**: Time-limited exclusive items
- Each banner type: Equipment, Companions, Artifacts
- Needs: banner display with featured items
- Needs: banner schedule/calendar

#### Pull Rates (Pity System)
- Base rates:
  - Common: 50%
  - Uncommon: 30%
  - Rare: 15%
  - Epic: 4%
  - Legendary: 0.9%
  - Mythic: 0.1%
- Pity system:
  - Epic guaranteed at 50 pulls
  - Legendary guaranteed at 100 pulls
  - Pity resets on pull of that rarity or higher
- Needs: pity counter per banner
- Needs: pity display in UI

#### Gacha Currency Costs
- Single pull: 100 cores
- 10-pull: 900 cores (10% discount)
- Companion banner: companion tickets or cores
- Equipment banner: equipment tickets or cores
- Needs: cost display
- Needs: bulk pull option

#### Guaranteed Rates
- 10-pull: guaranteed Rare or higher
- First pull on new banner: guaranteed Epic or higher (one-time)
- Needs: guarantee indicator on pull button
- Needs: guarantee tracking

#### Banner Rotation
- Featured banners: 2 weeks each
- Limited banners: during events (1 week)
- Standard banner: always available
- Needs: banner schedule display
- Needs: banner end notification
- **ALERT**: "This banner ends in 24 hours!"

#### Pull History
- Last 100 pulls logged
- Filter by banner, rarity
- Needs: history UI
- Needs: export/share option

#### Gacha UI (Animations)
- Single pull: card flip animation
- 10-pull: sequential reveal or skip
- Rarity-based effects (mythic = extra flashy)
- Needs: skip button
- Needs: result summary
- Needs: "share pull" feature

---

## Module 19: Cloud Save System
*Save/load game state*

### Checklist
- [x] player_saves table
- [ ] Auto-save (interval)
- [ ] Manual save
- [ ] Save slots (3-5)
- [ ] Load game
- [ ] Save conflict resolution
- [ ] Save data validation
- [ ] Save/Load UI

### Skeletal Specification

#### Auto-save (Interval)
- Auto-save every 60 seconds during gameplay
- Auto-save on: stage clear, boss kill, purchase, prestige
- Background save (non-blocking)
- Needs: save indicator (brief icon flash)
- Needs: save timestamp tracking
- Needs: debounce to prevent spam

#### Manual Save
- "Save Now" button in settings
- Confirmation of save success
- Needs: save button
- Needs: success/failure feedback
- **ALERT on success**: "Game saved!"
- **ALERT on failure**: "Save failed. Check your connection."

#### Save Slots (3-5)
- 3 slots free
- 2 additional slots: 100 cores each
- Each slot: independent save
- Slot info: stage, playtime, last saved
- Needs: slot selection UI
- Needs: slot purchase flow
- Needs: slot naming

#### Load Game
- Select slot to load
- Confirmation before loading (overwrites current)
- Download save from database
- Apply save to game state
- Needs: load confirmation
- Needs: loading indicator
- **ALERT**: "Loading this save will overwrite your current progress. Continue?"

#### Save Conflict Resolution
- Detect: server save newer than local
- Options: Keep local, keep server, keep newer
- Show comparison: stage, gold, playtime
- Needs: conflict detection on app open
- Needs: conflict resolution UI
- **ALERT**: "Save conflict detected! Your local save (Stage 50) differs from cloud save (Stage 45). Which do you want to keep?"

#### Save Data Validation
- Validate save data on load
- Check for: corruption, impossible values, cheating
- Invalid save: reject load, notify player
- Needs: validation rules
- Needs: error handling
- **ALERT on invalid**: "This save file appears to be corrupted or modified. Load anyway? (Progress may be unstable)"

#### Save/Load UI
- **Save Tab**: Slot list, save buttons, auto-save toggle
- **Load Tab**: Slot list with previews, load buttons
- **Settings**: Auto-save interval, conflict resolution preference
- Needs: clear UI for each slot
- Needs: timestamp display (relative: "2 hours ago")

---

## Module 20: Offline Progress
*Earnings while away*

### Checklist
- [ ] Offline time calculation
- [ ] Offline gold formula
- [ ] Offline stage progress (optional)
- [ ] Offline rewards cap
- [ ] Offline boost (ad/premium)
- [ ] Welcome back UI

### Skeletal Specification

#### Offline Time Calculation
- Track: last_played_at timestamp
- On app open: calculate seconds since last play
- Cap: 8 hours (28800 seconds) unless premium
- Premium cap: 24 hours
- Needs: timestamp tracking in player_saves
- Needs: timezone-safe calculation

#### Offline Gold Formula
```
offlineGold = (autoDPS / enemyHp) * goldPerKill * offlineSeconds * offlineMultiplier
```
- offlineMultiplier: 0.1 base (10% of active play)
- Can upgrade to 0.5 max through prestige
- Premium: 1.0 multiplier
- Needs: gold calculation on app open
- Needs: preview in settings

#### Offline Stage Progress (Optional)
- Disabled by default
- Premium feature: auto-progress stages while offline
- Max stages offline: 10 per hour
- Needs: stage progress tracking
- Needs: toggle in settings (premium only)

#### Offline Rewards Cap
- Free: 8 hours
- Premium: 24 hours
- Show capped time in UI
- Needs: cap display
- Needs: premium upsell

#### Offline Boost (Ad/Premium)
- Watch ad: 2x offline rewards
- Premium: 2x automatic, 4x with ad
- Needs: ad integration
- Needs: boost button in welcome back UI
- **ALERT**: "Watch a short video to double your offline earnings?"

#### Welcome Back UI
- Popup on app open (if offline > 1 minute)
- Show: time away, gold earned, stages progressed
- Buttons: "Claim" and "Watch Ad for 2x"
- Needs: welcome back modal
- Needs: reward animation
- Needs: dismiss button

---

## Module 21: Push Notifications
*Engagement reminders*

### Checklist
- [ ] Notification types (energy, boss, tournament, daily)
- [ ] Notification permissions
- [ ] Notification settings
- [ ] Notification scheduling

### Skeletal Specification

#### Notification Types
- **Energy Full**: "Your energy is full! Time to continue your run."
- **Boss Available**: "A powerful boss has appeared! Can you defeat it?"
- **Tournament Starting**: "Tournament starts in 30 minutes! Don't miss out."
- **Daily Reset**: "Daily challenges have reset! New rewards await."
- **Clan Boss**: "Your clan has started a boss fight! Join the battle."
- **Offline Rewards Ready**: "You have offline rewards waiting!"
- Needs: notification templates
- Needs: notification triggers

#### Notification Permissions
- Request permission on first relevant action
- Handle: granted, denied, not determined
- Needs: permission request flow
- Needs: denied state handling
- **ALERT on first request**: "Allow notifications to get reminders about rewards and events?"

#### Notification Settings
- Toggle each notification type on/off
- Quiet hours: no notifications between X and Y
- Needs: settings UI
- Needs: settings persistence
- Needs: master toggle (all on/off)

#### Notification Scheduling
- Local notifications for predictable events
- Push notifications from server for dynamic events
- Schedule ahead: daily reset, energy full
- Needs: local notification library
- Needs: server push integration
- Needs: notification cancellation on app open

---

## Module 22: Settings & Options
*User preferences*

### Checklist
- [ ] Audio settings (SFX, Music, Volume)
- [ ] Graphics settings (particles, quality)
- [ ] Notification settings
- [ ] Language selection
- [ ] Number format (K/M/B vs scientific)
- [ ] Auto-skill toggle
- [ ] Confirm dialogs toggle
- [ ] Settings persistence
- [ ] Settings UI

### Skeletal Specification

#### Audio Settings
- **Master Volume**: 0-100%
- **Music Volume**: 0-100%
- **SFX Volume**: 0-100%
- **Mute All**: Toggle
- Needs: volume sliders
- Needs: audio manager integration
- Needs: preview sound on change

#### Graphics Settings
- **Particles**: Off / Low / Medium / High
- **Screen Shake**: On / Off
- **Damage Numbers**: On / Off
- **Quality**: Low / Medium / High / Auto
- Needs: quality presets
- Needs: performance detection for "Auto"

#### Notification Settings
- See Module 21
- Link to system settings if needed
- Needs: deep link to OS notification settings

#### Language Selection
- Languages: English, Spanish, Portuguese, Japanese, Korean, Chinese
- Needs: language files (i18n)
- Needs: language selector dropdown
- Needs: restart prompt on change
- **ALERT**: "Changing language requires restarting the app. Continue?"

#### Number Format
- **Standard**: 1,234,567
- **Abbreviated**: 1.23M
- **Scientific**: 1.23e6
- Needs: number formatter utility
- Needs: format toggle

#### Auto-skill Toggle
- Auto-cast skills when off cooldown
- Toggle per skill in skill UI
- Master toggle in settings
- Needs: auto-skill logic
- Needs: toggle persistence

#### Confirm Dialogs Toggle
- Skip confirmations for: purchases, prestige, etc.
- Dangerous: warn about disabling
- Needs: confirmation bypass flag
- **ALERT on disable**: "Disabling confirmations may lead to accidental purchases. Are you sure?"

#### Settings Persistence
- Save to: player_saves.settings (cloud) + localStorage (local)
- Load: cloud first, fallback to local
- Needs: settings sync
- Needs: offline settings access

#### Settings UI
- Categorized sections
- Clear labels and descriptions
- Reset to defaults button
- Needs: scrollable settings panel
- Needs: section headers
- **ALERT on reset**: "Reset all settings to defaults?"

---

## Module 23: Tutorial System
*New player guidance*

### Checklist
- [ ] Tutorial triggers
- [ ] Tutorial steps/sequences
- [ ] Tutorial rewards
- [ ] Skip tutorial option
- [ ] Tutorial progress tracking
- [ ] Highlight system
- [ ] Tutorial UI (arrows, modals)

### Skeletal Specification

#### Tutorial Triggers
- **First launch**: Start main tutorial
- **First boss**: Boss tutorial
- **First prestige available**: Prestige tutorial
- **First clan join**: Clan tutorial
- **First skill unlock**: Skills tutorial
- Needs: trigger conditions
- Needs: trigger once only

#### Tutorial Steps/Sequences
- **Main Tutorial** (5 steps):
  1. "Tap the enemy to deal damage!"
  2. "Kill enemies to earn gold."
  3. "Use gold to buy upgrades."
  4. "Reach phase 10 to fight the boss!"
  5. "Defeat the boss to advance to the next stage!"
- Needs: step definitions
- Needs: step completion detection
- Needs: step progression logic

#### Tutorial Rewards
- Complete main tutorial: 100 gold + 10 cores
- Complete boss tutorial: 50 cores
- Complete prestige tutorial: 100 cores
- Needs: reward on tutorial complete
- Needs: reward animation

#### Skip Tutorial Option
- "Skip" button on tutorial modals
- Confirm skip
- Mark all steps as complete
- No rewards if skipped
- Needs: skip button
- Needs: skip confirmation
- **ALERT**: "Skip tutorial? You won't receive the tutorial rewards."

#### Tutorial Progress Tracking
- Track completed tutorials in player_saves
- Prevent replay of completed tutorials
- "Replay tutorials" option in settings
- Needs: tutorial completion flags
- Needs: replay logic

#### Highlight System
- Highlight UI elements during tutorial
- Dim/disable other elements
- Pulse animation on highlighted element
- Needs: highlight overlay component
- Needs: element targeting

#### Tutorial UI
- Modal with text and optional image
- Highlight arrow pointing to relevant UI
- "Next" and "Skip" buttons
- Progress indicator (step 2/5)
- Needs: tutorial modal component
- Needs: arrow/pointer component

---

## Module 24: Achievements & Collections
*Long-term goals*

### Checklist
- [x] Achievement database tables
- [ ] Achievement categories
- [ ] Achievement progress tracking
- [ ] Achievement rewards
- [ ] Achievement UI
- [ ] Collection items
- [ ] Collection bonuses
- [ ] Collection UI

### Skeletal Specification

#### Achievement Categories
- **Combat**: Kill X enemies, deal X damage, X crits
- **Progression**: Reach stage X, prestige X times
- **Collection**: Own X equipment, X companions
- **Social**: Join clan, participate in tournament
- **Miscellaneous**: Play X hours, tap X times
- Needs: category enum
- Needs: category icons

#### Achievement Progress Tracking
- Real-time progress update
- Track: counts, max values, flags
- Persist in player_saves.achievements
- Needs: achievement event listeners
- Needs: progress calculation

#### Achievement Rewards
- **Bronze tier**: 10 cores
- **Silver tier**: 25 cores
- **Gold tier**: 50 cores + title
- **Platinum tier**: 100 cores + title + cosmetic
- Needs: reward tiers per achievement
- Needs: reward claim flow
- **ALERT on unlock**: "Achievement Unlocked: [Name]! Claim your rewards."

#### Achievement UI
- Grid/list view of achievements
- Filter by: category, completed, in-progress
- Progress bar per achievement
- Claim button when complete
- Needs: achievement card component
- Needs: achievement detail modal

#### Collection Items
- Discovered enemies (bestiary)
- Acquired equipment (armory)
- Unlocked companions (companion log)
- Found artifacts (artifact log)
- Needs: collection categories
- Needs: collection progress

#### Collection Bonuses
- **Bestiary 25%**: +5% damage to all enemies
- **Bestiary 50%**: +10% gold from enemies
- **Bestiary 100%**: +25% damage, title "Monster Hunter"
- **Armory 50%**: +10% equipment stats
- **Armory 100%**: Unlock mythic equipment set
- Needs: collection bonus calculation
- Needs: bonus display

#### Collection UI
- Category tabs
- Item grid (discovered vs undiscovered)
- Item detail on tap
- Collection progress bar
- Bonus preview
- Needs: silhouette for undiscovered items
- Needs: "recently discovered" badge

---

## Additional Systems (Future)

- [ ] Seasonal events
- [ ] Battle pass
- [ ] Cosmetics system
- [ ] Leaderboards (multiple types)
- [ ] Friend system
- [ ] Gift system
- [ ] News/announcements
- [ ] Analytics integration
- [ ] Anti-cheat measures

---

## Development Rules

1. **Only build what is requested** - Do not pre-build modules
2. **No placeholders** - Every feature must be functional
3. **Data-driven** - All values in config files
4. **Modular architecture** - Clean separation of concerns
5. **Type-safe** - Full TypeScript coverage
6. **Scalable** - Design for growth
7. **Testable** - Easy to debug and validate

---

## Output Format (Per Module)

When building a module, provide:

1. **Design Overview** - What the module does
2. **Architecture** - Files and structure
3. **Types** - TypeScript interfaces
4. **Store Design** - State management
5. **DB Design** - Database schema (if needed)
6. **UI Structure** - Components needed
7. **Balancing Logic** - Formulas and values
8. **Future Compatibility** - How it connects to other modules

---

*Last updated: Comprehensive skeletal specifications added for all modules*
