# OVERCLOCK-RPG: Continuation Guide

Last updated: June 2026

This document summarizes the **current state** of the project, **what's working**, **what's missing**, and **next steps** for easy continuation.

---

## PROJECT STATUS OVERVIEW

| Area | Status | Notes |
|------|--------|-------|
| Core Gameplay | **DONE** | Tap, idle DPS, enemies, stages, zones |
| Plugin System | **DONE** | 26 plugins fully functional |
| Auth System | **DONE** | Username + email login via Supabase |
| Tournaments | **DONE** | Weekly schedule, leaderboards |
| Items/Inventory | **DONE** | Loot, rarity, sets, enchanting |
| Motherboard | **DONE** | Equipment slots, upgrades |
| Skills | **DONE** | 10 active skills with upgrades |
| Overclock (Prestige) | **DONE** | OCT currency, perks |
| Shop | **DONE** | OCT and diamond purchases |
| Dailies | **DONE** | Daily challenges, rewards |
| Achievements | **DONE** | Tracking and rewards |
| Clans | **DONE** | Create, join, chat |
| Leaderboards | **DONE** | Global rankings |
| Audio | **DONE** | BGM + SFX system ready |
| Mobile Layout | **DONE** | Responsive design |
| Capacitor (APK) | **READY** | Config exists, needs build |
| Payments | **NOT STARTED** | See Phase 2 below |
| Monster Sprites | **NOT STARTED** | 60 sprites needed |
| Audio Assets | **NOT STARTED** | BGM + SFX files needed |

---

## ARCHITECTURE SUMMARY

```
src/
├── engine/Engine.ts       # Game loop, plugin manager, events
├── plugins/               # 26 game logic modules
├── components/game/       # 15+ UI screens
├── config/game.config.ts  # ALL balance values (1100+ lines)
├── lib/db/                # Supabase client & auth
├── systems/AudioManager   # Music & SFX
└── App.tsx                # Plugin registration
```

### Plugin List (26 total)
```
AchievementPlugin   AuthPlugin        ClanPlugin
ComponentPlugin     DailyPlugin       DataPacketPlugin
EnemyPlugin         GoldPlugin        HeroPlugin
ItemPlugin          LeaderboardPlugin MoboPlugin
OverclockPlugin     SavePlugin        SetPlugin
SettingsPlugin      ShopPlugin        SkillPlugin
SkillPointPlugin    StagePlugin       SupabasePlugin
TapPlugin           TournamentPlugin  ZonePlugin
```

### Database Tables (Supabase)
```
profiles            # User accounts
leaderboards        # High scores
achievements        # Player achievements
clans               # Clan data
clan_members        # Clan membership
tournaments         # Tournament definitions
tournament_entries  # Player tournament scores
```

---

## WHAT'S MISSING / TODO

### 1. MONSTER SPRITES (Priority: HIGH)
- Need 60 sprites total (6 per tier x 10 tiers)
- Use prompt in `AGENT_INSTRUCTIONS.md` section "Monster Sprites"
- Save to: `public/sprites/enemies/tier{N}/{enemy_name}.png`
- Currently using placeholder via `/placeholder.svg`

**Tier 1 enemies:**
```
MALWARE.BAT, CORRUPT_PROC, NULL_PTR, 
STACK_OVERFLOW, SPAM_BOT, ADWARE.EXE
```

### 2. AUDIO ASSETS (Priority: MEDIUM)
- BGM: Need 1-3 looping tracks (synthwave/cyberpunk)
- SFX: tap, crit, skill activation, level up, purchase
- Save to: `public/audio/`
- Use Suno AI prompt from conversation

### 3. PAYMENTS INTEGRATION (Priority: HIGH for monetization)

**Phase 1 - Database (do first)**
```sql
-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'web', 'android', 'ios'
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  receipt TEXT,
  status TEXT DEFAULT 'pending',
  diamonds_granted INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create diamond_packages table
CREATE TABLE diamond_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  diamonds INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  bonus_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Seed packages
INSERT INTO diamond_packages (id, name, diamonds, price_usd, bonus_percent) VALUES
  ('starter', 'Starter Pack', 100, 0.99, 0),
  ('basic', 'Basic Pack', 550, 4.99, 10),
  ('value', 'Value Pack', 1200, 9.99, 20),
  ('premium', 'Premium Pack', 2600, 19.99, 30),
  ('mega', 'Mega Pack', 7000, 49.99, 40);
```

