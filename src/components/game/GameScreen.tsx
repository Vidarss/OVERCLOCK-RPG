import React, { useEffect, useState } from 'react';
import { CircuitBoard, ChevronDown, Trophy, Clock, Award, Swords, Users, Trash2, ArrowUp, Cpu, MessageCircle, Sparkles, TrendingUp } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import type { Player } from '../../engine/types';
import { formatNumber } from '../../utils/format';
import { audioManager } from '../../systems/AudioManager';
import { ITEM_CONFIG } from '../../config/game.config';
import { CyberHUD } from './CyberHUD';
import { Battlefield } from './Battlefield';
import { ComponentPanel } from './ComponentPanel';
import { MotherboardScreen } from './MotherboardScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { DailiesScreen } from './DailiesScreen';
import { AchievementsScreen } from './AchievementsScreen';
import { AchievementToast } from './AchievementToast';
import { ShopScreen } from './ShopScreen';
import { TournamentScreen } from './TournamentScreen';
import { ClanScreen } from './ClanScreen';
import { ScrapScreen } from './ScrapScreen';
import { UpgradeScreen } from './UpgradeScreen';
import { RelicsScreen } from './RelicsScreen';
import { SkillTreeScreen } from './SkillTreeScreen';
import { DataPacketPopup } from './DataPacketPopup';
import { useGameState } from '../../hooks/useGameState';
import { usePreloadAllSprites } from '../../hooks/useSpritePreloader';
import { Tooltip, TooltipLabel, TooltipText } from './Tooltip';
import { MODULES_CONFIG } from '../../config/modules.config';
import type { OverclockPlugin } from '../../plugins/OverclockPlugin';

interface GameScreenProps {
  engine: GameEngine;
  player: Player;
}

type MobileDrawer = 'components' | 'relics' | null;

