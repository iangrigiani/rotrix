// Dynamically import Capacitor Haptics to avoid module resolution errors
let Haptics, ImpactStyle;

// Lazy load haptics module
async function loadHaptics() {
  if (!Haptics) {
    try {
      const hapticsModule = await import('@capacitor/haptics').catch(() => null);
      if (hapticsModule) {
        Haptics = hapticsModule.Haptics;
        ImpactStyle = hapticsModule.ImpactStyle;
      }
    } catch (error) {
      // Silently fail if haptics not available
      console.debug('Haptics module not available');
    }
  }
  return { Haptics, ImpactStyle };
}

/**
 * Haptic feedback wrapper for mobile devices
 */
export class HapticService {
  /**
   * Trigger light haptic feedback
   */
  static async light() {
    try {
      const { Haptics: H, ImpactStyle: IS } = await loadHaptics();
      if (H && IS) {
        await H.impact({ style: IS.Light });
      }
    } catch (error) {
      // Silently fail if haptics not available (web, etc.)
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Trigger medium haptic feedback
   */
  static async medium() {
    try {
      const { Haptics: H, ImpactStyle: IS } = await loadHaptics();
      if (H && IS) {
        await H.impact({ style: IS.Medium });
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Trigger heavy haptic feedback
   */
  static async heavy() {
    try {
      const { Haptics: H, ImpactStyle: IS } = await loadHaptics();
      if (H && IS) {
        await H.impact({ style: IS.Heavy });
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Trigger haptic feedback for button press
   */
  static async buttonPress() {
    await this.light();
  }

  /**
   * Trigger haptic feedback for game action (move, rotate)
   */
  static async gameAction() {
    await this.light();
  }

  /**
   * Trigger haptic feedback for line clear
   */
  static async lineClear() {
    await this.medium();
  }

  /**
   * Trigger haptic feedback for gravity flip
   */
  static async gravityFlip() {
    await this.heavy();
  }

  /**
   * Trigger haptic feedback for game over
   */
  static async gameOver() {
    try {
      const { Haptics: H } = await loadHaptics();
      if (H) {
        await H.vibrate({ duration: 500 });
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }
}