**Phase 2 - Stripe (Web)**
1. Connect Stripe integration in v0
2. Create checkout endpoint
3. Webhook for payment confirmation
4. Grant diamonds on success

**Phase 3 - Play Store (Android)**
1. Create Google Play Developer account ($25)
2. Add `@capawesome/capacitor-android-billing-library`
3. Create products in Play Console
4. Integrate billing in ShopPlugin

### 4. CAPACITOR BUILD (Priority: MEDIUM)
Already configured. To build APK:
```bash
pnpm install
pnpm build
npx cap add android
npx cap sync
npx cap open android
# In Android Studio: Build > Build APK
```

### 5. MISSING DOCS
The following docs are referenced in AGENT_INSTRUCTIONS.md but don't exist:
- `docs/PLUGINS_REFERENCE.md` - Plugin documentation
- `docs/ENGINE_PLUGIN_INSTRUCTIONS.md` - Deep plugin guide
- `AI_PROMPTS_GUIDE.md` - Common task prompts
- `START_HERE.md` - Quick start guide

---

## GAME CONFIG QUICK REFERENCE

All balance values in `src/config/game.config.ts`:

```typescript
// Enemy HP scaling
ENEMY_CONFIG.baseHp              // Starting HP
ENEMY_CONFIG.hpScaling           // Per-stage multiplier

// Tap damage
TAP_CONFIG.baseDamage            // Base tap damage
TAP_CONFIG.critChance            // Crit probability
TAP_CONFIG.critMultiplier        // Crit damage multiplier

// Components (idle DPS)
COMPONENTS_CONFIG                // All 50 components

// Skills
SKILLS_CONFIG                    // All 10 skills

// Tournaments
TOURNAMENT_CONFIG.localTemplates // 7 weekly tournaments
TOURNAMENT_CONFIG.entryFeeRatio  // Entry fee formula

// Items
ITEM_CONFIG.maxInventory         // 500 max items
ITEM_CONFIG.warningThreshold     // 90% warning
```

---

## ENVIRONMENT VARIABLES

Required in `.env`:
```bash
# Supabase (auto-set by integration)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# For Capacitor/AdMob (if using ads)
VITE_ADMOB_APP_ID=ca-app-pub-xxx
VITE_ADMOB_REWARDED_ID=ca-app-pub-xxx/xxx

# For Stripe (Phase 2)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## COMMON TASKS

### Add a new plugin
1. Create `src/plugins/MyPlugin.ts`
2. Register in `src/App.tsx`: `engine.register(new MyPlugin())`
3. Access via `engine.getPlugin<MyPlugin>('my')`

### Add a new screen
1. Create `src/components/game/MyScreen.tsx`
2. Add state in `GameScreen.tsx`: `const [showMy, setShowMy] = useState(false)`
3. Add modal: `{showMy && <MyScreen engine={engine} onClose={() => setShowMy(false)} />}`
4. Add button to open it

### Add a new config value
1. Add to `src/config/game.config.ts`
2. Import where needed: `import { MY_CONFIG } from '../config/game.config'`

### Run database migration
Use Supabase MCP or dashboard:
```sql
-- Your migration SQL here
```

---

## GIT WORKFLOW

```bash
# Current branch pattern
v0/bicho-8382-5390-{hash}

# Commit format
git commit -m "Feature: description

- Change 1
- Change 2

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"
```

---

## TESTING CHECKLIST

Before shipping:
- [ ] Login/logout works
- [ ] Tap damage registers
- [ ] Components purchase and add DPS
- [ ] Skills activate and cooldown
- [ ] Items drop from enemies
- [ ] Inventory opens and scrolls
- [ ] Motherboard equip/unequip works
- [ ] Tournaments show and can join
- [ ] Settings save (audio, etc)
- [ ] Mobile layout works
- [ ] Discord tab opens link

---

## CONTACT / RESOURCES

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Play Console:** https://play.google.com/console

---

## QUICK RESUME PROMPT

Copy this when starting a new v0 session:

```
I'm continuing work on OVERCLOCK-RPG, a cyberpunk idle clicker game.

Tech stack: React 19 + TypeScript + Vite + Supabase + Tailwind
Architecture: Plugin system (26 plugins) + game.config.ts for all balance

Current priorities:
1. [YOUR PRIORITY HERE]
2. [YOUR PRIORITY HERE]

Read AGENT_INSTRUCTIONS.md and docs/CONTINUATION_GUIDE.md first.
```
