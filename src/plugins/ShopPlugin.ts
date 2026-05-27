import type { IPlugin, IEngine, GameState, GameEvent, Player } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  currency: 'oct' | 'diamond';
  price: number;
  modifierType: 'tap_damage' | 'idle_dps' | 'gold_rate' | 'crit_chance' | 'crit_multiplier';
  modifierValue: number;
  isMultiplier: boolean;
  color: string;
  icon: string;
  maxPurchases: number;
  tier: 'early' | 'mid' | 'late' | 'endgame';
}

// OC Token store — deliberately expensive; requires deep investment in Overclock runs
export const OCT_CATALOG: ShopItem[] = [
  // Early (10–25 OC) — requires multiple overclocks just to afford one
  { id: 'oct_tap_1', name: 'NEURAL SPIKE I', description: '+10% tap damage permanently', currency: 'oct', price: 10, modifierType: 'tap_damage', modifierValue: 1.10, isMultiplier: true, color: '#00f5ff', icon: 'Zap', maxPurchases: 8, tier: 'early' },
  { id: 'oct_dps_1', name: 'HEAT SINK I', description: '+12% idle DPS permanently', currency: 'oct', price: 10, modifierType: 'idle_dps', modifierValue: 1.12, isMultiplier: true, color: '#39ff14', icon: 'Cpu', maxPurchases: 8, tier: 'early' },
  { id: 'oct_gold_1', name: 'SCARCITY MINER I', description: '+15% gold rate permanently', currency: 'oct', price: 15, modifierType: 'gold_rate', modifierValue: 1.15, isMultiplier: true, color: '#ffaa00', icon: 'Coins', maxPurchases: 6, tier: 'early' },
  { id: 'oct_crit_1', name: 'EXPLOIT NEEDLE I', description: '+3% crit chance permanently', currency: 'oct', price: 20, modifierType: 'crit_chance', modifierValue: 0.03, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 6, tier: 'early' },
  // Mid (40–80 OC)
  { id: 'oct_tap_2', name: 'NEURAL SPIKE II', description: '+20% tap damage permanently', currency: 'oct', price: 40, modifierType: 'tap_damage', modifierValue: 1.20, isMultiplier: true, color: '#00f5ff', icon: 'Zap', maxPurchases: 5, tier: 'mid' },
  { id: 'oct_dps_2', name: 'HEAT SINK II', description: '+25% idle DPS permanently', currency: 'oct', price: 45, modifierType: 'idle_dps', modifierValue: 1.25, isMultiplier: true, color: '#39ff14', icon: 'Cpu', maxPurchases: 5, tier: 'mid' },
  { id: 'oct_gold_2', name: 'SCARCITY MINER II', description: '+35% gold rate permanently', currency: 'oct', price: 60, modifierType: 'gold_rate', modifierValue: 1.35, isMultiplier: true, color: '#ffaa00', icon: 'Coins', maxPurchases: 4, tier: 'mid' },
  { id: 'oct_crit_2', name: 'EXPLOIT NEEDLE II', description: '+5% crit chance permanently', currency: 'oct', price: 75, modifierType: 'crit_chance', modifierValue: 0.05, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 4, tier: 'mid' },
  { id: 'oct_critm_1', name: 'KILL CHAIN I', description: '+25% crit damage permanently', currency: 'oct', price: 80, modifierType: 'crit_multiplier', modifierValue: 1.25, isMultiplier: true, color: '#ff0080', icon: 'Target', maxPurchases: 4, tier: 'mid' },
  // Late (120–200 OC)
  { id: 'oct_tap_3', name: 'QUANTUM STRIKE I', description: '+35% tap damage permanently', currency: 'oct', price: 120, modifierType: 'tap_damage', modifierValue: 1.35, isMultiplier: true, color: '#00f5ff', icon: 'Zap', maxPurchases: 3, tier: 'late' },
  { id: 'oct_dps_3', name: 'NEURAL GRID I', description: '+40% idle DPS permanently', currency: 'oct', price: 130, modifierType: 'idle_dps', modifierValue: 1.40, isMultiplier: true, color: '#39ff14', icon: 'Cpu', maxPurchases: 3, tier: 'late' },
  { id: 'oct_gold_3', name: 'FRACTAL VEIN I', description: '+60% gold rate permanently', currency: 'oct', price: 150, modifierType: 'gold_rate', modifierValue: 1.60, isMultiplier: true, color: '#ffaa00', icon: 'Coins', maxPurchases: 3, tier: 'late' },
  { id: 'oct_crit_3', name: 'EXPLOIT NEEDLE III', description: '+8% crit chance permanently', currency: 'oct', price: 175, modifierType: 'crit_chance', modifierValue: 0.08, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 3, tier: 'late' },
  { id: 'oct_critm_2', name: 'KILL CHAIN II', description: '+50% crit damage permanently', currency: 'oct', price: 200, modifierType: 'crit_multiplier', modifierValue: 1.50, isMultiplier: true, color: '#ff0080', icon: 'Target', maxPurchases: 2, tier: 'late' },
  // Endgame (300–600 OC) — extreme investments for max players
  { id: 'oct_tap_4', name: 'SINGULARITY TAP', description: '×2 tap damage permanently', currency: 'oct', price: 300, modifierType: 'tap_damage', modifierValue: 2.0, isMultiplier: true, color: '#00f5ff', icon: 'Zap', maxPurchases: 2, tier: 'endgame' },
  { id: 'oct_dps_4', name: 'SINGULARITY DPS', description: '×2 idle DPS permanently', currency: 'oct', price: 350, modifierType: 'idle_dps', modifierValue: 2.0, isMultiplier: true, color: '#39ff14', icon: 'Cpu', maxPurchases: 2, tier: 'endgame' },
  { id: 'oct_gold_4', name: 'SINGULARITY VAULT', description: '×2.5 gold rate permanently', currency: 'oct', price: 450, modifierType: 'gold_rate', modifierValue: 2.5, isMultiplier: true, color: '#ffaa00', icon: 'Coins', maxPurchases: 1, tier: 'endgame' },
  { id: 'oct_critm_3', name: 'OMEGA CHAIN', description: '×2 crit damage permanently', currency: 'oct', price: 500, modifierType: 'crit_multiplier', modifierValue: 2.0, isMultiplier: true, color: '#ff0080', icon: 'Target', maxPurchases: 1, tier: 'endgame' },
  { id: 'oct_crit_4', name: 'PERFECT AIM PROTOCOL', description: '+15% crit chance permanently', currency: 'oct', price: 600, modifierType: 'crit_chance', modifierValue: 0.15, isMultiplier: false, color: '#ff0080', icon: 'Target', maxPurchases: 1, tier: 'endgame' },
];

