import type { IPlugin, IEngine, GameState, GameEvent, Player } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';
import {
  OCT_CATALOG,
  DIAMOND_CATALOG,
  SHOP_CATALOG,
  type ShopItemDef,
} from '../config/game.config';

export type ShopItem = ShopItemDef;
export { OCT_CATALOG, DIAMOND_CATALOG, SHOP_CATALOG };

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
