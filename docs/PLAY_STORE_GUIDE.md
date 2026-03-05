# Google Play Store Submission Guide

Complete walkthrough for publishing the Potch Gim Alumni app to the Google Play Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Play Console Setup](#google-play-console-setup)
3. [EAS Build Configuration](#eas-build-configuration)
4. [Building for Android](#building-for-android)
5. [Required Assets](#required-assets)
6. [Store Listing](#store-listing)
7. [Privacy & Data Safety](#privacy--data-safety)
8. [Testing Tracks](#testing-tracks)
9. [Production Release](#production-release)
10. [Common Issues](#common-issues)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Google account
- [ ] Credit/debit card for registration fee ($25 one-time)
- [ ] Final app icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] App screenshots (minimum 2)
- [ ] Privacy policy URL (must be live and accessible)
- [ ] Production API URL configured in `app.json`

---

## Google Play Console Setup

### Create Developer Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with your Google account
3. Pay the $25 one-time registration fee
4. Complete developer profile:
   - Developer name
   - Contact email
   - Website (optional)

### Create App

1. Click **Create app**
2. Fill in app details:

| Field | Value |
|-------|-------|
| App name | Potch Gim Alumni |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |

3. Accept declarations and create

---

## EAS Build Configuration

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Configure eas.json

Update `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Service Account Setup (for EAS Submit)

This enables automatic submission from EAS to Google Play.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Play Android Developer API**
4. Create service account:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name: `eas-submit`
   - Click **Create and Continue**
   - Skip role selection, click **Done**
5. Create key:
   - Click on the service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Select **JSON**, click **Create**
   - Save as `google-service-account.json`

6. Grant access in Play Console:
   - Go to [Play Console](https://play.google.com/console)
   - Navigate to **Users and permissions**
   - Click **Invite new users**
   - Add the service account email (from JSON file)
   - Grant permissions:
     - **Admin** (all permissions) OR
     - Specific: Release to production, Manage testing tracks

7. Place the JSON file:
   ```bash
   cp google-service-account.json apps/mobile/
   ```

8. **Important**: Add to `.gitignore`:
   ```
   google-service-account.json
   ```

### Update app.json for Production

```json
{
  "expo": {
    "name": "Potch Gim Alumni",
    "slug": "alumni-connect",
    "version": "1.0.0",
    "android": {
      "package": "com.potchgim.alumniconnect",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#1e3a5f"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
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
- Increment `versionCode` for each new upload
- The `versionCode` must always increase

---

## Building for Android

### Create Production Build

```bash
cd apps/mobile

# Build for Play Store (produces AAB file)
eas build --platform android --profile production
```

EAS will:
1. Generate or use existing keystore
2. Build the Android App Bundle (.aab)
3. Provide download link when complete

Build typically takes 10-20 minutes.

### Download the Build

```bash
# Download the AAB file
eas build:list --platform android
# Get the build ID and download from the provided URL
```

### Submit to Play Console

**Option 1: Using EAS Submit (automated)**

```bash
eas submit --platform android --latest
```

**Option 2: Manual Upload**

1. Download the .aab file from EAS
2. Go to Play Console → Your App
3. Navigate to **Production** (or testing track)
4. Click **Create new release**
5. Upload the .aab file

---

## Required Assets

### App Icon

- **Size**: 512 x 512 pixels
- **Format**: PNG (32-bit, with alpha)
- **Location**: Used from `apps/mobile/assets/images/icon.png`

### Feature Graphic

- **Size**: 1024 x 500 pixels
- **Format**: PNG or JPEG
- **Purpose**: Displayed at top of store listing
- **Design tips**:
  - Include app name
  - Show key feature or benefit
  - Use brand colors

### Screenshots

**Phone screenshots** (required):
- Minimum: 2 screenshots
- Maximum: 8 screenshots
- Size: 16:9 or 9:16 aspect ratio
- Minimum dimension: 320px
- Maximum dimension: 3840px

**Tablet screenshots** (recommended):
- 7-inch tablet: 2-8 screenshots
- 10-inch tablet: 2-8 screenshots

**Recommended screenshots**:
1. Login/Welcome screen
2. Home dashboard
3. Alumni directory
4. Profile view
5. Reunion events
6. Search feature

### Taking Screenshots

Using a real device or emulator:

```bash
# Start development build
npx expo start --android

# Take screenshots on device/emulator
# Android: Power + Volume Down
# Emulator: Click camera icon in toolbar
```

---

## Store Listing

### App Details

Navigate to **Store presence** → **Main store listing**

#### Short Description (80 characters max)

```
Connect with Potch Gim alumni - find classmates, reunions & events.
```

#### Full Description (4000 characters max)

```
The official Potch Gim Alumni app connects you with your Potchefstroom Gimnasium community.

FEATURES:

📋 Alumni Directory
Browse and search through alumni profiles. Find classmates from your year or across generations.

👤 Profile Management
Create and update your alumni profile. Add your graduation year, current location, and career information.

🎉 Reunion Events
Stay informed about upcoming reunions and alumni events. Register directly through the app.

🔍 Advanced Search
Search for alumni by name, graduation year, or location. Reconnect with old friends easily.

🔔 Notifications
Get notified about upcoming events, announcements, and when alumni from your year join.

🌙 Dark Mode
Comfortable viewing with automatic dark mode support.

Whether you graduated recently or decades ago, the Potch Gim Alumni app helps you stay connected with your school community. Join thousands of alumni who are already reconnecting with their Potch Gim family.

This app is maintained by the Potch Gim Alumni Association.
```

### Categorization

| Field | Value |
|-------|-------|
| App category | Social |
| Tags | Alumni, School, Networking, Events |

### Contact Details

| Field | Value |
|-------|-------|
| Email | alumni@potchgim.co.za |
| Website | https://alumni.potchgim.co.za |

---

## Privacy & Data Safety

### Privacy Policy

1. Navigate to **Policy** → **App content**
2. Click **Privacy policy**
3. Enter your privacy policy URL:
   ```
   https://alumni.potchgim.co.za/privacy
   ```

### Data Safety Form

Navigate to **Policy** → **App content** → **Data safety**

Complete the questionnaire:

#### Data Collection

**Data types collected:**

| Category | Data Type | Collection Purpose |
|----------|-----------|-------------------|
| Personal info | Name | App functionality |
| Personal info | Email | Account management |
| Photos | Profile photo | App functionality |

#### Data Sharing

Select "No" if data is not shared with third parties.

#### Data Handling

| Question | Answer |
|----------|--------|
| Data encrypted in transit | Yes |
| Users can request deletion | Yes |

### App Content Rating

Navigate to **Policy** → **App content** → **Content ratings**

Complete the IARC questionnaire:
- Violence: None
- Sexual content: None
- Language: None
- Controlled substances: None
- Miscellaneous: User interaction (users can communicate)

Expected rating: **PEGI 3** / **Everyone**

---

## Testing Tracks

Google Play offers multiple testing tracks before production.

### Internal Testing (Recommended First)

1. Go to **Testing** → **Internal testing**
2. Click **Create new release**
3. Upload your AAB file
4. Add release notes
5. Review and start rollout

**Add testers:**
- Go to **Testers** tab
- Create email list
- Add tester emails
- Testers receive invitation email

### Closed Testing

For larger beta groups:
1. Go to **Testing** → **Closed testing**
2. Create a track
3. Upload build
4. Add testers (up to 2000)

### Open Testing

For public beta:
1. Go to **Testing** → **Open testing**
2. Anyone can join via Play Store

### Testing Flow

1. **Internal testing** → Team members (5-10 people)
2. **Closed testing** → Selected alumni (50-100)
3. **Open testing** → Public beta (optional)
4. **Production** → Full release

---

## Production Release

### Pre-Release Checklist

- [ ] All testing complete
- [ ] No critical bugs
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Privacy policy live
- [ ] Data safety form complete
- [ ] Content rating complete
- [ ] Target API level meets requirements

### Create Production Release

1. Navigate to **Production**
2. Click **Create new release**
3. Upload your AAB file (or promote from testing)
4. Add release notes:
   ```
   Initial release of Potch Gim Alumni app.

   Features:
   • Alumni directory with search
   • Profile management
   • Reunion event registration
   • Push notifications
   ```
5. Click **Review release**
6. Fix any warnings/errors
7. Click **Start rollout to Production**

### Staged Rollout

For production, you can do staged rollout:
- Start with 10% of users
- Monitor for crashes/issues
- Gradually increase to 100%

### Review Time

- First submission: 1-3 days (sometimes up to 7)
- Updates: Usually within 24 hours
- Check status in **Publishing overview**

---

## Common Issues

### 1. App Not Meeting Target API Level

**Issue**: Google requires apps to target recent API levels

**Current requirement**: Target API level 34 (Android 14)

**Fix**: EAS builds with latest Expo SDK should meet this. Check:
```json
// app.json
{
  "expo": {
    "android": {
      "targetSdkVersion": 34
    }
  }
}
```

### 2. Signing Key Issues

**Issue**: Uploaded APK/AAB signed with different key

**Fix**:
- Use same keystore for all uploads
- EAS manages this automatically
- Never regenerate keystore after first upload

To check keystore:
```bash
eas credentials --platform android
```

### 3. Version Code Not Incremented

**Issue**: "Version code X has already been used"

**Fix**: Increment `versionCode` in app.json:
```json
{
  "android": {
    "versionCode": 2  // Increment this
  }
}
```

### 4. Privacy Policy Issues

**Issue**: Policy URL not accessible or incomplete

**Fix**:
- Ensure URL works worldwide
- Include all required sections (data collection, usage, sharing)
- Test URL before submission

### 5. Rejected for Policy Violations

**Issue**: App rejected for metadata policy violations

**Common causes**:
- Screenshots showing non-final UI
- Using "free" or other promotional words excessively
- Misleading descriptions

**Fix**: Review [Google Play policies](https://play.google.com/about/developer-content-policy/) carefully

### 6. AAB vs APK

**Issue**: Uploaded APK instead of AAB

**Fix**: Google Play requires Android App Bundle (AAB) for new apps
```bash
# EAS builds AAB by default for production
eas build --platform android --profile production
```

---

## Helpful Commands

```bash
# Check build status
eas build:list --platform android

# View build details
eas build:view BUILD_ID

# Cancel a build
eas build:cancel BUILD_ID

# Check credentials
eas credentials --platform android

# Submit to Play Store
eas submit --platform android --latest

# Submit specific build
eas submit --platform android --id BUILD_ID
```

---

## Timeline Expectations

| Step | Duration |
|------|----------|
| Account setup | Immediate |
| First internal release | 5-10 minutes |
| Closed/Open testing | 1-2 hours |
| Production review (first app) | 1-7 days |
| Production review (updates) | 1-3 days |

---

## Post-Launch

After successful launch:

1. **Monitor Android Vitals**
   - Check for ANRs (App Not Responding)
   - Monitor crash rates
   - Review user feedback

2. **Respond to Reviews**
   - Reply to user reviews
   - Address concerns professionally

3. **Plan Updates**
   - Regular bug fixes
   - New features based on feedback

---

*After Play Store approval, see [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for final verification steps.*
