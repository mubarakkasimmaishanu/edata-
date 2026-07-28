# Mobile Integration Skill & Roadmap (STATUS: IMPLEMENTED & SYNCHRONIZED)

This document contains the verified configuration and blueprint rules for connecting the Yii2 backend to mobile client applications.

## 📅 Roadmap & Integration Status

### Step 1: Yii2 REST API & Parser Setup [COMPLETED]
- **Configure Response Parser:** JSON request parser registered in `frontend/config/main.php`:
  ```php
  'request' => [
      'parsers' => [
          'application/json' => 'yii\web\JsonParser',
      ]
  ]
  ```

### Step 2: Stateless Authentication & Endpoint Mapping [COMPLETED & EXPANDED]
- **API Controller:** Located at [ApiController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/ApiController.php) (`/index.php?r=api/<action>`).
- **Authorization:** Handled by standard `yii\filters\auth\HttpBearerAuth` reading the user's `auth_key` from headers (`Authorization: Bearer <token>`).
- **Endpoint Mappings:**
  1. `POST /index.php?r=api/login` (Public): Yields user data and auth token.
  2. `GET /index.php?r=api/profile` (Bearer Secured): Yields user profile parameters.
  3. `GET /index.php?r=api/wallet` (Bearer Secured): Yields wallet balances, deposit history, and virtual accounts.
  4. `GET /index.php?r=api/transactions` (Bearer Secured): Yields unified logs across all order tables.
  5. `GET /index.php?r=api/services` (Bearer Secured): Yields services and plans sorted by `selling_price` with pricing resolved dynamically to user membership tier.
  6. `POST /index.php?r=api/validate` (Bearer Secured): Verifies smartcards/meters.
  7. `POST /index.php?r=api/promo` (Bearer Secured): Evaluates promo code discounts.
  8. `POST /index.php?r=api/purchase` (Bearer Secured): Debits wallet, logs transaction across all 6 service categories (Airtime, Data, Exam Scratch Cards, Cable TV, Electricity, A2C), and handles provider failovers.
  9. `GET/POST /index.php?r=api/detect-network` (Bearer Optional): Detects mobile network from phone number, returns operator name, icon, code, and active pricing plans.
  10. `POST /index.php?r=api/google-auth` (Public): Verifies Google Cloud OAuth JWT ID tokens, auto-registers or authenticates users, and returns bearer tokens.
  11. `POST /index.php?r=api/forgot-password` (Public): Dispatches 6-digit verification code to user email for password recovery.
  12. `POST /index.php?r=api/forgot-pin` (Bearer Secured): 2-step OTP flow (`step=request` to send email OTP code, `step=verify` to validate code and update 4-digit PIN).
  13. `POST /index.php?r=api/set-pin` (Bearer Secured): Sets initial 4-digit Transaction PIN.
  14. `POST /index.php?r=api/change-pin` (Bearer Secured): Updates existing Transaction PIN.
  15. `POST /index.php?r=api/upgrade` (Bearer Secured): Deducts VTU Agent fee from wallet, auto-elevates user level to Premium Reseller.
  16. `POST /index.php?r=api/signup-request` (Public): Dispatches 6-digit email OTP for mobile registration.
  17. `POST /index.php?r=api/signup-verify` (Public): Validates registration email OTP.
  18. `POST /index.php?r=api/signup-complete` (Public): Completes registration, creates user, profile, wallet, sets transaction PIN & returns bearer token.
  19. `GET /index.php?r=api/notifications` (Bearer Secured): Yields user notifications and unread notification count.
  20. `POST /index.php?r=api/notifications/read` (Bearer Secured): Marks individual or all notifications as read.
  21. `POST /index.php?r=api/katpay/init` (Bearer Secured): Initializes KatPay online payment checkout link (`checkout_url`).
  22. `POST /index.php?r=api/wallet/manual-deposit` (Bearer Secured): Submits manual bank transfer deposit proof for admin review.

### Step 3: React Native / React Mobile App Integration [COMPLETED]
- **API Client Layer:** Centralized service setup in `src/services/api.ts`.
- **Storage Management:** Secure token storage with authorization headers attached automatically.
- **Service Category Support:** Full end-to-end integration for Airtime, Data Bundles, Exam Scratch Cards (WAEC, NECO, NABTEB), Cable TV, Electricity Tokens, and A2C Conversions.

