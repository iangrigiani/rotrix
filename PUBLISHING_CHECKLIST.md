# Publishing Checklist for Rotrix Mobile App

Use this checklist to ensure everything is ready before submitting to Google Play and App Store.

## Pre-Development Setup

### Accounts
- [ ] Google Play Developer account created ($25)
- [ ] Apple Developer account created ($99/year)
- [ ] AdMob account created (for ads)
- [ ] Privacy policy URL prepared

## App Assets

### Icons
- [ ] Android icons created (all densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Android round icons created
- [ ] Android foreground icons created (for adaptive icons)
- [ ] iOS icons created (all sizes: 20pt, 29pt, 40pt, 60pt, 1024px)
- [ ] Icons tested at small sizes (48x48 px)
- [ ] Icons follow platform design guidelines

### Splash Screens
- [ ] Android portrait splash screens (all densities)
- [ ] Android landscape splash screens (all densities)
- [ ] iOS splash screens (2732x2732 px)
- [ ] Splash screens match app theme (#1a1a1a)

### Screenshots
- [ ] Android screenshots (phone: 16:9 or 9:16, 7" tablet, 10" tablet)
- [ ] iOS screenshots (all required device sizes)
- [ ] Feature graphic (Android: 1024x500 px)
- [ ] App preview videos (optional but recommended)

## App Configuration

### App Metadata
- [ ] App name: "Rotrix"
- [ ] Short description (80 chars max for Android, 30 chars for iOS)
- [ ] Full description (4000 chars max)
- [ ] Keywords/tags
- [ ] Category: Games → Puzzle
- [ ] Age rating configured
- [ ] Content rating completed

### Version Information
- [ ] Version number updated in `package.json`
- [ ] Android `versionCode` incremented
- [ ] Android `versionName` updated
- [ ] iOS version numbers updated in Xcode

### App IDs
- [ ] Android package name: `com.rotrix.app`
- [ ] iOS bundle identifier: `com.rotrix.app`
- [ ] App IDs match across all platforms

## Code Configuration

### AdMob Setup
- [ ] AdMob app ID added to `capacitor.config.js`
- [ ] Test ad IDs replaced with production IDs in `src/native/ads.js`
- [ ] `isTesting` set to `false` in ad options
- [ ] Ad units created in AdMob console:
  - [ ] Banner ad unit
  - [ ] Interstitial ad unit
  - [ ] Rewarded ad unit (if using)

### In-App Purchases (if implementing)
- [ ] IAP plugin installed and configured
- [ ] Products created in Google Play Console
- [ ] Products created in App Store Connect
- [ ] Purchase flow tested
- [ ] Restore purchases implemented

### Permissions
- [ ] Android permissions configured in `AndroidManifest.xml`
- [ ] iOS permissions configured in `Info.plist`
- [ ] Privacy policy explains all permissions

## Android-Specific

### Build Configuration
- [ ] Signing keystore created
- [ ] Keystore password secured (use environment variables)
- [ ] `build.gradle` signing config uncommented and configured
- [ ] `minSdkVersion` set (currently 23)
- [ ] `targetSdkVersion` set (currently 35)

### Google Play Console
- [ ] App created in Google Play Console
- [ ] Store listing completed:
  - [ ] App name
  - [ ] Short description
  - [ ] Full description
  - [ ] Screenshots uploaded
  - [ ] Feature graphic uploaded
  - [ ] App icon uploaded
- [ ] Content rating completed
- [ ] Pricing and distribution configured
- [ ] Privacy policy URL added
- [ ] Data safety section completed
- [ ] App content (age rating) configured

### Testing
- [ ] Tested on Android 6.0+ (API 23+)
- [ ] Tested on multiple screen sizes
- [ ] Tested in portrait and landscape
- [ ] Tested on physical devices
- [ ] Tested ad display (with test ads)
- [ ] Tested app pause/resume
- [ ] Tested back button behavior

### Release
- [ ] Release build created (`app-release.aab`)
- [ ] Release notes prepared
- [ ] Internal testing track tested
- [ ] Closed testing track tested (optional)
- [ ] Ready for production release

## iOS-Specific

### Build Configuration
- [ ] Xcode project opened and configured
- [ ] Signing configured (Automatic or Manual)
- [ ] Team selected in Xcode
- [ ] Bundle identifier matches App Store Connect
- [ ] Deployment target set (iOS 13+)

### App Store Connect
- [ ] App created in App Store Connect
- [ ] App information completed:
  - [ ] App name
  - [ ] Subtitle
  - [ ] Category
  - [ ] Age rating
- [ ] Pricing and availability configured
- [ ] App privacy details completed
- [ ] App Store listing:
  - [ ] Description
  - [ ] Keywords
  - [ ] Screenshots uploaded (all sizes)
  - [ ] App preview (optional)
  - [ ] App icon uploaded
  - [ ] Support URL
  - [ ] Marketing URL (optional)
  - [ ] Privacy policy URL

### Testing
- [ ] Tested on iOS 13+
- [ ] Tested on iPhone (multiple sizes)
- [ ] Tested on iPad (if supporting)
- [ ] Tested in portrait and landscape
- [ ] Tested on physical devices
- [ ] Tested ad display (with test ads)
- [ ] Tested app backgrounding/foregrounding
- [ ] Tested on TestFlight

### Release
- [ ] Archive created in Xcode
- [ ] Archive uploaded to App Store Connect
- [ ] Build processed and available
- [ ] Release notes prepared
- [ ] Ready for App Review submission

## Final Checks

### Functionality
- [ ] Game starts correctly
- [ ] Touch controls work properly
- [ ] Haptic feedback works
- [ ] Ads display correctly (test mode)
- [ ] App handles backgrounding correctly
- [ ] No crashes during gameplay
- [ ] Performance is acceptable

### Legal
- [ ] Privacy policy published and accessible
- [ ] Terms of service (if applicable)
- [ ] Copyright notices included
- [ ] Third-party licenses acknowledged

### Marketing
- [ ] App Store screenshots are compelling
- [ ] Description is clear and engaging
- [ ] Keywords are optimized
- [ ] Social media accounts ready (optional)

## Submission

### Google Play
- [ ] All checklist items completed
- [ ] App uploaded as AAB (not APK)
- [ ] Release notes added
- [ ] Submit for review
- [ ] Monitor review status

### App Store
- [ ] All checklist items completed
- [ ] Build uploaded via Xcode
- [ ] Release notes added
- [ ] Submit for review
- [ ] Monitor review status

## Post-Submission

- [ ] Monitor review status
- [ ] Respond to any review feedback
- [ ] Prepare for launch announcement
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Plan first update

## Notes

- Google Play review typically takes 1-3 days
- App Store review typically takes 1-7 days
- Both platforms may request changes or clarifications
- Keep test devices available for quick fixes if needed

