// ─────────────────────────────────────────────────────────────────────────────
// OVERCLOCK — Central Game Config (v2.0 - Data-Driven Edition)
//
// Every tunable constant in the game lives here. Plugins import from this file;
// they never declare their own magic numbers.
//
// ════════════════════════════════════════════════════════════════════════════
// HOW TO MODIFY GAME CONTENT (QUICK REFERENCE)
// ════════════════════════════════════════════════════════════════════════════
//
// ITEMS:         Scroll to ITEM_CONFIG → ITEM_NAME_POOLS, STAT_CONFIG
// ENEMIES:       Scroll to ENEMY_CONFIG → ENEMY_NAMES
// ZONES/STAGES:  Scroll to ZONE_CONFIG (or see audio.config.ts for music)
// SKILLS:        Scroll to BASE_SKILLS, SKILL_EFFECTS
// COMPONENTS:    Scroll to COMPONENTS (50 idle DPS upgrades)
// SETS:          Scroll to SET_DEFINITIONS
// SHOP:          Scroll to SHOP_CONFIG
// INVENTORY:     See INVENTORY_CONFIG below
// AUDIO:         See audio.config.ts
// PLUGINS:       See plugins.config.ts
//
// Each section includes a schema comment explaining the data format.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ComponentDef,
  SkillDef,
  ModifierDef,
  ItemSlot,
  ItemRarity,
  SetDef,
  SkillId,
} from '../engine/types';

// ── INVENTORY CONFIG ──────────────────────────────────────────────────────────
//
// SCHEMA:
// {
//   baseSlots: number      - Starting inventory slots
//   maxSlots: number       - Maximum inventory slots (with upgrades)
//   slotsPerUpgrade: number - Slots added per inventory upgrade purchase
//   searchableFields: string[] - Which item fields are searchable
// }

export const INVENTORY_CONFIG = {
  /** Starting inventory slots for new players */
  baseSlots: 50,
  /** Maximum inventory slots achievable */
  maxSlots: 500,
  /** Slots added per inventory upgrade */
  slotsPerUpgrade: 10,
  /** Fields that can be searched in inventory */
  searchableFields: ['name', 'slot', 'rarity', 'setId', 'id'] as const,
} as const;

// ── AUTH ──────────────────────────────────────────────────────────────────────

export const AUTH_CONFIG = {
  /**
   * When true, Supabase will send a confirmation email and users must verify
   * their address before they can log in.
   * When false, registration completes immediately — email is stored only for
   * password-reset recovery.
   *
   * NOTE: This flag controls client-side behaviour (skip the confirmation screen,
   * attempt sign-in immediately after sign-up). You must also disable email
   * confirmation in the Supabase dashboard:
   *   Authentication → Providers → Email → "Confirm email" toggle → OFF
   */
  emailConfirmationEnabled: false,

  /**
   * Login is username-based (handle). Email is collected at registration only
   * for account-recovery (password reset) purposes.
   */
  loginWithUsername: true,
} as const;

// ── ENGINE ────────────────────────────────────────────────────────────────────

export const ENGINE_CONFIG = {
  /** Game tick interval in milliseconds. All onTick() calls fire at this rate. */
  tickIntervalMs: 100,
  /** How long BootScreen waits before forcing a safe-mode transition (ms). */
  bootTimeoutMs: 10_000,
  /** Delay after boot() resolves before checking existing auth session (ms). */
  authCheckDelayMs: 300,
} as const;

// ── COMPONENT MILESTONE BONUSES ──────────────────────────────────────────────
// Hardware modules get bonus DPS multipliers at certain level milestones
export const COMPONENT_MILESTONE_CONFIG = {
  /** Enable/disable milestone bonus system */
  enabled: true,
  /** Level interval for milestone bonuses (every N levels) */
  milestoneInterval: 50,
  /** Bonus multiplier per milestone reached (e.g., 0.25 = +25% per milestone) */
  bonusPerMilestone: 0.25,
  /** Maximum number of milestones that count (0 = unlimited) */
  maxMilestones: 0,
  /** 
   * Custom milestone tiers with specific bonuses (optional)
   * If defined, these override the linear bonusPerMilestone for specific levels
   */
  customMilestones: [
    { level: 50,  bonus: 0.25 },  // +25% at level 50
    { level: 100, bonus: 0.50 },  // +50% at level 100
    { level: 150, bonus: 0.75 },  // +75% at level 150
    { level: 200, bonus: 1.00 },  // +100% at level 200
    { level: 250, bonus: 1.50 },  // +150% at level 250
    { level: 300, bonus: 2.00 },  // +200% at level 300
    { level: 400, bonus: 3.00 },  // +300% at level 400
    { level: 500, bonus: 5.00 },  // +500% at level 500
  ],
} as const;

// ── SAVE ─────────────────────────────────────────────────────────────────────

export const SAVE_CONFIG = {
  /** Auto-save interval in milliseconds (5 minutes). */
  autoSaveIntervalMs: 5 * 60 * 1000,
  /** Schema version stamped on every save. Increment when the save shape changes. */
  schemaVersion: 1,
  /** Minimum offline seconds before idle-gold calculation kicks in. */
  offlineMinSeconds: 5,
  /** Fraction of idle DPS credited as offline gold (0.5 = 50%). */
  offlineGoldMultiplier: 0.5,
  /** Maximum offline seconds that count toward idle gold (8 hours). */
  offlineCapSeconds: 8 * 3600,
  /** 
   * Events that trigger an immediate save. These are "important actions" that 
   * should persist progress immediately to prevent data loss.
   */
  saveOnActions: [
    'stage_clear',
    'boss_defeat',
    'overclock_confirm',
    'component_purchase',
    'component_levelup',
    'item_equipped',
    'item_unequipped',
    'mobo_upgrade',
    'achievement_unlocked',
    'shop_purchase',
    'daily_completed',
    'set_completed',
    'hero_upgrade',
    'skill_upgrade',
  ] as const,
  /** Debounce delay (ms) to prevent rapid-fire saves when multiple actions fire quickly. */
  saveDebounceMs: 2000,
  /** Whether action-based saving is enabled. Set to false to only use timed saves. */
  saveOnActionsEnabled: true,
} as const;

// ── SKILL POINTS ─────────────────────────────────────────────────────────────

export const SKILL_POINT_CONFIG = {
  /** Stages at which skill points are awarded. Each milestone grants 1 SP. */
  milestones: [
    50, 100, 150, 200, 250,
    500, 750, 1000,
    1500, 2000, 2500, 3000,
    4000, 5000, 6000, 7000, 8000, 9000, 10000,
    15000, 20000, 25000, 30000, 40000, 50000,
    75000, 100000, 150000, 200000, 250000,
    300000, 400000, 500000, 750000, 999999,
  ],
} as const;

// ── SKILL TREE ───────────────────────────────────────────────────────────────

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  maxLevel: number;
  costPerLevel: number; // SP cost per level
  effect: {
    type: 'tap_damage' | 'crit_chance' | 'crit_damage' | 'gold_bonus' | 'idle_damage' | 'skill_cooldown' | 'boss_damage' | 'elite_damage' | 'all_damage';
    valuePerLevel: number;
    isMultiplier?: boolean; // true = multiplicative, false = additive
    isPercent?: boolean; // for display purposes
  };
  requires?: string[]; // Node IDs that must be unlocked first
  tier: 1 | 2 | 3 | 4 | 5; // Visual tier for positioning
  branch: 'CORE' | 'OFFENSE' | 'DEFENSE' | 'UTILITY' | 'MASTERY';
  color: string;
}

export const SKILL_TREE_CONFIG = {
  nodes: [
    // ════════════════════════════════════════════════════════�����══════════════════
    // TIER 1 - CORE (No requirements, starting nodes)
    // ═══════════════════════════════════════════════════════════════════════════
    { id: 'tap_mastery', name: 'TAP MASTERY', description: '+5% Tap Damage per level', icon: 'Pointer', maxLevel: 10, costPerLevel: 1, effect: { type: 'tap_damage', valuePerLevel: 0.05, isMultiplier: true, isPercent: true }, tier: 1, branch: 'CORE', color: '#00f5ff' },
    { id: 'gold_sense', name: 'GOLD SENSE', description: '+3% Gold per level', icon: 'Coins', maxLevel: 10, costPerLevel: 1, effect: { type: 'gold_bonus', valuePerLevel: 0.03, isMultiplier: true, isPercent: true }, tier: 1, branch: 'CORE', color: '#ffd700' },
    { id: 'idle_protocol', name: 'IDLE PROTOCOL', description: '+5% Idle Damage per level', icon: 'Cpu', maxLevel: 10, costPerLevel: 1, effect: { type: 'idle_damage', valuePerLevel: 0.05, isMultiplier: true, isPercent: true }, tier: 1, branch: 'CORE', color: '#00ff88' },

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 2 - OFFENSE (Requires Tier 1)
    // ═══════════════════════════════════════════════════════════════════════════
    { id: 'critical_systems', name: 'CRITICAL SYSTEMS', description: '+2% Crit Chance per level', icon: 'Crosshair', maxLevel: 10, costPerLevel: 2, effect: { type: 'crit_chance', valuePerLevel: 0.02, isMultiplier: false, isPercent: true }, requires: ['tap_mastery'], tier: 2, branch: 'OFFENSE', color: '#ff4444' },
    { id: 'amplifier', name: 'AMPLIFIER', description: '+10% Crit Damage per level', icon: 'Zap', maxLevel: 10, costPerLevel: 2, effect: { type: 'crit_damage', valuePerLevel: 0.10, isMultiplier: true, isPercent: true }, requires: ['tap_mastery'], tier: 2, branch: 'OFFENSE', color: '#ff8800' },
    { id: 'wealth_algorithm', name: 'WEALTH ALGORITHM', description: '+5% Gold per level', icon: 'TrendingUp', maxLevel: 10, costPerLevel: 2, effect: { type: 'gold_bonus', valuePerLevel: 0.05, isMultiplier: true, isPercent: true }, requires: ['gold_sense'], tier: 2, branch: 'UTILITY', color: '#ffd700' },
    { id: 'passive_income', name: 'PASSIVE INCOME', description: '+8% Idle Damage per level', icon: 'Activity', maxLevel: 10, costPerLevel: 2, effect: { type: 'idle_damage', valuePerLevel: 0.08, isMultiplier: true, isPercent: true }, requires: ['idle_protocol'], tier: 2, branch: 'UTILITY', color: '#00ff88' },

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 3 - SPECIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    { id: 'boss_hunter', name: 'BOSS HUNTER', description: '+8% Boss Damage per level', icon: 'Skull', maxLevel: 10, costPerLevel: 3, effect: { type: 'boss_damage', valuePerLevel: 0.08, isMultiplier: true, isPercent: true }, requires: ['critical_systems', 'amplifier'], tier: 3, branch: 'OFFENSE', color: '#ff0080' },
    { id: 'elite_slayer', name: 'ELITE SLAYER', description: '+10% Elite Damage per level', icon: 'Sword', maxLevel: 10, costPerLevel: 3, effect: { type: 'elite_damage', valuePerLevel: 0.10, isMultiplier: true, isPercent: true }, requires: ['critical_systems'], tier: 3, branch: 'OFFENSE', color: '#aa44ff' },
    { id: 'skill_efficiency', name: 'SKILL EFFICIENCY', description: '-3% Skill Cooldowns per level', icon: 'Clock', maxLevel: 10, costPerLevel: 3, effect: { type: 'skill_cooldown', valuePerLevel: -0.03, isMultiplier: true, isPercent: true }, requires: ['wealth_algorithm', 'passive_income'], tier: 3, branch: 'UTILITY', color: '#00aaff' },

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 4 - ADVANCED
    // ═══════════════════════════════════════════════════════════════════════════
    { id: 'lethal_precision', name: 'LETHAL PRECISION', description: '+3% Crit Chance, +15% Crit Damage per level', icon: 'Target', maxLevel: 5, costPerLevel: 5, effect: { type: 'crit_damage', valuePerLevel: 0.15, isMultiplier: true, isPercent: true }, requires: ['boss_hunter'], tier: 4, branch: 'OFFENSE', color: '#ff2222' },
    { id: 'power_surge', name: 'POWER SURGE', description: '+10% All Damage per level', icon: 'Flame', maxLevel: 5, costPerLevel: 5, effect: { type: 'all_damage', valuePerLevel: 0.10, isMultiplier: true, isPercent: true }, requires: ['elite_slayer'], tier: 4, branch: 'OFFENSE', color: '#ff6600' },
    { id: 'golden_touch', name: 'GOLDEN TOUCH', description: '+10% Gold per level', icon: 'Gem', maxLevel: 5, costPerLevel: 5, effect: { type: 'gold_bonus', valuePerLevel: 0.10, isMultiplier: true, isPercent: true }, requires: ['skill_efficiency'], tier: 4, branch: 'UTILITY', color: '#ffdd00' },

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 5 - MASTERY (Capstone nodes)
    // ═══════════════════════════════════════════════════════════════════════════
    { id: 'overclock_mastery', name: 'OVERCLOCK MASTERY', description: '+15% All Damage per level', icon: 'Rocket', maxLevel: 3, costPerLevel: 10, effect: { type: 'all_damage', valuePerLevel: 0.15, isMultiplier: true, isPercent: true }, requires: ['lethal_precision', 'power_surge'], tier: 5, branch: 'MASTERY', color: '#ff0080' },
    { id: 'infinite_wealth', name: 'INFINITE WEALTH', description: '+15% Gold, +10% Idle Damage per level', icon: 'Crown', maxLevel: 3, costPerLevel: 10, effect: { type: 'gold_bonus', valuePerLevel: 0.15, isMultiplier: true, isPercent: true }, requires: ['golden_touch'], tier: 5, branch: 'MASTERY', color: '#ffd700' },
  ] as SkillTreeNode[],
} as const;

// ── TAP ──────────────────────────────────────────────────────────────────────
//
// ═══════════════════════════════════════════════════════════════════════════════
// GOD FORMULA TAP BALANCE v2.0 - CRIT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
//
// CRIT DESIGN:
// - Base crit chance is low (5%), making each crit feel special
// - Max achievable crit chance: ~75% (requires HEAVY investment)
// - Base crit damage: 2x (not 1.5x - crits should FEEL powerful)
// - Max achievable crit damage: ~15x (with full set + relics + skills)
//
// CRIT SOURCES:
// - Base: 5% chance, 2x damage
// - Hero Upgrades: +25% chance (25 levels * 1%), +2x damage (40 levels * 5%)
// - Skill Tree: +20% chance, +100% damage
// - Items (CPU slot): +0-15% chance per item
// - Set Bonuses: +20-45% chance, +150% damage (Entropy Engine set)
// - Relics (OCT Shop): +15% chance, +200% damage (endgame)
//
// BALANCE PRINCIPLE:
// - Crit builds should be VIABLE but not MANDATORY
// - A 75% crit / 15x damage build does ~11x average damage
// - A 5% crit / 2x damage build with high tap does ~1.05x average damage
// ═══════════════════════════════════════════════════════════════════════════════
// BALANCING NOTE: Players tap at ~12 clicks/second (720 clicks/minute)
// Base DPS from tapping alone = baseDamage * 12 = 12 DPS at level 0
// All damage calculations must account for this high tap rate!
// ═══════════════════════════════════════════════════════════════════════════════

export const TAP_CONFIG = {
  /** Raw tap damage before any modifiers. */
  baseDamage: 1,
  /** Base crit chance (0–1). Very low - crits are a luxury, not baseline */
  baseCritChance: 0.005,
  /** Maximum crit chance achievable (hard cap prevents perma-crit) */
  maxCritChance: 0.25,
  /** Base crit damage multiplier. Crits hurt but don't one-shot */
  baseCritMultiplier: 1.15,
  /** Maximum crit damage multiplier */
  maxCritMultiplier: 2.5,
  /** Window (ms) within which rapid taps build a combo. */
  comboWindowMs: 250,
  /** Number of taps within the window required to activate combo bonus. */
  comboThreshold: 15,
  /** Damage multiplier applied when the combo threshold is met. */
  comboMultiplier: 1.03,
  /** Combo max stacks */
  comboMaxStacks: 3,
  /** Damage bonus per additional combo stack above threshold */
  comboBonusPerStack: 0.005,
} as const;

