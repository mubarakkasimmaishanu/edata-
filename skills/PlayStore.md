# Play Store Build & Upload Guide

## Overview
This document captures all configuration, versioning, build fixes, and Play Store upload procedures for the **eData Mobile App** (`com.eDATA.app`). Follow this guide to generate a crash-free APK/AAB and upload it to Google Play Console without rejection.

---

## 1. Version Management

### Version Code & Name Rules
- **`versionCode`** (integer): Must be **strictly greater** than the current live version on Google Play Console. Check `Production > Release history` for the latest code.
- **`versionName`** (string): Human-readable version displayed to users (e.g. `2.2.0`).

### Where to Update Versions
1. **`android/app/build.gradle`** (lines ~15-20):
   ```groovy
   applicationId "com.eDATA.app"
   versionCode 9        // Must exceed Play Console's latest (was 8)
   versionName "2.2.0"  // Semantic version for users
   ```
2. **`package.json`** (line ~4):
   ```json
   "version": "2.2.0"
   ```

### Version History (Google Play Console)
| Release | Version Code | Version Name | Date | Status |
|---------|:---:|:---:|---|---|
| 7 | 7 | 2.1.0 | 11 Mar 2025 | Previous Live |
| 8 | 8 | 2.2.0 | 28 Jul 2026 | Used in Draft |
| 9 | 9 | 2.2.0 | 29 Jul 2026 | Active Verified AAB Release |

> **CRITICAL**: Google Play will reject any upload where `versionCode <= current live versionCode`. Always increment.

---

## 2. Java & Gradle Compatibility Matrix

