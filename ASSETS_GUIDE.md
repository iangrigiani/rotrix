# App Assets Guide

This guide explains what app icons and splash screens you need to create for publishing Rotrix to Google Play and App Store.

## App Icons

### Android Icons
Place app icons in `android/app/src/main/res/mipmap-*/ic_launcher.png`:

- **mipmap-mdpi**: 48x48 px (ic_launcher.png)
- **mipmap-hdpi**: 72x72 px (ic_launcher.png)
- **mipmap-xhdpi**: 96x96 px (ic_launcher.png)
- **mipmap-xxhdpi**: 144x144 px (ic_launcher.png)
- **mipmap-xxxhdpi**: 192x192 px (ic_launcher.png)

Also create round versions: `ic_launcher_round.png` in the same sizes.

**Foreground icons** (for adaptive icons): `ic_launcher_foreground.png` in all densities.

### iOS Icons
Place app icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

Required sizes:
- 20x20 pt (@2x = 40x40 px, @3x = 60x60 px)
- 29x29 pt (@2x = 58x58 px, @3x = 87x87 px)
- 40x40 pt (@2x = 80x80 px, @3x = 120x120 px)
- 60x60 pt (@2x = 120x120 px, @3x = 180x180 px)
- 1024x1024 px (App Store icon)

## Splash Screens

### Android Splash Screens
Place splash screens in `android/app/src/main/res/drawable-*/splash.png`:

**Portrait:**
- drawable-port-mdpi: 320x470 px
- drawable-port-hdpi: 480x640 px
- drawable-port-xhdpi: 720x960 px
- drawable-port-xxhdpi: 1080x1440 px
- drawable-port-xxxhdpi: 1440x1920 px

**Landscape:**
- drawable-land-mdpi: 470x320 px
- drawable-land-hdpi: 640x480 px
- drawable-land-xhdpi: 960x720 px
- drawable-land-xxhdpi: 1440x1080 px
- drawable-land-xxxhdpi: 1920x1440 px

### iOS Splash Screens
Place splash screens in `ios/App/App/Assets.xcassets/Splash.imageset/`:

- iPhone: 2732x2732 px (universal)
- iPad: 2732x2732 px

## Design Guidelines

### App Icon Design
- Use a simple, recognizable design
- Avoid text (it won't be readable at small sizes)
- Use high contrast colors
- Test at small sizes (48x48 px)
- Follow platform-specific guidelines:
  - Android: [Material Design Icons](https://material.io/design/iconography/product-icons.html)
  - iOS: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)

### Splash Screen Design
- Match your app's theme (#1a1a1a background)
- Keep it simple - it shows briefly
- Can include your app logo centered
- Use the same color scheme as your game

## Tools for Creating Assets

1. **Online Tools:**
   - [App Icon Generator](https://www.appicon.co/)
   - [Icon Kitchen (Android)](https://icon.kitchen/)
   - [MakeAppIcon](https://makeappicon.com/)

2. **Design Software:**
   - Figma
   - Adobe Illustrator/Photoshop
   - Sketch (macOS)

3. **Automated Tools:**
   - [cordova-res](https://github.com/ionic-team/cordova-res) - Can generate icons and splash screens
   - [capacitor-assets](https://github.com/ionic-team/capacitor-assets) - Capacitor-specific tool

## Quick Start

1. Create a 1024x1024 px master icon (PNG, no transparency for iOS)
2. Create a 2732x2732 px master splash screen
3. Use an online tool or script to generate all sizes
4. Place files in the directories listed above
5. Rebuild the app

## Notes

- Android icons can have transparency, iOS App Store icon cannot
- Keep file sizes reasonable (< 1MB per icon)
- Test on actual devices to ensure icons look good
- Update `capacitor.config.js` if you change splash screen settings

