# OVERCLOCK-RPG: START HERE

**Read this first. Seriously.**

---

## What is OVERCLOCK?

A cyberpunk idle/clicker RPG built with React + Vite + Supabase. Tap to destroy enemies, collect hardware components, prestige via "Overclock", compete in tournaments, join clans.

---

## Documentation Map

### For AI Assistants (v0, Claude, ChatGPT, Cursor)

| File | When to Read |
|------|--------------|
| **AI_PROMPTS_GUIDE.md** | FIRST - Copy-paste prompts for every task |
| **V0_BUILD_INSTRUCTIONS.md** | ALWAYS - Golden rules (no hardcoding!) |
| **docs/ENGINE_PLUGIN_INSTRUCTIONS.md** | Creating new plugins |

### For Developers

| File | Purpose |
|------|---------|
| **README.md** | Project overview, setup |
| **docs/DEVELOPER.md** | Development workflow |
| **docs/BALANCE.md** | Game balance formulas |
| **CLAUDE.md** | Quick project context |

### For Database Work

| File | Purpose |
|------|---------|
| **docs/DATABASE.md** | Full schema reference |
| **docs/DB_QUICK_REFERENCE.md** | Query API cheatsheet |
| **docs/DB_ARCHITECTURE.md** | How the DB layer works |
| **MIGRATION_GUIDE.md** | Migrating old DB code |

### Architecture Deep-Dives

| File | Purpose |
|------|---------|
| **DOCUMENTATION_INDEX.md** | Full documentation index |
| **REFACTORING_SUMMARY.md** | DB refactoring overview |
| **BEFORE_AND_AFTER.md** | DB architecture comparison |

---

## Quick Start for AI

### 1. Before ANY code change:
```
Read: V0_BUILD_INSTRUCTIONS.md
```

### 2. For common tasks:
```
Read: AI_PROMPTS_GUIDE.md
Copy the prompt template for your task
```

### 3. For new plugins:
```
Read: docs/ENGINE_PLUGIN_INSTRUCTIONS.md
Follow the step-by-step guide
```

---

## Golden Rules (Memorize These)

### NEVER
- Hardcode values in plugin files (use `src/config/game.config.ts`)
- Modify `Engine.ts`, `StateManager.ts`, `PluginRegistry.ts`
- Import supabase directly (use `engine.storage`)
- Use `await` in plugin `init()` for network calls
- Use `@/` imports (use relative paths like `../`)

### ALWAYS
- Put constants in `src/config/game.config.ts`
- Add new state keys to `src/engine/types.ts`
- Register plugins in `src/App.tsx`
- Test on mobile viewport (368x728)
- Read files before editing them

---

## Project Structure (Quick Reference)

```
src/
├── config/game.config.ts    ← ALL game constants go here
├── engine/types.ts          ← GameState, Events, Interfaces
├── App.tsx                  ← Plugin registration
├── plugins/                 ← 24 game logic plugins
├── components/game/         ← 13 UI screens
├── hooks/                   ← React hooks
├── systems/                 ← AudioManager, etc
└── lib/db/                  ← Database layer
```

---

## Current Feature List

### Plugins (24)
Auth, Supabase, Save, Tap, Component, Enemy, Stage, Zone, Gold, Overclock, Skill, SkillPoint, Daily, Achievement, Leaderboard, Tournament, Clan, Shop, Item, Set, Mobo, Hero, DataPacket, Settings

### Screens (13)
Login, Boot, Game, Settings, Overclock, Motherboard, Shop, Tournament, Clan, Leaderboard, Dailies, Achievements, Scrap, Upgrade

### Audio
- Background music: `/public/audio/bgm-main.mp3`
- SFX: Procedural via Web Audio API

---

## Common Prompts

### "Add a new feature"
```
Follow docs/ENGINE_PLUGIN_INSTRUCTIONS.md to:
1. Add config to game.config.ts
2. Create plugin in src/plugins/
3. Add state to types.ts if needed
4. Register in App.tsx
5. Create UI screen
6. Wire into GameScreen.tsx
```

### "Fix a bug"
```
1. Check user_read_only_context/v0_debug_logs.log
2. Find the error message
3. Read the file mentioned
4. Make targeted fix
5. Verify with pnpm build
```

### "Add UI element"
```
1. Read the target file
2. Use existing patterns (colors, fonts, structure)
3. Test on mobile viewport
```

---

## Troubleshooting

### Build fails
```bash
pnpm build
# Check error message, fix the file mentioned
```

### Import errors
```
Use relative imports: ../systems/AudioManager
NOT: @/systems/AudioManager
```

### JSX parse errors
```
Count opening and closing tags
Check for stray </div> or missing />
```

---

## Contact

Project maintained by: Vidarss  
AI assistants: Follow V0_BUILD_INSTRUCTIONS.md or face the consequences.

---

**Now go read V0_BUILD_INSTRUCTIONS.md and AI_PROMPTS_GUIDE.md**
