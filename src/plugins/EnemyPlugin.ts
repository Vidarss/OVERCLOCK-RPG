import type { IPlugin, IEngine, GameState, Enemy, GameEvent } from '../engine/types';
import type { SkillPlugin } from './SkillPlugin';
import { ENEMY_CONFIG } from '../config/game.config';

/**
 * GOD FORMULA - Calculate enemy HP based on stage progression.
 * 
 * Phase 1 (1-50): Gentle introduction, learn mechanics
 * Phase 2 (51-100): Requires upgrades and strategy  
 * Phase 3 (101-150): Hard mode, need skills/combos
 * Phase 4 (150+): Prestige territory, exponential wall
 */
export function getEnemyHp(stage: number, phase: number): number {
  const cfg = ENEMY_CONFIG;
  const base = cfg.normalHpBase;
  
  // Phase adds a small HP multiplier within the stage
  const phaseMultiplier = 1 + (phase - 1) * 0.08; // +8% per phase
  
  let hp: number;
  
  if (stage <= cfg.phase1MaxStage) {
    // Phase 1: Stages 1-50 (gentle learning curve)
    const linear = 1 + stage * cfg.phase1LinearGrowth;
    const exp = Math.pow(cfg.phase1Exponent, stage / cfg.phase1ExponentInterval);
    hp = base * linear * exp;
  } else if (stage <= cfg.phase2MaxStage) {
    // Phase 2: Stages 51-100 (medium difficulty)
    const hp50Linear = 1 + cfg.phase1MaxStage * cfg.phase1LinearGrowth;
    const hp50Exp = Math.pow(cfg.phase1Exponent, cfg.phase1MaxStage / cfg.phase1ExponentInterval);
    const hp50 = base * hp50Linear * hp50Exp;
    const exp = Math.pow(cfg.phase2Exponent, (stage - cfg.phase1MaxStage) / cfg.phase2ExponentInterval);
    hp = hp50 * exp;
  } else if (stage <= cfg.phase3MaxStage) {
    // Phase 3: Stages 101-150 (hard mode)
    const hp50Linear = 1 + cfg.phase1MaxStage * cfg.phase1LinearGrowth;
    const hp50Exp = Math.pow(cfg.phase1Exponent, cfg.phase1MaxStage / cfg.phase1ExponentInterval);
    const hp50 = base * hp50Linear * hp50Exp;
    const hp100Exp = Math.pow(cfg.phase2Exponent, (cfg.phase2MaxStage - cfg.phase1MaxStage) / cfg.phase2ExponentInterval);
    const hp100 = hp50 * hp100Exp;
    const exp = Math.pow(cfg.phase3Exponent, (stage - cfg.phase2MaxStage) / cfg.phase3ExponentInterval);
    hp = hp100 * exp;
  } else {
    // Phase 4: Stages 150+ (prestige territory)
    const hp50Linear = 1 + cfg.phase1MaxStage * cfg.phase1LinearGrowth;
    const hp50Exp = Math.pow(cfg.phase1Exponent, cfg.phase1MaxStage / cfg.phase1ExponentInterval);
    const hp50 = base * hp50Linear * hp50Exp;
    const hp100Exp = Math.pow(cfg.phase2Exponent, (cfg.phase2MaxStage - cfg.phase1MaxStage) / cfg.phase2ExponentInterval);
    const hp100 = hp50 * hp100Exp;
    const hp150Exp = Math.pow(cfg.phase3Exponent, (cfg.phase3MaxStage - cfg.phase2MaxStage) / cfg.phase3ExponentInterval);
    const hp150 = hp100 * hp150Exp;
    const exp = Math.pow(cfg.phase4Exponent, (stage - cfg.phase3MaxStage) / cfg.phase4ExponentInterval);
    hp = hp150 * exp;
  }
  
  return Math.floor(hp * phaseMultiplier);
}

/**
 * GOD FORMULA - Calculate boss HP based on stage progression.
 * Bosses are 8x tankier than normal enemies.
 */
