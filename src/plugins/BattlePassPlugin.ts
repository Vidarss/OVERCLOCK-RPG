import type { IPlugin, IEngine, GameState, GameEvent, Player } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';

// ═══════════════════════════════════════════════════════════════════════════════
// OVERCLOCK PROTOCOL - BATTLE PASS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// The Battle Pass is the primary monetization system at $7.99
// - 50 Tiers with FREE and PREMIUM tracks
// - XP earned from gameplay (kills, stages, bosses, dailies)
// - Season lasts ~60 days, then resets
// ═══════════════════════════════════════════════════════════════════════════════

export type BattlePassRewardType = 
  | 'gold' 
  | 'diamonds' 
  | 'ocp' 
  | 'skill_points' 
  | 'scrap'
  | 'set_piece'
  | 'relic'
  | 'cosmetic'
  | 'xp_boost'
  | 'gold_boost';

export interface BattlePassReward {
  type: BattlePassRewardType;
  value: number | string; // number for currencies, string for item IDs
  label: string;
  icon: string;
  color: string;
}

export interface BattlePassTier {
  level: number;
  xpRequired: number;
  freeReward: BattlePassReward | null;
  premiumReward: BattlePassReward;
}

// XP Sources
export const BATTLE_PASS_XP = {
  enemyKill: 1,
  eliteKill: 5,
  bossKill: 25,
  stageClear: 10,
  dailyComplete: 100,
  achievementUnlock: 50,
  overclock: 200,
  tournamentParticipate: 150,
} as const;

// Generate 50 tiers of battle pass rewards
export const BATTLE_PASS_TIERS: BattlePassTier[] = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  const xpRequired = Math.floor(100 * Math.pow(1.08, level - 1)); // Exponential XP curve
  
  // Free track rewards (every 5 levels)
  let freeReward: BattlePassReward | null = null;
  if (level % 5 === 0) {
    const freeRewardIndex = level / 5;
    const freeRewards: BattlePassReward[] = [
      { type: 'gold', value: 5000, label: '5K GOLD', icon: 'coins', color: '#ffcc00' },
      { type: 'scrap', value: 100, label: '100 SCRAP', icon: 'cog', color: '#8a9aaa' },
      { type: 'diamonds', value: 10, label: '10 DIAMONDS', icon: 'diamond', color: '#00e5ff' },
      { type: 'skill_points', value: 1, label: '1 SKILL POINT', icon: 'zap', color: '#39ff14' },
      { type: 'gold', value: 25000, label: '25K GOLD', icon: 'coins', color: '#ffcc00' },
      { type: 'scrap', value: 250, label: '250 SCRAP', icon: 'cog', color: '#8a9aaa' },
      { type: 'diamonds', value: 25, label: '25 DIAMONDS', icon: 'diamond', color: '#00e5ff' },
      { type: 'ocp', value: 5, label: '5 OCP', icon: 'cpu', color: '#ff0080' },
      { type: 'skill_points', value: 2, label: '2 SKILL POINTS', icon: 'zap', color: '#39ff14' },
      { type: 'diamonds', value: 100, label: '100 DIAMONDS', icon: 'diamond', color: '#00e5ff' },
    ];
    freeReward = freeRewards[(freeRewardIndex - 1) % freeRewards.length];
  }
  
  // Premium track rewards (every level)
  const premiumRewards: BattlePassReward[] = [
    { type: 'gold', value: 2500 * level, label: `${(2.5 * level).toFixed(0)}K GOLD`, icon: 'coins', color: '#ffcc00' },
    { type: 'diamonds', value: 5 + Math.floor(level / 5) * 5, label: `${5 + Math.floor(level / 5) * 5} DIAMONDS`, icon: 'diamond', color: '#00e5ff' },
    { type: 'scrap', value: 50 + level * 10, label: `${50 + level * 10} SCRAP`, icon: 'cog', color: '#8a9aaa' },
    { type: 'ocp', value: 2 + Math.floor(level / 10), label: `${2 + Math.floor(level / 10)} OCP`, icon: 'cpu', color: '#ff0080' },
    { type: 'skill_points', value: 1, label: '1 SKILL POINT', icon: 'zap', color: '#39ff14' },
  ];
  
  // Special milestone rewards at specific levels
  let premiumReward: BattlePassReward;
  if (level === 10) {
    premiumReward = { type: 'xp_boost', value: 1.1, label: '+10% XP BOOST', icon: 'trending-up', color: '#9933ff' };
  } else if (level === 20) {
    premiumReward = { type: 'gold_boost', value: 1.15, label: '+15% GOLD BOOST', icon: 'trending-up', color: '#ffaa00' };
  } else if (level === 25) {
    premiumReward = { type: 'set_piece', value: 'neural_nexus', label: 'NEXUS SET PIECE', icon: 'box', color: '#00f5ff' };
  } else if (level === 30) {
    premiumReward = { type: 'xp_boost', value: 1.2, label: '+20% XP BOOST', icon: 'trending-up', color: '#9933ff' };
  } else if (level === 35) {
    premiumReward = { type: 'set_piece', value: 'ghost_protocol', label: 'GHOST SET PIECE', icon: 'box', color: '#ff0080' };
  } else if (level === 40) {
    premiumReward = { type: 'gold_boost', value: 1.25, label: '+25% GOLD BOOST', icon: 'trending-up', color: '#ffaa00' };
  } else if (level === 45) {
    premiumReward = { type: 'ocp', value: 50, label: '50 OCP', icon: 'cpu', color: '#ff0080' };
  } else if (level === 50) {
    premiumReward = { type: 'cosmetic', value: 'elite_frame', label: 'ELITE AVATAR FRAME', icon: 'award', color: '#ffffff' };
  } else {
    premiumReward = premiumRewards[(level - 1) % premiumRewards.length];
  }
  
  return { level, xpRequired, freeReward, premiumReward };
});

