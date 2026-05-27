import type { IPlugin, IEngine, GameState, GameEvent, Player } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  check: (state: GameState, ctx: AchievementContext) => boolean;
}

export interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface AchievementContext {
  totalKills: number;
  totalBossKills: number;
  totalSkillsUsed: number;
  totalGoldEarned: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // ── Kill Milestones ───────────────────────────────────────────────
  {
    id: 'first_blood',
    name: 'FIRST BLOOD',
    description: 'Defeat your first enemy',
    icon: 'Crosshair',
    color: '#00f5ff',
    check: (_s, ctx) => ctx.totalKills >= 1,
  },
  {
    id: 'kill_100',
    name: 'CENTURION',
    description: 'Defeat 100 enemies',
    icon: 'Target',
    color: '#39ff14',
    check: (_s, ctx) => ctx.totalKills >= 100,
  },
  {
    id: 'kill_500',
    name: 'KILL STREAK',
    description: 'Defeat 500 enemies',
    icon: 'Target',
    color: '#39ff14',
    check: (_s, ctx) => ctx.totalKills >= 500,
  },
  {
    id: 'kill_1000',
    name: 'MASS DELETION',
    description: 'Defeat 1,000 enemies',
    icon: 'Target',
    color: '#ffaa00',
    check: (_s, ctx) => ctx.totalKills >= 1000,
  },
  {
    id: 'kill_5000',
    name: 'EXTINCTION EVENT',
    description: 'Defeat 5,000 enemies',
    icon: 'Target',
    color: '#ff4444',
    check: (_s, ctx) => ctx.totalKills >= 5000,
  },
  {
    id: 'kill_10000',
    name: 'THE PURGE',
    description: 'Defeat 10,000 enemies',
    icon: 'Target',
    color: '#ff0080',
    check: (_s, ctx) => ctx.totalKills >= 10000,
  },

  // ── Boss Kills ───────────────────────────────────────────────────
  {
    id: 'boss_slayer',
    name: 'BOSS SLAYER',
    description: 'Defeat 10 bosses',
    icon: 'Skull',
    color: '#ff4444',
    check: (_s, ctx) => ctx.totalBossKills >= 10,
  },
  {
    id: 'boss_slayer_50',
    name: 'APEX PREDATOR',
    description: 'Defeat 50 bosses',
    icon: 'Skull',
    color: '#ff4444',
    check: (_s, ctx) => ctx.totalBossKills >= 50,
  },
  {
    id: 'boss_slayer_100',
    name: 'BOSS HUNTER',
    description: 'Defeat 100 bosses',
    icon: 'Skull',
    color: '#ff2200',
    check: (_s, ctx) => ctx.totalBossKills >= 100,
  },
  {
    id: 'boss_slayer_500',
    name: 'OVERLORD KILLER',
    description: 'Defeat 500 bosses',
    icon: 'Skull',
    color: '#dd0000',
    check: (_s, ctx) => ctx.totalBossKills >= 500,
  },

  // ── Stage Milestones ─────────────────────────────────────────────
  {
    id: 'stage_10',
    name: 'WARMING UP',
    description: 'Reach stage 10',
    icon: 'TrendingUp',
    color: '#00f5ff',
    check: s => s.highestStage >= 10,
  },
  {
    id: 'stage_25',
    name: 'MID GAME',
    description: 'Reach stage 25',
    icon: 'TrendingUp',
    color: '#39ff14',
    check: s => s.highestStage >= 25,
  },
  {
    id: 'stage_50',
    name: 'DEEP RUN',
    description: 'Reach stage 50',
    icon: 'TrendingUp',
    color: '#ffaa00',
    check: s => s.highestStage >= 50,
  },
  {
    id: 'stage_100',
    name: 'ENDGAME',
    description: 'Reach stage 100',
    icon: 'TrendingUp',
    color: '#ff0080',
    check: s => s.highestStage >= 100,
  },
  {
    id: 'stage_200',
    name: 'GOING DEEPER',
    description: 'Reach stage 200',
    icon: 'TrendingUp',
    color: '#ff0080',
    check: s => s.highestStage >= 200,
  },
  {
    id: 'stage_500',
    name: 'HALF A THOUSAND',
    description: 'Reach stage 500',
    icon: 'TrendingUp',
    color: '#ff4444',
    check: s => s.highestStage >= 500,
  },
  {
    id: 'stage_1000',
    name: 'FOUR DIGITS',
    description: 'Reach stage 1,000',
    icon: 'TrendingUp',
    color: '#ff2200',
    check: s => s.highestStage >= 1000,
  },
  {
    id: 'stage_2500',
    name: 'BEYOND THE VOID',
    description: 'Reach stage 2,500',
    icon: 'TrendingUp',
    color: '#dd0000',
    check: s => s.highestStage >= 2500,
  },
  {
    id: 'stage_5000',
    name: 'THE FINAL STAGE',
    description: 'Reach stage 5,000',
    icon: 'TrendingUp',
    color: '#aa0000',
    check: s => s.highestStage >= 5000,
  },

  // ── Overclock Milestones ─────────────────────────────────────────
  {
    id: 'first_overclock',
    name: 'REBOOT',
    description: 'Perform your first Overclock',
    icon: 'RotateCcw',
    color: '#00f5ff',
    check: s => s.totalOverclocks >= 1,
  },
  {
    id: 'overclock_5',
    name: 'SERIAL OVERCLOCKER',
    description: 'Perform 5 Overclocks',
    icon: 'RotateCcw',
    color: '#39ff14',
    check: s => s.totalOverclocks >= 5,
  },
  {
    id: 'overclock_10',
    name: 'LOOP MASTER',
    description: 'Perform 10 Overclocks',
    icon: 'RotateCcw',
    color: '#ffaa00',
    check: s => s.totalOverclocks >= 10,
  },
  {
    id: 'overclock_25',
    name: 'INFINITE REGRESS',
    description: 'Perform 25 Overclocks',
    icon: 'RotateCcw',
    color: '#ff4444',
    check: s => s.totalOverclocks >= 25,
  },
  {
    id: 'overclock_50',
    name: 'RESET GOD',
    description: 'Perform 50 Overclocks',
    icon: 'RotateCcw',
    color: '#ff0080',
    check: s => s.totalOverclocks >= 50,
  },
  {
    id: 'overclock_100',
    name: 'THE ETERNAL LOOP',
    description: 'Perform 100 Overclocks',
    icon: 'RotateCcw',
    color: '#dd0000',
    check: s => s.totalOverclocks >= 100,
  },

  // ── Gold Milestones ──────────────────────────────────────────────
  {
    id: 'gold_hoarder',
    name: 'GOLD HOARDER',
    description: 'Earn 10,000 total gold',
    icon: 'Coins',
    color: '#ffaa00',
    check: (_s, ctx) => ctx.totalGoldEarned >= 10000,
  },
  {
    id: 'gold_100k',
    name: 'FILTHY RICH',
    description: 'Earn 100,000 total gold',
    icon: 'Coins',
    color: '#ffaa00',
    check: (_s, ctx) => ctx.totalGoldEarned >= 100000,
  },
  {
    id: 'gold_1m',
    name: 'MILLIONAIRE',
    description: 'Earn 1,000,000 total gold',
    icon: 'Coins',
    color: '#ffcc00',
    check: (_s, ctx) => ctx.totalGoldEarned >= 1000000,
  },
  {
    id: 'gold_1b',
    name: 'GOLD BARON',
    description: 'Earn 1,000,000,000 total gold',
    icon: 'Coins',
    color: '#ff8800',
    check: (_s, ctx) => ctx.totalGoldEarned >= 1000000000,
  },
  {
    id: 'gold_1t',
    name: 'INFINITE WEALTH',
    description: 'Earn 1 trillion total gold',
    icon: 'Coins',
    color: '#ff4400',
    check: (_s, ctx) => ctx.totalGoldEarned >= 1000000000000,
  },

  // ── Skill Milestones ─────────────────────────────────────────────
  {
    id: 'skill_master',
    name: 'SKILL MASTER',
    description: 'Use skills 50 times',
    icon: 'Zap',
    color: '#00f5ff',
    check: (_s, ctx) => ctx.totalSkillsUsed >= 50,
  },
  {
    id: 'skill_200',
    name: 'ABILITY ADDICT',
    description: 'Use skills 200 times',
    icon: 'Zap',
    color: '#39ff14',
    check: (_s, ctx) => ctx.totalSkillsUsed >= 200,
  },
  {
    id: 'skill_500',
    name: 'POWER JUNKIE',
    description: 'Use skills 500 times',
    icon: 'Zap',
    color: '#ffaa00',
    check: (_s, ctx) => ctx.totalSkillsUsed >= 500,
  },

  // ── Equipment & Motherboard ──────────────────────────────────────
  {
    id: 'full_equipped',
    name: 'FULLY LOADED',
    description: 'Fill all motherboard slots',
    icon: 'HardDrive',
    color: '#39ff14',
    check: s => {
      const slots = s.equippedItems;
      if (!slots) return false;
      return Object.values(slots).every(arr =>
        Array.isArray(arr) && arr.length > 0 && arr.every(item => item !== null)
      );
    },
  },
  {
    id: 'first_legendary',
    name: 'LEGENDARY FIND',
    description: 'Equip a Legendary item',
    icon: 'Star',
    color: '#ffcc00',
    check: s => {
      const slots = s.equippedItems;
      if (!slots) return false;
      return Object.values(slots).some(arr =>
        Array.isArray(arr) && arr.some(item => item?.rarity === 'Legendary')
      );
    },
  },
  {
    id: 'item_hoarder',
    name: 'HARDWARE JUNKIE',
    description: 'Collect 40 items',
    icon: 'Package',
    color: '#ffaa00',
    check: s => (s.inventory?.length ?? 0) >= 40,
  },
  {
    id: 'silicon_ghost_board',
    name: 'SILICON BOARD',
    description: 'Upgrade to the Silicon Ghost motherboard',
    icon: 'Cpu',
    color: '#39ff14',
    check: s => (s.motherboardTier ?? 0) >= 4,
  },
  {
    id: 'omega_rig',
    name: 'OMEGA RIG',
    description: 'Upgrade to the Omega Rig motherboard',
    icon: 'Cpu',
    color: '#ffaa00',
    check: s => (s.motherboardTier ?? 0) >= 7,
  },

  // ── Component Milestones ─────────────────────────────────────────
  {
    id: 'first_module',
    name: 'FIRST MODULE',
    description: 'Purchase your first component level',
    icon: 'Package',
    color: '#00f5ff',
    check: s => Object.values(s.components ?? {}).some(c => c.level >= 1),
  },
  {
    id: 'all_modules',
    name: 'FULL ARSENAL',
    description: 'Unlock all 10 components',
    icon: 'Package',
    color: '#39ff14',
    check: s => Object.values(s.components ?? {}).filter(c => c.unlocked).length >= 10,
  },
  {
    id: 'max_module',
    name: 'MAXED OUT',
    description: 'Level any component to 100',
    icon: 'Package',
    color: '#ff0080',
    check: s => Object.values(s.components ?? {}).some(c => c.level >= 100),
  },

  // ── Prestige / Quantum tier ──────────────────────────────────────
  {
    id: 'quantum_fork',
    name: 'QUANTUM FORK',
    description: 'Reach Overclock tier 6 (QUANTUM FORK)',
    icon: 'GitBranch',
    color: '#cc44ff',
    check: s => (s.overclockTier ?? 0) >= 6,
  },
  {
    id: 'the_singularity',
    name: 'THE SINGULARITY',
    description: 'Reach Overclock tier 9',
    icon: 'Infinity',
    color: '#8800bb',
    check: s => (s.overclockTier ?? 0) >= 9,
  },
];

