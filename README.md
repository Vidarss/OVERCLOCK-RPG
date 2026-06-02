# OVERCLOCK-RPG

A cyberpunk idle/clicker RPG built with React, Vite, TypeScript, and Supabase.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, inline styles (cyberpunk theme)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Audio**: Web Audio API (procedural SFX + MP3 BGM)

---

## Documentation

| File | Description |
|------|-------------|
| **START_HERE.md** | Master index - read this first |
| **AI_PROMPTS_GUIDE.md** | Copy-paste prompts for AI assistants |
| **V0_BUILD_INSTRUCTIONS.md** | Golden rules for code generation |
| **CLAUDE.md** | Quick codebase overview |
| **docs/ENGINE_PLUGIN_INSTRUCTIONS.md** | How to create plugins |
| **docs/DATABASE.md** | Database schema reference |
| **docs/DB_QUICK_REFERENCE.md** | Database API cheatsheet |
| **docs/BALANCE.md** | Game balance formulas |

---

## Project Structure

```
src/
├── config/game.config.ts    ← All game constants
├── engine/                  ← Core engine (don't modify)
│   ├── Engine.ts
│   ├── types.ts             ← GameState, Events
│   └── StateManager.ts
├── plugins/                 ← Game logic (24 plugins)
├── components/game/         ← UI screens (13 screens)
├── hooks/                   ← React hooks
├── systems/                 ← AudioManager
└── lib/db/                  ← Database layer
```

---

## Features

### Core Gameplay
- Tap enemies to deal damage
- Collect hardware components (GPU, RAM, CPU, etc.)
- Idle DPS from components
- Stage progression with bosses
- Prestige system ("Overclock")

### Meta Systems
- Daily challenges
- Achievements
- Global leaderboards
- Tournaments
- Clans

### Technical
- Real-time multiplayer features
- Auto-save with offline progress
- Procedural audio effects
- Mobile-first responsive design

---

## Environment Variables

Create `/vercel/share/.env.project` with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## For AI Assistants

**Read these files before making any changes:**

1. `V0_BUILD_INSTRUCTIONS.md` - Mandatory rules
2. `AI_PROMPTS_GUIDE.md` - Copy-paste templates
3. `docs/ENGINE_PLUGIN_INSTRUCTIONS.md` - Plugin creation guide

**Key rules:**
- Never hardcode values in plugins (use `src/config/game.config.ts`)
- Use relative imports (`../path`) not aliases (`@/path`)
- Test on mobile viewport (368x728)
- Always read files before editing

---

## License

Private project. All rights reserved.

---

## Maintainer

Vidarss
