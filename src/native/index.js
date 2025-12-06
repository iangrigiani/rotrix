/**
 * Native features module - exports all native services
 */
export { HapticService } from './haptics.js';
export { AdService } from './ads.js';
export { PurchaseService } from './purchases.js';

/**
 * Initialize all native services
 */
export async function initializeNativeServices() {
  try {
    // Initialize AdMob
    const { AdService } = await import('./ads.js');
    await AdService.initialize();
    
    // Initialize purchases
    const { PurchaseService } = await import('./purchases.js');
    await PurchaseService.initialize();
    
    console.log('Native services initialized');
  } catch (error) {
    console.error('Failed to initialize native services:', error);
  }
}