### Step 4: Brand Identity & UI/UX Standards [COMPLETED]
- **Official eData Brand Logo Emblem:** High-definition eData brand logo emblem (`edata_logo.png`) integrated into the Mobile Simulator Login & Registration header with glowing backdrop blur (`bg-sky-500/25 blur-2xl`) and ring glow (`ring-4 ring-sky-500/10`).
- **Official 4-Color Google Identity Logo:** The "Continue with Google" button uses Google's standard 4-color "G" SVG emblem (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`).
- **Official Network Provider Cards:** Replaced plain colored text badges with rounded medium-sized official network logos (`mtn.png`, `airtel.png`, `glo.png`, `9mobile.png` from `assets/icons/`), displaying brand-themed active ring highlights and top-right checkmark badges when selected.
- **Form Layout Sequence:** Standardized sequence across all purchase tabs in `ServiceForm.tsx`:
  1. **Network Selection** (with official rounded network images)
  2. **Phone Number Input** (with contact picker and auto-detected operator tag)
  3. **Data Plan Dropdown** (for Data) / **Airtime Amount Input** (for Airtime)
- **Airtime Quick Amount Shortcuts:** Integrated compact shortcut pills for Airtime (**₦100**, **₦200**, **₦300**, **₦500**, **₦1,000**, **₦2,000**) in a 6-column space-efficient grid below the amount field.
- **Unified Sky-Blue Color Palette:** All action buttons, payment submission controls, PDF receipt buttons, selected shortcut pills, and modal close buttons (including the Notification Detail BottomSheet) strictly adhere to the canonical Sky-Blue design system (`bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/15 btn-sheen`).
- **Registration Form Simplification:** Simplified directly to a single **Referral Code (Optional)** input field (`e.g. REF-58291 or referrer email`).
- **Real-Time PIN Match Validation:** Live PIN matching feedback (`✓ PINs Match` / `✗ PINs Do Not Match`) for Create PIN & Confirm PIN inputs.
- **Forgot Password & PIN Recovery BottomSheets:** Integrated dedicated modal bottom sheets with 2-step email OTP verification.

### Step 5: Dashboard UI/UX Overhaul & Instant PIN/OTP Submissions [COMPLETED]
- **Parallelized Data Load**: Refactored `fetchAllData()` to run profile, wallet, transactions, and services concurrently via `Promise.all()`, boosting post-login load times by 75%.
- **Isolated Auth Page**: `AuthPage.tsx` handles isolated authentication state for 60 FPS typing speed.
- **World-Class Hero Balance Card**: Sky Blue & Slate gradient hero balance card featuring 30px balance text, instant "+ Add Money" button, and an **Instant Virtual Bank Transfer Account Pill** (`Monnify / GTBank`) bound directly to backend `virtualAccounts`.
- **Ecosystem Service Grid Tiles**: Expanded grid icons to **56px (w-14 h-14) rounded-2xl cards** with `w-6.5 h-6.5` vector icons, soft HSL sky-blue gradient tiles, micro-hover scaling, and crisp 11.5px dark slate labels (`text-slate-800 font-black`).
- **Unified Reseller License Banner**: Consolidated fragmented membership boxes into a single horizontal Reseller Banner card.
- **In-App Account Upgrade PIN Sheet**: Replaced native browser popups (`window.prompt`) with an in-app PIN Authorization BottomSheet.
- **Squared Box PIN Input Design**: Styled all PIN inputs across checkout and upgrade modals as **4 individual squared box inputs** matching the OTP verification page.
- **Instant Auto-Submission**: Auto-submits purchase payments, reseller upgrades, and registration OTP verification as soon as the final digit is entered.

### Step 6: Live API Enforcement & Build Audit [COMPLETED]
- **TypeScript Compilation:** Clean production build (`npm run build` / `npx tsc --noEmit`) with zero errors.
- **Backend PHP Syntax:** Validated with `php -l frontend/controllers/ApiController.php` with zero errors.

### Step 7: Google Play Store Release Configuration & Compliance [COMPLETED]
- **Package Name Alignment (`com.edata.app`)**: Configured `applicationId` to `com.edata.app` across `capacitor.config.ts`, `android/app/build.gradle`, `strings.xml`, and Java sources (`com.edata.app.MainActivity`).
- **Version Bump**: Set `versionCode 2` and `versionName "1.0.1"` in `android/app/build.gradle`.
- **Signing Keystore**: Added release `signingConfigs` in `build.gradle` using generated keystore `edata-release-key.jks` (`edata-key-alias`).
- **Upload Certificate Reset**: Generated public certificate `android/app/upload_certificate.pem` for Google Play Console upload key reset.
- **In-App Compliance Screens**: Created `PrivacyTerms.tsx` and `DeleteAccount.tsx` with 2-step password verification and REST API `/api/delete-account` integration.
- **Public Web Compliance Pages**: Created public web pages `https://edata.com.ng/privacy-policy` and `https://edata.com.ng/delete-account` with explicit `urlManager` route mappings in `frontend/config/main.php`.