export const BATTLE_PASS_CONFIG = {
  price: 7.99,
  seasonDurationDays: 60,
  maxTier: 50,
  xpPerTier: BATTLE_PASS_TIERS.map(t => t.xpRequired),
} as const;

export interface BattlePassState {
  seasonId: string;
  isPremium: boolean;
  currentXp: number;
  currentTier: number;
  claimedFreeTiers: number[];
  claimedPremiumTiers: number[];
  purchaseDate: number | null;
  xpBoostMultiplier: number;
  goldBoostMultiplier: number;
}

export class BattlePassPlugin implements IPlugin {
  id = 'battlepass';
  dependencies = ['auth'];
  stateKeys = [] as (keyof GameState)[];

  private engine!: IEngine;
  private userId: string | null = null;
  private state: BattlePassState = {
    seasonId: 'season_1',
    isPremium: false,
    currentXp: 0,
    currentTier: 1,
    claimedFreeTiers: [],
    claimedPremiumTiers: [],
    purchaseDate: null,
    xpBoostMultiplier: 1,
    goldBoostMultiplier: 1,
  };
  private listeners: Array<() => void> = [];
  private unsubs: Array<() => void> = [];

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    engine.storage.registerTable(this.id, { table: 'battle_pass', userScoped: true });

    this.unsubs.push(engine.on('auth_success', (event: GameEvent<Player>) => {
      this.userId = event.payload.id;
      void this.loadBattlePass();
    }));

    const existing = engine.getPlugin<AuthPlugin>('auth')?.getPlayer();
    if (existing) {
      this.userId = existing.id;
      void this.loadBattlePass();
    }

