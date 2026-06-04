import React, { useMemo, useState, useEffect } from 'react';
import type { Enemy } from '../../engine/types';
import type { ZoneConfig } from './ZoneScene';
import { getRandomEnemySprite, type EnemySpriteDef } from '../../config/assets.config';
import { isSpriteLoaded } from '../../hooks/useSpritePreloader';

interface EnemySpriteProps {
  enemy: Enemy;
  isHit: boolean;
  isDying: boolean;
  zone: ZoneConfig;
  overclockCount?: number;
}

// Pixel art grids per tier (B=body, A=accent, space=transparent)
const PIXEL_ARTS: string[][][] = [
  // Tier 0 — simple blob (PERIMETER)
  [
    [' ', 'B', 'B', 'B', ' '],
    ['B', 'A', 'B', 'A', 'B'],
    ['B', 'B', 'B', 'B', 'B'],
    [' ', 'B', 'A', 'B', ' '],
    [' ', 'B', 'B', 'B', ' '],
    ['B', ' ', ' ', ' ', 'B'],
  ],
  // Tier 1 — winged form (FIREWALL)
  [
    ['B', ' ', 'B', 'B', ' ', 'B'],
    ['B', 'B', 'A', 'B', 'A', 'B'],
    ['B', 'B', 'B', 'B', 'B', 'B'],
    [' ', 'B', 'A', 'A', 'B', ' '],
    [' ', 'B', 'B', 'B', 'B', ' '],
    ['B', ' ', 'B', 'B', ' ', 'B'],
  ],
  // Tier 2 — spider form (KERNEL)
  [
    ['B', ' ', 'B', 'B', 'B', ' ', 'B'],
    [' ', 'B', 'A', 'B', 'A', 'B', ' '],
    ['B', 'B', 'B', 'B', 'B', 'B', 'B'],
    ['B', 'B', 'B', 'B', 'B', 'B', 'B'],
    [' ', 'B', 'A', 'B', 'A', 'B', ' '],
    ['B', ' ', 'B', ' ', 'B', ' ', 'B'],
    [' ', 'B', ' ', ' ', ' ', 'B', ' '],
  ],
  // Tier 3 — tall serpent (CORE)
  [
    [' ', ' ', 'B', 'B', 'B', ' ', ' '],
    [' ', 'B', 'A', 'B', 'A', 'B', ' '],
    ['B', 'B', 'B', 'B', 'B', 'B', 'B'],
    [' ', 'B', 'B', 'B', 'B', 'B', ' '],
    [' ', ' ', 'B', 'A', 'B', ' ', ' '],
    [' ', 'B', 'B', 'B', 'B', 'B', ' '],
    [' ', 'B', ' ', ' ', ' ', 'B', ' '],
    ['B', ' ', ' ', ' ', ' ', ' ', 'B'],
  ],
  // Tier 4 — void entity (THE VOID)
  [
    ['B', ' ', 'B', 'B', 'B', ' ', 'B'],
    [' ', 'B', 'A', 'A', 'A', 'B', ' '],
    ['B', 'A', 'B', 'B', 'B', 'A', 'B'],
    ['B', 'B', 'B', 'B', 'B', 'B', 'B'],
    ['B', 'A', 'B', 'B', 'B', 'A', 'B'],
    [' ', 'B', 'A', 'A', 'A', 'B', ' '],
    ['B', ' ', 'B', 'B', 'B', ' ', 'B'],
    [' ', 'B', ' ', 'B', ' ', 'B', ' '],
  ],
];

const BOSS_PIXEL_ART: string[][] = [
  [' ', 'B', 'B', ' ', ' ', 'B', 'B', ' '],
  ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
  ['B', 'A', 'B', 'B', 'B', 'B', 'A', 'B'],
  ['B', 'B', 'A', 'B', 'B', 'A', 'B', 'B'],
  ['B', 'B', 'B', 'A', 'A', 'B', 'B', 'B'],
  [' ', 'B', 'A', 'B', 'B', 'A', 'B', ' '],
  [' ', 'B', 'B', 'B', 'B', 'B', 'B', ' '],
  ['B', ' ', 'B', ' ', ' ', 'B', ' ', 'B'],
  [' ', 'B', ' ', 'B', 'B', ' ', 'B', ' '],
];

