import React, { useState, useMemo } from 'react';
import { X, Search, Zap, Shield, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { formatNumber } from '../../utils/format';

// ═══════════════════════════════════════════════════════════════════════════════
// RELICS SYSTEM - Permanent unlockables purchased with OC Points from Prestige
// ═══════════════════════════════════════════════════════════════════════════════

export type RelicType = 'PASSIVE' | 'EQUIPPABLE';

export interface RelicDef {
  id: string;
  name: string;
  type: RelicType;
  icon: string;
  effect: string;
  effectValue: number;
  modifierType: 'tap_damage' | 'idle_dps' | 'gold_rate' | 'crit_chance' | 'crit_multiplier' | 'oc_points' | 'prestige_mult';
  cost: number;
  tier: number; // 1-5, higher = rarer/stronger
  flavor?: string;
}

// ── RELIC DEFINITIONS ─────────────────────────────────────────────────────────
export const RELICS: RelicDef[] = [
  // ═══ TIER 1 - COMMON (Cost: 500-1500) ═══════════════════════════════════════
  { id: 'circuit_shard', name: 'CIRCUIT SHARD', type: 'PASSIVE', icon: '⚡', effect: '+10% Tap Damage', effectValue: 0.10, modifierType: 'tap_damage', cost: 500, tier: 1, flavor: 'Fragment of pure processing power.' },
  { id: 'data_crystal', name: 'DATA CRYSTAL', type: 'PASSIVE', icon: '💎', effect: '+8% Gold Rate', effectValue: 0.08, modifierType: 'gold_rate', cost: 600, tier: 1, flavor: 'Crystallized market data.' },
  { id: 'thermal_core', name: 'THERMAL CORE', type: 'PASSIVE', icon: '🔥', effect: '+12% Idle DPS', effectValue: 0.12, modifierType: 'idle_dps', cost: 700, tier: 1, flavor: 'Harvested from a dying server.' },
  { id: 'signal_booster', name: 'SIGNAL BOOSTER', type: 'EQUIPPABLE', icon: '📡', effect: '+15% Tap Damage', effectValue: 0.15, modifierType: 'tap_damage', cost: 800, tier: 1, flavor: 'Amplifies neural interfaces.' },
  { id: 'cache_module', name: 'CACHE MODULE', type: 'EQUIPPABLE', icon: '💾', effect: '+12% Gold Rate', effectValue: 0.12, modifierType: 'gold_rate', cost: 900, tier: 1, flavor: 'Stores excess profit cycles.' },
  { id: 'flux_capacitor', name: 'FLUX CAPACITOR', type: 'PASSIVE', icon: '⚙️', effect: '+5% Crit Chance', effectValue: 0.05, modifierType: 'crit_chance', cost: 1000, tier: 1, flavor: 'Temporal probability enhancer.' },
  { id: 'nano_mesh', name: 'NANO MESH', type: 'EQUIPPABLE', icon: '🕸️', effect: '+18% Idle DPS', effectValue: 0.18, modifierType: 'idle_dps', cost: 1200, tier: 1, flavor: 'Self-replicating processor mesh.' },
  { id: 'voltage_cell', name: 'VOLTAGE CELL', type: 'PASSIVE', icon: '🔋', effect: '+8% Tap Damage', effectValue: 0.08, modifierType: 'tap_damage', cost: 1500, tier: 1, flavor: 'Perpetual energy source.' },

  // ═══ TIER 2 - UNCOMMON (Cost: 2000-4000) ════════════════════════════════════
  { id: 'quantum_chip', name: 'QUANTUM CHIP', type: 'PASSIVE', icon: '🔮', effect: '+20% Tap Damage', effectValue: 0.20, modifierType: 'tap_damage', cost: 2000, tier: 2, flavor: 'Exists in superposition until observed.' },
  { id: 'crypto_engine', name: 'CRYPTO ENGINE', type: 'PASSIVE', icon: '🪙', effect: '+18% Gold Rate', effectValue: 0.18, modifierType: 'gold_rate', cost: 2200, tier: 2, flavor: 'Mines value from entropy.' },
  { id: 'neural_link', name: 'NEURAL LINK', type: 'EQUIPPABLE', icon: '🧠', effect: '+25% Tap Damage', effectValue: 0.25, modifierType: 'tap_damage', cost: 2500, tier: 2, flavor: 'Direct cortex-to-system interface.' },
  { id: 'ghost_protocol', name: 'GHOST PROTOCOL', type: 'PASSIVE', icon: '👻', effect: '+22% Idle DPS', effectValue: 0.22, modifierType: 'idle_dps', cost: 2800, tier: 2, flavor: 'Invisible background processes.' },
  { id: 'entropy_seed', name: 'ENTROPY SEED', type: 'EQUIPPABLE', icon: '🌀', effect: '+10% Crit Chance', effectValue: 0.10, modifierType: 'crit_chance', cost: 3000, tier: 2, flavor: 'Chaos condensed to a point.' },
  { id: 'dark_matter_cell', name: 'DARK MATTER CELL', type: 'PASSIVE', icon: '⬛', effect: '+25% Idle DPS', effectValue: 0.25, modifierType: 'idle_dps', cost: 3200, tier: 2, flavor: 'Power from the void between.' },
  { id: 'profit_matrix', name: 'PROFIT MATRIX', type: 'EQUIPPABLE', icon: '📊', effect: '+22% Gold Rate', effectValue: 0.22, modifierType: 'gold_rate', cost: 3500, tier: 2, flavor: 'Optimizes every transaction.' },
  { id: 'plasma_coil', name: 'PLASMA COIL', type: 'PASSIVE', icon: '🌐', effect: '+15% Crit Damage', effectValue: 0.15, modifierType: 'crit_multiplier', cost: 4000, tier: 2, flavor: 'Superheated strike enhancer.' },

  // ═══ TIER 3 - RARE (Cost: 5000-10000) ═══════════════════════════════════════
  { id: 'singularity_core', name: 'SINGULARITY CORE', type: 'PASSIVE', icon: '🌑', effect: '+35% Tap Damage', effectValue: 0.35, modifierType: 'tap_damage', cost: 5000, tier: 3, flavor: 'Collapsed star in a chip.' },
  { id: 'market_oracle', name: 'MARKET ORACLE', type: 'EQUIPPABLE', icon: '🔮', effect: '+30% Gold Rate', effectValue: 0.30, modifierType: 'gold_rate', cost: 5500, tier: 3, flavor: 'Predicts profit with 99.9% accuracy.' },
  { id: 'void_processor', name: 'VOID PROCESSOR', type: 'PASSIVE', icon: '🕳️', effect: '+35% Idle DPS', effectValue: 0.35, modifierType: 'idle_dps', cost: 6000, tier: 3, flavor: 'Computes in dimensions beyond.' },
  { id: 'apex_catalyst', name: 'APEX CATALYST', type: 'EQUIPPABLE', icon: '⚗️', effect: '+15% Crit Chance', effectValue: 0.15, modifierType: 'crit_chance', cost: 6500, tier: 3, flavor: 'Accelerates critical reactions.' },
  { id: 'neural_amplifier', name: 'NEURAL AMPLIFIER', type: 'PASSIVE', icon: '📡', effect: '+40% Tap Damage', effectValue: 0.40, modifierType: 'tap_damage', cost: 7000, tier: 3, flavor: 'Enhances every neural impulse.' },
  { id: 'quantum_vault', name: 'QUANTUM VAULT', type: 'EQUIPPABLE', icon: '🏦', effect: '+35% Gold Rate', effectValue: 0.35, modifierType: 'gold_rate', cost: 7500, tier: 3, flavor: 'Stores wealth across timelines.' },
  { id: 'dark_engine', name: 'DARK ENGINE', type: 'PASSIVE', icon: '⚫', effect: '+40% Idle DPS', effectValue: 0.40, modifierType: 'idle_dps', cost: 8500, tier: 3, flavor: 'Runs on negative entropy.' },
  { id: 'critical_matrix', name: 'CRITICAL MATRIX', type: 'EQUIPPABLE', icon: '💠', effect: '+25% Crit Damage', effectValue: 0.25, modifierType: 'crit_multiplier', cost: 10000, tier: 3, flavor: 'Maximizes every hit.' },

  // ═══ TIER 4 - EPIC (Cost: 15000-30000) ══════════════════════════════════════
  { id: 'omega_chip', name: 'OMEGA CHIP', type: 'PASSIVE', icon: 'Ω', effect: '+50% Tap Damage', effectValue: 0.50, modifierType: 'tap_damage', cost: 15000, tier: 4, flavor: 'The final evolution of silicon.' },
  { id: 'profit_singularity', name: 'PROFIT SINGULARITY', type: 'EQUIPPABLE', icon: '💰', effect: '+45% Gold Rate', effectValue: 0.45, modifierType: 'gold_rate', cost: 18000, tier: 4, flavor: 'Infinite wealth generation.' },
  { id: 'phantom_core', name: 'PHANTOM CORE', type: 'PASSIVE', icon: '👁️', effect: '+50% Idle DPS', effectValue: 0.50, modifierType: 'idle_dps', cost: 20000, tier: 4, flavor: 'Processes from beyond reality.' },
  { id: 'entropy_heart', name: 'ENTROPY HEART', type: 'EQUIPPABLE', icon: '❤️‍🔥', effect: '+20% Crit Chance', effectValue: 0.20, modifierType: 'crit_chance', cost: 22000, tier: 4, flavor: 'Beats with chaotic rhythm.' },
  { id: 'apex_processor', name: 'APEX PROCESSOR', type: 'PASSIVE', icon: '🔺', effect: '+55% Tap Damage', effectValue: 0.55, modifierType: 'tap_damage', cost: 25000, tier: 4, flavor: 'Peak computational violence.' },
  { id: 'void_treasury', name: 'VOID TREASURY', type: 'EQUIPPABLE', icon: '🌌', effect: '+50% Gold Rate', effectValue: 0.50, modifierType: 'gold_rate', cost: 28000, tier: 4, flavor: 'Plunders the cosmic market.' },
  { id: 'prestige_amplifier', name: 'PRESTIGE AMPLIFIER', type: 'PASSIVE', icon: '✨', effect: '+15% OC Points from Prestige', effectValue: 0.15, modifierType: 'oc_points', cost: 30000, tier: 4, flavor: 'Multiplies rebirth rewards.' },

  // ═══ TIER 5 - LEGENDARY (Cost: 40000-100000) ════════════════════════════════
  { id: 'god_chip', name: 'GOD CHIP', type: 'EQUIPPABLE', icon: '👑', effect: '+75% Tap Damage', effectValue: 0.75, modifierType: 'tap_damage', cost: 40000, tier: 5, flavor: 'Divine processing power.' },
  { id: 'infinite_vault', name: 'INFINITE VAULT', type: 'PASSIVE', icon: '♾️', effect: '+65% Gold Rate', effectValue: 0.65, modifierType: 'gold_rate', cost: 50000, tier: 5, flavor: 'Wealth without limit.' },
  { id: 'eternal_engine', name: 'ETERNAL ENGINE', type: 'EQUIPPABLE', icon: '🌟', effect: '+75% Idle DPS', effectValue: 0.75, modifierType: 'idle_dps', cost: 60000, tier: 5, flavor: 'Runs until the heat death.' },
  { id: 'fate_breaker', name: 'FATE BREAKER', type: 'PASSIVE', icon: '⚔️', effect: '+25% Crit Chance', effectValue: 0.25, modifierType: 'crit_chance', cost: 70000, tier: 5, flavor: 'Destiny bends to your strikes.' },
  { id: 'critical_god', name: 'CRITICAL GOD', type: 'EQUIPPABLE', icon: '💥', effect: '+50% Crit Damage', effectValue: 0.50, modifierType: 'crit_multiplier', cost: 80000, tier: 5, flavor: 'Every hit is devastating.' },
  { id: 'prestige_omega', name: 'PRESTIGE OMEGA', type: 'PASSIVE', icon: '🌠', effect: '+25% OC Points from Prestige', effectValue: 0.25, modifierType: 'oc_points', cost: 100000, tier: 5, flavor: 'The ultimate rebirth catalyst.' },
];

const TIER_COLORS = {
  1: { border: '#4a5568', glow: '#4a556833', label: 'COMMON', labelBg: '#4a556866' },
  2: { border: '#38a169', glow: '#38a16933', label: 'UNCOMMON', labelBg: '#38a16966' },
  3: { border: '#3182ce', glow: '#3182ce44', label: 'RARE', labelBg: '#3182ce66' },
  4: { border: '#9f7aea', glow: '#9f7aea55', label: 'EPIC', labelBg: '#9f7aea66' },
  5: { border: '#f6ad55', glow: '#f6ad5566', label: 'LEGENDARY', labelBg: '#f6ad5566' },
};

const TYPE_COLORS = {
  PASSIVE: { color: '#39ff14', bg: '#39ff1422' },
  EQUIPPABLE: { color: '#cc44ff', bg: '#cc44ff22' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RELIC CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface RelicCardProps {
  relic: RelicDef;
  isUnlocked: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onUnlock: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}

const RelicCard: React.FC<RelicCardProps> = ({ relic, isUnlocked, isEquipped, canAfford, onUnlock, onEquip, onUnequip }) => {
  const tierStyle = TIER_COLORS[relic.tier as keyof typeof TIER_COLORS];
  const typeStyle = TYPE_COLORS[relic.type];

  return (
    <div
      style={{
        background: isUnlocked ? '#0a0a18' : '#050510',
        border: `1px solid ${isUnlocked ? tierStyle.border : '#1a1a2a'}`,
        boxShadow: isUnlocked ? `0 0 20px ${tierStyle.glow}, inset 0 0 30px rgba(0,0,0,0.5)` : 'none',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        opacity: isUnlocked || canAfford ? 1 : 0.6,
      }}
      className="hover:scale-[1.02]"
    >
      {/* Scanline effect */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.02) 2px, rgba(0,255,255,0.02) 4px)',
      }} />

      {/* Corner accents */}
      {isUnlocked && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: `2px solid ${tierStyle.border}`, borderLeft: `2px solid ${tierStyle.border}` }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: `2px solid ${tierStyle.border}`, borderRight: `2px solid ${tierStyle.border}` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 8, height: 8, borderBottom: `2px solid ${tierStyle.border}`, borderLeft: `2px solid ${tierStyle.border}` }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottom: `2px solid ${tierStyle.border}`, borderRight: `2px solid ${tierStyle.border}` }} />
        </>
      )}

      {/* Header: Icon + Name */}
      <div className="flex items-center gap-2">
        <div style={{
          width: 32, height: 32,
          background: `linear-gradient(135deg, ${tierStyle.border}22, transparent)`,
          border: `1px solid ${tierStyle.border}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          boxShadow: isUnlocked ? `0 0 10px ${tierStyle.glow}` : 'none',
        }}>
          {relic.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isUnlocked ? tierStyle.border : '#666', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {relic.name}
          </div>
          <div style={{
            display: 'inline-block',
            padding: '1px 6px',
            background: typeStyle.bg,
            color: typeStyle.color,
            fontSize: '8px',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}>
            {relic.type}
          </div>
        </div>
      </div>

      {/* Effect */}
      <div style={{ color: '#00f5ff', fontSize: '11px', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
        {relic.effect}
      </div>

      {/* Flavor text */}
      {relic.flavor && (
        <div style={{ color: '#3a4a5a', fontSize: '9px', fontStyle: 'italic', lineHeight: 1.3 }}>
          {relic.flavor}
        </div>
      )}

      {/* Cost / Action */}
      <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #1a1a2a' }}>
        {!isUnlocked ? (
          <>
            <div style={{ color: '#666', fontSize: '9px', marginBottom: '4px' }}>
              Cost: <span style={{ color: canAfford ? '#00f5ff' : '#ff4444' }}>{formatNumber(relic.cost)} OC</span>
            </div>
            <button
              onClick={onUnlock}
              disabled={!canAfford}
              style={{
                width: '100%',
                padding: '6px 12px',
                background: canAfford ? 'linear-gradient(180deg, #00f5ff22, #00f5ff11)' : '#1a1a2a',
                border: `1px solid ${canAfford ? '#00f5ff' : '#333'}`,
                color: canAfford ? '#00f5ff' : '#444',
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                boxShadow: canAfford ? '0 0 15px rgba(0,245,255,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              UNLOCK
            </button>
          </>
        ) : relic.type === 'EQUIPPABLE' ? (
          <button
            onClick={isEquipped ? onUnequip : onEquip}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: isEquipped ? 'linear-gradient(180deg, #cc44ff22, #cc44ff11)' : '#1a1a2a',
              border: `1px solid ${isEquipped ? '#cc44ff' : '#39ff14'}`,
              color: isEquipped ? '#cc44ff' : '#39ff14',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isEquipped ? 'UNEQUIP' : 'EQUIP'}
          </button>
        ) : (
          <div style={{
            width: '100%',
            padding: '6px 12px',
            background: '#39ff1411',
            border: '1px solid #39ff1433',
            color: '#39ff14',
            fontSize: '10px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textAlign: 'center',
          }}>
            ACTIVE
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EQUIP SLOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface EquipSlotProps {
  relic: RelicDef | null;
  slotIndex: number;
  onUnequip: () => void;
}

const EquipSlot: React.FC<EquipSlotProps> = ({ relic, slotIndex, onUnequip }) => {
  const tierStyle = relic ? TIER_COLORS[relic.tier as keyof typeof TIER_COLORS] : null;

  return (
    <div
      onClick={relic ? onUnequip : undefined}
      style={{
        width: '100%',
        aspectRatio: '1',
        background: relic ? '#0a0a18' : '#050510',
        border: relic ? `2px solid ${tierStyle?.border}` : '2px dashed #2a2a3a',
        boxShadow: relic ? `0 0 15px ${tierStyle?.glow}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: relic ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      className={relic ? 'hover:scale-105' : ''}
    >
      {relic ? (
        <>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{relic.icon}</div>
          <div style={{ color: tierStyle?.border, fontSize: '8px', fontWeight: 'bold', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {relic.name.split(' ')[0]}
          </div>
        </>
      ) : (
        <>
          <div style={{ color: '#2a2a3a', fontSize: '20px' }}>+</div>
          <div style={{ color: '#2a2a3a', fontSize: '8px' }}>SLOT {slotIndex + 1}</div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RELICS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

interface RelicsScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

export const RelicsScreen: React.FC<RelicsScreenProps> = ({ engine, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormula, setShowFormula] = useState(false);

  // Game state
  const ocPoints = useGameState(engine, s => s.overclockCount ?? 0);
  const unlockedRelics = useGameState(engine, s => (s as any).unlockedRelics ?? []) as string[];
  const equippedRelics = useGameState(engine, s => (s as any).equippedRelics ?? []) as string[];
  const highestStage = useGameState(engine, s => s.highestStage ?? s.stage);
  const totalHardwareLevels = useGameState(engine, s => {
    const levels = s.componentLevels ?? {};
    return Object.values(levels).reduce((sum: number, lvl) => sum + (lvl as number), 0);
  });
  const lifetimeGold = useGameState(engine, s => (s as any).lifetimeGold ?? s.gold ?? 0);

  const MAX_EQUIP_SLOTS = 8;

  // Filter relics
  const filteredRelics = useMemo(() => {
    if (!searchQuery.trim()) return RELICS;
    const q = searchQuery.toLowerCase();
    return RELICS.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.effect.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Calculate spent OC
  const spentOC = useMemo(() => {
    return RELICS.filter(r => unlockedRelics.includes(r.id)).reduce((sum, r) => sum + r.cost, 0);
  }, [unlockedRelics]);

  const availableOC = ocPoints - spentOC;

  // Equipped bonuses
  const equippedBonuses = useMemo(() => {
    const bonuses: Record<string, number> = {
      tap_damage: 0,
      idle_dps: 0,
      gold_rate: 0,
      crit_chance: 0,
      crit_multiplier: 0,
      oc_points: 0,
    };

    // Add passive relic bonuses (always active if unlocked)
    RELICS.filter(r => r.type === 'PASSIVE' && unlockedRelics.includes(r.id)).forEach(r => {
      bonuses[r.modifierType] = (bonuses[r.modifierType] ?? 0) + r.effectValue;
    });

    // Add equipped relic bonuses
    equippedRelics.forEach(id => {
      const relic = RELICS.find(r => r.id === id);
      if (relic) {
        bonuses[relic.modifierType] = (bonuses[relic.modifierType] ?? 0) + relic.effectValue;
      }
    });

    return bonuses;
  }, [unlockedRelics, equippedRelics]);

  // Handlers
  const handleUnlock = (relicId: string) => {
    const relic = RELICS.find(r => r.id === relicId);
    if (!relic || availableOC < relic.cost) return;

    engine.updateState({
      unlockedRelics: [...unlockedRelics, relicId],
    } as any);
  };

  const handleEquip = (relicId: string) => {
    if (equippedRelics.length >= MAX_EQUIP_SLOTS) return;
    if (equippedRelics.includes(relicId)) return;

    engine.updateState({
      equippedRelics: [...equippedRelics, relicId],
    } as any);
  };

  const handleUnequip = (relicId: string) => {
    engine.updateState({
      equippedRelics: equippedRelics.filter(id => id !== relicId),
    } as any);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.90)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 1000,
          height: 'min(95vh, 800px)',
          background: '#030008',
          border: '1px solid #1a0828',
          boxShadow: '0 0 100px rgba(0,0,0,0.95), 0 0 60px rgba(0,245,255,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: '#050010', borderBottom: '1px solid #1a0828', flexShrink: 0 }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={20} color="#00f5ff" style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.6))' }} />
            <div>
              <div className="font-pixel" style={{ color: '#00f5ff', fontSize: '14px', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
                RELICS
              </div>
              <div style={{ color: '#3a4a5a', fontSize: '10px', letterSpacing: '1px' }}>
                PERMANENT UPGRADES
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* OC Points display */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#00f5ff', fontSize: '18px', fontWeight: 'bold', textShadow: '0 0 15px rgba(0,245,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                OC POINTS: {formatNumber(availableOC)}
              </div>
              <div style={{ color: '#3a4a5a', fontSize: '9px' }}>
                Earned from Prestige • Total: {formatNumber(ocPoints)}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid #1a1a2a', color: '#3a4a5a',
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: Relic Grid (70%) */}
          <div style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a0828' }}>
            {/* Grid header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1a0828', flexShrink: 0 }}>
              <div>
                <span style={{ color: '#00f5ff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px' }}>UNLOCK RELICS</span>
                <span style={{ color: '#3a4a5a', fontSize: '10px', marginLeft: '12px' }}>
                  Unlocked: {unlockedRelics.length} / {RELICS.length}
                </span>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#3a4a5a' }} />
                <input
                  type="text"
                  placeholder="Search relics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: '#0a0a18',
                    border: '1px solid #1a1a2a',
                    color: '#aaa',
                    padding: '6px 12px 6px 30px',
                    fontSize: '11px',
                    width: 180,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Relic grid */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}>
                {filteredRelics.map(relic => (
                  <RelicCard
                    key={relic.id}
                    relic={relic}
                    isUnlocked={unlockedRelics.includes(relic.id)}
                    isEquipped={equippedRelics.includes(relic.id)}
                    canAfford={availableOC >= relic.cost}
                    onUnlock={() => handleUnlock(relic.id)}
                    onEquip={() => handleEquip(relic.id)}
                    onUnequip={() => handleUnequip(relic.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Equipped Relics (30%) */}
          <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', background: '#02000a' }}>
            {/* Equipped header */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1a0828', flexShrink: 0 }}>
              <span style={{ color: '#cc44ff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px' }}>EQUIPPED RELICS</span>
              <span style={{ color: '#3a4a5a', fontSize: '10px', marginLeft: '8px' }}>
                ({equippedRelics.length}/{MAX_EQUIP_SLOTS})
              </span>
            </div>

            {/* Equip slots grid */}
            <div style={{ padding: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}>
                {Array.from({ length: MAX_EQUIP_SLOTS }).map((_, i) => {
                  const relicId = equippedRelics[i];
                  const relic = relicId ? RELICS.find(r => r.id === relicId) ?? null : null;
                  return (
                    <EquipSlot
                      key={i}
                      relic={relic}
                      slotIndex={i}
                      onUnequip={() => relicId && handleUnequip(relicId)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Equipped bonuses */}
            <div style={{ padding: '0 16px 16px', flex: 1 }}>
              <div style={{
                background: '#0a0a18',
                border: '1px solid #1a1a2a',
                padding: '12px',
              }}>
                <div style={{ color: '#00f5ff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px', borderBottom: '1px solid #1a1a2a', paddingBottom: '8px' }}>
                  TOTAL BONUSES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
                  {equippedBonuses.tap_damage > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#666' }}>Tap Damage</span>
                      <span style={{ color: '#00f5ff' }}>+{Math.round(equippedBonuses.tap_damage * 100)}%</span>
                    </div>
                  )}
                  {equippedBonuses.idle_dps > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#666' }}>Idle DPS</span>
                      <span style={{ color: '#39ff14' }}>+{Math.round(equippedBonuses.idle_dps * 100)}%</span>
                    </div>
                  )}
                  {equippedBonuses.gold_rate > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#666' }}>Gold Rate</span>
                      <span style={{ color: '#ffaa00' }}>+{Math.round(equippedBonuses.gold_rate * 100)}%</span>
                    </div>
                  )}
                  {equippedBonuses.crit_chance > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#666' }}>Crit Chance</span>
                      <span style={{ color: '#ff4444' }}>+{Math.round(equippedBonuses.crit_chance * 100)}%</span>
                    </div>
                  )}
                  {equippedBonuses.crit_multiplier > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#666' }}>Crit Damage</span>
                      <span style={{ color: '#cc44ff' }}>+{Math.round(equippedBonuses.crit_multiplier * 100)}%</span>
                    </div>
                  )}
                  {equippedBonuses.oc_points > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#666' }}>OC Points</span>
                      <span style={{ color: '#f6ad55' }}>+{Math.round(equippedBonuses.oc_points * 100)}%</span>
                    </div>
                  )}
                  {Object.values(equippedBonuses).every(v => v === 0) && (
                    <div style={{ color: '#3a4a5a', textAlign: 'center', padding: '8px' }}>
                      No bonuses active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#050010', borderTop: '1px solid #1a0828', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ color: '#3a4a5a', fontSize: '9px', lineHeight: 1.5, marginBottom: '8px' }}>
            Unlock relics permanently using OC Points earned from Prestige.
            <span style={{ color: '#39ff14' }}> Passive</span> relics apply their bonus automatically.
            <span style={{ color: '#cc44ff' }}> Equippable</span> relics must be placed in slots to activate.
          </div>

          {/* Collapsible formula */}
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', color: '#00f5ff', fontSize: '10px', cursor: 'pointer', padding: 0 }}
          >
            <Info size={12} />
            <span style={{ letterSpacing: '1px' }}>HOW PRESTIGE WORKS</span>
            {showFormula ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showFormula && (
            <div style={{
              marginTop: '12px',
              background: '#0a0a18',
              border: '1px solid #1a1a2a',
              padding: '12px',
            }}>
              <div style={{ color: '#00f5ff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>
                PRESTIGE FORMULA
              </div>
              <div style={{ color: '#aaa', fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#050510', padding: '8px', border: '1px solid #1a1a2a' }}>
                OC Points = floor( (Highest Stage × 2.8) + (Total Hardware Levels × 0.9) + (Gold Earned / 800,000) )
              </div>
              <div style={{ color: '#3a4a5a', fontSize: '9px', marginTop: '8px' }}>
                Current values: Stage {highestStage} • Hardware Lvls {totalHardwareLevels} • Gold {formatNumber(lifetimeGold)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
