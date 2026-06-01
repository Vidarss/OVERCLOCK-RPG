import React, { useState, useMemo } from 'react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { getComponentBulkCost, getComponentDps, getComponentMilestoneBonus } from '../../plugins/ComponentPlugin';
import type { ComponentPlugin } from '../../plugins/ComponentPlugin';
import type { ComponentDef } from '../../engine/types';
import { Tooltip, TooltipLabel, TooltipText, TooltipStat } from './Tooltip';
import { COMPONENT_MILESTONE_CONFIG } from '../../config/game.config';
import { formatNumber } from '../../utils/format';

type PurchaseMode = 1 | 10 | 100 | 'max';

interface ComponentPanelProps {
  engine: GameEngine;
}

const COMPONENT_IMAGES: Record<string, string> = {
  gpu: '/images/components/gpu_unit.png',
  ram: '/images/components/ram_bank.png',
  cpu_cooler: '/images/components/cpu_cooler.png',
  ssd: '/images/components/ssd_drive.png',
};

const COLOR_MAP = {
  cyan:  { text: '#00f5ff', border: '#003d42', bg: '#0a1f22', glow: 'rgba(0,245,255,0.3)' },
  green: { text: '#39ff14', border: '#0a3d02', bg: '#0a1a02', glow: 'rgba(57,255,20,0.3)' },
  amber: { text: '#ffaa00', border: '#3d2800', bg: '#1a1000', glow: 'rgba(255,170,0,0.3)' },
  pink:  { text: '#ff0080', border: '#3d0024', bg: '#1a0010', glow: 'rgba(255,0,128,0.3)' },
};

