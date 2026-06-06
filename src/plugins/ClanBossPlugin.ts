import type { IPlugin, IEngine, GameState, GameEvent, Player } from '../engine/types';
import type { AuthPlugin } from './AuthPlugin';
import type { ClanPlugin } from './ClanPlugin';
import { getTotalIdleDps } from './ComponentPlugin';
import { CLAN_BOSS_CONFIG } from '../config/game.config';
import { subscribeToTable, type RealtimeSubscription } from '../lib/db/realtime';

export interface ClanBoss {
  id: string;
  clan_id: string;
  name: string;
  tier: number;
  max_hp: number;
  current_hp: number;
  status: 'active' | 'defeated' | 'expired';
  spawned_by: string | null;
  spawned_at: string;
  expires_at: string;
  defeated_at: string | null;
}

export interface ClanBossContribution {
  id: string;
  boss_id: string;
  clan_id: string;
  user_id: string;
  handle: string;
  damage: number;
  updated_at: string;
}

/**
 * ClanBossPlugin — a shared, massive-HP raid boss for an entire clan.
 *
 * The boss HP is authoritative on the server. Every member's attack calls the
 * `deal_clan_boss_damage` RPC, which atomically subtracts from the shared pool
 * and accumulates that member's contribution. Realtime subscriptions keep all
 * members' UIs in sync as the HP drops.
 */
export class ClanBossPlugin implements IPlugin {
  id = 'clan_boss';
  dependencies = ['auth', 'clan'];
  stateKeys = [] as (keyof GameState)[];

  private engine!: IEngine;
  private userId: string | null = null;
  private handle = '';

  private boss: ClanBoss | null = null;
  private contributions: ClanBossContribution[] = [];
  private lastAttackAt = 0;
  private rewardedBossIds = new Set<string>();

  private listeners: Array<() => void> = [];
  private unsubs: Array<() => void> = [];
  private bossSub: RealtimeSubscription | null = null;
  private contribSub: RealtimeSubscription | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.storage.registerTable(this.id + '_boss', { table: 'clan_bosses', userScoped: false });
    engine.storage.registerTable(this.id + '_contrib', { table: 'clan_boss_contributions', userScoped: false });

    this.unsubs.push(
      engine.on('auth_success', (event: GameEvent<Player>) => {
        this.userId = event.payload.id;
        this.handle = event.payload.handle;
        void this.load();
      })
    );

    this.unsubs.push(
      engine.on('auth_signout', () => {
        this.userId = null;
        this.handle = '';
        this.boss = null;
        this.contributions = [];
        this.teardownRealtime();
        this.notify();
      })
    );

    // Reload when clan membership changes (join/leave/create)
    this.unsubs.push(
      engine.on('clan_changed', () => {
        void this.load();
      })
    );

    const existing = engine.getPlugin<AuthPlugin>('auth')?.getPlayer();
    if (existing) {
      this.userId = existing.id;
      this.handle = existing.handle;
      void this.load();
    }