export function getBossHp(stage: number): number {
  const cfg = ENEMY_CONFIG;
  const base = cfg.bossHpBase;
  
  let hp: number;
  
  if (stage <= cfg.phase1MaxStage) {
    const linear = 1 + stage * cfg.phase1LinearGrowth;
    const exp = Math.pow(cfg.phase1Exponent, stage / cfg.phase1ExponentInterval);
    hp = base * linear * exp;
  } else if (stage <= cfg.phase2MaxStage) {
    const hp50Linear = 1 + cfg.phase1MaxStage * cfg.phase1LinearGrowth;
    const hp50Exp = Math.pow(cfg.phase1Exponent, cfg.phase1MaxStage / cfg.phase1ExponentInterval);
    const hp50 = base * hp50Linear * hp50Exp;
    const exp = Math.pow(cfg.phase2Exponent, (stage - cfg.phase1MaxStage) / cfg.phase2ExponentInterval);
    hp = hp50 * exp;
  } else if (stage <= cfg.phase3MaxStage) {
    const hp50Linear = 1 + cfg.phase1MaxStage * cfg.phase1LinearGrowth;
    const hp50Exp = Math.pow(cfg.phase1Exponent, cfg.phase1MaxStage / cfg.phase1ExponentInterval);
    const hp50 = base * hp50Linear * hp50Exp;
    const hp100Exp = Math.pow(cfg.phase2Exponent, (cfg.phase2MaxStage - cfg.phase1MaxStage) / cfg.phase2ExponentInterval);
    const hp100 = hp50 * hp100Exp;
    const exp = Math.pow(cfg.phase3Exponent, (stage - cfg.phase2MaxStage) / cfg.phase3ExponentInterval);
    hp = hp100 * exp;
  } else {
    const hp50Linear = 1 + cfg.phase1MaxStage * cfg.phase1LinearGrowth;
    const hp50Exp = Math.pow(cfg.phase1Exponent, cfg.phase1MaxStage / cfg.phase1ExponentInterval);
    const hp50 = base * hp50Linear * hp50Exp;
    const hp100Exp = Math.pow(cfg.phase2Exponent, (cfg.phase2MaxStage - cfg.phase1MaxStage) / cfg.phase2ExponentInterval);
    const hp100 = hp50 * hp100Exp;
    const hp150Exp = Math.pow(cfg.phase3Exponent, (cfg.phase3MaxStage - cfg.phase2MaxStage) / cfg.phase3ExponentInterval);
    const hp150 = hp100 * hp150Exp;
    const exp = Math.pow(cfg.phase4Exponent, (stage - cfg.phase3MaxStage) / cfg.phase4ExponentInterval);
    hp = hp150 * exp;
  }
  
  return Math.floor(hp);
}

/**
 * Get enemy name based on stage, phase, and whether it's a boss.
 * Randomly selects from enemies available at the current stage.
 */
function getEnemyName(stage: number, phase: number, isBoss: boolean): string {
  if (isBoss) {
    // Filter bosses available at this stage
    const available = ENEMY_CONFIG.bosses.filter(
      b => stage >= b.minStage && stage <= b.maxStage
    );
    if (available.length === 0) return ENEMY_CONFIG.bosses[0].name;
    // Use seeded random for consistency
    const seed = (stage * 1000 + phase) % available.length;
    return available[seed].name;
  }
  
  // Filter monsters available at this stage
  const available = ENEMY_CONFIG.monsters.filter(
    m => stage >= m.minStage && stage <= m.maxStage
  );
  if (available.length === 0) return ENEMY_CONFIG.monsters[0].name;
  // Use seeded random for consistency
  const seed = (stage * 1000 + phase) % available.length;
  return available[seed].name;
}

/**
 * Get a random elite enemy name from those available at the current stage.
 */
function getEliteName(stage: number): string {
  const available = ENEMY_CONFIG.elites.filter(
    e => stage >= e.minStage && stage <= e.maxStage
  );
  if (available.length === 0) return ENEMY_CONFIG.elites[0].name;
  const idx = Math.floor(Math.random() * available.length);
  return available[idx].name;
}

/**
 * Spawn an enemy for a given stage and phase.
 * Phase 1-9: Normal enemies (can be elite)
 * Phase 10: Boss
 */
export function spawnEnemy(stage: number, phase: number): Enemy {
  const isBoss = phase >= ENEMY_CONFIG.phasesPerStage;
  const isElite = !isBoss && stage > ENEMY_CONFIG.eliteMinStage && Math.random() < ENEMY_CONFIG.eliteChance;
  const hpMultiplier = isElite ? ENEMY_CONFIG.eliteHpMultiplier : 1;
  const baseHp = isBoss ? getBossHp(stage) : getEnemyHp(stage, phase) * hpMultiplier;

  return {
    id: `enemy_${stage}_${phase}_${Date.now()}`,
    name: isElite ? getEliteName(stage) : getEnemyName(stage, phase, isBoss),
    hp: baseHp,
    maxHp: baseHp,
    isBoss,
    tier: 1, // Tiers removed - all enemies are equal tier
    enemyType: isBoss ? 'boss' : isElite ? 'elite' : 'normal',
    bossPhase: 'none',
    isElite,
    phaseThreshold: isBoss ? 0.5 : 0,
  };
}

export class EnemyPlugin implements IPlugin {
  id = 'enemy';
  dependencies = ['stage'];
  stateKeys = ['enemy', 'phase', 'isBossActive', 'bossTimeRemaining', 'pendingBossReturn', 'pendingBossStage'] as (keyof GameState)[];

  private engine!: IEngine;
  private bossTimer = 0;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.on('state_sync', (event: GameEvent<{ savedState: GameState } | null>) => {
      const stage = event.payload?.savedState?.stage ?? engine.state.stage;
      const phase = event.payload?.savedState?.phase ?? 1;
      this.spawnForStagePhase(stage, phase);
    });

    engine.on('phase_clear', (event: GameEvent<{ stage: number; phase: number }>) => {
      const { stage, phase } = event.payload;
      const nextPhase = phase + 1;
      
      if (nextPhase > ENEMY_CONFIG.phasesPerStage) {
        // Boss defeated! Advance to next stage, phase 1
        this.engine.emit('stage_clear', { stage, goldReward: 0 });
        this.spawnForStagePhase(stage + 1, 1);
      } else {
        // Next phase in current stage
        this.spawnForStagePhase(stage, nextPhase);
      }
    });

