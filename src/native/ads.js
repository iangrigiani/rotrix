import { AdMob } from '@capacitor-community/admob';

/**
 * AdMob wrapper for displaying ads
 * Note: Replace test ad IDs with your actual AdMob ad unit IDs
 */
export class AdService {
  static initialized = false;

  /**
   * Initialize AdMob (call this once at app startup)
   */
  static async initialize() {
    if (this.initialized) return;

    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: [],
        initializeForTesting: false
      });
      this.initialized = true;
      console.log('AdMob initialized');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }

  /**
   * Show a banner ad at the bottom of the screen
   */
  static async showBanner() {
    try {
      await this.initialize();
      
      const options = {
        adId: 'ca-app-pub-3940256099942544/6300978111', // Test banner ID
        adSize: 'BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: true // Set to false in production
      };

      await AdMob.showBanner(options);
      console.log('Banner ad shown');
    } catch (error) {
      console.error('Failed to show banner ad:', error);
    }
  }

  /**
   * Hide the banner ad
   */
  static async hideBanner() {
    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.error('Failed to hide banner ad:', error);
    }
  }

  /**
   * Show an interstitial ad (full screen)
   */
  static async showInterstitial() {
    try {
      await this.initialize();
      
      const options = {
        adId: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial ID
        isTesting: true // Set to false in production
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      console.log('Interstitial ad shown');
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
    }
  }

  /**
   * Show a rewarded ad (user gets reward after watching)
   */
  static async showRewarded() {
    try {
      await this.initialize();
      
      const options = {
        adId: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded ID
        isTesting: true // Set to false in production
      };

      await AdMob.prepareRewardVideoAd(options);
      const result = await AdMob.showRewardVideoAd();
      
      if (result.rewarded) {
        console.log('User watched rewarded ad, reward:', result.reward);
        return { success: true, reward: result.reward };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      return { success: false, error };
    }
  }

  /**
   * Remove all ads (call when user purchases ad-free)
   */
  static async removeAds() {
    await this.hideBanner();
    // Store preference that user has removed ads
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('ads_removed', 'true');
    }
  }

  /**
   * Check if ads should be shown
   */
  static shouldShowAds() {
    if (typeof Storage !== 'undefined') {
      return localStorage.getItem('ads_removed') !== 'true';
    }
    return true;
  }
}

