import type { IPlugin, IEngine, GameState, GameEvent, Player, HardwareItem } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';
import { SET_CATALOG } from '../config/game.config';

export { SET_CATALOG };

export class SetPlugin implements IPlugin {
  id = 'sets';
  dependencies = ['auth'];
  stateKeys = ['setItems', 'collectedSets'] as (keyof GameState)[];
  defaultState = { setItems: [], collectedSets: {} };

  private engine!: IEngine;
  private userId: string | null = null;
  private listeners: Array<() => void> = [];
  private unsubs: Array<() => void> = [];

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    engine.storage.registerTable(this.id, { table: 'set_items', userScoped: true });

    this.unsubs.push(engine.on('auth_success', (event: GameEvent<Player>) => {
      this.userId = event.payload.id;
      void this.loadSetItems();
    }));

    const existing = engine.getPlugin<AuthPlugin>('auth')?.getPlayer();
    if (existing) {
      this.userId = existing.id;
      void this.loadSetItems();
    }

    this.unsubs.push(engine.on('state_sync', () => {
      this.applySetBonuses();
    }));
  }

  private async loadSetItems(): Promise<void> {
    if (!this.userId) return;
    const { data } = await this.engine.storage.loadMany<{ set_id: string; item_data: HardwareItem }>(
      'set_items',
      { user_id: this.userId },
      'set_id, item_data'
    );
    const items: HardwareItem[] = data.map(r => ({ ...r.item_data, setId: r.set_id }));
    const collectedSets = this.computeCollectedSets(items);
    this.engine.updateState({ setItems: items, collectedSets });
    this.applySetBonuses();
    this.notify();
  }

  private computeCollectedSets(items: HardwareItem[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const set of SET_CATALOG) {
      const ownedNames = new Set(items.filter(i => i.setId === set.id).map(i => i.name));
      result[set.id] = set.pieces.every(p => ownedNames.has(p.name));
    }
    return result;
  }

  applySetBonuses(): void {
    this.engine.removeModifiers(this.id);
    const collectedSets = this.engine.state.collectedSets;
    const setItems = this.engine.state.setItems;

    // Individual piece stats
    for (const item of setItems) {
      for (const stat of item.stats) {
        this.engine.addModifier(this.id, stat);
      }
    }

    // Full-set bonuses
    for (const set of SET_CATALOG) {
      if (collectedSets[set.id]) {
        for (const bonus of set.setBonus) {
          this.engine.addModifier(this.id, bonus);
        }
      }
    }
  }

  async awardSetPiece(setId: string, pieceName: string): Promise<boolean> {
    if (!this.userId) return false;

    const set = SET_CATALOG.find(s => s.id === setId);
    if (!set) return false;

    const piece = set.pieces.find(p => p.name === pieceName);
    if (!piece) return false;

    const existing = this.engine.state.setItems;
    const alreadyOwns = existing.some(i => i.setId === setId && i.name === pieceName);
    if (alreadyOwns) return false;

    const item: HardwareItem = {
      id: `set_${setId}_${pieceName}_${Date.now()}`,
      name: pieceName,
      slot: piece.slot,
      rarity: 'Mythic',
      tier: 99,
      stats: piece.stats,
      flavorText: piece.flavorText,
      droppedAt: Date.now(),
      setId,
    };

    const newItems = [...existing, item];
    const newCollectedSets = this.computeCollectedSets(newItems);
    this.engine.updateState({ setItems: newItems, collectedSets: newCollectedSets });
    this.applySetBonuses();

    const wasComplete = this.engine.state.collectedSets[setId];
    if (!wasComplete && newCollectedSets[setId]) {
      this.engine.emit('set_completed', { setId, set });
    }
    this.engine.emit('set_item_added', { item, setId });

    void this.engine.storage.insert('set_items', {
      user_id: this.userId,
      set_id: setId,
      item_data: item,
    });

    this.notify();
    return true;
  }

  getProgressForSet(setId: string): { owned: number; total: number; ownedPieces: string[] } {
    const set = SET_CATALOG.find(s => s.id === setId);
    if (!set) return { owned: 0, total: 0, ownedPieces: [] };
    const items = this.engine.state.setItems;
    const ownedPieces = items.filter(i => i.setId === setId).map(i => i.name);
    return { owned: ownedPieces.length, total: set.pieces.length, ownedPieces };
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
