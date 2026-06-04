import type { IPlugin, IEngine, GameState } from '../engine/types';
import type { EnemyPlugin } from './EnemyPlugin';
import type { DamageNumberEvent } from '../engine/types';
import { TAP_CONFIG } from '../config/game.config';

// Tap limiter config
const TAP_LIMITER = {
  maxTapsPerSecond: 6,       // Taps/s threshold before heat builds
  heatPerExcessTap: 0.15,   // Heat gained per tap over limit (0-1 scale)
  heatDecayPerSecond: 0.25, // Heat lost per second when under limit
  overheatCooldown: 2000,   // Ms of cooldown when overheated (heat = 1)
  windowMs: 1000,           // Rolling window to measure taps/s
};

export class TapPlugin implements IPlugin {
  id = 'tap';
  dependencies = ['enemy'];

  private engine!: IEngine;
  private comboCount = 0;
  private lastTapTime = 0;

  // Tap limiter state
  private tapTimestamps: number[] = [];
  private heat = 0;          // 0-1, when 1 = overheated
  private overheatedUntil = 0; // Timestamp when overheat ends
  private lastHeatUpdate = 0;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    this.lastHeatUpdate = Date.now();
  }

  /** Get current heat level (0-1) */
  getHeat(): number {
    return this.heat;
  }

  /** Check if currently overheated */
  isOverheated(): boolean {
    return Date.now() < this.overheatedUntil;
  }

  /** Get taps per second in rolling window */
  getTapsPerSecond(): number {
    const now = Date.now();
    const recentTaps = this.tapTimestamps.filter(t => now - t < TAP_LIMITER.windowMs);
    return recentTaps.length;
  }

  private updateHeat(): void {
    const now = Date.now();
    const delta = (now - this.lastHeatUpdate) / 1000;
    this.lastHeatUpdate = now;

    // Clean old timestamps
    this.tapTimestamps = this.tapTimestamps.filter(t => now - t < TAP_LIMITER.windowMs);

    const tps = this.tapTimestamps.length;

    if (tps <= TAP_LIMITER.maxTapsPerSecond) {
      // Under limit - decay heat
      this.heat = Math.max(0, this.heat - TAP_LIMITER.heatDecayPerSecond * delta);
    }
  }

  tap(x?: number, y?: number): void {
    const state = this.engine.state;
    if (!state.enemy || state.enemy.hp <= 0) return;

    const now = Date.now();

    // Update heat decay
    this.updateHeat();

    // Check if overheated
    if (this.isOverheated()) {
      // Show "OVERHEATED" feedback but no damage
      const dmgEvent: DamageNumberEvent = {
        id: `dmg_${now}_${Math.random()}`,
        value: 0,
        type: 'blocked',
        x,
        y,
      };
      this.engine.emit('damage_number', dmgEvent);
      return;
    }

    // Record this tap
    this.tapTimestamps.push(now);

    // Check taps per second
    const tps = this.tapTimestamps.filter(t => now - t < TAP_LIMITER.windowMs).length;

    if (tps > TAP_LIMITER.maxTapsPerSecond) {
      // Over limit - add heat
      this.heat = Math.min(1, this.heat + TAP_LIMITER.heatPerExcessTap);

      // Check for overheat
      if (this.heat >= 1) {
        this.overheatedUntil = now + TAP_LIMITER.overheatCooldown;
        this.engine.emit('tap_overheated', { cooldownMs: TAP_LIMITER.overheatCooldown });
      }
    }

    // Combo logic
    if (now - this.lastTapTime < TAP_CONFIG.comboWindowMs) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastTapTime = now;

    const isCrit = Math.random() < (TAP_CONFIG.baseCritChance + this.engine.getModifier('crit_chance') - 1);
    const comboBonus = this.comboCount >= TAP_CONFIG.comboThreshold ? TAP_CONFIG.comboMultiplier : 1;
    const tapDamage = this.engine.getModifier('tap_damage') * TAP_CONFIG.baseDamage;

    let damage = tapDamage * comboBonus;
    if (isCrit) damage *= (TAP_CONFIG.baseCritMultiplier * this.engine.getModifier('crit_multiplier'));
    damage = Math.ceil(damage);

    const dmgEvent: DamageNumberEvent = {
      id: `dmg_${now}_${Math.random()}`,
      value: damage,
      type: isCrit ? 'crit' : 'normal',
      x,
      y,
    };
    this.engine.emit('damage_number', dmgEvent);

    const enemyPlugin = this.engine.getPlugin<EnemyPlugin>('enemy');
    enemyPlugin?.applyDamage(damage, isCrit);
  }

  onTick(delta: number, _state: GameState): void {
    // Decay heat even when not tapping
    const now = Date.now();
    const deltaSec = delta / 1000;

    // Clean old timestamps
    this.tapTimestamps = this.tapTimestamps.filter(t => now - t < TAP_LIMITER.windowMs);

    const tps = this.tapTimestamps.length;
    if (tps <= TAP_LIMITER.maxTapsPerSecond && !this.isOverheated()) {
      this.heat = Math.max(0, this.heat - TAP_LIMITER.heatDecayPerSecond * deltaSec);
    }

    // If overheated, reset heat when cooldown ends
    if (this.overheatedUntil > 0 && now >= this.overheatedUntil) {
      this.heat = 0;
      this.overheatedUntil = 0;
    }
  }
}
