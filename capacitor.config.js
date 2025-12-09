const config = {
  appId: 'com.rotrix.app',
  appName: 'Rotrix',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true, // Auto-hide after duration, but we'll also hide manually
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a1a'
    },
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713' // Test app ID - replace with your own from AdMob console
    }
  }
};

module.exports = config;

