// =====================================================================
// Enchantment & Tier-Up Configuration
// Items can be enchanted with scrap to gain bonus stats
// Item tiers can be increased with diamonds for stronger base stats
// =====================================================================

import type { ModifierDef, ItemRarity } from '../engine/types';

// ── ENCHANTMENT SYSTEM ─────────────────────────────────────────────────────────

export interface EnchantmentTierDef {
  /** Enchantment level (1-10) */
  level: number;
  /** Scrap cost to reach this level */
  scrapCost: number;
  /** Stat bonus multiplier for this level (applied to item's base stats) */
  bonusMultiplier: number;
  /** Success chance (1.0 = 100%) - higher enchants have lower success */
  successChance: number;
  /** On failure, lose this many enchant levels (0 = safe) */
  failurePenalty: number;
  /** Display name suffix */
  suffix: string;
  /** Glow color for UI */
  glowColor: string;
}

export const ENCHANTMENT_CONFIG = {
  // ─────────────────────────────────────────────────
  // Enchantment Tiers (1-10)
  // ─────────────────────────────────────────────────
  tiers: [
    { level: 1,  scrapCost: 25,   bonusMultiplier: 1.10, successChance: 1.00, failurePenalty: 0, suffix: '+1',  glowColor: '#4a5a6a' },
    { level: 2,  scrapCost: 50,   bonusMultiplier: 1.22, successChance: 1.00, failurePenalty: 0, suffix: '+2',  glowColor: '#5a6a7a' },
    { level: 3,  scrapCost: 100,  bonusMultiplier: 1.36, successChance: 0.95, failurePenalty: 0, suffix: '+3',  glowColor: '#6a7a8a' },
    { level: 4,  scrapCost: 200,  bonusMultiplier: 1.52, successChance: 0.90, failurePenalty: 0, suffix: '+4',  glowColor: '#00a5af' },
    { level: 5,  scrapCost: 400,  bonusMultiplier: 1.70, successChance: 0.80, failurePenalty: 1, suffix: '+5',  glowColor: '#00c5df' },
    { level: 6,  scrapCost: 750,  bonusMultiplier: 1.90, successChance: 0.65, failurePenalty: 1, suffix: '+6',  glowColor: '#00f5ff' },
    { level: 7,  scrapCost: 1500, bonusMultiplier: 2.15, successChance: 0.50, failurePenalty: 2, suffix: '+7',  glowColor: '#39ff14' },
    { level: 8,  scrapCost: 3000, bonusMultiplier: 2.45, successChance: 0.35, failurePenalty: 2, suffix: '+8',  glowColor: '#ffaa00' },
    { level: 9,  scrapCost: 6000, bonusMultiplier: 2.80, successChance: 0.20, failurePenalty: 3, suffix: '+9',  glowColor: '#ff6600' },
    { level: 10, scrapCost: 12000,bonusMultiplier: 3.25, successChance: 0.10, failurePenalty: 3, suffix: '+10', glowColor: '#ff0080' },
  ] as EnchantmentTierDef[],

  /** Max enchantment level */
  maxEnchantLevel: 10,

  /** Rarity multiplier for scrap costs (better items cost more to enchant) */
  rarityScrapMultiplier: {
    Common: 1.0,
    Rare: 1.5,
    Epic: 2.5,
    Legendary: 4.0,
    Mythic: 6.0,
  } as Record<ItemRarity, number>,

  /** Protection scroll cost in diamonds (prevents level loss on failure) */
  protectionScrollCost: 2,

  /** Lucky charm cost in diamonds (increases success chance by 25%) */
  luckyCharmCost: 3,

  /** Guaranteed success scroll cost in diamonds (100% success) */
  guaranteedScrollCost: 10,
} as const;

// ── TIER-UP SYSTEM ─────────────────────────────────────────────────────────────

export interface ItemTierUpDef {
  /** Target tier after upgrade */
  targetTier: number;
  /** Diamond cost for this upgrade */
  diamondCost: number;
  /** Stat increase multiplier for upgrading to this tier */
  statMultiplier: number;
  /** Success chance (1.0 = 100%) */
  successChance: number;
  /** Minimum item rarity required */
  minRarity: ItemRarity;
}

export const TIER_UP_CONFIG = {
  // ─────────────────────────────────────────────────
  // Tier upgrade definitions
  // Each tier grants stronger base stats
  // ─────────────────────────────────────────────────
  upgrades: [
    { targetTier: 1,  diamondCost: 1,  statMultiplier: 1.15, successChance: 1.00, minRarity: 'Common' },
    { targetTier: 2,  diamondCost: 2,  statMultiplier: 1.32, successChance: 1.00, minRarity: 'Common' },
    { targetTier: 3,  diamondCost: 3,  statMultiplier: 1.52, successChance: 0.95, minRarity: 'Common' },
    { targetTier: 4,  diamondCost: 5,  statMultiplier: 1.75, successChance: 0.90, minRarity: 'Rare' },
    { targetTier: 5,  diamondCost: 8,  statMultiplier: 2.00, successChance: 0.85, minRarity: 'Rare' },
    { targetTier: 6,  diamondCost: 12, statMultiplier: 2.30, successChance: 0.75, minRarity: 'Epic' },
    { targetTier: 7,  diamondCost: 18, statMultiplier: 2.65, successChance: 0.65, minRarity: 'Epic' },
    { targetTier: 8,  diamondCost: 25, statMultiplier: 3.05, successChance: 0.50, minRarity: 'Legendary' },
    { targetTier: 9,  diamondCost: 35, statMultiplier: 3.50, successChance: 0.35, minRarity: 'Legendary' },
    { targetTier: 10, diamondCost: 50, statMultiplier: 4.00, successChance: 0.20, minRarity: 'Legendary' },
  ] as ItemTierUpDef[],

  /** Max item tier */
  maxTier: 10,

  /** On failure, item tier is reduced by this amount (0 = no loss) */
  failurePenalty: 0,

  /** Diamond cost for protection (prevents tier loss on failure) */
  tierProtectionCost: 5,
} as const;