// ── HERO / TAP UPGRADES ──────────────────────────────────────────────────────
//
// ═══════════════════════════════════════════════════════════════════════════════
// GOD FORMULA HERO UPGRADES v2.0 - BALANCED FOR 999,999 STAGES
// ═══════════════════════════════════════════════════════════════════════════════
//
// DESIGN:
// - TAP POWER: Primary early-game scaling. Soft cap at level 500.
// - CRIT CHANCE: Caps at +25% (level 25). Expensive but essential for crit builds.
// - CRIT DAMAGE: Caps at +2x (level 40). Heavy investment for big payoff.
//
// COST SCALING (per 100 levels of TAP POWER):
// Level 1: 15 gold
// Level 100: ~6,000 gold
// Level 200: ~2.4M gold
// Level 300: ~960M gold
// Level 400: ~384B gold
// Level 500: ~154T gold (soft cap - need other systems)
//
// TAP POWER VALUE PER LEVEL:
// Early (1-100): +2 damage per level (linear feels good)
// Mid (101-300): +5 damage per level
// Late (301-500): +10 damage per level
// (Total at 500: 2*100 + 5*200 + 10*200 = 3,200 base tap damage)
// ═══════════════════════════════════════════════════════════════════════════════

export interface HeroUpgradeDef {
  id: string;
  name: string;
  description: string;
  /** Base cost at level 0 */
  baseCost: number;
  /** Cost multiplier per level (exponential growth) */
  costMultiplier: number;
  /** Maximum achievable level (9999 = effectively unlimited) */
  maxLevel: number;
  /** Modifier type this upgrade affects */
  modifierType: 'tap_damage' | 'crit_chance' | 'crit_multiplier';
  /** Value added per level */
  valuePerLevel: number;
  /** If true, stacks multiplicatively; if false, additively */
  isMultiplier: boolean;
  /** UI color */
  color: string;
  /** UI icon */
  icon: string;
}

export const HERO_CONFIG = {
  /** 
   * Hero upgrade definitions
   * BALANCED FOR 12 TAPS/SECOND - progression must be earned
   */
  upgrades: [
    {
      id: 'hero_tap_power',
      name: 'TAP POWER',
      description: 'Increase base tap damage',
      baseCost: 15,
      costMultiplier: 1.15,        // Steeper curve - upgrades matter more
      maxLevel: 500,               // Soft cap - need other systems beyond
      modifierType: 'tap_damage',
      valuePerLevel: 1,            // +1 tap damage per level (was 2)
      isMultiplier: false,
      color: '#00f5ff',
      icon: '👆',
    },
    {
      id: 'hero_crit_chance',
      name: 'CRIT CHANCE',
      description: 'Increase critical hit chance',
      baseCost: 500,
      costMultiplier: 1.35,        // Steep - crits are powerful with 12 taps/s
      maxLevel: 20,                // Caps at +10% crit chance (10.5% total)
      modifierType: 'crit_chance',
      valuePerLevel: 0.005,        // +0.5% crit chance per level (was 1%)
      isMultiplier: false,
      color: '#ff0080',
      icon: '⚡',
    },
    {
      id: 'hero_crit_damage',
      name: 'CRIT DAMAGE',
      description: 'Increase critical damage multiplier',
      baseCost: 800,
      costMultiplier: 1.40,        // Very steep - multipliers are dangerous
      maxLevel: 25,                // Caps at +0.625x crit damage (1.775x total)
      modifierType: 'crit_multiplier',
      valuePerLevel: 0.025,        // +2.5% crit damage per level (was 5%)
      isMultiplier: false,
      color: '#ffaa00',
      icon: '💥',
    },
  ] as HeroUpgradeDef[],

  /** 
   * Bulk purchase options (buy N levels at once)
   * UI shows these as quick-buy buttons
   */
  bulkPurchaseOptions: [1, 10, 25, 100, 'MAX'] as (number | 'MAX')[],
} as const;

/** Calculate cost for a specific hero upgrade at a given level */
export function getHeroUpgradeCost(upgrade: HeroUpgradeDef, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

/** Calculate total cost to purchase N levels starting from currentLevel */
export function getHeroUpgradeBulkCost(upgrade: HeroUpgradeDef, currentLevel: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getHeroUpgradeCost(upgrade, currentLevel + i);
  }
  return total;
}

/** Get total stat bonus from hero upgrade at given level */
export function getHeroUpgradeValue(upgrade: HeroUpgradeDef, level: number): number {
  return upgrade.valuePerLevel * level;
}

// ── SKILL UPGRADES ───────────────────────────────────────────────────────────
//
// BALANCE NOTES:
// - Each skill upgrade increases that skill's effectiveness by 5% per level
// - Max 50 levels = +250% effectiveness (3.5x power)
// - Skills have different base costs reflecting their power:
//   - SURGE (tap buff): cheapest, bread-and-butter skill
//   - GOLD RUSH: slightly more expensive (gold is valuable)
//   - CHAIN HACK: mid-tier (auto-tap is passive income)
//   - FIREWALL: higher cost (boss timer is critical)
//   - OC PULSE: most expensive (affects both damage and idle)
//
// FORMULA: upgradeCost(level) = baseCost * costMultiplier^level
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillUpgradeDef {
  /** Must match a SkillId from SKILLS_CONFIG */
  skillId: SkillId;
  name: string;
  description: string;
  /** Base cost at level 0 */
  baseCost: number;
  /** Cost multiplier per level */
  costMultiplier: number;
  /** Maximum level */
  maxLevel: number;
  /** Effectiveness increase per level (0.05 = +5%) */
  effectPerLevel: number;
  /** UI color */
  color: string;
}

export const SKILL_UPGRADE_CONFIG = {
  /** 
   * Skill upgrade definitions
   * Each level increases skill effectiveness by effectPerLevel
   */
  upgrades: [
    {
      skillId: 'surge' as SkillId,
      name: 'SURGE',
      description: 'Boost tap damage buff duration & power',
      baseCost: 100,
      costMultiplier: 1.20,        // ~6.2x cost every 10 levels
      maxLevel: 50,
      effectPerLevel: 0.05,        // +5% effectiveness per level
      color: '#00f5ff',
    },
    {
      skillId: 'gold_rush' as SkillId,
      name: 'GOLD RUSH',
      description: 'Boost gold bonus duration & power',
      baseCost: 150,
      costMultiplier: 1.20,
      maxLevel: 50,
      effectPerLevel: 0.05,
      color: '#ffaa00',
    },
    {
      skillId: 'firewall' as SkillId,
      name: 'FIREWALL',
      description: 'Boost boss timer freeze duration',
      baseCost: 250,
      costMultiplier: 1.25,
      maxLevel: 50,
      effectPerLevel: 0.05,
      color: '#ff4444',
    },
    {
      skillId: 'overclock_pulse' as SkillId,
      name: 'OC PULSE',
      description: 'Boost damage & idle multiplier',
      baseCost: 300,
      costMultiplier: 1.30,        // ~13.8x cost every 10 levels
      maxLevel: 50,
      effectPerLevel: 0.05,
      color: '#ff0080',
    },
  ] as SkillUpgradeDef[],

  /** Bulk purchase options for skill upgrades */
  bulkPurchaseOptions: [1, 10, 25] as number[],
} as const;

/** Calculate cost for a specific skill upgrade at a given level */
export function getSkillUpgradeCost(upgrade: SkillUpgradeDef, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

/** Calculate total cost to purchase N levels starting from currentLevel */
export function getSkillUpgradeBulkCost(upgrade: SkillUpgradeDef, currentLevel: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getSkillUpgradeCost(upgrade, currentLevel + i);
  }
  return total;
}

/** Get skill effectiveness multiplier at given upgrade level (1.0 = base, 2.5 = +150%) */
export function getSkillEffectivenessMultiplier(upgrade: SkillUpgradeDef, level: number): number {
  return 1 + (upgrade.effectPerLevel * level);
}

// ── ENEMY ─────────────────────────────────────────────────────────────────────
//
// ═══════════════════════════════════════════════════════════════════════════════
// GOD FORMULA v2.0 - BALANCED FOR MAX STAGE 999,999
// ═══════════════════════════════════════════════════════════════════════════════
//
// DESIGN PHILOSOPHY:
// - Progress should feel EARNED, not automatic
// - Each era has distinct gameplay and strategies
// - Prestige is the solution to walls, not grinding
// - Late game rewards investment across ALL systems
//
// ERA BREAKDOWN:
// Era 1 (1-100):      Tutorial - Learn tapping, buy first upgrades
// Era 2 (101-500):    Foundation - Skills, Hardware, basic combos
// Era 3 (501-2000):   Growth - First prestige, relics, skill tree
// Era 4 (2001-10000): Expansion - Multiple prestiges, set farming
// Era 5 (10001-50000): Mastery - Full builds, optimal strategies
// Era 6 (50001-200000): Endgame - Min-maxing, rare sets
// Era 7 (200001-999999): Infinite - Prestige hunting, leaderboards
// ═══════════════════════════════════════════════════════════════════════════════

// ── ENEMY CONFIG ──────────────────────────────────────────────────────────────
//
// HOW TO ADD NEW ENEMIES:
// 1. Add new name to ENEMY_NAMES arrays below (normalNames, bossNames, eliteNames)
// 2. Names are randomly picked based on zone - add zone-specific variants as needed
//
// HOW TO ADD ENEMY TYPES WITH SPECIAL BEHAVIOR:
// 1. Add to ENEMY_TYPE_DEFS with unique id, display name, and modifiers
// 2. Reference the type in EnemyPlugin spawn logic
//
// SCHEMA for ENEMY_NAMES entries: string[] - Just add names to the array
// SCHEMA for ENEMY_TYPE_DEFS (future):
// {
//   id: string           - Unique enemy type id
//   name: string         - Display name prefix
//   hpMultiplier: number - HP multiplier (1.0 = normal)
//   goldMultiplier: number - Gold drop multiplier
//   dropRateBonus: number - Added to drop chance
//   abilities?: string[] - Special ability ids
// }

export const ENEMY_CONFIG = {
  /** Number of phases (enemies) per stage. Boss spawns at the last phase. */
  phasesPerStage: 10,
  /** Seconds before a boss times out and the player is sent back. */
  bossTimeoutSeconds: 30,
  /** Minimum stage before elite enemies can appear. */
  eliteMinStage: 10,
  /** Probability (0–1) that a non-boss enemy is elite. */
  eliteChance: 0.08,
  /** HP multiplier for elite enemies. */
  eliteHpMultiplier: 3,
  /** Gold multiplier for elite kills. */
  eliteGoldMultiplier: 2,
  /** Boss gold multiplier. */
  bossGoldMultiplier: 5,
  /** Gold multiplier for normal enemy kills. */
  normalGoldMultiplier: 1,
  /** Boss phase triggers when HP drops below this fraction of max. */
  bossPhaseThreshold: 0.5,
  /** Damage multiplier when boss is in shield phase. */
  bossShieldDamageMultiplier: 0.2,
  /** Fraction of max HP regenerated per second in regen phase. */
  bossRegenRatePerSecond: 0.02,
  
  // ═════════════════════════════════════════��═════════════════════════════════
  // GOD FORMULA - HP SCALING TO 999,999
  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCED FOR 12 TAPS/SECOND (720 taps/minute)
  // At stage 1: Player does ~12 DPS, enemy has ~50 HP = ~4 seconds to kill
  // At stage 50: Player does ~50-100 DPS, enemy has ~2000 HP = ~20-40 seconds
  // At stage 100: Player does ~150 DPS, enemy has ~8000 HP = ~50+ seconds (need upgrades)
  // ═══════════════════════════════════════════════════════════════════════════
  
  normalHpBase: 50,
  bossHpBase: 300,
  
  // Era 1: Stages 1-100 (Tutorial)
  // HP at 1: ~55, HP at 50: ~2000, HP at 100: ~8000
  era1LinearGrowth: 0.8,
  era1Exponent: 1.065,
  era1ExponentInterval: 3,
  era1MaxStage: 100,
  
  // Era 2: Stages 101-500 (Foundation)
  // HP at 500: ~50,000
  era2Exponent: 1.025,
  era2ExponentInterval: 4,
  era2MaxStage: 500,
  
  // Era 3: Stages 501-2000 (Growth)
  // HP at 2000: ~5,000,000
  era3Exponent: 1.018,
  era3ExponentInterval: 3,
  era3MaxStage: 2000,
  
  // Era 4: Stages 2001-10000 (Expansion)
  // HP at 10000: ~500,000,000
  era4Exponent: 1.012,
  era4ExponentInterval: 2,
  era4MaxStage: 10000,
  
  // Era 5: Stages 10001-50000 (Mastery)
  // HP at 50000: ~50 trillion
  era5Exponent: 1.008,
  era5ExponentInterval: 2,
  era5MaxStage: 50000,
  
  // Era 6: Stages 50001-200000 (Endgame)
  // HP at 200000: ~5 quintillion
  era6Exponent: 1.005,
  era6ExponentInterval: 2,
  era6MaxStage: 200000,
  
  // Era 7: Stages 200001-999999 (Infinite)
  // HP at 999999: ~astronomical (10^30+)
  era7Exponent: 1.003,
  era7ExponentInterval: 2,

  // Legacy (deprecated - kept for compatibility)
  phase1MaxStage: 100,
  phase2MaxStage: 500,
  phase3MaxStage: 2000,
  phase1LinearGrowth: 0.25,
  phase1Exponent: 1.035,
  phase1ExponentInterval: 5,
  phase2Exponent: 1.025,
  phase2ExponentInterval: 4,
  phase3Exponent: 1.018,
  phase3ExponentInterval: 3,
  phase4Exponent: 1.012,
  phase4ExponentInterval: 2,
  linearGrowth: 0.25,
  scalingExponentEarly: 1.035,
  scalingExponentLate: 1.012,
  hardModeStage: 500,

  /** 
   * Monster definitions with stage ranges.
   * Monsters rotate based on era for variety.
   */
  monsters: [
    // Era 1-2 (1-500)
    { name: 'NULL_PROCESS_ENTITY', minStage: 1, maxStage: 500 },
    { name: 'CACHE_BREAKER', minStage: 1, maxStage: 500 },
    { name: 'ADWARE_GLITCHLING', minStage: 1, maxStage: 500 },
    { name: 'FIREWALL_ORPHAN', minStage: 1, maxStage: 1000 },
    { name: 'OVERCLOCK_ERROR', minStage: 1, maxStage: 1000 },
    // Era 2-3 (101-2000)
    { name: 'KERNEL_LEAK_SPAWN', minStage: 100, maxStage: 2000 },
    { name: 'AUTOUPDATE_HORROR', minStage: 100, maxStage: 2000 },
    { name: 'DEBUG_SPECTER', minStage: 200, maxStage: 5000 },
    { name: 'SYSTEM_POPUP_PREDATOR', minStage: 200, maxStage: 5000 },
    { name: 'SYNC_FAILURE_CORE', minStage: 500, maxStage: 10000 },
    // Era 4-5 (2001-50000)
    { name: 'MEMORY_CORRUPTION_WRAITH', minStage: 2000, maxStage: 50000 },
    { name: 'STACK_OVERFLOW_DAEMON', minStage: 2000, maxStage: 50000 },
    { name: 'RACE_CONDITION_PHANTOM', minStage: 5000, maxStage: 100000 },
    { name: 'DEADLOCK_HORROR', minStage: 10000, maxStage: 200000 },
    // Era 6-7 (50001-999999)
    { name: 'QUANTUM_DECOHERENCE', minStage: 50000, maxStage: 999999 },
    { name: 'ENTROPY_COLLAPSE', minStage: 100000, maxStage: 999999 },
    { name: 'VOID_RECURSION', minStage: 200000, maxStage: 999999 },
    { name: 'SINGULARITY_SPAWN', minStage: 500000, maxStage: 999999 },
  ] as { name: string; minStage: number; maxStage: number }[],

  /** 
   * Elite definitions with stage ranges.
   */
  elites: [
    { name: 'RECURSIVE_UPGRADE_MISTAKE', minStage: 10, maxStage: 1000 },
    { name: 'UNAUTHORIZED_PROCESS_AGENT', minStage: 10, maxStage: 2000 },
    { name: 'MEMORY_DRIFT_ENFORCER', minStage: 100, maxStage: 5000 },
    { name: 'PATCH_NOTES_ABERRATION', minStage: 500, maxStage: 20000 },
    { name: 'SYNTHETIC_FAILURE_UNIT', minStage: 1000, maxStage: 50000 },
    { name: 'QUANTUM_ENTANGLE_ELITE', minStage: 10000, maxStage: 200000 },
    { name: 'DARK_MATTER_SENTINEL', minStage: 50000, maxStage: 999999 },
    { name: 'OMEGA_PROCESS_GUARDIAN', minStage: 200000, maxStage: 999999 },
  ] as { name: string; minStage: number; maxStage: number }[],

  /** 
   * Boss definitions with stage ranges.
   */
  bosses: [
    { name: 'THE_PATCH_THAT_NEVER_FINISHED', minStage: 1, maxStage: 500 },
    { name: 'CORE_SYSTEM_AUTONOMY', minStage: 1, maxStage: 1000 },
    { name: 'ADMINISTRATIVE_GOD_PROCESS', minStage: 100, maxStage: 2000 },
    { name: 'THE_INFINITE_LOOP', minStage: 500, maxStage: 10000 },
    { name: 'KERNEL_PANIC_PRIME', minStage: 2000, maxStage: 50000 },
    { name: 'STACK_SMASHER_SUPREME', minStage: 10000, maxStage: 200000 },
    { name: 'QUANTUM_OBSERVER', minStage: 50000, maxStage: 500000 },
    { name: 'THE_FINAL_SEGFAULT', minStage: 200000, maxStage: 999999 },
    { name: 'OMEGA_NULL_ENTITY', minStage: 500000, maxStage: 999999 },
  ] as { name: string; minStage: number; maxStage: number }[],
} as const;

