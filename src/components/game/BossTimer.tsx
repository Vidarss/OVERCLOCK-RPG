import React from 'react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';

interface BossTimerProps {
  engine: GameEngine;
}

export const BossTimer: React.FC<BossTimerProps> = ({ engine }) => {
  const isBossActive = useGameState(engine, s => s.isBossActive);
  const bossTimeRemaining = useGameState(engine, s => s.bossTimeRemaining);

  if (!isBossActive) return null;

  const isLow = bossTimeRemaining < 10;

  return (
    <span
      className={`font-pixel ${isLow ? 'glow-red animate-blink' : 'glow-pink'}`}
      style={{ 
        color: isLow ? '#ff2222' : '#ff0080', 
        fontSize: '9px',
        letterSpacing: '1px',
      }}
    >
      {Math.ceil(bossTimeRemaining)}s
    </span>
  );
};
