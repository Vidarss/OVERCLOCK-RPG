// =====================================================================
// AdService - Centralized ad network handling
// =====================================================================

import { AD_NETWORKS_CONFIG, getActiveAdConfig } from '../config/ad-networks.config';

// Optional Capacitor imports - may not be available in web
let Capacitor: any = null;
let AdMob: any = null;

try {
  const capacitorModule = require('@capacitor/core');
  Capacitor = capacitorModule.Capacitor;
} catch {
  // Capacitor not available on web
}

try {
  const admobModule = require('@capacitor-community/admob');
  AdMob = admobModule.AdMob;
} catch {
  // AdMob not available on web
}

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
      if (config.type === 'admob' && Capacitor?.isNativePlatform?.()) {
        await this.initializeAdMob(config);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('[AdService] Failed to initialize ads:', error);
    }
  }

  /**
   * Show a rewarded ad and return result
   * Mobile: Shows real AdMob rewarded ads
   * Web: Shows AdSense ads or simulated ad modal
   */
  async showRewardedAd(): Promise<AdResult> {
    const config = getActiveAdConfig();
    
    if (!config) {
      return { success: false, error: 'No ad network configured' };
    }

    try {
      if (config.type === 'admob' && Capacitor?.isNativePlatform?.()) {
        return await this.showAdMobRewardedAd(config);
      } else if (!Capacitor?.isNativePlatform?.()) {
        // Web: Try AdSense first, then fallback to simulation
        if (AD_NETWORKS_CONFIG.adsense.enabled && AD_NETWORKS_CONFIG.adsense.adSlotId) {
          return await this.showAdSenseAd();
        }
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
    if (!AdMob) return;
    await AdMob.initialize({
      requestIdFactory: () => Math.random().toString(),
    });
  }

  /**
   * Show AdMob rewarded ad
   */
  private async showAdMobRewardedAd(config: any): Promise<AdResult> {
    if (!AdMob || !Capacitor) {
      return { success: false, error: 'AdMob or Capacitor not available' };
    }

    try {
      // Use platform-specific ad unit ID
      const adUnitId = Capacitor.getPlatform?.() === 'ios'
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
   * Show Google AdSense ad
   * AdSense requires you to:
   * 1. Create an ad unit in your AdSense account (Display ad, recommended sizes 300x250 or responsive)
   * 2. Get the slot ID (16 digits, looks like 1234567890123456)
   * 3. Set REACT_APP_ADSENSE_AD_SLOT_ID env var with that ID
   * Then this will display a real AdSense display ad in a modal
   */
  private async showAdSenseAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      const adDuration = 10_000; // Show ad for 10 seconds
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.97);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        font-family: 'Courier New', monospace;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #08080f;
        border: 2px solid #1a2a3a;
        width: 100%;
        max-width: 400px;
        padding: 16px;
        box-sizing: border-box;
        box-shadow: 0 0 60px rgba(0,245,255,0.15);
      `;

      // Ad container for AdSense
      const adContainer = document.createElement('div');
      adContainer.id = `adsbygoogle_${Date.now()}`;
      adContainer.style.cssText = `
        width: 100%;
        min-height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0a15;
        border: 1px solid #1a2a3a;
      `;

      const adLabel = document.createElement('div');
      adLabel.style.cssText = `
        font-size: 10px; color: #2a3a4a; letter-spacing: 1px;
        position: absolute; top: 8px; left: 8px;
      `;
      adLabel.textContent = 'ADVERTISEMENT';

      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = `
        position: absolute; top: 8px; right: 8px;
        background: none; border: 1px solid #1a2a3a;
        color: #3a5a6a; cursor: pointer;
        padding: 4px 10px; font-size: 11px;
        letter-spacing: 1px; font-family: inherit;
        transition: all 0.2s;
      `;
      closeBtn.textContent = 'CLOSE AD';
      closeBtn.onclick = () => {
        overlay.remove();
        resolve({ success: true }); // Count as success (user viewed ad)
      };

      modal.appendChild(adLabel);
      modal.appendChild(closeBtn);
      modal.appendChild(adContainer);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Push AdSense ad to the container
      try {
        const adScript = document.createElement('ins');
        adScript.className = 'adsbygoogle';
        adScript.style.cssText = `display: block; width: 100%;`;
        adScript.setAttribute('data-ad-client', AD_NETWORKS_CONFIG.adsense.publisherId);
        adScript.setAttribute('data-ad-slot', AD_NETWORKS_CONFIG.adsense.adSlotId);
        adScript.setAttribute('data-ad-format', 'auto');
        adScript.setAttribute('data-full-width-responsive', 'true');
        
        adContainer.appendChild(adScript);

        // Trigger AdSense to render the ad
        if ((window as any).adsbygoogle) {
          (window as any).adsbygoogle.push({});
        }
      } catch (error) {
        console.error('[AdService] Failed to load AdSense:', error);
      }

      // Auto-close after duration
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
        resolve({ success: true });
      }, adDuration);
    });
  }

  /**
   * On web, AdMob is not available. Options:
   *  1. THIS: A branded "simulated" ad that counts down (testing/dev)
   *  2. Google AdSense for Games — add your AdSense script + ad unit and
   *     swap the placeholder div below with your ad slot
   *  3. IronSource / Unity Ads web SDK — drop in their JS tag
   *
   * To integrate a real web ad network, replace the content inside
   * `adContent` below with your network's ad container/script.
   */
  private async showWebAdFallback(): Promise<AdResult> {
    return new Promise((resolve) => {
      const { minDurationMs, maxDurationMs, successRate } = AD_NETWORKS_CONFIG.webFallback;
      const adDuration = minDurationMs + Math.random() * (maxDurationMs - minDurationMs);
      let timeLeft = adDuration / 1000;
      let canSkip = false;
      const skipAfterSec = 5;

      // ── Overlay ──────────────────────────────────────────────────
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.97);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        font-family: 'Courier New', monospace;
      `;

      // ── Modal wrapper ─────────────────────────────────────────────
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #08080f;
        border: 2px solid #1a2a3a;
        width: 100%;
        max-width: 480px;
        overflow: hidden;
        box-shadow: 0 0 60px rgba(0,245,255,0.15);
        position: relative;
      `;

      // ── Ad content area (swap this with real ad SDK container) ────
      const adContent = document.createElement('div');
      adContent.style.cssText = `
        width: 100%; aspect-ratio: 16/9;
        background: linear-gradient(135deg, #0a0a20 0%, #0d1520 50%, #0a0a20 100%);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 12px; padding: 24px; box-sizing: border-box;
        border-bottom: 1px solid #1a2a3a;
      `;

      // Brand logo placeholder
      const logo = document.createElement('div');
      logo.style.cssText = `
        font-size: 28px; font-weight: bold; letter-spacing: 6px;
        color: #00f5ff;
        text-shadow: 0 0 20px #00f5ff, 0 0 40px #00f5ff44;
      `;
      logo.textContent = 'OVERCLOCK.EXE';

      const tagline = document.createElement('div');
      tagline.style.cssText = `font-size: 12px; color: #5a6a7a; letter-spacing: 2px;`;
      tagline.textContent = 'MOTHERBOARD UPGRADE SIMULATOR';

      // Animated pulse bar
      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 80%; height: 3px; background: #1a2a3a;
        margin-top: 16px; position: relative; overflow: hidden;
      `;
      const barFill = document.createElement('div');
      barFill.style.cssText = `
        position: absolute; left: 0; top: 0; height: 100%;
        background: linear-gradient(90deg, #00f5ff, #39ff14);
        width: 0%; transition: width 0.1s linear;
      `;
      bar.appendChild(barFill);

      adContent.appendChild(logo);
      adContent.appendChild(tagline);
      adContent.appendChild(bar);

      // ── Bottom bar ────────────────────────────────────────────────
      const bottomBar = document.createElement('div');
      bottomBar.style.cssText = `
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px;
      `;

      const adLabel = document.createElement('div');
      adLabel.style.cssText = `font-size: 10px; color: #2a3a4a; letter-spacing: 1px;`;
      adLabel.textContent = 'AD';

      const timerBox = document.createElement('div');
      timerBox.style.cssText = `
        font-size: 11px; letter-spacing: 1px;
        color: #3a5a6a; padding: 4px 10px; border: 1px solid #1a2a3a;
      `;
      timerBox.textContent = `CLOSES IN ${Math.ceil(timeLeft)}s`;

      const skipBtn = document.createElement('button');
      skipBtn.style.cssText = `
        font-size: 11px; letter-spacing: 1px; cursor: not-allowed;
        color: #2a3a4a; background: none; border: 1px solid #1a2a3a;
        padding: 4px 12px; font-family: inherit;
        transition: all 0.2s;
      `;
      skipBtn.textContent = `SKIP IN ${Math.ceil(skipAfterSec)}s`;
      skipBtn.disabled = true;
      skipBtn.onclick = () => {
        if (!canSkip) return;
        clearInterval(timerInterval);
        overlay.remove();
        resolve({ success: true });
      };

      bottomBar.appendChild(adLabel);
      bottomBar.appendChild(timerBox);
      bottomBar.appendChild(skipBtn);

      modal.appendChild(adContent);
      modal.appendChild(bottomBar);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // ── Tick ──────────────────────────────────────────────────────
      const totalSec = adDuration / 1000;
      const timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        const elapsed = totalSec - timeLeft;
        const pct = Math.min(100, (elapsed / totalSec) * 100);

        barFill.style.width = `${pct}%`;

        const remaining = Math.max(0, Math.ceil(timeLeft));
        timerBox.textContent = `CLOSES IN ${remaining}s`;

        const skipRemaining = Math.max(0, Math.ceil(skipAfterSec - elapsed));
        if (skipRemaining > 0) {
          skipBtn.textContent = `SKIP IN ${skipRemaining}s`;
        } else if (!canSkip) {
          canSkip = true;
          skipBtn.disabled = false;
          skipBtn.style.cssText += `
            color: #00f5ff; border-color: #00f5ff44; cursor: pointer;
          `;
          skipBtn.textContent = 'SKIP AD';
        }

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          overlay.remove();
          resolve({ success: Math.random() < successRate });
        }
      }, 100);
    });
  }
}

export const AdService = new AdServiceImpl();
