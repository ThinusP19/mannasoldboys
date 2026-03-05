# iOS App Store Submission Guide

Complete walkthrough for publishing the Potch Gim Alumni app to the Apple App Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Apple Developer Account](#apple-developer-account)
3. [App Store Connect Setup](#app-store-connect-setup)
4. [EAS Build Configuration](#eas-build-configuration)
5. [Building for iOS](#building-for-ios)
6. [Required Assets](#required-assets)
7. [App Information](#app-information)
8. [TestFlight Beta Testing](#testflight-beta-testing)
9. [Submission Checklist](#submission-checklist)
10. [Common Rejection Reasons](#common-rejection-reasons)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Mac computer (required for some steps)
- [ ] Apple ID
- [ ] Credit card for Apple Developer enrollment
- [ ] Final app icon (1024x1024 PNG, no alpha channel)
- [ ] App screenshots for all required device sizes
- [ ] Privacy policy URL (must be live and accessible)
- [ ] Production API URL configured in `app.json`

---

## Apple Developer Account

### Enrollment

1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
2. Sign in with your Apple ID
3. Choose enrollment type:
   - **Individual**: $99/year - For personal apps
   - **Organization**: $99/year - Requires D-U-N-S number
4. Complete payment
5. Wait for approval (usually 24-48 hours)

### After Enrollment

1. Accept the Apple Developer Program License Agreement
2. Set up two-factor authentication if not already enabled
3. Note your **Team ID** (found in Membership details)

---

## App Store Connect Setup

### Create App Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in required fields:

| Field | Value |
|-------|-------|
| Platform | iOS |
| Name | Potch Gim Alumni |
| Primary Language | English (U.S.) |
| Bundle ID | com.potchgim.alumniconnect |
| SKU | potchgim-alumni-001 |
| User Access | Full Access |

### App Information

Navigate to **App Information** in the sidebar:

| Field | Value |
|-------|-------|
| Subtitle | Connect with your school community |
| Category | Social Networking |
| Secondary Category | Lifestyle (optional) |
| Content Rights | Does not contain third-party content |
| Age Rating | Complete the questionnaire (likely 4+) |

### Pricing and Availability

1. Go to **Pricing and Availability**
2. Set price to **Free**
3. Select countries for availability (South Africa + others)
4. Set release option:
   - **Manually release** (recommended for first submission)

---

## EAS Build Configuration

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Login to Expo

```bash
eas login
```

### Configure Project

Create or update `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Update app.json for Production

Before building, update `apps/mobile/app.json`:

```json
{
  "expo": {
    "name": "Potch Gim Alumni",
    "slug": "alumni-connect",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.potchgim.alumniconnect",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to take profile photos.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photo library to select profile photos.",
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "extra": {
      "apiUrl": "https://api.alumni.potchgim.co.za/api",
      "eas": {
        "projectId": "your-actual-eas-project-id"
      }
    }
  }
}
```

**Important**:
- Change `apiUrl` to your production URL
- Set `ITSAppUsesNonExemptEncryption` to `false` (unless using custom encryption)
- Increment `buildNumber` for each new build

---

## Building for iOS

### First-Time Setup

```bash
cd apps/mobile

# Initialize EAS for your project (first time only)
eas build:configure

# This creates necessary credentials automatically
```

### Create Production Build

```bash
# Build for App Store
eas build --platform ios --profile production
```

EAS will:
1. Ask to create credentials (choose yes for automatic)
2. Generate Distribution Certificate
3. Create App Store Provisioning Profile
4. Build the IPA file
5. Provide download link when complete

Build typically takes 15-30 minutes.

### Submit to App Store

```bash
# After build completes
eas submit --platform ios --latest
```

Or submit a specific build:

```bash
eas submit --platform ios --id BUILD_ID
```

---

## Required Assets

### App Icon

- **Size**: 1024 x 1024 pixels
- **Format**: PNG (no transparency/alpha channel)
- **Location**: `apps/mobile/assets/images/icon.png`

The icon will be automatically resized for all required sizes.

### Screenshots

Required sizes (provide at least one device from each group):

| Device | Size (Portrait) | Size (Landscape) |
|--------|-----------------|------------------|
| iPhone 6.7" (14 Pro Max) | 1290 x 2796 | 2796 x 1290 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | 2688 x 1242 |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | 2208 x 1242 |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | 2732 x 2048 |

**Recommended screenshots** (5-10 per device):
1. Login/Welcome screen
2. Home/Dashboard
3. Alumni Directory
4. Profile view
5. Reunion events
6. Search functionality

### Creating Screenshots

Using a real device:
```bash
# Run on device
npx expo start

# Take screenshots using device's screenshot feature
```

Using Simulator (macOS):
```bash
# Open simulator
npx expo start --ios

# Screenshot: Cmd + S (saves to Desktop)
```

---

## App Information

### Description (Up to 4000 characters)

```
Connect with your Potch Gim alumni community through our official app.

FEATURES:
• Browse and search the alumni directory
• View alumni profiles and connect with classmates
• Stay updated on reunion events and school news
• Manage your profile and privacy settings
• Register for upcoming reunions and events

Whether you graduated decades ago or recently, stay connected with your Potchefstroom Gimnasium community. Update your profile, find old friends, and never miss an alumni event.

This app is the official platform for Potch Gim Alumni Association members.
```

### Keywords (Up to 100 characters)

```
alumni,potch gim,potchefstroom,gimnasium,school,reunion,classmates,network,south africa
```

### Promotional Text (Up to 170 characters)

```
Connect with fellow Potch Gim alumni, find classmates, and stay updated on reunions and events.
```

### Support URL

Provide a valid URL for user support:
```
https://alumni.potchgim.co.za/support
```

### Privacy Policy URL

**Required**. Must be a live, accessible URL:
```
https://alumni.potchgim.co.za/privacy
```

---

## TestFlight Beta Testing

### Internal Testing

1. In App Store Connect, go to **TestFlight**
2. Add internal testers (up to 100, must be App Store Connect users)
3. Testers receive email invitation
4. Install TestFlight app and accept invitation

### External Testing

1. Create a **Beta Group**
2. Add up to 10,000 external testers
3. Submit for **Beta App Review** (usually 24-48 hours)
4. Once approved, testers receive invitation

### Recommended Testing Flow

1. Test internally with team first
2. Fix any critical issues
3. External beta with select alumni members
4. Gather feedback
5. Make final adjustments
6. Submit for App Store review

---

## Submission Checklist

### Before Building

- [ ] Production API URL set in `app.json`
- [ ] App version number updated
- [ ] Build number incremented
- [ ] All permissions have usage descriptions
- [ ] `ITSAppUsesNonExemptEncryption` set correctly

### In App Store Connect

- [ ] App icon uploaded
- [ ] Screenshots for all required devices
- [ ] App description complete
- [ ] Keywords added
- [ ] Category selected
- [ ] Age rating questionnaire completed
- [ ] Privacy policy URL added (must be live)
- [ ] Support URL added
- [ ] Copyright information added

### Privacy Details

In App Store Connect → App Privacy:

1. **Data Collection**: Specify what data your app collects
2. For this app, likely:
   - Contact Info (Name, Email)
   - User Content (Photos)
   - Identifiers (User ID)

### Final Steps

- [ ] Build uploaded to App Store Connect
- [ ] Build selected for submission
- [ ] Export compliance answered
- [ ] Submit for review

---

## Common Rejection Reasons

### 1. Incomplete Metadata

**Issue**: Missing screenshots, descriptions, or privacy policy

**Fix**: Ensure all required fields are complete before submission

### 2. Broken Links

**Issue**: Privacy policy or support URL returns 404

**Fix**: Verify all URLs are live and accessible worldwide

### 3. Login Required Without Demo

**Issue**: App requires login but no demo account provided

**Fix**: In "App Review Information", provide demo credentials:
```
Username: demo@potchgim.co.za
Password: DemoPassword123
```

### 4. Insufficient Permissions Explanations

**Issue**: Camera/photo library permissions don't clearly explain usage

**Fix**: Update `infoPlist` in `app.json`:
```json
"NSCameraUsageDescription": "This app uses the camera to take photos for your alumni profile.",
"NSPhotoLibraryUsageDescription": "This app accesses your photos to select a profile picture."
```

### 5. Crashes or Major Bugs

**Issue**: App crashes during review

**Fix**: Test thoroughly on real devices before submission

### 6. Guideline 4.2 - Minimum Functionality

**Issue**: App doesn't provide enough functionality

**Fix**: Ensure core features work properly:
- User registration/login
- Profile viewing/editing
- Alumni directory search
- Event viewing

### 7. Guideline 5.1.1 - Data Collection

**Issue**: App Privacy information doesn't match actual data collection

**Fix**: Accurately declare all data collection in App Store Connect

### Responding to Rejections

1. Read the rejection reason carefully
2. Check the specific guideline cited
3. Make necessary fixes
4. Reply in Resolution Center explaining changes
5. Resubmit

---

## Timeline Expectations

| Step | Duration |
|------|----------|
| Developer account approval | 24-48 hours |
| First build submission | 15-30 minutes |
| Beta app review | 24-48 hours |
| App Store review (new app) | 24-48 hours |
| App Store review (update) | 24 hours |

**Tip**: Plan for potential rejections. Allow 1-2 weeks from first submission to actual release.

---

## Helpful Commands

```bash
# Check current EAS credentials
eas credentials --platform ios

# List builds
eas build:list --platform ios

# Cancel a build
eas build:cancel BUILD_ID

# View build details
eas build:view BUILD_ID

# Check submission status
eas submit --platform ios --latest --non-interactive
```

---

*After App Store approval, see [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for final verification steps.*