interface AchievementStatsRow {
  user_id: string;
  total_kills: number;
  total_boss_kills: number;
  total_skills_used: number;
}

export class AchievementPlugin implements IPlugin {
  id = 'achievement';
  dependencies = ['auth'];
  stateKeys = [] as (keyof GameState)[];

  private engine!: IEngine;
  private unlocked: Set<string> = new Set();
  private unlockedList: UnlockedAchievement[] = [];
  private listeners: Array<() => void> = [];
  private unsubs: Array<() => void> = [];
  private userId: string | null = null;
  private ctx: AchievementContext = { totalKills: 0, totalBossKills: 0, totalSkillsUsed: 0, totalGoldEarned: 0 };
  private sessionKills = 0;
  private sessionBossKills = 0;
  private sessionSkillsUsed = 0;
  private sessionGoldEarned = 0;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private saveStatsTimer: ReturnType<typeof setInterval> | null = null;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.storage.registerTable(this.id, { table: 'achievements', userScoped: true });
    engine.storage.registerTable('achievement_stats', { table: 'achievement_stats', userScoped: true });

    this.unsubs.push(
      engine.on('auth_success', (event: GameEvent<Player>) => {
        this.userId = event.payload.id;
        void this.loadAchievements();
      })
    );

    // Handle already-logged-in users
    const existingPlayer = engine.getPlugin<AuthPlugin>('auth')?.getPlayer();
    if (existingPlayer) {
      this.userId = existingPlayer.id;
      void this.loadAchievements();
    }

