import React, { useState } from 'react';
import { X, Cpu, MemoryStick, Zap, PlusSquare, CircuitBoard, Lock, ArrowUpCircle } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import type { HardwareItem, ItemSlot, ItemRarity, ModifierDef, GameState } from '../../engine/types';
import type { ItemPlugin } from '../../plugins/ItemPlugin';
import { normalizeEquipped } from '../../plugins/ItemPlugin';
import type { MoboPlugin } from '../../plugins/MoboPlugin';
import { MOBO_TIERS } from '../../plugins/MoboPlugin';

interface MotherboardScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

type ActiveTab = 'board' | ItemSlot;

const RARITY_COLOR: Record<ItemRarity, string> = {
  Common: '#6b7a8d',
  Rare: '#00f5ff',
  Epic: '#ffaa00',
  Legendary: '#ff0080',
};

const RARITY_GLOW: Record<ItemRarity, string> = {
  Common: 'none',
  Rare: '0 0 8px rgba(0,245,255,0.4)',
  Epic: '0 0 10px rgba(255,170,0,0.5)',
  Legendary: '0 0 14px rgba(255,0,128,0.7)',
};

const SLOT_ICON: Record<ItemSlot, React.FC<{ size?: number; color?: string }>> = {
  RAM: ({ size = 14, color }) => <MemoryStick size={size} color={color} />,
  GPU: ({ size = 14, color }) => <Zap size={size} color={color} />,
  CPU: ({ size = 14, color }) => <Cpu size={size} color={color} />,
  EXPANSION: ({ size = 14, color }) => <PlusSquare size={size} color={color} />,
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

function formatStatValue(stat: ModifierDef): string {
  if (stat.isMultiplier) return `+${((stat.value - 1) * 100).toFixed(0)}%`;
  return `+${(stat.value * 100).toFixed(1)}%`;
}

function getStatLabel(type: ModifierDef['type']): string {
  const labels: Record<ModifierDef['type'], string> = {
    tap_damage: 'TAP',
    idle_dps: 'DPS',
    gold_rate: 'GOLD',
    crit_chance: 'CRIT%',
    crit_multiplier: 'CRIT×',
  };
  return labels[type];
}

function formatGold(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ── ItemCard ───────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: HardwareItem;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, selected, compact, onClick }) => {
  const Icon = SLOT_ICON[item.slot];
  const rc = RARITY_COLOR[item.rarity];
  const glow = RARITY_GLOW[item.rarity];

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${rc}12` : '#060010',
        border: `1px solid ${selected ? rc : `${rc}44`}`,
        padding: compact ? '5px 8px' : '8px 10px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected ? glow : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: rc, boxShadow: `0 0 4px ${rc}` }} />
      <div className="flex items-start gap-2" style={{ paddingLeft: 7 }}>
        <Icon size={10} color={rc} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-pixel" style={{ color: rc, fontSize: '6px', letterSpacing: '1px' }}>
            {item.name}
          </div>
          <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            {item.rarity} T{item.tier}
          </div>
          {!compact && (
            <div style={{ color: '#2a3a4a', fontFamily: 'var(--font-mono)', fontSize: '8px', fontStyle: 'italic', lineHeight: 1.4, marginTop: 2 }}>
              {item.flavorText}
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 mt-1">
            {item.stats.map((stat, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                <span style={{ color: '#4a5a4a' }}>{getStatLabel(stat.type)}: </span>
                <span style={{ color: rc }}>{formatStatValue(stat)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PCB visual ─────────────────────────────────────────────────────────────

const PCBTraces: React.FC = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    overflow="visible"
  >
    <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#00f5ff0c" strokeWidth="1" strokeDasharray="4 6" />
    <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#39ff140c" strokeWidth="1" strokeDasharray="4 6" />
    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#ff008009" strokeWidth="1" strokeDasharray="3 8" />
    <rect x="4" y="4" width="10" height="10" fill="none" stroke="#00f5ff18" strokeWidth="1" />
    <rect x="4" y="4" width="5" height="5" fill="#00f5ff0c" />
    {[20, 40, 60, 80].map(x => (
      <circle key={x} cx={`${x}%`} cy="50%" r="2" fill="#08100808" stroke="#39ff1420" strokeWidth="1" />
    ))}
  </svg>
);

// ── Board Tab ──────────────────────────────────────────────────────────────

interface BoardTabProps {
  engine: GameEngine;
  equipped: GameState['equippedItems'];
  ramSlots: number;
  expansionSlots: number;
  onGoToSlot: (slot: ItemSlot) => void;
}

const BOARD_SLOTS: { slot: ItemSlot; x: string; y: string }[] = [
  { slot: 'CPU', x: '50%', y: '27%' },
  { slot: 'RAM', x: '18%', y: '52%' },
  { slot: 'GPU', x: '50%', y: '70%' },
  { slot: 'EXPANSION', x: '82%', y: '52%' },
];

const BoardTab: React.FC<BoardTabProps> = ({ engine, equipped, ramSlots, expansionSlots, onGoToSlot }) => {
  const moboPlugin = engine.getPlugin<MoboPlugin>('mobo');
  const gold = useGameState(engine, s => s.gold);
  const motherboardTier = useGameState(engine, s => s.motherboardTier ?? 0);

  const currentTier = MOBO_TIERS[motherboardTier] ?? MOBO_TIERS[0];
  const nextTier = MOBO_TIERS[motherboardTier + 1] ?? null;
  const canUpgrade = !!nextTier && gold >= nextTier.goldCost;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* PCB visual area */}
      <div
        style={{
          flex: '1 1 0',
          position: 'relative',
          background: 'radial-gradient(ellipse at 50% 50%, #030d03 0%, #020808 100%)',
          minHeight: 180,
        }}
      >
        <PCBTraces />

        <div
          className="font-pixel"
          style={{ position: 'absolute', top: 6, left: 10, color: '#0a2a0a', fontSize: '5px', letterSpacing: '3px' }}
        >
          OVERCLOCK-MOBO-{currentTier.revision}
        </div>

        {/* Center chipset label */}
        <div style={{
          position: 'absolute', top: '48%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 26, height: 26,
          background: '#030d03',
          border: '1px solid #0a2a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="font-pixel" style={{ color: '#0a3a0a', fontSize: '4px', textAlign: 'center', lineHeight: 1.2 }}>
            PCH<br />X{99 + motherboardTier}
          </div>
        </div>

        {BOARD_SLOTS.map(({ slot, x, y }) => {
          const slotArray = equipped[slot] ?? [null];
          const Icon = SLOT_ICON[slot];
          const color = SLOT_COLOR[slot];
          const filledCount = slotArray.filter(Boolean).length;
          const totalSlots = slot === 'RAM' ? ramSlots : slot === 'EXPANSION' ? expansionSlots : 1;
          const firstFilled = slotArray.find((i): i is HardwareItem => i !== null);

          return (
            <div
              key={slot}
              onClick={() => onGoToSlot(slot)}
              style={{
                position: 'absolute',
                left: x, top: y,
                transform: 'translate(-50%, -50%)',
                width: 88,
                background: filledCount > 0 ? `${color}0c` : '#030808',
                border: `1px solid ${filledCount > 0 ? color : `${color}28`}`,
                padding: '5px 7px',
                cursor: 'pointer',
                boxShadow: filledCount > 0 ? `0 0 10px ${color}30` : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <Icon size={8} color={color} />
                <div className="font-pixel" style={{ color: `${color}77`, fontSize: '5px', letterSpacing: '1px' }}>
                  {SLOT_FULL_LABEL[slot]}
                </div>
              </div>
              {firstFilled ? (
                <>
                  <div className="font-pixel" style={{ color: RARITY_COLOR[firstFilled.rarity], fontSize: '6px' }}>
                    {firstFilled.name}
                  </div>
                  {totalSlots > 1 && (
                    <div style={{ color: `${color}77`, fontFamily: 'var(--font-mono)', fontSize: '7px' }}>
                      {filledCount}/{totalSlots}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: `${color}33`, fontFamily: 'var(--font-mono)', fontSize: '7px', lineHeight: 1.4 }}>
                  {totalSlots > 1 ? `${totalSlots} SLOTS` : 'EMPTY'}<br />
                  <span style={{ fontSize: '6px', color: `${color}22` }}>CLICK</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Board upgrade strip */}
      <div style={{ borderTop: '1px solid #0a180a', padding: '10px 14px', background: '#020a02', flexShrink: 0 }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-pixel" style={{ color: '#39ff14', fontSize: '7px', letterSpacing: '1px' }}>
                {currentTier.name}
              </div>
              <div className="font-pixel" style={{ color: '#1a4a1a', fontSize: '5px', letterSpacing: '2px' }}>
                {currentTier.revision}
              </div>
            </div>
            <div style={{ color: '#2a4a2a', fontFamily: 'var(--font-mono)', fontSize: '8px', marginTop: 1 }}>
              {currentTier.description}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#1a3a1a', textAlign: 'right', flexShrink: 0 }}>
            <div>RAM ×{ramSlots}</div>
            <div>EXP ×{expansionSlots}</div>
          </div>
        </div>

        {nextTier ? (
          <button
            onClick={() => moboPlugin?.upgrade()}
            disabled={!canUpgrade}
            className="w-full font-pixel flex items-center justify-center gap-2"
            style={{
              background: canUpgrade ? '#031a03' : '#020a02',
              border: `1px solid ${canUpgrade ? '#39ff14' : '#1a2a1a'}`,
              color: canUpgrade ? '#39ff14' : '#1a3a1a',
              padding: '7px 10px',
              fontSize: '6px',
              letterSpacing: '1px',
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
              boxShadow: canUpgrade ? '0 0 8px rgba(57,255,20,0.15)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <ArrowUpCircle size={10} />
            UPGRADE → {nextTier.revision} · {nextTier.name}
            <span style={{ color: canUpgrade ? '#39ff1477' : '#1a3a1a', marginLeft: 4 }}>
              ◆ {formatGold(nextTier.goldCost)}
            </span>
          </button>
        ) : (
          <div
            className="w-full font-pixel text-center"
            style={{ color: '#1a4a1a', fontSize: '6px', padding: '6px', border: '1px solid #0a2a0a', letterSpacing: '1px' }}
          >
            MAX TIER REACHED — SILICON GHOST BOARD INSTALLED
          </div>
        )}
      </div>
    </div>
  );
};

// ── Slot Tab ───────────────────────────────────────────────────────────────

interface SlotTabProps {
  slot: ItemSlot;
  equipped: GameState['equippedItems'];
  inventory: HardwareItem[];
  slotCount: number;
  itemPlugin: ItemPlugin | undefined;
}

const SlotTab: React.FC<SlotTabProps> = ({ slot, equipped, inventory, slotCount, itemPlugin }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const color = SLOT_COLOR[slot];
  const Icon = SLOT_ICON[slot];
  const slotArray = equipped[slot] ?? [null];
  const inventoryForSlot = inventory.filter(i => i.slot === slot);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Installed slots */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #0a0a18', flexShrink: 0 }}>
        <div className="font-pixel mb-2" style={{ color: `${color}66`, fontSize: '6px', letterSpacing: '2px' }}>
          INSTALLED
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${slotCount}, 1fr)`,
            gap: 6,
          }}
        >
          {Array.from({ length: slotCount }).map((_, i) => {
            const item = slotArray[i] ?? null;

            if (item) {
              return (
                <div
                  key={i}
                  style={{
                    background: `${RARITY_COLOR[item.rarity]}0a`,
                    border: `1px solid ${RARITY_COLOR[item.rarity]}`,
                    padding: '7px 8px',
                    boxShadow: RARITY_GLOW[item.rarity],
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: RARITY_COLOR[item.rarity] }} />
                  <div style={{ paddingLeft: 6 }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Icon size={8} color={RARITY_COLOR[item.rarity]} />
                      <div className="font-pixel" style={{ color: RARITY_COLOR[item.rarity], fontSize: '6px' }}>
                        {item.name}
                      </div>
                    </div>
                    <div style={{ color: '#3a4a3a', fontFamily: 'var(--font-mono)', fontSize: '7px', marginBottom: 3 }}>
                      {item.rarity} T{item.tier}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                      {item.stats.map((stat, si) => (
                        <span key={si} style={{ fontFamily: 'var(--font-mono)', fontSize: '7px' }}>
                          <span style={{ color: '#3a4a3a' }}>{getStatLabel(stat.type)}: </span>
                          <span style={{ color: RARITY_COLOR[item.rarity] }}>{formatStatValue(stat)}</span>
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => itemPlugin?.unequip(slot, i)}
                      style={{
                        marginTop: 5,
                        background: 'none',
                        border: `1px solid ${color}33`,
                        color: `${color}55`,
                        padding: '2px 0',
                        fontSize: '7px',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        width: '100%',
                        letterSpacing: '1px',
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                style={{
                  background: '#040010',
                  border: `1px dashed ${color}20`,
                  padding: '10px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  minHeight: 70,
                }}
              >
                <Icon size={12} color={`${color}2a`} />
                <div style={{ color: `${color}2a`, fontFamily: 'var(--font-mono)', fontSize: '7px' }}>
                  SLOT {i + 1} EMPTY
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory for this slot type */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div className="font-pixel mb-1" style={{ color: '#1a3a2a', fontSize: '6px', letterSpacing: '2px', flexShrink: 0 }}>
          STORAGE · {inventoryForSlot.length} {slot} ITEMS
        </div>

        {inventoryForSlot.length === 0 ? (
          <div style={{
            color: '#1a2a1a',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 2,
          }}>
            NO {slot} HARDWARE IN STORAGE<br />
            <span style={{ color: '#0f1a0f' }}>DEFEAT ENEMIES TO FIND HARDWARE</span>
          </div>
        ) : (
          inventoryForSlot.map(item => (
            <div key={item.id}>
              <ItemCard
                item={item}
                selected={selectedId === item.id}
                onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}
              />
              {selectedId === item.id && (
                <button
                  onClick={() => {
                    itemPlugin?.equip(item.id);
                    setSelectedId(null);
                  }}
                  className="w-full font-pixel"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}`,
                    borderTop: 'none',
                    color,
                    padding: '5px',
                    fontSize: '6px',
                    cursor: 'pointer',
                    letterSpacing: '1px',
                  }}
                >
                  INSTALL INTO {SLOT_FULL_LABEL[slot]}
                </button>
              )}
            </div>
          ))
        )}
      </div>
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('board');

  const itemPlugin = engine.getPlugin<ItemPlugin>('items');
  const currentTierDef = MOBO_TIERS[motherboardTier] ?? MOBO_TIERS[0];

  const allEquipped = Object.values(equipped).flat().filter(Boolean).length;
  const totalSlots = 2 + ramSlots + expansionSlots;

  const TABS: { id: ActiveTab; label: string; badgeCount?: number }[] = [
    { id: 'board', label: 'BOARD' },
    { id: 'CPU', label: 'CPU', badgeCount: (equipped.CPU ?? [null]).filter(Boolean).length },
    { id: 'GPU', label: 'GPU', badgeCount: (equipped.GPU ?? [null]).filter(Boolean).length },
    { id: 'RAM', label: `RAM ×${ramSlots}`, badgeCount: (equipped.RAM ?? [null]).filter(Boolean).length },
    { id: 'EXPANSION', label: `EXP ×${expansionSlots}`, badgeCount: (equipped.EXPANSION ?? [null]).filter(Boolean).length },
  ];

  const getSlotCount = (tab: ActiveTab): number => {
    if (tab === 'RAM') return ramSlots;
    if (tab === 'EXPANSION') return expansionSlots;
    return 1;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Popup window */}
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '88vh',
          background: '#030008',
          border: '1px solid #180a28',
          boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 40px rgba(0,245,255,0.04), inset 0 0 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Corner chrome */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: '2px solid #00f5ff33', borderLeft: '2px solid #00f5ff33', zIndex: 1 }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderTop: '2px solid #00f5ff33', borderRight: '2px solid #00f5ff33', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderBottom: '2px solid #00f5ff1a', borderLeft: '2px solid #00f5ff1a', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottom: '2px solid #00f5ff1a', borderRight: '2px solid #00f5ff1a', zIndex: 1 }} />

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
              background: 'none',
              border: '1px solid #1a1a2a',
              color: '#3a4a5a',
              width: 24, height: 24,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex"
          style={{ background: '#040010', borderBottom: '1px solid #0f0818', flexShrink: 0, overflowX: 'auto' }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const tabColor = tab.id === 'board' ? '#00f5ff' : SLOT_COLOR[tab.id as ItemSlot];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="font-pixel flex items-center gap-1"
                style={{
                  padding: '7px 11px',
                  fontSize: '6px',
                  letterSpacing: '1px',
                  background: isActive ? `${tabColor}08` : 'none',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${tabColor}` : '2px solid transparent',
                  color: isActive ? tabColor : '#2a3a4a',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
              >
                {tab.id !== 'board' &&
                  React.createElement(SLOT_ICON[tab.id as ItemSlot], {
                    size: 9,
                    color: isActive ? tabColor : '#2a3a4a',
                  })
                }
                {tab.label}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span style={{
                    background: tabColor,
                    color: '#000',
                    padding: '0 3px',
                    fontSize: '6px',
                    lineHeight: '12px',
                    minWidth: 12,
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'board' ? (
            <BoardTab
              engine={engine}
              equipped={equipped}
              ramSlots={ramSlots}
              expansionSlots={expansionSlots}
              onGoToSlot={slot => setActiveTab(slot)}
            />
          ) : (
            <SlotTab
              slot={activeTab as ItemSlot}
              equipped={equipped}
              inventory={inventory}
              slotCount={getSlotCount(activeTab)}
              itemPlugin={itemPlugin}
            />
          )}
        </div>
      </div>
    </div>
  );
};
