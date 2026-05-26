import type { IPlugin, IEngine, GameState, OverclockUpgrade } from '../engine/types';

export type PerkBranch = 'VOLTAGE' | 'SIGNAL' | 'THERMAL';

export interface OverclockPerkDef {
  id: string;
  name: string;
  flavor: string;
  description: string;
  branch: PerkBranch;
  branchRank: number;
  maxLevel: number;
  costPerLevel: number;
  modifierType: 'tap_damage' | 'idle_dps' | 'gold_rate' | 'crit_chance' | 'crit_multiplier';
  valuePerLevel: number;
  isMultiplier: boolean;
  color: string;
  requiresTier?: number;
}

export const OVERCLOCK_PERKS: OverclockPerkDef[] = [
  // ── VOLTAGE — raw damage, tap power, crit burst ──────────────────
  {
    id: 'voltage_spike',
    name: 'VOLTAGE_SPIKE',
    flavor: 'Raw current surges through every keystroke.',
    description: '+35% tap damage per level',
    branch: 'VOLTAGE',
    branchRank: 1,
    maxLevel: 8,
    costPerLevel: 1,
    modifierType: 'tap_damage',
    valuePerLevel: 0.35,
    isMultiplier: true,
    color: '#00f5ff',
  },
  {
    id: 'zero_day',
    name: 'ZERO_DAY',
    flavor: 'Exploit before the patch drops. Strike first.',
    description: '+6% crit chance per level',
    branch: 'VOLTAGE',
    branchRank: 2,
    maxLevel: 6,
    costPerLevel: 2,
    modifierType: 'crit_chance',
    valuePerLevel: 0.06,
    isMultiplier: false,
    color: '#00d4e8',
  },
  {
    id: 'exploit_chain',
    name: 'EXPLOIT_CHAIN',
    flavor: 'Cascade vulnerabilities. Each hit opens the next.',
    description: '+60% crit damage per level',
    branch: 'VOLTAGE',
    branchRank: 3,
    maxLevel: 5,
    costPerLevel: 3,
    modifierType: 'crit_multiplier',
    valuePerLevel: 0.60,
    isMultiplier: false,
    color: '#00b8cc',
    requiresTier: 2,
  },

  // ── SIGNAL — gold economy, run acceleration ──────────────────────
  {
    id: 'ghost_protocol',
    name: 'GHOST_PROTOCOL',
    flavor: 'Route gold through untraceable channels.',
    description: '+25% gold rate per level',
    branch: 'SIGNAL',
    branchRank: 1,
    maxLevel: 8,
    costPerLevel: 1,
    modifierType: 'gold_rate',
    valuePerLevel: 0.25,
    isMultiplier: true,
    color: '#ffaa00',
  },
  {
    id: 'dead_drop',
    name: 'DEAD_DROP',
    flavor: 'Stashed cache. Every run starts with a head start.',
    description: '+40% gold rate (stacks hard)',
    branch: 'SIGNAL',
    branchRank: 2,
    maxLevel: 5,
    costPerLevel: 2,
    modifierType: 'gold_rate',
    valuePerLevel: 0.40,
    isMultiplier: true,
    color: '#e89500',
    requiresTier: 1,
  },
  {
    id: 'data_launder',
    name: 'DATA_LAUNDER',
    flavor: 'Clean dirty signals into pure throughput.',
    description: '+50% gold rate (endgame tier)',
    branch: 'SIGNAL',
    branchRank: 3,
    maxLevel: 4,
    costPerLevel: 4,
    modifierType: 'gold_rate',
    valuePerLevel: 0.50,
    isMultiplier: true,
    color: '#cc8400',
    requiresTier: 3,
  },

  // ── THERMAL — sustained idle DPS ─────────────────────────────────
  {
    id: 'phantom_thread',
    name: 'PHANTOM_THREAD',
    flavor: 'Silent processes eating cycles in the dark.',
    description: '+30% idle DPS per level',
    branch: 'THERMAL',
    branchRank: 1,
    maxLevel: 8,
    costPerLevel: 1,
    modifierType: 'idle_dps',
    valuePerLevel: 0.30,
    isMultiplier: true,
    color: '#39ff14',
  },
  {
    id: 'thermal_runaway',
    name: 'THERMAL_RUNAWAY',
    flavor: 'Controlled meltdown. Sustained burn into oblivion.',
    description: '+45% idle DPS per level',
    branch: 'THERMAL',
    branchRank: 2,
    maxLevel: 6,
    costPerLevel: 2,
    modifierType: 'idle_dps',
    valuePerLevel: 0.45,
    isMultiplier: true,
    color: '#29dd09',
    requiresTier: 1,
  },
  {
    id: 'neural_overclock',
    name: 'NEURAL_OVERCLOCK',
    flavor: 'Fry your synapses. CPU and flesh become one.',
    description: '+60% idle DPS — peak thermal output',
    branch: 'THERMAL',
    branchRank: 3,
    maxLevel: 4,
    costPerLevel: 4,
    modifierType: 'idle_dps',
    valuePerLevel: 0.60,
    isMultiplier: true,
    color: '#19bb00',
    requiresTier: 3,
  },
];

export const BRANCH_COLORS: Record<PerkBranch, string> = {
  VOLTAGE: '#00f5ff',
  SIGNAL: '#ffaa00',
  THERMAL: '#39ff14',
};

