# OVERCLOCK-RPG: Agent Instructions

This document tells AI/v0 HOW to work with this codebase. Follow these rules.

---

## Project Identity

**OVERCLOCK-RPG** is a cyberpunk idle clicker RPG built with:
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Architecture:** Modular Plugin System (see `docs/ENGINE_ARCHITECTURE.md`)
- **State:** Custom GameEngine with event-driven architecture
- **Storage:** Supabase PostgreSQL
- **Mobile:** Capacitor for APK builds

**Theme:** Dark cyberpunk. Cyan (#00f5ff) accents on dark navy/black. Pixel-art sprites. Neon glows.

---

## Documentation (Read These!)

All detailed docs are in `docs/` folder:

| File | Purpose |
|------|---------|
| `docs/CONTINUATION_GUIDE.md` | Project status, TODO list, what's done vs missing |
| `docs/ENGINE_ARCHITECTURE.md` | How the engine works, events, state, modifiers |
| `docs/PLUGINS_REFERENCE.md` | All 24 plugins documented with examples |
| `docs/SPRITE_PROMPTS.md` | AI image prompts for all 60 monster sprites |

---

## Key Rules

### 1. Never Hardcode Values
All balance/config values live in `src/config/game.config.ts`:

```typescript
// BAD
const damage = 10;

// GOOD
import { TAP_CONFIG } from '@/config/game.config';
const damage = TAP_CONFIG.baseDamage;
```

### 2. Use Plugin System for Game Logic
- Game state lives in plugins, NOT React state
- React state is only for UI (modals, tabs, temp values)
- See `docs/ENGINE_ARCHITECTURE.md` for patterns

### 3. Follow Existing Patterns
Before creating something new:
1. Search for similar existing code
2. Copy the pattern exactly
3. Only deviate if you have a good reason

### 4. File Organization
```
src/
├── config/game.config.ts  # ALL balance values
├── engine/                # Core engine (types.ts, Engine.ts)
├── plugins/               # Game logic (24 plugins)
├── components/game/       # UI screens (*Screen.tsx)
├── lib/db/               # Supabase client & auth
└── systems/              # AudioManager, etc
```

---

## Common Tasks

### Add a New Plugin
See template in `docs/PLUGINS_REFERENCE.md` > "Creating a New Plugin"

### Add a New Screen
1. Create `src/components/game/MyScreen.tsx`
2. Add state in `GameScreen.tsx`: `const [showMy, setShowMy] = useState(false)`
3. Add modal: `{showMy && <MyScreen engine={engine} onClose={() => setShowMy(false)} />}`
4. Add button to open it

### Add Balance Config
1. Add to `src/config/game.config.ts`
2. Export with clear name
3. Import where needed

### Run Migration
Use Supabase MCP tool: `supabase_apply_migration`

---

## Code Standards

### Naming
- **Plugins:** `PascalCasePlugin` (e.g., `TapPlugin`)
- **Screens:** `PascalCaseScreen` (e.g., `ShopScreen`)
- **Events:** `snake_case` (e.g., `enemy_death`)
- **Config:** `UPPER_SNAKE_CASE` (e.g., `TAP_CONFIG`)

### Debug Logging
```typescript
console.log("[v0] message", data);  // Use for debugging
// REMOVE before commit
```

### Git Commits
```
Feature: short description

- Bullet point changes
- Another change

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>
```

---

## DO NOT

1. Hardcode balance values - use `game.config.ts`
2. Store game state in React - use plugins
3. Skip error handling - always try-catch async
4. Commit with `[v0]` console.logs - remove them
5. Create files without following structure
6. Forget to unsubscribe listeners in plugin cleanup

---

## Quick Start for New Task

1. Read relevant doc in `docs/`
2. Search existing code for similar patterns
3. Copy pattern, modify for your needs
4. Test in browser (`pnpm dev`)
5. Commit with clear message
6. Push to branch

---

## Environment Variables

Required in `.env` (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
VITE_ADMOB_APP_ID=           # For mobile ads
VITE_ADMOB_REWARDED_ANDROID= # Rewarded ad unit
```

---

## Build Commands

```bash
pnpm dev          # Local development
pnpm build        # Production build
pnpm build:android # Build APK (requires Android Studio)
```

---

For detailed information, always check `docs/` folder first.
