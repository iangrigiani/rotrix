# AdMob Setup Guide

## Getting Your AdMob Application ID

The AdMob application ID is required for the app to run. It must be added in two places:

1. **AndroidManifest.xml** - Required for Android
2. **capacitor.config.js** - Used by Capacitor plugin

## Current Configuration

Currently using **test AdMob IDs** for development. These will show test ads.

## How to Get Your Real AdMob App ID

1. Go to [AdMob Console](https://apps.admob.com/)
2. Sign in with your Google account
3. Click "Apps" in the left menu
4. Click "Add app" if you haven't created one yet
5. Select your app platform (Android/iOS)
6. Enter your app details
7. After creating the app, you'll see your **App ID**

The App ID format is: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`

## Where to Update

### 1. AndroidManifest.xml
File: `android/app/src/main/AndroidManifest.xml`

Find this section:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>
```

Replace the `android:value` with your real App ID.

### 2. capacitor.config.js
File: `capacitor.config.js`

Find this section:
```javascript
AdMob: {
  appId: 'ca-app-pub-3940256099942544~3347511713'
}
```

Replace with your real App ID.

### 3. Ad Unit IDs (for actual ads)
File: `src/native/ads.js`

After getting your App ID, create ad units in AdMob console:
- Banner ad unit
- Interstitial ad unit  
- Rewarded ad unit (if using)

Then update the ad unit IDs in `src/native/ads.js`:
```javascript
// Replace test IDs with your real ad unit IDs
adId: 'ca-app-pub-3940256099942544/6300978111', // Your banner ID
adId: 'ca-app-pub-3940256099942544/1033173712', // Your interstitial ID
adId: 'ca-app-pub-3940256099942544/5224354917', // Your rewarded ID
```

Also set `isTesting: false` when ready for production.

## Important Notes

- **Test IDs**: The current IDs (`ca-app-pub-3940256099942544~3347511713`) are Google's test IDs and will show test ads
- **App ID vs Ad Unit ID**: 
  - App ID: One per app (format: `ca-app-pub-XXXX~YYYY`)
  - Ad Unit ID: One per ad placement (format: `ca-app-pub-XXXX/ZZZZ`)
- **Android Requirement**: The App ID MUST be in AndroidManifest.xml or the app will crash
- **iOS**: The App ID in capacitor.config.js is sufficient for iOS

## Troubleshooting

### Error: "Missing application ID"
- Make sure the App ID is in AndroidManifest.xml
- Check that the format is correct: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`
- Rebuild the app after making changes

### Test Ads Not Showing
- Make sure you're using test ad unit IDs
- Check that `isTesting: true` in ads.js
- Verify internet connection

### Production Ads Not Showing
- Verify your App ID is correct
- Verify your ad unit IDs are correct
- Make sure `isTesting: false` in ads.js
- Check AdMob console for any policy violations
- Wait 24-48 hours after creating ad units (they need to activate)

