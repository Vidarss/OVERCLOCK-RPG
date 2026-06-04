import React, { useState, useEffect, useCallback } from 'react';
import { X, Cpu, MemoryStick, Zap, PlusSquare, CircuitBoard, ArrowUpCircle, Layers, Diamond, Sparkles, TrendingUp } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import type { HardwareItem, ItemSlot, ItemRarity, ModifierDef, GameState } from '../../engine/types';
import type { ItemPlugin } from '../../plugins/ItemPlugin';
import { normalizeEquipped } from '../../plugins/ItemPlugin';
import type { MoboPlugin } from '../../plugins/MoboPlugin';
import { MOBO_TIERS } from '../../plugins/MoboPlugin';
import { SET_CATALOG } from '../../plugins/SetPlugin';
import type { SetPlugin } from '../../plugins/SetPlugin';
import { formatNumber } from '../../utils/format';
import { ENCHANTMENT_CONFIG, TIER_UP_CONFIG, getEnchantTier } from '../../config/enchantment.config';

interface MotherboardScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const RARITY_COLOR: Record<ItemRarity, string> = {
  Common: '#6b7a8d',
  Rare: '#00f5ff',
  Epic: '#ffaa00',
  Legendary: '#ff0080',
  Mythic: '#e8d48b',
};

const RARITY_GLOW: Record<ItemRarity, string> = {
  Common: 'none',
  Rare: '0 0 8px rgba(0,245,255,0.45)',
  Epic: '0 0 10px rgba(255,170,0,0.5)',
  Legendary: '0 0 14px rgba(255,0,128,0.7)',
  Mythic: '0 0 18px rgba(232,212,139,0.8)',
};

const SLOT_COLOR: Record<ItemSlot, string> = {
  RAM: '#39ff14',
  GPU: '#00f5ff',
  CPU: '#ffaa00',
  EXPANSION: '#ff6600',
};

const SLOT_FULL_LABEL: Record<ItemSlot, string> = {
  RAM: 'RAM BANK',
  GPU: 'GPU SLOT',
  CPU: 'CPU SOCKET',
  EXPANSION: 'EXPANSION',
};

const SLOT_ICON: Record<ItemSlot, React.FC<{ size?: number; color?: string }>> = {
  RAM: ({ size = 14, color }) => <MemoryStick size={size} color={color} />,
  GPU: ({ size = 14, color }) => <Zap size={size} color={color} />,
  CPU: ({ size = 14, color }) => <Cpu size={size} color={color} />,
  EXPANSION: ({ size = 14, color }) => <PlusSquare size={size} color={color} />,
};