    // Handle boss timeout - player failed, goes back to phase 1 of current stage
    engine.on('boss_timeout', (event: GameEvent<{ stage: number }>) => {
      // Handled in onTick
    });

    engine.on('overclock', () => {
      this.engine.updateState({ pendingBossReturn: false, pendingBossStage: null });
      this.spawnForStagePhase(1, 1);
    });
  }

  private spawnForStagePhase(stage: number, phase: number): void {
    const enemy = spawnEnemy(stage, phase);
    const highestStage = Math.max(stage, this.engine.state.highestStage ?? 1);
    const maxStage = Math.max(highestStage, this.engine.state.maxStage ?? 1);
    
    this.engine.updateState({ 
      enemy, 
      stage, 
      phase,
      highestStage, 
      maxStage 
    });

    if (enemy.isBoss) {
      this.bossTimer = ENEMY_CONFIG.bossTimeoutSeconds;
      this.engine.updateState({ isBossActive: true, bossTimeRemaining: ENEMY_CONFIG.bossTimeoutSeconds });
      this.engine.emit('boss_spawn', { enemy });
    } else {
      this.engine.updateState({ isBossActive: false, bossTimeRemaining: 0 });
      this.engine.emit('enemy_spawn', { enemy });
    }
  }

  returnToBoss(): void {
    const bossStage = this.engine.state.pendingBossStage;
    if (!bossStage) return;
    this.engine.updateState({ pendingBossReturn: false, pendingBossStage: null });
    // Return to boss phase (phase 10) of the pending stage
    this.spawnForStagePhase(bossStage, ENEMY_CONFIG.phasesPerStage);
  }

  applyDamage(amount: number, isCrit?: boolean): void {
    const state = this.engine.state;
    if (!state.enemy) return;

    let effectiveDamage = amount;

    if (state.enemy.bossPhase === 'shield') {
      effectiveDamage = Math.ceil(amount * ENEMY_CONFIG.bossShieldDamageMultiplier);
    }

    const newHp = Math.max(0, state.enemy.hp - effectiveDamage);
    const updatedEnemy = { ...state.enemy, hp: newHp };

    if (updatedEnemy.isBoss && updatedEnemy.bossPhase === 'none' && newHp <= updatedEnemy.maxHp * updatedEnemy.phaseThreshold) {
      const phases: Array<'shield' | 'enrage' | 'regen'> = ['shield', 'enrage', 'regen'];
      updatedEnemy.bossPhase = phases[Math.floor(Math.random() * phases.length)];
    }

    this.engine.updateState({
      enemy: updatedEnemy,
      totalDamageDealt: state.totalDamageDealt + effectiveDamage,
    });

    this.engine.emit('enemy_hit', { damage: effectiveDamage, hp: newHp, maxHp: state.enemy.maxHp, isCrit: isCrit ?? false });

    if (newHp <= 0) {
      this.handleEnemyDeath();
    }
  }

  private handleEnemyDeath(): void {
    const state = this.engine.state;
    if (!state.enemy) return;

    const goldMultiplier = state.enemy.isBoss 
      ? ENEMY_CONFIG.bossGoldMultiplier 
      : state.enemy.isElite 
        ? ENEMY_CONFIG.eliteGoldMultiplier 
        : ENEMY_CONFIG.normalGoldMultiplier;
    const goldReward = Math.floor(state.enemy.maxHp * goldMultiplier);
    
    this.engine.emit('enemy_death', { enemy: state.enemy, goldReward });
    this.engine.updateState({ isBossActive: false });
    
    // Emit phase_clear instead of stage_clear - let the event handler decide progression
    this.engine.emit('phase_clear', { stage: state.stage, phase: state.phase ?? 1, goldReward });
  }

  onTick(delta: number, state: GameState): void {
    if (!state.isBossActive) return;

    const skillPlugin = this.engine.getPlugin<SkillPlugin>('skill');
    const frozen = skillPlugin?.isFirewallActive() ?? false;

    if (!frozen) {
      this.bossTimer -= delta;
    }
    const remaining = Math.max(0, this.bossTimer);
    this.engine.updateState({ bossTimeRemaining: remaining });

    if (state.enemy?.bossPhase === 'regen' && state.enemy.hp < state.enemy.maxHp) {
      const regenAmount = Math.ceil(state.enemy.maxHp * ENEMY_CONFIG.bossRegenRatePerSecond * delta);
      const newHp = Math.min(state.enemy.maxHp, state.enemy.hp + regenAmount);
      this.engine.updateState({ enemy: { ...state.enemy, hp: newHp } });
    }

    if (remaining <= 0) {
      this.engine.updateState({
        isBossActive: false,
        pendingBossReturn: true,
        pendingBossStage: state.stage,
      });
      this.engine.emit('boss_timeout', { stage: state.stage });
      // Drop back to phase 1 of current stage to farm normal enemies
      this.spawnForStagePhase(state.stage, 1);
    }
  }
}
