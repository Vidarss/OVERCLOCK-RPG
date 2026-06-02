import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, X, Volume2, Zap } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import type { SettingsPlugin, SettingsState } from '../../plugins/SettingsPlugin';

interface SettingsScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ engine, onClose }) => {
  const settingsPlugin = engine.getPlugin<SettingsPlugin>('settings');
  const [settings, setSettings] = useState<SettingsState>(settingsPlugin?.getSettings() ?? {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    screenShake: true,
    particleEffects: true,
    autoSell: false,
  });

  useEffect(() => {
    if (!settingsPlugin) return;
    const unsub = settingsPlugin.subscribe(() => {
      setSettings(settingsPlugin.getSettings());
    });
    return unsub;
  }, [settingsPlugin]);

  const handleMusicVolume = (v: number) => {
    settingsPlugin?.setMusicVolume(v);
    setSettings(settingsPlugin?.getSettings() ?? settings);
  };

  const handleSFXVolume = (v: number) => {
    settingsPlugin?.setSFXVolume(v);
    setSettings(settingsPlugin?.getSettings() ?? settings);
  };

  const handleScreenShake = () => {
    settingsPlugin?.toggleScreenShake();
    setSettings(settingsPlugin?.getSettings() ?? settings);
  };

  const handleParticles = () => {
    settingsPlugin?.toggleParticleEffects();
    setSettings(settingsPlugin?.getSettings() ?? settings);
  };

  const handleAutoSell = () => {
    settingsPlugin?.toggleAutoSell();
    setSettings(settingsPlugin?.getSettings() ?? settings);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)' }}
      />
      
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 110,
          width: 'min(90vw, 380px)',
          background: '#0a0a0f',
          border: '2px solid #00f5ff',
          boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85dvh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            background: '#050010',
            borderBottom: '1px solid #00f5ff33',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={16} color="#00f5ff" />
            <span className="font-pixel" style={{ color: '#00f5ff', fontSize: '10px', letterSpacing: '2px' }}>
              SETTINGS
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #00f5ff33',
              color: '#00f5ff',
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#00f5ff';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(0, 245, 255, 0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#00f5ff33';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Music Volume */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Volume2 size={14} color="#00e5ff" />
              <span className="font-pixel" style={{ color: '#00e5ff', fontSize: '9px' }}>MUSIC VOL</span>
              <span style={{ color: '#5a7a9a', fontSize: '9px', marginLeft: 'auto' }}>
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(settings.musicVolume * 100)}
              onChange={e => handleMusicVolume(parseInt(e.target.value) / 100)}
              style={{
                width: '100%',
                accentColor: '#00e5ff',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={14} color="#ffaa00" />
              <span className="font-pixel" style={{ color: '#ffaa00', fontSize: '9px' }}>SFX VOL</span>
              <span style={{ color: '#5a7a9a', fontSize: '9px', marginLeft: 'auto' }}>
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(settings.sfxVolume * 100)}
              onChange={e => handleSFXVolume(parseInt(e.target.value) / 100)}
              style={{
                width: '100%',
                accentColor: '#ffaa00',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Toggles */}
          <div style={{ borderTop: '1px solid #1a2a3a', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ToggleOption
              label="SCREEN SHAKE"
              value={settings.screenShake}
              onChange={handleScreenShake}
            />
            <ToggleOption
              label="PARTICLES"
              value={settings.particleEffects}
              onChange={handleParticles}
            />
            <ToggleOption
              label="AUTO-SELL"
              value={settings.autoSell}
              onChange={handleAutoSell}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const ToggleOption: React.FC<{
  label: string;
  value: boolean;
  onChange: () => void;
}> = ({ label, value, onChange }) => (
  <button
    onClick={onChange}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#050508',
      border: `1px solid ${value ? '#00f5ff' : '#1a2a3a'}`,
      padding: '8px 12px',
      cursor: 'pointer',
      transition: 'all 0.1s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.borderColor = '#00f5ff';
      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(0, 245, 255, 0.2)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.borderColor = value ? '#00f5ff' : '#1a2a3a';
      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
    }}
  >
    <span className="font-pixel" style={{ color: value ? '#00f5ff' : '#3a4a5a', fontSize: '9px' }}>
      {label}
    </span>
    <span
      style={{
        display: 'inline-block',
        width: 20,
        height: 12,
        background: value ? '#00f5ff' : '#1a2a3a',
        border: `1px solid ${value ? '#00f5ff' : '#0a1a2a'}`,
        position: 'relative',
        transition: 'all 0.1s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          background: value ? '#0a0a0f' : '#3a4a5a',
          left: value ? '10px' : '2px',
          top: '2px',
          transition: 'all 0.1s',
        }}
      />
    </span>
  </button>
);
