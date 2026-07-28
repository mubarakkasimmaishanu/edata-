# Play Store Build & Upload Guide

## Overview
This document captures all configuration, versioning, build fixes, and Play Store upload procedures for the **eData Mobile App** (`com.edata.app`). Follow this guide to generate a crash-free APK/AAB and upload it to Google Play Console without rejection.

---

## 1. Version Management

### Version Code & Name Rules
- **`versionCode`** (integer): Must be **strictly greater** than the current live version on Google Play Console. Check `Production > Release history` for the latest code.
- **`versionName`** (string): Human-readable version displayed to users (e.g. `2.2.0`).

### Where to Update Versions
1. **`android/app/build.gradle`** (lines ~10-11):
   ```groovy
   versionCode 8        // Must exceed Play Console's latest (was 7)
   versionName "2.2.0"  // Semantic version for users
   ```
2. **`package.json`** (line ~4):
   ```json
   "version": "2.2.0"
   ```

### Version History (Google Play Console)
| Release | Version Code | Version Name | Date | Status |
|---------|:---:|:---:|---|---|
| 7 | 7 | 2.1.0 | 11 Mar 2025 | Current Live |
| 8 | 8 | 2.2.0 | 27 Jul 2026 | Pending Upload |

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

## 3. Build Configuration Files

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

## 4. Common Build Failures & Fixes

### 4.1 `jcenter.bintray.com` Resolution Failure
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

### 4.2 `invalid source release: 21`
**Error**: `error: invalid source release: 21`
**Cause**: Capacitor 8 requires JDK 21, but system has JDK 17.
**Fix**: Downgrade Capacitor to v6 (see Section 2) OR install JDK 21.

### 4.3 `SDK location not found`
**Error**: `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file`
**Fix**: Create `android/local.properties` with:
```properties
sdk.dir=C\:\\Users\\MY PC\\AppData\\Local\\Android\\Sdk
```

### 4.4 Gradle Download Timeout
**Error**: `java.io.IOException: Downloading from ... failed: timeout (10000ms)`
**Fix**: Increase `networkTimeout` in `gradle-wrapper.properties`:
```properties
networkTimeout=30000
```

### 4.5 `versionCode X has already been used`
**Error**: Google Play Console rejects upload.
**Fix**: Increment `versionCode` in `android/app/build.gradle` to be strictly greater than the current live version.

### 4.6 Play Store Upload Key Reset
If the original Android signing key is lost for an existing app with Play App Signing enabled:
1. Generate new keystore: `keytool -genkey -v -keystore edata-release-key.jks -alias edata-key-alias -keyalg RSA -keysize 2048 -validity 10000`
2. Export public certificate: `keytool -exportcert -rfc -alias edata-key-alias -keystore edata-release-key.jks -file upload_certificate.pem`
3. Submit key reset request: Play Console → Setup → App Integrity.

---

## 5. Full Build & Upload Workflow

### Step 1: Pre-Build Checklist
- [ ] Increment `versionCode` in `android/app/build.gradle` (must exceed Play Console live version)
- [ ] Update `versionName` in `android/app/build.gradle`
- [ ] Update `version` in `package.json`
- [ ] Verify `android/local.properties` exists with correct SDK path
- [ ] Verify `edata-release-key.jks` exists in `android/app/`
- [ ] Verify no `jcenter()` references in any `build.gradle` files

### Step 2: Build Web Assets
```bash
cd c:\Users\MY PC\Desktop\edata-mobile
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

## 6. Key File Locations

| File | Path | Purpose |
|---|---|---|
| App build config | `android/app/build.gradle` | Version codes, signing config, dependencies |
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

## 7. Certificate Fingerprints

| Type | SHA-1 Fingerprint |
|---|---|
| **Release Upload Keystore** | `54:2F:0E:76:32:BF:AF:66:FA:D4:1B:49:04:21:47:C7:D0:8C:72:FB` |
| **Debug Keystore** | `0D:6E:9B:44:6A:FB:00:CC:A3:A8:EB:7A:5E:EE:0A:75:27:46:69:84` |

> These are used for Google Sign-In OAuth client configuration and Digital Asset Links (`assetlinks.json`).
