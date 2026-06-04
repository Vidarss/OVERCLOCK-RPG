import React, { useState, useEffect } from 'react';
import { Lock, Zap, Wifi, Cpu, Flame, Shuffle, Infinity, ChevronUp, Info } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import {
  calculateOverclockGain,
  calculateTier,
  OVERCLOCK_PERKS,
  BRANCH_COLORS,
  BRANCH_SKILL_UNLOCKS,
  TIER_NAMES,
  getOverclockPerkLevel,
  isPerkUnlocked,
  isBranchSkillUnlocked,
} from '../../plugins/OverclockPlugin';
import type { OverclockPlugin, PerkBranch, OverclockPerkDef } from '../../plugins/OverclockPlugin';
import { UI_CONFIG, OVERCLOCK_CONFIG } from '../../config/game.config';
import { Tooltip, TooltipLabel, TooltipText, TooltipStat } from './Tooltip';

interface OverclockPanelProps {
  engine: GameEngine;
}

const BRANCH_ICONS: Record<PerkBranch, React.ReactNode> = {
  VOLTAGE: <Zap size={14} />,
  SIGNAL: <Wifi size={14} />,
  THERMAL: <Cpu size={14} />,
  ENTROPY: <Flame size={14} />,
  QUANTUM: <Infinity size={14} />,
};

const BRANCH_DESCRIPTIONS: Record<PerkBranch, string> = {
  VOLTAGE: 'Tap damage & critical hits',
  SIGNAL: 'Gold generation & economy',
  THERMAL: 'Idle DPS & passive damage',
  ENTROPY: 'Late-game power & chaos',
  QUANTUM: 'Synergy & transcendence',
};

const TIER_COLORS = [
  '#5a6a7a', '#00f5ff', '#ffaa00', '#ff0080', '#39ff14',
  '#ffffff', '#cc44ff', '#ff8800', '#00ff88', '#ff0080',
  '#44ddff', '#ffcc00', '#ff44aa', '#88ff44', '#ffffff',
];

const BRANCHES: PerkBranch[] = ['VOLTAGE', 'SIGNAL', 'THERMAL', 'ENTROPY', 'QUANTUM'];

