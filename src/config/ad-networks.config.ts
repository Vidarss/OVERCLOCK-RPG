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
    enabled: true,
    appId: import.meta.env.VITE_ADMOB_APP_ID || 'ca-app-pub-9196447836572769~2813228142',
    rewardedAdUnitId: import.meta.env.VITE_ADMOB_REWARDED_UNIT_ID || 'ca-app-pub-9196447836572769/7939916372',
    iosRewardedAdUnitId: import.meta.env.VITE_ADMOB_IOS_REWARDED_UNIT_ID || 'ca-app-pub-9196447836572769/7939916372',
    androidRewardedAdUnitId: import.meta.env.VITE_ADMOB_ANDROID_REWARDED_UNIT_ID || 'ca-app-pub-9196447836572769/7939916372',
  },

  // Google AdSense - Web monetization
  adsense: {
    type: 'adsense' as const,
    enabled: true, // Enabled - will show real AdSense ads on web
    publisherId: import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 'ca-pub-9196447836572769',
    adSlotId: import.meta.env.VITE_ADSENSE_AD_SLOT_ID || '',
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