function getSpriteColors(enemy: Enemy, zone: ZoneConfig) {
  if (enemy.isBoss) {
    return {
      body: '#ff0080',
      accent: '#b00058',
      glow: 'rgba(255,0,128,0.5)',
    };
  }
  if (enemy.isElite) {
    return {
      body: '#ffaa00',
      accent: '#ff6600',
      glow: 'rgba(255,170,0,0.5)',
    };
  }
  return {
    body: zone.accentColor,
    accent: zone.accentColor + 'aa',
    glow: zone.accentColor + '66',
  };
}

function getPhaseOverlay(phase: string | undefined): React.CSSProperties | null {
  if (!phase || phase === 'none') return null;
  switch (phase) {
    case 'shield': return { boxShadow: 'inset 0 0 20px rgba(0,200,255,0.4), 0 0 30px rgba(0,200,255,0.3)' };
    case 'enrage': return { boxShadow: 'inset 0 0 20px rgba(255,50,0,0.5), 0 0 30px rgba(255,50,0,0.3)' };
    case 'regen': return { boxShadow: 'inset 0 0 20px rgba(57,255,20,0.4), 0 0 30px rgba(57,255,20,0.3)' };
    default: return null;
  }
}

export const EnemySprite: React.FC<EnemySpriteProps> = ({ enemy, isHit, isDying, zone, overclockCount = 0 }) => {
  const tier = Math.min(enemy.tier ?? 0, PIXEL_ARTS.length - 1);
  const pixels = enemy.isBoss ? BOSS_PIXEL_ART : PIXEL_ARTS[tier];
  const pixelSize = enemy.isBoss ? 12 : enemy.isElite ? 11 : 10;
  const colors = getSpriteColors(enemy, zone);
  const phaseStyle = getPhaseOverlay(enemy.bossPhase);

  // Try to get a custom sprite image for this enemy by name
  const customSprite: EnemySpriteDef | null = useMemo(() => {
    return getRandomEnemySprite(
      enemy.tier ?? 0, 
      enemy.isBoss, 
      enemy.isElite ?? false,
      enemy.name,
      overclockCount
    );
  }, [enemy.tier, enemy.isBoss, enemy.isElite, enemy.name, overclockCount]);

  // Track image loading state
  const [imageLoaded, setImageLoaded] = useState(() => 
    customSprite ? isSpriteLoaded(customSprite.src) : false
  );

  // Preload image when sprite changes
  useEffect(() => {
    if (!customSprite) return;
    
    // Check if already loaded
    if (isSpriteLoaded(customSprite.src)) {
      setImageLoaded(true);
      return;
    }

    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageLoaded(true);
    img.src = customSprite.src;
  }, [customSprite?.src]);

  // If we have a custom sprite, render it as an image
  if (customSprite) {
    const scale = customSprite.scale ?? 1;
    const offsetY = customSprite.offsetY ?? 0;
    // Increased base size for better visibility - bosses are larger
    const baseSize = enemy.isBoss ? 220 : enemy.isElite ? 180 : 160;
    const spriteSize = baseSize * scale;
    
    return (
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: spriteSize }}>
        {/* Phase overlay aura */}
        {phaseStyle && (
          <div
            style={{
              position: 'absolute', inset: -8, borderRadius: 4, pointerEvents: 'none',
              ...phaseStyle,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* Elite indicator */}
        {enemy.isElite && (
          <div
            className="font-pixel"
            style={{
              position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
              color: '#ffaa00', fontSize: '8px', letterSpacing: '2px', whiteSpace: 'nowrap',
              textShadow: '0 0 6px #ffaa00',
            }}
          >
            ELITE
          </div>
        )}

        {/* Boss phase label */}
        {enemy.bossPhase && enemy.bossPhase !== 'none' && (
          <div
            className="font-pixel"
            style={{
              position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
              color: enemy.bossPhase === 'shield' ? '#00c8ff' : enemy.bossPhase === 'enrage' ? '#ff3200' : '#39ff14',
              fontSize: '8px', letterSpacing: '2px', whiteSpace: 'nowrap',
              textShadow: `0 0 6px currentColor`,
            }}
          >
            {enemy.bossPhase.toUpperCase()}
          </div>
        )}

        <div
          className={isDying ? 'animate-enemy-death' : isHit ? 'animate-enemy-hit' : ''}
          style={{
            filter: enemy.isBoss
              ? `drop-shadow(0 0 20px ${colors.glow}) drop-shadow(0 0 40px ${colors.glow})`
              : enemy.isElite
              ? `drop-shadow(0 0 16px #ffaa0088) drop-shadow(0 0 32px #ffaa0066)`
              : `drop-shadow(0 0 12px ${colors.glow})`,
            animation: enemy.isBoss && !isHit && !isDying ? 'boss-pulse 2s steps(4) infinite' : undefined,
            transform: `translateY(${offsetY}px)`,
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.15s ease-out',
          }}
        >
          <img
            src={customSprite.src}
            alt={enemy.name}
            style={{
              width: `${spriteSize}px`,
              height: `${spriteSize}px`,
              objectFit: 'contain',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Loading placeholder - shows while image loads */}
        {!imageLoaded && (
          <div
            style={{
              position: 'absolute',
              width: `${spriteSize}px`,
              height: `${spriteSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: `${spriteSize * 0.4}px`,
                height: `${spriteSize * 0.4}px`,
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: 'pulse 0.8s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Fallback to pixel-art rendering

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Phase overlay aura */}
      {phaseStyle && (
        <div
          style={{
            position: 'absolute', inset: -8, borderRadius: 4, pointerEvents: 'none',
            ...phaseStyle,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Elite indicator */}
      {enemy.isElite && (
        <div
          className="font-pixel"
          style={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            color: '#ffaa00', fontSize: '6px', letterSpacing: '1px', whiteSpace: 'nowrap',
            textShadow: '0 0 4px #ffaa00',
          }}
        >
          ELITE
        </div>
      )}

      {/* Boss phase label */}
      {enemy.bossPhase && enemy.bossPhase !== 'none' && (
        <div
          className="font-pixel"
          style={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            color: enemy.bossPhase === 'shield' ? '#00c8ff' : enemy.bossPhase === 'enrage' ? '#ff3200' : '#39ff14',
            fontSize: '6px', letterSpacing: '1px', whiteSpace: 'nowrap',
            textShadow: `0 0 4px currentColor`,
          }}
        >
          {enemy.bossPhase.toUpperCase()}
        </div>
      )}

      <div
        className={isDying ? 'animate-enemy-death' : isHit ? 'animate-enemy-hit' : ''}
        style={{
          display: 'inline-block',
          filter: enemy.isBoss
            ? `drop-shadow(0 0 16px ${colors.glow}) drop-shadow(0 0 32px ${colors.glow})`
            : `drop-shadow(0 0 10px ${colors.glow}) drop-shadow(0 0 20px ${colors.glow})`,
          imageRendering: 'pixelated',
          animation: enemy.isBoss && !isHit && !isDying ? 'boss-pulse 2s steps(4) infinite' : undefined,
        }}
      >
        {pixels.map((row, ri) => (
          <div key={ri} style={{ display: 'flex' }}>
            {row.map((cell, ci) => (
              <div
                key={ci}
                style={{
                  width: pixelSize,
                  height: pixelSize,
                  background:
                    cell === 'B' ? colors.body :
                    cell === 'A' ? colors.accent :
                    'transparent',
                  imageRendering: 'pixelated',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
