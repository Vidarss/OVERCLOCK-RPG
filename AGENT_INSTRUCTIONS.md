# OVERCLOCK-RPG: Agent Instructions for AI

This document tells AI/v0 HOW to work with this codebase. Follow these rules for every task.

---

## 🎯 Project Identity

**OVERCLOCK-RPG** is a cyberpunk idle clicker RPG built with:
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Architecture:** Modular Plugin System + Component-Based UI
- **State:** Custom Game Engine with event-driven architecture
- **Storage:** Supabase PostgreSQL + localStorage for settings
- **Audio:** Web Audio API + background music support

**Theme:** Dark cyberpunk aesthetic. Cyan (#00f5ff) accents on dark navy/black. Pixel-art inspired sprites. Neon glow effects.

---

## 📁 Project Structure (Key Paths)

```
src/
├── engine/               # Core game engine
│   ├── Engine.ts        # Main game loop & plugin manager
│   ├── types.ts         # TypeScript interfaces (IPlugin, IEngine, etc)
│   └── ...
├── plugins/             # Game logic modules (24 total)
│   ├── SettingsPlugin.ts
│   ├── ComponentPlugin.ts
│   ├── EnemyPlugin.ts
│   ├── TournamentPlugin.ts
│   └── ... (see docs/PLUGINS_REFERENCE.md)
├── components/game/     # UI screens & HUD
│   ├── GameScreen.tsx   # Main container
│   ├── CyberHUD.tsx     # Top bar (player, settings, exit)
│   ├── Battlefield.tsx  # Combat area
│   ├── ComponentPanel.tsx # Shopping
│   ├── *Screen.tsx      # 13+ modal screens
│   └── ... (see AI_PROMPTS_GUIDE.md)
├── systems/
│   ├── AudioManager.ts  # Music + SFX control
│   └── ...
├── config/
│   └── game.config.ts   # All balance values, component defs
├── utils/               # Helpers (format, validation, etc)
└── App.tsx              # Plugin registration
```

---

## 🔌 Architecture: Plugin System

Every major feature is a **Plugin**. Plugins:
1. Inherit `IPlugin` interface (from `engine/types.ts`)
2. Have `id`, `init()`, and `cleanup()` methods
3. Register events via `engine.on()` and `engine.emit()`
4. Get/set player data via other plugins: `engine.getPlugin<T>(id)`
5. Are registered in `App.tsx` via `engine.register(new MyPlugin())`

### Plugin Lifecycle
```typescript
async init(engine: IEngine) {
  // Load data, set up listeners
  this.unsubs.push(engine.on('event_name', (e) => { /* handle */ }));
}

cleanup() {
  // Unsubscribe all listeners
  for (const unsub of this.unsubs) unsub();
}
```

### Example: Simple Plugin
See `AI_PROMPTS_GUIDE.md` > "How to add a new plugin" for copy-paste template.

---

## 🖼️ UI Architecture: Screens & Components

### Screen Components
- Located in `src/components/game/*Screen.tsx`
- Props: `engine: GameEngine` + `onClose: () => void`
- Opened from `GameScreen.tsx` state (e.g., `showSettings`, `showShop`)
- Wired to modal state: `{showSettings && <SettingsScreen engine={engine} onClose={() => setShowSettings(false)} />}`

### Adding a New Screen
1. Create `src/components/game/MyFeatureScreen.tsx`
2. Import in `GameScreen.tsx`
3. Add state: `const [showMyFeature, setShowMyFeature] = useState(false);`
4. Add to modals JSX: `{showMyFeature && <MyFeatureScreen ... />}`
5. Add button to open it (usually in CyberHUD or another screen)

### Component Panel Pattern
- Shows purchasable items with icons/sprites
- Has `COMPONENT_IMAGES` map for sprite URLs (top of file)
- Calls `plugin.purchaseBulk(id, qty)` for purchases
- See `src/components/game/ComponentPanel.tsx` for example

---

## ⚙️ Game Config (Balance & Definitions)

**ALL** balance values live in `src/config/game.config.ts`:
- Component definitions (DPS, cost, etc.)
- Enemy stats
- Stage/zone definitions
- UI constants (animation timings, colors)
- Milestone thresholds

**RULE:** Never hardcode numbers in components. Always reference `game.config.ts`.

```typescript
// ❌ BAD
const damage = 10;

// ✅ GOOD
import { COMPONENTS } from '../config/game.config';
const damage = COMPONENTS.gpu.baseDps;
```

---

## 🎨 UI/Design Rules

### Colors
- **Primary:** Dark navy/black background (#0a0a0f, #1a1a2e)
- **Accent:** Cyan (#00f5ff) for highlights, glows, active states
- **Text:** Light gray (#5a6a7a default, #00f5ff when active/hovered)
- **Warning/Danger:** Red (#ff2222)
- **Success:** Cyan/green accents

### Typography
- **Headings:** Pixel font (via `font-pixel` class) for titles
- **Body:** `font-mono` for data/code-like text, `font-sans` for UI labels
- **Sizes:** 7px (tiny), 9px (small UI), 12px (body), 14px+ (headings)

### Layout
- Use **Flexbox** for 90% of layouts
- CSS Grid only for complex 2D grids (rare)
- Responsive: Mobile first, then `md:` breakpoint for desktop
- Hover effects: Use `onMouseEnter` / `onMouseLeave` with inline styles (cyberpunk pattern)

---

## 🔊 Audio System

### AudioManager (src/systems/AudioManager.ts)
```typescript
import { audioManager } from '../systems/AudioManager';

// Background music (loops)
audioManager.playBGM('/path/to/bgm.mp3');
audioManager.stopBGM();
audioManager.setBGMVolume(0.7);

// SFX control
audioManager.setVolume(0.8);
audioManager.play(SoundType.CLICK);
```

### Adding Audio
1. Save audio file to `public/audio/` (MP3/WAV)
2. Reference in code via `audioManager.play()` or `audioManager.playBGM()`
3. Settings persist via `SettingsPlugin` (music volume, SFX volume)
4. BGM auto-starts in `GameScreen.tsx` on mount

---

## 📊 State Management Pattern

### Use This Order (Priority)
1. **Plugin System** - For game logic & persistent data (preferred)
2. **React State** - For UI-only state (modals, tabs, temp values)
3. **localStorage** - For player settings only (SettingsPlugin handles this)

**RULE:** Don't use React state for game data. Use plugins + engine events.

### Getting Game State in Components
```typescript
import { useGameState } from '../hooks/useGameState';

const { player, stage, zone } = useGameState(engine);
```

### Updating State
```typescript
// From component
engine.emit('stage_clear', { stage: 5 });

// Plugin listens
engine.on('stage_clear', (e) => { /* handle */ });
```

---

## 🗄️ Database (Supabase)

### Key Tables
- `profiles` - Player accounts & auth
- `leaderboards` - Tournament scores
- `achievements` - Player achievement tracking
- `clans` - Clan data & members

### Query Pattern (use Supabase client)
```typescript
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Rules
- Always filter by `user_id` (security)
- Use `await` with error handling
- Never expose API keys in frontend code
- Row-level security (RLS) is enabled on all tables

---

## ✅ Code Standards & Conventions

### Naming
- **Plugins:** `PascalCase` + "Plugin" suffix (e.g., `ComponentPlugin`, `SettingsPlugin`)
- **Screens:** `PascalCase` + "Screen" suffix (e.g., `ShopScreen`, `TournamentScreen`)
- **Events:** `snake_case` (e.g., `stage_clear`, `enemy_death`, `purchase_success`)
- **Config:** `UPPER_SNAKE_CASE` (e.g., `COMPONENT_DPS`, `BOSS_HEALTH`)
- **Utils:** `camelCase` (e.g., `formatNumber`, `calculateDamage`)

### File Organization
```
FeaturePlugin.ts    // 1 plugin per file
FeatureScreen.tsx   // 1 screen per file
useFeatureHook.ts   // 1 hook per file
```

### Imports
- Always use absolute imports: `import { X } from '../systems/Y'`
- Group imports: React → Types → Internal modules
- No circular imports (lint will catch)

### Component Exports
```typescript
// ✅ GOOD
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => { ... };

// ❌ BAD
export default MyComponent;
```

---

## 🐛 Debugging & Testing

### Debug Logging
Use `console.log("[v0] message")` to trace execution:
```typescript
console.log("[v0] Plugin initialized with state:", this.state);
console.log("[v0] Event emitted:", eventType, payload);
```
Remove all `[v0]` logs before committing.

### Check Browser Console
- Run `pnpm dev` and open http://localhost:5173
- All engine events log to console
- Audio errors show in network tab

### Common Issues
- **Plugin not registering?** Check `App.tsx` registration order
- **State not updating?** Verify plugin event is emitted + listener is subscribed
- **Component not showing?** Check modal state in `GameScreen.tsx`
- **Audio not playing?** Verify file path in `public/audio/` and browser volume

---

## 📝 Documentation Links (Read These!)

1. **START_HERE.md** - Project overview & quick links
2. **AI_PROMPTS_GUIDE.md** - Copy-paste prompts for 20+ common tasks
3. **docs/ENGINE_PLUGIN_INSTRUCTIONS.md** - Deep dive on plugin system
4. **docs/PLUGINS_REFERENCE.md** - All 24 plugins explained
5. **V0_BUILD_INSTRUCTIONS.md** - v0-specific build notes
6. **CLAUDE.md** - Claude AI context (if using Claude)

---

## ❌ DO NOT DO (Common Mistakes)

1. **Hardcode balance values** - Use `game.config.ts` instead
2. **Store game state in React** - Use plugins for persistent state
3. **Skip error handling** - Always wrap async/await in try-catch
4. **Add new modals without wiring** - Must add to GameScreen state + modals JSX
5. **Use localStorage for game data** - Use plugins + Supabase
6. **Create files without organizing** - Follow folder structure
7. **Forget to unsubscribe listeners** - Always call `unsub()` in plugin cleanup
8. **Use `any` type** - Use proper TypeScript interfaces
9. **Commit with console.log** - Remove debug logs before commit
10. **Push without testing** - Always `pnpm build` and test in browser

---

## 🚀 Quick Start Workflow for New Tasks

### Adding a Simple Feature (e.g., new button)
1. **Check docs** - Read `AI_PROMPTS_GUIDE.md` for similar examples
2. **Understand scope** - Is this UI-only or requires backend?
3. **Find related code** - Grep for similar features
4. **Copy pattern** - Follow existing component/plugin structure
5. **Test in browser** - `pnpm dev` → manual test
6. **Commit with message** - Clear git commit message
7. **Push to branch** - `git push origin v0/bicho-...`

### Adding a Major Feature (plugin + screen)
1. **Create plugin** - Copy template from `AI_PROMPTS_GUIDE.md`
2. **Add screen** - Copy similar screen pattern
3. **Register plugin** - Add to `App.tsx`
4. **Wire UI** - Add state + modal JSX in `GameScreen.tsx`
5. **Test flow** - Open modal, verify functionality
6. **Add to config** - Put any balance values in `game.config.ts`
7. **Document** - Update `docs/PLUGINS_REFERENCE.md`

---

## 📦 Git Workflow

```bash
# Create feature branch (already done, use v0/bicho-...)
git checkout v0/bicho-8382-5390-5d2a2b47

# Make changes (use proper tools: Edit, Write, Delete)
# Then commit
git add -A
git commit -m "Feature: add something cool

- Bullet point 1
- Bullet point 2

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

# Push
git push origin v0/bicho-8382-5390-5d2a2b47
```

---

## 🎓 Learning Path (for new AI)

**First time working on OVERCLOCK?** Read in this order:
1. START_HERE.md (5 min)
2. This file (AGENT_INSTRUCTIONS.md) (10 min)
3. AI_PROMPTS_GUIDE.md (skim for your task)
4. Relevant file in docs/ based on task type
5. Examine 2-3 existing plugins similar to what you're building
6. Write code following the patterns

**Then:** Test in browser, fix any issues, commit & push.

---

## 🆘 When Stuck

1. **Search existing code** - 90% of patterns already exist
2. **Check game.config.ts** - Most balance questions answered there
3. **Read plugin lifecycle** - Most issues are lifecycle-related
4. **Examine console errors** - Browser DevTools shows real issues
5. **Ask in CLAUDE.md** - Context for Claude AI if using it
6. **Look at git history** - See how similar features were added

---

## 🎉 You Got This!

Follow these rules, read the docs, copy patterns, and you'll ship features smoothly. The codebase is organized for AI to work efficiently. Trust the structure.

Good luck, agent! 🚀
