import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Swords, Crown, Skull, Clock, Zap, RefreshCw } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import type { ClanBossPlugin, ClanBossContribution } from '../../plugins/ClanBossPlugin';
import type { ClanPlugin } from '../../plugins/ClanPlugin';
import { CLAN_BOSS_CONFIG } from '../../config/game.config';
import { formatNumber } from '../../utils/format';

interface ClanBossScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

/** Subscribe to the ClanBossPlugin's snapshot and re-render on changes. */
function useClanBoss(engine: GameEngine) {
  const plugin = engine.getPlugin<ClanBossPlugin>('clan_boss');
  const [, force] = useState(0);
  useEffect(() => {
    if (!plugin) return;
    return plugin.subscribe(() => force(t => (t + 1) % 1_000_000));
  }, [plugin]);
  return plugin;
}

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'EXPIRED';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

export function ClanBossScreen({ engine, onClose }: ClanBossScreenProps) {
  const plugin = useClanBoss(engine);
  const boss = plugin?.getBoss() ?? null;
  const contributions = plugin?.getContributions() ?? [];
  const myContribution = plugin?.getMyContribution() ?? null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floatHits, setFloatHits] = useState<Array<{ id: number; dmg: number }>>([]);
  const hitId = useRef(0);
  const [, tick] = useState(0);

  // Drive the countdown + cooldown bar
  useEffect(() => {
    const t = setInterval(() => tick(x => (x + 1) % 1_000_000), 500);
    return () => clearInterval(t);
  }, []);

  const myClan = engine.getPlugin<ClanPlugin>('clan')?.getMyClan() ?? null;

  const handleAttack = useCallback(async () => {
    if (!plugin || busy) return;
    setError(null);
    const result = await plugin.attack();
    if (!result.success) {
      if (result.error && result.error !== 'Attack on cooldown') setError(result.error);
      return;
    }
    if (result.damage) {
      const id = hitId.current++;
      setFloatHits(prev => [...prev, { id, dmg: result.damage! }]);
      setTimeout(() => setFloatHits(prev => prev.filter(h => h.id !== id)), 900);
    }
  }, [plugin, busy]);

  const handleSpawn = useCallback(async () => {
    if (!plugin || busy) return;
    setBusy(true);
    setError(null);
    const tier = Math.max(1, Math.floor((myClan?.total_stage ?? 100) / 100));
    const result = await plugin.spawnBoss(tier);
    if (!result.success) setError(result.error ?? 'Failed to summon boss');
    setBusy(false);
  }, [plugin, busy, myClan]);

  const cooldownRemaining = plugin?.getAttackCooldownRemaining() ?? 0;
  const onCooldown = cooldownRemaining > 0;
  const attackDamage = plugin?.getAttackDamage() ?? 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440, height: '90vh', maxHeight: 720,
          background: '#05050a', border: '1px solid #ff003344',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 0 40px #ff003322',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderBottom: '1px solid #1a0a0e', background: '#0a0306',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Swords size={16} color="#ff0033" />
            <span className="font-pixel" style={{ color: '#ff3355', fontSize: '10px', letterSpacing: '1px' }}>CLAN RAID BOSS</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#5a3a4a', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!myClan ? (
            <EmptyState
              icon={<Crown size={28} color="#3a2a3a" />}
              title="NO CLAN"
              text="Join or create a clan to take on raid bosses with your team."
            />
          ) : !boss ? (
            <NoBossState onSummon={handleSpawn} busy={busy} error={error} />
          ) : (
            <>
              {/* Boss banner */}
              <div style={{ position: 'relative', padding: '20px 16px', borderBottom: '1px solid #1a0a0e', textAlign: 'center' }}>
                <div style={{
                  width: 96, height: 96, margin: '0 auto 12px',
                  background: boss.status === 'defeated' ? '#0a0a0a' : 'radial-gradient(circle, #1a0008 0%, #05050a 70%)',
                  border: `2px solid ${boss.status === 'defeated' ? '#2a2a2a' : '#ff0033'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: boss.status === 'defeated' ? 'none' : '0 0 24px #ff003355',
                  animation: boss.status === 'active' ? 'pulse 2s ease-in-out infinite' : 'none',
                }}>
                  <Skull size={48} color={boss.status === 'defeated' ? '#3a3a3a' : '#ff3355'} />
                </div>

                {/* Floating damage numbers */}
                {floatHits.map(h => (
                  <div key={h.id} style={{
                    position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
                    color: '#ffcc00', fontFamily: 'var(--font-pixel)', fontSize: '12px',
                    pointerEvents: 'none', animation: 'floatUp 0.9s ease-out forwards',
                  }}>
                    -{formatNumber(h.dmg)}
                  </div>
                ))}

                <div className="font-pixel" style={{ color: '#e0e8f0', fontSize: '12px', marginBottom: 4 }}>{boss.name}</div>
                <div style={{ color: '#7a5a6a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                  TIER {boss.tier} {boss.status === 'active' ? '• ACTIVE' : boss.status === 'defeated' ? '• DEFEATED' : '• EXPIRED'}
                </div>

                {/* HP bar */}
                <div style={{ marginTop: 14 }}>
                  <div style={{
                    height: 18, background: '#1a0006', border: '1px solid #ff003344',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0, width: `${Math.max(0, (boss.current_hp / boss.max_hp) * 100)}%`,
                      background: 'linear-gradient(90deg, #ff0033, #ff5577)',
                      transition: 'width 0.3s ease-out',
                    }} />
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#fff', textShadow: '0 0 3px #000',
                    }}>
                      {formatNumber(Math.max(0, boss.current_hp))} / {formatNumber(boss.max_hp)}
                    </div>
                  </div>
                  {boss.status === 'active' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6, color: '#5a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                      <Clock size={9} /> {timeLeft(boss.expires_at)} REMAINING
                    </div>
                  )}
                </div>
              </div>

              {/* Attack action */}
              {boss.status === 'active' ? (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #12060a' }}>
                  <button
                    onClick={handleAttack}
                    disabled={onCooldown}
                    style={{
                      width: '100%', padding: '14px', cursor: onCooldown ? 'wait' : 'pointer',
                      background: onCooldown ? '#1a0a0e' : 'linear-gradient(180deg, #ff0033, #cc0022)',
                      border: '1px solid #ff3355', color: '#fff',
                      fontFamily: 'var(--font-pixel)', fontSize: '11px', letterSpacing: '1px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <Zap size={14} />
                    {onCooldown ? 'CHARGING...' : 'ATTACK'}
                    {onCooldown && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, height: 2, background: '#ff8899',
                        width: `${100 - (cooldownRemaining / CLAN_BOSS_CONFIG.attackCooldownMs) * 100}%`,
                      }} />
                    )}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 6, color: '#7a5a6a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                    YOUR HIT: <span style={{ color: '#ffcc00' }}>{formatNumber(attackDamage)}</span> DMG
                  </div>
                  {error && <div style={{ textAlign: 'center', marginTop: 6, color: '#ff4444', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>{error}</div>}
                </div>
              ) : (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #12060a' }}>
                  {boss.status === 'defeated' ? (
                    <div style={{ textAlign: 'center', color: '#00ff88', fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>
                      BOSS DEFEATED
                    </div>
                  ) : (
                    <button
                      onClick={handleSpawn}
                      disabled={busy}
                      style={{
                        width: '100%', padding: '12px', cursor: busy ? 'wait' : 'pointer',
                        background: '#0a0306', border: '1px solid #ff3355', color: '#ff3355',
                        fontFamily: 'var(--font-pixel)', fontSize: '10px',
                      }}
                    >
                      {busy ? 'SUMMONING...' : 'SUMMON NEW BOSS'}
                    </button>
                  )}
                </div>
              )}

              {/* Contribution leaderboard */}
              <div style={{ flex: 1, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="font-pixel" style={{ color: '#3a4a5a', fontSize: '6px', letterSpacing: '2px' }}>{'> DAMAGE DEALERS'}</div>
                  <button
                    onClick={() => plugin?.refresh()}
                    style={{ background: 'transparent', border: 'none', color: '#2a3a4a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                  >
                    <RefreshCw size={9} color="#2a3a4a" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px' }}>REFRESH</span>
                  </button>
                </div>

                {contributions.length === 0 ? (
                  <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '9px', textAlign: 'center', padding: '20px 0' }}>
                    No damage yet. Be the first to strike!
                  </div>
                ) : (
                  contributions.map((c, i) => (
                    <ContributionRow
                      key={c.id}
                      contribution={c}
                      rank={i + 1}
                      isMe={c.user_id === myContribution?.user_id}
                      maxDamage={contributions[0]?.damage || 1}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatUp { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -40px); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 24px #ff003355; } 50% { box-shadow: 0 0 36px #ff0033aa; } }
      `}</style>
    </div>
  );
}

