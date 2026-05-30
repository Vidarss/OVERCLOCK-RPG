import type { IPlugin, IEngine, GameState, SkillId } from '../engine/types';
import { HERO_CONFIG, SKILL_UPGRADE_CONFIG, type HeroUpgradeDef, type SkillUpgradeDef } from '../config/game.config';

export class HeroPlugin implements IPlugin {
  id = 'hero';
  dependencies = ['gold'];
  stateKeys = ['heroUpgrades', 'skillUpgrades'] as (keyof GameState)[];
  defaultState = {
    heroUpgrades: {} as Record<string, number>,
    skillUpgrades: {} as Record<SkillId, number>,
  };

  private engine!: IEngine;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    this.applyAllModifiers();
  }

  /**
   * Get the cost for the next level of a hero upgrade
   */
  getHeroUpgradeCost(upgradeId: string): number {
    const upgrade = HERO_CONFIG.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return Infinity;
    const level = this.getHeroUpgradeLevel(upgradeId);
    if (level >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  }

  /**
   * Get the current level of a hero upgrade
   */
  getHeroUpgradeLevel(upgradeId: string): number {
    return this.engine.state.heroUpgrades[upgradeId] ?? 0;
  }

  /**
   * Purchase a hero upgrade level
   */
  purchaseHeroUpgrade(upgradeId: string): boolean {
    const upgrade = HERO_CONFIG.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;

    const level = this.getHeroUpgradeLevel(upgradeId);
    if (level >= upgrade.maxLevel) return false;

    const cost = this.getHeroUpgradeCost(upgradeId);
    if (this.engine.state.gold < cost) return false;

    // Deduct gold and increase level
    const newHeroUpgrades = {
      ...this.engine.state.heroUpgrades,
      [upgradeId]: level + 1,
    };

    this.engine.updateState({
      gold: this.engine.state.gold - cost,
      heroUpgrades: newHeroUpgrades,
    });

    // Update modifiers
    this.updateHeroModifier(upgrade, level + 1);
    this.engine.emit('hero_upgrade', { upgradeId, newLevel: level + 1 });

    return true;
  }

  /**
   * Get the cost for the next level of a skill upgrade
   */
  getSkillUpgradeCost(skillId: SkillId): number {
    const upgrade = SKILL_UPGRADE_CONFIG.upgrades.find(u => u.skillId === skillId);
    if (!upgrade) return Infinity;
    const level = this.getSkillUpgradeLevel(skillId);
    if (level >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  }

  /**
   * Get the current level of a skill upgrade
   */
  getSkillUpgradeLevel(skillId: SkillId): number {
    return this.engine.state.skillUpgrades[skillId] ?? 0;
  }

  /**
   * Get the effectiveness multiplier for a skill (1 + level * effectPerLevel)
   */
  getSkillEffectiveness(skillId: SkillId): number {
    const upgrade = SKILL_UPGRADE_CONFIG.upgrades.find(u => u.skillId === skillId);
    if (!upgrade) return 1;
    const level = this.getSkillUpgradeLevel(skillId);
    return 1 + level * upgrade.effectPerLevel;
  }

  /**
   * Purchase a skill upgrade level
   */
  purchaseSkillUpgrade(skillId: SkillId): boolean {
    const upgrade = SKILL_UPGRADE_CONFIG.upgrades.find(u => u.skillId === skillId);
    if (!upgrade) return false;

    const level = this.getSkillUpgradeLevel(skillId);
    if (level >= upgrade.maxLevel) return false;

    const cost = this.getSkillUpgradeCost(skillId);
    if (this.engine.state.gold < cost) return false;

    // Deduct gold and increase level
    const newSkillUpgrades = {
      ...this.engine.state.skillUpgrades,
      [skillId]: level + 1,
    };

    this.engine.updateState({
      gold: this.engine.state.gold - cost,
      skillUpgrades: newSkillUpgrades,
    });

    this.engine.emit('skill_upgrade', { skillId, newLevel: level + 1 });

    return true;
  }

  /**
   * Get all hero upgrades with their current state
   */
  getHeroUpgrades(): (HeroUpgradeDef & { level: number; cost: number; canAfford: boolean })[] {
    const gold = this.engine.state.gold;
    return HERO_CONFIG.upgrades.map(upgrade => {
      const level = this.getHeroUpgradeLevel(upgrade.id);
      const cost = this.getHeroUpgradeCost(upgrade.id);
      return {
        ...upgrade,
        level,
        cost,
        canAfford: gold >= cost && level < upgrade.maxLevel,
      };
    });
  }

  /**
   * Get all skill upgrades with their current state
   */
  getSkillUpgrades(): (SkillUpgradeDef & { level: number; cost: number; canAfford: boolean; effectiveness: number })[] {
    const gold = this.engine.state.gold;
    return SKILL_UPGRADE_CONFIG.upgrades.map(upgrade => {
      const level = this.getSkillUpgradeLevel(upgrade.skillId);
      const cost = this.getSkillUpgradeCost(upgrade.skillId);
      const effectiveness = this.getSkillEffectiveness(upgrade.skillId);
      return {
        ...upgrade,
        level,
        cost,
        canAfford: gold >= cost && level < upgrade.maxLevel,
        effectiveness,
      };
    });
  }

  /**
   * Apply all hero modifiers based on current state
   */
  private applyAllModifiers(): void {
    for (const upgrade of HERO_CONFIG.upgrades) {
      const level = this.getHeroUpgradeLevel(upgrade.id);
      if (level > 0) {
        this.updateHeroModifier(upgrade, level);
      }
    }
  }

  /**
   * Update a single hero modifier
   */
  private updateHeroModifier(upgrade: HeroUpgradeDef, level: number): void {
    // Remove existing modifier first
    this.engine.removeModifiers(`hero_${upgrade.id}`);
    
    if (level > 0) {
      this.engine.addModifier(`hero_${upgrade.id}`, {
        type: upgrade.modifierType,
        value: upgrade.valuePerLevel * level,
        isMultiplier: upgrade.isMultiplier,
      });
    }
  }

  /**
   * Get total tap power from hero upgrades
   */
  getTotalTapPower(): number {
    const tapPowerUpgrade = HERO_CONFIG.upgrades.find(u => u.id === 'hero_tap_power');
    if (!tapPowerUpgrade) return 0;
    const level = this.getHeroUpgradeLevel('hero_tap_power');
    return level * tapPowerUpgrade.valuePerLevel;
  }

  cleanup(): void {
    for (const upgrade of HERO_CONFIG.upgrades) {
      this.engine.removeModifiers(`hero_${upgrade.id}`);
    }
  }
}
