import React, { useState, useEffect, useCallback } from 'react';
import { X, Zap, Cpu, Coins, Target, ShoppingBag, Diamond, Lock } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { OCT_CATALOG, DIAMOND_CATALOG, type ShopItem } from '../../plugins/ShopPlugin';
import type { ShopPlugin } from '../../plugins/ShopPlugin';

interface ShopScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  Zap, Cpu, Coins, Target,
};

const TIER_LABELS: Record<ShopItem['tier'], string> = {
  early: 'EARLY GAME',
  mid: 'MID GAME',
  late: 'LATE GAME',
  endgame: 'END GAME',
};

const TIER_COLORS: Record<ShopItem['tier'], string> = {
  early: '#5a6a7a',
  mid: '#39ff14',
  late: '#ffaa00',
  endgame: '#ff0080',
};

const IAP_BUNDLES = [
  { id: 'iap_50', diamonds: 50, price: '$0.99', label: 'STARTER PACK', color: '#5a7a8a' },
  { id: 'iap_150', diamonds: 150, price: '$2.49', label: 'SMALL CACHE', color: '#39ff14' },
  { id: 'iap_500', diamonds: 500, price: '$4.99', label: 'PAYLOAD', color: '#00f5ff', popular: true },
  { id: 'iap_1500', diamonds: 1500, price: '$9.99', label: 'ARSENAL', color: '#ffaa00' },
  { id: 'iap_5000', diamonds: 5000, price: '$24.99', label: 'SINGULARITY CACHE', color: '#ff0080' },
];

