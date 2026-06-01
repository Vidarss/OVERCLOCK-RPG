import type { IPlugin, IEngine, GameState } from '../engine/types';
import type { EnemyPlugin } from './EnemyPlugin';
import type { DamageNumberEvent } from '../engine/types';
import { TAP_CONFIG } from '../config/game.config';

export class TapPlugin implements IPlugin {
  id = 'tap';
  dependencies = ['enemy'];

  private engine!: IEngine;
  private comboCount = 0;
  private lastTapTime = 0;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
  }

  tap(x?: number, y?: number): void {
    const state = this.engine.state;
    if (!state.enemy || state.enemy.hp <= 0) return;

    const now = Date.now();
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
      id: `dmg_${Date.now()}_${Math.random()}`,
      value: damage,
      type: isCrit ? 'crit' : 'normal',
      x,
      y,
    };
    this.engine.emit('damage_number', dmgEvent);

    const enemyPlugin = this.engine.getPlugin<EnemyPlugin>('enemy');
    enemyPlugin?.applyDamage(damage, isCrit);
  }

  onTick(_delta: number, _state: GameState): void {}
}