export const TIER_NAMES: string[] = [
  'STOCK',
  'OVERCLOCKED',
  'MODDED',
  'JAILBROKEN',
  'KERNEL HACKED',
  'SILICON GHOST',
];

// Every 5 stages beyond stage 10 earn increasing OCT chunks.
// Milestone bonuses at stages 25, 50, 100, 200.
// Each overclock tier multiplies future gain by +25%.
export function calculateOverclockGain(highestStage: number, tier: number): number {
  if (highestStage < 10) return 0;
  const base = Math.floor((highestStage - 10) / 5) + 1;
  const milestoneBonus =
    (highestStage >= 200 ? 20 : 0) +
    (highestStage >= 100 ? 10 : 0) +
    (highestStage >= 50 ? 5 : 0) +
    (highestStage >= 25 ? 2 : 0);
  const tierMultiplier = 1 + tier * 0.25;
  return Math.max(1, Math.floor((base + milestoneBonus) * tierMultiplier));
}

// Tier increases every 3 overclock runs, capped at TIER_NAMES.length - 1
export function calculateTier(totalOverclocks: number): number {
  return Math.min(Math.floor(totalOverclocks / 3), TIER_NAMES.length - 1);
}

export function getOverclockPerkLevel(upgrades: Record<string, OverclockUpgrade>, perkId: string): number {
  return upgrades[perkId]?.level ?? 0;
}

export function isPerkUnlocked(
  perk: OverclockPerkDef,
  upgrades: Record<string, OverclockUpgrade>,
  tier: number,
): boolean {
  if (perk.requiresTier !== undefined && tier < perk.requiresTier) return false;
  if (perk.branchRank > 1) {
    const prev = OVERCLOCK_PERKS.find(
      p => p.branch === perk.branch && p.branchRank === perk.branchRank - 1,
    );
    if (prev && getOverclockPerkLevel(upgrades, prev.id) < 1) return false;
  }
  return true;
}

export class OverclockPlugin implements IPlugin {
  id = 'overclock';
  stateKeys = ['overclockCount', 'overclockTier', 'totalOverclocks', 'overclockUpgrades'] as (keyof GameState)[];
  defaultState = { overclockCount: 0, overclockTier: 0, totalOverclocks: 0, overclockUpgrades: {} };

  private engine!: IEngine;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.on('state_sync', () => {
      this.applyAllModifiers();
    });
  }

  canOverclock(): boolean {
    const state = this.engine.state;
    return calculateOverclockGain(state.highestStage ?? state.stage, state.overclockTier ?? 0) > 0;
  }

  getAvailableOCT(): number {
    return this.engine.state.overclockCount - this.getSpentOCT();
  }

  getSpentOCT(): number {
    const upgrades = this.engine.state.overclockUpgrades ?? {};
    let spent = 0;
    for (const perk of OVERCLOCK_PERKS) {
      spent += getOverclockPerkLevel(upgrades, perk.id) * perk.costPerLevel;
    }
    return spent;
  }

  canBuyPerk(perkId: string): boolean {
    const perk = OVERCLOCK_PERKS.find(p => p.id === perkId);
    if (!perk) return false;
    const state = this.engine.state;
    const upgrades = state.overclockUpgrades ?? {};
    const tier = state.overclockTier ?? 0;
    if (!isPerkUnlocked(perk, upgrades, tier)) return false;
    if (getOverclockPerkLevel(upgrades, perkId) >= perk.maxLevel) return false;
    return this.getAvailableOCT() >= perk.costPerLevel;
  }

  buyPerk(perkId: string): boolean {
    if (!this.canBuyPerk(perkId)) return false;
    const upgrades = { ...(this.engine.state.overclockUpgrades ?? {}) };
    const current = upgrades[perkId]?.level ?? 0;
    upgrades[perkId] = { id: perkId, level: current + 1 };
    this.engine.updateState({ overclockUpgrades: upgrades });
    this.applyAllModifiers();
    return true;
  }

  perform(): void {
    const state = this.engine.state;
    const currentTier = state.overclockTier ?? 0;
    const gain = calculateOverclockGain(state.highestStage ?? state.stage, currentTier);
    if (gain <= 0) return;

    const newTotalOverclocks = (state.totalOverclocks ?? 0) + 1;
    const newTier = calculateTier(newTotalOverclocks);
    const newCount = state.overclockCount + gain;

    this.engine.updateState({
      overclockCount: newCount,
      overclockTier: newTier,
      totalOverclocks: newTotalOverclocks,
      stage: 1,
      highestStage: 1,
      gold: 0,
    });

    this.applyAllModifiers();
    this.engine.emit('overclock', { gain, totalOverclocks: newTotalOverclocks, newTier });
    this.engine.emit('save_requested', {});
  }

  private applyAllModifiers(): void {
    this.engine.removeModifiers('overclock');
    const upgrades = this.engine.state.overclockUpgrades ?? {};
    for (const perk of OVERCLOCK_PERKS) {
      const level = getOverclockPerkLevel(upgrades, perk.id);
      if (level <= 0) continue;
      const totalValue = perk.isMultiplier
        ? 1 + level * perk.valuePerLevel
        : level * perk.valuePerLevel;
      this.engine.addModifier('overclock', {
        type: perk.modifierType,
        value: totalValue,
        isMultiplier: perk.isMultiplier,
      });
    }
  }

  cleanup(): void {
    this.engine?.removeModifiers(this.id);
  }
}
