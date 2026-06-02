import React, { useState, useMemo } from 'react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { getComponentBulkCost, getComponentDps, getComponentMilestoneBonus } from '../../plugins/ComponentPlugin';
import type { ComponentPlugin } from '../../plugins/ComponentPlugin';
import type { ComponentDef } from '../../engine/types';
import { Tooltip, TooltipLabel, TooltipText, TooltipStat } from './Tooltip';
import { COMPONENT_MILESTONE_CONFIG } from '../../config/game.config';
import { formatNumber } from '../../utils/format';
import { playSFX } from '../../hooks/useAudio';

type PurchaseMode = 1 | 10 | 100 | 'max';

interface ComponentPanelProps {
  engine: GameEngine;
}

// ── Component sprite images ───────────────────────────────────────────────────
// To add a new image: just add the component id as key and the path as value.
// If no image exists for a component, no background is shown.
const COMPONENT_IMAGES: Record<string, string> = {
  gpu: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/GPU_UNIT-sJO5wq8l4K9cS4KloxZdTlqDuths8Q.png',
  ram: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/RAM_BANK-QOIDpjY182AeKDcek01QQDSvshFwr7.png',
  cpu_cooler: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CPU_COOLER-UGZaX8srCEpBcFLvsRqmcQC1VLXTFH.png',
  ssd: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SSD_DRIVE-HPYK0BQTyoWccrbZYEPweSKpH7csfS.png',
  liquid_cool: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LIQUID_COOL-3CR3DyVuXTOpS2EglVp2cA6b7nOPRR.png',
  fpga: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/FPGA_ARRAY-O0dCGowXWAr6LDxFzLpjiBJW3BKDkn.png',
  tensor_core: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TENSOR_CORE-mqLwjKxlr06uT6uikbqEvLvAOUSi2K.png',
  darknet_node: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DARKNET_NODE-f9aphz4NIng0w1evOdR0HH4uEKiyg2.png',
  bytestorm_gen: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BYTESTORM_GEN-0gY2H8MqAoZjy2t0pLLgcud82ISpXT.png',
  singularity_engine: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SINGULARITY_ENGINE-EUfcLgZkQzSUwmYgJ72R5qgUTQ1orZ.png',
  exploit_kit: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/EXPLOIT_KIT-haEG45xoSfchRa7g0gERreppyqQZER.png',
  quantum_bit: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/QUANTUM_BIT-QmsMbZKEPlGiPBpXlNi1yix9Yhi5XM.png',
  psu: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PSU_CORE-RJq6qjCmVFthEjMclnuktbedGrnNxO.png',
};
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  cyan: { text: '#00f5ff', border: '#003d42', bg: '#0a1f22', glow: 'rgba(0,245,255,0.3)' },
  green: { text: '#39ff14', border: '#0a3d02', bg: '#0a1a02', glow: 'rgba(57,255,20,0.3)' },
  amber: { text: '#ffaa00', border: '#3d2800', bg: '#1a1000', glow: 'rgba(255,170,0,0.3)' },
  pink: { text: '#ff0080', border: '#3d0024', bg: '#1a0010', glow: 'rgba(255,0,128,0.3)' },
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
    <Tooltip position="right" content={tooltipContent}>
      <div
        key={levelUpKey > 0 ? `flash-${levelUpKey}` : comp.id}
        className={`pixel-border mb-2${levelUpKey > 0 ? ' animate-level-up-flash' : ''}`}
        style={{
          background: colors.bg,
          borderColor: colors.border,
          padding: '12px',
          boxShadow: `0 0 8px ${colors.glow}`,
          position: 'relative',
          overflow: 'visible',
          ['--luf-color' as string]: colors.text,
          transition: 'box-shadow 0.1s',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minHeight: 120,
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

      {/* Module Image — visible inside card */}
      {spriteImage && (
        <img
          src={spriteImage}
          alt={comp.name}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            height: '140%',
            width: 'auto',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            zIndex: 1,
            opacity: 0.9,
          }}
        />
      )}
      {!spriteImage && (
        <div
          className="font-pixel"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: colors.text,
            fontSize: '24px',
            opacity: 0.5,
            zIndex: 1,
          }}
        >
          {comp.name.slice(0, 3)}
        </div>
      )}

      <button
        onClick={handleBuyClick}
        disabled={!canAfford}
        className="font-pixel pixel-border"
        style={{
          background: canAfford ? colors.bg : '#050508',
          borderColor: canAfford ? colors.text : '#1a2a3a',
          borderWidth: '2px',
          color: canAfford ? colors.text : '#2a3a4a',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          boxShadow: canAfford ? `0 0 16px ${colors.glow}, 0 0 24px ${colors.glow}` : 'none',
          whiteSpace: 'nowrap',
          transition: 'transform 0.1s ease-out',
          textAlign: 'center',
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 20,
          textShadow: canAfford ? `0 0 8px ${colors.text}` : 'none',
        }}
        onMouseDown={e => { if (canAfford) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {purchaseMode === 'max' ? (
          maxQty > 0 ? <>x{maxQty}</> : <>MAX</>
        ) : (
          <>x{qty}</>
        )}
      </button>
    </div>
    </Tooltip>
  );
};

export const ComponentPanel: React.FC<ComponentPanelProps> = ({ engine }) => {
  const components = useGameState(engine, s => s.components);
  const gold = useGameState(engine, s => s.gold);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(1);

  const plugin = engine.getPlugin<ComponentPlugin>('component');

  const handleBuy = (id: string, qty: number): boolean => {
    if (qty <= 0) return false;
    const success = plugin?.purchaseBulk(id, qty) ?? false;
    if (success) {
      playSFX.purchase();
    } else {
      playSFX.error();
    }
    return success;
  };

  const unlockedComponents = Object.values(components).filter(c => c.unlocked);

  const MODES: { label: string; value: PurchaseMode }[] = [
    { label: 'x1', value: 1 },
    { label: 'x10', value: 10 },
    { label: 'x100', value: 100 },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>

      {/* Header + purchase mode selector */}
      <div style={{ flexShrink: 0, padding: '8px 8px 0' }}>
        <div style={{ borderBottom: '1px solid #1a2a3a', paddingBottom: 8, marginBottom: 0 }}>
          <div
            className="font-pixel mb-2"
            style={{ color: '#5a6a7a', fontSize: '7px', letterSpacing: '2px' }}
          >
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

      {/* Scrollable components list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 8px' }}>
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
