# OVERCLOCK RPG - Modular Development Plan

> Master checklist for building OVERCLOCK RPG. Each module must be explicitly requested before development.

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

---

## Module 2: Enemy System
*Enemy generation, types, and behaviors*

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

---

## Module 3: Currency System
*All currency types and earning mechanics*

- [x] Credits (gold) - primary currency
- [x] Gold per kill (HP * multiplier)
- [x] Data Packets (ad rewards)
- [x] Encrypted Cache (premium ad rewards)
- [ ] Premium currency (Overclock Cores)
- [ ] Prestige currency (Quantum Bits)
- [ ] Event currency
- [ ] Currency conversion rates
- [ ] Offline earnings calculation

---

## Module 4: Upgrade System
*Permanent stat improvements*

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

---

## Module 5: Skill Tree Framework
*Branching passive abilities*

- [ ] Skill tree data structure
- [ ] Node types (passive, active, keystone)
- [ ] Node connections/dependencies
- [ ] Skill point system
- [ ] Skill point gain (per X stages)
- [ ] Tree branches:
  - [ ] Offense branch
  - [ ] Defense branch
  - [ ] Utility branch
  - [ ] Prestige branch
- [ ] Respec system
- [ ] Skill tree UI

---

## Module 6: Active Skills
*Cooldown-based abilities*

- [ ] Skill slot system (4-6 slots)
- [ ] Skill cooldown management
- [ ] Skill unlock conditions
- [ ] Skill leveling
- [ ] Base skills:
  - [ ] Power Surge (damage burst)
  - [ ] Gold Rush (gold multiplier)
  - [ ] Time Warp (speed boost)
  - [ ] Critical Storm (guaranteed crits)
  - [ ] Shield Protocol (damage reduction)
- [ ] Skill effects system
- [ ] Skill UI (hotbar)

---

## Module 7: Equipment System
*Gear slots and stats*

- [ ] Equipment slots (6-8 slots)
- [ ] Rarity system (Common → Mythic)
- [ ] Equipment stats (primary + secondary)
- [ ] Equipment level/enhancement
- [ ] Set bonuses
- [ ] Equipment drops from enemies
- [ ] Equipment inventory
- [ ] Compare/equip UI
- [ ] Salvage system

---

## Module 8: Prestige System (Soft Reset)
*Progress reset for permanent bonuses*

- [ ] Prestige currency formula
- [ ] Prestige requirements (stage minimum)
- [ ] Prestige bonuses:
  - [ ] Damage multiplier
  - [ ] Gold multiplier
  - [ ] Starting stage
  - [ ] Unlock new features
- [ ] Prestige upgrades shop
- [ ] Prestige milestones
- [ ] Prestige statistics
- [ ] Confirmation UI

---

## Module 9: Artifact System
*Permanent prestige upgrades*

- [ ] Artifact slots (5-10)
- [ ] Artifact rarity
- [ ] Artifact effects
- [ ] Artifact leveling (prestige currency)
- [ ] Artifact discovery/unlock
- [ ] Artifact reroll
- [ ] Artifact set bonuses

---

## Module 10: Companion System
*Helper units with abilities*

- [ ] Companion slots (3-5)
- [ ] Companion types
- [ ] Companion abilities (passive + active)
- [ ] Companion leveling
- [ ] Companion evolution
- [ ] Companion synergies
- [ ] Companion gacha/unlock
- [ ] Companion UI

---

## Module 11: Boss Rush Mode
*Time-limited boss challenges*

- [ ] Boss rush entry (cooldown/cost)
- [ ] Boss rush stages
- [ ] Boss rush timer
- [ ] Boss rush rewards
- [ ] Boss rush leaderboard
- [ ] Boss rush difficulty scaling
- [ ] Boss rush UI

---

## Module 12: Daily Challenges
*Rotating objectives with rewards*

- [ ] Challenge types (kill X, reach stage Y, etc.)
- [ ] Daily reset system
- [ ] Challenge rewards
- [ ] Challenge streaks
- [ ] Challenge difficulty tiers
- [ ] Challenge progress tracking
- [ ] Challenge UI

