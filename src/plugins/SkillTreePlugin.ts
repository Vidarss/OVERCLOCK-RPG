import type { IPlugin, IEngine, GameState, GameEvent } from '../engine/types';
import { SKILL_TREE_CONFIG, SKILL_TREE_AUTOTAP_RATE, TAP_CONFIG, type SkillTreeNode } from '../config/game.config';
import { getTotalIdleDps } from './ComponentPlugin';
import type { EnemyPlugin } from './EnemyPlugin';
import type { DataPacketPlugin } from './DataPacketPlugin';

/**
 * SkillTreePlugin owns the skill tree's actual gameplay effects.
 *
 * Passive nodes register engine modifiers (re-applied on every load and upgrade)
 * mapped onto the engine's REAL modifier types:
 *   tap_damage  -> tap_damage
 *   idle_damage -> idle_dps
 *   gold_bonus  -> gold_rate
 *   crit_chance -> crit_chance (additive)
 *   crit_damage -> crit_multiplier
 *   all_damage  -> tap_damage AND idle_dps
 *
 * 'timeskip' nodes auto-fire on their own cooldown, banking N seconds of that
 * damage type's current output without any clicking.
 */
export class SkillTreePlugin implements IPlugin {
  id = 'skill_tree';
  dependencies = ['enemy', 'gold', 'component'];

  private engine!: IEngine;
  // Per-node seconds-until-next-auto-fire timers
  private timeskipTimers: Record<string, number> = {};

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    // Re-apply all owned passive modifiers when state is (re)loaded.
    engine.on('state_sync', () => this.applyAllPassives());

    // Re-apply when a node is upgraded in the UI.
    engine.on('skill_tree_upgrade', () => this.applyAllPassives());

