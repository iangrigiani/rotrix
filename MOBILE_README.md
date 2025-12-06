# Rotrix Mobile App Development Guide

This guide explains how to build, test, and publish the Rotrix mobile app for Android and iOS.

## Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Java JDK** (for Android builds)

### Required Accounts
- **Google Play Developer Account** ($25 one-time fee)
- **Apple Developer Account** ($99/year)

## Project Structure

```
rotrix/
├── android/          # Android native project
├── ios/             # iOS native project
├── src/
│   └── native/      # Native feature wrappers (ads, haptics, purchases)
├── dist/            # Built web assets (generated)
├── capacitor.config.js
└── package.json
```

## Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Web Assets
```bash
npm run build
```

This copies all game files to the `dist/` directory.

### 3. Sync with Native Platforms
```bash
npm run cap:sync
```

This builds the web assets and syncs them to both Android and iOS projects.

## Android Development

### Setup
1. Install Android Studio
2. Install Android SDK (API level 23+)
3. Set up Android emulator or connect a physical device

### Build and Run
```bash
# Open Android Studio
npm run cap:open:android

# Or build from command line
npm run android:build:debug    # Debug build
npm run android:build         # Release build
npm run android:install       # Install debug APK
```

### Testing
1. Open Android Studio: `npm run cap:open:android`
2. Select a device/emulator
3. Click Run (▶️)

### Release Build for Google Play
1. Create a keystore:
   ```bash
   keytool -genkey -v -keystore rotrix-release-key.keystore -alias rotrix -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Update `android/app/build.gradle`:
   - Uncomment the `signingConfigs` section
   - Add your keystore file to `android/app/`
   - Set environment variables: `KEYSTORE_PASSWORD` and `KEY_PASSWORD`

3. Build release APK:
   ```bash
   npm run android:build
   ```

4. Find APK at: `android/app/build/outputs/apk/release/app-release.apk`

5. Generate App Bundle (AAB) for Play Store:
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   Find AAB at: `android/app/build/outputs/bundle/release/app-release.aab`

## iOS Development

### Setup
1. Install Xcode from Mac App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

### Build and Run
```bash
# Open Xcode
npm run cap:open:ios

# In Xcode:
# 1. Select a simulator or device
# 2. Click Run (▶️)
```

### Testing
1. Open Xcode: `npm run cap:open:ios`
2. Select a simulator or connected device
3. Click Run (▶️)

### Release Build for App Store
1. Configure signing in Xcode:
   - Select the project in Xcode
   - Go to "Signing & Capabilities"
   - Select your team
   - Enable "Automatically manage signing"

2. Archive the app:
   - In Xcode: Product → Archive
   - Wait for archive to complete

3. Upload to App Store Connect:
   - In Xcode Organizer: Distribute App
   - Follow the wizard

## Native Features

### Haptic Feedback
Haptic feedback is automatically integrated into game actions:
- Button presses
- Piece movements
- Line clears
- Gravity flips
- Game over

### Ads (AdMob)
Ads are configured but use test ad IDs by default. To enable real ads:

1. Create an AdMob account
2. Create ad units in AdMob console
3. Update `src/native/ads.js` with your ad unit IDs
4. Set `isTesting: false` in ad options

### In-App Purchases
The purchase system is set up as a placeholder. To implement:

1. Install a proper IAP plugin (e.g., `@capacitor-community/in-app-purchase`)
2. Configure products in Google Play Console / App Store Connect
3. Update `src/native/purchases.js` with actual implementation

## App Configuration

### App ID / Bundle Identifier
- Android: `com.rotrix.app` (in `capacitor.config.js`)
- iOS: `com.rotrix.app` (configured in Xcode)

### Version Management
Update version in:
- `package.json` - version field
- `android/app/build.gradle` - `versionCode` and `versionName`
- `ios/App/App.xcodeproj` - Marketing Version and Current Project Version

## Publishing Checklist

### Before Publishing

#### Android (Google Play)
- [ ] Create app icons in all required sizes (see ASSETS_GUIDE.md)
- [ ] Create splash screens for all densities
- [ ] Update app name and description in `strings.xml`
- [ ] Set up signing keystore
- [ ] Update `versionCode` and `versionName` in `build.gradle`
- [ ] Replace test AdMob IDs with production IDs
- [ ] Test on multiple Android devices/versions
- [ ] Prepare screenshots (phone, 7" tablet, 10" tablet)
- [ ] Write app description and privacy policy

#### iOS (App Store)
- [ ] Create app icons in all required sizes (see ASSETS_GUIDE.md)
- [ ] Create splash screens
- [ ] Configure App Store Connect listing
- [ ] Set up App Store Connect app record
- [ ] Update version numbers in Xcode
- [ ] Replace test AdMob IDs with production IDs
- [ ] Test on multiple iOS devices/versions
- [ ] Prepare screenshots (all required device sizes)
- [ ] Write app description and privacy policy
- [ ] Configure age rating and content ratings

### Common Issues

#### Android
- **Build fails**: Make sure Android SDK is installed and `ANDROID_HOME` is set
- **Gradle sync fails**: Try `cd android && ./gradlew clean`
- **App crashes on launch**: Check `adb logcat` for errors

#### iOS
- **Pod install fails**: Run `cd ios/App && pod install`
- **Signing errors**: Check team selection in Xcode
- **Build fails**: Clean build folder: Product → Clean Build Folder

## Useful Commands

```bash
# Build web assets
npm run build

# Sync to native platforms
npm run cap:sync

# Open native IDEs
npm run cap:open:android
npm run cap:open:ios

# Android specific
npm run android:build:debug
npm run android:build
npm run android:install

# View Capacitor logs
npx cap doctor
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

## Support

For issues specific to:
- **Capacitor**: Check [Capacitor Issues](https://github.com/ionic-team/capacitor/issues)
- **Game Logic**: See main README.md
- **Build Issues**: Check platform-specific documentation

