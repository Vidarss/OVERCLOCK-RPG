import type { IPlugin, IEngine, GameState, GameEvent, HardwareItem, ItemSlot, ItemRarity, ModifierDef } from '../engine/types';
import { ITEM_CONFIG } from '../config/game.config';
import { 
  ENCHANTMENT_CONFIG, 
  TIER_UP_CONFIG, 
  getEnchantTier, 
  getNextEnchantTier, 
  getEnchantCost, 
  getTierUpDef, 
  canTierUp 
} from '../config/enchantment.config';

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
  stateKeys = ['inventory', 'equippedItems', 'scrap'] as (keyof GameState)[];
  defaultState = { inventory: [], equippedItems: DEFAULT_EQUIPPED, scrap: 0 };

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

  /** Calculate scrap value for an item based on rarity and tier. */
  getScrapValue(item: HardwareItem): number {
    const baseValue = ITEM_CONFIG.scrapValues[item.rarity] ?? 5;
    const tierBonus = item.tier * ITEM_CONFIG.tierScrapBonus;
    return baseValue + tierBonus;
  }

  /** Scrap an item from inventory, converting it to scrap resource. */
  scrapItem(itemId: string): { success: boolean; scrapGained: number } {
    const state = this.engine.state;
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return { success: false, scrapGained: 0 };

    const scrapGained = this.getScrapValue(item);
    const newInventory = state.inventory.filter(i => i.id !== itemId);
    const newScrap = (state.scrap ?? 0) + scrapGained;

    this.engine.updateState({ inventory: newInventory, scrap: newScrap });
    this.engine.emit('item_scrapped', { item, scrapGained, totalScrap: newScrap });
    return { success: true, scrapGained };
  }

  /** Scrap multiple items at once. */
  scrapItems(itemIds: string[]): { success: boolean; totalScrapGained: number } {
    const state = this.engine.state;
    let totalScrapGained = 0;
    const itemsToScrap: HardwareItem[] = [];

    for (const itemId of itemIds) {
      const item = state.inventory.find(i => i.id === itemId);
      if (item) {
        itemsToScrap.push(item);
        totalScrapGained += this.getScrapValue(item);
      }
    }

    if (itemsToScrap.length === 0) return { success: false, totalScrapGained: 0 };

    const scrapIds = new Set(itemsToScrap.map(i => i.id));
    const newInventory = state.inventory.filter(i => !scrapIds.has(i.id));
    const newScrap = (state.scrap ?? 0) + totalScrapGained;

    this.engine.updateState({ inventory: newInventory, scrap: newScrap });
    for (const item of itemsToScrap) {
      this.engine.emit('item_scrapped', { item, scrapGained: this.getScrapValue(item), totalScrap: newScrap });
    }
    return { success: true, totalScrapGained };
  }

  // ── ENCHANTMENT SYSTEM ─────────────────────────────────────────────────────

  /** Calculate enchanted stats for an item based on its enchant level */
  private calculateEnchantedStats(item: HardwareItem): ModifierDef[] {
    const enchantLevel = item.enchantLevel ?? 0;
    if (enchantLevel === 0) return item.stats;

    const tier = getEnchantTier(enchantLevel);
    if (!tier) return item.stats;

    return item.stats.map(stat => ({
      ...stat,
      value: stat.isMultiplier
        ? 1 + (stat.value - 1) * tier.bonusMultiplier
        : stat.value * tier.bonusMultiplier,
    }));
  }

  /** Get the scrap cost to enchant an item to the next level */
  getEnchantCost(item: HardwareItem): number {
    const currentLevel = item.enchantLevel ?? 0;
    const nextLevel = currentLevel + 1;
    if (nextLevel > ENCHANTMENT_CONFIG.maxEnchantLevel) return Infinity;
    return getEnchantCost(nextLevel, item.rarity);
  }

  /** Get enchantment info for an item */
  getEnchantInfo(item: HardwareItem): {
    currentLevel: number;
    maxLevel: number;
    nextCost: number;
    successChance: number;
    failurePenalty: number;
    canEnchant: boolean;
  } {
    const currentLevel = item.enchantLevel ?? 0;
    const nextTier = getNextEnchantTier(currentLevel);
    const cost = this.getEnchantCost(item);
    const scrap = this.engine.state.scrap ?? 0;

    return {
      currentLevel,
      maxLevel: ENCHANTMENT_CONFIG.maxEnchantLevel,
      nextCost: cost,
      successChance: nextTier?.successChance ?? 0,
      failurePenalty: nextTier?.failurePenalty ?? 0,
      canEnchant: nextTier !== null && scrap >= cost,
    };
  }

  /** Attempt to enchant an item (inventory or equipped) */
  enchantItem(
    itemId: string, 
    options?: { useProtection?: boolean; useLuckyCharm?: boolean; useGuaranteed?: boolean }
  ): { success: boolean; newLevel: number; message: string } {
    const state = this.engine.state;
    
    // Find item in inventory or equipped
    let item = state.inventory.find(i => i.id === itemId);
    let location: 'inventory' | { slot: ItemSlot; index: number } = 'inventory';
    
    if (!item) {
      // Check equipped items
      for (const [slot, slotArray] of Object.entries(state.equippedItems)) {
        const arr = Array.isArray(slotArray) ? slotArray : [slotArray];
        const idx = arr.findIndex(i => i?.id === itemId);
        if (idx >= 0 && arr[idx]) {
          item = arr[idx]!;
          location = { slot: slot as ItemSlot, index: idx };
          break;
        }
      }
    }

    if (!item) return { success: false, newLevel: 0, message: 'Item not found' };

    const currentLevel = item.enchantLevel ?? 0;
    const nextTier = getNextEnchantTier(currentLevel);
    if (!nextTier) return { success: false, newLevel: currentLevel, message: 'Already at max enchant level' };

    const cost = getEnchantCost(nextTier.level, item.rarity);
    const scrap = state.scrap ?? 0;
    let diamonds = state.diamonds ?? 0;

    // Calculate total diamond cost for extras
    let diamondCost = 0;
    if (options?.useProtection) diamondCost += ENCHANTMENT_CONFIG.protectionScrollCost;
    if (options?.useLuckyCharm) diamondCost += ENCHANTMENT_CONFIG.luckyCharmCost;
    if (options?.useGuaranteed) diamondCost += ENCHANTMENT_CONFIG.guaranteedScrollCost;

    if (scrap < cost) return { success: false, newLevel: currentLevel, message: 'Not enough scrap' };
    if (diamonds < diamondCost) return { success: false, newLevel: currentLevel, message: 'Not enough diamonds' };

    // Consume resources
    this.engine.updateState({ 
      scrap: scrap - cost,
      diamonds: diamonds - diamondCost,
    });

    // Calculate success chance
    let successChance = nextTier.successChance;
    if (options?.useLuckyCharm) successChance = Math.min(1, successChance + 0.25);
    if (options?.useGuaranteed) successChance = 1;

    const roll = Math.random();
    const succeeded = roll < successChance;

    let newLevel = currentLevel;
    let message = '';

    if (succeeded) {
      newLevel = nextTier.level;
      message = `Enchantment successful! Item is now +${newLevel}`;
    } else {
      // Failure
      const penalty = options?.useProtection ? 0 : nextTier.failurePenalty;
      newLevel = Math.max(0, currentLevel - penalty);
      message = penalty > 0 
        ? `Enchantment failed! Item dropped to +${newLevel}`
        : 'Enchantment failed! Level unchanged';
    }

    // Update item
    const updatedItem: HardwareItem = {
      ...item,
      enchantLevel: newLevel,
      enchantedStats: undefined, // Will be recalculated
    };
    updatedItem.enchantedStats = this.calculateEnchantedStats(updatedItem);

    // Update state
    if (location === 'inventory') {
      const newInventory = state.inventory.map(i => i.id === itemId ? updatedItem : i);
      this.engine.updateState({ inventory: newInventory });
    } else {
      const equipped = { ...state.equippedItems };
      const arr = [...(Array.isArray(equipped[location.slot]) ? equipped[location.slot] : [equipped[location.slot]])];
      arr[location.index] = updatedItem;
      equipped[location.slot] = arr as (HardwareItem | null)[];
      this.engine.updateState({ equippedItems: equipped });
      this.applyEquippedModifiers();
    }

    // Emit event
    if (succeeded) {
      this.engine.emit('item_enchanted', { item: updatedItem, oldLevel: currentLevel, newLevel });
    } else {
      this.engine.emit('item_enchant_failed', { item: updatedItem, oldLevel: currentLevel, newLevel });
    }

    return { success: succeeded, newLevel, message };
  }

  // ── TIER-UP SYSTEM ─────────────────────────────────────────────────────────

  /** Get tier-up info for an item */
  getTierUpInfo(item: HardwareItem): {
    currentTier: number;
    maxTier: number;
    nextCost: number;
    successChance: number;
    canTierUp: boolean;
    reason?: string;
  } {
    const currentTier = item.tier;
    const check = canTierUp(currentTier, item.rarity);
    const nextTierDef = getTierUpDef(currentTier + 1);
    const diamonds = this.engine.state.diamonds ?? 0;

    return {
      currentTier,
      maxTier: TIER_UP_CONFIG.maxTier,
      nextCost: nextTierDef?.diamondCost ?? Infinity,
      successChance: nextTierDef?.successChance ?? 0,
      canTierUp: check.canUpgrade && nextTierDef !== null && diamonds >= nextTierDef.diamondCost,
      reason: check.reason,
    };
  }

  /** Attempt to tier-up an item */
  tierUpItem(
    itemId: string,
    options?: { useProtection?: boolean }
  ): { success: boolean; newTier: number; message: string } {
    const state = this.engine.state;
    
    // Find item in inventory or equipped
    let item = state.inventory.find(i => i.id === itemId);
    let location: 'inventory' | { slot: ItemSlot; index: number } = 'inventory';
    
    if (!item) {
      for (const [slot, slotArray] of Object.entries(state.equippedItems)) {
        const arr = Array.isArray(slotArray) ? slotArray : [slotArray];
        const idx = arr.findIndex(i => i?.id === itemId);
        if (idx >= 0 && arr[idx]) {
          item = arr[idx]!;
          location = { slot: slot as ItemSlot, index: idx };
          break;
        }
      }
    }

    if (!item) return { success: false, newTier: 0, message: 'Item not found' };

    const currentTier = item.tier;
    const check = canTierUp(currentTier, item.rarity);
    if (!check.canUpgrade) return { success: false, newTier: currentTier, message: check.reason ?? 'Cannot tier up' };

    const tierDef = getTierUpDef(currentTier + 1);
    if (!tierDef) return { success: false, newTier: currentTier, message: 'Tier data not found' };

    let diamonds = state.diamonds ?? 0;
    let totalCost = tierDef.diamondCost;
    if (options?.useProtection) totalCost += TIER_UP_CONFIG.tierProtectionCost;

    if (diamonds < totalCost) return { success: false, newTier: currentTier, message: 'Not enough diamonds' };

    // Consume diamonds
    this.engine.updateState({ diamonds: diamonds - totalCost });

    // Roll for success
    const roll = Math.random();
    const succeeded = roll < tierDef.successChance;

    let newTier = currentTier;
    let message = '';

    if (succeeded) {
      newTier = tierDef.targetTier;
      
      // Apply stat multiplier to base stats
      const statMultiplier = tierDef.statMultiplier;
      const newStats = item.stats.map(stat => ({
        ...stat,
        value: stat.isMultiplier
          ? 1 + (stat.value - 1) * statMultiplier
          : stat.value * statMultiplier,
      }));

      const updatedItem: HardwareItem = {
        ...item,
        tier: newTier,
        stats: newStats,
        enchantedStats: undefined,
      };
      updatedItem.enchantedStats = this.calculateEnchantedStats(updatedItem);

      // Update state
      if (location === 'inventory') {
        const newInventory = state.inventory.map(i => i.id === itemId ? updatedItem : i);
        this.engine.updateState({ inventory: newInventory });
      } else {
        const equipped = { ...state.equippedItems };
        const arr = [...(Array.isArray(equipped[location.slot]) ? equipped[location.slot] : [equipped[location.slot]])];
        arr[location.index] = updatedItem;
        equipped[location.slot] = arr as (HardwareItem | null)[];
        this.engine.updateState({ equippedItems: equipped });
        this.applyEquippedModifiers();
      }

      this.engine.emit('item_tier_up', { item: updatedItem, oldTier: currentTier, newTier });
      message = `Tier-up successful! Item is now T${newTier}`;
    } else {
      // Failure
      const penalty = options?.useProtection ? 0 : TIER_UP_CONFIG.failurePenalty;
      newTier = Math.max(0, currentTier - penalty);
      
      if (penalty > 0 && newTier !== currentTier) {
        // Update item tier on failure with penalty
        const updatedItem: HardwareItem = { ...item, tier: newTier };
        
        if (location === 'inventory') {
          const newInventory = state.inventory.map(i => i.id === itemId ? updatedItem : i);
          this.engine.updateState({ inventory: newInventory });
        } else {
          const equipped = { ...state.equippedItems };
          const arr = [...(Array.isArray(equipped[location.slot]) ? equipped[location.slot] : [equipped[location.slot]])];
          arr[location.index] = updatedItem;
          equipped[location.slot] = arr as (HardwareItem | null)[];
          this.engine.updateState({ equippedItems: equipped });
          this.applyEquippedModifiers();
        }
      }

      this.engine.emit('item_tier_up_failed', { item, oldTier: currentTier, newTier });
      message = penalty > 0 && newTier !== currentTier
        ? `Tier-up failed! Item dropped to T${newTier}`
        : 'Tier-up failed! Tier unchanged';
    }

    return { success: succeeded, newTier, message };
  }

  private applyEquippedModifiers(): void {
    this.engine.removeModifiers('items');
    const equipped = this.engine.state.equippedItems;
    for (const rawSlot of Object.values(equipped)) {
      const arr = Array.isArray(rawSlot) ? rawSlot : [rawSlot as HardwareItem | null];
      for (const item of arr) {
        if (!item) continue;
        // Use enchanted stats if available, otherwise base stats
        const stats = item.enchantedStats ?? this.calculateEnchantedStats(item);
        for (const stat of stats) {
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
