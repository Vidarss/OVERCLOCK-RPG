import React, { useEffect, useState } from 'react';
import type { GameEngine } from '../../engine/Engine';

interface BootScreenProps {
  engine: GameEngine;
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ engine, onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsub = engine.on<string>('boot_log', event => {
      setLines(prev => [...prev, event.payload]);
    });

    return unsub;
  }, [engine]);

  useEffect(() => {
    if (lines.some(l => l.includes('ALL SYSTEMS ONLINE') || l.includes('BOOT TIMEOUT'))) {
      setTimeout(() => {
        setDone(true);
        setTimeout(onComplete, 600);
      }, 400);
    }
  }, [lines, onComplete]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLines(prev => {
        if (prev.some(l => l.includes('ALL SYSTEMS ONLINE'))) return prev;
        return [...prev, '> BOOT TIMEOUT - ENTERING SAFE MODE...'];
      });
    }, 10_000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{
        backgroundImage: 'url(/overclock-character.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0a0a12',
        padding: '24px 24px 48px',
      }}
    >
      {/* Top: boot log with transparent background */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div
          className="pixel-border"
          style={{
            background: 'rgba(13, 13, 26, 0.7)',
            borderColor: 'rgba(0, 245, 255, 0.3)',
            padding: '20px',
            minHeight: 180,
            backdropFilter: 'blur(4px)',
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className="animate-boot-line"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: '1.8',
                color: line.includes('OK') ? '#39ff14' : line.includes('ERROR') ? '#ff2222' : line.includes('ALL SYSTEMS') ? '#00f5ff' : '#8a9aaa',
                overflow: 'hidden',
                textShadow: '0 0 8px currentColor',
              }}
            >
              {line}
            </div>
          ))}

          {!done && (
            <span className="animate-blink" style={{ color: '#00f5ff', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              _
            </span>
          )}

          {done && (
            <div className="font-pixel glow-green mt-2" style={{ color: '#39ff14', fontSize: '8px' }}>
              {'> ENTERING MATRIX...'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Loading button - transparent */}
      <div className="flex justify-center" style={{ width: '100%', maxWidth: 520 }}>
        <div
          className="font-pixel animate-blink"
          style={{
            color: '#00f5ff',
            background: 'transparent',
            border: '2px solid rgba(0, 245, 255, 0.5)',
            padding: '12px 32px',
            fontSize: '10px',
            letterSpacing: '4px',
            pointerEvents: 'none',
            textShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff',
            boxShadow: '0 0 15px rgba(0, 245, 255, 0.3), inset 0 0 15px rgba(0, 245, 255, 0.1)',
          }}
        >
          {done ? '> ENTERING MATRIX...' : '> LOADING'}
        </div>
      </div>
    </div>
  );
};
