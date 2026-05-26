import React, { useState } from 'react';
import { X, Cpu, MemoryStick, Zap, PlusSquare, CircuitBoard, ArrowUpCircle } from 'lucide-react';
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

// ── Constants ──────────────────────────────────────────────────────────────

const RARITY_COLOR: Record<ItemRarity, string> = {
  Common: '#6b7a8d',
  Rare: '#00f5ff',
  Epic: '#ffaa00',
  Legendary: '#ff0080',
};

const RARITY_GLOW: Record<ItemRarity, string> = {
  Common: 'none',
  Rare: '0 0 8px rgba(0,245,255,0.45)',
  Epic: '0 0 10px rgba(255,170,0,0.5)',
  Legendary: '0 0 14px rgba(255,0,128,0.7)',
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

function formatGold(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
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
  const gold = useGameState(engine, s => s.gold);
  const motherboardTier = useGameState(engine, s => s.motherboardTier ?? 0);

  const currentTier = MOBO_TIERS[motherboardTier] ?? MOBO_TIERS[0];
  const nextTier = MOBO_TIERS[motherboardTier + 1] ?? null;
  const canUpgrade = !!nextTier && gold >= nextTier.goldCost;

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
            {nextTier.revision} · ◆{formatGold(nextTier.goldCost)}
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

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${rc}14` : '#050010',
        border: `1px solid ${selected ? rc : `${rc}44`}`,
        padding: '7px 9px', cursor: 'pointer',
        boxShadow: selected ? RARITY_GLOW[item.rarity] : 'none',
        position: 'relative', transition: 'border-color 0.12s, box-shadow 0.12s',
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
          <div style={{ color: '#2a3a4a', fontFamily: 'var(--font-mono)', fontSize: '8px', fontStyle: 'italic', lineHeight: 1.4, marginTop: 2 }}>
            {item.flavorText}
          </div>
          <div className="flex flex-wrap gap-x-3 mt-1">
            {item.stats.map((stat, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                <span style={{ color: '#3a4a3a' }}>{getStatLabel(stat.type)}: </span>
                <span style={{ color: rc }}>{formatStatValue(stat)}</span>
              </span>
            ))}
          </div>
        </div>
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
}

const SlotPanel: React.FC<SlotPanelProps> = ({
  activeSlot, onSelectSlot, equipped, inventory, ramSlots, expansionSlots, itemPlugin,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const slot = activeSlot;
  const color = SLOT_COLOR[slot];
  const Icon = SLOT_ICON[slot];
  const slotArray = Array.isArray(equipped[slot]) ? (equipped[slot] as (HardwareItem | null)[]) : [equipped[slot] as HardwareItem | null];
  const slotCount = slot === 'RAM' ? ramSlots : slot === 'EXPANSION' ? expansionSlots : 1;
  const inventoryForSlot = inventory.filter(i => i.slot === slot);

  const TABS: ItemSlot[] = ['CPU', 'GPU', 'RAM', 'EXPANSION'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
      <div style={{ flexShrink: 0, borderBottom: '1px solid #0a0818', padding: '8px 12px', background: '#030010' }}>
        <div className="font-pixel mb-2" style={{ color: `${color}55`, fontSize: '6px', letterSpacing: '2px' }}>
          INSTALLED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${slotCount}, 1fr)`, gap: 6 }}>
          {Array.from({ length: slotCount }).map((_, i) => {
            const item = slotArray[i] ?? null;
            if (item) {
              return (
                <div
                  key={i}
                  style={{
                    background: `${RARITY_COLOR[item.rarity]}0a`,
                    border: `1px solid ${RARITY_COLOR[item.rarity]}`,
                    padding: '6px 8px', boxShadow: RARITY_GLOW[item.rarity], position: 'relative',
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
                    <div className="flex flex-wrap gap-x-2">
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
                        marginTop: 4, background: 'none',
                        border: `1px solid ${color}33`, color: `${color}55`,
                        padding: '2px 0', fontSize: '7px', fontFamily: 'var(--font-mono)',
                        cursor: 'pointer', width: '100%', letterSpacing: '1px',
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div className="font-pixel mb-1" style={{ color: '#1a3a2a', fontSize: '6px', letterSpacing: '2px', flexShrink: 0 }}>
          STORAGE · {inventoryForSlot.length} {slot} ITEMS
        </div>

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
                <button
                  onClick={() => { itemPlugin?.equip(item.id); setSelectedItemId(null); }}
                  className="w-full font-pixel"
                  style={{
                    background: `${color}18`, border: `1px solid ${color}`, borderTop: 'none',
                    color, padding: '5px', fontSize: '6px', cursor: 'pointer', letterSpacing: '1px',
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

  const [activeSlot, setActiveSlot] = useState<ItemSlot>('CPU');

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
          height: 'min(88vh, 680px)',
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

        {/* BOTTOM 65%: Slot tabs + item management */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <SlotPanel
            activeSlot={activeSlot}
            onSelectSlot={setActiveSlot}
            equipped={equipped}
            inventory={inventory}
            ramSlots={ramSlots}
            expansionSlots={expansionSlots}
            itemPlugin={itemPlugin}
          />
        </div>
      </div>
    </div>
  );
};
