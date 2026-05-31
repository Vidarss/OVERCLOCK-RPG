// =====================================================================
// AD SETUP GUIDE - How to enable monetization
// =====================================================================

# Setting Up Ad Networks for OVERCLOCK-RPG

## Overview
The game supports two ad networks:
1. **Google AdMob** (Mobile via Capacitor) - iOS & Android
2. **Web Fallback** (Browser) - Google AdSense or AdMob for Web

---

## PART 1: Setting Up Google AdMob (Mobile - Recommended)

### Step 1: Create an AdMob Account
1. Go to https://admob.google.com
2. Sign in with your Google account
3. Click "Sign up for AdMob"
4. Accept the terms and follow the setup wizard

### Step 2: Create an App in AdMob
1. In AdMob console, go to **Apps** → **Add App**
2. Select your platform (iOS / Android)
3. Enter your app name (OVERCLOCK)
4. Get your **App ID** from the console

### Step 3: Create Rewarded Ad Units
1. In your app settings, go to **Ad Units** → **Create Ad Unit**
2. Select **Rewarded** as the ad format
3. Give it a name like "Data Packet Rewards"
4. Copy the **Ad Unit ID** (looks like: ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy)

### Step 4: Get Your Ad Unit IDs
In the AdMob console:
- **iOS Rewarded Ad Unit ID**: `ca-app-pub-xxxxxxxxxxxxxxxx/iiiiiiiiii`
- **Android Rewarded Ad Unit ID**: `ca-app-pub-xxxxxxxxxxxxxxxx/aaaaaaaaaa`
- **App ID**: `ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz`

### Step 5: Add Environment Variables
Create or update `.env.local` in your project root:

```env
REACT_APP_ADMOB_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz
REACT_APP_ADMOB_REWARDED_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
REACT_APP_ADMOB_IOS_REWARDED_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/iiiiiiiiii
REACT_APP_ADMOB_ANDROID_REWARDED_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/aaaaaaaaaa
```

### Step 6: Install AdMob Capacitor Plugin
```bash
npm install @capacitor-community/admob
```

### Step 7: Enable AdMob in Config
Edit `src/config/ad-networks.config.ts`:

```typescript
export const AD_NETWORKS_CONFIG = {
  admob: {
    type: 'admob',
    enabled: true,  // Change to true
    appId: process.env.REACT_APP_ADMOB_APP_ID || '',
    rewardedAdUnitId: process.env.REACT_APP_ADMOB_REWARDED_UNIT_ID || '',
    iosRewardedAdUnitId: process.env.REACT_APP_ADMOB_IOS_REWARDED_UNIT_ID || '',
    androidRewardedAdUnitId: process.env.REACT_APP_ADMOB_ANDROID_REWARDED_UNIT_ID || '',
  },
  // ...
}
```

---

## PART 2: Setting Up Web Ad Fallback (Optional)

### Option A: Google AdMob for Web
1. In AdMob, create a new **Web** app
2. Get your Web App ID and Ad Unit IDs
3. Add to `.env.local`:
```env
REACT_APP_WEB_AD_NETWORK_ID=ca-app-pub-xxxxxxxxxxxxxxxx
```

### Option B: Google AdSense (Alternative)
1. Go to https://adsense.google.com
2. Follow signup steps
3. Create ad units for your domain
4. Get your **Publisher ID** (pub-xxxxxxxxxxxxxxxx)
5. Add to `.env.local`:
```env
REACT_APP_ADSENSE_PUBLISHER_ID=pub-xxxxxxxxxxxxxxxx
```

### Option C: Other Ad Networks
Popular alternatives:
- **Rewarded Ad Networks**: Unity Ads, IronSource, Tapjoy
- **Banner/Display**: Criteo, Pubmatic, OpenX
- Each has their own setup process documented on their sites

### Enable Web Ads in Config
Edit `src/config/ad-networks.config.ts`:

```typescript
export const AD_NETWORKS_CONFIG = {
  // ...
  web: {
    type: 'custom',
    enabled: true,  // Change to true
    adNetworkId: process.env.REACT_APP_WEB_AD_NETWORK_ID || '',
  },
}
```

---

## PART 3: Testing

### Test Ads (Don't use real Ad Unit IDs yet!)
AdMob provides test device support:

1. **For Real Device Testing:**
   - Register your device as a test device in AdMob console
   - Use real Ad Unit IDs but mark the device as test
   - Ads will show but won't generate revenue

2. **Test Ad Unit IDs (Safe for Development):**
   - Android: `ca-app-pub-3940256099942544/1033173712` (Rewarded)
   - iOS: `ca-app-pub-3940256099942544/1712485313` (Rewarded)

### Local Testing Flow
1. Use test Ad Unit IDs during development
2. Install app on test device via Capacitor
3. Click "DECRYPT NOW" on encrypted data packets
4. Verify ad shows correctly and reward is granted
5. Switch to production Ad Unit IDs before release

---

## PART 4: Revenue & Payouts

### How You Earn
- **Google AdMob**: Earns CPM (Cost Per 1000 Impressions) or CPC (Cost Per Click)
- **RevShare**: Typically 68% goes to you, 32% to Google/partner
- **Minimum Payout**: Usually $100 USD before you receive payment
- **Payment Frequency**: Monthly (if threshold is met)

### Monitoring Earnings
1. Open AdMob console
2. Go to **Earnings** tab to see real-time metrics
3. Track CPM, impressions, and estimated earnings
4. Optimize by A/B testing ad placements and formats

### Important Notes
- ⚠️ **Don't Click Your Own Ads** - This is fraud and will ban your account
- ⚠️ **Don't Artificially Inflate Views** - Bots/traffic schemes violate terms
- ⚠️ **Keep Ads Below 30% of Screen** - UX must remain primary
- ⚠️ **Privacy Policy Required** - Must disclose ad networks in your privacy policy

---

## PART 5: Updating AdService.ts

The `AdService` is already set up to use real ads, but currently has a web fallback.
When you add your Ad Unit IDs:

1. Ads will automatically show using AdMob on mobile
2. Web will show ads based on your configured network
3. Rewards are granted after ads complete successfully
4. No changes needed to the plugin logic!

---

## Quick Checklist

- [ ] Create AdMob account at admob.google.com
- [ ] Create app in AdMob console
- [ ] Create rewarded ad unit for iOS
- [ ] Create rewarded ad unit for Android
- [ ] Note your App ID and Ad Unit IDs
- [ ] Add environment variables to `.env.local`
- [ ] Install `@capacitor-community/admob` package
- [ ] Set `enabled: true` in ad-networks.config.ts
- [ ] Test with test device
- [ ] Verify rewards are granted when ads complete
- [ ] Switch to production Ad Unit IDs
- [ ] Deploy to production

---

## Troubleshooting

**Ads not showing?**
- Verify Ad Unit IDs are correct
- Check that `enabled: true` in config
- Ensure device is registered if using test device
- Check browser console for errors

**Rewards not granted?**
- Verify ad completed successfully (user watched to end)
- Check `collectEncryptedPacket()` is being called
- Look for errors in console logs

**No test ads available?**
- Use the official test Ad Unit IDs provided above
- Or register your device in AdMob console
- Wait up to 1 hour for test device registration

