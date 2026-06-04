import type { IPlugin, IEngine, GameState, Enemy, GameEvent } from '../engine/types';
import type { SkillPlugin } from './SkillPlugin';
import { ENEMY_CONFIG } from '../config/game.config';

/**
 * Calculate enemy HP based on stage progression.
 * Stages 1-500: Smooth scaling with linear growth + exponential every 50 stages.
 * Stages 500+: Steep exponential scaling requiring skills/combos.
 */
export function getEnemyHp(stage: number, phase: number): number {
  const { normalHpBase: base, linearGrowth, scalingExponentEarly: expE, scalingExponentLate: expL, hardModeStage, phasesPerStage } = ENEMY_CONFIG;
  
  // Phase adds a small HP multiplier within the stage (later phases = slightly tankier)
  const phaseMultiplier = 1 + (phase - 1) * 0.05; // +5% per phase
  
  if (stage <= hardModeStage) {
    const linearFactor = 1 + (stage - 1) * linearGrowth;
    const expFactor = Math.pow(expE, (stage - 1) / 50);
    return Math.floor(base * linearFactor * expFactor * phaseMultiplier);
  }
  
  const hp500Linear = 1 + (hardModeStage - 1) * linearGrowth;
  const hp500Exp = Math.pow(expE, (hardModeStage - 1) / 50);
  const hp500 = base * hp500Linear * hp500Exp;
  const lateExpFactor = Math.pow(expL, (stage - hardModeStage) / 10);
  return Math.floor(hp500 * lateExpFactor * phaseMultiplier);
}

/**
 * Calculate boss HP based on stage progression.
 */
export function getBossHp(stage: number): number {
  const { bossHpBase: base, linearGrowth, scalingExponentEarly: expE, scalingExponentLate: expL, hardModeStage } = ENEMY_CONFIG;
  
  if (stage <= hardModeStage) {
    const linearFactor = 1 + (stage - 1) * linearGrowth;
    const expFactor = Math.pow(expE, (stage - 1) / 50);
    return Math.floor(base * linearFactor * expFactor);
  }
  
  const hp500Linear = 1 + (hardModeStage - 1) * linearGrowth;
  const hp500Exp = Math.pow(expE, (hardModeStage - 1) / 50);
  const hp500 = base * hp500Linear * hp500Exp;
  const lateExpFactor = Math.pow(expL, (stage - hardModeStage) / 10);
  return Math.floor(hp500 * lateExpFactor);
}

/**
 * Get enemy tier (0-4) based on stage for name pool selection.
 */
export function getEnemyTier(stage: number): number {
  return Math.min(Math.floor((stage - 1) / ENEMY_CONFIG.stagesPerTier), ENEMY_CONFIG.enemyNamesByTier.length - 1);
}

/**
 * Get enemy name based on stage, phase, and whether it's a boss.
 */
function getEnemyName(stage: number, phase: number, isBoss: boolean): string {
  if (isBoss) {
    // Boss index cycles through the 10 bosses based on stage
    const idx = (stage - 1) % ENEMY_CONFIG.bossNames.length;
    return ENEMY_CONFIG.bossNames[idx];
  }
  
  const tier = getEnemyTier(stage);
  const names = ENEMY_CONFIG.enemyNamesByTier[tier] ?? ENEMY_CONFIG.enemyNamesByTier[0];
  // Use a seeded random based on stage + phase for consistency
  const seed = (stage * 1000 + phase) % names.length;
  return names[seed];
}

/**
 * Get a random elite enemy name from the elite pool.
 */
function getEliteName(): string {
  const names = ENEMY_CONFIG.eliteNames;
  const idx = Math.floor(Math.random() * names.length);
  return names[idx];
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
    name: isElite ? getEliteName() : getEnemyName(stage, phase, isBoss),
    hp: baseHp,
    maxHp: baseHp,
    isBoss,
    tier: getEnemyTier(stage),
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