    this.unsubs.push(
      engine.on('enemy_death', (event: GameEvent<{ enemy: { isBoss: boolean } }>) => {
        this.ctx.totalKills++;
        this.sessionKills++;
        if (event.payload.enemy.isBoss) {
          this.ctx.totalBossKills++;
          this.sessionBossKills++;
        }
      })
    );

    this.unsubs.push(
      engine.on('skill_activated', () => {
        this.ctx.totalSkillsUsed++;
        this.sessionSkillsUsed++;
      })
    );

    this.unsubs.push(
      engine.on('stage_clear', (event: GameEvent<{ goldReward: number }>) => {
        this.ctx.totalGoldEarned += event.payload.goldReward;
        this.sessionGoldEarned += event.payload.goldReward;
      })
    );

    this.checkTimer = setInterval(() => this.checkAchievements(), 2000);
    // Persist stats every 30 seconds
    this.saveStatsTimer = setInterval(() => void this.saveStats(), 30000);
  }

  private async loadAchievements(): Promise<void> {
    if (!this.userId) return;

    const [achievementsResult, statsResult] = await Promise.all([
      this.engine.storage.loadMany('achievements', { user_id: this.userId }),
      this.engine.storage.load<AchievementStatsRow>('achievement_stats', { user_id: this.userId }),
    ]);

    if (achievementsResult.data) {
      this.unlockedList = achievementsResult.data as UnlockedAchievement[];
      this.unlocked = new Set(this.unlockedList.map(a => a.achievement_id));
    }

    if (statsResult.data) {
      this.ctx.totalKills = statsResult.data.total_kills;
      this.ctx.totalBossKills = statsResult.data.total_boss_kills;
      this.ctx.totalSkillsUsed = statsResult.data.total_skills_used;
      this.ctx.totalGoldEarned = (statsResult.data as AchievementStatsRow & { total_gold_earned?: number }).total_gold_earned ?? 0;
    }

    this.notify();
  }

  private async saveStats(): Promise<void> {
    if (!this.userId || (this.sessionKills === 0 && this.sessionBossKills === 0 && this.sessionSkillsUsed === 0 && this.sessionGoldEarned === 0)) return;

    await this.engine.storage.save('achievement_stats', {
      user_id: this.userId,
      total_kills: this.ctx.totalKills,
      total_boss_kills: this.ctx.totalBossKills,
      total_skills_used: this.ctx.totalSkillsUsed,
      total_gold_earned: this.ctx.totalGoldEarned,
      updated_at: new Date().toISOString(),
    }, 'user_id');

    this.sessionKills = 0;
    this.sessionBossKills = 0;
    this.sessionSkillsUsed = 0;
    this.sessionGoldEarned = 0;
  }

  private checkAchievements(): void {
    if (!this.userId) return;

    const state = this.engine.state;
    for (const def of ACHIEVEMENT_DEFS) {
      if (this.unlocked.has(def.id)) continue;
      if (def.check(state, this.ctx)) {
        this.unlock(def);
      }
    }
  }

  private unlock(def: AchievementDef): void {
    if (this.unlocked.has(def.id)) return;

    this.unlocked.add(def.id);
    const entry: UnlockedAchievement = { achievement_id: def.id, unlocked_at: new Date().toISOString() };
    this.unlockedList.push(entry);

    this.engine.emit('achievement_unlocked', { achievement: def });
    this.notify();

    void this.saveAchievement(def.id);
  }

  private async saveAchievement(achievementId: string): Promise<void> {
    if (!this.userId) return;
    await this.engine.storage.insert('achievements', {
      user_id: this.userId,
      achievement_id: achievementId,
    });
  }

  getUnlocked(): Set<string> {
    return this.unlocked;
  }

  getUnlockedList(): UnlockedAchievement[] {
    return this.unlockedList;
  }

  getProgress(): { total: number; unlocked: number } {
    return { total: ACHIEVEMENT_DEFS.length, unlocked: this.unlocked.size };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  cleanup(): void {
    void this.saveStats();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.listeners = [];
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    if (this.saveStatsTimer) {
      clearInterval(this.saveStatsTimer);
      this.saveStatsTimer = null;
    }
  }
}
