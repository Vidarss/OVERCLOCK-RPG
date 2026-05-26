import React from 'react';
import { X, Zap } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { OverclockPanel } from './OverclockPanel';
import { useGameState } from '../../hooks/useGameState';
import { calculateOverclockGain } from '../../plugins/OverclockPlugin';

interface OverclockScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

export const OverclockScreen: React.FC<OverclockScreenProps> = ({ engine, onClose }) => {
  const highestStage = useGameState(engine, s => s.highestStage ?? s.stage);
  const overclockTier = useGameState(engine, s => s.overclockTier ?? 0);
  const totalOverclocks = useGameState(engine, s => s.totalOverclocks ?? 0);
  const gain = calculateOverclockGain(highestStage, overclockTier);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.80)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Window */}
      <div
        style={{
          width: '100%', maxWidth: 560,
          height: 'min(92vh, 720px)',
          background: '#030008', border: '1px solid #1a0828',
          boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 40px rgba(255,0,128,0.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Corner chrome */}
        {['tl', 'tr', 'bl', 'br'].map(c => (
          <div key={c} style={{
            position: 'absolute', width: 14, height: 14, zIndex: 10, pointerEvents: 'none',
            top: c.startsWith('t') ? 0 : undefined, bottom: c.startsWith('b') ? 0 : undefined,
            left: c.endsWith('l') ? 0 : undefined, right: c.endsWith('r') ? 0 : undefined,
            borderTop: c.startsWith('t') ? `2px solid ${c === 'tl' || c === 'tr' ? '#ff008033' : 'transparent'}` : undefined,
            borderBottom: c.startsWith('b') ? `2px solid #ff00801a` : undefined,
            borderLeft: c.endsWith('l') ? `2px solid ${c === 'tl' ? '#ff008033' : '#ff00801a'}` : undefined,
            borderRight: c.endsWith('r') ? `2px solid ${c === 'tr' ? '#ff008033' : '#ff00801a'}` : undefined,
          }} />
        ))}

        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: '#050010', borderBottom: '1px solid #1a0828', flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <Zap size={12} color="#ff0080" />
            <div>
              <div className="font-pixel" style={{ color: '#ff0080', fontSize: '8px', letterSpacing: '3px' }}>
                OVERCLOCK TREE
              </div>
              <div style={{ color: '#3a2535', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                {totalOverclocks} REBOOTS · {gain > 0 ? `+${gain} OCT AVAILABLE` : 'REACH STG 10 TO REBOOT'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #1a1a2a', color: '#3a4a5a',
              width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }}>
          <OverclockPanel engine={engine} />
        </div>
      </div>
    </div>
  );
};