---

## Module 13: Tournament System
*Competitive events*

- [x] Tournament database tables
- [ ] Tournament brackets
- [ ] Tournament entry
- [ ] Tournament scoring
- [ ] Tournament rewards
- [ ] Tournament history
- [ ] Live tournament updates
- [ ] Tournament UI

---

## Module 14: Clan System
*Social guilds*

- [x] Clan database tables
- [ ] Clan creation
- [ ] Clan joining/leaving
- [ ] Clan roles (leader, officer, member)
- [ ] Clan chat
- [ ] Clan perks
- [ ] Clan boss (shared damage)
- [ ] Clan leaderboard
- [ ] Clan UI

---

## Module 15: Clan Boss
*Cooperative boss fights*

- [ ] Clan boss HP (based on clan level)
- [ ] Damage contribution tracking
- [ ] Clan boss phases
- [ ] Clan boss rewards (individual + clan)
- [ ] Clan boss cooldown
- [ ] Clan boss history
- [ ] Clan boss UI

---

## Module 16: PvP Arena
*Player vs player combat*

- [ ] Arena matchmaking
- [ ] Arena combat simulation
- [ ] Arena rewards
- [ ] Arena ranks/tiers
- [ ] Arena seasons
- [ ] Arena defense setup
- [ ] Arena attack attempts
- [ ] Arena UI

---

## Module 17: Shop System
*In-game purchases*

- [x] Purchase tracking (shop_purchases)
- [ ] Shop categories
- [ ] Item pricing
- [ ] Bundle deals
- [ ] Limited time offers
- [ ] Daily deals rotation
- [ ] Purchase confirmation
- [ ] Shop UI

---

## Module 18: Gacha System
*Random item acquisition*

- [ ] Gacha banners
- [ ] Pull rates (pity system)
- [ ] Gacha currency costs
- [ ] Guaranteed rates
- [ ] Banner rotation
- [ ] Pull history
- [ ] Gacha UI (animations)

---

## Module 19: Cloud Save System
*Save/load game state*

- [x] player_saves table
- [ ] Auto-save (interval)
- [ ] Manual save
- [ ] Save slots (3-5)
- [ ] Load game
- [ ] Save conflict resolution
- [ ] Save data validation
- [ ] Save/Load UI

---

## Module 20: Offline Progress
*Earnings while away*

- [ ] Offline time calculation
- [ ] Offline gold formula
- [ ] Offline stage progress (optional)
- [ ] Offline rewards cap
- [ ] Offline boost (ad/premium)
- [ ] Welcome back UI

---

## Module 21: Push Notifications
*Engagement reminders*

- [ ] Notification types:
  - [ ] Full energy
  - [ ] Boss available
  - [ ] Tournament starting
  - [ ] Daily reset
- [ ] Notification permissions
- [ ] Notification settings
- [ ] Notification scheduling

---

## Module 22: Settings & Options
*User preferences*

- [ ] Audio settings (SFX, Music, Volume)
- [ ] Graphics settings (particles, quality)
- [ ] Notification settings
- [ ] Language selection
- [ ] Number format (K/M/B vs scientific)
- [ ] Auto-skill toggle
- [ ] Confirm dialogs toggle
- [ ] Settings persistence
- [ ] Settings UI

---

## Module 23: Tutorial System
*New player guidance*

- [ ] Tutorial triggers
- [ ] Tutorial steps/sequences
- [ ] Tutorial rewards
- [ ] Skip tutorial option
- [ ] Tutorial progress tracking
- [ ] Highlight system
- [ ] Tutorial UI (arrows, modals)

---

## Module 24: Achievements & Collections
*Long-term goals*

- [x] Achievement database tables
- [ ] Achievement categories
- [ ] Achievement progress tracking
- [ ] Achievement rewards
- [ ] Achievement UI
- [ ] Collection items
- [ ] Collection bonuses
- [ ] Collection UI

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

*Last updated: Stage 1-150 content complete, player_saves table created*
