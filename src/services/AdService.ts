// =====================================================================
// AdService - Centralized ad network handling
// =====================================================================

import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { getActiveAdConfig } from '../config/ad-networks.config';

export interface AdResult {
  success: boolean;
  error?: string;
}

class AdServiceImpl {
  private isInitialized = false;

  /**
   * Initialize the appropriate ad network based on platform
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const config = getActiveAdConfig();
    if (!config) {
      console.warn('[AdService] No ad network configured');
      return;
    }

    try {
      if (config.type === 'admob' && Capacitor.isNativePlatform()) {
        await this.initializeAdMob(config);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('[AdService] Failed to initialize ads:', error);
    }
  }

  /**
   * Show a rewarded ad and return result
   */
  async showRewardedAd(): Promise<AdResult> {
    const config = getActiveAdConfig();
    
    if (!config) {
      return { success: false, error: 'No ad network configured' };
    }

    try {
      if (config.type === 'admob' && Capacitor.isNativePlatform()) {
        return await this.showAdMobRewardedAd(config);
      } else if (!Capacitor.isNativePlatform()) {
        // Web fallback
        return await this.showWebAdFallback();
      }
    } catch (error) {
      console.error('[AdService] Ad failed:', error);
      return { success: false, error: String(error) };
    }

    return { success: false, error: 'Unknown error' };
  }

  /**
   * Initialize AdMob on native platform
   */
  private async initializeAdMob(config: any): Promise<void> {
    await AdMob.initialize({
      requestIdFactory: () => Math.random().toString(),
    });
  }

  /**
   * Show AdMob rewarded ad
   */
  private async showAdMobRewardedAd(config: any): Promise<AdResult> {
    try {
      // Use platform-specific ad unit ID
      const adUnitId = Capacitor.getPlatform() === 'ios'
        ? config.iosRewardedAdUnitId || config.rewardedAdUnitId
        : config.androidRewardedAdUnitId || config.rewardedAdUnitId;

      if (!adUnitId) {
        return { success: false, error: 'Ad Unit ID not configured' };
      }

      // Load the rewarded ad
      const rewardedId = await AdMob.prepareRewardVideoAd({
        adUnitId,
        nativeEvents: true,
      });

      // Listen for reward event
      let rewarded = false;
      const unsubscribe = AdMob.addListener('rewardedVideoAdEvent', (result: any) => {
        if (result.type === 'rewarded') {
          rewarded = true;
        }
      });

      // Show the ad
      await AdMob.showRewardVideoAd({ adUnitId: rewardedId });

      // Cleanup listener
      unsubscribe.remove();

      return { success: rewarded };
    } catch (error) {
      console.error('[AdMob] Error showing rewarded ad:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Web fallback: simulate ad or redirect to ad network
   * In production, use Google AdSense, Admob web, or similar
   */
  private async showWebAdFallback(): Promise<AdResult> {
    return new Promise((resolve) => {
      // Show a simple modal/overlay that simulates watching an ad
      // For production, integrate with actual ad network SDK
      
      // Simulate 3-5 second ad duration
      const adDuration = 3000 + Math.random() * 2000;
      
      setTimeout(() => {
        // 90% success rate
        resolve({ success: Math.random() < 0.9 });
      }, adDuration);
    });
  }
}

export const AdService = new AdServiceImpl();
