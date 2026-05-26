import type { IPlugin, IEngine, GameState } from '../engine/types';
import type { GoldPlugin } from './GoldPlugin';

export interface MoboTierDef {
  tier: number;
  name: string;
  revision: string;
  goldCost: number;
  ramSlots: number;
  expansionSlots: number;
  description: string;
}

export const MOBO_TIERS: MoboTierDef[] = [
  {
    tier: 0,
    name: 'BUDGET BOARD',
    revision: 'REV.1',
    goldCost: 0,
    ramSlots: 1,
    expansionSlots: 1,
    description: 'Entry level. Single RAM bank, single expansion bay.',
  },
  {
    tier: 1,
    name: 'MODDED BOARD',
    revision: 'REV.2',
    goldCost: 500,
    ramSlots: 2,
    expansionSlots: 1,
    description: 'Dual RAM channel. Increased memory bandwidth.',
  },
  {
    tier: 2,
    name: 'OVERCLOCKED BOARD',
    revision: 'REV.3',
    goldCost: 2500,
    ramSlots: 3,
    expansionSlots: 2,
    description: 'Triple RAM. Second expansion bay. Serious throughput.',
  },
  {
    tier: 3,
    name: 'PHANTOM BOARD',
    revision: 'REV.4',
    goldCost: 10000,
    ramSlots: 4,
    expansionSlots: 2,
    description: 'Quad RAM. Full expansion. Maximum hardware density.',
  },
  {
    tier: 4,
    name: 'SILICON GHOST',
    revision: 'REV.X',
    goldCost: 50000,
    ramSlots: 4,
    expansionSlots: 3,
    description: 'Experimental board. Three expansion bays. Undocumented specs.',
  },
];

export class MoboPlugin implements IPlugin {
  id = 'mobo';
  dependencies = ['gold', 'items'];
  stateKeys = ['motherboardTier', 'ramSlots', 'expansionSlots'] as (keyof GameState)[];
  defaultState = { motherboardTier: 0, ramSlots: 1, expansionSlots: 1 };

  private engine!: IEngine;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
  }

  getCurrentTierDef(): MoboTierDef {
    const tier = this.engine.state.motherboardTier ?? 0;
    return MOBO_TIERS[tier] ?? MOBO_TIERS[0];
  }

  getNextTierDef(): MoboTierDef | null {
    const tier = this.engine.state.motherboardTier ?? 0;
    return MOBO_TIERS[tier + 1] ?? null;
  }

  canUpgrade(): boolean {
    const next = this.getNextTierDef();
    if (!next) return false;
    return this.engine.state.gold >= next.goldCost;
  }

  upgrade(): boolean {
    const next = this.getNextTierDef();
    if (!next) return false;

    const goldPlugin = this.engine.getPlugin<GoldPlugin>('gold');
    if (!goldPlugin?.spend(next.goldCost)) return false;

    // Expand equippedItems arrays for the new slot counts
    const equipped = { ...(this.engine.state.equippedItems ?? {}) };
    while ((equipped.RAM?.length ?? 0) < next.ramSlots) {
      equipped.RAM = [...(equipped.RAM ?? [null]), null];
    }
    while ((equipped.EXPANSION?.length ?? 0) < next.expansionSlots) {
      equipped.EXPANSION = [...(equipped.EXPANSION ?? [null]), null];
    }

    this.engine.updateState({
      motherboardTier: next.tier,
      ramSlots: next.ramSlots,
      expansionSlots: next.expansionSlots,
      equippedItems: equipped,
    });

    this.engine.emit('mobo_upgrade', { tier: next.tier, ramSlots: next.ramSlots, expansionSlots: next.expansionSlots });
    this.engine.emit('save_requested', {});
    return true;
  }

  cleanup(): void {}
}
