import React, { useState, useMemo, useCallback } from 'react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { getComponentBulkCost, getComponentDps, getComponentMilestoneBonus } from '../../plugins/ComponentPlugin';
import type { ComponentPlugin } from '../../plugins/ComponentPlugin';
import type { ComponentDef } from '../../engine/types';
import { Tooltip, TooltipLabel, TooltipText, TooltipStat } from './Tooltip';
import { COMPONENT_MILESTONE_CONFIG } from '../../config/game.config';
import { formatNumber } from '../../utils/format';
import { playSFX } from '../../hooks/useAudio';
import { ChevronUp, Zap, TrendingUp, Lock } from 'lucide-react';

type PurchaseMode = 1 | 10 | 100 | 'max';

interface ComponentPanelProps {
  engine: GameEngine;
}

// Component sprite images
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

const COLOR_MAP = {
  cyan: { 
    text: '#00f5ff', 
    border: '#003d42', 
    bg: 'linear-gradient(135deg, #0a1f22 0%, #051518 100%)', 
    glow: 'rgba(0,245,255,0.4)',
    accent: '#00c8cc',
  },
  green: { 
    text: '#39ff14', 
    border: '#0a3d02', 
    bg: 'linear-gradient(135deg, #0a1a02 0%, #051205 100%)', 
    glow: 'rgba(57,255,20,0.4)',
    accent: '#2acc10',
  },
  amber: { 
    text: '#ffaa00', 
    border: '#3d2800', 
    bg: 'linear-gradient(135deg, #1a1000 0%, #120800 100%)', 
    glow: 'rgba(255,170,0,0.4)',
    accent: '#cc8800',
  },
  pink: { 
    text: '#ff0080', 
    border: '#3d0024', 
    bg: 'linear-gradient(135deg, #1a0010 0%, #120008 100%)', 
    glow: 'rgba(255,0,128,0.4)',
    accent: '#cc0066',
  },
};