// Diamond store — powerful but scarce (diamonds are extremely rare)
export const DIAMOND_CATALOG: ShopItem[] = [
  { id: 'dia_tap_1', name: 'QUANTUM STRIKE', description: '+50% tap damage permanently', currency: 'diamond', price: 5, modifierType: 'tap_damage', modifierValue: 1.5, isMultiplier: true, color: '#00f5ff', icon: 'Zap', maxPurchases: 3, tier: 'mid' },
  { id: 'dia_dps_1', name: 'NEURAL GRID BOOST', description: '+75% idle DPS permanently', currency: 'diamond', price: 5, modifierType: 'idle_dps', modifierValue: 1.75, isMultiplier: true, color: '#39ff14', icon: 'Cpu', maxPurchases: 3, tier: 'mid' },
  { id: 'dia_gold_1', name: 'FRACTAL EXTRACTOR', description: '+100% gold rate permanently', currency: 'diamond', price: 8, modifierType: 'gold_rate', modifierValue: 2.0, isMultiplier: true, color: '#ffaa00', icon: 'Coins', maxPurchases: 2, tier: 'late' },
  { id: 'dia_crit_1', name: 'EXPLOIT CHAIN', description: '+50% crit damage permanently', currency: 'diamond', price: 10, modifierType: 'crit_multiplier', modifierValue: 1.5, isMultiplier: true, color: '#ff0080', icon: 'Target', maxPurchases: 2, tier: 'late' },
  { id: 'dia_tap_2', name: 'OVERDRIVE MATRIX', description: '×3 tap damage permanently', currency: 'diamond', price: 25, modifierType: 'tap_damage', modifierValue: 3.0, isMultiplier: true, color: '#00f5ff', icon: 'Zap', maxPurchases: 1, tier: 'endgame' },
  { id: 'dia_dps_2', name: 'OMNIGRID ENGINE', description: '×3 idle DPS permanently', currency: 'diamond', price: 25, modifierType: 'idle_dps', modifierValue: 3.0, isMultiplier: true, color: '#39ff14', icon: 'Cpu', maxPurchases: 1, tier: 'endgame' },
  { id: 'dia_gold_2', name: 'DARK MATTER VAULT', description: '×4 gold rate permanently', currency: 'diamond', price: 40, modifierType: 'gold_rate', modifierValue: 4.0, isMultiplier: true, color: '#ffaa00', icon: 'Coins', maxPurchases: 1, tier: 'endgame' },
];

