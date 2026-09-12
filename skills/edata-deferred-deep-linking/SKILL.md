---
name: edata-deferred-deep-linking
description: Complete specification and implementation guide for eData Deferred Deep Linking, Reseller Onboarding, Android App Links, Google Play Install Referrer, and future iOS Universal Links via Magic Code.
---

# eData Deferred Deep Linking & Reseller Onboarding Guide

This document is the standard architectural reference for deep linking, deferred deep linking, and automated referral synchronization across the **eData Web Backend (Yii2)**, **Android Mobile App (Capacitor)**, and future **iOS Mobile App (Magic Code / Xcode)**.

---

## 1. System Overview & The Reseller Onboarding Journey

When an eData marketer shares their referral link (e.g., `https://edata.com.ng/join?ref=AHMED123` or `https://edata.com.ng/r/AHMED123`):

### Scenario A: Reseller already has the app installed
1. Reseller taps link on WhatsApp/SMS/Social Media.
2. Android OS recognizes `edata.com.ng` via **Android App Links** (`autoVerify="true"`).
3. The eData app opens directly without showing a browser prompt.
4. The app captures `ref=AHMED123` from the URL, routes to the registration screen, and auto-fills the referral code.

### Scenario B: Reseller does NOT have the app installed ("Deferred Deep Linking")
1. Reseller taps link on mobile.
2. Browser opens `https://edata.com.ng/join?ref=AHMED123`.
3. The web server detects the mobile platform:
   - **Android**:
     - Copies `edata-ref:AHMED123` to the device clipboard via JavaScript bridge.
     - Forwards to Google Play Store with Install Referrer:
       `https://play.google.com/store/apps/details?id=com.eDATA.app&referrer=ref%3DAHMED123`
   - **iOS**:
     - Prepares for the Apple App Store listing, or opens the web signup page with code prefilled.
   - **Desktop**:
     - Displays the web portal with an interactive QR code to scan from a phone, a 1-click copy button for the code, and a direct web signup form.
4. Reseller installs the app from Google Play Store.
5. On the first launch of the freshly installed app:
   - The app checks the Google Play Install Referrer / Clipboard for `edata-ref:<CODE>` or `ref=<CODE>`.
   - The referral code is extracted and saved to `localStorage.setItem('edata_pending_referral', code)`.
   - When the user lands on the Auth page, the referral code is automatically populated, locked in, and a visual badge confirms the attribution.

---

## 2. Android App Links Specification

### Domain Verification (`assetlinks.json`)
* **Live Location:** `https://edata.com.ng/.well-known/assetlinks.json`
* **File Path in Codebase:** `frontend/web/.well-known/assetlinks.json`
* **Content:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.eDATA.app",
      "sha256_cert_fingerprints": [
        "55:8A:6B:ED:FC:D9:DF:9F:D6:3F:74:4F:90:BF:49:B2:90:09:36:18:1E:A4:08:A7:A7:24:26:59:AE:36:96:34"
      ]
    }
  }
]
```

### AndroidManifest Configuration (`AndroidManifest.xml`)
In `android/app/src/main/AndroidManifest.xml`, inside `<activity android:name="com.eDATA.app.MainActivity">`:
```xml
<!-- Android App Links for edata.com.ng -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="edata.com.ng" android:pathPrefix="/join" />
    <data android:scheme="https" android:host="edata.com.ng" android:pathPrefix="/r" />
    <data android:scheme="https" android:host="www.edata.com.ng" android:pathPrefix="/join" />
    <data android:scheme="https" android:host="www.edata.com.ng" android:pathPrefix="/r" />
</intent-filter>