    // Apply immediately for the current state.
    this.applyAllPassives();
    this.resetTimers();
  }

  /** Map a tree effect type onto one or more engine modifier types. */
  private engineModTypes(effectType: NonNullable<SkillTreeNode['effect']>['type']): ('tap_damage' | 'idle_dps' | 'gold_rate' | 'crit_chance' | 'crit_multiplier')[] {
    switch (effectType) {
      case 'tap_damage':  return ['tap_damage'];
      case 'idle_damage': return ['idle_dps'];
      case 'gold_bonus':  return ['gold_rate'];
      case 'crit_chance': return ['crit_chance'];
      case 'crit_damage': return ['crit_multiplier'];
      case 'all_damage':  return ['tap_damage', 'idle_dps'];
      default:            return [];
    }
  }

  /** Remove and re-register every passive modifier based on owned node levels. */
  applyAllPassives(): void {
    const nodes = this.engine.state.skillTreeNodes ?? {};
    for (const node of SKILL_TREE_CONFIG.nodes) {
      const modKey = `skill_tree_${node.id}`;
      this.engine.removeModifiers(modKey);

      if (node.nodeType === 'timeskip' || !node.effect) continue;
      const level = nodes[node.id] ?? 0;
      if (level <= 0) continue;

      const isMult = node.effect.isMultiplier ?? false;
      const total = node.effect.valuePerLevel * level;
      // Multiplier modifiers stack on a base of 1 (e.g. +6%/lvl -> value 1.06^? no, additive sum -> 1 + total)
      const value = isMult ? 1 + total : total;

      for (const type of this.engineModTypes(node.effect.type)) {
        this.engine.addModifier(modKey, { type, value, isMultiplier: isMult });
      }
    }
  }

  private resetTimers(): void {
    this.timeskipTimers = {};
    for (const node of SKILL_TREE_CONFIG.nodes) {
      if (node.nodeType === 'timeskip' && node.timeskip) {
        this.timeskipTimers[node.id] = node.timeskip.intervalSec;
      }
    }
  }

  /**
   * Fraction of excess (overkill) damage that should spill into the next enemy.
   * 0 when the OVERKILL node is not owned. Read by EnemyPlugin on each kill.
   */
  getOverkillCarry(): number {
    const nodes = this.engine.state.skillTreeNodes ?? {};
    let carry = 0;
    for (const node of SKILL_TREE_CONFIG.nodes) {
      if (node.nodeType !== 'overkill' || !node.overkill) continue;
      const level = nodes[node.id] ?? 0;
      if (level > 0) carry += node.overkill.carryPerLevel * level;
    }
    return carry;
  }

  /** Returns owned time-skip nodes with their config + current level. */
  getTimeskipNodes(): { node: SkillTreeNode; level: number; nextInSec: number }[] {
    const nodes = this.engine.state.skillTreeNodes ?? {};
    const out: { node: SkillTreeNode; level: number; nextInSec: number }[] = [];
    for (const node of SKILL_TREE_CONFIG.nodes) {
      if (node.nodeType !== 'timeskip') continue;
      const level = nodes[node.id] ?? 0;
      if (level <= 0) continue;
      out.push({ node, level, nextInSec: Math.max(0, Math.ceil(this.timeskipTimers[node.id] ?? 0)) });
    }
    return out;
  }

  onTick(delta: number, state: GameState): void {
    const nodes = state.skillTreeNodes ?? {};

    for (const node of SKILL_TREE_CONFIG.nodes) {
      if (node.nodeType !== 'timeskip' || !node.timeskip) continue;
      const level = nodes[node.id] ?? 0;
      if (level <= 0) continue;

      // Initialise timer if this node was just unlocked.
      if (this.timeskipTimers[node.id] == null) {
        this.timeskipTimers[node.id] = node.timeskip.intervalSec;
      }

      this.timeskipTimers[node.id] -= delta;
      if (this.timeskipTimers[node.id] <= 0) {
        this.timeskipTimers[node.id] += node.timeskip.intervalSec;
        this.fireTimeskip(node, level);
      }
    }
  }

  /** Bank N seconds of the node's resource output. */
  private fireTimeskip(node: SkillTreeNode, level: number): void {
    if (!node.timeskip) return;
    const seconds = node.timeskip.secondsPerLevel * level;
    const state = this.engine.state;

    if (node.timeskip.resource === 'idle') {
      const idleDps = getTotalIdleDps(state.components) * this.engine.getModifier('idle_dps');
      const damage = Math.ceil(idleDps * seconds);
      if (damage > 0 && state.enemy && state.enemy.hp > 0) {
        this.engine.getPlugin<EnemyPlugin>('enemy')?.applyDamage(damage, false);
      }
      this.engine.emit('skill_tree_timeskip', { nodeId: node.id, resource: 'idle', amount: damage, seconds });
    } else if (node.timeskip.resource === 'tap') {
      const tapDamage = this.engine.getModifier('tap_damage') * TAP_CONFIG.baseDamage;
      const taps = SKILL_TREE_AUTOTAP_RATE * seconds;
      const damage = Math.ceil(tapDamage * taps);
      if (damage > 0 && state.enemy && state.enemy.hp > 0) {
        this.engine.getPlugin<EnemyPlugin>('enemy')?.applyDamage(damage, false);
      }
      this.engine.emit('skill_tree_timeskip', { nodeId: node.id, resource: 'tap', amount: damage, seconds });
    } else if (node.timeskip.resource === 'gold') {
      // Estimate gold/sec from current idle DPS converted via enemy reward density.
      const idleDps = getTotalIdleDps(state.components) * this.engine.getModifier('idle_dps');
      const goldRate = this.engine.getModifier('gold_rate');
      const boostMult = this.engine.getPlugin<DataPacketPlugin>('datapacket')?.getBoostMultiplier() ?? 1;
      // Approx: gold roughly tracks damage output; use idleDps as a proxy throughput.
      const goldPerSec = idleDps * goldRate * boostMult * 0.5;
      const reward = Math.ceil(goldPerSec * seconds);
      if (reward > 0) {
        const newGold = state.gold + reward;
        this.engine.updateState({ gold: newGold });
        this.engine.emit('gold_changed', { gold: newGold, delta: reward });
      }
      this.engine.emit('skill_tree_timeskip', { nodeId: node.id, resource: 'gold', amount: reward, seconds });
    }
  }
}
