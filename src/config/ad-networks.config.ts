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
    // iOS Ad Unit IDs (if different from Android) - use same as default
    iosRewardedAdUnitId: 'ca-app-pub-9196447836572769/7939916372',
    // Android Ad Unit IDs - use same as default
    androidRewardedAdUnitId: 'ca-app-pub-9196447836572769/7939916372',
  },

  // Google AdSense - Web monetization
  adsense: {
    type: 'adsense' as const,
    enabled: false, // Set to true after adding your ad slot ID below
    publisherId: 'ca-pub-9196447836572769', // Your AdSense Publisher ID (same as AdMob)
    // Create ad units in AdSense and add your 16-digit ad slot ID here:
    adSlotId: '', // e.g. '1234567890123456'
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
 * Returns AdMob config for mobile, or web config (enabled or as fallback)
 */
export function getActiveAdConfig(): AdNetworkConfig | null {
  const isMobile = isNativePlatform();
  
  if (isMobile && AD_NETWORKS_CONFIG.admob.enabled && AD_NETWORKS_CONFIG.admob.appId) {
    return AD_NETWORKS_CONFIG.admob;
  }
  
  // On web, return the web config for fallback (even if disabled - service will use simulation)
  if (!isMobile) {
    return { 
      type: 'custom' as const, 
      enabled: true, // Always allow web fallback simulation
    };
  }
  
  return null;
}

function isNativePlatform(): boolean {
  try {
    // Use dynamic import check for Capacitor
    if (typeof window !== 'undefined' && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform) {
      return (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();
    }
    return false;
  } catch {
    return false;
  }
}
