// ══════════════════════════════════════════════════════════════════════════════
// PLUGIN CONFIGURATION - Enable/Disable Game Systems
// ══════════════════════════════════════════════════════════════════════════════
//
// HOW TO ADD A NEW PLUGIN:
// 1. Create your plugin class extending BasePlugin in /src/plugins/
// 2. Add an entry here with enabled: true
// 3. Import and register the plugin in /src/engine/GameEngine.ts
//
// HOW TO DISABLE A PLUGIN:
// Set enabled: false - the plugin will not be initialized
//
// SCHEMA:
// PluginConfigDef {
//   id: string           - Must match the plugin's id property
//   name: string         - Display name for debugging/admin
//   enabled: boolean     - Whether the plugin should be loaded
//   priority?: number    - Load order (lower = earlier, default 100)
//   dependencies?: string[] - Plugin ids that must load before this one
//   config?: object      - Plugin-specific configuration overrides
// }
// ══════════════════════════════════════════════════════════════════════════════

export interface PluginConfigDef {
  id: string;
  name: string;
  enabled: boolean;
  priority?: number;
  dependencies?: string[];
  config?: Record<string, unknown>;
}

// ── CORE PLUGINS ──────────────────────────────────────────────────────────────
// These are required for the game to function. Disabling may cause errors.

export const CORE_PLUGINS: PluginConfigDef[] = [
  { id: 'stage',      name: 'Stage Manager',     enabled: true, priority: 10 },
  { id: 'enemy',      name: 'Enemy Manager',     enabled: true, priority: 20, dependencies: ['stage'] },
  { id: 'tap',        name: 'Tap Damage',        enabled: true, priority: 30 },
  { id: 'gold',       name: 'Gold Economy',      enabled: true, priority: 40 },
  { id: 'modifier',   name: 'Modifier Stack',    enabled: true, priority: 50 },
  { id: 'zone',       name: 'Zone Manager',      enabled: true, priority: 60, dependencies: ['stage'] },
];

// ── PROGRESSION PLUGINS ───────────────────────────────────────────────────────
// Control player progression systems.

export const PROGRESSION_PLUGINS: PluginConfigDef[] = [
  { id: 'hero',       name: 'Hero Upgrades',     enabled: true, priority: 100 },
  { id: 'component',  name: 'DPS Components',    enabled: true, priority: 110 },
  { id: 'skill',      name: 'Active Skills',     enabled: true, priority: 120 },
  { id: 'overclock',  name: 'Prestige System',   enabled: true, priority: 130, dependencies: ['stage'] },
  { id: 'skill_tree', name: 'Skill Tree',        enabled: true, priority: 135, dependencies: ['enemy', 'gold', 'component'] },
  { id: 'relic',      name: 'Relics',            enabled: true, priority: 140, dependencies: ['overclock'] },
];

// ── EQUIPMENT PLUGINS ─────────────────────────────────────────────────────────
// Control item and equipment systems.

export const EQUIPMENT_PLUGINS: PluginConfigDef[] = [
  { id: 'item',       name: 'Item System',       enabled: true, priority: 200 },
  { id: 'mobo',       name: 'Motherboard',       enabled: true, priority: 210, dependencies: ['item'] },
  { id: 'set',        name: 'Set Bonuses',       enabled: true, priority: 220, dependencies: ['item'] },
];

// ── SOCIAL PLUGINS ────────────────────────────────────────────────────────────
// Control multiplayer and social features.

export const SOCIAL_PLUGINS: PluginConfigDef[] = [
  { id: 'clan',       name: 'Clan System',       enabled: true, priority: 300 },
  { id: 'tournament', name: 'Tournaments',       enabled: true, priority: 310 },
  { id: 'leaderboard',name: 'Leaderboards',      enabled: true, priority: 320 },
  { id: 'chat',       name: 'Chat System',       enabled: true, priority: 330 },
];

// ── MONETIZATION PLUGINS ──────────────────────────────────────────────────────
// Control shop and purchase systems.

export const MONETIZATION_PLUGINS: PluginConfigDef[] = [
  { id: 'shop',       name: 'Premium Shop',      enabled: true, priority: 400 },
  { id: 'battlepass', name: 'Battle Pass',       enabled: true, priority: 410 },
  { id: 'daily',      name: 'Daily Challenges',  enabled: true, priority: 420 },
];

// ── UTILITY PLUGINS ───────────────────────────────────────────────────────────
// Control auxiliary features.

export const UTILITY_PLUGINS: PluginConfigDef[] = [
  { id: 'achievement',name: 'Achievements',      enabled: true, priority: 500 },
  { id: 'settings',   name: 'Settings Manager',  enabled: true, priority: 510 },
  { id: 'supabase',   name: 'Cloud Save',        enabled: true, priority: 520 },
  { id: 'offline',    name: 'Offline Progress',  enabled: true, priority: 530, dependencies: ['component'] },
];

// ── COMBINED REGISTRY ─────────────────────────────────────────────────────────

export const ALL_PLUGINS: PluginConfigDef[] = [
  ...CORE_PLUGINS,
  ...PROGRESSION_PLUGINS,
  ...EQUIPMENT_PLUGINS,
  ...SOCIAL_PLUGINS,
  ...MONETIZATION_PLUGINS,
  ...UTILITY_PLUGINS,
];

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Check if a plugin is enabled
 */
export function isPluginEnabled(pluginId: string): boolean {
  const plugin = ALL_PLUGINS.find(p => p.id === pluginId);
  return plugin?.enabled ?? false;
}

/**
 * Get all enabled plugins sorted by priority
 */
export function getEnabledPlugins(): PluginConfigDef[] {
  return ALL_PLUGINS
    .filter(p => p.enabled)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
}

/**
 * Get plugin config by id
 */
export function getPluginConfig(pluginId: string): PluginConfigDef | undefined {
  return ALL_PLUGINS.find(p => p.id === pluginId);
}

/**
 * Check if all dependencies for a plugin are enabled
 */
export function areDependenciesMet(pluginId: string): boolean {
  const plugin = getPluginConfig(pluginId);
  if (!plugin?.dependencies) return true;
  return plugin.dependencies.every(dep => isPluginEnabled(dep));
}
