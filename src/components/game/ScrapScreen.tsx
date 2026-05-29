import React, { useState, useMemo } from 'react';
import { X, Trash2, Cpu, MemoryStick, Zap, PlusSquare, CheckSquare, Square, Package } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import type { HardwareItem, ItemSlot, ItemRarity, ModifierDef } from '../../engine/types';
import type { ItemPlugin } from '../../plugins/ItemPlugin';

interface ScrapScreenProps {
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

const SLOT_ICON: Record<ItemSlot, React.FC<{ size?: number; color?: string }>> = {
  RAM: ({ size = 14, color }) => <MemoryStick size={size} color={color} />,
  GPU: ({ size = 14, color }) => <Zap size={size} color={color} />,
  CPU: ({ size = 14, color }) => <Cpu size={size} color={color} />,
  EXPANSION: ({ size = 14, color }) => <PlusSquare size={size} color={color} />,
};

const RARITY_ORDER: ItemRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

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

// ── Scrap Item Card ────────────────────────────────────────────────────────

interface ScrapItemCardProps {
  item: HardwareItem;
  scrapValue: number;
  selected: boolean;
  onToggle: () => void;
}

const ScrapItemCard: React.FC<ScrapItemCardProps> = ({ item, scrapValue, selected, onToggle }) => {
  const rc = RARITY_COLOR[item.rarity];
  const Icon = SLOT_ICON[item.slot];

  return (
    <div
      onClick={onToggle}
      style={{
        background: selected ? `${rc}18` : '#050010',
        border: `1px solid ${selected ? rc : `${rc}44`}`,
        padding: '8px 10px', cursor: 'pointer',
        boxShadow: selected ? RARITY_GLOW[item.rarity] : 'none',
        position: 'relative', transition: 'all 0.15s',
      }}
    >
      {/* Selection indicator */}
      <div style={{ position: 'absolute', top: 6, right: 6 }}>
        {selected ? (
          <CheckSquare size={14} color={rc} />
        ) : (
          <Square size={14} color={`${rc}55`} />
        )}
      </div>

      {/* Scrap value badge */}
      <div
        style={{
          position: 'absolute', bottom: 6, right: 6,
          background: selected ? '#1a0808' : '#0a0808',
          border: `1px solid ${selected ? '#ff4444' : '#331a1a'}`,
          padding: '2px 5px',
        }}
      >
        <span className="font-pixel" style={{ color: selected ? '#ff4444' : '#553333', fontSize: '6px' }}>
          +{scrapValue} SCRAP
        </span>
      </div>

      {/* Left rarity indicator bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: rc, boxShadow: `0 0 4px ${rc}` }} />

      <div className="flex items-start gap-2" style={{ paddingLeft: 7, paddingRight: 50 }}>
        <Icon size={12} color={rc} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-pixel" style={{ color: rc, fontSize: '7px', letterSpacing: '0.5px' }}>
            {item.name}
          </div>
          <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            {item.rarity} T{item.tier}
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

// ── Filter Tabs ────────────────────────────────────────────────────────────

type FilterTab = 'all' | ItemRarity;

interface FilterTabsProps {
  active: FilterTab;
  onSelect: (tab: FilterTab) => void;
  counts: Record<FilterTab, number>;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ active, onSelect, counts }) => {
  const tabs: { id: FilterTab; label: string; color: string }[] = [
    { id: 'all', label: 'ALL', color: '#5a6a7a' },
    { id: 'Common', label: 'COM', color: RARITY_COLOR.Common },
    { id: 'Rare', label: 'RARE', color: RARITY_COLOR.Rare },
    { id: 'Epic', label: 'EPIC', color: RARITY_COLOR.Epic },
    { id: 'Legendary', label: 'LEG', color: RARITY_COLOR.Legendary },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const count = counts[tab.id] || 0;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="font-pixel"
            style={{
              background: isActive ? `${tab.color}18` : '#080810',
              border: `1px solid ${isActive ? tab.color : '#1a1a2a'}`,
              color: isActive ? tab.color : `${tab.color}66`,
              padding: '4px 8px', fontSize: '6px', letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {tab.label} ({count})
          </button>
        );
      })}
    </div>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────

export const ScrapScreen: React.FC<ScrapScreenProps> = ({ engine, onClose }) => {
  const inventory = useGameState(engine, s => s.inventory ?? []);
  const scrap = useGameState(engine, s => s.scrap ?? 0);
  const itemPlugin = engine.getPlugin<ItemPlugin>('items');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [scrappingAnimation, setScrappingAnimation] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = [...inventory];
    if (filterTab !== 'all') {
      items = items.filter(i => i.rarity === filterTab);
    }
    // Sort by rarity (common first for scrapping), then by tier
    items.sort((a, b) => {
      const rarityDiff = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      return a.tier - b.tier;
    });
    return items;
  }, [inventory, filterTab]);

  // Count per rarity
  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: inventory.length, Common: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0 };
    for (const item of inventory) {
      c[item.rarity]++;
    }
    return c;
  }, [inventory]);

  // Calculate total scrap value
  const totalScrapValue = useMemo(() => {
    let total = 0;
    for (const id of selectedIds) {
      const item = inventory.find(i => i.id === id);
      if (item && itemPlugin) {
        total += itemPlugin.getScrapValue(item);
      }
    }
    return total;
  }, [selectedIds, inventory, itemPlugin]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const ids = new Set(selectedIds);
    for (const item of filteredItems) {
      ids.add(item.id);
    }
    setSelectedIds(ids);
  };

  const selectByRarity = (rarity: ItemRarity) => {
    const ids = new Set(selectedIds);
    for (const item of inventory) {
      if (item.rarity === rarity) ids.add(item.id);
    }
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleScrap = () => {
    if (selectedIds.size === 0 || !itemPlugin) return;
    
    setScrappingAnimation(true);
    
    // Small delay for visual feedback
    setTimeout(() => {
      itemPlugin.scrapItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      setScrappingAnimation(false);
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, maxHeight: '90vh',
          background: '#04040a',
          border: '1px solid #ff444455',
          boxShadow: '0 0 30px rgba(255,68,68,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#0a0408',
            borderBottom: '1px solid #331a1a',
          }}
        >
          <div className="flex items-center gap-3">
            <Trash2 size={18} color="#ff4444" />
            <div>
              <div className="font-pixel" style={{ color: '#ff4444', fontSize: '11px', letterSpacing: '2px' }}>
                SCRAPYARD
              </div>
              <div style={{ color: '#553333', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                Dismantle hardware for components
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} color="#553333" />
          </button>
        </div>

        {/* Scrap balance bar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#080408',
            borderBottom: '1px solid #1a1018',
          }}
        >
          <div className="flex items-center gap-2">
            <Package size={14} color="#ff6644" />
            <span className="font-pixel" style={{ color: '#ff6644', fontSize: '9px' }}>
              SCRAP: {scrap.toLocaleString()}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <div
              className={scrappingAnimation ? 'animate-pulse' : ''}
              style={{ 
                color: '#ff4444', fontFamily: 'var(--font-mono)', fontSize: '10px',
                background: '#1a0808', padding: '3px 8px', border: '1px solid #331a1a',
              }}
            >
              +{totalScrapValue} SCRAP
            </div>
          )}
        </div>

        {/* Filter + selection controls */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #1a1018',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          <FilterTabs active={filterTab} onSelect={setFilterTab} counts={counts} />
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={selectAllFiltered}
              className="font-pixel"
              style={{
                background: '#080810', border: '1px solid #2a2a3a',
                color: '#5a6a7a', padding: '3px 8px', fontSize: '6px',
                cursor: 'pointer',
              }}
            >
              SELECT VISIBLE
            </button>
            <button
              onClick={() => selectByRarity('Common')}
              className="font-pixel"
              style={{
                background: '#080810', border: '1px solid #2a3a3a',
                color: RARITY_COLOR.Common, padding: '3px 8px', fontSize: '6px',
                cursor: 'pointer',
              }}
            >
              ALL COMMON
            </button>
            <button
              onClick={clearSelection}
              className="font-pixel"
              style={{
                background: '#080810', border: '1px solid #2a2a3a',
                color: '#5a6a7a', padding: '3px 8px', fontSize: '6px',
                cursor: 'pointer',
              }}
            >
              CLEAR ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Items list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ 
              color: '#2a3a4a', fontFamily: 'var(--font-mono)', fontSize: '11px', 
              textAlign: 'center', padding: '40px 0',
            }}>
              {inventory.length === 0 
                ? 'No items in inventory. Kill enemies to get loot!'
                : 'No items match the current filter.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredItems.map(item => (
                <ScrapItemCard
                  key={item.id}
                  item={item}
                  scrapValue={itemPlugin?.getScrapValue(item) ?? 0}
                  selected={selectedIds.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - scrap action */}
        <div
          style={{
            padding: '12px 16px',
            background: '#0a0408',
            borderTop: '1px solid #331a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ color: '#3a3a4a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleScrap}
            disabled={selectedIds.size === 0 || scrappingAnimation}
            className="font-pixel flex items-center gap-2"
            style={{
              background: selectedIds.size > 0 ? '#1a0808' : '#080808',
              border: `1px solid ${selectedIds.size > 0 ? '#ff4444' : '#1a1a2a'}`,
              color: selectedIds.size > 0 ? '#ff4444' : '#2a2a3a',
              padding: '8px 16px', fontSize: '9px', letterSpacing: '2px',
              cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              boxShadow: selectedIds.size > 0 ? '0 0 12px rgba(255,68,68,0.2)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Trash2 size={14} />
            SCRAP{selectedIds.size > 0 ? ` (+${totalScrapValue})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
