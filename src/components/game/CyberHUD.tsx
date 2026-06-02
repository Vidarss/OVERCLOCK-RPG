import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Wifi, Settings, Music, Zap } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { getTotalIdleDps } from '../../plugins/ComponentPlugin';
import { formatNumber } from '../../utils/format';
import type { AuthPlugin } from '../../plugins/AuthPlugin';
import type { LeaderboardPlugin } from '../../plugins/LeaderboardPlugin';
import { audioManager } from '../../systems/AudioManager';

interface CyberHUDProps {
  engine: GameEngine;
  playerHandle: string;
}

export const CyberHUD: React.FC<CyberHUDProps> = ({ engine, playerHandle }) => {
  const stage = useGameState(engine, s => s.stage);
  const gold = useGameState(engine, s => s.gold);
  const diamonds = useGameState(engine, s => s.diamonds);
  const overclocks = useGameState(engine, s => s.overclockCount);
  const components = useGameState(engine, s => s.components);
  const idleDps = getTotalIdleDps(components) * engine.getModifier('idle_dps');
  const [confirming, setConfirming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const settingsRef = useRef<HTMLDivElement>(null);

  const lbPlugin = engine.getPlugin<LeaderboardPlugin>('leaderboard');
  const [onlineCount, setOnlineCount] = useState(lbPlugin?.getOnlineCount() ?? 0);
  const syncOnline = useCallback(() => {
    setOnlineCount(lbPlugin?.getOnlineCount() ?? 0);
  }, [lbPlugin]);
  useEffect(() => {
    if (!lbPlugin) return;
    syncOnline();
    return lbPlugin.subscribe(syncOnline);
  }, [lbPlugin, syncOnline]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  const handleLogout = () => {
    const authPlugin = engine.getPlugin<AuthPlugin>('auth');
    authPlugin?.signOut();
    setConfirming(false);
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    if (next) {
      audioManager.playBGM();
    } else {
      audioManager.stopBGM();
    }
  };

  const toggleSFX = () => {
    const next = !sfxOn;
    setSfxOn(next);
    audioManager.setEnabled(next);
  };

  return (
    <div
      style={{
        background: '#0d0d1a',
        borderBottom: '1px solid #1a2a3a',
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px 12px',
        minHeight: 38,
      }}
    >
      <div className="flex items-center gap-1">
        <span style={{ color: '#5a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>STG</span>
        <span className="font-pixel glow-cyan" style={{ color: '#00f5ff', fontSize: '10px' }}>{stage}</span>
      </div>

      <div className="flex items-center gap-1">
        <span style={{ color: '#5a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>DPS</span>
        <span className="font-pixel glow-green" style={{ color: '#39ff14', fontSize: '10px' }}>{formatNumber(idleDps)}</span>
      </div>

      <div className="flex items-center gap-1">
        <span style={{ color: '#ffaa00', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{'◆'}</span>
        <span className="font-pixel glow-amber" style={{ color: '#ffaa00', fontSize: '10px' }}>{formatNumber(gold)}</span>
      </div>

      <div className="flex items-center gap-1">
        <span style={{ color: '#00e5ff', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{'◈'}</span>
        <span className="font-pixel" style={{ color: '#00e5ff', fontSize: '10px' }}>{diamonds}</span>
      </div>

      <div className="flex items-center gap-1">
        <span style={{ color: '#5a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>OC</span>
        <span className="font-pixel glow-pink" style={{ color: '#ff0080', fontSize: '10px' }}>{overclocks}</span>
      </div>

      {onlineCount > 0 && (
        <div className="flex items-center gap-1">
          <Wifi size={9} color="#39ff14" />
          <span className="font-pixel" style={{ color: '#39ff14', fontSize: '8px' }}>{onlineCount}</span>
        </div>
      )}

      <div className="flex items-center gap-2" style={{ marginLeft: 'auto', position: 'relative' }}>
        <span
          style={{
            color: '#5a6a7a',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            maxWidth: 90,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {playerHandle}
        </span>

        {/* Settings button + popup */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{
              background: showSettings ? '#0a1a2a' : 'none',
              border: `1px solid ${showSettings ? '#00f5ff' : '#1a2a3a'}`,
              color: showSettings ? '#00f5ff' : '#3a4a5a',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Audio Settings"
          >
            <Settings size={14} />
          </button>

          {showSettings && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                zIndex: 200,
                background: '#0a0a0f',
                border: '1px solid #00f5ff',
                boxShadow: '0 0 16px rgba(0,245,255,0.25)',
                minWidth: 160,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {/* Header */}
              <div style={{ borderBottom: '1px solid #1a2a3a', paddingBottom: '6px', marginBottom: '2px' }}>
                <span className="font-pixel" style={{ color: '#00f5ff', fontSize: '8px', letterSpacing: '2px' }}>
                  AUDIO
                </span>
              </div>

              {/* Music toggle */}
              <AudioToggle
                icon={<Music size={11} />}
                label="MUSIC"
                active={musicOn}
                onToggle={toggleMusic}
              />

              {/* SFX toggle */}
              <AudioToggle
                icon={<Zap size={11} />}
                label="EFFECTS"
                active={sfxOn}
                onToggle={toggleSFX}
              />
            </div>
          )}
        </div>

        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleLogout}
              className="font-pixel"
              style={{
                background: '#3d0505',
                border: '1px solid #ff2222',
                color: '#ff2222',
                padding: '2px 6px',
                fontSize: '7px',
                cursor: 'pointer',
              }}
            >
              OK?
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="font-pixel"
              style={{
                background: 'transparent',
                border: '1px solid #1a2a3a',
                color: '#3a4a5a',
                padding: '2px 6px',
                fontSize: '7px',
                cursor: 'pointer',
              }}
            >
              NO
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="font-pixel"
            style={{
              background: 'transparent',
              border: '1px solid #1a2a3a',
              color: '#3a4a5a',
              padding: '2px 6px',
              fontSize: '7px',
              cursor: 'pointer',
            }}
          >
            EXIT
          </button>
        )}
      </div>
    </div>
  );
};

const AudioToggle: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}> = ({ icon, label, active, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      background: active ? '#0a1520' : '#050508',
      border: `1px solid ${active ? '#00f5ff44' : '#1a2a3a'}`,
      padding: '6px 8px',
      cursor: 'pointer',
      width: '100%',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: active ? '#00f5ff' : '#3a4a5a' }}>
      {icon}
      <span className="font-pixel" style={{ fontSize: '8px', color: active ? '#00f5ff' : '#3a4a5a' }}>
        {label}
      </span>
    </div>

    {/* Pill toggle */}
    <div
      style={{
        width: 22,
        height: 12,
        background: active ? '#00f5ff' : '#1a2a3a',
        borderRadius: 0,
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.1s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          background: active ? '#0a0a0f' : '#3a4a5a',
          top: 2,
          left: active ? 12 : 2,
          transition: 'left 0.1s',
        }}
      />
    </div>
  </button>
);
