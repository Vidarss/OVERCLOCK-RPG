// =====================================================================
// Data Packet (Ad Reward) Configuration
// "Intercepted transmissions" that grant gold rewards
// 
// BALANCE NOTES:
// - Basic packet: Small boost (3 enemies worth) - helps progress slightly
// - Ad packet: 3x multiplier on current stage gold (not game-breaking)
// - 3x Boost Ad: Triple whatever you collect for 60 seconds
// =====================================================================

import { getEnemyHp } from '../plugins/EnemyPlugin';
import { ENEMY_CONFIG } from './game.config';

export type DataPacketType = 'basic' | 'encrypted' | 'boost_3x';

export interface DataPacketDef {
  type: DataPacketType;
  name: string;
  description: string;
  color: string;
  icon: string;
  /** Whether this packet requires watching an ad */
  requiresAd: boolean;
  /** Number of enemies worth of gold to reward (0 for boost type) */
  enemyEquivalent: number;
  /** Spawn weight (higher = more likely) */
  spawnWeight: number;
  /** For boost type: duration in seconds */
  boostDuration?: number;
  /** For boost type: multiplier applied */
  boostMultiplier?: number;
}

export const DATAPACKET_CONFIG = {
  // ─────────────────────────────────────────────────
  // Spawn timing (all in milliseconds)
  // ─────────────────────────────────────────────────
  /** Minimum time between packet spawns */
  minSpawnInterval: 90_000, // 1.5 minutes
  /** Maximum time between packet spawns */
  maxSpawnInterval: 240_000, // 4 minutes
  /** How long a packet stays on screen before auto-dismissing */
  packetLifetime: 25_000, // 25 seconds
  /** Cooldown after collecting a packet before next can spawn */
  collectCooldown: 60_000, // 1 minute

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
      const enemyHp = getEnemyHp(stage, 1); // Use phase 1 as baseline
      const goldPerEnemy = enemyHp * ENEMY_CONFIG.normalGoldMultiplier;
      return Math.floor(goldPerEnemy * enemyEquivalent);
    },
  },

  // ─────────────────────────────────────────────────
  // Packet type definitions
  // BALANCED: Packets help progress a little, not instant-win
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
      spawnWeight: 60,
    },
    {
      type: 'encrypted',
      name: 'ENCRYPTED CACHE',
      description: 'Watch to decrypt gold cache',
      color: '#ffaa00',
      icon: '🔐',
      requiresAd: true,
      /** Ad reward = worth 8 enemies (decent but not OP) */
      enemyEquivalent: 8,
      spawnWeight: 25,
    },
    {
      type: 'boost_3x',
      name: '3X BOOST',
      description: 'Triple all gold for 60 seconds',
      color: '#39ff14',
      icon: '⚡',
      requiresAd: true,
      /** No immediate gold - gives a timed multiplier */
      enemyEquivalent: 0,
      spawnWeight: 15,
      boostDuration: 60,
      boostMultiplier: 3,
    },
  ] as DataPacketDef[],

  // ─────────────────────────────────────────────────
  // UI messages
  // ─────────────────────────────────────────────────
  messages: {
    basicCollect: 'PACKET RECEIVED',
    encryptedCollect: 'CACHE DECRYPTED',
    boostActivated: '3X BOOST ACTIVE',
    watchAdPrompt: 'WATCH AD',
    collectPrompt: 'INTERCEPT',
    processing: 'DECRYPTING...',
    expired: 'SIGNAL LOST',
  },
} as const;