const BOARD_POSITIONS: { slot: ItemSlot; x: string; y: string }[] = [
  { slot: 'CPU',       x: '50%', y: '22%' },
  { slot: 'RAM',       x: '17%', y: '52%' },
  { slot: 'GPU',       x: '50%', y: '76%' },
  { slot: 'EXPANSION', x: '83%', y: '52%' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatStatValue(stat: ModifierDef): string {
  if (stat.isMultiplier) return `+${((stat.value - 1) * 100).toFixed(0)}%`;
  return `+${(stat.value * 100).toFixed(1)}%`;
}

function getStatLabel(type: ModifierDef['type']): string {
  const m: Record<ModifierDef['type'], string> = {
    tap_damage: 'TAP',
    idle_dps: 'DPS',
    gold_rate: 'GOLD',
    crit_chance: 'CRIT%',
    crit_multiplier: 'CRIT×',
  };
  return m[type];
}

function getEnchantColor(level: number): string {
  if (level === 0) return '#4a5a6a';
  const tier = getEnchantTier(level);
  return tier?.glowColor ?? '#4a5a6a';
}

function getEnchantGlow(level: number): string {
  if (level === 0) return 'none';
  const tier = getEnchantTier(level);
  return tier ? `0 0 8px ${tier.glowColor}55` : 'none';
}

// ── PCB Trace overlay ──────────────────────────────────────────────────────

const PCBTraces: React.FC = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    overflow="visible"
  >
    <line x1="0"   y1="40%" x2="100%" y2="40%" stroke="#00f5ff0a" strokeWidth="1" strokeDasharray="5 7" />
    <line x1="0"   y1="60%" x2="100%" y2="60%" stroke="#39ff140a" strokeWidth="1" strokeDasharray="5 7" />
    <line x1="50%" y1="0"   x2="50%"  y2="100%" stroke="#ff008008" strokeWidth="1" strokeDasharray="4 9" />
    <rect x="5" y="5" width="12" height="12" fill="none" stroke="#00f5ff18" strokeWidth="1" />
    <rect x="5" y="5" width="6"  height="6"  fill="#00f5ff0c" />
    {[18, 38, 62, 82].map(x => (
      <circle key={x} cx={`${x}%`} cy="50%" r="2.5" fill="#04080408" stroke="#39ff1420" strokeWidth="1" />
    ))}
  </svg>
);

// ── Board Slot Card ────────────────────────────────────────────────────────

interface BoardSlotCardProps {
  slot: ItemSlot;
  slotArray: (HardwareItem | null)[];
  totalSlots: number;
  active: boolean;
  onClick: () => void;
}

const BoardSlotCard: React.FC<BoardSlotCardProps> = ({ slot, slotArray, totalSlots, active, onClick }) => {
  const Icon = SLOT_ICON[slot];
  const color = SLOT_COLOR[slot];
  const filled = slotArray.filter((i): i is HardwareItem => i !== null);
  const firstItem = filled[0];

  return (
    <div
      onClick={onClick}
      style={{
        width: 84,
        background: active ? `${color}18` : firstItem ? `${color}0c` : '#020808',
        border: `1px solid ${active ? color : firstItem ? `${color}88` : `${color}25`}`,
        padding: '5px 7px',
        cursor: 'pointer',
        boxShadow: active ? `0 0 14px ${color}55` : firstItem ? `0 0 8px ${color}28` : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div className="flex items-center gap-1 mb-1">
        <Icon size={8} color={active ? color : firstItem ? color : `${color}55`} />
        <div
          className="font-pixel"
          style={{ color: active ? color : firstItem ? `${color}99` : `${color}44`, fontSize: '5px', letterSpacing: '1px' }}
        >
          {SLOT_FULL_LABEL[slot]}
        </div>
      </div>

      {firstItem ? (
        <>
          <div
            className="font-pixel"
            style={{
              color: RARITY_COLOR[firstItem.rarity],
              fontSize: '6px', letterSpacing: '0.5px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {firstItem.name}
          </div>
          <div style={{ color: `${color}55`, fontFamily: 'var(--font-mono)', fontSize: '7px', marginTop: 1 }}>
            {totalSlots > 1 ? `${filled.length}/${totalSlots}` : firstItem.rarity}
          </div>
        </>
      ) : (
        <div style={{ color: `${color}30`, fontFamily: 'var(--font-mono)', fontSize: '7px', lineHeight: 1.5 }}>
          {totalSlots > 1 ? `×${totalSlots} SLOTS` : 'EMPTY'}
        </div>
      )}
    </div>
  );
};

// ── Top Panel: Always-visible PCB ─────────────────────────────────────────

interface BoardPanelProps {
  engine: GameEngine;
  equipped: GameState['equippedItems'];
  ramSlots: number;
  expansionSlots: number;
  activeSlot: ItemSlot;
  onSelectSlot: (slot: ItemSlot) => void;
}

const BoardPanel: React.FC<BoardPanelProps> = ({
  engine, equipped, ramSlots, expansionSlots, activeSlot, onSelectSlot,
}) => {
  const moboPlugin = engine.getPlugin<MoboPlugin>('mobo');
  const diamonds = useGameState(engine, s => s.diamonds ?? 0);
  const motherboardTier = useGameState(engine, s => s.motherboardTier ?? 0);

  const currentTier = MOBO_TIERS[motherboardTier] ?? MOBO_TIERS[0];
  const nextTier = MOBO_TIERS[motherboardTier + 1] ?? null;
  const canUpgrade = !!nextTier && diamonds >= nextTier.diamondCost;

  return (
    <div
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: 'radial-gradient(ellipse at 50% 40%, #031203 0%, #020708 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <PCBTraces />

      <div
        className="font-pixel"
        style={{ position: 'absolute', top: 6, left: 10, color: '#0a2a0a', fontSize: '5px', letterSpacing: '3px', zIndex: 1 }}
      >
        OVERCLOCK-MOBO-{currentTier.revision}
      </div>

      {/* PCH chipset center */}
      <div
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24, height: 24,
          background: '#020d02', border: '1px solid #0a2a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
        }}
      >
        <div className="font-pixel" style={{ color: '#0a3a0a', fontSize: '4px', textAlign: 'center', lineHeight: 1.2 }}>
          PCH<br />{currentTier.revision}
        </div>
      </div>

      {/* Slot cards */}
      {BOARD_POSITIONS.map(({ slot, x, y }) => {
        const slotArray = equipped[slot] ?? [null];
        const total = slot === 'RAM' ? ramSlots : slot === 'EXPANSION' ? expansionSlots : 1;
        return (
          <div
            key={slot}
            style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: 2 }}
          >
            <BoardSlotCard
              slot={slot}
              slotArray={Array.isArray(slotArray) ? slotArray : [slotArray]}
              totalSlots={total}
              active={activeSlot === slot}
              onClick={() => onSelectSlot(slot)}
            />
          </div>
        );
      })}

      {/* Upgrade strip */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(2,4,2,0.92)', borderTop: '1px solid #0a1a0a',
          padding: '5px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 3, gap: 8,
        }}
      >
        <div>
          <div className="font-pixel" style={{ color: '#39ff14', fontSize: '6px', letterSpacing: '1px' }}>
            {currentTier.name}
          </div>
          <div style={{ color: '#1a4a1a', fontFamily: 'var(--font-mono)', fontSize: '7px' }}>
            RAM×{ramSlots} · EXP×{expansionSlots}
          </div>
        </div>

        {nextTier ? (
          <button
            onClick={() => moboPlugin?.upgrade()}
            disabled={!canUpgrade}
            className="font-pixel flex items-center gap-1"
            style={{
              background: canUpgrade ? '#031a03' : '#020a02',
              border: `1px solid ${canUpgrade ? '#39ff14' : '#1a2a1a'}`,
              color: canUpgrade ? '#39ff14' : '#1a3a1a',
              padding: '4px 8px', fontSize: '5px', letterSpacing: '1px',
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
              boxShadow: canUpgrade ? '0 0 8px rgba(57,255,20,0.2)' : 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <ArrowUpCircle size={8} />
            <span>{nextTier.revision}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4, color: canUpgrade ? '#00e5ff' : '#1a3a3a' }}>
              <Diamond size={7} />
              {nextTier.diamondCost}
            </span>
          </button>
        ) : (
          <div className="font-pixel" style={{ color: '#1a4a1a', fontSize: '5px', letterSpacing: '1px' }}>
            MAX TIER
          </div>
        )}
      </div>
    </div>
  );
};

