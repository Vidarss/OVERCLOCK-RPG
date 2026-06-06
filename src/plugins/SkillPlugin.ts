import type { IPlugin, IEngine, GameState, SkillDef, SkillId, SkillCooldownState } from '../engine/types';
import {
  BASE_SKILLS,
  ALL_SKILLS,
  SKILL_EFFECTS,
} from '../config/game.config';

export { BASE_SKILLS };
export const SKILLS: SkillDef[] = ALL_SKILLS;

const DEFAULT_CD: SkillCooldownState = { readyAt: 0, activeUntil: 0 };

export class SkillPlugin implements IPlugin {
  id = 'skill';
  dependencies = ['enemy', 'tap'];
  stateKeys = ['skillCooldowns'] as (keyof GameState)[];
  defaultState = {
    skillCooldowns: {
      surge:           { ...DEFAULT_CD },
      overclock_pulse: { ...DEFAULT_CD },
      gold_rush:       { ...DEFAULT_CD },
      firewall:        { ...DEFAULT_CD },
    },
  };

  private engine!: IEngine;

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
    return state.stage >= skill.unlockStage || state.highestStage >= skill.unlockStage;
  }

  private applySkillEffect(skill: SkillDef): void {
    const effects = SKILL_EFFECTS[skill.id] ?? [];

    for (const e of effects) {
      this.engine.addModifier(this.modKey(skill.id), { type: e.modifierType, value: e.value, isMultiplier: e.isMultiplier });
    }
    if (effects.length > 0 && skill.duration > 0) {
      setTimeout(() => this.engine.removeModifiers(this.modKey(skill.id)), skill.duration * 1000);
    }
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
    for (const skill of SKILLS) {
      this.engine?.removeModifiers(this.modKey(skill.id));
    }
  }
}