    // Realtime fallback poll
    this.pollTimer = setInterval(() => {
      if (this.boss && this.boss.status === 'active') void this.refreshBoss();
    }, CLAN_BOSS_CONFIG.pollIntervalMs);
  }

  private getClanId(): string | null {
    return this.engine.getPlugin<ClanPlugin>('clan')?.getMyClan()?.id ?? null;
  }

  private async load(): Promise<void> {
    this.teardownRealtime();
    const clanId = this.getClanId();
    if (!clanId) {
      this.boss = null;
      this.contributions = [];
      this.notify();
      return;
    }
    await this.loadActiveBoss(clanId);
    this.setupRealtime(clanId);
    this.notify();
  }

  private async loadActiveBoss(clanId: string): Promise<void> {
    const { data } = await this.engine.storage.loadMany<ClanBoss>(
      'clan_bosses',
      { clan_id: clanId, status: 'active' },
      'id, clan_id, name, tier, max_hp, current_hp, status, spawned_by, spawned_at, expires_at, defeated_at'
    );
    // Most-recently spawned active boss (there should only be one)
    this.boss = data.sort((a, b) => new Date(b.spawned_at).getTime() - new Date(a.spawned_at).getTime())[0] ?? null;
    if (this.boss) {
      await this.loadContributions(this.boss.id);
    } else {
      this.contributions = [];
    }
  }

  private async loadContributions(bossId: string): Promise<void> {
    const { data } = await this.engine.storage.loadMany<ClanBossContribution>(
      'clan_boss_contributions',
      { boss_id: bossId },
      'id, boss_id, clan_id, user_id, handle, damage, updated_at'
    );
    this.contributions = data.sort((a, b) => b.damage - a.damage);
  }

  private async refreshBoss(): Promise<void> {
    if (!this.boss) return;
    const { data } = await this.engine.storage.load<ClanBoss>(
      'clan_bosses',
      { id: this.boss.id },
      'id, clan_id, name, tier, max_hp, current_hp, status, spawned_by, spawned_at, expires_at, defeated_at'
    );
    if (data) {
      const wasActive = this.boss.status === 'active';
      this.boss = data;
      await this.loadContributions(data.id);
      if (wasActive && data.status === 'defeated') this.handleDefeat(data);
      this.notify();
    }
  }

  private setupRealtime(clanId: string): void {
    this.bossSub = subscribeToTable<ClanBoss>(
      'clan_bosses',
      {
        onInsert: (row) => { if (row.clan_id === clanId && row.status === 'active') void this.refreshAll(clanId); },
        onUpdate: (row) => {
          if (row.clan_id !== clanId) return;
          const wasActive = this.boss?.status === 'active';
          this.boss = row;
          void this.loadContributions(row.id);
          if (wasActive && row.status === 'defeated') this.handleDefeat(row);
          this.notify();
        },
      },
      { column: 'clan_id', value: clanId }
    );

    this.contribSub = subscribeToTable<ClanBossContribution>(
      'clan_boss_contributions',
      {
        onInsert: (row) => { if (this.boss && row.boss_id === this.boss.id) void this.loadContributions(this.boss.id).then(() => this.notify()); },
        onUpdate: (row) => { if (this.boss && row.boss_id === this.boss.id) void this.loadContributions(this.boss.id).then(() => this.notify()); },
      },
      { column: 'clan_id', value: clanId }
    );
  }

  private async refreshAll(clanId: string): Promise<void> {
    await this.loadActiveBoss(clanId);
    this.notify();
  }

  private teardownRealtime(): void {
    this.bossSub?.unsubscribe();
    this.contribSub?.unsubscribe();
    this.bossSub = null;
    this.contribSub = null;
  }

  private handleDefeat(boss: ClanBoss): void {
    if (this.rewardedBossIds.has(boss.id)) return;
    // Only reward members who actually contributed damage
    const contributed = this.contributions.some(c => c.user_id === this.userId && c.damage > 0);
    if (contributed) {
      this.engine.updateState({ diamonds: (this.engine.state.diamonds ?? 0) + CLAN_BOSS_CONFIG.defeatRewardDiamonds });
      this.engine.emit('save_requested', {});
    }
    this.rewardedBossIds.add(boss.id);
    this.engine.emit('clan_boss_defeated', { boss, rewardDiamonds: contributed ? CLAN_BOSS_CONFIG.defeatRewardDiamonds : 0 });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Compute this player's single-attack damage from their combat power. */
  getAttackDamage(): number {
    const state = this.engine.state;
    const idleDps = getTotalIdleDps(state.components ?? {}) * this.engine.getModifier('idle_dps');
    const power = idleDps * CLAN_BOSS_CONFIG.attackPowerWindowSeconds;
    return Math.max(CLAN_BOSS_CONFIG.minAttackDamage, Math.floor(power));
  }

  /** Spawn a boss for the player's clan (no-op if one is already active). */
  async spawnBoss(tier = 1): Promise<{ success: boolean; error?: string }> {
    if (!this.userId) return { success: false, error: 'Not logged in' };
    const clanId = this.getClanId();
    if (!clanId) return { success: false, error: 'Join a clan first' };
    if (this.boss && this.boss.status === 'active') return { success: false, error: 'A boss is already active' };

    const safeTier = Math.max(1, tier);
    const maxHp = Math.floor(CLAN_BOSS_CONFIG.baseHp * Math.pow(CLAN_BOSS_CONFIG.hpGrowthPerTier, safeTier - 1));
    const name = CLAN_BOSS_CONFIG.bossNames[(safeTier - 1) % CLAN_BOSS_CONFIG.bossNames.length];

    const { data, error } = await this.engine.storage.rpc<ClanBoss[]>('spawn_clan_boss', {
      p_clan_id: clanId,
      p_user_id: this.userId,
      p_name: name,
      p_tier: safeTier,
      p_max_hp: maxHp,
      p_duration_seconds: CLAN_BOSS_CONFIG.durationHours * 3600,
    });

    if (error) return { success: false, error };
    const boss = Array.isArray(data) ? data[0] : (data as ClanBoss | null);
    if (boss) {
      this.boss = boss;
      await this.loadContributions(boss.id);
    } else {
      await this.loadActiveBoss(clanId);
    }
    this.notify();
    return { success: true };
  }

  /** Attack the active clan boss with this player's combat power. */
  async attack(): Promise<{ success: boolean; error?: string; damage?: number; defeated?: boolean }> {
    if (!this.userId) return { success: false, error: 'Not logged in' };
    if (!this.boss || this.boss.status !== 'active') return { success: false, error: 'No active boss' };

    const now = Date.now();
    if (now - this.lastAttackAt < CLAN_BOSS_CONFIG.attackCooldownMs) {
      return { success: false, error: 'Attack on cooldown' };
    }
    this.lastAttackAt = now;

    const damage = this.getAttackDamage();
    const bossId = this.boss.id;

    // Optimistic local update for snappy UI
    this.boss = { ...this.boss, current_hp: Math.max(0, this.boss.current_hp - damage) };
    this.notify();

    const { data, error } = await this.engine.storage.rpc<ClanBoss[]>('deal_clan_boss_damage', {
      p_boss_id: bossId,
      p_user_id: this.userId,
      p_handle: this.handle,
      p_damage: damage,
    });

    if (error) {
      // Roll back optimistic update by reloading authoritative state
      await this.refreshBoss();
      return { success: false, error };
    }

    const updated = Array.isArray(data) ? data[0] : (data as ClanBoss | null);
    if (updated) {
      const wasActive = this.boss?.status === 'active';
      this.boss = updated;
      await this.loadContributions(bossId);
      const defeated = updated.status === 'defeated';
      if (wasActive && defeated) this.handleDefeat(updated);
      this.notify();
      return { success: true, damage, defeated };
    }

    await this.refreshBoss();
    return { success: true, damage };
  }

  getBoss(): ClanBoss | null { return this.boss; }
  getContributions(): ClanBossContribution[] { return this.contributions; }
  getMyContribution(): ClanBossContribution | null {
    return this.contributions.find(c => c.user_id === this.userId) ?? null;
  }
  hasActiveBoss(): boolean { return !!this.boss && this.boss.status === 'active'; }
  getAttackCooldownRemaining(): number {
    return Math.max(0, CLAN_BOSS_CONFIG.attackCooldownMs - (Date.now() - this.lastAttackAt));
  }
  refresh(): void { void this.load(); }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify(): void { for (const l of this.listeners) l(); }

  cleanup(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.teardownRealtime();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.listeners = [];
  }
}
