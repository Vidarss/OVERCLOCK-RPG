import type { IPlugin, IEngine, GameState, GameEvent, HardwareItem, ItemSlot, ItemRarity } from '../engine/types';
import { ITEM_CONFIG } from '../config/game.config';

const SLOTS: ItemSlot[] = ['RAM', 'GPU', 'CPU', 'EXPANSION'];

function rollRarity(tier: number, isBoss: boolean): ItemRarity {
  const weights = ITEM_CONFIG.rarityWeights;
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total - (isBoss ? ITEM_CONFIG.bossRarityShift : 0) - tier * ITEM_CONFIG.tierRarityShiftPerTier;
  for (const [rarity, weight] of weights) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return 'Common';
}

function rollDropChance(tier: number, isBoss: boolean): boolean {
  const base = ITEM_CONFIG.baseDropChance + tier * ITEM_CONFIG.dropChancePerTier;
  return Math.random() < (isBoss
    ? Math.min(ITEM_CONFIG.bossDropCap, base * ITEM_CONFIG.bossDropMultiplier)
    : Math.min(ITEM_CONFIG.normalDropCap, base));
}

function generateItem(tier: number, isBoss: boolean): HardwareItem {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const rarity = rollRarity(tier, isBoss);
  const names = ITEM_CONFIG.slotItems[slot];
  const name = names[Math.floor(Math.random() * names.length)];
  const mult = ITEM_CONFIG.rarityStatMultiplier[rarity];
  const pType = ITEM_CONFIG.primaryStat[slot];
  const sType = ITEM_CONFIG.secondaryStat[slot];
  const { primaryStatBase, primaryCritChanceBase, secondaryCritMultBase, secondaryStatBase } = ITEM_CONFIG;

  const stats = [{
    type: pType,
    value: pType === 'crit_chance'
      ? parseFloat((primaryCritChanceBase * (tier + 1) * mult).toFixed(3))
      : parseFloat((1 + primaryStatBase * (tier + 1) * mult).toFixed(3)),
    isMultiplier: pType !== 'crit_chance',
  }];

  if (rarity !== 'Common') {
    stats.push({
      type: sType,
      value: sType === 'crit_multiplier'
        ? parseFloat((secondaryCritMultBase * mult).toFixed(3))
        : parseFloat((1 + secondaryStatBase * (tier + 1) * mult).toFixed(3)),
      isMultiplier: sType !== 'crit_multiplier',
    });
  }

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name, slot, rarity, tier, stats,
    flavorText: ITEM_CONFIG.itemFlavors[name] ?? 'Unknown provenance.',
    droppedAt: Date.now(),
  };
}


// ── Migration helper ───────────────────────────────────────────────────────
// Old saves store equippedItems as { RAM: HardwareItem|null, ... }
// New format is { RAM: (HardwareItem|null)[], ... }

export function normalizeEquippedSlot(value: unknown): (HardwareItem | null)[] {
  if (Array.isArray(value)) return value as (HardwareItem | null)[];
  return [value as HardwareItem | null];
}

export function normalizeEquipped(raw: unknown): GameState['equippedItems'] {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    RAM: normalizeEquippedSlot(r.RAM),
    GPU: normalizeEquippedSlot(r.GPU),
    CPU: normalizeEquippedSlot(r.CPU),
    EXPANSION: normalizeEquippedSlot(r.EXPANSION),
  };
}

const DEFAULT_EQUIPPED: GameState['equippedItems'] = {
  RAM: [null], GPU: [null], CPU: [null], EXPANSION: [null],
};

export class ItemPlugin implements IPlugin {
  id = 'items';
  dependencies = ['enemy'];
  stateKeys = ['inventory', 'equippedItems'] as (keyof GameState)[];
  defaultState = { inventory: [], equippedItems: DEFAULT_EQUIPPED };

  private engine!: IEngine;
  private unsub?: () => void;
  private unsubSync?: () => void;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    this.unsubSync = engine.on('state_sync', () => {
      // Migrate old single-value saves to array format
      const equipped = engine.state.equippedItems;
      if (equipped && !Array.isArray(equipped.RAM)) {
        engine.updateState({ equippedItems: normalizeEquipped(equipped) });
      }
      this.applyEquippedModifiers();
    });

    this.unsub = engine.on('enemy_death', (event: GameEvent<{ enemy: { isBoss: boolean; tier: number } }>) => {
      const { enemy } = event.payload;
      if (rollDropChance(enemy.tier, enemy.isBoss)) {
        const item = generateItem(enemy.tier, enemy.isBoss);
        const current = engine.state.inventory ?? [];
        const trimmed = current.length >= ITEM_CONFIG.inventoryMax
          ? current.slice(current.length - ITEM_CONFIG.inventoryMax + 1)
          : current;
        engine.updateState({ inventory: [...trimmed, item] });
        engine.emit('item_drop', { item });
      }
    });
  }

  equip(itemId: string, slotIndex?: number): boolean {
    const state = this.engine.state;
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return false;

    const rawSlot = state.equippedItems[item.slot];
    const slotArray = Array.isArray(rawSlot) ? [...rawSlot] : [rawSlot as HardwareItem | null];

    let idx = slotIndex ?? slotArray.findIndex(s => s === null);
    if (idx < 0) idx = 0;
    if (idx >= slotArray.length) idx = slotArray.length - 1;

    const displaced = slotArray[idx];
    slotArray[idx] = item;

    const newEquipped = { ...state.equippedItems, [item.slot]: slotArray };
    let newInventory = state.inventory.filter(i => i.id !== itemId);
    if (displaced) newInventory = [...newInventory, displaced];

    this.engine.updateState({ equippedItems: newEquipped, inventory: newInventory });
    this.applyEquippedModifiers();
    this.engine.emit('item_equipped', { item, slot: item.slot, slotIndex: idx });
    return true;
  }

  unequip(slot: ItemSlot, slotIndex = 0): boolean {
    const state = this.engine.state;
    const rawSlot = state.equippedItems[slot];
    const slotArray = Array.isArray(rawSlot) ? [...rawSlot] : [rawSlot as HardwareItem | null];
    const item = slotArray[slotIndex] ?? null;
    if (!item) return false;

    slotArray[slotIndex] = null;
    const newEquipped = { ...state.equippedItems, [slot]: slotArray };
    const newInventory = [...state.inventory, item];

    this.engine.updateState({ equippedItems: newEquipped, inventory: newInventory });
    this.applyEquippedModifiers();
    this.engine.emit('item_unequipped', { item, slot, slotIndex });
    return true;
  }

  private applyEquippedModifiers(): void {
    this.engine.removeModifiers('items');
    const equipped = this.engine.state.equippedItems;
    for (const rawSlot of Object.values(equipped)) {
      const arr = Array.isArray(rawSlot) ? rawSlot : [rawSlot as HardwareItem | null];
      for (const item of arr) {
        if (!item) continue;
        for (const stat of item.stats) {
          this.engine.addModifier('items', stat);
        }
      }
    }
  }

  cleanup(): void {
    this.unsub?.();
    this.unsubSync?.();
    this.engine?.removeModifiers('items');
  }
}