### Current Working Configuration (JDK 17)
| Component | Version | Notes |
|---|---|---|
| **JDK** | OpenJDK 17.0.19 (Microsoft) | `JAVA_HOME = C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot\` |
| **Android Gradle Plugin (AGP)** | 8.2.1 | In `android/build.gradle` → `classpath 'com.android.tools.build:gradle:8.2.1'` |
| **Gradle Wrapper** | 8.5 | In `gradle/wrapper/gradle-wrapper.properties` |
| **Capacitor** | 6.2.0 | `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` |
| **compileSdkVersion** | 34 | In `android/variables.gradle` |
| **targetSdkVersion** | 34 | In `android/variables.gradle` |
| **minSdkVersion** | 22 | In `android/variables.gradle` |

### Capacitor Version ↔ JDK Compatibility
| Capacitor Version | Required JDK | AGP Version | Gradle Version |
|:---:|:---:|:---:|:---:|
| **6.x** | JDK 17 | 8.2.1 | 8.5 |
| **7.x** | JDK 17 | 8.7+ | 8.9+ |
| **8.x** | JDK 21 | 8.7+ | 8.9+ |

> **WARNING**: If you upgrade Capacitor to v8, you **MUST** install JDK 21 first. Otherwise the build will fail with `error: invalid source release: 21`.

### Upgrading to Capacitor 8 (Future)
1. Install JDK 21 and update `JAVA_HOME`.
2. Run: `npm install @capacitor/core@8 @capacitor/cli@8 @capacitor/android@8 --save --legacy-peer-deps`
3. Update AGP to `8.7+` in `android/build.gradle`.
4. Update Gradle wrapper to `8.9+` in `gradle-wrapper.properties`.
5. Update `variables.gradle`: `compileSdkVersion = 35`, `targetSdkVersion = 35`.
6. Run `npx cap sync android`.

### Downgrading to Capacitor 6 (Current)
1. Run: `npm install @capacitor/core@6.2.0 @capacitor/cli@6.2.0 @capacitor/android@6.2.0 --save --legacy-peer-deps`
2. Set AGP to `8.2.1` in `android/build.gradle`.
3. Set Gradle wrapper to `8.5` in `gradle-wrapper.properties`.
4. Set `compileSdkVersion = 34`, `targetSdkVersion = 34` in `variables.gradle`.
5. Run `npx cap sync android`.

---

## 3. Firebase & Google OAuth 2.0 Configuration

### Overview
Google Cloud Platform (GCP) and Firebase share the underlying project infrastructure (`saukiglobal-8ab14`). Google Sign-In on Android uses `@codetrix-studio/capacitor-google-auth` which requires `google-services.json` to generate Android XML string resources (`R.string.default_web_client_id`).

### Key Identifiers & Configuration
| Parameter | Value | Source File |
|---|---|---|
| **Firebase Project ID** | `saukiglobal-8ab14` | Firebase Console |
| **Android Package Name** | `com.edata.app` | `android/app/build.gradle` (`applicationId`) |
| **App Nickname** | `eData` | Firebase Console App Settings |
| **Server Client ID** | `518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com` | `capacitor.config.ts` (`serverClientId`) |
| **Config Target File** | `android/app/google-services.json` | Downloaded from Firebase Console |

### Step-by-Step Firebase & Android Integration
1. **Link GCP Project to Firebase**: Select existing project `saukiglobal-8ab14` in Firebase Console.
2. **Register Android App**:
   - Package Name: `com.edata.app`
   - App Nickname: `eData`
3. **Register Certificate SHA-1 Fingerprints in Firebase**:
   - **Debug SHA-1**: `0D:6E:9B:44:6A:FB:00:CC:A3:A8:EB:7A:5E:EE:0A:75:27:46:69:84`
   - **Release Upload SHA-1**: `54:2F:0E:76:32:BF:AF:66:FA:D4:1B:49:04:21:47:C7:D0:8C:72:FB`
4. **Download & Place `google-services.json`**:
   - Download the file from Firebase Console **after** saving the SHA-1 fingerprints.
   - Save to: `C:\Users\MY PC\Desktop\edata-mobile\android\app\google-services.json`
5. **Gradle Auto-Detection**: Lines 58–64 in `android/app/build.gradle` automatically detect `google-services.json` and apply `apply plugin: 'com.google.gms.google-services'`.
6. **Publishing Status**: Google Cloud Console ➔ APIs & Services ➔ OAuth Consent Screen must be set to **"In Production"** for all users to sign in cleanly.

---

## 4. Build Configuration Files

### `android/local.properties`
```properties
sdk.dir=C\:\\Users\\MY PC\\AppData\\Local\\Android\\Sdk
```
> This file is **not committed to Git**. If missing, Gradle fails with `SDK location not found`.

### `android/variables.gradle` (Capacitor 6 / JDK 17)
```groovy
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.8.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.2'
}
```

### `android/gradle/wrapper/gradle-wrapper.properties`
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-all.zip
networkTimeout=30000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### `android/app/build.gradle` — Signing Config
```groovy
signingConfigs {
    release {
        storeFile file('edata-release-key.jks')
        storePassword 'eDataMobile2026!'
        keyAlias 'edata-key-alias'
        keyPassword 'eDataMobile2026!'
    }
}
```
> **Release keystore file**: `android/app/edata-release-key.jks` — do NOT delete this file.

---

## 5. Common Build Failures & Fixes

### 5.1 `jcenter.bintray.com` Resolution Failure
**Error**: `Could not GET 'https://jcenter.bintray.com/...' > jcenter.bintray.com`
**Cause**: JCenter repository was permanently shut down in Feb 2023.
**Fix**: Replace `jcenter()` with `mavenCentral()` in ALL `build.gradle` files:
- `android/build.gradle` (root)
- `node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle`

```groovy
// WRONG (dead):
repositories {
    jcenter()
    google()
}

