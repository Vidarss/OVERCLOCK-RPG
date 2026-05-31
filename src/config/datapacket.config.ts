// =====================================================================
// Data Packet (Ad Reward) Configuration
// "Intercepted transmissions" that grant gold rewards
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
  minSpawnInterval: 45_000, // 45 seconds
  /** Maximum time between packet spawns */
  maxSpawnInterval: 120_000, // 2 minutes
  /** How long a packet stays on screen before auto-dismissing */
  packetLifetime: 15_000, // 15 seconds
  /** Cooldown after collecting a packet before next can spawn */
  collectCooldown: 30_000, // 30 seconds

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
      /** Basic intercept = worth 3 enemies (small boost) */
      enemyEquivalent: 3,
      spawnWeight: 70,
    },
    {
      type: 'encrypted',
      name: 'ENCRYPTED CACHE',
      description: 'High-value encrypted data (requires decryption)',
      color: '#ffaa00',
      icon: '🔐',
      requiresAd: true,
      /** Ad reward = worth 15 enemies (enough to progress ~1-2 stages) */
      enemyEquivalent: 15,
      spawnWeight: 30,
    },
  ] as DataPacketDef[],

  // ─────────────────────────────────────────────────
  // UI messages
  // ─────────────────────────────────────────────────
  messages: {
    basicCollect: 'PACKET RECEIVED',
    encryptedCollect: 'DECRYPTION COMPLETE',
    watchAdPrompt: 'DECRYPT NOW',
    collectPrompt: 'INTERCEPT',
    processing: 'PROCESSING...',
    expired: 'SIGNAL LOST',
  },
} as const;