// Perk node component - just an icon with tooltip
function PerkNode({ 
  perk, 
  level, 
  maxed, 
  unlocked, 
  canBuy, 
  onBuy 
}: { 
  perk: OverclockPerkDef; 
  level: number; 
  maxed: boolean; 
  unlocked: boolean; 
  canBuy: boolean;
  onBuy: () => void;
}) {
  const tooltipContent = (
    <>
      <TooltipLabel label={perk.name} color={perk.color} />
      <TooltipText>{perk.flavor}</TooltipText>
      <div style={{ marginTop: 4, marginBottom: 4 }}>
        <TooltipStat label="Effect" value={perk.description} color={perk.color} />
      </div>
      <TooltipStat label="Level" value={`${level}/${perk.maxLevel}`} color={maxed ? '#39ff14' : '#5a6a7a'} />
      {!maxed && <TooltipStat label="Cost" value={`${perk.costPerLevel} OCT`} color={canBuy ? '#00f5ff' : '#ff4444'} />}
      {perk.requiresTier !== undefined && (
        <TooltipStat label="Requires" value={`Tier ${perk.requiresTier}`} color="#ffaa00" />
      )}
      {!unlocked && <TooltipText>Locked - buy previous perk first</TooltipText>}
    </>
  );

  const progress = level / perk.maxLevel;
  const size = 36;

  return (
    <Tooltip content={tooltipContent} position="top" delay={100}>
      <button
        onClick={onBuy}
        disabled={!canBuy || maxed}
        style={{
          width: size,
          height: size,
          position: 'relative',
          background: !unlocked 
            ? '#080810' 
            : maxed 
              ? `${perk.color}15` 
              : '#0a0a15',
          border: `2px solid ${!unlocked ? '#1a1a2a' : maxed ? perk.color : canBuy ? perk.color + '88' : '#2a2a3a'}`,
          cursor: !unlocked || maxed ? 'not-allowed' : canBuy ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          opacity: !unlocked ? 0.4 : 1,
          boxShadow: maxed 
            ? `0 0 12px ${perk.color}44, inset 0 0 8px ${perk.color}22` 
            : canBuy && unlocked 
              ? `0 0 6px ${perk.color}22` 
              : 'none',
        }}
      >
        {/* Progress ring */}
        {unlocked && level > 0 && !maxed && (
          <svg 
            style={{ position: 'absolute', inset: -2, pointerEvents: 'none' }}
            width={size + 4} 
            height={size + 4}
          >
            <circle
              cx={(size + 4) / 2}
              cy={(size + 4) / 2}
              r={(size - 2) / 2}
              fill="none"
              stroke={perk.color}
              strokeWidth={2}
              strokeDasharray={`${progress * Math.PI * (size - 2)} ${Math.PI * (size - 2)}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${(size + 4) / 2} ${(size + 4) / 2})`}
              opacity={0.6}
            />
          </svg>
        )}

        {!unlocked ? (
          <Lock size={12} color="#2a2a3a" />
        ) : (
          <div 
            className="font-pixel" 
            style={{ 
              fontSize: '8px', 
              color: maxed ? perk.color : canBuy ? perk.color : '#4a4a5a',
              textShadow: maxed ? `0 0 4px ${perk.color}` : 'none',
            }}
          >
            {level}
          </div>
        )}

        {/* Max indicator */}
        {maxed && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 10,
            height: 10,
            background: perk.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 6px ${perk.color}`,
          }}>
            <ChevronUp size={8} color="#000" />
          </div>
        )}
      </button>
    </Tooltip>
  );
}

// Branch column component
function BranchColumn({ 
  branch, 
  engine, 
  overclockTier, 
  upgrades 
}: { 
  branch: PerkBranch; 
  engine: GameEngine; 
  overclockTier: number;
  upgrades: Record<string, number>;
}) {
  const plugin = engine.getPlugin<OverclockPlugin>('overclock');
  const branchColor = BRANCH_COLORS[branch];
  const branchPerks = OVERCLOCK_PERKS
    .filter(p => p.branch === branch)
    .sort((a, b) => a.branchRank - b.branchRank);
  const skillUnlock = BRANCH_SKILL_UNLOCKS[branch];
  const skillEarned = isBranchSkillUnlocked(upgrades, branch);

  const branchTooltip = (
    <>
      <TooltipLabel label={branch} color={branchColor} />
      <TooltipText>{BRANCH_DESCRIPTIONS[branch]}</TooltipText>
      <div style={{ marginTop: 8 }}>
        <TooltipStat label="Branch Skill" value={skillUnlock.name} color={skillEarned ? branchColor : '#4a4a5a'} />
        <TooltipText>{skillUnlock.description}</TooltipText>
        {!skillEarned && (
          <TooltipStat label="Unlock at" value={`Rank ${skillUnlock.requiresRank}`} color="#ffaa00" />
        )}
      </div>
    </>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '8px 4px',
      background: '#050010',
      border: `1px solid ${branchColor}22`,
      minWidth: 52,
    }}>
      {/* Branch header with icon */}
      <Tooltip content={branchTooltip} position="top" delay={100}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          cursor: 'help',
          padding: 4,
        }}>
          <div style={{ 
            color: branchColor, 
            filter: skillEarned ? 'drop-shadow(0 0 4px currentColor)' : 'none' 
          }}>
            {BRANCH_ICONS[branch]}
          </div>
          <div className="font-pixel" style={{ 
            color: branchColor, 
            fontSize: '5px', 
            letterSpacing: '0.5px',
            opacity: 0.8,
          }}>
            {branch.slice(0, 3)}
          </div>
          {/* Skill unlock indicator */}
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: skillEarned ? branchColor : '#1a1a2a',
            boxShadow: skillEarned ? `0 0 6px ${branchColor}` : 'none',
            marginTop: 2,
          }} />
        </div>
      </Tooltip>

      {/* Perk nodes */}
      {branchPerks.map(perk => {
        const level = getOverclockPerkLevel(upgrades, perk.id);
        const maxed = level >= perk.maxLevel;
        const unlocked = isPerkUnlocked(perk, upgrades, overclockTier);
        const canBuy = plugin?.canBuyPerk(perk.id) ?? false;

        return (
          <PerkNode
            key={perk.id}
            perk={perk}
            level={level}
            maxed={maxed}
            unlocked={unlocked}
            canBuy={canBuy}
            onBuy={() => plugin?.buyPerk(perk.id)}
          />
        );
      })}
    </div>
  );
}

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
  const tierProgress = (totalOverclocks % UI_CONFIG.tierProgressRuns) / UI_CONFIG.tierProgressRuns;
  const newTierAfterReset = calculateTier(totalOverclocks + 1);
  const tierWillIncrease = newTierAfterReset > overclockTier;

  useEffect(() => {
    if (!canOverclock) return;
    const id = setInterval(() => setPulse(p => !p), UI_CONFIG.overclockPulseMs);
    return () => clearInterval(id);
  }, [canOverclock]);

  const handleOverclock = () => {
    plugin?.perform();
    setConfirming(false);
  };

  return (
    <div className="flex flex-col gap-2" style={{ height: '100%' }}>

      {/* ── Tier + OCT header (compact) ─────────────────────────────────────── */}
      <div
        className="pixel-border"
        style={{
          background: '#06000f', borderColor: tierColor,
          padding: '8px 10px', boxShadow: `0 0 12px ${tierColor}18`, flexShrink: 0,
        }}
      >
        {/* Tier info row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="font-pixel"
              style={{
                color: tierColor, fontSize: '6px', letterSpacing: '1px',
                padding: '2px 5px', border: `1px solid ${tierColor}`,
                background: `${tierColor}15`,
              }}
            >
              {tierName}
            </div>
            {!isMaxTier && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#3a4a5a' }}>
                +{3 - (totalOverclocks % 3)} to T{overclockTier + 1}
              </div>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#2a3a4a' }}>
            #{totalOverclocks}
          </div>
        </div>

        {/* Tier road (compact) */}
        <div style={{ display: 'flex', gap: 1, marginBottom: 6, alignItems: 'center' }}>
          {TIER_NAMES.map((name, i) => {
            const tc = TIER_COLORS[i] ?? '#ffffff';
            const isCurrent = i === overclockTier;
            const isPast = i < overclockTier;
            return (
              <Tooltip key={i} content={<TooltipLabel label={`T${i}: ${name}`} color={tc} />} position="top" delay={50}>
                <div
                  style={{
                    width: isCurrent ? 14 : 7, height: isCurrent ? 6 : 4,
                    background: isPast ? tc : isCurrent ? tc : '#1a1a2a',
                    opacity: i > overclockTier ? 0.25 : 1,
                    boxShadow: isCurrent ? `0 0 4px ${tc}` : 'none',
                    transition: 'all 0.3s', flexShrink: 0, cursor: 'help',
                  }}
                />
              </Tooltip>
            );
          })}
        </div>

        {/* OCT numbers (compact row) */}
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <div className="font-pixel" style={{ color: '#ff0080', fontSize: '18px', textShadow: '0 0 8px rgba(255,0,128,0.5)' }}>
              {overclockCount}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#3a4a5a' }}>OCT</div>
          </div>
          <div style={{ color: '#1a1a2a', fontSize: '10px' }}>|</div>
          <div className="flex items-baseline gap-1">
            <div className="font-pixel" style={{ color: available > 0 ? '#00f5ff' : '#2a3a4a', fontSize: '12px' }}>
              {available}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#2a4a5a' }}>free</div>
          </div>
          <div style={{ color: '#1a1a2a', fontSize: '10px' }}>|</div>
          <div className="flex items-baseline gap-1">
            <div className="font-pixel" style={{ color: '#3a2a4a', fontSize: '10px' }}>{spent}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#2a3a4a' }}>spent</div>
          </div>
        </div>
      </div>

      {/* ── 5-branch perk tree (icon grid) ──────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        flex: 1, 
        minHeight: 0, 
        overflow: 'auto',
        justifyContent: 'center',
      }}>
        {BRANCHES.map(branch => (
          <BranchColumn 
            key={branch} 
            branch={branch} 
            engine={engine}
            overclockTier={overclockTier}
            upgrades={upgrades}
          />
        ))}
      </div>

      {/* ── Info hint ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1" style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '7px', 
        color: '#2a3a4a',
        padding: '4px 0',
      }}>
        <Info size={10} />
        <span>Hover nodes for details</span>
      </div>

      {/* ── Reboot section ────────────────────────────────────────────────────── */}
      <div
        className="pixel-border"
        style={{
          background: canOverclock ? '#0d0010' : '#060008',
          borderColor: canOverclock ? (pulse ? '#ff0080' : '#cc0060') : '#1a1a2a',
          padding: '8px 10px', flexShrink: 0,
          boxShadow: canOverclock ? `0 0 ${pulse ? 16 : 8}px rgba(255,0,128,${pulse ? 0.25 : 0.1})` : 'none',
          transition: 'box-shadow 0.9s, border-color 0.9s',
        }}
      >
        {!canOverclock ? (
          <div className="text-center">
            <div className="font-pixel" style={{ color: '#2a2a3a', fontSize: '6px', letterSpacing: '1px' }}>
              REACH STAGE {OVERCLOCK_CONFIG.minStageToOverclock} TO REBOOT
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#1a2a3a', marginTop: 2 }}>
              Current: {stage} | Peak: {highestStage}
            </div>
          </div>
        ) : confirming ? (
          <div>
            <div className="font-pixel mb-1 text-center" style={{ color: '#ffaa00', fontSize: '6px', letterSpacing: '1px' }}>
              CONFIRM REBOOT
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '7px', color: '#4a3a2a',
              lineHeight: 1.6, marginBottom: 4, textAlign: 'center',
            }}>
              Reset progress for <span style={{ color: '#ff0080' }}>+{gain} OCT</span>
              {tierWillIncrease && (
                <span style={{ color: TIER_COLORS[newTierAfterReset] }}>
                  {' '}+ TIER UP
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOverclock}
                className="flex-1 font-pixel"
                style={{
                  background: 'linear-gradient(135deg, #3d0024 0%, #1a0010 100%)',
                  border: '1px solid #ff0080', color: '#ff0080',
                  padding: '6px', fontSize: '6px', letterSpacing: '1px',
                  boxShadow: '0 0 8px rgba(255,0,128,0.3)', cursor: 'pointer',
                }}
              >
                EXECUTE
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 font-pixel"
                style={{
                  background: '#0a0a0f', border: '1px solid #1a2a3a',
                  color: '#4a5a6a', padding: '6px', fontSize: '6px', cursor: 'pointer',
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
              padding: '10px 8px', fontSize: '7px', letterSpacing: '2px',
              boxShadow: `0 0 ${pulse ? 12 : 6}px rgba(255,0,128,${pulse ? 0.3 : 0.15})`,
              cursor: 'pointer', transition: 'all 0.9s',
            }}
          >
            REBOOT +{gain} OCT
          </button>
        )}
      </div>
    </div>
  );
};