function ShopItemCard({
  item,
  canBuy,
  purchaseCount,
  onBuy,
}: {
  item: ShopItem;
  canBuy: boolean;
  purchaseCount: number;
  onBuy: () => void;
}) {
  const [flash, setFlash] = useState(false);
  const maxed = purchaseCount >= item.maxPurchases;
  const Icon = ICON_MAP[item.icon] ?? Zap;
  const currencyColor = item.currency === 'oct' ? '#ff0080' : '#00e5ff';
  const currencySymbol = item.currency === 'oct' ? 'OC' : '◈';

  const handleClick = () => {
    if (!canBuy || maxed) return;
    onBuy();
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  };

  return (
    <div
      style={{
        background: flash ? `${item.color}15` : '#0a0a12',
        border: `1px solid ${maxed ? '#1a1a1a' : canBuy ? item.color + '44' : '#151520'}`,
        padding: '9px 11px',
        marginBottom: 5,
        position: 'relative',
        transition: 'background 0.2s, border-color 0.2s',
        boxShadow: canBuy && !maxed ? `0 0 6px ${item.color}18` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 28, height: 28, flexShrink: 0,
          background: maxed ? '#0a0a0a' : `${item.color}10`,
          border: `1px solid ${maxed ? '#1a1a1a' : item.color + '33'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={12} color={maxed ? '#2a2a2a' : item.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-pixel" style={{ color: maxed ? '#2a2a2a' : item.color, fontSize: '7px', marginBottom: 2 }}>
            {item.name}
          </div>
          <div style={{ color: '#4a5a6a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
            {item.description}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          {maxed ? (
            <span className="font-pixel" style={{ color: '#39ff14', fontSize: '7px' }}>MAXED</span>
          ) : (
            <button
              onClick={handleClick}
              disabled={!canBuy}
              className="font-pixel"
              style={{
                background: canBuy ? `${item.color}15` : '#060606',
                border: `1px solid ${canBuy ? item.color : '#151515'}`,
                color: canBuy ? item.color : '#1a1a1a',
                padding: '4px 7px', fontSize: '7px', cursor: canBuy ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap', boxShadow: canBuy ? `0 0 5px ${item.color}28` : 'none',
              }}
            >
              {item.price} <span style={{ color: currencyColor }}>{currencySymbol}</span>
            </button>
          )}
          <span style={{ color: '#2a3a4a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
            {purchaseCount}/{item.maxPurchases}
          </span>
        </div>
      </div>
    </div>
  );
}

type ShopTab = 'oct' | 'diamond' | 'iap';

export const ShopScreen: React.FC<ShopScreenProps> = ({ engine, onClose }) => {
  const [tab, setTab] = useState<ShopTab>('oct');
  const overclockCount = useGameState(engine, s => s.overclockCount);
  const diamonds = useGameState(engine, s => s.diamonds);
  const shopPlugin = engine.getPlugin<ShopPlugin>('shop');
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => shopPlugin?.subscribe(refresh), [shopPlugin, refresh]);

  const renderTierGroup = (items: ShopItem[]) => {
    const tiers: ShopItem['tier'][] = ['early', 'mid', 'late', 'endgame'];
    return tiers.map(tier => {
      const group = items.filter(i => i.tier === tier);
      if (group.length === 0) return null;
      return (
        <div key={tier}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            margin: '10px 0 6px', padding: '0 2px',
          }}>
            <div style={{ flex: 1, height: 1, background: TIER_COLORS[tier] + '28' }} />
            <span className="font-pixel" style={{ color: TIER_COLORS[tier], fontSize: '6px', letterSpacing: '2px' }}>
              {TIER_LABELS[tier]}
            </span>
            <div style={{ flex: 1, height: 1, background: TIER_COLORS[tier] + '28' }} />
          </div>
          {group.map(item => (
            <ShopItemCard
              key={item.id}
              item={item}
              canBuy={shopPlugin?.canBuy(item) ?? false}
              purchaseCount={shopPlugin?.getPurchaseCount(item.id) ?? 0}
              onBuy={() => shopPlugin?.buy(item.id)}
            />
          ))}
        </div>
      );
    });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480, maxHeight: '90vh', background: '#0a0a12',
        border: '1px solid #1a2a3a', display: 'flex', flexDirection: 'column', margin: '0 12px',
        boxShadow: '0 0 40px rgba(0,245,255,0.06)',
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0, padding: '12px 14px', borderBottom: '1px solid #1a2a3a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#050510',
        }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={13} color="#00f5ff" />
            <span className="font-pixel" style={{ color: '#00f5ff', fontSize: '10px', letterSpacing: '2px' }}>BLACK MARKET</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span style={{ color: '#ff0080', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>OC</span>
              <span className="font-pixel" style={{ color: '#ff0080', fontSize: '10px' }}>{overclockCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: '#00e5ff', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>◈</span>
              <span className="font-pixel" style={{ color: '#00e5ff', fontSize: '10px' }}>{diamonds}</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid #1a2a3a', color: '#3a4a5a', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = '#ff4444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3a4a5a'; e.currentTarget.style.borderColor = '#1a2a3a'; }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #1a2a3a' }}>
          {([
            { key: 'oct' as ShopTab, label: 'OC STORE', color: '#ff0080', bg: '#130010' },
            { key: 'diamond' as ShopTab, label: '◈ DIAMONDS', color: '#00e5ff', bg: '#001520' },
            { key: 'iap' as ShopTab, label: 'BUY ◈', color: '#ffaa00', bg: '#130a00' },
          ] as const).map(({ key, label, color, bg }) => (
            <button key={key} onClick={() => setTab(key)} className="font-pixel" style={{
              background: tab === key ? bg : 'transparent', border: 'none',
              borderBottom: tab === key ? `2px solid ${color}` : '2px solid transparent',
              color: tab === key ? color : '#3a4a5a', padding: '9px', fontSize: '7px',
              letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{ flexShrink: 0, padding: '7px 13px', background: '#06060e', borderBottom: '1px solid #10182a' }}>
          {tab === 'oct' && <div style={{ color: '#4a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>Spend OC tokens earned from Overclock runs. Prices are steep — this is end-game investment.</div>}
          {tab === 'diamond' && <div style={{ color: '#4a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>Diamonds ◈ are earned from daily ops and tournaments. Rare and powerful.</div>}
          {tab === 'iap' && <div style={{ color: '#5a4a2a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>Purchase diamond bundles to accelerate your progress. Real-money transactions.</div>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 11px 12px' }}>
          {tab === 'oct' && renderTierGroup(OCT_CATALOG)}
          {tab === 'diamond' && renderTierGroup(DIAMOND_CATALOG)}
          {tab === 'iap' && (
            <div style={{ paddingTop: 8 }}>
              {IAP_BUNDLES.map(bundle => (
                <div key={bundle.id} style={{
                  position: 'relative', background: '#0a0a0a',
                  border: `1px solid ${bundle.color}33`, padding: '13px 14px', marginBottom: 8,
                  boxShadow: bundle.popular ? `0 0 12px ${bundle.color}18` : 'none',
                }}>
                  {bundle.popular && (
                    <div className="font-pixel" style={{
                      position: 'absolute', top: -1, right: 12,
                      background: '#00f5ff', color: '#000', fontSize: '6px',
                      padding: '2px 6px', letterSpacing: '1px',
                    }}>
                      BEST VALUE
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="font-pixel" style={{ color: bundle.color, fontSize: '8px', marginBottom: 3 }}>
                        {bundle.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Diamond size={12} color="#00e5ff" />
                        <span className="font-pixel" style={{ color: '#00e5ff', fontSize: '13px' }}>{bundle.diamonds}</span>
                        <span style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>diamonds</span>
                      </div>
                    </div>
                    <button
                      disabled
                      className="font-pixel"
                      style={{
                        background: '#0a0808', border: `1px solid ${bundle.color}55`,
                        color: bundle.color + '66', padding: '8px 12px', fontSize: '8px',
                        cursor: 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <Lock size={10} color={bundle.color + '55'} />
                      <span>{bundle.price}</span>
                      <span style={{ fontSize: '6px', letterSpacing: '1px', opacity: 0.5 }}>SOON</span>
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ color: '#2a3a3a', fontFamily: 'var(--font-mono)', fontSize: '8px', textAlign: 'center', marginTop: 12, padding: '0 8px' }}>
                Real-money purchases will be available in a future update. Diamonds earned in-game are identical in function.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
