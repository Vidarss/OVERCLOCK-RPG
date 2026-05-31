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
   * Web fallback: show a simple modal that simulates watching an ad
   * In production, use Google AdSense, Admob web, or similar
   */
  private async showWebAdFallback(): Promise<AdResult> {
    return new Promise((resolve) => {
      // Create a modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Courier New', monospace;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #0a0a12;
        border: 2px solid #00f5ff;
        padding: 40px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 0 40px rgba(0, 245, 255, 0.3);
      `;

      // Simulate ad duration: 5-8 seconds
      const adDuration = 5000 + Math.random() * 3000;
      let timeLeft = adDuration / 1000;

      const title = document.createElement('div');
      title.style.cssText = 'color: #00f5ff; font-size: 16px; letter-spacing: 2px; margin-bottom: 20px; font-weight: bold;';
      title.textContent = 'WATCHING AD...';

      const timer = document.createElement('div');
      timer.style.cssText = 'color: #39ff14; font-size: 48px; font-weight: bold; margin: 30px 0; font-family: monospace;';
      timer.textContent = Math.ceil(timeLeft).toString();

      const subtitle = document.createElement('div');
      subtitle.style.cssText = 'color: #3a5a6a; font-size: 12px; margin-top: 20px;';
      subtitle.textContent = 'Ad will close automatically...';

      modal.appendChild(title);
      modal.appendChild(timer);
      modal.appendChild(subtitle);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Update timer every 100ms
      const timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        timer.textContent = Math.max(0, Math.ceil(timeLeft)).toString();
      }, 100);

      // Close ad when time runs out
      setTimeout(() => {
        clearInterval(timerInterval);
        overlay.remove();
        // 95% success rate for simulated ads
        resolve({ success: Math.random() < 0.95 });
      }, adDuration);
    });
  }
}

export const AdService = new AdServiceImpl();