// ── OVERCLOCK ──────────────────────────────────────────���─��────────────────────

export type PerkBranch = 'VOLTAGE' | 'SIGNAL' | 'THERMAL' | 'ENTROPY' | 'QUANTUM';

export interface OverclockPerkDef {
  id: string;
  name: string;
  flavor: string;
  description: string;
  branch: PerkBranch;
  branchRank: number;
  maxLevel: number;
  costPerLevel: number;
  modifierType: ModifierDef['type'];
  valuePerLevel: number;
  isMultiplier: boolean;
  color: string;
  requiresTier?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOD FORMULA PRESTIGE SYSTEM v2.0 - BALANCED FOR 999,999 STAGES
// ═══════════════════════════════════════════════════════════════════════════════
//
// PRESTIGE PROGRESSION:
// - First prestige at stage 100 (tutorial complete)
// - Optimal first prestige: stage 150-200 (1-3 OCP)
// - Mid-game prestige: stage 500-1000 (10-20 OCP)
// - Late-game prestige: stage 5000+ (100+ OCP)
// - Endgame prestige: stage 50000+ (1000+ OCP)
//
// OCP FORMULA:
// Base OCP = floor(stage / 50) for stages 100-500
// Base OCP = floor(stage / 25) for stages 500-5000
// Base OCP = floor(stage / 10) for stages 5000+
// Tier multiplier: 1.0 + (tier * 0.25)
// Milestone bonuses: Add significant jumps at key stages
// ═══════════════════════════════════════════════════════════════════════════════

export const OVERCLOCK_CONFIG = {
  /** Minimum highestStage required before the player can prestige. */
  minStageToOverclock: 50,
  /** Base stages per OCP (era 1) */
  stagesPerOCPEra1: 50,
  /** Threshold for era 2 OCP scaling */
  ocpEra2Stage: 500,
  /** Base stages per OCP (era 2) */
  stagesPerOCPEra2: 25,
  /** Threshold for era 3 OCP scaling */
  ocpEra3Stage: 5000,
  /** Base stages per OCP (era 3) */
  stagesPerOCPEra3: 10,
  /** Threshold for era 4 OCP scaling */
  ocpEra4Stage: 50000,
  /** Base stages per OCP (era 4) */
  stagesPerOCPEra4: 5,
  /** Number of prestige runs per tier progression. */
  runsPerTier: 3,
  /** Maximum achievable tier. */
  maxTier: 20,
  /** OCP multiplier increase per tier (tier * this value added to base 1.0). */
  tierMultiplierPerTier: 0.25,
  /** Legacy field - kept for compatibility */
  stagesPerOCT: 50,
  
  /** Milestone stage -> bonus OCPs awarded on reaching that stage. */
  milestones: [
    { stage: 100,    bonus: 1   },
    { stage: 150,    bonus: 2   },
    { stage: 200,    bonus: 3   },
    { stage: 300,    bonus: 5   },
    { stage: 500,    bonus: 10  },
    { stage: 750,    bonus: 15  },
    { stage: 1000,   bonus: 25  },
    { stage: 1500,   bonus: 40  },
    { stage: 2000,   bonus: 60  },
    { stage: 3000,   bonus: 100 },
    { stage: 5000,   bonus: 200 },
    { stage: 7500,   bonus: 350 },
    { stage: 10000,  bonus: 500 },
    { stage: 15000,  bonus: 800 },
    { stage: 20000,  bonus: 1200 },
    { stage: 30000,  bonus: 2000 },
    { stage: 50000,  bonus: 4000 },
    { stage: 75000,  bonus: 7000 },
    { stage: 100000, bonus: 12000 },
    { stage: 150000, bonus: 20000 },
    { stage: 200000, bonus: 35000 },
    { stage: 300000, bonus: 60000 },
    { stage: 500000, bonus: 120000 },
    { stage: 750000, bonus: 200000 },
    { stage: 999999, bonus: 500000 },
  ] as { stage: number; bonus: number }[],
  
  /** Display name for each tier (index = tier number). */
  tierNames: [
    'STOCK',             // 0
    'OVERCLOCKED',       // 1
    'MODDED',            // 2
    'JAILBROKEN',        // 3
    'KERNEL HACKED',     // 4
    'SILICON GHOST',     // 5
    'QUANTUM FORK',      // 6
    'DARK SILICON',      // 7
    'PHANTOM LOOP',      // 8
    'SINGULARITY',       // 9
    'OMEGA PRIME',       // 10
    'VOID WALKER',       // 11
    'ENTROPY LORD',      // 12
    'TIME BREAKER',      // 13
    'DIMENSION SHIFTER', // 14
    'REALITY HACKER',    // 15
    'COSMIC ENTITY',     // 16
    'INFINITE RECURSION',// 17
    'THE ARCHITECT',     // 18
    'GOD TIER',          // 19
    'TRANSCENDENT',      // 20
  ] as string[],

  branchColors: {
    VOLTAGE: '#00f5ff',
    SIGNAL:  '#ffaa00',
    THERMAL: '#39ff14',
    ENTROPY: '#ff4444',
    QUANTUM: '#cc44ff',
  } as Record<PerkBranch, string>,
} as const;

// ── OVERCLOCK PERKS ─────────────────────────────────────────────────────────
//
// STRATEGIC BUILD SYSTEM:
// Each branch has a distinct playstyle. Late game requires choosing a focus:
//
// VOLTAGE (Blue)  - Active tap builds: Crit stacking, burst damage
// SIGNAL (Gold)   - Economy builds: Fast progression, gold farming
// THERMAL (Green) - Idle builds: AFK damage, passive income
// ENTROPY (Red)   - Hybrid builds: Jack-of-all-trades, late unlocks
// QUANTUM (Purple)- Synergy builds: Boost other branches, tier-gated
//
// Strategy: Players can't max everything. Must choose 2-3 branches to focus.

export const OVERCLOCK_PERKS: OverclockPerkDef[] = [
  // ── VOLTAGE — Active tap builds, crit stacking ────────────────────────────
  { id: 'voltage_spike',    name: 'VOLTAGE_SPIKE',    branch: 'VOLTAGE', branchRank: 1, maxLevel: 5, costPerLevel: 5,   modifierType: 'tap_damage',      valuePerLevel: 0.08, isMultiplier: true,  color: '#00f5ff',            flavor: 'Raw current through every keystroke.',    description: '+8% tap damage' },
  { id: 'zero_day',         name: 'ZERO_DAY',         branch: 'VOLTAGE', branchRank: 2, maxLevel: 4, costPerLevel: 12,  modifierType: 'crit_chance',     valuePerLevel: 0.02, isMultiplier: false, color: '#00d4e8', requiresTier: 1,  flavor: 'Exploit before the patch drops.',         description: '+2% crit chance' },
  { id: 'exploit_chain',    name: 'EXPLOIT_CHAIN',    branch: 'VOLTAGE', branchRank: 3, maxLevel: 3, costPerLevel: 25,  modifierType: 'crit_multiplier', valuePerLevel: 0.15, isMultiplier: false, color: '#00b8cc', requiresTier: 3,  flavor: 'Cascade vulnerabilities.',                description: '+15% crit damage' },
  { id: 'voltage_overdrive',name: 'VOLTAGE_OVERDRIVE',branch: 'VOLTAGE', branchRank: 4, maxLevel: 3, costPerLevel: 50,  modifierType: 'tap_damage',      valuePerLevel: 0.15, isMultiplier: true,  color: '#00a0bc', requiresTier: 6,  flavor: 'Fuse the limiter.',                       description: '+15% tap damage' },
  { id: 'arc_singularity',  name: 'ARC_SINGULARITY',  branch: 'VOLTAGE', branchRank: 5, maxLevel: 2, costPerLevel: 100, modifierType: 'crit_chance',     valuePerLevel: 0.03, isMultiplier: false, color: '#0088aa', requiresTier: 10, flavor: 'Current becomes consciousness.',          description: '+3% crit chance' },

  // ── SIGNAL — Economy builds, gold farming ─────────────────────────────────
  { id: 'ghost_protocol',   name: 'GHOST_PROTOCOL',   branch: 'SIGNAL',  branchRank: 1, maxLevel: 5, costPerLevel: 5,   modifierType: 'gold_rate',       valuePerLevel: 0.08, isMultiplier: true,  color: '#ffaa00',            flavor: 'Route gold through hidden channels.',     description: '+8% gold rate' },
  { id: 'dead_drop',        name: 'DEAD_DROP',        branch: 'SIGNAL',  branchRank: 2, maxLevel: 4, costPerLevel: 12,  modifierType: 'gold_rate',       valuePerLevel: 0.12, isMultiplier: true,  color: '#e89500', requiresTier: 1,  flavor: 'Stashed cache for every run.',            description: '+12% gold rate' },
  { id: 'data_launder',     name: 'DATA_LAUNDER',     branch: 'SIGNAL',  branchRank: 3, maxLevel: 3, costPerLevel: 25,  modifierType: 'gold_rate',       valuePerLevel: 0.18, isMultiplier: true,  color: '#cc8400', requiresTier: 3,  flavor: 'Clean dirty signals into throughput.',    description: '+18% gold rate' },
  { id: 'signal_fracture',  name: 'SIGNAL_FRACTURE',  branch: 'SIGNAL',  branchRank: 4, maxLevel: 3, costPerLevel: 50,  modifierType: 'gold_rate',       valuePerLevel: 0.25, isMultiplier: true,  color: '#aa7000', requiresTier: 6,  flavor: 'Shatter the carrier wave.',               description: '+25% gold rate' },
  { id: 'dark_signal',      name: 'DARK_SIGNAL',      branch: 'SIGNAL',  branchRank: 5, maxLevel: 2, costPerLevel: 100, modifierType: 'gold_rate',       valuePerLevel: 0.35, isMultiplier: true,  color: '#885c00', requiresTier: 10, flavor: 'Transmissions from the black market.',    description: '+35% gold rate' },

  // ── THERMAL — Idle builds, passive damage ─────────────────────────────────
  { id: 'phantom_thread',    name: 'PHANTOM_THREAD',    branch: 'THERMAL', branchRank: 1, maxLevel: 5, costPerLevel: 5,   modifierType: 'idle_dps', valuePerLevel: 0.08, isMultiplier: true, color: '#39ff14',            flavor: 'Silent processes in the dark.',           description: '+8% idle DPS' },
  { id: 'thermal_runaway',   name: 'THERMAL_RUNAWAY',   branch: 'THERMAL', branchRank: 2, maxLevel: 4, costPerLevel: 12,  modifierType: 'idle_dps', valuePerLevel: 0.12, isMultiplier: true, color: '#29dd09', requiresTier: 1,  flavor: 'Controlled meltdown.',                    description: '+12% idle DPS' },
  { id: 'neural_overclock',  name: 'NEURAL_OVERCLOCK',  branch: 'THERMAL', branchRank: 3, maxLevel: 3, costPerLevel: 25,  modifierType: 'idle_dps', valuePerLevel: 0.18, isMultiplier: true, color: '#19bb00', requiresTier: 3,  flavor: 'CPU and flesh become one.',               description: '+18% idle DPS' },
  { id: 'absolute_zero',     name: 'ABSOLUTE_ZERO',     branch: 'THERMAL', branchRank: 4, maxLevel: 3, costPerLevel: 50,  modifierType: 'idle_dps', valuePerLevel: 0.25, isMultiplier: true, color: '#0d9900', requiresTier: 6,  flavor: 'Cool silicon to the void.',               description: '+25% idle DPS' },
  { id: 'thermal_apotheosis',name: 'THERMAL_APOTHEOSIS',branch: 'THERMAL', branchRank: 5, maxLevel: 2, costPerLevel: 100, modifierType: 'idle_dps', valuePerLevel: 0.35, isMultiplier: true, color: '#0a7700', requiresTier: 10, flavor: 'The machine transcends heat.',            description: '+35% idle DPS' },

  // ── ENTROPY — Hybrid builds, late-game chaos ──────────────────────────────
  { id: 'exploit_entropy',  name: 'EXPLOIT_ENTROPY',  branch: 'ENTROPY', branchRank: 1, maxLevel: 4, costPerLevel: 8,   modifierType: 'tap_damage',      valuePerLevel: 0.10, isMultiplier: true,  color: '#ff4444', requiresTier: 2,  flavor: 'Chaos is your weapon.',                   description: '+10% tap damage' },
  { id: 'void_shell',       name: 'VOID_SHELL',       branch: 'ENTROPY', branchRank: 2, maxLevel: 3, costPerLevel: 18,  modifierType: 'gold_rate',       valuePerLevel: 0.15, isMultiplier: true,  color: '#dd2222', requiresTier: 4,  flavor: 'Rip gold from the void.',                 description: '+15% gold rate' },
  { id: 'apex_protocol',    name: 'APEX_PROTOCOL',    branch: 'ENTROPY', branchRank: 3, maxLevel: 3, costPerLevel: 35,  modifierType: 'idle_dps',        valuePerLevel: 0.20, isMultiplier: true,  color: '#bb0000', requiresTier: 6,  flavor: 'All limits dissolved.',                   description: '+20% idle DPS' },
  { id: 'entropy_cascade',  name: 'ENTROPY_CASCADE',  branch: 'ENTROPY', branchRank: 4, maxLevel: 2, costPerLevel: 65,  modifierType: 'crit_multiplier', valuePerLevel: 0.20, isMultiplier: false, color: '#990000', requiresTier: 9,  flavor: 'Every ending is a strike.',               description: '+20% crit damage' },
  { id: 'null_storm',       name: 'NULL_STORM',       branch: 'ENTROPY', branchRank: 5, maxLevel: 2, costPerLevel: 120, modifierType: 'tap_damage',      valuePerLevel: 0.25, isMultiplier: true,  color: '#770000', requiresTier: 12, flavor: 'The system deletes itself.',              description: '+25% tap damage' },

  // ── QUANTUM — Synergy builds, multiplies other branches ───────────────────
  { id: 'superposition',    name: 'SUPERPOSITION',    branch: 'QUANTUM', branchRank: 1, maxLevel: 3, costPerLevel: 15,  modifierType: 'crit_multiplier', valuePerLevel: 0.15, isMultiplier: false, color: '#cc44ff', requiresTier: 3,  flavor: 'Strike from two states at once.',         description: '+15% crit damage' },
  { id: 'entanglement',     name: 'ENTANGLEMENT',     branch: 'QUANTUM', branchRank: 2, maxLevel: 3, costPerLevel: 30,  modifierType: 'idle_dps',        valuePerLevel: 0.18, isMultiplier: true,  color: '#aa22dd', requiresTier: 5,  flavor: 'Linked states share damage.',             description: '+18% idle DPS' },
  { id: 'wave_collapse',    name: 'WAVE_COLLAPSE',    branch: 'QUANTUM', branchRank: 3, maxLevel: 3, costPerLevel: 50,  modifierType: 'gold_rate',       valuePerLevel: 0.22, isMultiplier: true,  color: '#8800bb', requiresTier: 7,  flavor: 'Probability always favours you.',         description: '+22% gold rate' },
  { id: 'quantum_tunneling',name: 'QUANTUM_TUNNELING',branch: 'QUANTUM', branchRank: 4, maxLevel: 2, costPerLevel: 80,  modifierType: 'tap_damage',      valuePerLevel: 0.28, isMultiplier: true,  color: '#660099', requiresTier: 9,  flavor: 'Pass through every defence.',             description: '+28% tap damage' },
  { id: 'decoherence',      name: 'DECOHERENCE',      branch: 'QUANTUM', branchRank: 5, maxLevel: 2, costPerLevel: 140, modifierType: 'crit_chance',     valuePerLevel: 0.03, isMultiplier: false, color: '#440077', requiresTier: 12, flavor: 'Reality yields to your attacks.',         description: '+3% crit chance' },
];

// ── SKILLS ──────────────────────────�����─────────────────────────────────────────
//
// BALANCE NOTES - 4 strategic skills with meaningful tradeoffs:
// - SURGE: Moderate tap boost, short duration, use for burst DPS
// - OC PULSE: Idle boost, longer duration, set-and-forget
// - GOLD RUSH: Gold multiplier, use before big kills
// - FIREWALL: Boss timer freeze, critical for hard bosses
//
// Late-game strategy: Combine skills with OV perks for synergies
// Each skill has distinct purpose - no "always use" skill

export const BASE_SKILLS: SkillDef[] = [
  { id: 'surge',           name: 'SURGE',     description: 'Tap damage x1.5 for 4s',      cooldown: 45,  duration: 4,  color: '#00f5ff', icon: 'Zap',    unlockStage: 1  },
  { id: 'overclock_pulse', name: 'OC PULSE',  description: 'Idle DPS x1.5 for 6s',       cooldown: 60,  duration: 6, color: '#ff0080', icon: 'Cpu',    unlockStage: 5  },
  { id: 'gold_rush',       name: 'GOLD RUSH', description: 'Gold gain x1.25 for 8s',     cooldown: 70,  duration: 8, color: '#ffaa00', icon: 'Coins',  unlockStage: 10 },
  { id: 'firewall',        name: 'FIREWALL',  description: 'Boss timer freeze 5s',       cooldown: 100, duration: 5, color: '#39ff14', icon: 'Shield', unlockStage: 15 },
];

export const ALL_SKILLS: SkillDef[] = [...BASE_SKILLS];

/** Modifiers applied when each skill is active (used by SkillPlugin). */
export const SKILL_EFFECTS: Record<SkillId, { modifierType: ModifierDef['type']; value: number; isMultiplier: boolean }[]> = {
  surge:            [{ modifierType: 'tap_damage', value: 1.5,  isMultiplier: true  }],
  overclock_pulse:  [{ modifierType: 'idle_dps',   value: 1.5,  isMultiplier: true  }],
  gold_rush:        [{ modifierType: 'gold_rate',  value: 1.25, isMultiplier: true  }],
  firewall:         [],
};

// ── COMPONENTS ────────────────────────────────────────────────────────────────

export const INITIAL_COMPONENTS: ComponentDef[] = [
  { id: 'gpu',            name: 'GPU_UNIT',            description: 'Parallel damage processor',          baseDps: 0.2,                           baseCost: 10,                                    costMultiplier: 1.18, level: 0, unlocked: true,  color: 'cyan'  },
  { id: 'ram',            name: 'RAM_BANK',            description: 'Buffer overflow exploit',             baseDps: 0.8,                           baseCost: 100,                                   costMultiplier: 1.20, level: 0, unlocked: false, color: 'green' },
  { id: 'cpu_cooler',     name: 'CPU_COOLER',          description: 'Thermal attack array',                baseDps: 3,                             baseCost: 1_000,                                 costMultiplier: 1.22, level: 0, unlocked: false, color: 'amber' },
  { id: 'ssd',            name: 'SSD_DRIVE',           description: 'High-speed data injection',           baseDps: 12,                            baseCost: 10_000,                                costMultiplier: 1.24, level: 0, unlocked: false, color: 'pink'  },
  { id: 'psu',            name: 'PSU_CORE',            description: 'Power surge devastator',              baseDps: 50,                            baseCost: 100_000,                               costMultiplier: 1.26, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'liquid_cool',    name: 'LIQUID_COOL',         description: 'Thermal dissipation overcharge',      baseDps: 200,                           baseCost: 1_000_000,                             costMultiplier: 1.28, level: 0, unlocked: false, color: 'green' },
  { id: 'fpga',           name: 'FPGA_ARRAY',          description: 'Reconfigurable logic attack grid',    baseDps: 800,                           baseCost: 10_000_000,                            costMultiplier: 1.30, level: 0, unlocked: false, color: 'amber' },
  { id: 'tensor',         name: 'TENSOR_CORE',         description: 'Neural matrix decimator',             baseDps: 3_500,                         baseCost: 100_000_000,                           costMultiplier: 1.32, level: 0, unlocked: false, color: 'pink'  },
  { id: 'quantum',        name: 'QUANTUM_BIT',         description: 'Superposition damage state',          baseDps: 15_000,                        baseCost: 1_000_000_000,                         costMultiplier: 1.34, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'singularity',    name: 'SINGULARITY_ENGINE',  description: 'The end of all computation',          baseDps: 70_000,                        baseCost: 10_000_000_000,                        costMultiplier: 1.36, level: 0, unlocked: false, color: 'green' },
  { id: 'darknet',        name: 'DARKNET_NODE',        description: 'Hidden relay packet flood',           baseDps: 320_000,                       baseCost: 100_000_000_000,                       costMultiplier: 1.36, level: 0, unlocked: false, color: 'amber' },
  { id: 'bytestorm',      name: 'BYTESTORM_GEN',       description: 'Recursive payload detonator',         baseDps: 1_500_000,                     baseCost: 1_000_000_000_000,                     costMultiplier: 1.37, level: 0, unlocked: false, color: 'pink'  },
  { id: 'exploit_kit',    name: 'EXPLOIT_KIT',         description: 'Zero-day vulnerability swarm',        baseDps: 7_000_000,                     baseCost: 10_000_000_000_000,                    costMultiplier: 1.37, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'rootkit',        name: 'ROOTKIT_OMEGA',       description: 'Deep kernel privilege escalation',    baseDps: 35_000_000,                    baseCost: 100_000_000_000_000,                   costMultiplier: 1.38, level: 0, unlocked: false, color: 'green' },
  { id: 'botnet',         name: 'BOTNET_SWARM',        description: 'Distributed DDoS annihilator',        baseDps: 170_000_000,                   baseCost: 1_000_000_000_000_000,                 costMultiplier: 1.38, level: 0, unlocked: false, color: 'amber' },
  { id: 'cipher_engine',  name: 'CIPHER_ENGINE',       description: 'Cryptographic brute force array',     baseDps: 850_000_000,                   baseCost: 10_000_000_000_000_000,                costMultiplier: 1.39, level: 0, unlocked: false, color: 'pink'  },
  { id: 'memcrash',       name: 'MEMCRASH_UNIT',       description: 'Heap fragmentation disruptor',        baseDps: 4_000_000_000,                 baseCost: 100_000_000_000_000_000,               costMultiplier: 1.39, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'proxy_chain',    name: 'PROXY_CHAIN',         description: 'Layered anonymity strike vector',     baseDps: 20_000_000_000,                baseCost: 1_000_000_000_000_000_000,             costMultiplier: 1.40, level: 0, unlocked: false, color: 'green' },
  { id: 'neural_hack',    name: 'NEURAL_HACK',         description: 'Synthetic synapse override',          baseDps: 100_000_000_000,               baseCost: 10_000_000_000_000_000_000,            costMultiplier: 1.40, level: 0, unlocked: false, color: 'amber' },
  { id: 'data_leech',     name: 'DATA_LEECH',          description: 'Exfiltration pipeline maximizer',     baseDps: 500_000_000_000,               baseCost: 100_000_000_000_000_000_000,           costMultiplier: 1.40, level: 0, unlocked: false, color: 'pink'  },
  { id: 'vortex_node',    name: 'VORTEX_NODE',         description: 'Traffic singularity collapse',        baseDps: 2.5e12,                        baseCost: 1e21,                                  costMultiplier: 1.41, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'pulse_bomb',     name: 'PULSE_BOMB',          description: 'Electromagnetic burst disabler',      baseDps: 1.2e13,                        baseCost: 1e22,                                  costMultiplier: 1.41, level: 0, unlocked: false, color: 'green' },
  { id: 'ghost_proc',     name: 'GHOST_PROC',          description: 'Invisible process execution fork',    baseDps: 6e13,                          baseCost: 1e23,                                  costMultiplier: 1.41, level: 0, unlocked: false, color: 'amber' },
  { id: 'syscall_storm',  name: 'SYSCALL_STORM',       description: 'Kernel interrupt cascade flood',      baseDps: 3e14,                          baseCost: 1e24,                                  costMultiplier: 1.42, level: 0, unlocked: false, color: 'pink'  },
  { id: 'entropy_sink',   name: 'ENTROPY_SINK',        description: 'Randomness harvester weapon',         baseDps: 1.5e15,                        baseCost: 1e25,                                  costMultiplier: 1.42, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'parity_blitz',   name: 'PARITY_BLITZ',        description: 'Error correction obliterator',        baseDps: 7.5e15,                        baseCost: 1e26,                                  costMultiplier: 1.42, level: 0, unlocked: false, color: 'green' },
  { id: 'null_pointer',   name: 'NULL_POINTER',        description: 'Dereferenced void strike',            baseDps: 4e16,                          baseCost: 1e27,                                  costMultiplier: 1.43, level: 0, unlocked: false, color: 'amber' },
  { id: 'stack_overflow', name: 'STACK_OVERFLOW',      description: 'Recursive crash amplifier',           baseDps: 2e17,                          baseCost: 1e28,                                  costMultiplier: 1.43, level: 0, unlocked: false, color: 'pink'  },
  { id: 'cryptoworm',     name: 'CRYPTOWORM',          description: 'Self-replicating ransom payload',     baseDps: 1e18,                          baseCost: 1e29,                                  costMultiplier: 1.43, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'hashcracker',    name: 'HASHCRACKER',         description: 'Rainbow table obliteration rig',      baseDps: 5e18,                          baseCost: 1e30,                                  costMultiplier: 1.43, level: 0, unlocked: false, color: 'green' },
  { id: 'spinlock',       name: 'SPINLOCK_MAZE',       description: 'CPU starvation loop generator',       baseDps: 2.5e19,                        baseCost: 1e31,                                  costMultiplier: 1.44, level: 0, unlocked: false, color: 'amber' },
  { id: 'firmware_burn',  name: 'FIRMWARE_BURN',       description: 'Persistent flash memory corruptor',   baseDps: 1.2e20,                        baseCost: 1e32,                                  costMultiplier: 1.44, level: 0, unlocked: false, color: 'pink'  },
  { id: 'sector_wipe',    name: 'SECTOR_WIPE',         description: 'Block device annihilation pulse',     baseDps: 2.5e27,                        baseCost: 1e33,                                  costMultiplier: 1.46, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'signal_jammer',  name: 'SIGNAL_JAMMER',       description: 'Frequency disruption emitter',        baseDps: 2e28,                          baseCost: 1e34,                                  costMultiplier: 1.46, level: 0, unlocked: false, color: 'green' },
  { id: 'arp_spoof',      name: 'ARP_SPOOF',           description: 'Network identity forger',             baseDps: 1.6e29,                        baseCost: 1e35,                                  costMultiplier: 1.47, level: 0, unlocked: false, color: 'amber' },
  { id: 'photon_lance',   name: 'PHOTON_LANCE',        description: 'Light-speed intrusion beam',          baseDps: 1.3e30,                        baseCost: 1e36,                                  costMultiplier: 1.47, level: 0, unlocked: false, color: 'pink'  },
  { id: 'daemon_forge',   name: 'DAEMON_FORGE',        description: 'Background process weaponizer',       baseDps: 1e31,                          baseCost: 1e37,                                  costMultiplier: 1.47, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'ion_disruptor',  name: 'ION_DISRUPTOR',       description: 'Charged particle data erasure',       baseDps: 8e31,                          baseCost: 1e38,                                  costMultiplier: 1.47, level: 0, unlocked: false, color: 'green' },
  { id: 'void_compiler',  name: 'VOID_COMPILER',       description: 'Undefined behavior exploit engine',   baseDps: 6.5e32,                        baseCost: 1e39,                                  costMultiplier: 1.48, level: 0, unlocked: false, color: 'amber' },
  { id: 'plasma_inject',  name: 'PLASMA_INJECT',       description: 'High-energy SQL vaporizer',           baseDps: 5e33,                          baseCost: 1e40,                                  costMultiplier: 1.48, level: 0, unlocked: false, color: 'pink'  },
  { id: 'warp_thread',    name: 'WARP_THREAD',         description: 'Spacetime branch predictor break',    baseDps: 4e34,                          baseCost: 1e41,                                  costMultiplier: 1.48, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'omega_shell',    name: 'OMEGA_SHELL',         description: 'Final-tier remote code executor',     baseDps: 3.2e35,                        baseCost: 1e42,                                  costMultiplier: 1.48, level: 0, unlocked: false, color: 'green' },
  { id: 'event_horizon',  name: 'EVENT_HORIZON',       description: 'No data escapes this attack',         baseDps: 2.5e36,                        baseCost: 1e43,                                  costMultiplier: 1.49, level: 0, unlocked: false, color: 'amber' },
  { id: 'supernova_burst',name: 'SUPERNOVA_BURST',     description: 'Stellar collapse damage wave',        baseDps: 2e37,                          baseCost: 1e44,                                  costMultiplier: 1.49, level: 0, unlocked: false, color: 'pink'  },
  { id: 'pulsar_array',   name: 'PULSAR_ARRAY',        description: 'Periodic high-energy pulse emitter',  baseDps: 1.6e38,                        baseCost: 1e45,                                  costMultiplier: 1.49, level: 0, unlocked: false, color: 'cyan'  },
  { id: 'dark_matter',    name: 'DARK_MATTER_RIG',     description: 'Invisible mass collision driver',     baseDps: 1.3e39,                        baseCost: 1e46,                                  costMultiplier: 1.49, level: 0, unlocked: false, color: 'green' },
  { id: 'neutrino_cannon',name: 'NEUTRINO_CANNON',     description: 'Unstoppable particle penetration',    baseDps: 1e40,                          baseCost: 1e47,                                  costMultiplier: 1.50, level: 0, unlocked: false, color: 'amber' },
  { id: 'omnivirus',      name: 'OMNIVIRUS',           description: 'All-platform total system erasure',   baseDps: 8e40,                          baseCost: 1e48,                                  costMultiplier: 1.50, level: 0, unlocked: false, color: 'pink'  },
  { id: 'godmode',        name: 'GODMODE_KERNEL',      description: 'Absolute privilege. No rules apply.', baseDps: 6.5e41,                        baseCost: 1e49,                                  costMultiplier: 1.50, level: 0, unlocked: false, color: 'cyan'  },
];

// ── MOTHERBOARD ───���───────────────────────────────────────────────────────────

export interface MoboTierDef {
  tier: number;
  name: string;
  revision: string;
  goldCost: number;
  diamondCost: number;
  ramSlots: number;
  expansionSlots: number;
  description: string;
}

export const MOBO_TIERS: MoboTierDef[] = [
  { tier: 0, name: 'BUDGET BOARD',      revision: 'REV.1', goldCost: 0, diamondCost: 0,   ramSlots: 1, expansionSlots: 1, description: 'Entry level. Single RAM bank, single expansion bay.' },
  { tier: 1, name: 'MODDED BOARD',      revision: 'REV.2', goldCost: 0, diamondCost: 5,   ramSlots: 2, expansionSlots: 1, description: 'Dual RAM channel. Increased memory bandwidth.' },
  { tier: 2, name: 'OVERCLOCKED BOARD', revision: 'REV.3', goldCost: 0, diamondCost: 10,  ramSlots: 3, expansionSlots: 2, description: 'Triple RAM. Second expansion bay. Serious throughput.' },
  { tier: 3, name: 'PHANTOM BOARD',     revision: 'REV.4', goldCost: 0, diamondCost: 25,  ramSlots: 4, expansionSlots: 2, description: 'Quad RAM. Full expansion. Maximum hardware density.' },
  { tier: 4, name: 'SILICON GHOST',     revision: 'REV.X', goldCost: 0, diamondCost: 50,  ramSlots: 4, expansionSlots: 3, description: 'Experimental board. Three expansion bays. Undocumented specs.' },
  { tier: 5, name: 'GODBOARD',          revision: 'REV.Y', goldCost: 0, diamondCost: 100, ramSlots: 5, expansionSlots: 3, description: 'Divine architecture. Five RAM channels. Near-infinite headroom.' },
  { tier: 6, name: 'CHAOS BOARD',       revision: 'REV.Z', goldCost: 0, diamondCost: 200, ramSlots: 6, expansionSlots: 4, description: 'Chaotic design. Six RAM slots. Fourth expansion bay.' },
  { tier: 7, name: 'OMEGA RIG',         revision: 'FINAL', goldCost: 0, diamondCost: 500, ramSlots: 6, expansionSlots: 6, description: 'The end of hardware. Six RAM, six expansion. Maximum slots.' },
];

// ── ITEMS ─────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// GOD FORMULA ITEM SYSTEM v2.0 - BALANCED FOR 999,999 STAGES
// ═══════════════════════════════════════════════════════════════════════════════
//
// ITEM BALANCE:
// - Items are the primary way to scale damage in late game
// - Higher stages = higher tier items = better stats
// - Rarity determines stat multiplier and secondary stat access
// - Mythic items only come from SET drops (boss rewards)
//
// ITEM STAT SCALING:
// Common:    1.0x base stats
// Rare:      1.5x base stats + secondary stat
// Epic:      2.5x base stats + secondary stat
// Legendary: 5.0x base stats + secondary stat
// Mythic:    10.0x base stats + secondary stat (SET ONLY)
//
// TIER SYSTEM (based on stage dropped):
// Tier 0:  Stage 1-100      (base stats)
// Tier 1:  Stage 101-500    (1.5x tier bonus)
// Tier 2:  Stage 501-2000   (2.5x tier bonus)
// Tier 3:  Stage 2001-10000 (5x tier bonus)
// Tier 4:  Stage 10001-50000 (10x tier bonus)
// Tier 5:  Stage 50001+      (25x tier bonus)
//
// Combined scaling example (Legendary T5):
// 5.0 (rarity) * 25 (tier) = 125x base stats
// This creates meaningful progression through ALL eras
// ═══════════════════════════════════════════════════════════════════════════════

// ── ITEM CONFIG ───────────────────────────────────────────────────────────────
//
// HOW TO ADD NEW ITEMS:
// 1. Add item names to ITEM_NAME_POOLS below (organized by slot)
// 2. Names are randomly combined: [prefix] [slot base name] [suffix]
//
// HOW TO ADD NEW ITEM STATS:
// 1. Add to STAT_CONFIG below with stat type, base value, and per-tier scaling
// 2. Update engine/types.ts if adding a new modifier type
//
// HOW TO ADD NEW ITEM SETS:
// 1. Scroll to SET_DEFINITIONS section
// 2. Copy an existing set and modify id, name, items, and bonuses
//
// SCHEMA for ITEM_NAME_POOLS:
// {
//   prefixes: string[]    - Prefixes added before slot name
//   suffixes: string[]    - Suffixes added after slot name
//   CPU: string[]         - Base names for CPU slot
//   GPU: string[]         - Base names for GPU slot
//   RAM: string[]         - Base names for RAM slot
//   SSD: string[]         - Base names for SSD slot
//   COOLING: string[]     - Base names for COOLING slot
//   PSU: string[]         - Base names for PSU slot
//   EXPANSION: string[]   - Base names for EXPANSION slot
// }
//
// SCHEMA for STAT_CONFIG entries:
// {
//   stat: ModifierType    - The modifier type (tap_damage, crit_chance, etc.)
//   slots: ItemSlot[]     - Which slots can roll this stat
//   baseValue: number     - Base stat value at tier 1
//   perTier: number       - Added value per tier
//   isMultiplier: boolean - Whether this is a % multiplier
// }

export const ITEM_CONFIG = {
  /** Maximum items in the player's inventory before oldest are trimmed. Uses INVENTORY_CONFIG.maxSlots */
  get inventoryMax() { return INVENTORY_CONFIG.maxSlots; },
  /** Inventory warning threshold (0.9 = 90%). Show warning to scrap items. */
  inventoryWarningThreshold: 0.9,
  
  /** Base drop chance: 0.12 + tier * 0.02, capped at normalDropCap. */
  baseDropChance: 0.12,
  dropChancePerTier: 0.02,
  normalDropCap: 0.40,
  bossDropCap: 0.90,
  bossDropMultiplier: 3,
  
  /** Rarity roll weights. Higher = more common. Boss/tier shift rolls left. */
  rarityWeights: [
    ['Common',    55],
    ['Rare',      30],
    ['Epic',      12],
    ['Legendary', 3],
  ] as [ItemRarity, number][],
  
  /** Per-rarity primary-stat multiplier. */
  rarityStatMultiplier: { 
    Common: 1.0, 
    Rare: 1.5, 
    Epic: 2.5, 
    Legendary: 5.0,
    Mythic: 10.0,
  } as Record<ItemRarity, number>,
  
  /** Tier-based stat multiplier (based on stage dropped) */
  tierStatMultiplier: [
    1.0,   // Tier 0: Stage 1-100
    1.5,   // Tier 1: Stage 101-500
    2.5,   // Tier 2: Stage 501-2000
    5.0,   // Tier 3: Stage 2001-10000
    10.0,  // Tier 4: Stage 10001-50000
    25.0,  // Tier 5: Stage 50001+
  ] as number[],
  
  /** Stage thresholds for tier calculation */
  tierThresholds: [0, 100, 500, 2000, 10000, 50000] as number[],
  
  /** Boss/tier rarity roll shift (reduces effective roll, yielding rarer items). */
  bossRarityShift: 20,
  tierRarityShiftPerTier: 5,
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STAT VALUE FORMULAS (GOD FORMULA v2.0)
  // ═══════════════════════════════════════════════════════════════════════════
  // Multiplier stats (tap/idle/gold): 1 + (base * tierMult * rarityMult)
  // crit_chance (flat, capped):       (critChanceBase * tierMult * rarityMult)
  // crit_multiplier (flat):           (critMultBase * tierMult * rarityMult)
  // "Primary" uses the larger base; "secondary" uses the smaller base.
  // ═══════════════════════════════════════════════════════════════════════════
  primaryStatBase: 0.10,            // +10% per tier*rarity for multiplier stats
  secondaryStatBase: 0.05,          // +5% per tier*rarity for secondary multiplier stats
  primaryCritChanceBase: 0.01,      // +1% crit chance per tier*rarity (primary)
  secondaryCritChanceBase: 0.005,   // +0.5% crit chance per tier*rarity (secondary)
  primaryCritChanceCap: 0.15,       // Max 15% crit chance from a primary item
  secondaryCritChanceCap: 0.08,     // Max 8% crit chance from a secondary roll
  primaryCritMultBase: 0.20,        // +20% crit damage per tier*rarity (primary)
  secondaryCritMultBase: 0.15,      // +15% crit damage per rarity (secondary)
  /** crit_multiplier secondary ignores tier scaling (set false to scale with tier). */
  secondaryCritMultScalesWithTier: false,

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM ARCHETYPES (BUILD SYSTEM)
  // ═══════════════════════════════════════════════════════════════════════════
  // Every slot can now roll EVERY stat type, each as a themed item "line" so
  // players can craft focused builds (e.g. a crit-damage CPU, a gold RAM).
  //
  // HOW TO ADD NEW ITEMS:
  //   - Add a name to the relevant archetype's `names` array below.
  //   - Optionally add a flavor for it in `itemFlavors` (otherwise the shared
  //     `archetypeFlavors[stat]` line is used).
  //
  // HOW TO ADD A NEW ARCHETYPE STAT:
  //   - Add an entry under each slot keyed by the ModifierType, with a
  //     `secondary` stat (rolled on Rare+) and a `names` pool.
  //
  // Schema: archetypes[slot][primaryStat] = { secondary, names }
  // ═══════════════════════════════════════════════════════════════════════════
  archetypes: {
    RAM: {
      tap_damage:      { secondary: 'crit_chance',     names: ['STRIKE_DIMM', 'HAMMER_CACHE', 'SPIKE_BANK', 'PERCUSSION_RAM', 'IMPACT_MODULE', 'BURST_DDR', 'CONCUSSION_STICK', 'SLEDGE_MEMORY'] },
      idle_dps:        { secondary: 'tap_damage',      names: ['DAEMON_DIMM', 'AUTO_CACHE', 'DRONE_BANK', 'PERSISTENT_RAM', 'IDLE_REAPER', 'LOOP_MODULE', 'PHANTOM_THREAD_RAM', 'REVENANT_DDR'] },
      gold_rate:       { secondary: 'idle_dps',        names: ['MINER_DIMM', 'GREED_CACHE', 'VAULT_BANK', 'MIDAS_RAM', 'PROFIT_MODULE', 'BOUNTY_DDR', 'TREASURE_STICK', 'HOARD_MEMORY'] },
      crit_chance:     { secondary: 'crit_multiplier', names: ['PRECISION_DIMM', 'SCOPE_CACHE', 'MARKSMAN_BANK', 'EAGLE_RAM', 'PINPOINT_MODULE', 'SNIPER_DDR', 'HAWKEYE_STICK', 'FOCUS_MEMORY'] },
      crit_multiplier: { secondary: 'crit_chance',     names: ['EXECUTION_DIMM', 'OVERKILL_CACHE', 'RUPTURE_BANK', 'LETHAL_RAM', 'MASSACRE_MODULE', 'DEVASTATOR_DDR', 'ANNIHILATE_STICK', 'CRESCENDO_MEMORY'] },
    },
    GPU: {
      tap_damage:      { secondary: 'crit_chance',     names: ['STRIKE_SHADER', 'HAMMER_RENDER', 'SPIKE_PIXEL', 'IMPACT_GPU', 'BURST_FRAME', 'PERCUSSION_CORE', 'CONCUSSION_CARD', 'SLEDGE_RASTER'] },
      idle_dps:        { secondary: 'tap_damage',      names: ['DAEMON_SHADER', 'AUTO_RENDER', 'DRONE_PIXEL', 'PERSISTENT_GPU', 'IDLE_RASTERIZER', 'LOOP_FRAME', 'PHANTOM_RENDER', 'REVENANT_CARD'] },
      gold_rate:       { secondary: 'idle_dps',        names: ['MINER_SHADER', 'GREED_RENDER', 'VAULT_PIXEL', 'MIDAS_GPU', 'PROFIT_FRAME', 'BOUNTY_CORE', 'TREASURE_CARD', 'HOARD_RASTER'] },
      crit_chance:     { secondary: 'crit_multiplier', names: ['PRECISION_SHADER', 'SCOPE_RENDER', 'MARKSMAN_PIXEL', 'EAGLE_GPU', 'PINPOINT_FRAME', 'SNIPER_CORE', 'HAWKEYE_CARD', 'FOCUS_RASTER'] },
      crit_multiplier: { secondary: 'crit_chance',     names: ['EXECUTION_SHADER', 'OVERKILL_RENDER', 'RUPTURE_PIXEL', 'LETHAL_GPU', 'MASSACRE_FRAME', 'DEVASTATOR_CORE', 'ANNIHILATE_CARD', 'CRESCENDO_RASTER'] },
    },
    CPU: {
      tap_damage:      { secondary: 'crit_chance',     names: ['STRIKE_CORE', 'HAMMER_PROC', 'SPIKE_THREAD', 'IMPACT_CPU', 'BURST_SILICON', 'PERCUSSION_CHIP', 'CONCUSSION_DIE', 'SLEDGE_LOGIC'] },
      idle_dps:        { secondary: 'tap_damage',      names: ['DAEMON_CORE', 'AUTO_PROC', 'DRONE_THREAD', 'PERSISTENT_CPU', 'IDLE_REAPER_CHIP', 'LOOP_SILICON', 'PHANTOM_PROC', 'REVENANT_DIE'] },
      gold_rate:       { secondary: 'idle_dps',        names: ['MINER_CORE', 'GREED_PROC', 'VAULT_THREAD', 'MIDAS_CPU', 'PROFIT_SILICON', 'BOUNTY_CHIP', 'TREASURE_DIE', 'HOARD_LOGIC'] },
      crit_chance:     { secondary: 'crit_multiplier', names: ['PRECISION_CORE', 'SCOPE_PROC', 'MARKSMAN_THREAD', 'EAGLE_CPU', 'PINPOINT_SILICON', 'SNIPER_CHIP', 'HAWKEYE_DIE', 'FOCUS_LOGIC'] },
      crit_multiplier: { secondary: 'crit_chance',     names: ['EXECUTION_CORE', 'OVERKILL_PROC', 'RUPTURE_THREAD', 'LETHAL_CPU', 'MASSACRE_SILICON', 'DEVASTATOR_CHIP', 'ANNIHILATE_DIE', 'CRESCENDO_LOGIC'] },
    },
    EXPANSION: {
      tap_damage:      { secondary: 'crit_chance',     names: ['STRIKE_BUS', 'HAMMER_CARD', 'SPIKE_LANE', 'IMPACT_PCIE', 'BURST_BRIDGE', 'PERCUSSION_NIC', 'CONCUSSION_RAID', 'SLEDGE_PORT'] },
      idle_dps:        { secondary: 'tap_damage',      names: ['DAEMON_BUS', 'AUTO_CARD', 'DRONE_LANE', 'PERSISTENT_PCIE', 'IDLE_BRIDGE', 'LOOP_NIC', 'PHANTOM_RAID', 'REVENANT_PORT'] },
      gold_rate:       { secondary: 'idle_dps',        names: ['MINER_BUS', 'GREED_CARD', 'VAULT_LANE', 'MIDAS_PCIE', 'PROFIT_BRIDGE', 'BOUNTY_NIC', 'TREASURE_RAID', 'HOARD_PORT'] },
      crit_chance:     { secondary: 'crit_multiplier', names: ['PRECISION_BUS', 'SCOPE_CARD', 'MARKSMAN_LANE', 'EAGLE_PCIE', 'PINPOINT_BRIDGE', 'SNIPER_NIC', 'HAWKEYE_RAID', 'FOCUS_PORT'] },
      crit_multiplier: { secondary: 'crit_chance',     names: ['EXECUTION_BUS', 'OVERKILL_CARD', 'RUPTURE_LANE', 'LETHAL_PCIE', 'MASSACRE_BRIDGE', 'DEVASTATOR_NIC', 'ANNIHILATE_RAID', 'CRESCENDO_PORT'] },
    },
  } as Record<ItemSlot, Record<ModifierDef['type'], { secondary: ModifierDef['type']; names: string[] }>>,

  /** Relative weight of each archetype dropping per slot. Tune build rarity here. */
  archetypeWeights: {
    tap_damage: 25,
    idle_dps: 25,
    gold_rate: 20,
    crit_chance: 18,
    crit_multiplier: 12,
  } as Record<ModifierDef['type'], number>,

  /** Shared flavor per archetype stat (used when a name has no specific flavor). */
  archetypeFlavors: {
    tap_damage:      'Every tap lands like a kinetic exploit.',
    idle_dps:        'Runs your kill loop while you sleep.',
    gold_rate:       'Skims credits off every corpse on the wire.',
    crit_chance:     'Finds the weak byte. Every. Single. Time.',
    crit_multiplier: 'When it crits, the target ceases to exist.',
  } as Record<ModifierDef['type'], string>,

  /** Optional per-name flavor overrides (falls back to archetypeFlavors). */
  itemFlavors: {
    NULL_PTR_MODULE:  'References nothing. Destroys everything.',
    ZERO_DAY_CHIP:    'Patched by no one. Feared by all.',
    PHANTOM_PROC:     'Listed as idle in all monitors. Never idle.',
    OVERKILL_CACHE:   'Computes more death than the target can hold.',
    MIDAS_PCIE:       'Every byte that crosses the lane turns to gold.',
    HAWKEYE_DIE:      'Sees the one weak transistor in a billion.',
  } as Record<string, string>,

  /** Scrap values by rarity - scrapping items yields this amount of scrap. */
  scrapValues: {
    Common: 5,
    Rare: 15,
    Epic: 40,
    Legendary: 100,
    Mythic: 250,
  } as Record<ItemRarity, number>,

  /** Tier bonus for scrap: scrapValue + (tier * tierScrapBonus). */
  tierScrapBonus: 3,
} as const;

// ── SHOP ──────────────────────────────────────────────────────────��─────────��─

export interface ShopItemDef {
  id: string;
  name: string;
  description: string;
  currency: 'oct' | 'diamond';
  price: number;
  modifierType: ModifierDef['type'];
  modifierValue: number;
  isMultiplier: boolean;
  color: string;
  icon: string;
  maxPurchases: number;
  tier: 'early' | 'mid' | 'late' | 'endgame';
}

export const OCT_CATALOG: ShopItemDef[] = [
  // Early (10–25 OCT)
  { id: 'oct_tap_1',   name: 'NEURAL SPIKE I',       description: '+10% tap damage permanently',  currency: 'oct', price: 10,  modifierType: 'tap_damage',      modifierValue: 1.10, isMultiplier: true,  color: '#00f5ff', icon: 'Zap',    maxPurchases: 8, tier: 'early'   },
  { id: 'oct_dps_1',   name: 'HEAT SINK I',           description: '+12% idle DPS permanently',    currency: 'oct', price: 10,  modifierType: 'idle_dps',        modifierValue: 1.12, isMultiplier: true,  color: '#39ff14', icon: 'Cpu',    maxPurchases: 8, tier: 'early'   },
  { id: 'oct_gold_1',  name: 'SCARCITY MINER I',      description: '+15% gold rate permanently',   currency: 'oct', price: 15,  modifierType: 'gold_rate',       modifierValue: 1.15, isMultiplier: true,  color: '#ffaa00', icon: 'Coins',  maxPurchases: 6, tier: 'early'   },
  { id: 'oct_crit_1',  name: 'EXPLOIT NEEDLE I',      description: '+3% crit chance permanently',  currency: 'oct', price: 20,  modifierType: 'crit_chance',     modifierValue: 0.03, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 6, tier: 'early'   },
  // Mid (40–80 OCT)
  { id: 'oct_tap_2',   name: 'NEURAL SPIKE II',       description: '+20% tap damage permanently',  currency: 'oct', price: 40,  modifierType: 'tap_damage',      modifierValue: 1.20, isMultiplier: true,  color: '#00f5ff', icon: 'Zap',    maxPurchases: 5, tier: 'mid'     },
  { id: 'oct_dps_2',   name: 'HEAT SINK II',          description: '+25% idle DPS permanently',    currency: 'oct', price: 45,  modifierType: 'idle_dps',        modifierValue: 1.25, isMultiplier: true,  color: '#39ff14', icon: 'Cpu',    maxPurchases: 5, tier: 'mid'     },
  { id: 'oct_gold_2',  name: 'SCARCITY MINER II',     description: '+35% gold rate permanently',   currency: 'oct', price: 60,  modifierType: 'gold_rate',       modifierValue: 1.35, isMultiplier: true,  color: '#ffaa00', icon: 'Coins',  maxPurchases: 4, tier: 'mid'     },
  { id: 'oct_crit_2',  name: 'EXPLOIT NEEDLE II',     description: '+5% crit chance permanently',  currency: 'oct', price: 75,  modifierType: 'crit_chance',     modifierValue: 0.05, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 4, tier: 'mid'     },
  { id: 'oct_critm_1', name: 'KILL CHAIN I',          description: '+25% crit damage permanently', currency: 'oct', price: 80,  modifierType: 'crit_multiplier', modifierValue: 1.25, isMultiplier: true,  color: '#ff0080', icon: 'Target', maxPurchases: 4, tier: 'mid'     },
  // Late (120–200 OCT)
  { id: 'oct_tap_3',   name: 'QUANTUM STRIKE I',      description: '+35% tap damage permanently',  currency: 'oct', price: 120, modifierType: 'tap_damage',      modifierValue: 1.35, isMultiplier: true,  color: '#00f5ff', icon: 'Zap',    maxPurchases: 3, tier: 'late'    },
  { id: 'oct_dps_3',   name: 'NEURAL GRID I',         description: '+40% idle DPS permanently',    currency: 'oct', price: 130, modifierType: 'idle_dps',        modifierValue: 1.40, isMultiplier: true,  color: '#39ff14', icon: 'Cpu',    maxPurchases: 3, tier: 'late'    },
  { id: 'oct_gold_3',  name: 'FRACTAL VEIN I',        description: '+60% gold rate permanently',   currency: 'oct', price: 150, modifierType: 'gold_rate',       modifierValue: 1.60, isMultiplier: true,  color: '#ffaa00', icon: 'Coins',  maxPurchases: 3, tier: 'late'    },
  { id: 'oct_crit_3',  name: 'EXPLOIT NEEDLE III',    description: '+8% crit chance permanently',  currency: 'oct', price: 175, modifierType: 'crit_chance',     modifierValue: 0.08, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 3, tier: 'late'    },
  { id: 'oct_critm_2', name: 'KILL CHAIN II',         description: '+50% crit damage permanently', currency: 'oct', price: 200, modifierType: 'crit_multiplier', modifierValue: 1.50, isMultiplier: true,  color: '#ff0080', icon: 'Target', maxPurchases: 2, tier: 'late'    },
  // Endgame (300–600 OCT)
  { id: 'oct_tap_4',   name: 'SINGULARITY TAP',       description: '×2 tap damage permanently',    currency: 'oct', price: 300, modifierType: 'tap_damage',      modifierValue: 2.0,  isMultiplier: true,  color: '#00f5ff', icon: 'Zap',    maxPurchases: 2, tier: 'endgame' },
  { id: 'oct_dps_4',   name: 'SINGULARITY DPS',       description: '×2 idle DPS permanently',      currency: 'oct', price: 350, modifierType: 'idle_dps',        modifierValue: 2.0,  isMultiplier: true,  color: '#39ff14', icon: 'Cpu',    maxPurchases: 2, tier: 'endgame' },
  { id: 'oct_gold_4',  name: 'SINGULARITY VAULT',     description: '×2.5 gold rate permanently',   currency: 'oct', price: 450, modifierType: 'gold_rate',       modifierValue: 2.5,  isMultiplier: true,  color: '#ffaa00', icon: 'Coins',  maxPurchases: 1, tier: 'endgame' },
  { id: 'oct_critm_3', name: 'OMEGA CHAIN',           description: '×2 crit damage permanently',   currency: 'oct', price: 500, modifierType: 'crit_multiplier', modifierValue: 2.0,  isMultiplier: true,  color: '#ff0080', icon: 'Target', maxPurchases: 1, tier: 'endgame' },
  { id: 'oct_crit_4',  name: 'PERFECT AIM PROTOCOL',  description: '+15% crit chance permanently', currency: 'oct', price: 600, modifierType: 'crit_chance',     modifierValue: 0.15, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 1, tier: 'endgame' },
];

export const DIAMOND_CATALOG: ShopItemDef[] = [
  { id: 'dia_tap_1',  name: 'QUANTUM STRIKE',    description: '+50% tap damage permanently',  currency: 'diamond', price: 5,  modifierType: 'tap_damage',      modifierValue: 1.5,  isMultiplier: true,  color: '#00f5ff', icon: 'Zap',   maxPurchases: 3, tier: 'mid'     },
  { id: 'dia_dps_1',  name: 'NEURAL GRID BOOST', description: '+75% idle DPS permanently',    currency: 'diamond', price: 5,  modifierType: 'idle_dps',        modifierValue: 1.75, isMultiplier: true,  color: '#39ff14', icon: 'Cpu',   maxPurchases: 3, tier: 'mid'     },
  { id: 'dia_gold_1', name: 'FRACTAL EXTRACTOR', description: '+100% gold rate permanently',  currency: 'diamond', price: 8,  modifierType: 'gold_rate',       modifierValue: 2.0,  isMultiplier: true,  color: '#ffaa00', icon: 'Coins', maxPurchases: 2, tier: 'late'    },
  { id: 'dia_crit_1', name: 'EXPLOIT CHAIN',     description: '+50% crit damage permanently', currency: 'diamond', price: 10, modifierType: 'crit_multiplier', modifierValue: 1.5,  isMultiplier: true,  color: '#ff0080', icon: 'Target',maxPurchases: 2, tier: 'late'    },
  { id: 'dia_tap_2',  name: 'OVERDRIVE MATRIX',  description: '×3 tap damage permanently',    currency: 'diamond', price: 25, modifierType: 'tap_damage',      modifierValue: 3.0,  isMultiplier: true,  color: '#00f5ff', icon: 'Zap',   maxPurchases: 1, tier: 'endgame' },
  { id: 'dia_dps_2',  name: 'OMNIGRID ENGINE',   description: '×3 idle DPS permanently',      currency: 'diamond', price: 25, modifierType: 'idle_dps',        modifierValue: 3.0,  isMultiplier: true,  color: '#39ff14', icon: 'Cpu',   maxPurchases: 1, tier: 'endgame' },
  { id: 'dia_gold_2', name: 'DARK MATTER VAULT', description: '×4 gold rate permanently',     currency: 'diamond', price: 40, modifierType: 'gold_rate',       modifierValue: 4.0,  isMultiplier: true,  color: '#ffaa00', icon: 'Coins', maxPurchases: 1, tier: 'endgame' },
];

export const SHOP_CATALOG: ShopItemDef[] = [...OCT_CATALOG, ...DIAMOND_CATALOG];

// ── DAILIES ───────────────────────��─────────────────────────────────────���─────

export interface ChallengeTemplateDef {
  type: string;
  label: string;
  targetFn: (stage: number) => number;
  rewardFn: (stage: number) => number;
}

export const DAILY_CONFIG = {
  /** Number of daily challenges generated per day per player. */
  challengesPerDay: 30,
  /** Maximum diamonds awarded per completed challenge. */
  maxDiamondReward: 10,
  /** Diamond reward scales with highestStage / this divisor. */
  diamondStageDivisor: 20,

  /** Difficulty weight per challenge type (affects diamond reward scaling). */
  diamondDifficulty: {
    kill_enemies:    1,
    earn_gold:       1,
    tap_damage:      1.5,
    use_skills:      1.5,
    defeat_bosses:   3,
    kill_streak:     2,
    earn_gold_fast:  2,
    overclock_tap:   1.5,
    clear_stages:    1.5,
    boss_streak:     3,
  spend_gold:      0,
  collect_crits:   2,
  idle_kills:      0,
    skill_combos:    2.5,
    tap_frenzy:      1.5,
    reach_overclock: 3,
    gold_hoard:      2,
    endurance:       2,
    precision_hits:  1.5,
  } as Record<string, number>,
} as const;

export const CHALLENGE_TEMPLATES: ChallengeTemplateDef[] = [
  // ── Basic ──────────────────────────────────────────��────────────��──────���─
  { type: 'kill_enemies',    label: 'Eliminate {n} enemies',          targetFn: s => 10 + s * 2,              rewardFn: s => 50  + s * 20  },
  { type: 'earn_gold',       label: 'Earn {n} gold',                   targetFn: s => 100 + s * 50,            rewardFn: s => 30  + s * 15  },
  { type: 'use_skills',      label: 'Use skills {n} times',            targetFn: () => 5,                      rewardFn: s => 40  + s * 10  },
  { type: 'defeat_bosses',   label: 'Defeat {n} boss(es)',             targetFn: () => 2,                      rewardFn: s => 100 + s * 40  },
  { type: 'tap_damage',      label: 'Deal {n} tap damage',             targetFn: s => 200 + s * 100,           rewardFn: s => 60  + s * 25  },
  // ── Medium ────────────────────────────────────────────────────────────────
  { type: 'kill_streak',     label: 'Kill {n} enemies without dying',  targetFn: s => 15 + s * 3,             rewardFn: s => 70  + s * 25  },
  { type: 'earn_gold_fast',  label: 'Earn {n} gold in one stage',      targetFn: s => 80 + s * 40,            rewardFn: s => 90  + s * 30  },
  { type: 'overclock_tap',   label: 'Land {n} critical taps',          targetFn: s => 10 + s * 2,             rewardFn: s => 75  + s * 20  },
  { type: 'clear_stages',    label: 'Clear {n} stages',                targetFn: () => 3,                      rewardFn: s => 60  + s * 20  },
  { type: 'boss_streak',     label: 'Defeat {n} bosses in a row',      targetFn: () => 3,                      rewardFn: s => 120 + s * 50  },
  { type: 'collect_crits',   label: 'Land {n} critical hits',          targetFn: s => 20 + s * 4,             rewardFn: s => 80  + s * 25  },
  // ── Hard ──────────────────────────────────────────────────────────────────
  { type: 'skill_combos',    label: 'Chain {n} skills without missing', targetFn: () => 4,                    rewardFn: s => 130 + s * 45  },
  { type: 'tap_frenzy',      label: 'Deal {n} total damage tapping',   targetFn: s => 500 + s * 200,          rewardFn: s => 90  + s * 30  },
  { type: 'reach_overclock', label: 'Reach overclock {n}',             targetFn: s => Math.max(1, Math.floor(s / 5)), rewardFn: s => 150 + s * 60 },
  { type: 'gold_hoard',      label: 'Accumulate {n} total gold',       targetFn: s => 300 + s * 100,          rewardFn: s => 100 + s * 35  },
  { type: 'endurance',       label: 'Survive {n} enemy waves',         targetFn: s => 5 + s,                  rewardFn: s => 110 + s * 40  },
  { type: 'precision_hits',  label: 'Land {n} hits without missing',   targetFn: s => 25 + s * 5,             rewardFn: s => 70  + s * 22  },
];

// ── SETS ──────────────────────────────────────────────────────────────────────

// ── ACHIEVEMENTS ───────────────────────────────��──────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  /** 
   * Achievement type determines the check condition:
   * - 'kills': ctx.totalKills >= threshold
   * - 'boss_kills': ctx.totalBossKills >= threshold
   * - 'stage': state.highestStage >= threshold
   * - 'overclocks': state.totalOverclocks >= threshold
   * - 'gold': ctx.totalGoldEarned >= threshold
   * - 'skills': ctx.totalSkillsUsed >= threshold
   * - 'components_unlocked': count of unlocked components >= threshold
   * - 'component_level': any component level >= threshold
   * - 'items_equipped': count of equipped items >= threshold
   * - 'set_complete': specific set completed (threshold is ignored, setId required)
   * - 'oct_spent': state.octSpent >= threshold
   * - 'diamonds': state.diamonds >= threshold
   */
  type: 'kills' | 'boss_kills' | 'stage' | 'overclocks' | 'gold' | 'skills' | 'components_unlocked' | 'component_level' | 'items_equipped' | 'set_complete' | 'oct_spent' | 'diamonds';
  threshold: number;
  setId?: string; // For 'set_complete' type
}