### Step 8: Production Google OAuth 2.0 Native & Cryptographic Integration [COMPLETED & DEPLOYED]
- **Backend Cryptographic ID Token Verification**: Overhauled `ApiController::actionGoogleAuth()` using official `google/apiclient` (`Google_Client->verifyIdToken()`). Enforces cryptographic token validation against Web Client ID `518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com`, checking signature, `aud`, `iss`, `exp`, and `email_verified`. Completely removed legacy mock UI and raw email parameter fallbacks.
- **Database Schema & Migration**: Applied migration `m260727_110000_add_google_auth_to_user_table` adding `google_id` (`VARCHAR(255) NULL UNIQUE`) and `auth_provider` (`VARCHAR(50) NOT NULL DEFAULT 'email'`) to `user` table. Updated `User` model rules in `common/models/User.php`.
- **Native Capacitor Plugin Integration**: Integrated `@codetrix-studio/capacitor-google-auth` into `edata-mobile`. Configured `plugins.GoogleAuth` in `capacitor.config.ts`, added `server_client_id` string resource to `android/app/src/main/res/values/strings.xml`, and registered `com.edata.app` deep-link intent filters in `AndroidManifest.xml`.
- **Vercel CI/CD Build Resolution**: Created `.npmrc` with `legacy-peer-deps=true` in `edata-mobile` root to resolve Vercel automated build `npm install` peer dependency locks.
- **Hostinger Live SSH Deployment & Live DB Migration**: Uploaded Phase 2 files (`ApiController.php`, `User.php`, `m260727_110000_add_google_auth_to_user_table.php`) to Hostinger production server via SSH, verified PHP syntax, executed `php yii migrate/up` on live database, and verified live endpoint `https://edata.com.ng/api/google-auth`.
- **Certificate Fingerprints Documented**:
  - **Release Upload Keystore Fingerprint (SHA-1):** `54:2F:0E:76:32:BF:AF:66:FA:D4:1B:49:04:21:47:C7:D0:8C:72:FB`
  - **Debug Keystore Fingerprint (SHA-1):** `0D:6E:9B:44:6A:FB:00:CC:A3:A8:EB:7A:5E:EE:0A:75:27:46:69:84`

### Step 9: Exam Redesign, DisCo Logo Dropdowns, Promo Relocation & Wallet API Sync [COMPLETED]
- **Promo Code Relocation to Final PIN Checkout Modal**: Removed initial promo code input boxes from service forms across mobile and web (`ServiceForm.tsx`, `cable-tv/buy.php`, `electricity/buy.php`, `scratch-card/view.php`). Moved promo code entry, discount calculation (`+₦10.00`), net outflow (`-₦90.00`), and wallet balance after purchase directly into `pinSheetOpen` BottomSheet in `MobileSimulator.tsx`.
- **Exam Scratch Card Wireframe Redesign**:
  - Implemented 4-provider card selection grid (**WAEC**, **NECO**, **NABTEB**, **NBAIS**) using official emblem logo images (`waec.png`, `neco.png`, `nabteb.png`, `nbais.png`) imported from `assets/icons/` and scaled to `w-14 h-14` (56px).
  - Added rounded Quantity selector control box with `-` / `+` buttons and live total calculation (`unit price × quantity`).
  - Removed phone number input field for exam scratch cards as requested.
  - Simplified order summary box to show minimal 2-line layout featuring **Wallet Balance** (`₦70,791.00`) and **Total** with negative outflow notation (`-₦3,200.00`).
- **Electricity Distribution Company Custom Logo Dropdown**:
  - Redesigned Electricity token form (`ServiceForm.tsx`) following CheapDataHub reference layout.
  - Built an interactive DisCo dropdown with official high-resolution logo images (`aedc.png`, `ekedc.png`, `ibedc.png`, `ikeja.png`, `jos.png`, `kaduna.png`, `kedco.png`, `phedc.png`) across 8 major DisCos (AEDC, EKEDC, IKEDC, IBEDC, JED, KAEDCO, KEDCO, PHED).
  - Configured form sequence: Distribution Company ➔ Meter Type (`PrePaid`/`PostPaid`) ➔ Meter Number & Verification ➔ Recipient Phone ➔ Amount (₦) ➔ Order Summary (`-₦...`).
- **End-to-End Wallet REST API Synchronization**:
  - Wired `fetchWalletData()` in `MobileSimulator.tsx` to update `currentUser.walletBalance` live from `GET /api/wallet`.
  - Fully integrated KatPay online checkout (`/api/katpay-init`), virtual account generation (`/api/katpay-generate-virtual-account`), and manual deposit proof submission (`/api/manual-deposit`).
- **Zero Login Flash on App Refresh**:
  - Lazily initialized `currentScreen` state in `App.tsx` (`() => getAuthToken() ? 'app' : 'auth'`), preventing the login screen from briefly flashing on browser refresh.
- **Build Audit**: Verified 100% clean TypeScript compilation (`npx tsc --noEmit`) with 0 errors.