interface ModuleCardProps {
  comp: ComponentDef;
  gold: number;
  purchaseMode: PurchaseMode;
  maxQty: number;
  onBuy: (qty: number) => boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  comp, 
  gold, 
  purchaseMode, 
  maxQty, 
  onBuy,
  isExpanded,
  onToggleExpand,
}) => {
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

  const spriteImage = COMPONENT_IMAGES[comp.id];

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (!comp.unlocked) return null;

  // Progress to next milestone
  const milestoneProgress = nextMilestone 
    ? ((comp.level % 25) / 25) * 100 
    : 100;

  return (
    <div
      key={levelUpKey > 0 ? `flash-${levelUpKey}` : comp.id}
      onClick={onToggleExpand}
      className={levelUpKey > 0 ? 'animate-level-up-flash' : ''}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        marginBottom: 6,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isExpanded ? `0 0 20px ${colors.glow}, inset 0 0 30px rgba(0,0,0,0.5)` : `0 0 8px ${colors.glow}`,
        ['--luf-color' as string]: colors.text,
      }}
    >
      {/* Animated scan line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${colors.text}44, transparent)`,
        animation: 'scanline 2s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Level up floating text */}
      {showLevelUpText && (
        <div
          className="animate-level-up-text font-pixel"
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            color: colors.text,
            fontSize: 9,
            textShadow: `0 0 10px ${colors.text}`,
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          +{levelUpQty} LEVEL
        </div>
      )}

      {/* Main compact view */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 12px',
        gap: 12,
      }}>
        {/* Module image/icon */}
        <div style={{
          width: 48,
          height: 48,
          background: `${colors.text}08`,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {spriteImage ? (
            <img
              src={spriteImage}
              alt={comp.name}
              style={{
                width: '130%',
                height: '130%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
              }}
            />
          ) : (
            <span className="font-pixel" style={{ color: colors.text, fontSize: 14, opacity: 0.6 }}>
              {comp.name.slice(0, 2)}
            </span>
          )}
        </div>

        {/* Info section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span className="font-pixel" style={{ color: colors.text, fontSize: 9 }}>
              {comp.name}
            </span>
            <span className="font-pixel" style={{ 
              color: colors.accent, 
              fontSize: 7,
              background: `${colors.text}15`,
              padding: '1px 4px',
            }}>
              LV.{comp.level}
            </span>
          </div>
          
          {/* DPS display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Zap size={9} color={colors.text} />
              <span style={{ color: colors.text, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }}>
                {formatNumber(dps)}/s
              </span>
            </div>
            {milestoneBonus > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp size={8} color="#ffaa00" />
                <span className="font-pixel" style={{ color: '#ffaa00', fontSize: 6 }}>
                  +{Math.round(milestoneBonus * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Milestone progress bar */}
          {nextMilestone && (
            <div style={{ marginTop: 4 }}>
              <div style={{ 
                height: 3, 
                background: '#0a0a12', 
                borderRadius: 1,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${milestoneProgress}%`,
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.text})`,
                  transition: 'width 0.2s',
                }} />
              </div>
              <span style={{ 
                color: '#3a4a5a', 
                fontFamily: 'var(--font-mono)', 
                fontSize: 7,
                marginTop: 2,
                display: 'block',
              }}>
                Next: Lv.{nextMilestone.level} (+{Math.round(nextMilestone.bonus * 100)}%)
              </span>
            </div>
          )}
        </div>

        {/* Buy button */}
        <button
          onClick={handleBuyClick}
          disabled={!canAfford}
          className="font-pixel"
          style={{
            background: canAfford ? `${colors.text}18` : '#060608',
            border: `1px solid ${canAfford ? colors.text : '#1a1a28'}`,
            color: canAfford ? colors.text : '#2a2a3a',
            padding: '8px 12px',
            fontSize: 8,
            cursor: canAfford ? 'pointer' : 'not-allowed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            minWidth: 60,
            transition: 'all 0.15s',
            boxShadow: canAfford ? `0 0 12px ${colors.glow}` : 'none',
          }}
        >
          <span style={{ fontSize: 10 }}>
            {purchaseMode === 'max' ? (maxQty > 0 ? `x${maxQty}` : 'MAX') : `x${qty}`}
          </span>
          <span style={{ 
            fontSize: 7, 
            color: canAfford ? '#ffcc00' : '#2a2a2a',
            opacity: canAfford ? 1 : 0.5,
          }}>
            {qty > 0 ? formatNumber(cost) : '--'}
          </span>
        </button>

        {/* Expand indicator */}
        <ChevronUp 
          size={12} 
          color="#3a3a4a" 
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} 
        />
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{
          borderTop: `1px solid ${colors.border}`,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <p style={{ 
            color: '#5a6a7a', 
            fontFamily: 'var(--font-mono)', 
            fontSize: 9, 
            margin: '0 0 8px 0',
            lineHeight: 1.4,
          }}>
            {comp.description}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#0a0a12', padding: '6px 8px', border: '1px solid #1a1a28' }}>
              <span style={{ color: '#4a5a6a', fontFamily: 'var(--font-mono)', fontSize: 7, display: 'block' }}>
                BASE DPS/LVL
              </span>
              <span className="font-pixel" style={{ color: colors.text, fontSize: 10 }}>
                {formatNumber(comp.baseDps)}
              </span>
            </div>
            <div style={{ background: '#0a0a12', padding: '6px 8px', border: '1px solid #1a1a28' }}>
              <span style={{ color: '#4a5a6a', fontFamily: 'var(--font-mono)', fontSize: 7, display: 'block' }}>
                TOTAL DPS
              </span>
              <span className="font-pixel" style={{ color: colors.text, fontSize: 10 }}>
                {formatNumber(dps)}/s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ComponentPanel: React.FC<ComponentPanelProps> = ({ engine }) => {
  const components = useGameState(engine, s => s.components);
  const gold = useGameState(engine, s => s.gold);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const plugin = engine.getPlugin<ComponentPlugin>('component');

  const handleBuy = useCallback((id: string, qty: number): boolean => {
    if (qty <= 0) return false;
    const success = plugin?.purchaseBulk(id, qty) ?? false;
    if (success) {
      playSFX.purchase();
    } else {
      playSFX.error();
    }
    return success;
  }, [plugin]);

  const unlockedComponents = useMemo(() => 
    Object.values(components).filter(c => c.unlocked),
    [components]
  );

  const totalDps = useMemo(() => 
    unlockedComponents.reduce((sum, c) => sum + getComponentDps(c), 0),
    [unlockedComponents]
  );

  const MODES: { label: string; value: PurchaseMode; color: string }[] = [
    { label: 'x1', value: 1, color: '#5a6a7a' },
    { label: 'x10', value: 10, color: '#00f5ff' },
    { label: 'x100', value: 100, color: '#39ff14' },
    { label: 'MAX', value: 'max', color: '#ffaa00' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050508' }}>
      {/* Header */}
      <div style={{ 
        flexShrink: 0, 
        padding: '12px',
        background: 'linear-gradient(180deg, #0a0a14 0%, #050508 100%)',
        borderBottom: '1px solid #1a1a28',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div className="font-pixel" style={{ color: '#5a6a7a', fontSize: 7, letterSpacing: '2px', marginBottom: 2 }}>
              {'> HARDWARE MODULES'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={12} color="#00f5ff" />
              <span className="font-pixel" style={{ color: '#00f5ff', fontSize: 12 }}>
                {formatNumber(totalDps)}/s
              </span>
              <span style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: 8 }}>
                TOTAL IDLE DPS
              </span>
            </div>
          </div>
          
          {/* Gold display */}
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #2a2a1a',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ color: '#ffcc00', fontSize: 10 }}>$</span>
            <span className="font-pixel" style={{ color: '#ffcc00', fontSize: 11 }}>
              {formatNumber(gold)}
            </span>
          </div>
        </div>

        {/* Purchase mode selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {MODES.map(m => {
            const active = purchaseMode === m.value;
            return (
              <button
                key={String(m.value)}
                onClick={() => setPurchaseMode(m.value)}
                className="font-pixel"
                style={{
                  flex: 1,
                  background: active ? `${m.color}15` : '#080810',
                  border: `1px solid ${active ? m.color : '#1a1a28'}`,
                  color: active ? m.color : '#3a3a4a',
                  padding: '6px 0',
                  fontSize: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: active ? `0 0 10px ${m.color}33` : 'none',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Module list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {unlockedComponents.length === 0 && (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 8,
          }}>
            <Lock size={24} color="#2a2a3a" />
            <span style={{ 
              color: '#3a3a4a', 
              fontFamily: 'var(--font-mono)', 
              fontSize: 10, 
              textAlign: 'center' 
            }}>
              Defeat enemies to unlock<br/>hardware modules
            </span>
          </div>
        )}

        {unlockedComponents.map(comp => (
          <ModuleCard
            key={comp.id}
            comp={comp}
            gold={gold}
            purchaseMode={purchaseMode}
            maxQty={plugin?.getMaxAffordable(comp.id) ?? 0}
            onBuy={qty => handleBuy(comp.id, qty)}
            isExpanded={expandedId === comp.id}
            onToggleExpand={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        flexShrink: 0,
        padding: '8px 12px',
        borderTop: '1px solid #1a1a28',
        background: '#06060c',
      }}>
        <span style={{ color: '#2a3a3a', fontFamily: 'var(--font-mono)', fontSize: 8 }}>
          Modules generate passive DPS. Reach milestone levels for bonus multipliers.
        </span>
      </div>
    </div>
  );
};