// ── Item inventory card ────────────────────────────────────────────────────

interface ItemCardProps {
  item: HardwareItem;
  selected: boolean;
  onClick: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, selected, onClick }) => {
  const rc = RARITY_COLOR[item.rarity];
  const Icon = SLOT_ICON[item.slot];
  const enchantLevel = item.enchantLevel ?? 0;
  const enchantColor = getEnchantColor(enchantLevel);

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${rc}14` : '#050010',
        border: `1px solid ${selected ? rc : `${rc}44`}`,
        padding: '7px 9px', cursor: 'pointer',
        boxShadow: selected ? RARITY_GLOW[item.rarity] : enchantLevel > 0 ? getEnchantGlow(enchantLevel) : 'none',
        position: 'relative', transition: 'border-color 0.12s, box-shadow 0.12s',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: rc, boxShadow: `0 0 4px ${rc}` }} />
      <div className="flex items-start gap-2" style={{ paddingLeft: 7 }}>
        <Icon size={10} color={rc} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-1">
            <div className="font-pixel" style={{ color: rc, fontSize: '6px', letterSpacing: '1px' }}>
              {item.name}
            </div>
            {enchantLevel > 0 && (
              <span className="font-pixel" style={{ color: enchantColor, fontSize: '6px', textShadow: `0 0 4px ${enchantColor}` }}>
                +{enchantLevel}
              </span>
            )}
          </div>
          <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            {item.rarity} T{item.tier}
          </div>
          <div style={{ color: '#2a3a4a', fontFamily: 'var(--font-mono)', fontSize: '8px', fontStyle: 'italic', lineHeight: 1.4, marginTop: 2 }}>
            {item.flavorText}
          </div>
          <div className="flex flex-wrap gap-x-3 mt-1">
            {(item.enchantedStats ?? item.stats).map((stat, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                <span style={{ color: '#3a4a3a' }}>{getStatLabel(stat.type)}: </span>
                <span style={{ color: enchantLevel > 0 ? enchantColor : rc }}>{formatStatValue(stat)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sets Panel ────────────────────────────────────────────────────────────

interface SetsPanelProps { engine: GameEngine; }

const SetsPanel: React.FC<SetsPanelProps> = ({ engine }) => {
  const setPlugin = engine.getPlugin<SetPlugin>('sets');
  const setItems = useGameState(engine, s => s.setItems ?? []);
  const collectedSets = useGameState(engine, s => s.collectedSets ?? {});
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => setPlugin?.subscribe(refresh), [setPlugin, refresh]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '10px 12px' }}>
      <div className="font-pixel" style={{ color: '#3a3a2a', fontSize: '6px', letterSpacing: '2px', marginBottom: 10 }}>
        {'> MYTHIC SET COLLECTION'}
      </div>
      <div style={{ color: '#2a3a3a', fontFamily: 'var(--font-mono)', fontSize: '8px', marginBottom: 12, lineHeight: 1.5 }}>
        Mythic set pieces are awarded from tournaments. Collect a full set for a permanent bonus — even unequipped.
      </div>

      {SET_CATALOG.map(set => {
        const progress = setPlugin?.getProgressForSet(set.id) ?? { owned: 0, total: set.pieces.length, ownedPieces: [] };
        const isComplete = collectedSets[set.id] ?? false;
        const completePct = progress.total > 0 ? (progress.owned / progress.total) * 100 : 0;

        return (
          <div key={set.id} style={{
            background: isComplete ? `${set.color}0a` : '#080810',
            border: `1px solid ${isComplete ? set.color + '55' : '#1a1a28'}`,
            padding: '11px 13px', marginBottom: 8,
            boxShadow: isComplete ? `0 0 14px ${set.color}22` : 'none',
          }}>
            {/* Set header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <div className="font-pixel" style={{ color: isComplete ? set.color : set.color + '88', fontSize: '9px', marginBottom: 2 }}>
                  {set.name}
                  {isComplete && <span style={{ marginLeft: 8, fontSize: '7px', color: '#e8d48b' }}>✦ COMPLETE</span>}
                </div>
                <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>{set.description}</div>
              </div>
              <div className="font-pixel" style={{ color: set.color, fontSize: '10px', flexShrink: 0, marginLeft: 8 }}>
                {progress.owned}/{progress.total}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: '#1a1a2a', marginBottom: 8, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${completePct}%`,
                background: isComplete ? set.color : set.color + '66',
                boxShadow: isComplete ? `0 0 6px ${set.color}` : 'none',
                transition: 'width 0.4s',
              }} />
            </div>

            {/* Set bonus */}
            <div style={{
              background: isComplete ? '#0a0a00' : '#050508',
              border: `1px solid ${isComplete ? set.color + '33' : '#151520'}`,
              padding: '6px 8px', marginBottom: 8,
            }}>
              <div className="font-pixel" style={{ color: isComplete ? '#e8d48b' : '#2a2a3a', fontSize: '6px', letterSpacing: '1px', marginBottom: 2 }}>
                SET BONUS
              </div>
              <div style={{ color: isComplete ? set.color : '#2a2a3a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                {set.setBonusDescription}
              </div>
            </div>

            {/* Pieces */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {set.pieces.map(piece => {
                const owned = progress.ownedPieces.includes(piece.name);
                const ownedItem = setItems.find(i => i.setId === set.id && i.name === piece.name);
                return (
                  <div key={piece.name} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px',
                    background: owned ? `${set.color}0a` : 'transparent',
                    border: `1px solid ${owned ? set.color + '33' : '#101018'}`,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: owned ? set.color : '#1a1a2a',
                      boxShadow: owned ? `0 0 5px ${set.color}` : 'none',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="font-pixel" style={{ color: owned ? set.color : '#2a2a3a', fontSize: '6px' }}>
                        {piece.name}
                      </span>
                      <span style={{ color: '#3a3a4a', fontFamily: 'var(--font-mono)', fontSize: '7px', marginLeft: 6 }}>
                        [{piece.slot}]
                      </span>
                    </div>
                    {owned && ownedItem && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {ownedItem.stats.slice(0, 2).map((stat, i) => (
                          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: set.color + 'aa' }}>
                            {stat.isMultiplier ? `+${((stat.value - 1) * 100).toFixed(0)}%` : `+${(stat.value * 100).toFixed(0)}%`}
                            {' '}{stat.type === 'tap_damage' ? 'TAP' : stat.type === 'idle_dps' ? 'DPS' : stat.type === 'gold_rate' ? 'G' : stat.type === 'crit_chance' ? 'CC' : 'CM'}
                          </span>
                        ))}
                      </div>
                    )}
                    {!owned && (
                      <span style={{ color: '#1a2a2a', fontFamily: 'var(--font-mono)', fontSize: '7px' }}>MISSING</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Enchant Panel ─────────────────────────────────────────────────────────────

interface EnchantPanelProps {
  engine: GameEngine;
  item: HardwareItem;
  itemPlugin: ItemPlugin | undefined;
  onClose: () => void;
}

const EnchantPanel: React.FC<EnchantPanelProps> = ({ engine, item, itemPlugin, onClose }) => {
  const scrap = useGameState(engine, s => s.scrap ?? 0);
  const diamonds = useGameState(engine, s => s.diamonds ?? 0);
  const [message, setMessage] = useState<string | null>(null);
  const [useProtection, setUseProtection] = useState(false);
  const [useLuckyCharm, setUseLuckyCharm] = useState(false);

  const enchantInfo = itemPlugin?.getEnchantInfo(item);
  const tierUpInfo = itemPlugin?.getTierUpInfo(item);
  const rc = RARITY_COLOR[item.rarity];
  const enchantLevel = item.enchantLevel ?? 0;
  const enchantColor = getEnchantColor(enchantLevel);

  const handleEnchant = () => {
    if (!itemPlugin) return;
    const result = itemPlugin.enchantItem(item.id, { useProtection, useLuckyCharm });
    setMessage(result.message);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTierUp = () => {
    if (!itemPlugin) return;
    const result = itemPlugin.tierUpItem(item.id);
    setMessage(result.message);
    setTimeout(() => setMessage(null), 3000);
  };

  const protectionCost = ENCHANTMENT_CONFIG.protectionScrollCost;
  const charmCost = ENCHANTMENT_CONFIG.luckyCharmCost;
  const successChance = enchantInfo?.successChance ?? 0;
  const adjustedChance = useLuckyCharm ? Math.min(1, successChance + 0.25) : successChance;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 20, display: 'flex', flexDirection: 'column', padding: 12,
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-pixel flex items-center gap-2" style={{ color: rc, fontSize: '8px', letterSpacing: '1px' }}>
            <Sparkles size={12} color={rc} />
            {item.name}
            {enchantLevel > 0 && <span style={{ color: enchantColor }}>+{enchantLevel}</span>}
          </div>
          <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            {item.rarity} T{item.tier}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #2a2a3a', color: '#4a5a6a', padding: '4px 8px', fontSize: '8px', cursor: 'pointer' }}>
          CLOSE
        </button>
      </div>

      {/* Current stats */}
      <div style={{ background: '#0a0a12', border: '1px solid #1a1a28', padding: 10, marginBottom: 10 }}>
        <div className="font-pixel" style={{ color: '#4a5a6a', fontSize: '6px', letterSpacing: '1px', marginBottom: 6 }}>CURRENT STATS</div>
        <div className="flex flex-wrap gap-3">
          {(item.enchantedStats ?? item.stats).map((stat, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
              <span style={{ color: '#4a5a6a' }}>{getStatLabel(stat.type)}: </span>
              <span style={{ color: enchantLevel > 0 ? enchantColor : rc }}>{formatStatValue(stat)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          background: message.includes('successful') ? '#0a2a0a' : '#2a0a0a',
          border: `1px solid ${message.includes('successful') ? '#39ff14' : '#ff3333'}`,
          color: message.includes('successful') ? '#39ff14' : '#ff6666',
          padding: '8px 12px', marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: '9px', textAlign: 'center',
        }}>
          {message}
        </div>
      )}

      {/* Enchant Section */}
      <div style={{ background: '#080810', border: '1px solid #1a1a28', padding: 12, marginBottom: 10 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-pixel flex items-center gap-2" style={{ color: '#00f5ff', fontSize: '7px', letterSpacing: '1px' }}>
            <Sparkles size={10} color="#00f5ff" />
            ENCHANTMENT
          </div>
          <div style={{ color: '#3a5a6a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            Level {enchantLevel}/{ENCHANTMENT_CONFIG.maxEnchantLevel}
          </div>
        </div>

        {enchantInfo && enchantInfo.currentLevel < ENCHANTMENT_CONFIG.maxEnchantLevel ? (
          <>
            <div className="flex items-center justify-between mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
              <span style={{ color: '#4a5a6a' }}>Cost:</span>
              <span style={{ color: scrap >= enchantInfo.nextCost ? '#39ff14' : '#ff3333' }}>
                {formatNumber(enchantInfo.nextCost)} SCRAP
              </span>
            </div>
            <div className="flex items-center justify-between mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
              <span style={{ color: '#4a5a6a' }}>Success Rate:</span>
              <span style={{ color: adjustedChance >= 0.8 ? '#39ff14' : adjustedChance >= 0.5 ? '#ffaa00' : '#ff6600' }}>
                {(adjustedChance * 100).toFixed(0)}%
              </span>
            </div>
            {enchantInfo.failurePenalty > 0 && (
              <div className="flex items-center justify-between mb-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                <span style={{ color: '#4a5a6a' }}>Failure Penalty:</span>
                <span style={{ color: '#ff6666' }}>-{enchantInfo.failurePenalty} levels</span>
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-2 mb-3">
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useProtection}
                  onChange={e => setUseProtection(e.target.checked)}
                  style={{ accentColor: '#00f5ff' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: diamonds >= protectionCost ? '#6a7a8a' : '#3a3a4a' }}>
                  Protection Scroll ({protectionCost} <Diamond size={8} style={{ display: 'inline', verticalAlign: 'middle' }} />) - No level loss on fail
                </span>
              </label>
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useLuckyCharm}
                  onChange={e => setUseLuckyCharm(e.target.checked)}
                  style={{ accentColor: '#ffaa00' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: diamonds >= charmCost ? '#6a7a8a' : '#3a3a4a' }}>
                  Lucky Charm ({charmCost} <Diamond size={8} style={{ display: 'inline', verticalAlign: 'middle' }} />) - +25% success
                </span>
              </label>
            </div>

            <button
              onClick={handleEnchant}
              disabled={!enchantInfo.canEnchant && scrap < enchantInfo.nextCost}
              className="w-full font-pixel"
              style={{
                background: scrap >= enchantInfo.nextCost ? '#0a1a2a' : '#0a0a0a',
                border: `1px solid ${scrap >= enchantInfo.nextCost ? '#00f5ff' : '#2a2a3a'}`,
                color: scrap >= enchantInfo.nextCost ? '#00f5ff' : '#3a3a4a',
                padding: '8px', fontSize: '7px', letterSpacing: '1px',
                cursor: scrap >= enchantInfo.nextCost ? 'pointer' : 'not-allowed',
              }}
            >
              ENCHANT TO +{enchantLevel + 1}
            </button>
          </>
        ) : (
          <div style={{ color: '#39ff14', fontFamily: 'var(--font-mono)', fontSize: '9px', textAlign: 'center', padding: 10 }}>
            MAX ENCHANTMENT REACHED
          </div>
        )}
      </div>

      {/* Tier-Up Section */}
      <div style={{ background: '#080810', border: '1px solid #1a1a28', padding: 12 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-pixel flex items-center gap-2" style={{ color: '#ffaa00', fontSize: '7px', letterSpacing: '1px' }}>
            <TrendingUp size={10} color="#ffaa00" />
            TIER UPGRADE
          </div>
          <div style={{ color: '#5a4a3a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            Tier {item.tier}/{TIER_UP_CONFIG.maxTier}
          </div>
        </div>

        {tierUpInfo && tierUpInfo.currentTier < TIER_UP_CONFIG.maxTier ? (
          <>
            {tierUpInfo.reason && (
              <div style={{ color: '#ff6666', fontFamily: 'var(--font-mono)', fontSize: '8px', marginBottom: 8 }}>
                {tierUpInfo.reason}
              </div>
            )}
            {tierUpInfo.canTierUp || !tierUpInfo.reason ? (
              <>
                <div className="flex items-center justify-between mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                  <span style={{ color: '#4a5a6a' }}>Cost:</span>
                  <span className="flex items-center gap-1" style={{ color: diamonds >= tierUpInfo.nextCost ? '#00e5ff' : '#ff3333' }}>
                    {tierUpInfo.nextCost} <Diamond size={9} />
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                  <span style={{ color: '#4a5a6a' }}>Success Rate:</span>
                  <span style={{ color: tierUpInfo.successChance >= 0.8 ? '#39ff14' : tierUpInfo.successChance >= 0.5 ? '#ffaa00' : '#ff6600' }}>
                    {(tierUpInfo.successChance * 100).toFixed(0)}%
                  </span>
                </div>

                <button
                  onClick={handleTierUp}
                  disabled={!tierUpInfo.canTierUp}
                  className="w-full font-pixel"
                  style={{
                    background: tierUpInfo.canTierUp ? '#1a1a0a' : '#0a0a0a',
                    border: `1px solid ${tierUpInfo.canTierUp ? '#ffaa00' : '#2a2a3a'}`,
                    color: tierUpInfo.canTierUp ? '#ffaa00' : '#3a3a4a',
                    padding: '8px', fontSize: '7px', letterSpacing: '1px',
                    cursor: tierUpInfo.canTierUp ? 'pointer' : 'not-allowed',
                  }}
                >
                  UPGRADE TO T{item.tier + 1}
                </button>
              </>
            ) : null}
          </>
        ) : (
          <div style={{ color: '#ffaa00', fontFamily: 'var(--font-mono)', fontSize: '9px', textAlign: 'center', padding: 10 }}>
            MAX TIER REACHED
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="flex justify-center gap-6 mt-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
        <span style={{ color: '#6a8a6a' }}>SCRAP: {formatNumber(scrap)}</span>
        <span className="flex items-center gap-1" style={{ color: '#00e5ff' }}>
          <Diamond size={9} /> {diamonds}
        </span>
      </div>
    </div>
  );
};

// ── Bottom Panel: Tabs + slot content ─────────────────────────────────────

interface SlotPanelProps {
  activeSlot: ItemSlot;
  onSelectSlot: (slot: ItemSlot) => void;
  equipped: GameState['equippedItems'];
  inventory: HardwareItem[];
  ramSlots: number;
  expansionSlots: number;
  itemPlugin: ItemPlugin | undefined;
  engine: GameEngine;
}

const SlotPanel: React.FC<SlotPanelProps> = ({
  activeSlot, onSelectSlot, equipped, inventory, ramSlots, expansionSlots, itemPlugin, engine,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [enchantingItem, setEnchantingItem] = useState<HardwareItem | null>(null);

  const slot = activeSlot;
  const color = SLOT_COLOR[slot];
  const Icon = SLOT_ICON[slot];
  const slotArray = Array.isArray(equipped[slot]) ? (equipped[slot] as (HardwareItem | null)[]) : [equipped[slot] as HardwareItem | null];
  const slotCount = slot === 'RAM' ? ramSlots : slot === 'EXPANSION' ? expansionSlots : 1;
  const inventoryForSlot = inventory.filter(i => i.slot === slot);

  const TABS: ItemSlot[] = ['CPU', 'GPU', 'RAM', 'EXPANSION'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Tab bar */}
      <div
        className="flex"
        style={{ background: '#04000e', borderBottom: '1px solid #0f0820', flexShrink: 0, overflowX: 'auto' }}
      >
        {TABS.map(tab => {
          const isActive = activeSlot === tab;
          const tc = SLOT_COLOR[tab];
          const TabIcon = SLOT_ICON[tab];
          const tabRaw = equipped[tab];
          const tabArray = Array.isArray(tabRaw) ? (tabRaw as (HardwareItem | null)[]) : [tabRaw as HardwareItem | null];
          const filledCount = tabArray.filter(Boolean).length;
          const tabSlotCount = tab === 'RAM' ? ramSlots : tab === 'EXPANSION' ? expansionSlots : 1;
          const invCount = inventory.filter(i => i.slot === tab).length;

          return (
            <button
              key={tab}
              onClick={() => { onSelectSlot(tab); setSelectedItemId(null); }}
              className="font-pixel flex items-center gap-1"
              style={{
                padding: '7px 11px', fontSize: '6px', letterSpacing: '1px',
                background: isActive ? `${tc}0a` : 'none', border: 'none',
                borderBottom: isActive ? `2px solid ${tc}` : '2px solid transparent',
                color: isActive ? tc : '#2a3a4a',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.12s', flexShrink: 0,
              }}
            >
              <TabIcon size={9} color={isActive ? tc : '#2a3a4a'} />
              {tab}{tabSlotCount > 1 ? ` ×${tabSlotCount}` : ''}
              {(filledCount > 0 || invCount > 0) && (
                <span style={{
                  background: filledCount > 0 ? tc : `${tc}44`,
                  color: filledCount > 0 ? '#000' : tc,
                  padding: '0 3px', fontSize: '6px', lineHeight: '12px',
                  minWidth: 12, textAlign: 'center', fontFamily: 'var(--font-mono)',
                }}>
                  {filledCount > 0 ? `${filledCount}/${tabSlotCount}` : invCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Installed slots */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #0a0818', padding: '8px 12px', background: '#030010', maxHeight: '35%', overflow: 'hidden' }}>
        <div className="font-pixel mb-2" style={{ color: `${color}55`, fontSize: '6px', letterSpacing: '2px' }}>
          INSTALLED ({slotArray.filter(Boolean).length}/{slotCount})
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 6, 
          overflowX: 'auto', 
          overflowY: 'hidden',
          paddingBottom: 4,
          maxHeight: 'calc(100% - 20px)',
        }}>
          {Array.from({ length: slotCount }).map((_, i) => {
            const item = slotArray[i] ?? null;
            if (item) {
              const enchantLevel = item.enchantLevel ?? 0;
              const enchantColor = getEnchantColor(enchantLevel);
              return (
                <div
                  key={i}
                  style={{
                    minWidth: 140,
                    flexShrink: 0,
                    background: `${RARITY_COLOR[item.rarity]}0a`,
                    border: `1px solid ${RARITY_COLOR[item.rarity]}`,
                    padding: '6px 8px', boxShadow: enchantLevel > 0 ? getEnchantGlow(enchantLevel) : RARITY_GLOW[item.rarity], position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: RARITY_COLOR[item.rarity] }} />
                  <div style={{ paddingLeft: 6 }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Icon size={8} color={RARITY_COLOR[item.rarity]} />
                      <div className="font-pixel" style={{ color: RARITY_COLOR[item.rarity], fontSize: '6px' }}>
                        {item.name}
                      </div>
                      {enchantLevel > 0 && (
                        <span className="font-pixel" style={{ color: enchantColor, fontSize: '6px', textShadow: `0 0 4px ${enchantColor}` }}>
                          +{enchantLevel}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#3a4a3a', fontFamily: 'var(--font-mono)', fontSize: '7px', marginBottom: 3 }}>
                      {item.rarity} T{item.tier}
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      {(item.enchantedStats ?? item.stats).map((stat, si) => (
                        <span key={si} style={{ fontFamily: 'var(--font-mono)', fontSize: '7px' }}>
                          <span style={{ color: '#3a4a3a' }}>{getStatLabel(stat.type)}: </span>
                          <span style={{ color: enchantLevel > 0 ? enchantColor : RARITY_COLOR[item.rarity] }}>{formatStatValue(stat)}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => setEnchantingItem(item)}
                        style={{
                          flex: 1, background: 'none',
                          border: '1px solid #00f5ff33', color: '#00f5ff55',
                          padding: '2px 0', fontSize: '6px', fontFamily: 'var(--font-mono)',
                          cursor: 'pointer', letterSpacing: '1px',
                        }}
                      >
                        UPGRADE
                      </button>
                      <button
                        onClick={() => itemPlugin?.unequip(slot, i)}
                        style={{
                          flex: 1, background: 'none',
                          border: `1px solid ${color}33`, color: `${color}55`,
                          padding: '2px 0', fontSize: '6px', fontFamily: 'var(--font-mono)',
                          cursor: 'pointer', letterSpacing: '1px',
                        }}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={i}
                style={{
                  minWidth: 140,
                  flexShrink: 0,
                  background: '#040010', border: `1px dashed ${color}1e`,
                  padding: '8px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 60,
                }}
              >
                <Icon size={11} color={`${color}28`} />
                <div style={{ color: `${color}28`, fontFamily: 'var(--font-mono)', fontSize: '7px' }}>
                  SLOT {i + 1} EMPTY
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage list */}
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        padding: '8px 12px', 
      }}>
        <div className="font-pixel mb-1" style={{ color: '#1a3a2a', fontSize: '6px', letterSpacing: '2px', position: 'sticky', top: 0, background: '#030010', paddingBottom: 4 }}>
          STORAGE · {inventoryForSlot.length} {slot} ITEMS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {inventoryForSlot.length === 0 ? (
          <div style={{ color: '#1a2a1a', fontFamily: 'var(--font-mono)', fontSize: '9px', textAlign: 'center', marginTop: 20, lineHeight: 2 }}>
            NO {slot} HARDWARE IN STORAGE<br />
            <span style={{ color: '#0f1a0f' }}>DEFEAT ENEMIES TO FIND HARDWARE</span>
          </div>
        ) : (
          inventoryForSlot.map(item => (
            <div key={item.id}>
              <ItemCard
                item={item}
                selected={selectedItemId === item.id}
                onClick={() => setSelectedItemId(prev => prev === item.id ? null : item.id)}
              />
              {selectedItemId === item.id && (
                <div className="flex" style={{ borderTop: 'none' }}>
                  <button
                    onClick={() => { itemPlugin?.equip(item.id); setSelectedItemId(null); }}
                    className="font-pixel"
                    style={{
                      flex: 1, background: `${color}18`, border: `1px solid ${color}`, borderTop: 'none', borderRight: 'none',
                      color, padding: '5px', fontSize: '6px', cursor: 'pointer', letterSpacing: '1px',
                    }}
                  >
                    INSTALL
                  </button>
                  <button
                    onClick={() => setEnchantingItem(item)}
                    className="font-pixel"
                    style={{
                      flex: 1, background: '#00f5ff18', border: '1px solid #00f5ff', borderTop: 'none',
                      color: '#00f5ff', padding: '5px', fontSize: '6px', cursor: 'pointer', letterSpacing: '1px',
                    }}
                  >
                    UPGRADE
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        </div>
      </div>

      {/* Enchant Panel Overlay */}
      {enchantingItem && (
        <EnchantPanel
          engine={engine}
          item={enchantingItem}
          itemPlugin={itemPlugin}
          onClose={() => setEnchantingItem(null)}
        />
      )}
    </div>
  );
};

// ── Root ───────────────────────────────────────────────────────────────────

export const MotherboardScreen: React.FC<MotherboardScreenProps> = ({ engine, onClose }) => {
  const inventory = useGameState(engine, s => s.inventory ?? []);
  const equipped = useGameState(engine, s => normalizeEquipped(s.equippedItems));
  const motherboardTier = useGameState(engine, s => s.motherboardTier ?? 0);
  const ramSlots = useGameState(engine, s => s.ramSlots ?? 1);
  const expansionSlots = useGameState(engine, s => s.expansionSlots ?? 1);
  const setItems = useGameState(engine, s => s.setItems ?? []);

  const [activeSlot, setActiveSlot] = useState<ItemSlot>('CPU');
  const [bottomMode, setBottomMode] = useState<'slots' | 'sets'>('slots');

  const itemPlugin = engine.getPlugin<ItemPlugin>('items');
  const currentTierDef = MOBO_TIERS[motherboardTier] ?? MOBO_TIERS[0];
  const allEquipped = Object.values(equipped).flat().filter(Boolean).length;
  const totalSlots = 2 + ramSlots + expansionSlots;

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
          width: '100%', maxWidth: 540,
          maxHeight: '90vh',
          background: '#030008', border: '1px solid #180a28',
          boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 40px rgba(0,245,255,0.04)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Corner chrome */}
        {['tl','tr','bl','br'].map(c => (
          <div key={c} style={{
            position: 'absolute', width: 14, height: 14, zIndex: 10, pointerEvents: 'none',
            top: c.startsWith('t') ? 0 : undefined, bottom: c.startsWith('b') ? 0 : undefined,
            left: c.endsWith('l') ? 0 : undefined, right: c.endsWith('r') ? 0 : undefined,
            borderTop: c.startsWith('t') ? `2px solid ${c === 'tl' || c === 'tr' ? '#00f5ff33' : 'transparent'}` : undefined,
            borderBottom: c.startsWith('b') ? `2px solid #00f5ff1a` : undefined,
            borderLeft: c.endsWith('l') ? `2px solid ${c === 'tl' ? '#00f5ff33' : '#00f5ff1a'}` : undefined,
            borderRight: c.endsWith('r') ? `2px solid ${c === 'tr' ? '#00f5ff33' : '#00f5ff1a'}` : undefined,
          }} />
        ))}

        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: '#050010', borderBottom: '1px solid #180a28', flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <CircuitBoard size={12} color="#00f5ff" />
            <div>
              <div className="font-pixel" style={{ color: '#00f5ff', fontSize: '8px', letterSpacing: '3px' }}>
                SYSTEM BOARD
              </div>
              <div style={{ color: '#253545', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                {currentTierDef.revision} · {allEquipped}/{totalSlots} SLOTS · {inventory.length} IN STORAGE
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

        {/* TOP 35%: PCB board — always visible */}
        <div style={{ height: '35%', flexShrink: 0, borderBottom: '1px solid #0f0820', overflow: 'hidden' }}>
          <BoardPanel
            engine={engine}
            equipped={equipped}
            ramSlots={ramSlots}
            expansionSlots={expansionSlots}
            activeSlot={activeSlot}
            onSelectSlot={setActiveSlot}
          />
        </div>

        {/* BOTTOM 65%: Mode switcher + content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Mode switcher bar */}
          <div style={{ flexShrink: 0, display: 'flex', background: '#04000e', borderBottom: '1px solid #0f0820' }}>
            <button
              onClick={() => setBottomMode('slots')}
              className="font-pixel flex items-center gap-1"
              style={{
                padding: '7px 14px', fontSize: '6px', letterSpacing: '1px', border: 'none',
                background: bottomMode === 'slots' ? '#00f5ff0a' : 'none',
                borderBottom: bottomMode === 'slots' ? '2px solid #00f5ff' : '2px solid transparent',
                color: bottomMode === 'slots' ? '#00f5ff' : '#2a3a4a', cursor: 'pointer',
              }}
            >
              <CircuitBoard size={9} color={bottomMode === 'slots' ? '#00f5ff' : '#2a3a4a'} />
              HARDWARE
            </button>
            <button
              onClick={() => setBottomMode('sets')}
              className="font-pixel flex items-center gap-1"
              style={{
                padding: '7px 14px', fontSize: '6px', letterSpacing: '1px', border: 'none',
                background: bottomMode === 'sets' ? '#e8d48b0a' : 'none',
                borderBottom: bottomMode === 'sets' ? '2px solid #e8d48b' : '2px solid transparent',
                color: bottomMode === 'sets' ? '#e8d48b' : '#2a3a4a', cursor: 'pointer',
              }}
            >
              <Layers size={9} color={bottomMode === 'sets' ? '#e8d48b' : '#2a3a4a'} />
              SETS
              {setItems.length > 0 && (
                <span style={{
                  background: '#e8d48b', color: '#000',
                  padding: '0 3px', fontSize: '6px', lineHeight: '11px',
                  fontFamily: 'var(--font-mono)', minWidth: 11, textAlign: 'center',
                }}>
                  {setItems.length}
                </span>
              )}
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {bottomMode === 'slots' ? (
              <SlotPanel
                activeSlot={activeSlot}
                onSelectSlot={setActiveSlot}
                equipped={equipped}
                inventory={inventory}
                ramSlots={ramSlots}
                expansionSlots={expansionSlots}
                itemPlugin={itemPlugin}
                engine={engine}
              />
            ) : (
              <SetsPanel engine={engine} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
