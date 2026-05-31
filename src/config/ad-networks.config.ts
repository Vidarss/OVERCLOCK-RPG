// =====================================================================
// AD_NETWORKS_CONFIG - Ad network setup and configuration
// Easy to adjust for balancing ad frequency and behavior
// =====================================================================

export interface AdNetworkConfig {
  type: 'admob' | 'custom';
  enabled: boolean;
  rewardedAdUnitId?: string;
  appId?: string;
}

export const AD_NETWORKS_CONFIG = {
  // Google AdMob - Recommended for mobile (iOS/Android) via Capacitor
  admob: {
    type: 'admob' as const,
    enabled: true, // Set to true after getting your Ad Unit IDs
    appId: 'ca-app-pub-9196447836572769~2813228142', // Your AdMob App ID
    rewardedAdUnitId: 'ca-app-pub-9196447836572769/7939916372', // Your Rewarded Ad Unit ID
    // iOS Ad Unit IDs (if different from Android)
    iosRewardedAdUnitId: process.env.REACT_APP_ADMOB_IOS_REWARDED_UNIT_ID || 'ca-app-pub-9196447836572769/7939916372',
    // Android Ad Unit IDs
    androidRewardedAdUnitId: process.env.REACT_APP_ADMOB_ANDROID_REWARDED_UNIT_ID || 'ca-app-pub-9196447836572769/7939916372',
  },

  // Fallback for web (Google AdSense or similar)
  web: {
    type: 'custom' as const,
    enabled: false, // Set to true to enable web ad fallback
    // Use a service like Admob for web, AdSense, or mediation networks
    adNetworkId: process.env.REACT_APP_WEB_AD_NETWORK_ID || '',
  },

  // ─────────────────────────────────────────────────
  // Balancing: Web fallback ad simulation settings
  // ─────────────────────────────────────────────────
  webFallback: {
    /** Minimum duration of simulated ad (ms) */
    minDurationMs: 5000,
    /** Maximum duration of simulated ad (ms) */
    maxDurationMs: 8000,
    /** Success rate of simulated ads (0-1) */
    successRate: 0.95,
  },

  // ─────────────────────────────────────────────────
  // Balancing: Global ad limits and cooldowns
  // ─────────────────────────────────────────────────
  limits: {
    /** Maximum rewarded ads per hour (0 = unlimited) */
    maxAdsPerHour: 0,
    /** Cooldown between ad views (ms) - prevents spam clicking */
    adCooldownMs: 10_000,
    /** Daily ad view limit (0 = unlimited) */
    dailyLimit: 0,
  },
} as const;

/**
 * Get the appropriate ad config based on platform
 */
export function getActiveAdConfig(): AdNetworkConfig | null {
  const isMobile = isNativePlatform();
  
  if (isMobile && AD_NETWORKS_CONFIG.admob.enabled && AD_NETWORKS_CONFIG.admob.appId) {
    return AD_NETWORKS_CONFIG.admob;
  }
  
  if (!isMobile && AD_NETWORKS_CONFIG.web.enabled) {
    return AD_NETWORKS_CONFIG.web;
  }
  
  return null;
}

function isNativePlatform(): boolean {
  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