export const SHOP_CATALOG: ShopItem[] = [...OCT_CATALOG, ...DIAMOND_CATALOG];

export class ShopPlugin implements IPlugin {
  id = 'shop';
  dependencies = ['auth'];
  stateKeys = [] as (keyof GameState)[];

  private engine!: IEngine;
  private userId: string | null = null;
  private purchaseCounts: Record<string, number> = {};
  private listeners: Array<() => void> = [];
  private unsubs: Array<() => void> = [];

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    engine.storage.registerTable(this.id, { table: 'shop_purchases', userScoped: true });

    this.unsubs.push(engine.on('auth_success', (event: GameEvent<Player>) => {
      this.userId = event.payload.id;
      void this.loadPurchases();
    }));

    const existing = engine.getPlugin<AuthPlugin>('auth')?.getPlayer();
    if (existing) {
      this.userId = existing.id;
      void this.loadPurchases();
    }

    this.unsubs.push(engine.on('state_sync', () => { this.applyAllModifiers(); }));
  }

  private async loadPurchases(): Promise<void> {
    if (!this.userId) return;
    const { data } = await this.engine.storage.loadMany<{ item_id: string }>('shop_purchases', { user_id: this.userId }, 'item_id');
    this.purchaseCounts = {};
    for (const row of data) {
      this.purchaseCounts[row.item_id] = (this.purchaseCounts[row.item_id] ?? 0) + 1;
    }
    this.applyAllModifiers();
    this.notify();
  }

  private applyAllModifiers(): void {
    this.engine.removeModifiers(this.id);
    for (const item of SHOP_CATALOG) {
      const count = this.purchaseCounts[item.id] ?? 0;
      for (let i = 0; i < count; i++) {
        this.engine.addModifier(this.id, { type: item.modifierType, value: item.modifierValue, isMultiplier: item.isMultiplier });
      }
    }
  }

  getPurchaseCount(itemId: string): number { return this.purchaseCounts[itemId] ?? 0; }

  canBuy(item: ShopItem): boolean {
    if ((this.purchaseCounts[item.id] ?? 0) >= item.maxPurchases) return false;
    return item.currency === 'oct'
      ? this.engine.state.overclockCount >= item.price
      : this.engine.state.diamonds >= item.price;
  }

  buy(itemId: string): boolean {
    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (!item || !this.userId || !this.canBuy(item)) return false;

    if (item.currency === 'oct') {
      this.engine.updateState({ overclockCount: this.engine.state.overclockCount - item.price });
    } else {
      this.engine.updateState({ diamonds: this.engine.state.diamonds - item.price });
    }

    this.purchaseCounts[item.id] = (this.purchaseCounts[item.id] ?? 0) + 1;
    this.applyAllModifiers();

    void this.engine.storage.insert('shop_purchases', {
      user_id: this.userId,
      item_id: item.id,
      currency: item.currency,
      price: item.price,
    });

    this.engine.emit('shop_purchase', { item });
    this.notify();
    return true;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify(): void { for (const l of this.listeners) l(); }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.engine?.removeModifiers(this.id);
  }
}
