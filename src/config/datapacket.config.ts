// =====================================================================
// Data Packet (Ad Reward) Configuration
// "Intercepted transmissions" that grant gold rewards
// Ads reward MAX GOLD (equivalent to killing many enemies)
// =====================================================================

import { getEnemyHp } from '../plugins/EnemyPlugin';
import { ENEMY_CONFIG } from './game.config';

export type DataPacketType = 'basic' | 'encrypted';

export interface DataPacketDef {
  type: DataPacketType;
  name: string;
  description: string;
  color: string;
  icon: string;
  /** Whether this packet requires watching an ad */
  requiresAd: boolean;
  /** Number of enemies worth of gold to reward */
  enemyEquivalent: number;
  /** Spawn weight (higher = more likely) */
  spawnWeight: number;
}

export const DATAPACKET_CONFIG = {
  // ─────────────────────────────────────────────────
  // Spawn timing (all in milliseconds)
  // ─────────────────────────────────────────────────
  /** Minimum time between packet spawns */
  minSpawnInterval: 60_000, // 1 minute
  /** Maximum time between packet spawns */
  maxSpawnInterval: 180_000, // 3 minutes
  /** How long a packet stays on screen before auto-dismissing */
  packetLifetime: 20_000, // 20 seconds
  /** Cooldown after collecting a packet before next can spawn */
  collectCooldown: 45_000, // 45 seconds

  // ─────────────────────────────────────────────────
  // Reward formulas
  // ─────────────────────────────────────────────────
  formulas: {
    /** 
     * Calculate gold based on current stage enemy HP
     * This ensures rewards scale properly with progression
     * @param stage - Current game stage
     * @param enemyEquivalent - How many enemies worth of gold to give
     */
    calculateGold: (stage: number, enemyEquivalent: number): number => {
      const enemyHp = getEnemyHp(stage);
      const goldPerEnemy = enemyHp * ENEMY_CONFIG.normalGoldMultiplier;
      return Math.floor(goldPerEnemy * enemyEquivalent);
    },
  },

  // ─────────────────────────────────────────────────
  // Packet type definitions
  // ─────────────────────────────────────────────────
  packets: [
    {
      type: 'basic',
      name: 'DATA PACKET',
      description: 'Intercepted network transmission',
      color: '#00f5ff',
      icon: '📦',
      requiresAd: false,
      /** Basic intercept = worth 5 enemies */
      enemyEquivalent: 5,
      spawnWeight: 75,
    },
    {
      type: 'encrypted',
      name: 'ENCRYPTED CACHE',
      description: 'MAX GOLD REWARD - Watch to decrypt',
      color: '#ffaa00',
      icon: '🔐',
      requiresAd: true,
      /** Ad reward = worth 100 enemies (MAX GOLD) */
      enemyEquivalent: 100,
      spawnWeight: 25,
    },
  ] as DataPacketDef[],

  // ─────────────────────────────────────────────────
  // UI messages
  // ─────────────────────────────────────────────────
  messages: {
    basicCollect: 'PACKET RECEIVED',
    encryptedCollect: 'MAX GOLD UNLOCKED',
    watchAdPrompt: 'WATCH AD FOR MAX GOLD',
    collectPrompt: 'INTERCEPT',
    processing: 'DECRYPTING...',
    expired: 'SIGNAL LOST',
  },
} as const;
