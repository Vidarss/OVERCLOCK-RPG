import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEngine } from '../../engine/Engine';
import type { DamageNumberEvent } from '../../engine/types';
import { useGameState } from '../../hooks/useGameState';
import { formatNumber } from '../../utils/format';
import { EnemySprite } from './EnemySprite';
import { DamageNumber } from './DamageNumber';
import { BossTimer } from './BossTimer';
import { SkillBar } from './SkillBar';
import { ZoneScene, getZone } from './ZoneScene';
import type { ZoneConfig } from './ZoneScene';
import type { TapPlugin } from '../../plugins/TapPlugin';
import type { EnemyPlugin } from '../../plugins/EnemyPlugin';
import { UI_CONFIG, ENEMY_CONFIG } from '../../config/game.config';
import { playSFX } from '../../hooks/useAudio';

interface BattlefieldProps {
  engine: GameEngine;
}

interface Ripple {
  id: string;
  x: number;
  y: number;
  color: string;
}

export const Battlefield: React.FC<BattlefieldProps> = ({ engine }) => {
  const enemy = useGameState(engine, s => s.enemy);
  const stage = useGameState(engine, s => s.stage);
  const phase = useGameState(engine, s => s.phase);
  const overclockCount = useGameState(engine, s => s.overclockCount);
  const pendingBossReturn = useGameState(engine, s => s.pendingBossReturn);
  const pendingBossStage = useGameState(engine, s => s.pendingBossStage);

  const [damageNumbers, setDamageNumbers] = useState<DamageNumberEvent[]>([]);
  const [isHit, setIsHit] = useState(false);
  const [isDying, setIsDying] = useState(false);
  const [showStageClear, setShowStageClear] = useState(false);
  const [stageClearText, setStageClearText] = useState('');
  const [showZoneTransition, setShowZoneTransition] = useState(false);
  const [zoneTransitionLabel, setZoneTransitionLabel] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [screenFlash, setScreenFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zone: ZoneConfig = getZone(stage ?? 1);

  useEffect(() => {
    const unsub1 = engine.on<DamageNumberEvent>('damage_number', event => {
      if (event.payload.type === 'idle') return;
      setDamageNumbers(prev => [...prev.slice(-(UI_CONFIG.maxDamageNumbers - 1)), event.payload]);
      // Play sound based on damage type
      if (event.payload.type === 'crit') {
        playSFX.critical();
      } else if (event.payload.type === 'tap') {
        playSFX.click();
      }
    });

    const unsub2 = engine.on('enemy_hit', () => {
      setIsHit(true);
      setScreenFlash(true);
      setTimeout(() => setIsHit(false), UI_CONFIG.enemyHitAnimationMs);
      setTimeout(() => setScreenFlash(false), UI_CONFIG.screenFlashMs);
    });

    const unsub3 = engine.on<{ stage: number }>('stage_clear', event => {
      setIsDying(true);
      const cleared = event.payload?.stage ?? 1;
      setStageClearText(`STAGE ${cleared} CLEAR`);
      setShowStageClear(true);
      playSFX.stageClear();
      setTimeout(() => {
        setIsDying(false);
        setShowStageClear(false);
      }, UI_CONFIG.stageClearDisplayMs);
    });

    const unsub4 = engine.on<{ zone: ZoneConfig }>('zone_changed', event => {
      setZoneTransitionLabel(event.payload.zone.label);
      setShowZoneTransition(true);
      playSFX.levelUp();
      setTimeout(() => setShowZoneTransition(false), UI_CONFIG.zoneTransitionMs);
    });

    const unsub5 = engine.on('enemy_death', () => {
      playSFX.enemyDeath();
    });

    const unsub6 = engine.on('boss_spawn', () => {
      playSFX.bossSpawn();
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, [engine]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - (rect?.left ?? 0);
      y = e.touches[0].clientY - (rect?.top ?? 0);
    } else {
      x = e.clientX - (rect?.left ?? 0);
      y = e.clientY - (rect?.top ?? 0);
    }

    // Spawn ripple at tap position
    const rippleId = `r_${Date.now()}_${Math.random()}`;
    const currentZone = getZone(engine.state.stage ?? 1);
    setRipples(prev => [...prev.slice(-(UI_CONFIG.maxRipples - 1)), { id: rippleId, x, y, color: currentZone.accentColor }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rippleId)), UI_CONFIG.rippleEffectMs);

    const tapPlugin = engine.getPlugin<TapPlugin>('tap');
    tapPlugin?.tap(x, y);
  }, [engine]);

  const handleReturnToBoss = useCallback(() => {
    const enemyPlugin = engine.getPlugin<EnemyPlugin>('enemy');
    enemyPlugin?.returnToBoss();
  }, [engine]);

  const removeDamageNumber = useCallback((id: string) => {
    setDamageNumbers(prev => prev.filter(d => d.id !== id));
  }, []);

  const hpPct = enemy ? Math.max(0, (enemy.hp / enemy.maxHp) * 100) : 0;
  const isBoss = enemy?.isBoss ?? false;
  const currentPhase = phase ?? 1;
  const isBossPhase = currentPhase >= ENEMY_CONFIG.phasesPerStage;

  return (
    <div
      className="flex flex-col items-center justify-between"
      style={{ flex: 1, padding: '6px 10px 8px', position: 'relative', overflow: 'hidden', minHeight: 0 }}
    >
      {/* Zone background scene */}
      <ZoneScene
        zone={zone}
        showTransition={showZoneTransition}
        transitionLabel={zoneTransitionLabel}
        showStageClear={showStageClear}
        stageClearText={stageClearText}
        showBossWarning={isBossPhase && isBoss}
      />

      {/* Screen hit flash overlay */}
      {screenFlash && (
        <div
          className="animate-screen-flash"
          style={{
            position: 'absolute',
            inset: 0,
            background: zone.accentColor,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {/* Content above background — HP bar always at top */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: 320 }}>
        {enemy && (
          <div
            className="pixel-border"
            style={{
              background: isBoss ? '#1a0010' : '#0a0f1a',
              borderColor: isBoss ? '#ff0080' : zone.accentColor,
              padding: '5px 10px',
              marginBottom: 6,
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel" style={{ color: isBoss ? '#ff0080' : zone.accentColor, fontSize: '7px' }}>
                {isBoss ? 'BOSS HP' : 'HP'}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ color: isBoss ? '#ff0080' : zone.accentColor, fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                  {formatNumber(enemy.hp)} / {formatNumber(enemy.maxHp)}
                </span>
                {isBoss && <BossTimer engine={engine} />}
              </div>
            </div>
            <div style={{ background: isBoss ? '#3d0024' : '#0a0a0f', height: 6, position: 'relative' }}>
              <div
                className="hp-bar-fill"
                style={{
                  position: 'absolute',
                  left: 0, top: 0, height: '100%',
                  width: `${hpPct}%`,
                  background: isBoss ? '#ff0080' : zone.accentColor,
                  boxShadow: `0 0 8px ${isBoss ? 'rgba(255,0,128,0.6)' : zone.accentColor + '99'}`,
                  transition: 'width 0.15s ease-out',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stage & Phase indicator */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: zone.accentColor,
          opacity: 0.5,
          letterSpacing: 2,
        }}
      >
        {zone.name} // STG {stage ?? 1} - {currentPhase}/{ENEMY_CONFIG.phasesPerStage}
      </div>

      {/* Enemy name */}
      {enemy && (
        <div
          className="font-pixel text-center"
          style={{
            position: 'relative',
            zIndex: 3,
            color: isBoss ? '#ff0080' : zone.accentColor,
            fontSize: isBoss ? '9px' : '8px',
            letterSpacing: '2px',
            padding: '4px 0',
            textShadow: `0 0 8px ${isBoss ? '#ff0080' : zone.accentColor}, 0 0 16px ${isBoss ? 'rgba(255,0,128,0.4)' : zone.accentColor + '66'}`,
          }}
        >
          {enemy.name}
          {isBoss && (
            <span
              className="font-pixel"
              style={{ color: '#ff2222', fontSize: '7px', display: 'block', marginTop: 4, textShadow: '0 0 8px #ff2222' }}
            >
              {'[BOSS]'}
            </span>
          )}
        </div>
      )}

      {/* Tap zone */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center"
        style={{ flex: 1, width: '100%', cursor: 'crosshair', minHeight: 120, position: 'relative', zIndex: 3, userSelect: 'none' }}
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        {enemy && !isDying && (
          <EnemySprite enemy={enemy} isHit={isHit} isDying={false} zone={zone} overclockCount={overclockCount ?? 0} />
        )}
        {isDying && enemy && (
          <EnemySprite enemy={enemy} isHit={false} isDying={true} zone={zone} overclockCount={overclockCount ?? 0} />
        )}
        {!enemy && (
          <div className="font-pixel animate-blink" style={{ color: zone.accentColor, fontSize: '8px', opacity: 0.7 }}>
            LOADING...
          </div>
        )}

        {/* Tap ripples */}
        {ripples.map(r => (
          <div
            key={r.id}
            className="animate-tap-ripple"
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: 48,
              height: 48,
              marginLeft: -24,
              marginTop: -24,
              borderRadius: '50%',
              border: `2px solid ${r.color}`,
              boxShadow: `0 0 8px ${r.color}88`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Damage numbers */}
        {damageNumbers.map(d => (
          <DamageNumber key={d.id} event={d} onDone={removeDamageNumber} />
        ))}
      </div>

      {/* Boss Return Button */}
      {pendingBossReturn && pendingBossStage && (
        <div style={{ width: '100%', maxWidth: 320, position: 'relative', zIndex: 3, marginBottom: 4 }}>
          <button
            onClick={handleReturnToBoss}
            className="font-pixel animate-boss-return-pulse"
            style={{
              width: '100%',
              background: '#1a0000',
              border: '1px solid #ff2222',
              color: '#ff2222',
              padding: '8px 12px',
              fontSize: '7px',
              letterSpacing: '2px',
              cursor: 'pointer',
              textShadow: '0 0 8px #ff2222',
              boxShadow: '0 0 12px rgba(255,34,34,0.4)',
            }}
          >
            {'[!] RETURN TO BOSS — STG '}{pendingBossStage}{' [!]'}
          </button>
        </div>
      )}

      {/* Skill Bar */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%' }}>
        <SkillBar engine={engine} />
      </div>
    </div>
  );
};