export const ACHIEVEMENT_CONFIG = {
  /** Interval in ms for persisting achievement stats to DB. */
  persistIntervalMs: 30_000,
  
  /** All achievement definitions. */
  achievements: [
    // ─��� Kill Milestones ───────────────────────────────────────────────
    { id: 'first_blood',  name: 'FIRST BLOOD',      description: 'Defeat your first enemy',   icon: 'Crosshair', color: '#00f5ff', type: 'kills',      threshold: 1      },
    { id: 'kill_100',     name: 'CENTURION',        description: 'Defeat 100 enemies',        icon: 'Target',    color: '#39ff14', type: 'kills',      threshold: 100    },
    { id: 'kill_500',     name: 'KILL STREAK',      description: 'Defeat 500 enemies',        icon: 'Target',    color: '#39ff14', type: 'kills',      threshold: 500    },
    { id: 'kill_1000',    name: 'MASS DELETION',    description: 'Defeat 1,000 enemies',      icon: 'Target',    color: '#ffaa00', type: 'kills',      threshold: 1000   },
    { id: 'kill_5000',    name: 'EXTINCTION EVENT', description: 'Defeat 5,000 enemies',      icon: 'Target',    color: '#ff4444', type: 'kills',      threshold: 5000   },
    { id: 'kill_10000',   name: 'THE PURGE',        description: 'Defeat 10,000 enemies',     icon: 'Target',    color: '#ff0080', type: 'kills',      threshold: 10000  },

    // ── Boss Kills ─────────────────────────────��─────────────────────
    { id: 'boss_slayer',     name: 'BOSS SLAYER',     description: 'Defeat 10 bosses',   icon: 'Skull', color: '#ff4444', type: 'boss_kills', threshold: 10  },
    { id: 'boss_slayer_50',  name: 'APEX PREDATOR',   description: 'Defeat 50 bosses',   icon: 'Skull', color: '#ff4444', type: 'boss_kills', threshold: 50  },
    { id: 'boss_slayer_100', name: 'BOSS HUNTER',     description: 'Defeat 100 bosses',  icon: 'Skull', color: '#ff2200', type: 'boss_kills', threshold: 100 },
    { id: 'boss_slayer_500', name: 'OVERLORD KILLER', description: 'Defeat 500 bosses',  icon: 'Skull', color: '#dd0000', type: 'boss_kills', threshold: 500 },

    // ── Stage Milestones ─────────────────────────────────────────────
    { id: 'stage_10',    name: 'WARMING UP',       description: 'Reach stage 10',     icon: 'TrendingUp', color: '#00f5ff', type: 'stage', threshold: 10    },
    { id: 'stage_25',    name: 'MID GAME',         description: 'Reach stage 25',     icon: 'TrendingUp', color: '#39ff14', type: 'stage', threshold: 25    },
    { id: 'stage_50',    name: 'DEEP RUN',         description: 'Reach stage 50',     icon: 'TrendingUp', color: '#ffaa00', type: 'stage', threshold: 50    },
    { id: 'stage_100',   name: 'ENDGAME',          description: 'Reach stage 100',    icon: 'TrendingUp', color: '#ff0080', type: 'stage', threshold: 100   },
    { id: 'stage_200',   name: 'GOING DEEPER',     description: 'Reach stage 200',    icon: 'TrendingUp', color: '#ff0080', type: 'stage', threshold: 200   },
    { id: 'stage_500',   name: 'HALF A THOUSAND',  description: 'Reach stage 500',    icon: 'TrendingUp', color: '#ff4444', type: 'stage', threshold: 500   },
    { id: 'stage_1000',  name: 'FOUR DIGITS',      description: 'Reach stage 1,000',  icon: 'TrendingUp', color: '#ff2200', type: 'stage', threshold: 1000  },
    { id: 'stage_2500',  name: 'BEYOND THE VOID',  description: 'Reach stage 2,500',  icon: 'TrendingUp', color: '#dd0000', type: 'stage', threshold: 2500  },
    { id: 'stage_5000',  name: 'THE FINAL STAGE',  description: 'Reach stage 5,000',  icon: 'TrendingUp', color: '#aa0000', type: 'stage', threshold: 5000  },
    { id: 'stage_10000', name: 'INFINITY',         description: 'Reach stage 10,000', icon: 'TrendingUp', color: '#880000', type: 'stage', threshold: 10000 },

    // ── Overclock Achievements ───────────────────────────────────���───
    { id: 'first_reboot',     name: 'FIRST REBOOT',      description: 'Perform your first Overclock', icon: 'RefreshCw', color: '#ff0080', type: 'overclocks', threshold: 1   },
    { id: 'reboot_10',        name: 'CYCLE MASTER',      description: 'Perform 10 Overclocks',        icon: 'RefreshCw', color: '#ff0080', type: 'overclocks', threshold: 10  },
    { id: 'reboot_25',        name: 'LOOP VETERAN',      description: 'Perform 25 Overclocks',        icon: 'RefreshCw', color: '#ff4444', type: 'overclocks', threshold: 25  },
    { id: 'reboot_50',        name: 'ENDLESS LOOP',      description: 'Perform 50 Overclocks',        icon: 'RefreshCw', color: '#ff2200', type: 'overclocks', threshold: 50  },
    { id: 'reboot_100',       name: 'RECURSION GOD',     description: 'Perform 100 Overclocks',       icon: 'RefreshCw', color: '#dd0000', type: 'overclocks', threshold: 100 },

    // ── Gold Achievements ────────────────────────��─────────────���─────
    { id: 'gold_10k',         name: 'SMALL STASH',       description: 'Earn 10,000 total gold',       icon: 'Coins', color: '#ffaa00', type: 'gold', threshold: 10000      },
    { id: 'gold_100k',        name: 'VAULT KEEPER',      description: 'Earn 100,000 total gold',      icon: 'Coins', color: '#ffaa00', type: 'gold', threshold: 100000     },
    { id: 'gold_1m',          name: 'MILLIONAIRE',       description: 'Earn 1,000,000 total gold',    icon: 'Coins', color: '#ff8800', type: 'gold', threshold: 1000000    },
    { id: 'gold_10m',         name: 'MOGUL',             description: 'Earn 10,000,000 total gold',   icon: 'Coins', color: '#ff6600', type: 'gold', threshold: 10000000   },
    { id: 'gold_100m',        name: 'TYCOON',            description: 'Earn 100,000,000 total gold',  icon: 'Coins', color: '#ff4400', type: 'gold', threshold: 100000000  },
    { id: 'gold_1b',          name: 'BILLIONAIRE',       description: 'Earn 1,000,000,000 total gold',icon: 'Coins', color: '#ff2200', type: 'gold', threshold: 1000000000 },

    // ── Skill Achievements ───────────────────────────────────────────
    { id: 'skill_novice',     name: 'SKILL NOVICE',     description: 'Use skills 50 times',     icon: 'Zap', color: '#00f5ff', type: 'skills', threshold: 50   },
    { id: 'skill_adept',      name: 'SKILL ADEPT',      description: 'Use skills 200 times',    icon: 'Zap', color: '#39ff14', type: 'skills', threshold: 200  },
    { id: 'skill_master',     name: 'SKILL MASTER',     description: 'Use skills 500 times',    icon: 'Zap', color: '#ffaa00', type: 'skills', threshold: 500  },
    { id: 'skill_legend',     name: 'SKILL LEGEND',     description: 'Use skills 1,000 times',  icon: 'Zap', color: '#ff0080', type: 'skills', threshold: 1000 },

    // ── Component Achievements ───────────────────────────────────────
    { id: 'component_10',     name: 'COMPONENT COLLECTOR', description: 'Unlock all 10 components',      icon: 'Package', color: '#00f5ff', type: 'components_unlocked', threshold: 10  },
    { id: 'component_lv100',  name: 'MAX COMPONENT',       description: 'Level any component to 100',    icon: 'Package', color: '#ff0080', type: 'component_level',     threshold: 100 },

    // ── Item Achievements ────────────────────────────────────────────
    { id: 'item_first',       name: 'FIRST LOOT',        description: 'Equip your first item',   icon: 'Award', color: '#00f5ff', type: 'items_equipped', threshold: 1 },
    { id: 'item_full',        name: 'FULL LOADOUT',      description: 'Equip items in all slots',icon: 'Award', color: '#ff0080', type: 'items_equipped', threshold: 4 },

    // ── Set Achievements ─────────────────────────────────────────────
    { id: 'set_neural',       name: 'NEURAL COMPLETE',      description: 'Complete the Neural Nexus set',      icon: 'Award', color: '#00f5ff', type: 'set_complete', threshold: 0, setId: 'neural_nexus'    },
    { id: 'set_ghost',        name: 'GHOST COMPLETE',       description: 'Complete the Ghost Protocol set',    icon: 'Award', color: '#ff0080', type: 'set_complete', threshold: 0, setId: 'ghost_protocol'  },
    { id: 'set_singularity',  name: 'SINGULARITY COMPLETE', description: 'Complete the Singularity Core set',  icon: 'Award', color: '#ffaa00', type: 'set_complete', threshold: 0, setId: 'singularity_core'},

    // ── Economy Achievements ─────────────────────────────────────────
    { id: 'oct_spender',      name: 'OCT INVESTOR',     description: 'Spend 100 OCT in the shop', icon: 'ShoppingBag', color: '#ff0080', type: 'oct_spent', threshold: 100 },
    { id: 'diamond_hoarder',  name: 'DIAMOND HOARDER',  description: 'Accumulate 100 diamonds',   icon: 'Gem',         color: '#00f5ff', type: 'diamonds',  threshold: 100 },
  ] as AchievementDef[],
} as const;

