import React, { useState, useEffect } from 'react';
import { Lock, Zap, Wifi, Cpu } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import {
  calculateOverclockGain,
  calculateTier,
  OVERCLOCK_PERKS,
  BRANCH_COLORS,
  TIER_NAMES,
  getOverclockPerkLevel,
  isPerkUnlocked,
} from '../../plugins/OverclockPlugin';
import type { OverclockPlugin, PerkBranch } from '../../plugins/OverclockPlugin';

interface OverclockPanelProps {
  engine: GameEngine;
}

const BRANCH_ICONS: Record<PerkBranch, React.ReactNode> = {
  VOLTAGE: <Zap size={10} />,
  SIGNAL: <Wifi size={10} />,
  THERMAL: <Cpu size={10} />,
};

const TIER_COLORS = [
  '#5a6a7a',
  '#00f5ff',
  '#ffaa00',
  '#ff0080',
  '#39ff14',
  '#ffffff',
];

const MILESTONE_STAGES = [25, 50, 100, 200];

export const OverclockPanel: React.FC<OverclockPanelProps> = ({ engine }) => {
  const highestStage = useGameState(engine, s => s.highestStage ?? s.stage);
  const stage = useGameState(engine, s => s.stage);
  const overclockCount = useGameState(engine, s => s.overclockCount);
  const totalOverclocks = useGameState(engine, s => s.totalOverclocks ?? 0);
  const overclockTier = useGameState(engine, s => s.overclockTier ?? 0);
  const upgrades = useGameState(engine, s => s.overclockUpgrades ?? {});

  const [confirming, setConfirming] = useState(false);
  const [pulse, setPulse] = useState(false);

  const plugin = engine.getPlugin<OverclockPlugin>('overclock');
  const gain = calculateOverclockGain(highestStage, overclockTier);
  const canOverclock = gain > 0;
  const available = plugin?.getAvailableOCT() ?? 0;
  const spent = plugin?.getSpentOCT() ?? 0;

  const isMaxTier = overclockTier >= TIER_NAMES.length - 1;
  const tierName = TIER_NAMES[overclockTier] ?? TIER_NAMES[TIER_NAMES.length - 1];
  const tierColor = TIER_COLORS[overclockTier] ?? '#ffffff';
  const tierProgress = (totalOverclocks % 3) / 3;

  const newTierAfterReset = calculateTier(totalOverclocks + 1);
  const tierWillIncrease = newTierAfterReset > overclockTier;

  const nextMilestone = MILESTONE_STAGES.find(s => s > highestStage);

  useEffect(() => {
    if (!canOverclock) return;
    const interval = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(interval);
  }, [canOverclock]);

  const handleOverclock = () => {
    plugin?.perform();
    setConfirming(false);
  };

  const branches: PerkBranch[] = ['VOLTAGE', 'SIGNAL', 'THERMAL'];

  return (
    <div className="flex flex-col gap-2" style={{ height: '100%' }}>

      {/* ── Tier + OCT header ───────────────────────────────── */}
      <div
        className="pixel-border"
        style={{
          background: '#06000f',
          borderColor: tierColor,
          padding: '10px 12px',
          boxShadow: `0 0 16px ${tierColor}22`,
          flexShrink: 0,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="font-pixel"
              style={{
                color: tierColor,
                fontSize: '6px',
                letterSpacing: '2px',
                padding: '2px 6px',
                border: `1px solid ${tierColor}`,
                background: `${tierColor}18`,
                boxShadow: `0 0 8px ${tierColor}44`,
              }}
            >
              {tierName}
            </div>
            {!isMaxTier && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#3a4a5a' }}>
                T{overclockTier} → T{overclockTier + 1} in {3 - (totalOverclocks % 3)} runs
              </div>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#2a3a4a' }}>
            #{totalOverclocks} REBOOTS
          </div>
        </div>

        {!isMaxTier && (
          <div style={{ height: 2, background: '#1a1a2a', marginBottom: 8, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${tierProgress * 100}%`,
                background: `linear-gradient(90deg, ${tierColor}88, ${tierColor})`,
                boxShadow: `0 0 6px ${tierColor}`,
                transition: 'width 0.4s',
              }}
            />
          </div>
        )}

        <div className="flex items-end gap-3">
          <div>
            <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>OCT TOTAL</div>
            <div
              className="font-pixel"
              style={{
                color: '#ff0080',
                fontSize: '22px',
                textShadow: '0 0 12px rgba(255,0,128,0.6)',
                lineHeight: 1,
              }}
            >
              {overclockCount}
            </div>
          </div>
          <div style={{ color: '#1a1a2a', fontSize: '14px', marginBottom: 2 }}>|</div>
          <div>
            <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>SPENT</div>
            <div className="font-pixel" style={{ color: '#4a2a4a', fontSize: '14px' }}>{spent}</div>
          </div>
          <div style={{ color: '#1a1a2a', fontSize: '14px', marginBottom: 2 }}>|</div>
          <div>
            <div style={{ color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>FREE</div>
            <div
              className="font-pixel"
              style={{
                color: available > 0 ? '#00f5ff' : '#2a3a4a',
                fontSize: '14px',
                textShadow: available > 0 ? '0 0 8px rgba(0,245,255,0.5)' : 'none',
              }}
            >
              {available}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between mt-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}
        >
          <div>
            <span style={{ color: '#2a3a4a' }}>STAGE </span>
            <span style={{ color: '#00f5ff' }}>{stage}</span>
            <span style={{ color: '#2a3a4a' }}> / PEAK </span>
            <span style={{ color: canOverclock ? '#ff0080' : '#2a3a4a' }}>{highestStage}</span>
          </div>
          <div>
            {canOverclock ? (
              <span style={{ color: '#ff0080' }}>+{gain} OCT ON RESET</span>
            ) : nextMilestone ? (
              <span style={{ color: '#2a3a4a' }}>MILESTONE AT STG {nextMilestone}</span>
            ) : (
              <span style={{ color: '#2a3a4a' }}>REACH STG 10</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Branch perk columns ─────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {branches.map(branch => {
          const branchPerks = OVERCLOCK_PERKS.filter(p => p.branch === branch).sort(
            (a, b) => a.branchRank - b.branchRank,
          );
          const branchColor = BRANCH_COLORS[branch];

          return (
            <div
              key={branch}
              className="pixel-border flex flex-col gap-1 overflow-y-auto"
              style={{
                background: '#050010',
                borderColor: `${branchColor}33`,
                padding: '8px 6px',
                minHeight: 0,
              }}
            >
              <div
                className="flex items-center gap-1 mb-1"
                style={{ borderBottom: `1px solid ${branchColor}22`, paddingBottom: 4, flexShrink: 0 }}
              >
                <span style={{ color: branchColor }}>{BRANCH_ICONS[branch]}</span>
                <div
                  className="font-pixel"
                  style={{ color: branchColor, fontSize: '6px', letterSpacing: '1px' }}
                >
                  {branch}
                </div>
              </div>

              {branchPerks.map(perk => {
                const level = getOverclockPerkLevel(upgrades, perk.id);
                const maxed = level >= perk.maxLevel;
                const unlocked = isPerkUnlocked(perk, upgrades, overclockTier);
                const canBuy = plugin?.canBuyPerk(perk.id) ?? false;

                if (!unlocked) {
                  return (
                    <div
                      key={perk.id}
                      style={{
                        background: '#030008',
                        border: '1px solid #0f0f1a',
                        padding: '6px',
                        opacity: 0.55,
                        flexShrink: 0,
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Lock size={8} color="#2a2a3a" />
                        <div className="font-pixel" style={{ color: '#2a2a3a', fontSize: '5px', letterSpacing: '1px' }}>
                          {perk.name}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#2a2a3a', lineHeight: 1.4 }}>
                        {perk.requiresTier !== undefined && overclockTier < perk.requiresTier
                          ? `TIER ${perk.requiresTier} REQ`
                          : 'BUY PREV PERK'}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={perk.id}
                    style={{
                      background: maxed ? `${perk.color}0a` : '#060012',
                      border: `1px solid ${maxed ? perk.color : canBuy ? `${perk.color}55` : '#1a1a2a'}`,
                      padding: '6px',
                      boxShadow: maxed ? `0 0 8px ${perk.color}33` : canBuy ? `0 0 4px ${perk.color}18` : 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      className="font-pixel"
                      style={{
                        color: maxed ? perk.color : canBuy ? perk.color : '#3a3a5a',
                        fontSize: '5px',
                        letterSpacing: '1px',
                        marginBottom: 2,
                      }}
                    >
                      {perk.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '8px',
                        color: '#3a4a5a',
                        fontStyle: 'italic',
                        marginBottom: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {perk.flavor}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#4a5a4a', marginBottom: 4 }}>
                      {perk.description}
                    </div>

                    {/* Segmented level bar */}
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: perk.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 3,
                            background: i < level ? perk.color : '#1a1a2a',
                            boxShadow: i < level ? `0 0 4px ${perk.color}` : 'none',
                            transition: 'background 0.2s',
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div
                        className="font-pixel"
                        style={{ color: maxed ? perk.color : '#2a3a4a', fontSize: '6px' }}
                      >
                        {level}/{perk.maxLevel}
                      </div>
                      {maxed ? (
                        <div
                          className="font-pixel"
                          style={{
                            color: perk.color,
                            fontSize: '5px',
                            padding: '2px 4px',
                            border: `1px solid ${perk.color}`,
                            background: `${perk.color}18`,
                          }}
                        >
                          MAX
                        </div>
                      ) : (
                        <button
                          onClick={() => plugin?.buyPerk(perk.id)}
                          disabled={!canBuy}
                          className="font-pixel"
                          style={{
                            background: canBuy ? `${perk.color}22` : '#0a0010',
                            border: `1px solid ${canBuy ? perk.color : '#1a1a2a'}`,
                            color: canBuy ? perk.color : '#2a2a3a',
                            padding: '2px 5px',
                            fontSize: '6px',
                            cursor: canBuy ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {perk.costPerLevel} OCT
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Reset / Reboot section ──────────────────────────── */}
      <div
        className="pixel-border"
        style={{
          background: canOverclock ? '#0d0010' : '#060008',
          borderColor: canOverclock ? (pulse ? '#ff0080' : '#cc0060') : '#1a1a2a',
          padding: '10px 12px',
          boxShadow: canOverclock ? `0 0 ${pulse ? 20 : 10}px rgba(255,0,128,${pulse ? 0.3 : 0.15})` : 'none',
          transition: 'box-shadow 0.9s, border-color 0.9s',
          flexShrink: 0,
        }}
      >
        {!canOverclock ? (
          <div className="text-center">
            <div className="font-pixel" style={{ color: '#2a2a3a', fontSize: '6px', letterSpacing: '1px', lineHeight: 2 }}>
              REACH STAGE 10 TO UNLOCK REBOOT
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#1a2a1a', marginTop: 2 }}>
              higher peak stage = exponentially more OCT
            </div>
          </div>
        ) : confirming ? (
          <div>
            <div
              className="font-pixel mb-1 text-center"
              style={{ color: '#ffaa00', fontSize: '6px', letterSpacing: '1px' }}
            >
              !! REBOOT PROTOCOL ACTIVE !!
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                color: '#5a4a2a',
                lineHeight: 1.8,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              Stage, gold &amp; components reset.<br />
              <span style={{ color: '#ff0080' }}>+{gain} OCT earned</span>
              {tierWillIncrease && (
                <span style={{ color: TIER_COLORS[newTierAfterReset] }}>
                  {' '}· TIER → {TIER_NAMES[newTierAfterReset]}
                </span>
              )}
              <br />
              <span style={{ color: '#2a4a2a' }}>Perks &amp; items persist.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOverclock}
                className="flex-1 font-pixel"
                style={{
                  background: 'linear-gradient(135deg, #3d0024 0%, #1a0010 100%)',
                  border: '1px solid #ff0080',
                  color: '#ff0080',
                  padding: '8px',
                  fontSize: '6px',
                  letterSpacing: '1px',
                  boxShadow: '0 0 10px rgba(255,0,128,0.4)',
                  cursor: 'pointer',
                }}
              >
                EXECUTE REBOOT
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 font-pixel"
                style={{
                  background: '#0a0a0f',
                  border: '1px solid #1a2a3a',
                  color: '#4a5a6a',
                  padding: '8px',
                  fontSize: '6px',
                  cursor: 'pointer',
                }}
              >
                ABORT
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full font-pixel"
            style={{
              background: 'linear-gradient(135deg, #160010 0%, #200018 50%, #160010 100%)',
              border: `1px solid ${pulse ? '#ff0080' : '#cc0060'}`,
              color: pulse ? '#ff0080' : '#dd0070',
              padding: '12px 10px',
              fontSize: '8px',
              letterSpacing: '2px',
              boxShadow: `0 0 ${pulse ? 16 : 8}px rgba(255,0,128,${pulse ? 0.4 : 0.2})`,
              cursor: 'pointer',
              transition: 'all 0.9s',
              textAlign: 'center' as const,
            }}
          >
            REBOOT PROTOCOL
            <div
              style={{
                fontSize: '7px',
                color: pulse ? '#ff008099' : '#aa004455',
                marginTop: 3,
                letterSpacing: '1px',
                transition: 'color 0.9s',
              }}
            >
              +{gain} OCT
              {tierWillIncrease && (
                <span style={{ color: TIER_COLORS[newTierAfterReset], marginLeft: 6 }}>
                  {'· TIER UP → '}{TIER_NAMES[newTierAfterReset]}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