<!-- Custom Scheme for Fallback Linking -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.eDATA.app" />
</intent-filter>
```

---

## 3. Web Backend Gateway Specification

### URL Routes (`frontend/config/main.php`)
* `'join'` => `'site/join'`
* `'r/<ref:\w+>'` => `'site/r'`
* `'.well-known/apple-app-site-association'` => `'site/apple-app-site-association'`

### Smart Redirect Logic (`SiteController.php`)
1. Sanitize the referral code: uppercase alphanumeric only (`preg_replace('/[^A-Za-z0-9]/', '', $ref)`).
2. Save referral code in user session (`Yii::$app->session->set('referred_by', $ref)`).
3. Detect platform using HTTP User-Agent:
   - **Android**:
     `$playStoreUrl = 'https://play.google.com/store/apps/details?id=com.eDATA.app&referrer=ref%3D' . rawurlencode($ref);`
     Render `frontend/views/site/join.php` with auto-clipboard bridge and 1-second auto-redirect to Play Store.
   - **Desktop / Laptop**:
     Render `frontend/views/site/join.php` in full desktop view with QR Code, feature highlights, and direct registration link.

---

## 4. Mobile App (React + Capacitor) Implementation

### Deep Link Listener & Deferred Resolver (`src/services/deepLink.ts`)
```typescript
import { App } from '@capacitor/app';

const PENDING_REF_KEY = 'edata_pending_referral';

export function savePendingReferral(code: string) {
  if (code && typeof code === 'string') {
    const cleanCode = code.trim().toUpperCase();
    localStorage.setItem(PENDING_REF_KEY, cleanCode);
    return cleanCode;
  }
  return null;
}

export function getPendingReferral(): string | null {
  return localStorage.getItem(PENDING_REF_KEY);
}

export function clearPendingReferral() {
  localStorage.removeItem(PENDING_REF_KEY);
}

export function extractReferralFromUrl(rawUrl: string): string | null {
  try {
    const urlObj = new URL(rawUrl);
    const ref = urlObj.searchParams.get('ref');
    if (ref) return ref.trim().toUpperCase();

    // Check path for /r/CODE
    const match = urlObj.pathname.match(/\/r\/([A-Za-z0-9_]+)/);
    if (match && match[1]) return match[1].trim().toUpperCase();
  } catch {
    // Fallback for custom schemes like com.eDATA.app://join?ref=CODE
    const refMatch = rawUrl.match(/[?&]ref=([A-Za-z0-9_]+)/i);
    if (refMatch && refMatch[1]) return refMatch[1].trim().toUpperCase();
  }
  return null;
}
```

### Clipboard Deferred Resolver
On app cold start:
```typescript
export async function checkClipboardForReferral(): Promise<string | null> {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('edata-ref:')) {
        const code = text.replace('edata-ref:', '').trim().toUpperCase();
        if (code) {
          savePendingReferral(code);
          return code;
        }
      }
    }
  } catch {}
  return null;
}
```

---

## 5. Future iOS App Blueprint (Universal Links via Magic Code)

When transitioning to building the iOS version with **Magic Code** and Xcode:

### A. Apple App Site Association File (`apple-app-site-association`)
* **Live URL:** `https://edata.com.ng/.well-known/apple-app-site-association`
* **Format:** Unsigned JSON file, strictly **without** a `.json` file extension.
* **MIME Type:** `application/json`
* **Structure:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "<APPLE_TEAM_ID>.com.eDATA.app",
        "paths": [
          "/join*",
          "/r/*"
        ]
      }
    ]
  }
}
```

### B. Xcode Configuration
1. Open the project in Xcode.
2. Under target **Signing & Capabilities**, click **+ Capability** and add **Associated Domains**.
3. Add the following entry:
   `applinks:edata.com.ng`
   `applinks:www.edata.com.ng`
4. When the iOS app is installed on an iPhone, iOS automatically queries `https://edata.com.ng/.well-known/apple-app-site-association`, caches it, and enables Universal Links.

### C. Magic Code iOS Workflow
1. Use Magic Code to generate or bundle the Capacitor iOS workspace.
2. Ensure `com.eDATA.app` is the Bundle Identifier.
3. Configure the `AppDelegate.swift` or Capacitor iOS runner to delegate `openURL` and `continueUserActivity` to the Capacitor Bridge.
4. Tapping `https://edata.com.ng/join?ref=...` on iOS Safari will seamlessly launch the eData iOS application.
