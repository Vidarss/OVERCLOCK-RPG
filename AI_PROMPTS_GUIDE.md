# OVERCLOCK-RPG: AI Prompts & Instructions Guide

**For: v0, Claude, ChatGPT, Cursor, and any AI code assistant**  
**Last Updated: 2026-06-02**

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Project Structure](#2-project-structure)
3. [Copy-Paste Prompts for Common Tasks](#3-copy-paste-prompts-for-common-tasks)
4. [Adding New Features](#4-adding-new-features)
5. [Fixing Common Issues](#5-fixing-common-issues)
6. [Asset Management](#6-asset-management)
7. [Database Operations](#7-database-operations)
8. [UI Component Patterns](#8-ui-component-patterns)
9. [Testing Checklist](#9-testing-checklist)
10. [What NOT to Do](#10-what-not-to-do)

---

## 1. Quick Reference

### Critical Files (READ FIRST)

| File | Purpose |
|------|---------|
| `V0_BUILD_INSTRUCTIONS.md` | **GOLDEN RULES** - Always read before coding |
| `src/config/game.config.ts` | All game constants - NEVER hardcode in plugins |
| `src/engine/types.ts` | GameState, Events, Interfaces |
| `src/App.tsx` | Plugin registration |
| `docs/ENGINE_PLUGIN_INSTRUCTIONS.md` | Full plugin tutorial |

### Key Directories

```
src/
├── config/          ← Game constants (EDIT HERE for balance)
├── engine/          ← Core engine (DON'T TOUCH)
├── plugins/         ← Game logic (24 plugins)
├── components/game/ ← UI screens (13 screens)
├── hooks/           ← React hooks
├── systems/         ← AudioManager, etc
└── lib/db/          ← Database layer
```

### Color Palette

```
Cyan:   #00f5ff (primary accent)
Pink:   #ff0080 (overclock, special)
Green:  #39ff14 (success, DPS)
Amber:  #ffaa00 (gold, warnings)
Red:    #ff4444 (danger, damage)
Dark:   #0a0a0f, #050010, #04040a (backgrounds)
Border: #1a2a3a, #0a2838 (subtle borders)
```

---

## 2. Project Structure

### All 24 Plugins

| Plugin | ID | Purpose |
|--------|-----|---------|
| AuthPlugin | `auth` | Login, signup, session |
| SupabasePlugin | `supabase` | Database connection |
| SavePlugin | `save` | Auto-save, load game |
| TapPlugin | `tap` | Tap damage, crits, combos |
| ComponentPlugin | `component` | Hardware modules (GPU, RAM, etc) |
| EnemyPlugin | `enemy` | Enemy spawning, HP, death |
| StagePlugin | `stage` | Stage progression |
| ZonePlugin | `zone` | Zone backgrounds |
| GoldPlugin | `gold` | Currency earning |
| OverclockPlugin | `overclock` | Prestige system |
| SkillPlugin | `skill` | Active skills |
| SkillPointPlugin | `skillpoint` | Skill tree |
| DailyPlugin | `daily` | Daily challenges |
| AchievementPlugin | `achievement` | Achievements |
| LeaderboardPlugin | `leaderboard` | Global rankings |
| TournamentPlugin | `tournament` | Competitions |
| ClanPlugin | `clan` | Guilds/clans |
| ShopPlugin | `shop` | IAP store |
| ItemPlugin | `item` | Equipment/items |
| SetPlugin | `set` | Item set bonuses |
| MoboPlugin | `mobo` | Motherboard slots |
| HeroPlugin | `hero` | Hero units |
| DataPacketPlugin | `datapacket` | Random drops |
| SettingsPlugin | `settings` | Game settings |

### All 13 UI Screens

| Screen | Opens From | Purpose |
|--------|------------|---------|
| LoginScreen | Boot | Login/Register |
| BootScreen | Auto | Loading splash |
| GameScreen | After login | Main game container |
| SettingsScreen | Top HUD gear icon | Audio, particles, etc |
| OverclockScreen | Right sidebar/tab | Prestige |
| MotherboardScreen | Right sidebar | Equipment slots |
| ShopScreen | Bottom tab | Premium shop |
| TournamentScreen | Bottom tab | Tournaments |
| ClanScreen | Bottom tab | Clan management |
| LeaderboardScreen | Right sidebar | Rankings |
| DailiesScreen | Right sidebar | Daily tasks |
| AchievementsScreen | Right sidebar | Achievements |
| ScrapScreen | Bottom tab | Scrap items |
| UpgradeScreen | Right sidebar | Upgrades |

---

## 3. Copy-Paste Prompts for Common Tasks

### Add a New Plugin

```
Create a new plugin called [NAME]Plugin following V0_BUILD_INSTRUCTIONS.md:

1. Create src/plugins/[NAME]Plugin.ts implementing IPlugin interface
2. Add any new state keys to src/engine/types.ts GameState interface
3. Add config to src/config/game.config.ts as [NAME]_CONFIG
4. Register in src/App.tsx createEngine() function
5. If it needs a UI, create src/components/game/[NAME]Screen.tsx
6. Wire screen into GameScreen.tsx (import, useState, modals, buttons)

DO NOT hardcode any values in the plugin - all constants go in config.
```

### Add a New UI Screen

```
Create a new modal screen called [NAME]Screen.tsx:

1. Create src/components/game/[NAME]Screen.tsx
2. Use this structure:
   - Fixed overlay (background rgba(0,0,0,0.92), onClick=onClose)
   - Inner container (background #04040a, border #00f5ff33)
   - Header with icon, title, and X close button
   - Scrollable content area
   - Optional footer with action buttons
3. Import in GameScreen.tsx
4. Add state: const [show[NAME], setShow[NAME]] = useState(false)
5. Add to modals: {show[NAME] && <[NAME]Screen engine={engine} onClose={() => setShow[NAME](false)} />}
6. Add button in right sidebar (desktop) and MobileTab (mobile)

Use font-pixel class for headers, colors from palette above.
```

### Add a New Component/Module

```
Add a new hardware module called [NAME]:

1. In src/config/game.config.ts, add to COMPONENTS array:
   {
     id: '[name_lowercase]',
     name: '[DISPLAY_NAME]',
     baseCost: [number],
     baseDps: [number],
     costGrowth: 1.15,
     unlockStage: [number],
     flavorText: '[description]',
   }

2. In src/components/game/ComponentPanel.tsx, add sprite URL to COMPONENT_IMAGES:
   [name_lowercase]: '[blob_url_or_local_path]',

That's it - the ComponentPlugin auto-reads from config.
```

### Add a New Achievement

```
Add achievement called [NAME]:

In src/config/game.config.ts ACHIEVEMENTS array, add:
{
  id: '[snake_case_id]',
  name: '[DISPLAY NAME]',
  description: '[What the player did]',
  reward: { type: 'diamonds', amount: [number] },
  condition: { type: '[kills|stage|gold|etc]', target: [number] },
}

The AchievementPlugin auto-checks conditions each tick.
```

### Add a New Enemy Type

```
Add enemy type to ENEMY_CONFIG in game.config.ts:

In the sprites array for the appropriate zone, add:
{ name: '[ENEMY_NAME]', url: '[sprite_url]' }

For boss enemies, add to boss sprites.
```

### Add Background Music

```
Add background music:

1. Save audio file to public/audio/[filename].mp3
2. In src/systems/AudioManager.ts, the playBGM() method accepts a path
3. Call audioManager.playBGM('/audio/[filename].mp3') from GameScreen.tsx

Current BGM: /audio/bgm-main.mp3
```

### Add Sound Effect

```
Add a new sound effect:

1. In src/systems/AudioManager.ts, add a new method in the `sounds` object:
   [effectName]: () => this.playSynth({ ... oscillator params ... })

2. Export it in playSFX object:
   export const playSFX = {
     ...,
     [effectName]: () => audioManager.play('[effectName]'),
   }

3. Use it anywhere: playSFX.[effectName]()
```

### Fix Tournament Not Updating

```
The tournament system uses client-side time comparison.
In TournamentPlugin.ts, tournaments are filtered by:
- ends_at > now (not ended)
- status is calculated client-side from starts_at/ends_at

If tournaments appear stale:
1. Check TournamentPlugin.checkAndRefreshTournaments() runs every 30s
2. Verify the database ensure_active_tournaments() function creates new brackets
3. Force refresh by calling tournamentPlugin.load()
```

### Add New Sprite/Image

```
Add a new sprite image:

1. Get the blob URL from user upload or external source
2. Save to filesystem:
   Write(blobUrl="[url]", file_path="/vercel/share/v0-project/public/images/[folder]/[name].png")

3. Reference in code as: /images/[folder]/[name].png

For component sprites, add to COMPONENT_IMAGES in ComponentPanel.tsx
For enemy sprites, add to ENEMY_CONFIG.sprites in game.config.ts
```

---

## 4. Adding New Features

### Feature with Database

```
Create feature [NAME] that saves to database:

1. Create migration file supabase/migrations/[timestamp]_[name].sql:
   CREATE TABLE IF NOT EXISTS [table_name] (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     [columns...],
     created_at timestamptz NOT NULL DEFAULT now()
   );
   ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "[name]_select_own" ON [table_name] FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "[name]_insert_own" ON [table_name] FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "[name]_update_own" ON [table_name] FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "[name]_delete_own" ON [table_name] FOR DELETE USING (auth.uid() = user_id);

2. In plugin init():
   engine.storage.registerTable(this.id, { table: '[table_name]', userScoped: true });

3. Use engine.storage methods:
   await engine.storage.load('[table_name]', { user_id: this.userId })
   await engine.storage.save('[table_name]', data, 'id')
   await engine.storage.insert('[table_name]', data)
   await engine.storage.remove('[table_name]', { id: recordId })
```

### Feature with Real-time Updates

```
Create real-time feature:

1. In plugin, subscribe to channel:
   const channel = engine.realtime.channel('[channel_name]')
     .on('postgres_changes', { event: '*', schema: 'public', table: '[table]' }, payload => {
       // Handle change
     })
     .subscribe();

2. Store channel reference for cleanup:
   this.channel = channel;

3. In cleanup():
   this.channel?.unsubscribe();
```

---

## 5. Fixing Common Issues

### JSX Parse Errors

```
Error: Unterminated JSX contents

This means unmatched tags. Check:
1. Every <div> has a matching </div>
2. Self-closing tags have / before >
3. No stray </tag> without opening tag
4. Conditional renders have proper {condition && (...)}

Common fix: Count opening and closing tags in the file.
```

### Import Errors

```
Error: Failed to resolve import

1. Check if file exists at the path
2. Use relative imports (../systems/AudioManager) not aliases (@/systems)
3. Check for typos in filename
4. Verify the export exists in the source file
```

### Plugin Not Working

```
Plugin not initializing:

1. Check it's registered in src/App.tsx createEngine()
2. Check dependencies array - are required plugins registered first?
3. Check for errors in init() - wrap in try/catch
4. Add console.log('[PluginName] init started') to debug
```

### Settings Not Saving

```
Settings reset on refresh:

1. Check localStorage key: 'overclock_settings'
2. Verify updateSettings() calls localStorage.setItem()
3. Check init() loads from localStorage
4. Verify JSON.parse doesn't throw on saved value
```

### Audio Not Playing

```
Audio not working:

1. Browser requires user interaction before audio
2. Check audioManager.enabled is true
3. Check volume is not 0
4. For BGM, check bgmAudio.play() returns Promise - catch errors
5. Check file exists at the path
```

---

## 6. Asset Management

### Sprite Locations

```
/public/images/
├── components/     ← Hardware module sprites
├── enemies/        ← Enemy sprites by zone
├── items/          ← Equipment icons
├── ui/             ← UI elements
└── backgrounds/    ← Zone backgrounds

/public/audio/
├── bgm-main.mp3    ← Background music
└── sfx/            ← Sound effects (if external)
```

### Adding Component Sprites

```
In ComponentPanel.tsx, COMPONENT_IMAGES maps component ID to sprite URL:

const COMPONENT_IMAGES: Record<string, string> = {
  gpu: 'https://blob.vercel-storage.com/GPU_UNIT-xxx.png',
  ram: 'https://blob.vercel-storage.com/RAM_BANK-xxx.png',
  // Add new:
  [component_id]: '[sprite_url]',
};
```

### Adding Enemy Sprites

```
In game.config.ts, ENEMY_CONFIG.sprites is an array per zone:

sprites: [
  { name: 'VIRUS_BASIC', url: '/images/enemies/virus_basic.png' },
  { name: 'MALWARE_DRONE', url: '/images/enemies/malware_drone.png' },
  // Add new:
  { name: '[ENEMY_NAME]', url: '[sprite_url]' },
]
```

---

## 7. Database Operations

### Quick Reference

```typescript
// Load single record
const { data, error } = await engine.storage.load<Type>('table', { filter });

// Load multiple records
const { data, error } = await engine.storage.loadMany<Type>('table', { filter });

// Save (upsert)
await engine.storage.save('table', record, 'conflict_key');

// Insert (new only)
const { data, error } = await engine.storage.insert<Type>('table', record);

// Delete
await engine.storage.remove('table', { id: recordId });
```

### Table Schemas

See `docs/DATABASE.md` for full schema reference.

Key tables:
- `profiles` - User profiles, handles, stats
- `saves` - Game save data (JSON)
- `leaderboard` - Global rankings
- `tournaments` - Tournament definitions
- `tournament_entries` - Player tournament scores
- `clans` - Clan data
- `clan_members` - Clan membership

---

## 8. UI Component Patterns

### Modal Screen Template

```tsx
export const MyScreen: React.FC<{ engine: GameEngine; onClose: () => void }> = ({ engine, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)' }} />
      
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 110, width: 'min(90vw, 380px)', background: '#0a0a0f',
        border: '2px solid #00f5ff', maxHeight: '85dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', background: '#050010', borderBottom: '1px solid #00f5ff33', display: 'flex', justifyContent: 'space-between' }}>
          <span className="font-pixel" style={{ color: '#00f5ff', fontSize: '10px' }}>TITLE</span>
          <button onClick={onClose}><X size={16} color="#00f5ff" /></button>
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {/* Your content */}
        </div>
      </div>
    </>
  );
};
```

### Button Styles

```tsx
// Primary button (cyan)
<button style={{
  background: '#0a1828',
  border: '1px solid #00f5ff',
  color: '#00f5ff',
  padding: '10px 20px',
  cursor: 'pointer',
  fontFamily: 'var(--font-pixel)',
  fontSize: '10px',
  letterSpacing: '1px',
}}>ACTION</button>

// Danger button (red)
<button style={{
  background: '#1a0505',
  border: '1px solid #ff4444',
  color: '#ff4444',
  ...
}}>DELETE</button>
```

### Toggle Switch

```tsx
<button onClick={onToggle} style={{
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#050508',
  border: `1px solid ${value ? '#00f5ff' : '#1a2a3a'}`,
  padding: '8px 12px',
  cursor: 'pointer',
}}>
  <span className="font-pixel" style={{ color: value ? '#00f5ff' : '#3a4a5a', fontSize: '9px' }}>
    LABEL
  </span>
  <span style={{
    width: 20, height: 12,
    background: value ? '#00f5ff' : '#1a2a3a',
    position: 'relative',
  }}>
    <span style={{
      position: 'absolute', width: 8, height: 8,
      background: value ? '#0a0a0f' : '#3a4a5a',
      left: value ? '10px' : '2px', top: '2px',
    }} />
  </span>
</button>
```

---

## 9. Testing Checklist

### Before Committing

- [ ] `pnpm build` passes with no errors
- [ ] No hardcoded values in plugin files
- [ ] All new state keys added to types.ts
- [ ] Plugin registered in App.tsx
- [ ] UI wired in GameScreen.tsx
- [ ] Works on mobile (368x728 viewport)
- [ ] Works on desktop
- [ ] Settings persist after refresh
- [ ] No console errors in browser

### After Adding Features

- [ ] Test login/logout flow
- [ ] Test on fresh account
- [ ] Test on existing account with saves
- [ ] Check tournament updates
- [ ] Verify audio plays
- [ ] Check tooltips display correctly
- [ ] Test all buttons/interactions

---

## 10. What NOT to Do

### NEVER

- Hardcode numbers in plugin files (use config)
- Modify Engine.ts, StateManager.ts, PluginRegistry.ts
- Import supabase directly (use engine.storage)
- Use `await` in plugin init() for network calls (fire-and-forget)
- Create state fields not declared in stateKeys
- Use `git checkout` to undo work during active session
- Say "fixed" without actually testing in browser
- Delete files before checking dependencies

### ALWAYS

- Read V0_BUILD_INSTRUCTIONS.md first
- Check existing patterns before creating new ones
- Use relative imports (../path) not aliases (@/path)
- Test on mobile viewport (primary target)
- Verify changes in browser before confirming
- Keep config in game.config.ts
- Clean up in plugin cleanup() method
- Handle errors gracefully (try/catch, optional chaining)

---

## Quick Debug Commands

```bash
# Check for TypeScript errors
pnpm typecheck

# Build project
pnpm build

# Find all usages of something
grep -r "pattern" src/

# List all plugins
ls src/plugins/

# List all screens
ls src/components/game/*Screen.tsx

# Check console logs
# Read user_read_only_context/v0_debug_logs.log
```

---

## Emergency Fixes

### Everything Broke

```
1. Check user_read_only_context/v0_debug_logs.log for errors
2. Look for "Unterminated JSX" or "Failed to resolve import"
3. Fix the specific file mentioned in the error
4. Run pnpm build to verify
```

### Revert Changes

```
DO NOT use git checkout to revert.
Instead:
1. Read the file that needs fixing
2. Make targeted edits to fix the issue
3. Or ask user to revert to a previous v0 version
```

---

**Created for AI assistants to quickly understand and work with OVERCLOCK-RPG**