// ── ZONES ─────────────────────────────────────────────────────────────────────
// 
// HOW TO ADD A NEW ZONE:
// 1. Add a new entry to the zones array below
// 2. Add corresponding music in audio.config.ts
// 3. Add enemy types for the zone in ENEMY_CONFIG
//
// SCHEMA:
// ZoneDef {
//   id: number              - Sequential zone number (0, 1, 2...)
//   name: string            - Short name for UI
//   label: string           - Full display label
//   bgColor: string         - Background color (hex)
//   gridColor: string       - Grid overlay color (rgba)
//   particleColor: string   - Ambient particle color
//   groundColor: string     - Ground/floor accent color
//   accentColor: string     - UI accent color for this zone
//   farLayerContent: string - Background effect type
//   persistBackground?: boolean - Keep background when transitioning (default false)
//   musicTrackId?: string   - Override music (uses audio.config.ts zone mapping if not set)
//   bossName?: string       - Custom name for zone boss
// }

export interface ZoneDef {
  id: number;
  name: string;
  label: string;
  bgColor: string;
  gridColor: string;
  particleColor: string;
  groundColor: string;
  accentColor: string;
  farLayerContent: 'hex' | 'bars' | 'traces' | 'racks' | 'void' | 'glitch' | 'fractal' | 'static' | 'overload' | 'stars';
  persistBackground?: boolean;
  musicTrackId?: string;
  bossName?: string;
}

