import React, { useEffect, useState } from 'react';
import type { GameEngine } from '../../engine/Engine';
import type { Player } from '../../engine/types';
import { CyberHUD } from './CyberHUD';
import { Battlefield } from './Battlefield';
import { ComponentPanel } from './ComponentPanel';
import { MotherboardScreen } from './MotherboardScreen';
import { OverclockScreen } from './OverclockScreen';

interface GameScreenProps {
  engine: GameEngine;
  player: Player;
}

export const GameScreen: React.FC<GameScreenProps> = ({ engine, player }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null);
  const [showMotherboard, setShowMotherboard] = useState(false);
  const [showOverclock, setShowOverclock] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const unsub = engine.on<{ goldEarned: number }>('offline_progress', event => {
      const g = event.payload.goldEarned;
      const formatted = g >= 1000 ? `${(g / 1000).toFixed(1)}K` : g.toString();
      setOfflineMsg(`OFFLINE INCOME: +${formatted} GOLD`);
      setTimeout(() => setOfflineMsg(null), 5000);
    });
    return unsub;
  }, [engine]);

  if (isMobile) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh', background: '#0a0a0f' }}>
        {showMotherboard && <MotherboardScreen engine={engine} onClose={() => setShowMotherboard(false)} />}
        {showOverclock && <OverclockScreen engine={engine} onClose={() => setShowOverclock(false)} />}

        <CyberHUD engine={engine} playerHandle={player.handle} />

        {offlineMsg && (
          <div
            className="font-pixel text-center py-2 glow-green"
            style={{ background: '#0a1a02', color: '#39ff14', fontSize: '8px', borderBottom: '1px solid #27b00e' }}
          >
            {offlineMsg}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <Battlefield engine={engine} />
        </div>

        {/* Bottom panel: components with popup shortcuts */}
        <div
          className="pixel-border"
          style={{ background: '#0d0d1a', borderColor: '#1a2a3a', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}
        >
          <div style={{ height: '38vh', overflow: 'hidden' }}>
            <ComponentPanel
              engine={engine}
              onOpenMotherboard={() => setShowMotherboard(true)}
              onOpenOverclock={() => setShowOverclock(true)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#0a0a0f' }}>
      {showMotherboard && <MotherboardScreen engine={engine} onClose={() => setShowMotherboard(false)} />}
      {showOverclock && <OverclockScreen engine={engine} onClose={() => setShowOverclock(false)} />}

      <CyberHUD engine={engine} playerHandle={player.handle} />

      {offlineMsg && (
        <div
          className="font-pixel text-center py-2 glow-green"
          style={{ background: '#0a1a02', color: '#39ff14', fontSize: '8px', borderBottom: '1px solid #27b00e' }}
        >
          {offlineMsg}
        </div>
      )}

      <div className="flex" style={{ flex: 1, minHeight: 0 }}>
        {/* Left sidebar: Components + shortcut buttons */}
        <div
          className="pixel-border"
          style={{
            width: 260,
            background: '#0a0a0f',
            borderColor: '#1a2a3a',
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ComponentPanel
            engine={engine}
            onOpenMotherboard={() => setShowMotherboard(true)}
            onOpenOverclock={() => setShowOverclock(true)}
          />
        </div>

        {/* Center: Battlefield */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Battlefield engine={engine} />
        </div>
      </div>
    </div>
  );
};
