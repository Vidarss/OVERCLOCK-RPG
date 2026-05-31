// =====================================================================
// Data Packet (Ad Reward) Configuration
// "Intercepted transmissions" that grant gold rewards
// =====================================================================

export type DataPacketType = 'basic' | 'encrypted';

export interface DataPacketDef {
  type: DataPacketType;
  name: string;
  description: string;
  color: string;
  icon: string;
  /** Whether this packet requires watching an ad */
  requiresAd: boolean;
  /** Gold reward multiplier (multiplied by stage-based gold) */
  rewardMultiplier: number;
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
    /** Base gold calculation based on current stage */
    calculateBaseGold: (stage: number): number => {
      return Math.floor(50 + stage * 10 + Math.pow(stage, 1.3));
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
      rewardMultiplier: 1.0,
      spawnWeight: 70,
    },
    {
      type: 'encrypted',
      name: 'ENCRYPTED CACHE',
      description: 'High-value encrypted data (requires decryption)',
      color: '#ffaa00',
      icon: '🔐',
      requiresAd: true,
      rewardMultiplier: 5.0,
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
