import type { IPlugin, IEngine, GameState, GameEvent, ComponentDef } from '../engine/types';
import type { GoldPlugin } from './GoldPlugin';
import type { EnemyPlugin } from './EnemyPlugin';
import { INITIAL_COMPONENTS, COMPONENT_MILESTONE_CONFIG } from '../config/game.config';

export { INITIAL_COMPONENTS };

export function getComponentCost(comp: ComponentDef): number {
  return Math.floor(comp.baseCost * Math.pow(comp.costMultiplier, comp.level));
}

export function getComponentBulkCost(comp: ComponentDef, quantity: number): number {
  let total = 0;
  for (let i = 0; i < quantity; i++) {
    total += Math.floor(comp.baseCost * Math.pow(comp.costMultiplier, comp.level + i));
  }
  return total;
}

/**
 * Calculate milestone bonus multiplier for a component level
 * Returns additional multiplier (e.g., 0.5 means +50% bonus)
 */
export function getComponentMilestoneBonus(level: number): number {
  if (!COMPONENT_MILESTONE_CONFIG.enabled || level === 0) return 0;

  const { customMilestones, milestoneInterval, bonusPerMilestone, maxMilestones } = COMPONENT_MILESTONE_CONFIG;

  // Use custom milestones if defined
  if (customMilestones && customMilestones.length > 0) {
    let totalBonus = 0;
    for (const milestone of customMilestones) {
      if (level >= milestone.level) {
        totalBonus = milestone.bonus; // Take highest reached milestone bonus
      }
    }
    return totalBonus;
  }

  // Otherwise use linear calculation
  const milestonesReached = Math.floor(level / milestoneInterval);
  const cappedMilestones = maxMilestones > 0 ? Math.min(milestonesReached, maxMilestones) : milestonesReached;
  return cappedMilestones * bonusPerMilestone;
}

export function getComponentDps(comp: ComponentDef): number {
  if (comp.level === 0) return 0;
  const baseDps = comp.baseDps * comp.level;
  const milestoneBonus = getComponentMilestoneBonus(comp.level);
  return baseDps * (1 + milestoneBonus);
}

export function getTotalIdleDps(components: Record<string, ComponentDef>): number {
  return Object.values(components).reduce((sum, c) => sum + getComponentDps(c), 0);
}

export class ComponentPlugin implements IPlugin {
  id = 'component';
  dependencies = ['gold', 'enemy'];
  stateKeys = ['components'] as (keyof GameState)[];

  private engine!: IEngine;
  private idleDamageAccum = 0;

  get defaultState() {
    const initialMap: Record<string, ComponentDef> = {};
    for (const c of INITIAL_COMPONENTS) {
      initialMap[c.id] = { ...c };
    }
    return { components: initialMap };
  }

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.on('state_sync', (event: GameEvent<{ savedState: GameState } | null>) => {
      if (event.payload?.savedState?.components) {
        const saved = event.payload.savedState.components;
        const merged: Record<string, ComponentDef> = {};
        for (const c of INITIAL_COMPONENTS) {
          merged[c.id] = saved[c.id] ? { ...c, ...saved[c.id] } : { ...c };
        }
        engine.updateState({ components: merged });
      }
    });

    engine.on('overclock', () => {
      const current = this.engine.state.components;
      const reset: Record<string, ComponentDef> = {};
      for (const c of INITIAL_COMPONENTS) {
        // Preserve unlocked state for components beyond the 5th (endgame unlocks persist)
        const wasUnlocked = current[c.id]?.unlocked ?? c.unlocked;
        reset[c.id] = { ...c, unlocked: wasUnlocked };
      }
      engine.updateState({ components: reset });
    });
  }

  getMaxAffordable(componentId: string): number {
    const comp = this.engine.state.components[componentId];
    if (!comp) return 0;
    const gold = this.engine.state.gold;
    let qty = 0;
    let spent = 0;
    while (true) {
      const next = Math.floor(comp.baseCost * Math.pow(comp.costMultiplier, comp.level + qty));
      if (spent + next > gold) break;
      spent += next;
      qty++;
    }
    return qty;
  }

  purchase(componentId: string): boolean {
    return this.purchaseBulk(componentId, 1);
  }

  purchaseBulk(componentId: string, quantity: number): boolean {
    if (quantity <= 0) return false;
    const state = this.engine.state;
    const comp = state.components[componentId];
    if (!comp) return false;

    const totalCost = getComponentBulkCost(comp, quantity);
    const goldPlugin = this.engine.getPlugin<GoldPlugin>('gold');
    if (!goldPlugin?.spend(totalCost)) return false;

    const newLevel = comp.level + quantity;
    const updatedComp = { ...comp, level: newLevel };

    const idx = INITIAL_COMPONENTS.findIndex(c => c.id === componentId);
    const nextComp = INITIAL_COMPONENTS[idx + 1];

    const updatedComponents = { ...state.components, [componentId]: updatedComp };
    if (nextComp && !state.components[nextComp.id]?.unlocked) {
      updatedComponents[nextComp.id] = { ...state.components[nextComp.id], unlocked: true };
    }

    this.engine.updateState({ components: updatedComponents });
    this.engine.emit('component_levelup', { componentId, level: newLevel, cost: totalCost });
    return true;
  }

  onTick(delta: number, state: GameState): void {
    if (!state.enemy || state.enemy.hp <= 0) return;

    const idleDps = getTotalIdleDps(state.components) * this.engine.getModifier('idle_dps');
    if (idleDps <= 0) return;

    this.idleDamageAccum += idleDps * delta;

    if (this.idleDamageAccum >= 1) {
      const dmg = Math.floor(this.idleDamageAccum);
      this.idleDamageAccum -= dmg;

      const enemyPlugin = this.engine.getPlugin<EnemyPlugin>('enemy');
      enemyPlugin?.applyDamage(dmg);

      const dmgEvent = {
        id: `idle_${Date.now()}`,
        value: dmg,
        type: 'idle' as const,
      };
      this.engine.emit('damage_number', dmgEvent);
    }
  }
}