export const ZONE_CONFIG = {
  /** Number of stages per zone. Zone 0 = 1-500, Zone 1 = 501-1000, etc. */
  stagesPerZone: 500,
  
  /** All zone definitions. */
  zones: [
    { id: 0, name: 'PERIMETER', label: 'ZONE 0: PERIMETER', bgColor: '#0a0a0f', gridColor: 'rgba(0,245,255,0.04)',   particleColor: '#00f5ff', groundColor: '#00f5ff', accentColor: '#00f5ff', farLayerContent: 'hex',     persistBackground: false, bossName: 'FIREWALL SENTINEL' },
    { id: 1, name: 'FIREWALL',  label: 'ZONE 1: FIREWALL',  bgColor: '#0f0808', gridColor: 'rgba(255,34,34,0.05)',   particleColor: '#ff2222', groundColor: '#ff0080', accentColor: '#ff2222', farLayerContent: 'bars',    persistBackground: false, bossName: 'FLAME DAEMON' },
    { id: 2, name: 'KERNEL',    label: 'ZONE 2: KERNEL',    bgColor: '#080f08', gridColor: 'rgba(57,255,20,0.04)',   particleColor: '#39ff14', groundColor: '#39ff14', accentColor: '#39ff14', farLayerContent: 'traces',  persistBackground: false, bossName: 'ROOT PROCESS' },
    { id: 3, name: 'CORE',      label: 'ZONE 3: CORE',      bgColor: '#0f0c06', gridColor: 'rgba(255,170,0,0.04)',   particleColor: '#ffaa00', groundColor: '#ffaa00', accentColor: '#ffaa00', farLayerContent: 'racks',   persistBackground: false, bossName: 'CORE OVERSEER' },
    { id: 4, name: 'THE VOID',  label: 'ZONE 4: THE VOID',  bgColor: '#050508', gridColor: 'rgba(200,200,255,0.02)', particleColor: '#ffffff', groundColor: '#ffffff', accentColor: '#ffffff', farLayerContent: 'void',    persistBackground: true,  bossName: 'VOID WALKER' },
    { id: 5, name: 'ABYSS',     label: 'ZONE 5: ABYSS',     bgColor: '#0d0208', gridColor: 'rgba(255,0,128,0.04)',   particleColor: '#ff0080', groundColor: '#ff0080', accentColor: '#ff0080', farLayerContent: 'glitch',  persistBackground: false, bossName: 'ABYSS CORRUPTOR' },
    { id: 6, name: 'FRACTURE',  label: 'ZONE 6: FRACTURE',  bgColor: '#0a0206', gridColor: 'rgba(204,68,255,0.04)',  particleColor: '#cc44ff', groundColor: '#cc44ff', accentColor: '#cc44ff', farLayerContent: 'fractal', persistBackground: true,  bossName: 'FRACTAL ENTITY' },
    { id: 7, name: 'ENTROPY',   label: 'ZONE 7: ENTROPY',   bgColor: '#070505', gridColor: 'rgba(255,68,68,0.03)',   particleColor: '#ff4444', groundColor: '#ff4444', accentColor: '#ff4444', farLayerContent: 'static',  persistBackground: false, bossName: 'ENTROPY VIRUS' },
    { id: 8, name: 'OVERLOAD',  label: 'ZONE 8: OVERLOAD',  bgColor: '#0c0c04', gridColor: 'rgba(255,204,0,0.03)',   particleColor: '#ffcc00', groundColor: '#ffcc00', accentColor: '#ffcc00', farLayerContent: 'overload',persistBackground: false, bossName: 'OVERLOAD TITAN' },
    { id: 9, name: 'SINGULARITY',label:'ZONE 9: SINGULARITY',bgColor:'#020204', gridColor: 'rgba(100,100,255,0.02)', particleColor: '#8888ff', groundColor: '#8888ff', accentColor: '#8888ff', farLayerContent: 'stars',   persistBackground: true,  bossName: 'THE SINGULARITY' },
  ] as ZoneDef[],
} as const;

