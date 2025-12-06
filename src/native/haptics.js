import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Haptic feedback wrapper for mobile devices
 */
export class HapticService {
  /**
   * Trigger light haptic feedback
   */
  static async light() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
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
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Trigger heavy haptic feedback
   */
  static async heavy() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
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
      await Haptics.vibrate({ duration: 500 });
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }
}

