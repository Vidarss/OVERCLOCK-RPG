// =====================================================================
// DataPacketPlugin - Ad-reward system ("intercepted transmissions")
// =====================================================================

import type { IPlugin, IEngine, GameState } from '../engine/types';
import { DATAPACKET_CONFIG, type DataPacketDef, type DataPacketType } from '../config/datapacket.config';
import { AdService } from '../services/AdService';
import type { SkillPlugin } from './SkillPlugin';

export interface ActiveDataPacket {
  id: string;
  type: DataPacketType;
  def: DataPacketDef;
  goldReward: number;
  spawnedAt: number;
  expiresAt: number;
}

export class DataPacketPlugin implements IPlugin {
  id = 'datapacket';
  dependencies = ['auth'];
  stateKeys = [] as (keyof GameState)[];
  defaultState = {};

  private engine!: IEngine;
  private activePacket: ActiveDataPacket | null = null;
  private nextSpawnTime = 0;
  private lastCollectTime = 0;
  private isProcessing = false;
  private listeners: (() => void)[] = [];

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;
    
    // Initialize ad service (safe to call - no-op if not configured)
    try {
      await AdService.initialize();
    } catch (error) {
      console.warn('[DataPacketPlugin] Ad service initialization failed:', error);
    }

    // Schedule first packet after a normal random interval (not immediately)
    this.scheduleNextSpawn();
  }

  onTick(delta: number, state: GameState): void {
    const now = Date.now();

    // Check if active packet has expired
    if (this.activePacket && now >= this.activePacket.expiresAt) {
      this.expirePacket();
    }

    // Check if it's time to spawn a new packet
    if (!this.activePacket && !this.isProcessing && now >= this.nextSpawnTime) {
      // Ensure cooldown after collection has passed
      if (now - this.lastCollectTime >= DATAPACKET_CONFIG.collectCooldown) {
        this.spawnPacket(state.stage);
      }
    }
  }

  /**
   * Get the currently active data packet (if any)
   */
  getActivePacket(): ActiveDataPacket | null {
    return this.activePacket;
  }

  /**
   * Check if currently processing (collecting/watching ad)
   */
  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get gold multiplier from active skills (gold_rush, signal_jam, etc.)
   */
  private getGoldMultiplier(): number {
    const skillPlugin = this.engine.getPlugin<SkillPlugin>('skill');
    if (!skillPlugin) return 1;

    let multiplier = 1;
    // Gold multiplier skills: gold_rush (×3), signal_jam (×2), entropy_burst (×3 gold)
    if (skillPlugin.isSkillActive('gold_rush')) multiplier *= 3;
    if (skillPlugin.isSkillActive('signal_jam')) multiplier *= 2;
    if (skillPlugin.isSkillActive('entropy_burst')) multiplier *= 3;
    return multiplier;
  }

  /**
   * Collect a basic (non-ad) packet immediately
   */
  collectBasicPacket(): void {
    if (!this.activePacket || this.activePacket.def.requiresAd || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const reward = this.activePacket.goldReward;

    // Add gold immediately (no skill multiplier for basic)
    this.engine.updateState({
      gold: this.engine.state.gold + reward,
    });

    this.engine.emit('datapacket_collected', {
      type: this.activePacket.type,
      goldReward: reward,
      wasAd: false,
    });

    this.engine.emit('gold_changed', { delta: reward, reason: 'datapacket' });

    // Clear packet and schedule next
    this.clearPacket();
    this.lastCollectTime = Date.now();
    this.isProcessing = false;
    this.scheduleNextSpawn();
  }

  /**
   * Start watching an ad for encrypted packet
   * Ad rewards include skill multiplier bonus (gold_rush, signal_jam, entropy_burst)
   * Skill is not activated, just the gold amount gets the bonus
   */
  async collectEncryptedPacket(): Promise<boolean> {
    if (!this.activePacket || !this.activePacket.def.requiresAd || this.isProcessing) {
      return false;
    }

    this.isProcessing = true;
    const packet = this.activePacket;

    try {
      // Show real ad via AdService
      const adResult = await AdService.showRewardedAd();

      if (adResult.success && this.activePacket?.id === packet.id) {
        const baseReward = packet.goldReward;
        // Ad rewards get skill multiplier bonus as gold only (skill not actually activated)
        const multiplier = this.getGoldMultiplier();
        const reward = Math.floor(baseReward * multiplier);

        // Add gold
        this.engine.updateState({
          gold: this.engine.state.gold + reward,
        });

        this.engine.emit('datapacket_collected', {
          type: packet.type,
          goldReward: reward,
          wasAd: true,
        });

        this.engine.emit('gold_changed', { delta: reward, reason: 'datapacket_ad' });

        this.clearPacket();
        this.lastCollectTime = Date.now();
        this.scheduleNextSpawn();
        return true;
      }
    } catch (error) {
      console.error('[DataPacketPlugin] Ad error:', error);
    } finally {
      this.isProcessing = false;
    }

    return false;
  }

  /**
   * Dismiss the current packet without collecting
   */
  dismissPacket(): void {
    if (this.activePacket) {
      this.clearPacket();
      this.scheduleNextSpawn();
    }
  }

  /**
   * Subscribe to packet state changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private spawnPacket(currentStage: number): void {
    const packetDef = this.selectRandomPacketType();
    const goldReward = DATAPACKET_CONFIG.formulas.calculateGold(currentStage, packetDef.enemyEquivalent);

    const now = Date.now();
    this.activePacket = {
      id: `packet_${now}`,
      type: packetDef.type,
      def: packetDef,
      goldReward,
      spawnedAt: now,
      expiresAt: now + DATAPACKET_CONFIG.packetLifetime,
    };

    this.engine.emit('datapacket_spawned', {
      type: packetDef.type,
      goldReward,
    });

    this.notifyListeners();
  }

  private selectRandomPacketType(): DataPacketDef {
    const packets = DATAPACKET_CONFIG.packets;
    const totalWeight = packets.reduce((sum, p) => sum + p.spawnWeight, 0);
    let random = Math.random() * totalWeight;

    for (const packet of packets) {
      random -= packet.spawnWeight;
      if (random <= 0) {
        return packet;
      }
    }

    return packets[0];
  }

  private expirePacket(): void {
    if (this.activePacket) {
      this.engine.emit('datapacket_expired', {
        type: this.activePacket.type,
      });
      this.clearPacket();
      this.scheduleNextSpawn();
    }
  }

  private clearPacket(): void {
    this.activePacket = null;
    this.notifyListeners();
  }

  private scheduleNextSpawn(): void {
    const minInterval = DATAPACKET_CONFIG.minSpawnInterval;
    const maxInterval = DATAPACKET_CONFIG.maxSpawnInterval;
    const delay = minInterval + Math.random() * (maxInterval - minInterval);
    this.nextSpawnTime = Date.now() + delay;
  }

  cleanup(): void {
    this.activePacket = null;
    this.listeners = [];
  }
}