// ── TOURNAMENTS ────────��──────────────────────────────────────────────────────

export interface TournamentTemplateDef {
  id: string;
  name: string;
  templateName: string;
  /** Duration in hours */
  durationHours: number;
  /** Join window closes after this many hours from start */
  joinWindowHours: number;
  prizeDiamonds: number;
  entryFeeDiamonds: number;
  playerCap: number;
}

export const TOURNAMENT_CONFIG = {
  /** Leaderboard display limit */
  leaderboardLimit: 50,

  /**
   * Entry fee formula: entryFee = Math.floor(prize * entryFeeRatio)
   * Set entryFeeRatio to 0 for free tournaments, or use per-template override.
   * Default ratio applies when a template has no explicit entryFeeDiamonds set.
   */
  entryFeeRatio: 0.1, // 10% of prize by default

  /**
   * Weekly template pool — 7 templates, one per day of the week.
   * Each week the order is shuffled randomly (seed = week number).
   * Each slot is 20h long with a 4h gap between tournaments.
   *
   * To balance:
   *  - prizeDiamonds: reward for 1st place
   *  - entryFeeDiamonds: set explicitly OR leave as 0 to auto-calc from entryFeeRatio
   *  - playerCap: max players in bracket (lower = more exclusive)
   *  - joinWindowHours: how long players can join before lock
   */
  localTemplates: [
    { id: 'byte_rush',  name: 'BYTE RUSH',  templateName: 'byte_rush',  durationHours: 20, joinWindowHours: 4, prizeDiamonds: 100, entryFeeDiamonds: 0,   playerCap: 128 },
    { id: 'null_storm', name: 'NULL STORM', templateName: 'null_storm', durationHours: 20, joinWindowHours: 6, prizeDiamonds: 250, entryFeeDiamonds: 25,  playerCap: 64  },
    { id: 'packet_war', name: 'PACKET WAR', templateName: 'packet_war', durationHours: 20, joinWindowHours: 4, prizeDiamonds: 150, entryFeeDiamonds: 0,   playerCap: 100 },
    { id: 'core_siege', name: 'CORE SIEGE', templateName: 'core_siege', durationHours: 20, joinWindowHours: 8, prizeDiamonds: 500, entryFeeDiamonds: 50,  playerCap: 32  },
    { id: 'signal_run', name: 'SIGNAL RUN', templateName: 'signal_run', durationHours: 20, joinWindowHours: 4, prizeDiamonds: 200, entryFeeDiamonds: 20,  playerCap: 100 },
    { id: 'data_blitz', name: 'DATA BLITZ', templateName: 'data_blitz', durationHours: 20, joinWindowHours: 3, prizeDiamonds: 75,  entryFeeDiamonds: 0,   playerCap: 64  },
    { id: 'void_clash', name: 'VOID CLASH', templateName: 'void_clash', durationHours: 20, joinWindowHours: 6, prizeDiamonds: 350, entryFeeDiamonds: 35,  playerCap: 50  },
  ] as TournamentTemplateDef[],
} as const;

// ── CLANS ─────────────────────────────────────────────────────────────────────

export const CLAN_CONFIG = {
  /** Minimum clan name length */
  nameMinLength: 3,
  /** Maximum clan name length */
  nameMaxLength: 24,
  /** Minimum clan tag length */
  tagMinLength: 2,
  /** Maximum clan tag length */
  tagMaxLength: 5,
  /** Maximum clan description length */
  descriptionMaxLength: 200,
  /** Regex pattern for valid clan tags */
  tagPattern: /^[A-Z0-9]+$/,
} as const;

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

export const LEADERBOARD_CONFIG = {
  /** Number of entries to display on leaderboard */
  displayLimit: 100,
  /** Number of entries to load from DB */
  loadLimit: 100,
} as const;

// ── UI TIMING ──────────────────���──────────────────────────────────────────────

