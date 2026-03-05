# Production Build TODO

Complete these steps before submitting to the App Store and Google Play.

---

## Pre-Build Setup

### 1. Initialize EAS Project
```bash
cd apps/mobile
npx eas login
npx eas project:init
```
- [ ] Login to your Expo account
- [ ] Run `eas project:init` to create the project
- [ ] Copy the `projectId` from the output
- [ ] Update `app.json` → `extra.eas.projectId` with your project ID

### 2. Set Production API URL
- [ ] Open `app.json`
- [ ] Change `extra.apiUrl` from `http://172.20.10.14:3001/api` to your production URL
  - Example: `https://api.alumni.potchgim.co.za/api`

### 3. Create Privacy Policy Page
- [ ] Create a privacy policy page at: `https://alumni.potchgim.co.za/privacy`
- [ ] This URL must be live before store submission

---

## iOS Setup (App Store)

### 4. Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year): https://developer.apple.com/programs/

### 5. App Store Connect
- [ ] Create new app in App Store Connect: https://appstoreconnect.apple.com
- [ ] Note your **App ID** (found in App Information → General)

### 6. Update eas.json iOS Submit Config
Open `eas.json` and update the iOS submit section:
- [ ] `appleId`: Your Apple ID email
- [ ] `ascAppId`: App Store Connect App ID
- [ ] `appleTeamId`: Found at https://developer.apple.com → Membership

---

## Android Setup (Google Play)

### 7. Google Play Developer Account
- [ ] Register for Google Play Console ($25 one-time): https://play.google.com/console

### 8. Create Google Cloud Service Account
- [ ] Go to Google Cloud Console: https://console.cloud.google.com
- [ ] Create a service account with Google Play Android Developer API access
- [ ] Download the JSON key file
- [ ] Save as `apps/mobile/google-service-account.json`

### 9. Link Service Account to Play Console
- [ ] In Play Console → Setup → API access
- [ ] Link your Google Cloud project
- [ ] Grant the service account "Release manager" permissions

---

## Required Assets

### App Icons (Already Done)
- [x] `icon.png` - 1024x1024
- [x] `adaptive-icon.png` - 1024x1024

### Store Screenshots (Required)

**iOS App Store:**
- [ ] iPhone 6.7" screenshots (1290 x 2796) - iPhone 14 Pro Max
- [ ] iPhone 6.5" screenshots (1242 x 2688) - iPhone 11 Pro Max
- [ ] iPad Pro 12.9" screenshots (2048 x 2732) - if supporting tablets

**Google Play:**
- [ ] Phone screenshots (min 320px, max 3840px)
- [ ] Feature graphic (1024 x 500)

---

## Store Listing Info

Use this info when filling out store listings:

**App Name:** `Potch Gim Alumni`

**Short Description (80 chars - Play Store):**
```
Connect with Potch Gim alumni - find classmates, reunions & events.
```

**Full Description:**
```
The official Potch Gim Alumni app connects you with your Potchefstroom Gimnasium community.

FEATURES:
• Alumni Directory - Browse and search alumni profiles
• Profile Management - Update your alumni profile with photos
• Reunion Events - Stay informed about upcoming reunions
• Advanced Search - Find classmates by name, year, or location
• Push Notifications - Get notified about events and announcements
• Dark Mode - Comfortable viewing day or night

Connect with old friends, find classmates, and never miss an alumni event.
```

**Keywords (iOS - 100 chars max):**
```
alumni,potch gim,potchefstroom,gimnasium,school,reunion,classmates,network,south africa
```

**Category:**
- iOS: Social Networking
- Android: Social

**Privacy Policy URL:** `https://alumni.potchgim.co.za/privacy`

---

## Build Commands

### Test Build First (Recommended)
```bash
cd apps/mobile

# Preview build for internal testing
eas build --profile preview
```

### Production Builds
```bash
# iOS App Store build
eas build --platform ios --profile production

# Android Play Store build
eas build --platform android --profile production
```

### Submit to Stores
```bash
# iOS - submit latest build to App Store
eas submit --platform ios --latest

# Android - submit latest build to Play Store
eas submit --platform android --latest
```

---

## Version Management

For future updates, remember to increment:

| Platform | Field | Location | Example |
|----------|-------|----------|---------|
| Both | `version` | `app.json` | `1.0.0` → `1.1.0` |
| iOS | `buildNumber` | `app.json` → `ios` | `"1"` → `"2"` |
| Android | `versionCode` | `app.json` → `android` | `1` → `2` |

**Note:** `versionCode` must always increase for each Play Store upload.

---

## Verification Checklist

Before submitting:
- [ ] Run `npx expo-doctor` to check for issues
- [ ] Test preview build on real devices
- [ ] Verify push notifications work (requires physical device)
- [ ] Test all app features with production API
- [ ] Confirm privacy policy URL is live