function ContributionRow({ contribution, rank, isMe, maxDamage }: {
  contribution: ClanBossContribution;
  rank: number;
  isMe: boolean;
  maxDamage: number;
}) {
  const rankColor = rank === 1 ? '#ffcc00' : rank === 2 ? '#c0c0d0' : rank === 3 ? '#cd7f32' : '#3a4a5a';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', marginBottom: 4,
      background: isMe ? '#0a1015' : '#06060e', border: `1px solid ${isMe ? '#00f5ff44' : '#12121a'}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, width: `${(contribution.damage / maxDamage) * 100}%`,
        background: isMe ? '#00f5ff0d' : '#ff00330a',
      }} />
      <span className="font-pixel" style={{ color: rankColor, fontSize: '8px', width: 16, position: 'relative' }}>#{rank}</span>
      <span style={{ flex: 1, color: isMe ? '#00f5ff' : '#c0c8d0', fontFamily: 'var(--font-mono)', fontSize: '9px', position: 'relative' }}>
        {contribution.handle}{isMe ? ' (you)' : ''}
      </span>
      <span className="font-pixel" style={{ color: '#ffcc00', fontSize: '8px', position: 'relative' }}>
        {formatNumber(contribution.damage)}
      </span>
    </div>
  );
}

function NoBossState({ onSummon, busy, error }: { onSummon: () => void; busy: boolean; error: string | null }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, marginBottom: 16,
        background: 'radial-gradient(circle, #1a0008 0%, #05050a 70%)', border: '1px dashed #ff003344',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Skull size={36} color="#5a2a3a" />
      </div>
      <div className="font-pixel" style={{ color: '#e0e8f0', fontSize: '11px', marginBottom: 8 }}>NO ACTIVE BOSS</div>
      <div style={{ color: '#5a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px', lineHeight: 1.5, marginBottom: 20, maxWidth: 260 }}>
        Summon a raid boss with colossal HP. Rally your whole clan — everyone&apos;s damage chips away at the same health pool.
      </div>
      <button
        onClick={onSummon}
        disabled={busy}
        style={{
          padding: '12px 24px', cursor: busy ? 'wait' : 'pointer',
          background: 'linear-gradient(180deg, #ff0033, #cc0022)', border: '1px solid #ff3355',
          color: '#fff', fontFamily: 'var(--font-pixel)', fontSize: '10px', letterSpacing: '1px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <Swords size={14} />
        {busy ? 'SUMMONING...' : 'SUMMON BOSS'}
      </button>
      {error && <div style={{ marginTop: 12, color: '#ff4444', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>{error}</div>}
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ marginBottom: 14 }}>{icon}</div>
      <div className="font-pixel" style={{ color: '#e0e8f0', fontSize: '11px', marginBottom: 8 }}>{title}</div>
      <div style={{ color: '#5a6a7a', fontFamily: 'var(--font-mono)', fontSize: '9px', lineHeight: 1.5, maxWidth: 260 }}>{text}</div>
    </div>
  );
}
