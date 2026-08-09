# Architect Skill (eData Project Guidelines)

Used for planning, designing, and structuring code, API endpoints, database schemas, and application logic.

## When to Trigger
- Adding new models, database tables, or migrations.
- Designing new module boundaries, folder structures, or classes.
- Outlining API request/response formats.
- Major refactoring of existing components.

## Guidelines
1. **Analyze Requirements:** Understand the goals, constraints, and business domain first.
2. **eData Core Service Types:** 
   - Ensure Category IDs match exactly: `1` (Airtime Top-ups), `2` (Data Bundles), `3` (Exam Scratch Cards), `4` (Cable TV), `5` (Electricity), and `6` (A2C).
   - Queries retrieving services should order by `category_id ASC, id ASC` to maintain designated layout sequence.
   - All 6 categories are supported in both Web views and REST API endpoints (`ApiController::actionPurchase`).
3. **Multi-Provider Failover Structure:**
   - Automated vending for all service categories (Airtime, Data, Scratch Cards, Cable TV, Electricity, and A2C) supports dynamic provider failover.
   - Keep credentials, base URLs, endpoints, and priority orders stored dynamically in the `service_api_config` table, linked by `service_code` (`'airtime'`, `'data'`, `'scratch_card'`, `'cable_tv'`, `'electricity'`, `'a2c'`).
4. **Multi-Tier Membership & Pricing Tiers:**
   - Account Levels: Basic User (`0`), Referred User (`1`), Premium User (`2`).
   - Dynamic Pricing: Use `getEffectivePrice($userId)` inside `ServiceType` and `DataPlan` models.
   - Reseller Upgrades: Users pay the `premium_upgrade_fee` from wallet. API checkouts (`actionUpgrade`) auto-elevate user level instantly upon valid PIN entry.
5. **Authentication & Security System**:
   - Google Sign-In: Uses Google Identity Services. Server-side `SiteController::actionGoogleAuth()` and `ApiController::actionGoogleAuth()` verify Google JWT ID tokens, extract email, and auto-activate accounts.
   - The "Continue with Google" mobile button renders Google's official 4-color "G" SVG emblem (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`).
   - Registration Form: Uses Email, Password, and a single **Referral Code (Optional)** field.
   - Password Recovery: `actionForgotPassword` accepts email, generates a 6-digit OTP code (`verification_token`), and dispatches email instructions.
6. **Transaction PIN System**:
   - PIN Hashing: The `transaction_pin` field on the `user` table stores the bcrypt hash of the user's 4-digit PIN. Validate via `$user->validateTransactionPin($pin)`.
   - Purchase Validation: All financial POST checkouts must validate that a PIN is set and correct.
   - Forgot PIN Recovery: `actionForgotPin` provides a 2-step OTP verification flow (`step=request` to send 6-digit email code, `step=verify` to validate code and reset PIN).
   - Real-Time Validation: UI forms display real-time PIN matching feedback (`✓ PINs Match` / `✗ PINs Do Not Match`).
7. **Official eData Brand Assets & Mobile Form Architecture**:
   - Official brand logo emblem asset is maintained in `edata_logo.png` (`src/assets/edata_logo.png`), presented with a glowing backdrop blur and ring border styling.
   - Mobile Network Selection uses official rounded network icons from `assets/icons/` (`mtn.png`, `airtel.png`, `glo.png`, `9mobile.png`).
   - Standardized Form Sequence: 1. Network Selection -> 2. Destination/Phone Input -> 3. Package Dropdown / Airtime Amount Input.
   - Airtime Page includes compact 6-column quick amount shortcuts (**₦100**, **₦200**, **₦300**, **₦500**, **₦1,000**, **₦2,000**).
8. **Deployment Architecture (Hostinger Production):**
   - Public web root: `/home/dev/web/edata.com.ng/public_html`.
   - Root `.htaccess` routes `^office` to `backend/web` and all other requests to `frontend/web`.
9. **Web Dashboard Service Category Architecture**:
   - Web Dashboard (`frontend/views/dashboard/index.php`) presents 6 clean main category tiles (**Airtime**, **Data**, **TV Cables**, **Electricity**, **Exam Pins**, **A2C**).
   - Tapping any tile navigates to its dedicated subcategory landing page (`airtime-data/airtime`, `airtime-data/data`, `cable-tv/index`, `electricity/index`, `scratch-card/index`, `a2c/index`) showing all subcategory providers and purchase options without cluttering the main dashboard.
10. **Google Play Store Publishing & Package Architecture**:
    - App ID: `com.edata.app` (must match Google Play Console URL `https://play.google.com/store/apps/details?id=com.eDATA.app`).
    - Versioning: `versionCode` must increment on every release (currently `versionCode 2`, `versionName "1.0.1"`).
    - App Signing: Release builds use `signingConfigs` in `build.gradle` pointing to `edata-release-key.jks`. Upload key reset uses `upload_certificate.pem`.
    - Android Manifest Security: `android:allowBackup="false"`.
11. **Public & In-App Compliance Architecture**:
    - In-App: `PrivacyTerms.tsx` and `DeleteAccount.tsx` components inside `src/components/`.
    - REST API: `POST api/delete-account` endpoint in `ApiController.php` deactivating user (`status = User::STATUS_BLOCKED`) and revoking keys.
    - Public Web URLs: `https://edata.com.ng/privacy-policy` and `https://edata.com.ng/delete-account` mapped in `frontend/config/main.php` `urlManager.rules`.
12. **Phone Network Auto-Detection Component (`PhoneNetworkDetector`)**:
    - Centralized component (`common/components/PhoneNetworkDetector.php`) parsing Nigerian telecom prefixes (`0803`, `0802`, `0805`, `0809`, etc.) and stripping international codes (`+234`/`234`).
    - Leveraged in REST API (`actionPurchase`, `actionDetectNetwork`) to resolve network operators automatically.
13. **NaijaResultPins Exam Card Vending Component**:
    - Default provider integration for exam scratch cards (WAEC, NECO, NBAIS, NABTEB) encapsulated inside `VendingService.php`.
14. **Plan Type Management & Tier Discount Auto-Pricing Architecture**:
    - Model `PlanType` (`common/models/PlanType.php`) and CRUD controller `PlanTypeController.php`.
    - Percentage discount tier auto-pricing in `DataPlan` form, deriving user tier rates dynamically while allowing optional `bundle_id`.
15. **Location & Telecom Detection Component (`GeoHelper` + MaxMind GeoIP2)**:
    - Zero-permission IP location and carrier resolution via `GeoHelper` (`common/components/GeoHelper.php`).