const MobileDrawerOverlay: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, accentColor, children }) => (
  <>
    {open && (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.55)' }}
      />
    )}
    <div
      style={{
        position: 'fixed', left: '50%', bottom: 0, zIndex: 50,
        width: 260,
        transform: `translateX(-50%) translateY(${open ? 0 : '100%'})`,
        transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
        height: '85dvh',
        background: '#0a0a0f',
        border: `1px solid ${accentColor}33`,
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          background: '#050010',
          borderBottom: `1px solid ${accentColor}22`,
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div className="font-pixel" style={{ color: accentColor, fontSize: '8px', letterSpacing: '3px' }}>
          {title}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${accentColor}33`,
            color: accentColor, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  </>
);

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  badge?: number | null;
  onClick: () => void;
}

const MobileTab: React.FC<TabButtonProps> = ({ icon, label, active, activeColor = '#00f5ff', badge, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? `${activeColor}12` : 'transparent',
      border: 'none',
      borderTop: active ? `2px solid ${activeColor}` : '2px solid transparent',
      color: active ? activeColor : '#3a4a5a',
      padding: '8px 6px',
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      transition: 'all 0.15s',
      minHeight: 52,
      minWidth: 52,
      flexShrink: 0,
      position: 'relative',
    }}
  >
    {icon}
    <span className="font-pixel" style={{ fontSize: '6px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{label}</span>
    {badge != null && badge > 0 && (
      <span style={{
        position: 'absolute', top: 4, right: 4,
        background: activeColor, color: '#000',
        padding: '0 3px', fontSize: '6px', lineHeight: '11px',
        fontFamily: 'var(--font-mono)', minWidth: 11, textAlign: 'center',
      }}>
        {badge}
      </span>
    )}
  </button>
);

export const GameScreen: React.FC<GameScreenProps> = ({ engine, player }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null);
  const [showMotherboard, setShowMotherboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDailies, setShowDailies] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showTournament, setShowTournament] = useState(false);
  const [showClan, setShowClan] = useState(false);
  const [showScrap, setShowScrap] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<MobileDrawer>(null);

  // Preload all enemy sprites on mount to prevent loading delays
  usePreloadAllSprites();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    audioManager.playBGM();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const inventoryCount = useGameState(engine, s => (s.inventory ?? []).length);
  const inventoryMax = ITEM_CONFIG.inventoryMax;
  const inventoryWarningThreshold = ITEM_CONFIG.inventoryWarningThreshold;
  const inventoryNearFull = inventoryCount >= inventoryMax * inventoryWarningThreshold;
  const inventoryFull = inventoryCount >= inventoryMax;
  const overclockCount = useGameState(engine, s => s.overclockCount);
  const skillPoints = useGameState(engine, s => s.skillPoints ?? 0);
  const availableOCT = engine.getPlugin<OverclockPlugin>('overclock')?.getAvailableOCT() ?? overclockCount;
  
  // Check if motherboard upgrade is available
  const diamonds = useGameState(engine, s => s.diamonds ?? 0);
  const motherboardTier = useGameState(engine, s => s.motherboardTier ?? 0);
  const nextMoboTier = motherboardTier < 7 ? motherboardTier + 1 : null;
  const moboUpgradeAvailable = nextMoboTier !== null && diamonds >= ([0, 5, 10, 25, 50, 100, 200, 500][nextMoboTier] ?? 999999);

  useEffect(() => {
    const unsub = engine.on<{ goldEarned: number }>('offline_progress', event => {
      const g = event.payload.goldEarned;
      setOfflineMsg(`OFFLINE INCOME: +${formatNumber(g)} GOLD`);
      setTimeout(() => setOfflineMsg(null), 5000);
    });
    return unsub;
  }, [engine]);

  const openDrawer = (d: MobileDrawer) => setMobileDrawer(prev => prev === d ? null : d);

  const modals = (
    <>
      {showMotherboard && <MotherboardScreen engine={engine} onClose={() => setShowMotherboard(false)} />}
      {showLeaderboard && <LeaderboardScreen engine={engine} onClose={() => setShowLeaderboard(false)} />}
      {showDailies && <DailiesScreen engine={engine} onClose={() => setShowDailies(false)} />}
      {showAchievements && <AchievementsScreen engine={engine} onClose={() => setShowAchievements(false)} />}
      {showShop && <ShopScreen engine={engine} onClose={() => setShowShop(false)} />}
      {showTournament && <TournamentScreen engine={engine} onClose={() => setShowTournament(false)} />}
      {showClan && <ClanScreen engine={engine} onClose={() => setShowClan(false)} />}
      {showScrap && <ScrapScreen engine={engine} onClose={() => setShowScrap(false)} />}
      {showUpgrades && <UpgradeScreen engine={engine} onClose={() => setShowUpgrades(false)} />}
      {showRelics && <RelicsScreen engine={engine} onClose={() => setShowRelics(false)} />}
      {showSkillTree && <SkillTreeScreen engine={engine} onClose={() => setShowSkillTree(false)} />}
      <AchievementToast engine={engine} />
      <DataPacketPopup engine={engine} />
    </>
  );

  if (isMobile) {
    return (
      <div style={{ height: '100dvh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {modals}
        <CyberHUD engine={engine} playerHandle={player.handle} />

        {offlineMsg && (
          <div
            className="font-pixel text-center py-2"
            style={{ background: '#0a1a02', color: '#39ff14', fontSize: '8px', borderBottom: '1px solid #27b00e', flexShrink: 0 }}
          >
            {offlineMsg}
          </div>
        )}

        {/* Inventory warning banner */}
        {inventoryNearFull && (
          <div
            className="font-pixel text-center py-2 cursor-pointer"
            style={{ 
              background: inventoryFull ? '#2a0505' : '#2a1a05', 
              color: inventoryFull ? '#ff2222' : '#ffaa00', 
              fontSize: '8px', 
              borderBottom: `1px solid ${inventoryFull ? '#ff2222' : '#ffaa00'}`, 
              flexShrink: 0,
            }}
            onClick={() => setShowScrap(true)}
          >
            {inventoryFull 
              ? `[!] STORAGE FULL (${inventoryCount}/${inventoryMax}) - SCRAP ITEMS OR LOSE LOOT [!]`
              : `[!] STORAGE ${Math.floor((inventoryCount / inventoryMax) * 100)}% FULL (${inventoryCount}/${inventoryMax}) - TAP TO SCRAP [!]`
            }
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Battlefield engine={engine} />
        </div>

        {/* Scrollable bottom tab bar */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            background: '#050010',
            borderTop: '1px solid #1a1a2a',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <MobileTab
            icon={<CircuitBoard size={15} color={mobileDrawer === 'components' ? '#00f5ff' : '#3a4a5a'} />}
            label="MODULES"
            active={mobileDrawer === 'components'}
            activeColor="#00f5ff"
            badge={inventoryCount > 0 ? inventoryCount : null}
            onClick={() => openDrawer('components')}
          />
          <MobileTab
            icon={<ArrowUp size={15} color="#3a4a5a" />}
            label="UPGRADES"
            activeColor="#00f5ff"
            onClick={() => setShowUpgrades(true)}
          />
          <MobileTab
            icon={<Sparkles size={15} color={mobileDrawer === 'relics' ? '#ff0080' : '#3a4a5a'} />}
            label="RELICS"
            active={mobileDrawer === 'relics'}
            activeColor="#ff0080"
            badge={availableOCT > 0 ? availableOCT : null}
            onClick={() => setShowRelics(true)}
          />
          <MobileTab
            icon={<TrendingUp size={15} color="#3a4a5a" />}
            label="SKILLS"
            activeColor="#00ff88"
            badge={skillPoints > 0 ? skillPoints : null}
            onClick={() => setShowSkillTree(true)}
          />
          <MobileTab
            icon={<Cpu size={15} color="#3a4a5a" />}
            label="HARDWARE"
            activeColor="#39ff14"
            badge={moboUpgradeAvailable ? '↑' : (inventoryCount > 0 ? inventoryCount : null)}
            onClick={() => setShowMotherboard(true)}
          />
          <MobileTab
            icon={<Sparkles size={15} color="#3a4a5a" />}
            label={MODULES_CONFIG.shop.label ?? 'PASS'}
            activeColor="#9933ff"
            onClick={() => setShowShop(true)}
          />
          {MODULES_CONFIG.tournaments.enabled && (
            <MobileTab
              icon={<Swords size={15} color="#3a4a5a" />}
              label={MODULES_CONFIG.tournaments.label ?? 'TOURNEY'}
              activeColor="#ffaa00"
              onClick={() => setShowTournament(true)}
            />
          )}
          {MODULES_CONFIG.clans.enabled && (
            <MobileTab
              icon={<Users size={15} color="#3a4a5a" />}
              label={MODULES_CONFIG.clans.label ?? 'CLAN'}
              activeColor="#00f5ff"
              onClick={() => setShowClan(true)}
            />
          )}
          <MobileTab
            icon={<Trash2 size={15} color="#3a4a5a" />}
            label="SCRAP"
            activeColor="#ff4444"
            onClick={() => setShowScrap(true)}
          />
          {MODULES_CONFIG.leaderboard.enabled && (
            <MobileTab
              icon={<Trophy size={15} color="#3a4a5a" />}
              label={MODULES_CONFIG.leaderboard.label ?? 'RANKS'}
              activeColor="#00f5ff"
              onClick={() => setShowLeaderboard(true)}
            />
          )}
          {MODULES_CONFIG.dailyOps.enabled && (
            <MobileTab
              icon={<Clock size={15} color="#3a4a5a" />}
              label={MODULES_CONFIG.dailyOps.label ?? 'DAILY'}
              activeColor="#00f5ff"
              onClick={() => setShowDailies(true)}
            />
          )}
          {MODULES_CONFIG.achievements.enabled && (
            <MobileTab
              icon={<Award size={15} color="#3a4a5a" />}
              label={MODULES_CONFIG.achievements.label ?? 'FEATS'}
              activeColor="#ffaa00"
              onClick={() => setShowAchievements(true)}
            />
          )}
          <MobileTab
            icon={<MessageCircle size={15} color="#3a4a5a" />}
            label="DISCORD"
            activeColor="#5865F2"
            onClick={() => window.open('https://discord.gg/JpxH7NGayc', '_blank')}
          />
        </div>

        {/* Components drawer */}
        <MobileDrawerOverlay
          open={mobileDrawer === 'components'}
          onClose={() => setMobileDrawer(null)}
          title="HARDWARE MODULES"
          accentColor="#00f5ff"
        >
          <ComponentPanel engine={engine} />
        </MobileDrawerOverlay>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#0a0a0f' }}>
      {modals}
      <CyberHUD engine={engine} playerHandle={player.handle} />

      {offlineMsg && (
        <div
          className="font-pixel text-center py-2"
          style={{ background: '#0a1a02', color: '#39ff14', fontSize: '8px', borderBottom: '1px solid #27b00e' }}
        >
          {offlineMsg}
        </div>
      )}

      {/* Inventory warning banner - Desktop */}
      {inventoryNearFull && (
        <div
          className="font-pixel text-center py-2 cursor-pointer"
          style={{ 
            background: inventoryFull ? '#2a0505' : '#2a1a05', 
            color: inventoryFull ? '#ff2222' : '#ffaa00', 
            fontSize: '8px', 
            borderBottom: `1px solid ${inventoryFull ? '#ff2222' : '#ffaa00'}`,
          }}
          onClick={() => setShowScrap(true)}
        >
          {inventoryFull 
            ? `[!] STORAGE FULL (${inventoryCount}/${inventoryMax}) - SCRAP ITEMS OR LOSE LOOT [!]`
            : `[!] STORAGE ${Math.floor((inventoryCount / inventoryMax) * 100)}% FULL (${inventoryCount}/${inventoryMax}) - CLICK TO SCRAP [!]`
          }
        </div>
      )}

      <div className="flex" style={{ flex: 1, minHeight: 0 }}>
        {/* Left sidebar: Components */}
        <div
          style={{
            width: 234, flexShrink: 0,
            background: '#0a0a0f',
            borderRight: '1px solid #1a2a3a',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <ComponentPanel engine={engine} />
        </div>

        {/* Center: Battlefield */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Battlefield engine={engine} />
        </div>

        {/* Right sidebar: Launcher buttons �� visible on desktop and mobile */}
        <div
          style={{
            width: isMobile ? '100%' : 200, flexShrink: 0,
            background: '#0a0a0f',
            borderLeft: isMobile ? 'none' : '1px solid #1a1a2a',
            borderTop: isMobile ? '1px solid #1a1a2a' : 'none',
            display: 'flex', flexDirection: isMobile ? 'row' : 'column',
            padding: isMobile ? '8px 8px 12px' : '12px 12px 8px', gap: 8,
            overflowX: isMobile ? 'auto' : 'visible',
            overflowY: isMobile ? 'visible' : 'auto',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          }}
        >
          {!isMobile && (
            <div className="font-pixel" style={{ color: '#2a3a4a', fontSize: '6px', letterSpacing: '3px', marginBottom: 2 }}>
              SYSTEMS
            </div>
          )}

          {/* Motherboard / Hardware */}
          <Tooltip content={<><TooltipLabel label="HARDWARE" color="#39ff14" /><TooltipText>Equip dropped items to boost stats. {moboUpgradeAvailable ? 'UPGRADE AVAILABLE!' : ''}</TooltipText></>} position="left">
            <button
              onClick={() => setShowMotherboard(true)}
              style={{
                width: '100%', background: moboUpgradeAvailable ? '#051a05' : (inventoryCount > 0 ? '#031a10' : '#080810'),
                border: `1px solid ${moboUpgradeAvailable ? '#39ff14' : (inventoryCount > 0 ? '#39ff1455' : '#1a2a2a')}`,
                color: moboUpgradeAvailable ? '#39ff14' : (inventoryCount > 0 ? '#39ff14' : '#2a3a4a'), padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: moboUpgradeAvailable ? '0 0 15px rgba(57,255,20,0.3)' : (inventoryCount > 0 ? '0 0 10px rgba(57,255,20,0.12)' : 'none'), transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#39ff14'; e.currentTarget.style.color = '#39ff14'; e.currentTarget.style.boxShadow = '0 0 14px rgba(57,255,20,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = moboUpgradeAvailable ? '#39ff14' : (inventoryCount > 0 ? '#39ff1455' : '#1a2a2a'); e.currentTarget.style.color = moboUpgradeAvailable ? '#39ff14' : (inventoryCount > 0 ? '#39ff14' : '#2a3a4a'); e.currentTarget.style.boxShadow = moboUpgradeAvailable ? '0 0 15px rgba(57,255,20,0.3)' : (inventoryCount > 0 ? '0 0 10px rgba(57,255,20,0.12)' : 'none'); }}
            >
              {moboUpgradeAvailable && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#39ff14', color: '#000',
                  padding: '1px 4px', fontSize: '6px', fontFamily: 'var(--font-mono)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  ↑
                </div>
              )}
              <CircuitBoard size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>HARDWARE</div>
              {moboUpgradeAvailable ? (
                <div style={{ background: '#39ff14', color: '#000', padding: '1px 6px', fontSize: '7px', lineHeight: '14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                  UPGRADE!
                </div>
              ) : inventoryCount > 0 && (
                <div style={{ background: '#39ff14', color: '#000', padding: '1px 6px', fontSize: '7px', lineHeight: '14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                  {inventoryCount} IN STORAGE
                </div>
              )}
            </button>
          </Tooltip>

          {/* Upgrades / Hero */}
          <Tooltip content={<><TooltipLabel label="UPGRADES" color="#00f5ff" /><TooltipText>Level up tap damage, crit, and skill power.</TooltipText></>} position="left">
            <button
              onClick={() => setShowUpgrades(true)}
              style={{
                width: '100%', background: '#080818',
                border: '1px solid #0a2838',
                color: '#2a5a6a', padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f5ff'; e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0,245,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#0a2838'; e.currentTarget.style.color = '#2a5a6a'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <ArrowUp size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>UPGRADES</div>
            </button>
          </Tooltip>

          {/* Relics (Prestige System) */}
          <Tooltip content={<><TooltipLabel label="RELICS" color="#ff0080" /><TooltipText>Prestige system: Reset for OC Points to unlock permanent relics.</TooltipText></>} position="left">
            <button
              onClick={() => setShowRelics(true)}
              style={{
                width: '100%', background: availableOCT > 0 ? '#130010' : '#080808',
                border: `1px solid ${availableOCT > 0 ? '#ff008055' : '#1a1a2a'}`,
                color: availableOCT > 0 ? '#ff0080' : '#2a2a3a', padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: availableOCT > 0 ? '0 0 10px rgba(255,0,128,0.12)' : 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff0080'; e.currentTarget.style.color = '#ff0080'; e.currentTarget.style.boxShadow = '0 0 14px rgba(255,0,128,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = availableOCT > 0 ? '#ff008055' : '#1a1a2a'; e.currentTarget.style.color = availableOCT > 0 ? '#ff0080' : '#2a2a3a'; e.currentTarget.style.boxShadow = availableOCT > 0 ? '0 0 10px rgba(255,0,128,0.12)' : 'none'; }}
            >
              <Sparkles size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>RELICS</div>
              {availableOCT > 0 && (
                <div style={{ background: '#ff0080', color: '#000', padding: '1px 6px', fontSize: '7px', lineHeight: '14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                  {availableOCT} OCP
                </div>
              )}
            </button>
          </Tooltip>

          {/* Skill Tree */}
          <Tooltip content={<><TooltipLabel label="SKILL TREE" color="#00ff88" /><TooltipText>Spend Skill Points on permanent stat bonuses.</TooltipText></>} position="left">
            <button
              onClick={() => setShowSkillTree(true)}
              style={{
                width: '100%', background: skillPoints > 0 ? '#001810' : '#080810',
                border: `1px solid ${skillPoints > 0 ? '#00ff8866' : '#0a2a1a'}`,
                color: skillPoints > 0 ? '#00ff88' : '#1a5a3a', padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: skillPoints > 0 ? '0 0 10px rgba(0,255,136,0.15)' : 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff88'; e.currentTarget.style.color = '#00ff88'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0,255,136,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = skillPoints > 0 ? '#00ff8866' : '#0a2a1a'; e.currentTarget.style.color = skillPoints > 0 ? '#00ff88' : '#1a5a3a'; e.currentTarget.style.boxShadow = skillPoints > 0 ? '0 0 10px rgba(0,255,136,0.15)' : 'none'; }}
            >
              <TrendingUp size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>SKILLS</div>
              {skillPoints > 0 && (
                <div style={{ background: '#00ff88', color: '#000', padding: '1px 6px', fontSize: '7px', lineHeight: '14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                  {skillPoints} SP
                </div>
              )}
            </button>
          </Tooltip>

          {/* Battle Pass */}
          <Tooltip content={<><TooltipLabel label="BATTLE PASS" color="#9933ff" /><TooltipText>Seasonal progression with premium rewards. $7.99 unlocks all premium tiers.</TooltipText></>} position="left">
            <button
              onClick={() => setShowShop(true)}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #0a0020 0%, #100030 100%)',
                border: '1px solid #2a1a5a',
                color: '#6a4a9a', padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#9933ff'; e.currentTarget.style.color = '#9933ff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(153,51,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1a5a'; e.currentTarget.style.color = '#6a4a9a'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Sparkles size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>PASS</div>
            </button>
          </Tooltip>

          {/* Tournament */}
          {MODULES_CONFIG.tournaments.enabled && (
            <Tooltip content={<><TooltipLabel label="TOURNAMENT" color="#ffaa00" /><TooltipText>Compete against other players for Diamond prizes.</TooltipText></>} position="left">
              <button
                onClick={() => setShowTournament(true)}
                style={{
                  width: '100%', background: '#080808',
                  border: '1px solid #1a1200',
                  color: '#3a2a00', padding: '12px 10px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffaa00'; e.currentTarget.style.color = '#ffaa00'; e.currentTarget.style.boxShadow = '0 0 14px rgba(255,170,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1200'; e.currentTarget.style.color = '#3a2a00'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Swords size={20} />
                <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>TOURNEY</div>
              </button>
            </Tooltip>
          )}

          {/* Clan */}
          {MODULES_CONFIG.clans.enabled && (
            <Tooltip content={<><TooltipLabel label="CLAN" color="#00f5ff" /><TooltipText>Join or create a clan to team up with other players.</TooltipText></>} position="left">
              <button
                onClick={() => setShowClan(true)}
                style={{
                  width: '100%', background: '#080810',
                  border: '1px solid #0a2838',
                  color: '#2a4a5a', padding: '12px 10px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f5ff'; e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0,245,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#0a2838'; e.currentTarget.style.color = '#2a4a5a'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Users size={20} />
                <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>CLAN</div>
              </button>
            </Tooltip>
          )}

          {/* Scrapyard */}
          <Tooltip content={<><TooltipLabel label="SCRAPYARD" color="#ff4444" /><TooltipText>Dismantle unwanted hardware into scrap components.</TooltipText></>} position="left">
            <button
              onClick={() => setShowScrap(true)}
              style={{
                width: '100%', background: '#080808',
                border: '1px solid #2a1818',
                color: '#4a2a2a', padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4444'; e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.boxShadow = '0 0 14px rgba(255,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1818'; e.currentTarget.style.color = '#4a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Trash2 size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>SCRAP</div>
            </button>
          </Tooltip>

          {/* Leaderboard */}
          {MODULES_CONFIG.leaderboard.enabled && (
            <Tooltip content={<><TooltipLabel label="LEADERBOARD" /><TooltipText>Global rankings by stage and overclock count.</TooltipText></>} position="left">
              <button
                onClick={() => setShowLeaderboard(true)}
                style={{
                  width: '100%', background: '#080810', border: '1px solid #0a2838', color: '#2a4a5a', padding: '12px 10px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f5ff'; e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0,245,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#0a2838'; e.currentTarget.style.color = '#2a4a5a'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Trophy size={20} />
                <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>RANKS</div>
              </button>
            </Tooltip>
          )}

          {/* Daily Challenges */}
          {MODULES_CONFIG.dailyOps.enabled && (
            <Tooltip content={<><TooltipLabel label="DAILY OPS" color="#00f5ff" /><TooltipText>Complete challenges for gold and diamond rewards.</TooltipText></>} position="left">
              <button
                onClick={() => setShowDailies(true)}
                style={{
                  width: '100%', background: '#080810', border: '1px solid #0a2838', color: '#2a4a5a', padding: '12px 10px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f5ff'; e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0,245,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#0a2838'; e.currentTarget.style.color = '#2a4a5a'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Clock size={20} />
                <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>DAILY OPS</div>
              </button>
            </Tooltip>
          )}

          {/* Achievements */}
          {MODULES_CONFIG.achievements.enabled && (
            <Tooltip content={<><TooltipLabel label="ACHIEVEMENTS" color="#ffaa00" /><TooltipText>Permanent milestones across all runs.</TooltipText></>} position="left">
              <button
                onClick={() => setShowAchievements(true)}
                style={{
                  width: '100%', background: '#080810', border: '1px solid #1a1a0a', color: '#2a3a2a', padding: '12px 10px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffaa00'; e.currentTarget.style.color = '#ffaa00'; e.currentTarget.style.boxShadow = '0 0 14px rgba(255,170,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a0a'; e.currentTarget.style.color = '#2a3a2a'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Award size={20} />
                <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>FEATS</div>
              </button>
            </Tooltip>
          )}

          {/* Community Discord */}
          <Tooltip content={<><TooltipLabel label="DISCORD" color="#5865F2" /><TooltipText>Join our community Discord server.</TooltipText></>} position="left">
            <a
              href="https://discord.gg/JpxH7NGayc"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%', background: '#080815', border: '1px solid #1a0a3a', color: '#2a1a5a', padding: '12px 10px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.15s', textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#5865F2'; e.currentTarget.style.color = '#5865F2'; e.currentTarget.style.boxShadow = '0 0 14px rgba(88,101,242,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a0a3a'; e.currentTarget.style.color = '#2a1a5a'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <MessageCircle size={20} />
              <div className="font-pixel" style={{ fontSize: '7px', letterSpacing: '2px' }}>DISCORD</div>
            </a>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
