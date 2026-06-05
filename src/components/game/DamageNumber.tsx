import React, { useEffect, useState } from 'react';
import { DAMAGE_COLORS } from '../../theme';
import type { DamageNumberEvent } from '../../engine/types';
import { formatNumber } from '../../utils/format';

interface DamageNumberProps {
  event: DamageNumberEvent;
  onDone: (id: string) => void;
}

export const DamageNumber: React.FC<DamageNumberProps> = ({ event, onDone }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone(event.id);
    }, 900);
    return () => clearTimeout(t);
  }, [event.id, onDone]);

  if (!visible) return null;

  const isBlocked = event.type === 'blocked';
  const color = isBlocked ? '#ff4444' : DAMAGE_COLORS[event.type];
  const isCrit = event.type === 'crit';

  return (
    <div
      className="pointer-events-none absolute animate-float-up font-pixel select-none"
      style={{
        left: event.x ?? '50%',
        top: event.y ?? '50%',
        color,
        fontSize: isBlocked ? '8px' : isCrit ? '12px' : '8px',
        transform: 'translateX(-50%)',
        zIndex: 50,
        textShadow: `0 0 8px ${color}`,
        whiteSpace: 'nowrap',
      }}
    >
      {isBlocked && <span style={{ opacity: 0.8 }}>BLOCKED</span>}
      {isCrit && !isBlocked && <span style={{ fontSize: '7px', display: 'block', color: '#ffaa00' }}>CRIT!</span>}
      {!isBlocked && <>{event.type === 'idle' ? '' : ''}{formatNumber(event.value)}</>}
    </div>
  );
};