    // Listen for XP-granting events
    this.unsubs.push(engine.on('enemy_death', (event: GameEvent<{ enemy: { isBoss: boolean; isElite: boolean } }>) => {
      const xp = event.payload.enemy.isBoss 
        ? BATTLE_PASS_XP.bossKill 
        : event.payload.enemy.isElite 
          ? BATTLE_PASS_XP.eliteKill 
          : BATTLE_PASS_XP.enemyKill;
      this.addXp(xp);
    }));

    this.unsubs.push(engine.on('stage_clear', () => {
      this.addXp(BATTLE_PASS_XP.stageClear);
    }));

    this.unsubs.push(engine.on('daily_completed', () => {
      this.addXp(BATTLE_PASS_XP.dailyComplete);
    }));

    this.unsubs.push(engine.on('achievement_unlocked', () => {
      this.addXp(BATTLE_PASS_XP.achievementUnlock);
    }));

    this.unsubs.push(engine.on('overclock_confirm', () => {
      this.addXp(BATTLE_PASS_XP.overclock);
    }));
  }

  private async loadBattlePass(): Promise<void> {
    if (!this.userId) return;
    
    const { data } = await this.engine.storage.load<BattlePassState>(
      'battle_pass',
      { user_id: this.userId, season_id: this.state.seasonId },
      'is_premium, current_xp, current_tier, claimed_free_tiers, claimed_premium_tiers, purchase_date, xp_boost_multiplier, gold_boost_multiplier'
    );
    
    if (data) {
      this.state = {
        ...this.state,
        isPremium: (data as Record<string, unknown>).is_premium as boolean ?? false,
        currentXp: (data as Record<string, unknown>).current_xp as number ?? 0,
        currentTier: (data as Record<string, unknown>).current_tier as number ?? 1,
        claimedFreeTiers: (data as Record<string, unknown>).claimed_free_tiers as number[] ?? [],
        claimedPremiumTiers: (data as Record<string, unknown>).claimed_premium_tiers as number[] ?? [],
        purchaseDate: (data as Record<string, unknown>).purchase_date as number ?? null,
        xpBoostMultiplier: (data as Record<string, unknown>).xp_boost_multiplier as number ?? 1,
        goldBoostMultiplier: (data as Record<string, unknown>).gold_boost_multiplier as number ?? 1,
      };
    }
    
    this.applyBoosts();
    this.notify();
  }

  private async saveBattlePass(): Promise<void> {
    if (!this.userId) return;
    
    await this.engine.storage.save('battle_pass', {
      user_id: this.userId,
      season_id: this.state.seasonId,
      is_premium: this.state.isPremium,
      current_xp: this.state.currentXp,
      current_tier: this.state.currentTier,
      claimed_free_tiers: this.state.claimedFreeTiers,
      claimed_premium_tiers: this.state.claimedPremiumTiers,
      purchase_date: this.state.purchaseDate,
      xp_boost_multiplier: this.state.xpBoostMultiplier,
      gold_boost_multiplier: this.state.goldBoostMultiplier,
    }, 'user_id');
  }

  private applyBoosts(): void {
    this.engine.removeModifiers(this.id);
    
    if (this.state.goldBoostMultiplier > 1) {
      this.engine.addModifier(this.id, {
        type: 'gold_rate',
        value: this.state.goldBoostMultiplier,
        isMultiplier: true,
      });
    }
  }

  addXp(amount: number): void {
    // Apply XP boost
    const boostedAmount = Math.floor(amount * this.state.xpBoostMultiplier);
    this.state.currentXp += boostedAmount;
    
    // Check for tier ups
    let tierUp = false;
    while (this.state.currentTier < BATTLE_PASS_CONFIG.maxTier) {
      const currentTierData = BATTLE_PASS_TIERS[this.state.currentTier - 1];
      if (this.state.currentXp >= currentTierData.xpRequired) {
        this.state.currentXp -= currentTierData.xpRequired;
        this.state.currentTier++;
        tierUp = true;
      } else {
        break;
      }
    }
    
    if (tierUp) {
      this.engine.emit('battle_pass_tier_up' as GameEvent['type'], { tier: this.state.currentTier });
    }
    
    void this.saveBattlePass();
    this.notify();
  }

  purchasePremium(): boolean {
    if (this.state.isPremium) return false;
    
    this.state.isPremium = true;
    this.state.purchaseDate = Date.now();
    
    void this.saveBattlePass();
    this.engine.emit('battle_pass_purchased' as GameEvent['type'], {});
    this.notify();
    return true;
  }

  claimReward(tier: number, isPremium: boolean): boolean {
    if (tier > this.state.currentTier) return false;
    
    const tierData = BATTLE_PASS_TIERS[tier - 1];
    if (!tierData) return false;
    
    if (isPremium) {
      if (!this.state.isPremium) return false;
      if (this.state.claimedPremiumTiers.includes(tier)) return false;
      
      this.grantReward(tierData.premiumReward);
      this.state.claimedPremiumTiers.push(tier);
      
      // Check if reward is a boost
      if (tierData.premiumReward.type === 'xp_boost') {
        this.state.xpBoostMultiplier = tierData.premiumReward.value as number;
      } else if (tierData.premiumReward.type === 'gold_boost') {
        this.state.goldBoostMultiplier = tierData.premiumReward.value as number;
        this.applyBoosts();
      }
    } else {
      if (!tierData.freeReward) return false;
      if (this.state.claimedFreeTiers.includes(tier)) return false;
      
      this.grantReward(tierData.freeReward);
      this.state.claimedFreeTiers.push(tier);
    }
    
    void this.saveBattlePass();
    this.notify();
    return true;
  }

  private grantReward(reward: BattlePassReward): void {
    const state = this.engine.state;
    
    switch (reward.type) {
      case 'gold':
        this.engine.updateState({ gold: state.gold + (reward.value as number) });
        break;
      case 'diamonds':
        this.engine.updateState({ diamonds: state.diamonds + (reward.value as number) });
        break;
      case 'ocp':
        this.engine.updateState({ overclockCount: state.overclockCount + (reward.value as number) });
        break;
      case 'skill_points':
        this.engine.updateState({ skillPoints: state.skillPoints + (reward.value as number) });
        break;
      case 'scrap':
        this.engine.updateState({ scrap: state.scrap + (reward.value as number) });
        break;
      // Set pieces and cosmetics would need additional handling
    }
  }

  getState(): BattlePassState {
    return { ...this.state };
  }

  getTierProgress(): { current: number; max: number; percent: number } {
    if (this.state.currentTier >= BATTLE_PASS_CONFIG.maxTier) {
      return { current: 0, max: 0, percent: 100 };
    }
    const tierData = BATTLE_PASS_TIERS[this.state.currentTier - 1];
    return {
      current: this.state.currentXp,
      max: tierData.xpRequired,
      percent: (this.state.currentXp / tierData.xpRequired) * 100,
    };
  }

  canClaimReward(tier: number, isPremium: boolean): boolean {
    if (tier > this.state.currentTier) return false;
    
    if (isPremium) {
      if (!this.state.isPremium) return false;
      return !this.state.claimedPremiumTiers.includes(tier);
    } else {
      const tierData = BATTLE_PASS_TIERS[tier - 1];
      if (!tierData?.freeReward) return false;
      return !this.state.claimedFreeTiers.includes(tier);
    }
  }

  getUnclaimedCount(): { free: number; premium: number } {
    let free = 0;
    let premium = 0;
    
    for (let i = 1; i <= this.state.currentTier; i++) {
      const tierData = BATTLE_PASS_TIERS[i - 1];
      if (tierData.freeReward && !this.state.claimedFreeTiers.includes(i)) free++;
      if (this.state.isPremium && !this.state.claimedPremiumTiers.includes(i)) premium++;
    }
    
    return { free, premium };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.engine?.removeModifiers(this.id);
  }
}
