import type { IPlugin, IEngine, GameState, SkillDef, SkillId, SkillCooldownState } from '../engine/types';
import type { EnemyPlugin } from './EnemyPlugin';
import {
  BASE_SKILLS,
  BRANCH_SKILLS,
  ALL_SKILLS,
  SKILL_EFFECTS,
  CHAIN_HACK_INTERVAL_MS,
  STATIC_DISCHARGE_BURST,
} from '../config/game.config';
import {
  BRANCH_SKILL_UNLOCKS,
  isBranchSkillUnlocked,
  type PerkBranch,
} from './OverclockPlugin';

export { BASE_SKILLS, BRANCH_SKILLS };
export const SKILLS: SkillDef[] = ALL_SKILLS;

const BRANCHES: PerkBranch[] = ['VOLTAGE', 'SIGNAL', 'THERMAL', 'ENTROPY', 'QUANTUM'];

const BRANCH_SKILL_ID_MAP: Record<PerkBranch, SkillId> = {
  VOLTAGE: 'static_discharge',
  SIGNAL:  'signal_jam',
  THERMAL: 'meltdown',
  ENTROPY: 'entropy_burst',
  QUANTUM: 'quantum_echo',
};

const DEFAULT_CD: SkillCooldownState = { readyAt: 0, activeUntil: 0 };

export class SkillPlugin implements IPlugin {
  id = 'skill';
  dependencies = ['enemy', 'tap'];
  stateKeys = ['skillCooldowns'] as (keyof GameState)[];
  defaultState = {
    skillCooldowns: {
      surge:             { ...DEFAULT_CD },
      overclock_pulse:   { ...DEFAULT_CD },
      gold_rush:         { ...DEFAULT_CD },
      firewall:          { ...DEFAULT_CD },
      chain_hack:        { ...DEFAULT_CD },
      static_discharge:  { ...DEFAULT_CD },
      signal_jam:        { ...DEFAULT_CD },
      meltdown:          { ...DEFAULT_CD },
      entropy_burst:     { ...DEFAULT_CD },
      quantum_echo:      { ...DEFAULT_CD },
    },
  };

  private engine!: IEngine;
  private chainHackInterval: ReturnType<typeof setInterval> | null = null;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
  }

  activateSkill(skillId: SkillId): boolean {
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return false;

    const now = Date.now();
    const cooldowns = this.engine.state.skillCooldowns;
    const cd = cooldowns[skillId] ?? DEFAULT_CD;

    if (cd.readyAt > now) return false;
    if (!this.isSkillAccessible(skillId)) return false;

    const newCd: SkillCooldownState = {
      readyAt: now + skill.cooldown * 1000,
      activeUntil: skill.duration > 0 ? now + skill.duration * 1000 : 0,
    };

    this.engine.updateState({
      skillCooldowns: { ...cooldowns, [skillId]: newCd },
    });

    this.applySkillEffect(skill);
    this.engine.emit('skill_activated', { skillId, skill });
    return true;
  }

  isSkillAccessible(skillId: SkillId): boolean {
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return false;
    const state = this.engine.state;
    if (skill.unlockStage < 9999) {
      return state.stage >= skill.unlockStage || state.highestStage >= skill.unlockStage;
    }
    const upgrades = state.overclockUpgrades ?? {};
    const branch = this.getBranchForSkill(skillId);
    if (!branch) return false;
    return isBranchSkillUnlocked(upgrades, branch);
  }

  private getBranchForSkill(skillId: SkillId): PerkBranch | null {
    for (const branch of BRANCHES) {
      if (BRANCH_SKILL_ID_MAP[branch] === skillId) return branch;
    }
    return null;
  }

  private applySkillEffect(skill: SkillDef): void {
    const effects = SKILL_EFFECTS[skill.id] ?? [];

    if (skill.id === 'chain_hack') {
      this.startChainHack(skill.duration);
      return;
    }

    if (skill.id === 'static_discharge') {
      const enemyPlugin = this.engine.getPlugin<EnemyPlugin>('enemy');
      if (enemyPlugin && this.engine.state.enemy) {
        const burst = Math.ceil(this.engine.getModifier('tap_damage') * STATIC_DISCHARGE_BURST);
        enemyPlugin.applyDamage(burst);
        this.engine.emit('damage_number', { id: `discharge_${Date.now()}`, value: burst, type: 'boss' as const });
      }
      return;
    }

    if (skill.id === 'quantum_echo') {
      // Reset all base skill cooldowns only - does NOT auto-fire them
      const zeroed: Partial<GameState['skillCooldowns']> = {};
      for (const s of BASE_SKILLS) zeroed[s.id] = { readyAt: 0, activeUntil: 0 };
      this.engine.updateState({ skillCooldowns: { ...this.engine.state.skillCooldowns, ...zeroed } });
      this.engine.emit('quantum_echo_triggered', {});
      return;
    }

    if (skill.id === 'entropy_burst') {
      for (const e of effects) {
        const key = e.modifierType === 'tap_damage' ? this.modKey('entropy_burst_tap') : this.modKey('entropy_burst_gold');
        this.engine.addModifier(key, { type: e.modifierType, value: e.value, isMultiplier: e.isMultiplier });
      }
      setTimeout(() => {
        this.engine.removeModifiers(this.modKey('entropy_burst_tap'));
        this.engine.removeModifiers(this.modKey('entropy_burst_gold'));
      }, skill.duration * 1000);
      return;
    }

    for (const e of effects) {
      this.engine.addModifier(this.modKey(skill.id), { type: e.modifierType, value: e.value, isMultiplier: e.isMultiplier });
    }
    if (effects.length > 0 && skill.duration > 0) {
      setTimeout(() => this.engine.removeModifiers(this.modKey(skill.id)), skill.duration * 1000);
    }
  }

  private startChainHack(duration: number): void {
    if (this.chainHackInterval) clearInterval(this.chainHackInterval);
    this.chainHackInterval = setInterval(() => {
      const enemyPlugin = this.engine.getPlugin<EnemyPlugin>('enemy');
      if (!enemyPlugin || !this.engine.state.enemy) return;
      const tapDmg = this.engine.getModifier('tap_damage');
      enemyPlugin.applyDamage(Math.ceil(tapDmg));
      this.engine.emit('damage_number', {
        id: `chain_${Date.now()}_${Math.random()}`,
        value: Math.ceil(tapDmg),
        type: 'normal' as const,
      });
    }, CHAIN_HACK_INTERVAL_MS);
    setTimeout(() => {
      if (this.chainHackInterval) {
        clearInterval(this.chainHackInterval);
        this.chainHackInterval = null;
      }
    }, duration * 1000);
  }

  isSkillActive(skillId: SkillId): boolean {
    const cd = this.engine.state.skillCooldowns[skillId] ?? DEFAULT_CD;
    return cd.activeUntil > Date.now();
  }

  isFirewallActive(): boolean {
    return this.isSkillActive('firewall');
  }

  getUnlockedSkills(): SkillDef[] {
    return SKILLS.filter(s => this.isSkillAccessible(s.id));
  }

  private modKey(skillId: string): string {
    return `skill_${skillId}`;
  }

  cleanup(): void {
    if (this.chainHackInterval) {
      clearInterval(this.chainHackInterval);
      this.chainHackInterval = null;
    }
    for (const skill of SKILLS) {
      this.engine?.removeModifiers(this.modKey(skill.id));
    }
    this.engine?.removeModifiers(this.modKey('entropy_burst_tap'));
    this.engine?.removeModifiers(this.modKey('entropy_burst_gold'));
  }
}
