import type { IPlugin, IEngine, GameState, GameEvent, Player, HardwareItem } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';
import { SET_CATALOG, SET_DROP_CONFIG } from '../config/game.config';

export { SET_CATALOG };

/**
 * Calculate set piece drop chance based on stage, OC tier, and set rarity
 */
function calculateSetDropChance(stage: number, ocTier: number, setMinStage: number): number {
  const cfg = SET_DROP_CONFIG;
  
  // Base chance
  let chance = cfg.baseDropChance;
  
  // Stage bonus: +0.1% per 100 stages above requirement
  const stageAboveReq = Math.max(0, stage - setMinStage);
  chance += (stageAboveReq / 100) * cfg.stageDropBonus;
  
  // OC tier bonus: +0.5% per tier
  chance += ocTier * cfg.tierDropBonus;
  
  // Cap at max
  return Math.min(chance, cfg.maxDropChance);
}

/**
 * Select a random set that can drop at the current stage
 */
function selectRandomSet(stage: number, ownedPieceNames: Set<string>): { setId: string; pieceName: string } | null {
  // Filter sets available at this stage
  const availableSets = SET_CATALOG.filter(set => {
    const minStage = (set as { minStage?: number }).minStage ?? 0;
    return stage >= minStage;
  });
  
  if (availableSets.length === 0) return null;
  
  // Weight by dropWeight and filter to sets with unowned pieces
  const setsWithUnownedPieces = availableSets.filter(set => {
    return set.pieces.some(piece => !ownedPieceNames.has(piece.name));
  });
  
  if (setsWithUnownedPieces.length === 0) return null;
  
  // Weighted random selection
  const totalWeight = setsWithUnownedPieces.reduce((sum, set) => {
    const weight = (set as { dropWeight?: number }).dropWeight ?? 50;
    return sum + weight;
  }, 0);
  
  let roll = Math.random() * totalWeight;
  let selectedSet = setsWithUnownedPieces[0];
  
  for (const set of setsWithUnownedPieces) {
    const weight = (set as { dropWeight?: number }).dropWeight ?? 50;
    roll -= weight;
    if (roll <= 0) {
      selectedSet = set;
      break;
    }
  }
  
  // Select random unowned piece from the set
  const unownedPieces = selectedSet.pieces.filter(piece => !ownedPieceNames.has(piece.name));
  if (unownedPieces.length === 0) return null;
  
  const selectedPiece = unownedPieces[Math.floor(Math.random() * unownedPieces.length)];
  return { setId: selectedSet.id, pieceName: selectedPiece.name };
}

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
    
    // Listen for boss deaths to potentially drop set pieces
    this.unsubs.push(engine.on('enemy_death', (event: GameEvent<{ enemy: { isBoss: boolean }; goldReward: number }>) => {
      if (event.payload.enemy.isBoss) {
        void this.tryDropSetPiece();
      }
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
  
  /**
   * Attempt to drop a set piece from a boss kill
   * Called automatically when a boss is defeated
   */
  private async tryDropSetPiece(): Promise<void> {
    if (!this.userId) return;
    
    const state = this.engine.state;
    const stage = state.stage ?? 1;
    const ocTier = state.overclockTier ?? 0;
    
    // Get owned piece names for smart drop
    const ownedPieceNames = new Set(state.setItems?.map(i => i.name) ?? []);
    
    // Find available sets for this stage
    const availableSets = SET_CATALOG.filter(set => {
      const minStage = (set as { minStage?: number }).minStage ?? 0;
      return stage >= minStage;
    });
    
    if (availableSets.length === 0) return;
    
    // Use the lowest minStage among available sets for drop chance calculation
    const lowestMinStage = Math.min(...availableSets.map(s => (s as { minStage?: number }).minStage ?? 0));
    const dropChance = calculateSetDropChance(stage, ocTier, lowestMinStage);
    
    // Roll for drop
    if (Math.random() > dropChance) return;
    
    // Select a random set and piece
    const selection = selectRandomSet(stage, ownedPieceNames);
    if (!selection) return;
    
    // Award the piece
    await this.awardSetPiece(selection.setId, selection.pieceName);
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
  
  /**
   * Get info about set drop chances at current stage
   */
  getSetDropInfo(): { availableSets: string[]; dropChance: number } {
    const state = this.engine.state;
    const stage = state.stage ?? 1;
    const ocTier = state.overclockTier ?? 0;
    
    const availableSets = SET_CATALOG
      .filter(set => stage >= ((set as { minStage?: number }).minStage ?? 0))
      .map(s => s.name);
    
    const lowestMinStage = availableSets.length > 0
      ? Math.min(...SET_CATALOG
          .filter(set => stage >= ((set as { minStage?: number }).minStage ?? 0))
          .map(s => (s as { minStage?: number }).minStage ?? 0))
      : 0;
    
    const dropChance = calculateSetDropChance(stage, ocTier, lowestMinStage);
    
    return { availableSets, dropChance };
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