const ComponentCard: React.FC<{
  comp: ComponentDef;
  gold: number;
  purchaseMode: PurchaseMode;
  maxQty: number;
  onBuy: (qty: number) => boolean;
}> = ({ comp, gold, purchaseMode, maxQty, onBuy }) => {
  const colors = COLOR_MAP[comp.color];
  const dps = getComponentDps(comp);
  const milestoneBonus = getComponentMilestoneBonus(comp.level);
  const [levelUpKey, setLevelUpKey] = useState(0);
  const [levelUpQty, setLevelUpQty] = useState(0);
  const [showLevelUpText, setShowLevelUpText] = useState(false);

  const nextMilestone = useMemo(() =>
    COMPONENT_MILESTONE_CONFIG.customMilestones.find(m => m.level > comp.level),
    [comp.level]
  );

  const qty = purchaseMode === 'max' ? maxQty : purchaseMode;
  const cost = qty > 0 ? getComponentBulkCost(comp, qty) : 0;
  const canAfford = qty > 0 && gold >= cost;

  const tooltipContent = useMemo(() => (
    <>
      <TooltipLabel label={comp.name} color={colors.text} />
      <TooltipText>{comp.description}</TooltipText>
      <TooltipStat label="Level" value={`${comp.level}`} color={colors.text} />
      <TooltipStat label="DPS/lvl" value={`${formatNumber(comp.baseDps)}`} color="#5a7a8a" />
      <TooltipStat label="Total DPS" value={`${formatNumber(dps)}/s`} color={colors.text} />
      {milestoneBonus > 0 && (
        <TooltipStat label="Milestone Bonus" value={`+${Math.round(milestoneBonus * 100)}%`} color="#ffaa00" />
      )}
      {nextMilestone && (
        <TooltipStat label="Next Bonus" value={`Lv${nextMilestone.level} (+${Math.round(nextMilestone.bonus * 100)}%)`} color="#3a5a6a" />
      )}
      <TooltipStat label="Cost" value={qty > 0 ? `${formatNumber(cost)}` : '--'} color={canAfford ? '#ffcc00' : '#aa4444'} />
    </>
  ), [comp.name, comp.description, comp.level, comp.baseDps, colors.text, dps, milestoneBonus, nextMilestone, qty, cost, canAfford]);

  if (!comp.unlocked) return null;

  const spriteImage = COMPONENT_IMAGES[comp.id];

  const handleBuyClick = () => {
    if (!canAfford) return;
    const purchased = qty > 0 ? qty : 0;
    const success = onBuy(qty);
    if (success && purchased > 0) {
      setLevelUpQty(purchased);
      setLevelUpKey(k => k + 1);
      setShowLevelUpText(true);
      setTimeout(() => setShowLevelUpText(false), 650);
    }
  };

  return (
    <div className="mb-2">
      <Tooltip position="right" content={tooltipContent}>
        <div
          className={`pixel-border${levelUpKey > 0 ? ' animate-level-up-flash' : ''}`}
          style={{
            background: colors.bg,
            borderColor: colors.border,
            boxShadow: `0 0 8px ${colors.glow}`,
            position: 'relative',
            overflow: 'hidden',
            ['--luf-color' as string]: colors.text,
            transition: 'box-shadow 0.1s',
            height: 80,
            cursor: 'help',
          }}
        >
          {/* Level up floating text */}
          {showLevelUpText && (
            <div
              className="animate-level-up-text font-pixel"
              style={{
                position: 'absolute',
                top: 4,
                right: 8,
                color: colors.text,
                fontSize: '7px',
                textShadow: `0 0 8px ${colors.text}`,
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              +{levelUpQty} LVL
            </div>
          )}

          {/* Module sprite — left side, fills card height */}
          {spriteImage ? (
            <img
              src={spriteImage}
              alt={comp.name}
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                height: '160%',
                width: 'auto',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div
              className="font-pixel"
              style={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                color: colors.text,
                fontSize: '20px',
                opacity: 0.4,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              {comp.name.slice(0, 3)}
            </div>
          )}

          {/* Buy button — bottom right, always visible */}
          <button
            onClick={e => { e.stopPropagation(); handleBuyClick(); }}
            disabled={!canAfford}
            className="font-pixel pixel-border"
            style={{
              background: canAfford ? colors.bg : '#050508',
              borderColor: canAfford ? colors.text : '#1a2a3a',
              color: canAfford ? colors.text : '#2a3a4a',
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              boxShadow: canAfford ? `0 0 14px ${colors.glow}, inset 0 0 6px rgba(255,255,255,0.08)` : 'none',
              whiteSpace: 'nowrap',
              transition: 'transform 0.1s ease-out',
              lineHeight: 1.4,
              textAlign: 'center',
              position: 'absolute',
              bottom: 10,
              right: 10,
              zIndex: 20,
              textShadow: canAfford ? `0 0 8px ${colors.text}` : 'none',
              letterSpacing: '1px',
            }}
            onMouseDown={e => { if (canAfford) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.88)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            {purchaseMode === 'max' ? (maxQty > 0 ? `x${maxQty}` : 'MAX') : `x${qty}`}
          </button>
        </div>
      </Tooltip>
    </div>
  );
};

export const ComponentPanel: React.FC<ComponentPanelProps> = ({ engine }) => {
  const components = useGameState(engine, s => s.components);
  const gold = useGameState(engine, s => s.gold);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(1);

  const plugin = engine.getPlugin<ComponentPlugin>('component');

  const handleBuy = (id: string, qty: number): boolean => {
    if (qty <= 0) return false;
    return plugin?.purchaseBulk(id, qty) ?? false;
  };

  const unlockedComponents = Object.values(components).filter(c => c.unlocked);

  const MODES: { label: string; value: PurchaseMode }[] = [
    { label: 'x1', value: 1 },
    { label: 'x10', value: 10 },
    { label: 'x100', value: 100 },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
      <div style={{ flexShrink: 0, padding: '8px 8px 0' }}>
        <div style={{ borderBottom: '1px solid #1a2a3a', paddingBottom: 8, marginBottom: 0 }}>
          <div className="font-pixel mb-2" style={{ color: '#5a6a7a', fontSize: '7px', letterSpacing: '2px' }}>
            {'> HARDWARE MODULES'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 4 }}>
            {MODES.map(m => {
              const active = purchaseMode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setPurchaseMode(m.value)}
                  className="font-pixel"
                  style={{
                    background: active ? '#001a20' : '#080810',
                    border: `1px solid ${active ? '#00f5ff' : '#1a2a3a'}`,
                    color: active ? '#00f5ff' : '#3a4a5a',
                    padding: '5px 0',
                    fontSize: '7px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 0 8px rgba(0,245,255,0.2)' : 'none',
                    transition: 'all 0.1s',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPurchaseMode('max')}
            className="font-pixel w-full"
            style={{
              background: purchaseMode === 'max' ? '#130800' : '#080808',
              border: `1px solid ${purchaseMode === 'max' ? '#ffaa00' : '#1a1a2a'}`,
              color: purchaseMode === 'max' ? '#ffaa00' : '#3a3a4a',
              padding: '5px 0',
              fontSize: '7px',
              letterSpacing: '2px',
              cursor: 'pointer',
              boxShadow: purchaseMode === 'max' ? '0 0 8px rgba(255,170,0,0.2)' : 'none',
              transition: 'all 0.1s',
            }}
          >
            BUY MAX
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {unlockedComponents.length === 0 && (
          <div style={{ color: '#2a3a4a', fontFamily: 'var(--font-mono)', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
            Kill enemies to unlock components
          </div>
        )}
        {unlockedComponents.map(comp => {
          const maxQty = plugin?.getMaxAffordable(comp.id) ?? 0;
          return (
            <ComponentCard
              key={comp.id}
              comp={comp}
              gold={gold}
              purchaseMode={purchaseMode}
              maxQty={maxQty}
              onBuy={qty => handleBuy(comp.id, qty)}
            />
          );
        })}
      </div>
    </div>
  );
};