export const UI_CONFIG = {
  /** Duration of enemy hit animation in ms */
  enemyHitAnimationMs: 180,
  /** Duration of screen flash on hit in ms */
  screenFlashMs: 120,
  /** Duration of stage clear display in ms */
  stageClearDisplayMs: 500,
  /** Duration of zone transition display in ms */
  zoneTransitionMs: 2200,
  /** Duration of tap ripple effect in ms */
  rippleEffectMs: 380,
  /** Maximum damage numbers shown at once */
  maxDamageNumbers: 12,
  /** Maximum ripples shown at once */
  maxRipples: 6,
  /** Skill bar refresh interval in ms */
  skillBarRefreshMs: 100,
  /** Tournament refresh feedback duration in ms */
  tournamentRefreshMs: 1000,
  /** Overclock pulse animation interval in ms */
  overclockPulseMs: 900,
  /** Milestone stages shown in overclock panel */
  overclockMilestones: [25, 50, 100, 200] as number[],
  /** Tier progress denominator (runs per tier) */
  tierProgressRuns: 3,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// GOD FORMULA SET ITEM SYSTEM v2.0 - BOSS DROP RARE SETS
// ═════════════════════════════════════════════════════════════════════════���═════
//
// SET DROP MECHANICS:
// - Set pieces ONLY drop from bosses (stage 10, 20, 30, etc.)
// - Each set has a minimum stage requirement
// - Drop chance is LOW but increases with stage and OC tier
// - Sets are the ultimate endgame goal
//
// SET BALANCE:
// - Early sets (Neural Nexus, Void Lattice): Available from stage 100+
// - Mid sets (Ghost Protocol, Entropy Engine): Available from stage 500+
// - Late sets (Singularity Core, Quantum Array): Available from stage 2000+
// - Endgame sets (Omega Cascade, Infinite Loop): Available from stage 10000+
// - Ultimate sets (Transcendence): Available from stage 100000+
//
// DROP CHANCE FORMULA:
// baseChance = 0.5% (1/200 bosses)
// stageBonus = +0.1% per 100 stages above requirement
// tierBonus = +0.5% per OC tier
// maxChance = 5% (1/20 bosses)
// ═══════════════════════════════════════════════════════════════════════════════

export const SET_DROP_CONFIG = {
  /** Base chance for a set piece to drop from a boss (0.005 = 0.5%) */
  baseDropChance: 0.005,
  /** Additional drop chance per 100 stages above set requirement */
  stageDropBonus: 0.001,
  /** Additional drop chance per OC tier */
  tierDropBonus: 0.005,
  /** Maximum drop chance for set pieces (0.05 = 5%) */
  maxDropChance: 0.05,
  /** If true, can only drop pieces you don't already own */
  smartDrop: true,
  /** If true, higher stage = higher chance for rare sets */
  weightedRarity: true,
} as const;

export const SET_CATALOG: SetDef[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // EARLY GAME SETS (Stage 100+) - Starter sets to teach the system
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── NEURAL NEXUS (Idle DPS Focus) ──────────────────────────────────────────
  {
    id: 'neural_nexus',
    name: 'NEURAL NEXUS',
    description: 'Cerebral implants forged in the darkest server farms.',
    color: '#00f5ff',
    minStage: 100,
    dropWeight: 100, // Higher = more common
    setBonusDescription: 'Full set: x2 idle DPS',
    setBonus: [{ type: 'idle_dps', value: 2.0, isMultiplier: true }],
    pieces: [
      { name: 'NEXUS_SPINE',   slot: 'CPU', flavorText: 'The backbone of a machine that should not think, but does.',   stats: [{ type: 'idle_dps', value: 1.5, isMultiplier: true }, { type: 'crit_chance',     value: 0.05, isMultiplier: false }] },
      { name: 'NEXUS_CORTEX',  slot: 'RAM', flavorText: 'Memory banks that remember attacks before they happen.',       stats: [{ type: 'idle_dps', value: 1.5, isMultiplier: true }, { type: 'tap_damage',      value: 1.3,  isMultiplier: true  }] },
      { name: 'NEXUS_SYNAPSE', slot: 'GPU', flavorText: 'Renders destruction in parallel threads of neural fire.',     stats: [{ type: 'idle_dps', value: 1.6, isMultiplier: true }, { type: 'crit_multiplier', value: 1.4,  isMultiplier: true  }] },
    ],
  },
  
  // ── VOID LATTICE (Hybrid Balanced) ─────────────────────────��───────────────
  {
    id: 'void_lattice',
    name: 'VOID LATTICE',
    description: 'Harvested from between dimensions. Perfectly balanced destruction.',
    color: '#00ff88',
    minStage: 100,
    dropWeight: 100,
    setBonusDescription: 'Full set: +40% ALL stats (tap, DPS, gold, crit)',
    setBonus: [
      { type: 'tap_damage', value: 1.4, isMultiplier: true },
      { type: 'idle_dps', value: 1.4, isMultiplier: true },
      { type: 'gold_rate', value: 1.4, isMultiplier: true },
      { type: 'crit_chance', value: 0.08, isMultiplier: false },
    ],
    pieces: [
      { name: 'VOID_NODE',   slot: 'CPU',       flavorText: 'A processing unit that exists in negative space.',      stats: [{ type: 'tap_damage', value: 1.4, isMultiplier: true }, { type: 'idle_dps',        value: 1.4, isMultiplier: true }] },
      { name: 'VOID_CACHE',  slot: 'RAM',       flavorText: 'Memory that remembers what never happened.',             stats: [{ type: 'idle_dps',   value: 1.5, isMultiplier: true }, { type: 'gold_rate',       value: 1.3, isMultiplier: true }] },
      { name: 'VOID_SHADER', slot: 'GPU',       flavorText: 'Renders attacks from impossible angles.',                stats: [{ type: 'tap_damage', value: 1.5, isMultiplier: true }, { type: 'crit_multiplier', value: 1.3, isMultiplier: true }] },
      { name: 'VOID_BRIDGE', slot: 'EXPANSION', flavorText: 'Connects your rig to the space between spaces.',         stats: [{ type: 'gold_rate',  value: 1.5, isMultiplier: true }, { type: 'crit_chance',     value: 0.05, isMultiplier: false }] },
    ],
  },
  
  // ════════════════════════════════════���══════════════════════════════════════
  // MID GAME SETS (Stage 500+) - Specialized builds
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── GHOST PROTOCOL (Tap + Crit Focus) ──────────────────────────────────────
  {
    id: 'ghost_protocol',
    name: 'GHOST PROTOCOL',
    description: 'Zero-trace equipment. No logs. No mercy.',
    color: '#ff0080',
    minStage: 500,
    dropWeight: 80,
    setBonusDescription: 'Full set: +60% tap damage + +15% crit chance',
    setBonus: [
      { type: 'tap_damage', value: 1.6, isMultiplier: true },
      { type: 'crit_chance', value: 0.15, isMultiplier: false },
    ],
    pieces: [
      { name: 'GHOST_BARREL', slot: 'GPU',       flavorText: 'Fires before the enemy has a threat model.',              stats: [{ type: 'tap_damage', value: 1.6,  isMultiplier: true  }, { type: 'crit_chance',     value: 0.08, isMultiplier: false }] },
      { name: 'GHOST_VEIL',   slot: 'EXPANSION', flavorText: 'Cloaks your attack vector in 128-bit silence.',          stats: [{ type: 'tap_damage', value: 1.5,  isMultiplier: true  }, { type: 'gold_rate',       value: 1.3,  isMultiplier: true  }] },
      { name: 'GHOST_BLADE',  slot: 'CPU',       flavorText: 'Executes precision kills at the instruction level.',      stats: [{ type: 'tap_damage', value: 1.6,  isMultiplier: true  }, { type: 'crit_multiplier', value: 1.5,  isMultiplier: true  }] },
      { name: 'GHOST_TRACE',  slot: 'RAM',       flavorText: "Tracks enemies through memory they don't own.",          stats: [{ type: 'tap_damage', value: 1.5,  isMultiplier: true  }, { type: 'crit_chance',     value: 0.06, isMultiplier: false }] },
    ],
  },
  
  // ── ENTROPY ENGINE (Crit Damage Focus) ───────────────────────────────��─────
  {
    id: 'entropy_engine',
    name: 'ENTROPY ENGINE',
    description: 'Chaos weaponized. Every hit is a dice roll against oblivion.',
    color: '#9933ff',
    minStage: 500,
    dropWeight: 80,
    setBonusDescription: 'Full set: x2 crit damage + +12% crit chance',
    setBonus: [
      { type: 'crit_multiplier', value: 2.0, isMultiplier: true },
      { type: 'crit_chance', value: 0.12, isMultiplier: false },
    ],
    pieces: [
      { name: 'ENTROPY_CORE',   slot: 'CPU', flavorText: 'Processes randomness into pure destruction.',                 stats: [{ type: 'crit_multiplier', value: 1.8, isMultiplier: true }, { type: 'crit_chance', value: 0.10, isMultiplier: false }] },
      { name: 'ENTROPY_FLUX',   slot: 'GPU', flavorText: 'Renders probability collapse in real-time.',                  stats: [{ type: 'crit_multiplier', value: 1.7, isMultiplier: true }, { type: 'tap_damage',  value: 1.5,  isMultiplier: true  }] },
      { name: 'ENTROPY_BUFFER', slot: 'RAM', flavorText: 'Stores infinite potential outcomes. Delivers the worst one.', stats: [{ type: 'crit_multiplier', value: 1.6, isMultiplier: true }, { type: 'idle_dps',    value: 1.4,  isMultiplier: true  }] },
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LATE GAME SETS (Stage 2000+) - Powerful specialized builds
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── SINGULARITY CORE (Gold Focus) ──────────────────────────────────────────
  {
    id: 'singularity_core',
    name: 'SINGULARITY CORE',
    description: 'Beyond the event horizon of power.',
    color: '#ffaa00',
    minStage: 2000,
    dropWeight: 60,
    setBonusDescription: 'Full set: x3 gold rate',
    setBonus: [{ type: 'gold_rate', value: 3.0, isMultiplier: true }],
    pieces: [
      { name: 'SINGULARITY_LENS',   slot: 'GPU',       flavorText: 'Focuses all available value through a single computational point.', stats: [{ type: 'gold_rate', value: 2.0, isMultiplier: true }, { type: 'idle_dps',        value: 1.4, isMultiplier: true }] },
      { name: 'SINGULARITY_VAULT',  slot: 'EXPANSION', flavorText: 'Stores wealth in a dimension with no withdrawal limits.',            stats: [{ type: 'gold_rate', value: 2.0, isMultiplier: true }, { type: 'tap_damage',      value: 1.4, isMultiplier: true }] },
      { name: 'SINGULARITY_MATRIX', slot: 'RAM',       flavorText: 'A memory system that converts computation directly into wealth.',    stats: [{ type: 'gold_rate', value: 1.8, isMultiplier: true }, { type: 'crit_multiplier', value: 1.5, isMultiplier: true }] },
      { name: 'SINGULARITY_ANCHOR', slot: 'CPU',       flavorText: 'Tethers your rig to the most profitable timeline.',                  stats: [{ type: 'gold_rate', value: 1.7, isMultiplier: true }, { type: 'idle_dps',        value: 1.5, isMultiplier: true }] },
      { name: 'SINGULARITY_CROWN',  slot: 'GPU',       flavorText: 'The sovereign piece. Alone it is powerful. Together it is absolute.',stats: [{ type: 'gold_rate', value: 2.5, isMultiplier: true }, { type: 'tap_damage',      value: 1.6, isMultiplier: true }] },
    ],
  },
  
  // ── QUANTUM ARRAY (Tap Focus) ──────────────────────────────────────────────
  {
    id: 'quantum_array',
    name: 'QUANTUM ARRAY',
    description: 'Each tap exists in all states until observed. Then it destroys.',
    color: '#ff6600',
    minStage: 2000,
    dropWeight: 60,
    setBonusDescription: 'Full set: x2.5 tap damage',
    setBonus: [{ type: 'tap_damage', value: 2.5, isMultiplier: true }],
    pieces: [
      { name: 'QUANTUM_PROCESSOR', slot: 'CPU',       flavorText: 'Computes attacks across parallel timelines.',               stats: [{ type: 'tap_damage', value: 2.0, isMultiplier: true }, { type: 'crit_chance',     value: 0.08, isMultiplier: false }] },
      { name: 'QUANTUM_BUFFER',    slot: 'RAM',       flavorText: 'Holds superposition states until collapse.',                 stats: [{ type: 'tap_damage', value: 1.8, isMultiplier: true }, { type: 'idle_dps',        value: 1.4,  isMultiplier: true  }] },
      { name: 'QUANTUM_RENDERER',  slot: 'GPU',       flavorText: 'Visualizes every possible outcome. Selects the lethal one.',stats: [{ type: 'tap_damage', value: 2.2, isMultiplier: true }, { type: 'crit_multiplier', value: 1.6,  isMultiplier: true  }] },
      { name: 'QUANTUM_ENTANGLER', slot: 'EXPANSION', flavorText: 'Links your attacks to distant, unsuspecting targets.',       stats: [{ type: 'tap_damage', value: 1.7, isMultiplier: true }, { type: 'gold_rate',       value: 1.4,  isMultiplier: true  }] },
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENDGAME SETS (Stage 10000+) - Extremely powerful, rare drops
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── OMEGA CASCADE (Ultimate DPS) ───────────────────────────────────────────
  {
    id: 'omega_cascade',
    name: 'OMEGA CASCADE',
    description: 'The final evolution of destruction. Each piece amplifies the others.',
    color: '#ff2222',
    minStage: 10000,
    dropWeight: 40,
    setBonusDescription: 'Full set: x3 tap + x3 idle + +20% crit chance',
    setBonus: [
      { type: 'tap_damage', value: 3.0, isMultiplier: true },
      { type: 'idle_dps', value: 3.0, isMultiplier: true },
      { type: 'crit_chance', value: 0.20, isMultiplier: false },
    ],
    pieces: [
      { name: 'OMEGA_CORE',     slot: 'CPU',       flavorText: 'The processor that ends all processes.',                 stats: [{ type: 'tap_damage', value: 2.5, isMultiplier: true }, { type: 'idle_dps',        value: 2.0,  isMultiplier: true }] },
      { name: 'OMEGA_MATRIX',   slot: 'RAM',       flavorText: 'Memory that forgets nothing. Forgives less.',            stats: [{ type: 'idle_dps',   value: 2.5, isMultiplier: true }, { type: 'tap_damage',      value: 2.0,  isMultiplier: true }] },
      { name: 'OMEGA_RENDERER', slot: 'GPU',       flavorText: 'Draws destruction in infinite resolution.',              stats: [{ type: 'tap_damage', value: 3.0, isMultiplier: true }, { type: 'crit_multiplier', value: 2.0,  isMultiplier: true }] },
      { name: 'OMEGA_BRIDGE',   slot: 'EXPANSION', flavorText: 'Connects all systems to maximum output.',                stats: [{ type: 'gold_rate',  value: 2.0, isMultiplier: true }, { type: 'crit_chance',     value: 0.12, isMultiplier: false }] },
    ],
  },
  
  // ── INFINITE LOOP (Ultimate Crit) ──────────────────────────────────────────
  {
    id: 'infinite_loop',
    name: 'INFINITE LOOP',
    description: 'An endless cycle of critical devastation.',
    color: '#cc00ff',
    minStage: 10000,
    dropWeight: 40,
    setBonusDescription: 'Full set: x4 crit damage + +25% crit chance',
    setBonus: [
      { type: 'crit_multiplier', value: 4.0, isMultiplier: true },
      { type: 'crit_chance', value: 0.25, isMultiplier: false },
    ],
    pieces: [
      { name: 'LOOP_INITIATOR', slot: 'CPU',       flavorText: 'Begins the sequence. Ends all enemies.',                 stats: [{ type: 'crit_multiplier', value: 2.5, isMultiplier: true }, { type: 'crit_chance', value: 0.15, isMultiplier: false }] },
      { name: 'LOOP_CACHE',     slot: 'RAM',       flavorText: 'Remembers every critical hit. Amplifies the next.',      stats: [{ type: 'crit_multiplier', value: 2.2, isMultiplier: true }, { type: 'tap_damage',  value: 2.0,  isMultiplier: true  }] },
      { name: 'LOOP_SHADER',    slot: 'GPU',       flavorText: 'Renders criticals in an endless fractal of pain.',       stats: [{ type: 'crit_multiplier', value: 2.8, isMultiplier: true }, { type: 'idle_dps',    value: 2.0,  isMultiplier: true  }] },
      { name: 'LOOP_EXPANDER',  slot: 'EXPANSION', flavorText: 'Extends the loop to all connected systems.',             stats: [{ type: 'crit_chance',     value: 0.18, isMultiplier: false }, { type: 'gold_rate', value: 2.0,  isMultiplier: true  }] },
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ULTIMATE SETS (Stage 100000+) - The rarest, most powerful equipment
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── TRANSCENDENCE (GOD SET) ────────────────────────────────────────────────
  {
    id: 'transcendence',
    name: 'TRANSCENDENCE',
    description: 'Beyond hardware. Beyond software. Beyond comprehension.',
    color: '#ffffff',
    minStage: 100000,
    dropWeight: 10,
    setBonusDescription: 'Full set: x5 ALL damage + x5 gold + +30% crit + x5 crit damage',
    setBonus: [
      { type: 'tap_damage', value: 5.0, isMultiplier: true },
      { type: 'idle_dps', value: 5.0, isMultiplier: true },
      { type: 'gold_rate', value: 5.0, isMultiplier: true },
      { type: 'crit_chance', value: 0.30, isMultiplier: false },
      { type: 'crit_multiplier', value: 5.0, isMultiplier: true },
    ],
    pieces: [
      { name: 'TRANS_MIND',     slot: 'CPU',       flavorText: 'Processes thoughts that should not exist.',              stats: [{ type: 'tap_damage', value: 4.0, isMultiplier: true }, { type: 'idle_dps',        value: 4.0, isMultiplier: true }] },
      { name: 'TRANS_MEMORY',   slot: 'RAM',       flavorText: 'Remembers the future. Forgets the impossible.',          stats: [{ type: 'idle_dps',   value: 4.5, isMultiplier: true }, { type: 'gold_rate',       value: 3.0, isMultiplier: true }] },
      { name: 'TRANS_VISION',   slot: 'GPU',       flavorText: 'Sees all timelines. Chooses the one where you win.',     stats: [{ type: 'tap_damage', value: 4.5, isMultiplier: true }, { type: 'crit_multiplier', value: 3.0, isMultiplier: true }] },
      { name: 'TRANS_LINK',     slot: 'EXPANSION', flavorText: 'Connects to everything. Limited by nothing.',            stats: [{ type: 'gold_rate',  value: 4.0, isMultiplier: true }, { type: 'crit_chance',     value: 0.20, isMultiplier: false }] },
      { name: 'TRANS_CORE',     slot: 'CPU',       flavorText: 'The heart of a god. Beats with infinite power.',         stats: [{ type: 'crit_multiplier', value: 4.0, isMultiplier: true }, { type: 'crit_chance', value: 0.18, isMultiplier: false }] },
    ],
  },
];