// ── STRATEGIC BUILD BONUSES ────────────────────────────────────────────────────
// Different enchantment paths for different playstyles

export type EnchantBuildType = 'balanced' | 'tap_master' | 'idle_king' | 'gold_hoarder' | 'crit_assassin';

export interface EnchantBuildDef {
  id: EnchantBuildType;
  name: string;
  description: string;
  color: string;
  /** Bonus stats when item reaches +5 enchant with this build */
  tier5Bonus: ModifierDef;
  /** Additional bonus stats when item reaches +10 enchant */
  tier10Bonus: ModifierDef;
  /** Required enchant level on 3+ equipped items to activate build synergy */
  synergyThreshold: number;
  /** Synergy bonus when threshold is met */
  synergyBonus: ModifierDef;
}

export const ENCHANT_BUILDS: EnchantBuildDef[] = [
  {
    id: 'balanced',
    name: 'EQUILIBRIUM',
    description: 'Jack of all trades. Modest bonuses across the board.',
    color: '#6a7a8a',
    tier5Bonus: { type: 'tap_damage', value: 1.15, isMultiplier: true },
    tier10Bonus: { type: 'idle_dps', value: 1.20, isMultiplier: true },
    synergyThreshold: 5,
    synergyBonus: { type: 'gold_rate', value: 1.25, isMultiplier: true },
  },
  {
    id: 'tap_master',
    name: 'FINGER OF GOD',
    description: 'Maximum tap damage. For those who click relentlessly.',
    color: '#00f5ff',
    tier5Bonus: { type: 'tap_damage', value: 1.30, isMultiplier: true },
    tier10Bonus: { type: 'tap_damage', value: 1.50, isMultiplier: true },
    synergyThreshold: 7,
    synergyBonus: { type: 'crit_chance', value: 0.15, isMultiplier: false },
  },
  {
    id: 'idle_king',
    name: 'PASSIVE DOMINION',
    description: 'Let your components do the work. AFK to victory.',
    color: '#39ff14',
    tier5Bonus: { type: 'idle_dps', value: 1.35, isMultiplier: true },
    tier10Bonus: { type: 'idle_dps', value: 1.60, isMultiplier: true },
    synergyThreshold: 7,
    synergyBonus: { type: 'idle_dps', value: 1.30, isMultiplier: true },
  },
  {
    id: 'gold_hoarder',
    name: 'MIDAS PROTOCOL',
    description: 'Everything you touch turns to gold. Literally.',
    color: '#ffaa00',
    tier5Bonus: { type: 'gold_rate', value: 1.40, isMultiplier: true },
    tier10Bonus: { type: 'gold_rate', value: 1.75, isMultiplier: true },
    synergyThreshold: 6,
    synergyBonus: { type: 'gold_rate', value: 1.50, isMultiplier: true },
  },
  {
    id: 'crit_assassin',
    name: 'KILL VECTOR',
    description: 'High risk, high reward. Crits or nothing.',
    color: '#ff0080',
    tier5Bonus: { type: 'crit_chance', value: 0.10, isMultiplier: false },
    tier10Bonus: { type: 'crit_multiplier', value: 1.80, isMultiplier: true },
    synergyThreshold: 8,
    synergyBonus: { type: 'crit_multiplier', value: 2.00, isMultiplier: true },
  },
];

// ── UTILITY FUNCTIONS ──────────────────────────────────────────────────────────

export function getEnchantTier(level: number): EnchantmentTierDef | null {
  return ENCHANTMENT_CONFIG.tiers.find(t => t.level === level) ?? null;
}

export function getNextEnchantTier(currentLevel: number): EnchantmentTierDef | null {
  const nextLevel = currentLevel + 1;
  if (nextLevel > ENCHANTMENT_CONFIG.maxEnchantLevel) return null;
  return getEnchantTier(nextLevel);
}

export function getEnchantCost(level: number, rarity: ItemRarity): number {
  const tier = getEnchantTier(level);
  if (!tier) return Infinity;
  return Math.floor(tier.scrapCost * ENCHANTMENT_CONFIG.rarityScrapMultiplier[rarity]);
}

export function getTierUpDef(targetTier: number): ItemTierUpDef | null {
  return TIER_UP_CONFIG.upgrades.find(u => u.targetTier === targetTier) ?? null;
}

export function canTierUp(currentTier: number, rarity: ItemRarity): { canUpgrade: boolean; reason?: string } {
  const nextTier = currentTier + 1;
  if (nextTier > TIER_UP_CONFIG.maxTier) return { canUpgrade: false, reason: 'Maximum tier reached' };
  
  const tierDef = getTierUpDef(nextTier);
  if (!tierDef) return { canUpgrade: false, reason: 'Tier data not found' };
  
  const rarityOrder: ItemRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  const currentRarityIdx = rarityOrder.indexOf(rarity);
  const minRarityIdx = rarityOrder.indexOf(tierDef.minRarity);
  
  if (currentRarityIdx < minRarityIdx) {
    return { canUpgrade: false, reason: `Requires ${tierDef.minRarity} or higher rarity` };
  }
  
  return { canUpgrade: true };
}
