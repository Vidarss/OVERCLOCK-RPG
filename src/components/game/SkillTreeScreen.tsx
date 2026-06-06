'use client';

import { useState, useMemo } from 'react';
import { X, Lock, Check, ChevronDown, ChevronUp, Pointer, Coins, Cpu, Crosshair, Zap, TrendingUp, Activity, Skull, Sword, Clock, Target, Flame, Gem, Rocket, Crown, MousePointerClick, Hourglass, Banknote, Infinity as InfinityIcon } from 'lucide-react';
import type { IEngine } from '../../engine/types';
import { SKILL_TREE_CONFIG, type SkillTreeNode } from '../../config/game.config';
import { useGameState } from '../../hooks/useGameState';

// Icon map for dynamic rendering
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Pointer, Coins, Cpu, Crosshair, Zap, TrendingUp, Activity, Skull, Sword, Clock, Target, Flame, Gem, Rocket, Crown, MousePointerClick, Hourglass, Banknote,
};

interface SkillTreeScreenProps {
  engine: IEngine;
  onClose: () => void;
}

export function SkillTreeScreen({ engine, onClose }: SkillTreeScreenProps) {
  const skillPoints = useGameState(engine, s => s.skillPoints ?? 0);
  const skillTreeNodes = useGameState(engine, s => s.skillTreeNodes ?? {});
  const highestStage = useGameState(engine, s => s.highestStage ?? 1);
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Calculate total SP spent
  const totalSpent = useMemo(() => {
    return Object.entries(skillTreeNodes).reduce((sum, [nodeId, level]) => {
      const node = SKILL_TREE_CONFIG.nodes.find(n => n.id === nodeId);
      if (!node) return sum;
      // Sum of costs for all levels purchased
      return sum + (node.costPerLevel * level);
    }, 0);
  }, [skillTreeNodes]);

  // Check if a node is unlocked (requirements met)
  const isNodeUnlocked = (node: SkillTreeNode): boolean => {
    if (!node.requires || node.requires.length === 0) return true;
    return node.requires.every(reqId => {
      const reqLevel = skillTreeNodes[reqId] ?? 0;
      return reqLevel > 0;
    });
  };

  // Get current level of a node
  const getNodeLevel = (nodeId: string): number => {
    return skillTreeNodes[nodeId] ?? 0;
  };

  // Check if node can be upgraded
  const canUpgrade = (node: SkillTreeNode): boolean => {
    const currentLevel = getNodeLevel(node.id);
    if (currentLevel >= node.maxLevel) return false;
    if (!isNodeUnlocked(node)) return false;
    return skillPoints >= node.costPerLevel;
  };

  // Upgrade a node — the SkillTreePlugin re-applies all modifiers on this event
  const upgradeNode = (node: SkillTreeNode) => {
    if (!canUpgrade(node)) return;

    const currentLevel = getNodeLevel(node.id);
    const newLevel = currentLevel + 1;

    engine.updateState({
      skillPoints: skillPoints - node.costPerLevel,
      skillTreeNodes: { ...skillTreeNodes, [node.id]: newLevel },
    });

    // The plugin listens for this and recomputes the full modifier stack,
    // so we never apply (or mis-apply) modifiers from the UI directly.
    engine.emit('skill_tree_upgrade', { nodeId: node.id, level: newLevel });
  };

  // Group nodes by tier
  const nodesByTier = useMemo(() => {
    const tiers: Record<number, SkillTreeNode[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    SKILL_TREE_CONFIG.nodes.forEach(node => {
      tiers[node.tier].push(node);
    });
    return tiers;
  }, []);

  // Calculate total bonuses from skill tree (passive nodes only)
  const totalBonuses = useMemo(() => {
    const bonuses: Record<string, number> = {};
    SKILL_TREE_CONFIG.nodes.forEach(node => {
      if (!node.effect) return;
      const level = getNodeLevel(node.id);
      if (level > 0) {
        const key = node.effect.type;
        bonuses[key] = (bonuses[key] ?? 0) + (node.effect.valuePerLevel * level);
      }
    });
    return bonuses;
  }, [skillTreeNodes]);

  const formatBonus = (type: string, value: number): string => {
    const percent = Math.round(value * 100);
    const labels: Record<string, string> = {
      tap_damage: `+${percent}% Tap Damage`,
      crit_chance: `+${percent}% Crit Chance`,
      crit_damage: `+${percent}% Crit Damage`,
      gold_bonus: `+${percent}% Gold`,
      idle_damage: `+${percent}% Idle Damage`,
      all_damage: `+${percent}% All Damage`,
    };
    return labels[type] ?? `+${percent}% ${type}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="font-pixel" style={{ fontSize: 18, color: '#00ff88', textShadow: '0 0 10px #00ff8855' }}>
            SKILL TREE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0a1a10', border: '1px solid #00ff8833', padding: '6px 12px' }}>
            <Zap size={14} style={{ color: '#00ff88' }} />
            <span style={{ color: '#00ff88', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              {skillPoints} SP
            </span>
          </div>
          <div style={{ color: '#555', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {totalSpent} SP spent
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: 8,
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Skill Tree */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', minHeight: 0 }}>
          {/* Tier labels and nodes */}
          {[1, 2, 3, 4, 5].map(tier => (
            <div key={tier} style={{ marginBottom: 24 }}>
              {/* Tier label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 10,
                    color: tier === 5 ? '#ff0080' : tier === 4 ? '#ff8800' : tier === 3 ? '#aa44ff' : tier === 2 ? '#00aaff' : '#00ff88',
                    letterSpacing: 2,
                  }}
                >
                  TIER {tier}
                </div>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${tier === 5 ? '#ff008033' : '#1a1a2e'} 0%, transparent 100%)` }} />
              </div>

              {/* Nodes grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {nodesByTier[tier].map(node => {
                  const level = getNodeLevel(node.id);
                  const unlocked = isNodeUnlocked(node);
                  const maxed = level >= node.maxLevel;
                  const canBuy = canUpgrade(node);
                  const IconComponent = ICON_MAP[node.icon] || Zap;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        width: 140,
                        padding: '12px',
                        background: maxed
                          ? `linear-gradient(135deg, ${node.color}15 0%, ${node.color}08 100%)`
                          : level > 0
                          ? '#0a0a14'
                          : unlocked
                          ? '#080810'
                          : '#050508',
                        border: `1px solid ${maxed ? node.color : level > 0 ? `${node.color}66` : unlocked ? '#1a1a2e' : '#0a0a14'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        opacity: unlocked ? 1 : 0.4,
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      {/* Lock icon for locked nodes */}
                      {!unlocked && (
                        <div style={{ position: 'absolute', top: 6, right: 6 }}>
                          <Lock size={10} style={{ color: '#333' }} />
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: level > 0 ? `${node.color}22` : '#0a0a12',
                          border: `1px solid ${level > 0 ? node.color : '#1a1a2e'}`,
                          borderRadius: 4,
                        }}
                      >
                        <IconComponent size={18} style={{ color: level > 0 ? node.color : '#444' }} />
                      </div>

                      {/* Time-skip badge */}
                      {node.nodeType === 'timeskip' && (
                        <div
                          className="font-pixel"
                          style={{
                            fontSize: 6,
                            color: level > 0 ? node.color : '#555',
                            border: `1px solid ${level > 0 ? node.color : '#333'}`,
                            borderRadius: 2,
                            padding: '1px 3px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          AUTO-SKIP
                        </div>
                      )}

                      {/* Name */}
                      <div
                        className="font-pixel"
                        style={{
                          fontSize: 8,
                          color: level > 0 ? node.color : '#666',
                          textAlign: 'center',
                          lineHeight: 1.3,
                        }}
                      >
                        {node.name}
                      </div>

                      {/* Level indicator */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 2,
                        }}
                      >
                        {Array.from({ length: node.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: node.maxLevel > 5 ? 4 : 6,
                              height: 4,
                              background: i < level ? node.color : '#1a1a2e',
                              borderRadius: 1,
                            }}
                          />
                        ))}
                      </div>

                      {/* Cost */}
                      {!maxed && unlocked && (
                        <div
                          style={{
                            fontSize: 9,
                            color: canBuy ? '#00ff88' : '#ff4444',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {node.costPerLevel} SP
                        </div>
                      )}
                      {maxed && (
                        <div style={{ fontSize: 9, color: node.color, fontFamily: 'var(--font-mono)' }}>
                          MAX
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Details panel */}
        <div
          style={{
            width: 280,
            borderLeft: '1px solid #1a1a2e',
            background: '#050508',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Selected node details */}
          {selectedNode ? (
            <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
              {(() => {
                const level = getNodeLevel(selectedNode.id);
                const unlocked = isNodeUnlocked(selectedNode);
                const maxed = level >= selectedNode.maxLevel;
                const canBuy = canUpgrade(selectedNode);
                const IconComponent = ICON_MAP[selectedNode.icon] || Zap;

                return (
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${selectedNode.color}22`,
                          border: `2px solid ${selectedNode.color}`,
                          borderRadius: 6,
                        }}
                      >
                        <IconComponent size={24} style={{ color: selectedNode.color }} />
                      </div>
                      <div>
                        <div className="font-pixel" style={{ fontSize: 11, color: selectedNode.color }}>
                          {selectedNode.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#666', fontFamily: 'var(--font-mono)' }}>
                          Level {level}/{selectedNode.maxLevel}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: selectedNode.flavor ? 8 : 16, lineHeight: 1.5 }}>
                      {selectedNode.description}
                    </div>

                    {/* Flavor text */}
                    {selectedNode.flavor && (
                      <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.4 }}>
                        {`"${selectedNode.flavor}"`}
                      </div>
                    )}

                    {/* Time-skip node info */}
                    {selectedNode.timeskip && (
                      <div style={{ background: '#120a14', border: `1px solid ${selectedNode.color}44`, padding: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: selectedNode.color, marginBottom: 6, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <InfinityIcon size={12} /> AUTO TIME-SKIP
                        </div>
                        <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5 }}>
                          {level > 0
                            ? `Auto-fires every ${selectedNode.timeskip.intervalSec}s, banking ${selectedNode.timeskip.secondsPerLevel * level}s of ${selectedNode.timeskip.resource.toUpperCase()} output.`
                            : `Once unlocked, auto-fires every ${selectedNode.timeskip.intervalSec}s, banking ${selectedNode.timeskip.secondsPerLevel}s of ${selectedNode.timeskip.resource.toUpperCase()} output per level.`}
                        </div>
                        {!maxed && (
                          <div style={{ fontSize: 11, color: '#00ff88', marginTop: 6 }}>
                            {`Next level: ${selectedNode.timeskip.secondsPerLevel * (level + 1)}s banked per fire`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current effect (passive nodes) */}
                    {selectedNode.effect && level > 0 && (
                      <div style={{ background: '#0a0a12', border: '1px solid #1a1a2e', padding: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: '#666', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                          CURRENT EFFECT
                        </div>
                        <div style={{ fontSize: 13, color: selectedNode.color }}>
                          {formatBonus(selectedNode.effect.type, selectedNode.effect.valuePerLevel * level)}
                        </div>
                      </div>
                    )}

                    {/* Next level preview (passive nodes) */}
                    {selectedNode.effect && !maxed && (
                      <div style={{ background: '#0a1008', border: '1px solid #00ff8833', padding: 12, marginBottom: 16 }}>
                        <div style={{ fontSize: 9, color: '#00ff88', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                          NEXT LEVEL
                        </div>
                        <div style={{ fontSize: 13, color: '#fff' }}>
                          {formatBonus(selectedNode.effect.type, selectedNode.effect.valuePerLevel * (level + 1))}
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    {selectedNode.requires && selectedNode.requires.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 9, color: '#666', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                          REQUIRES
                        </div>
                        {selectedNode.requires.map(reqId => {
                          const reqNode = SKILL_TREE_CONFIG.nodes.find(n => n.id === reqId);
                          const reqLevel = getNodeLevel(reqId);
                          const met = reqLevel > 0;
                          return (
                            <div
                              key={reqId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '4px 0',
                              }}
                            >
                              {met ? (
                                <Check size={12} style={{ color: '#00ff88' }} />
                              ) : (
                                <Lock size={12} style={{ color: '#ff4444' }} />
                              )}
                              <span style={{ fontSize: 11, color: met ? '#00ff88' : '#ff4444' }}>
                                {reqNode?.name ?? reqId}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Upgrade button */}
                    {!maxed && unlocked && (
                      <button
                        onClick={() => upgradeNode(selectedNode)}
                        disabled={!canBuy}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: canBuy ? '#00ff88' : '#1a1a2e',
                          border: 'none',
                          color: canBuy ? '#000' : '#444',
                          cursor: canBuy ? 'pointer' : 'not-allowed',
                          fontFamily: 'var(--font-pixel)',
                          fontSize: 11,
                          letterSpacing: 1,
                        }}
                      >
                        {canBuy ? `UPGRADE (${selectedNode.costPerLevel} SP)` : `NEED ${selectedNode.costPerLevel} SP`}
                      </button>
                    )}

                    {maxed && (
                      <div
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: `${selectedNode.color}22`,
                          border: `1px solid ${selectedNode.color}`,
                          color: selectedNode.color,
                          textAlign: 'center',
                          fontFamily: 'var(--font-pixel)',
                          fontSize: 11,
                          letterSpacing: 1,
                        }}
                      >
                        MAXED OUT
                      </div>
                    )}

                    {!unlocked && (
                      <div
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#1a0a0a',
                          border: '1px solid #ff444433',
                          color: '#ff4444',
                          textAlign: 'center',
                          fontFamily: 'var(--font-pixel)',
                          fontSize: 11,
                          letterSpacing: 1,
                        }}
                      >
                        LOCKED
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div style={{ padding: 16, color: '#444', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
              Select a node to view details
            </div>
          )}

          {/* Total bonuses */}
          <div style={{ borderTop: '1px solid #1a1a2e', padding: 12, background: '#0a0a12' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowInfo(!showInfo)}
            >
              <div className="font-pixel" style={{ fontSize: 9, color: '#666', letterSpacing: 1 }}>
                TOTAL BONUSES
              </div>
              {showInfo ? <ChevronUp size={14} style={{ color: '#666' }} /> : <ChevronDown size={14} style={{ color: '#666' }} />}
            </div>
            {showInfo && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(totalBonuses).map(([type, value]) => (
                  <div key={type} style={{ fontSize: 11, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>
                    {formatBonus(type, value)}
                  </div>
                ))}
                {Object.keys(totalBonuses).length === 0 && (
                  <div style={{ fontSize: 11, color: '#444' }}>No bonuses yet</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a2e', background: '#050508', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: '#444', textAlign: 'center' }}>
          Earn Skill Points by reaching stage milestones. Next milestone at stage {
            (() => {
              const milestones = [50, 100, 150, 200, 250, 500, 750, 1000];
              const next = milestones.find(m => m > highestStage);
              return next ?? 'MAX';
            })()
          }
        </div>
      </div>
    </div>
  );
}
