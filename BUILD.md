# Christ Collective Mobile Build Guide

## Build Platform: CodeMagic

This document provides instructions for building the Christ Collective mobile app on CodeMagic.

## Prerequisites

### Required Environment Variables

Set these in your CodeMagic project settings:

1. **STRIPE_SECRET_KEY** - Stripe secret key for payment processing
2. **VITE_STRIPE_PUBLIC_KEY** - Stripe publishable key (frontend)
3. **DATABASE_URL** - PostgreSQL connection string
4. **APIFY_API_TOKEN** (optional) - For social media data extraction

### Build Configuration

**App ID:** `com.christcollective.app`
**App Name:** Christ Collective
**Ionic App ID:** `4534ef5c`

## Build Commands

### Install Dependencies
```bash
npm install
```

### Build Web Assets
```bash
npm run build
```

### Sync Capacitor
```bash
npx cap sync
```

### Build Android
```bash
cd android
./gradlew assembleRelease
```

### Build iOS
```bash
cd ios
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
```

## Platform-Specific Notes

### Android
- Minimum SDK: API 22 (Android 5.1)
- Target SDK: API 34 (Android 14)
- Build files located in: `android/app/build/outputs/apk/release/`

### iOS
- Minimum iOS version: 13.0
- Build files located in: `ios/build/`

## Mobile App Features

The mobile app includes:
- Platform detection (iOS/Android/Web)
- Mobile-optimized authentication flow at `/auth/mobile`
- Bottom navigation for authenticated users
- Auth guards on all interactive features
- Social media-style UI/UX

## Environment Detection

The app uses Capacitor's platform detection:
- `Capacitor.getPlatform()` returns: 'ios', 'android', or 'web'
- Mobile-specific UI shown when platform is 'ios' or 'android'
- Web UI shown when platform is 'web'

## Post-Build Testing

After building, test:
1. Authentication flow (sign up/sign in)
2. Platform-specific UI rendering
3. Bottom navigation visibility
4. Interactive features (like, comment, share, RSVP)
5. Payment processing (donations, subscriptions)
6. Social media integration (for creator profiles)

## Troubleshooting

### Build Fails
- Ensure all environment variables are set
- Check Node.js version (requires Node 18+)
- Verify all dependencies are installed

### Platform Detection Issues
- Check that Capacitor is properly initialized
- Verify `capacitor.config.ts` is correct
- Ensure native plugins are synced with `npx cap sync`

### Authentication Problems
- Verify DATABASE_URL is accessible from mobile
- Check session cookie settings
- Test API endpoints are reachable

## Support

For build issues, check:
1. CodeMagic build logs
2. This repository's GitHub Issues
3. Capacitor documentation: https://capacitorjs.com/docs