// CORRECT:
repositories {
    google()
    mavenCentral()
}
```
> **NOTE**: After running `npm install`, the Google Auth plugin's `build.gradle` may be restored to its original state with `jcenter()`. Always re-patch after `npm install`.

### 5.2 `invalid source release: 21`
**Error**: `error: invalid source release: 21`
**Cause**: Capacitor 8 requires JDK 21, but system has JDK 17.
**Fix**: Downgrade Capacitor to v6 (see Section 2) OR install JDK 21.

### 5.3 `SDK location not found`
**Error**: `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file`
**Fix**: Create `android/local.properties` with:
```properties
sdk.dir=C\:\\Users\\MY PC\\AppData\\Local\\Android\\Sdk
```

### 5.4 Gradle Download Timeout
**Error**: `java.io.IOException: Downloading from ... failed: timeout (10000ms)`
**Fix**: Increase `networkTimeout` in `gradle-wrapper.properties`:
```properties
networkTimeout=30000
```

### 5.5 `versionCode X has already been used`
**Error**: Google Play Console rejects upload.
**Fix**: Increment `versionCode` in `android/app/build.gradle` to be strictly greater than the current live version.

### 5.6 Play Store Upload Key Reset
If the original Android signing key is lost for an existing app with Play App Signing enabled:
1. Generate new keystore: `keytool -genkey -v -keystore edata-release-key.jks -alias edata-key-alias -keyalg RSA -keysize 2048 -validity 10000`
2. Export public certificate: `keytool -exportcert -rfc -alias edata-key-alias -keystore edata-release-key.jks -file upload_certificate.pem`
3. Submit key reset request: Play Console → Setup → App Integrity.

---

## 6. Full Build & Upload Workflow

### Step 1: Pre-Build Checklist
- [ ] Increment `versionCode` in `android/app/build.gradle` (must exceed Play Console live version)
- [ ] Update `versionName` in `android/app/build.gradle`
- [ ] Update `version` in `package.json`
- [ ] Verify `android/local.properties` exists with correct SDK path
- [ ] Verify `edata-release-key.jks` exists in `android/app/`
- [ ] Verify `google-services.json` exists in `android/app/`
- [ ] Verify no `jcenter()` references in any `build.gradle` files

### Step 2: Build Web Assets & Sync Capacitor
```bash
cd "C:\Users\MY PC\Desktop\edata-mobile"
npm run build
npx cap sync android
```

### Step 3: Generate Release APK
```bash
cd android
gradlew.bat clean assembleRelease
```
**Output**: `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Generate Release AAB (for Play Console)
```bash
cd android
gradlew.bat clean bundleRelease
```
**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Upload to Google Play Console
1. Go to **Google Play Console** → **Production** → **Create new release**
2. Upload `app-release.aab` (preferred) or `app-release.apk`
3. Add release notes
4. Review and roll out

### Step 6: Post-Upload
- [ ] Commit and push all changes to GitHub
- [ ] Tag the release: `git tag v2.2.0 && git push origin v2.2.0`

---

## 7. Key File Locations

| File | Path | Purpose |
|---|---|---|
| App build config | `android/app/build.gradle` | Version codes, signing config, dependencies |
| Google Services config | `android/app/google-services.json` | Firebase & Google Sign-In app configuration |
| Root build config | `android/build.gradle` | AGP version, global repositories |
| SDK variables | `android/variables.gradle` | SDK versions, AndroidX versions |
| Gradle wrapper | `android/gradle/wrapper/gradle-wrapper.properties` | Gradle distribution version |
| SDK location | `android/local.properties` | Android SDK path (not in Git) |
| Release keystore | `android/app/edata-release-key.jks` | APK/AAB signing key |
| Capacitor config | `capacitor.config.ts` | App ID, server config |
| Web entry | `src/App.tsx` | Main React app component |
| API service | `src/services/api.ts` | REST API client |
| Package manifest | `package.json` | npm version, dependencies |

---

## 8. Certificate Fingerprints Summary

| Type | SHA-1 Fingerprint | SHA-256 Fingerprint |
|---|---|---|
| **Release Upload Keystore** | `54:2F:0E:76:32:BF:AF:66:FA:D4:1B:49:04:21:47:C7:D0:8C:72:FB` | `92:95:8E:E8:76:0F:90:CF:DA:95:11:B9:3B:32:1F:B5:59:92:DD:A8:15:51:25:5D:59:CA:3F:03:3F:87:B2:D1` |
| **Debug Keystore** | `0D:6E:9B:44:6A:FB:00:CC:A3:A8:EB:7A:5E:EE:0A:75:27:46:69:84` | `A9:10:76:BA:93:53:23:79:75:2E:C7:C2:95:F0:B7:30:58:D0:36:BD:59:3A:DB:FF:B0:94:11:AF:BB:23:59:F2` |

> These fingerprints are registered in Firebase Console under app `com.edata.app` (`saukiglobal-8ab14`) for native Google Sign-In authorization.

