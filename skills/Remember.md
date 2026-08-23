  - Unified all close buttons, primary action buttons, payment submission controls, PDF receipt buttons, and selected quick amount shortcut pills across `MobileSimulator.tsx`, `ServiceForm.tsx`, and `BottomSheet.tsx` to the canonical **Sky-Blue** design system (`bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/15 btn-sheen`).

- **IPv6 Address Stripping & Database Column Expansion Fix**:
  - Resolved live `SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column 'ip_address'` crash on login, signup, and Google OAuth endpoints. The crash was caused by `preg_replace('#[^0-9.]#', '', getenv('REMOTE_ADDR'))` stripping colons (`:`) from IPv6 addresses, creating 19+ character numeric strings that exceeded `VARCHAR(15)` column limits.
  - Added static helper method `User::getClientIp()` in `common/models/User.php` to safely resolve IPv4 and IPv6 addresses up to 45 characters using `Yii::$app->request->userIP` with fallback to `REMOTE_ADDR`.
  - Replaced legacy `preg_replace` calls across `SiteController.php`, `SignupForm.php`, `AdminSignupForm.php`, and `ApiController.php`.
  - Created and applied migration `m260731_090000_alter_user_ip_address_column.php` altering `user.ip_address` to `VARCHAR(45) NULL`.

- **Notification Image URL Resolution Fix (Backend API + Mobile App)**:
  - Updated `ApiController::actionNotifications` to dynamically format relative uploaded notification image paths (`/uploads/notifications/...`) into full absolute HTTP/HTTPS URLs (`$hostInfo . $baseUrl . $imagePath`).
  - Added `resolveImageUrl` helper in `src/services/api.ts` on the mobile client to safely construct absolute URLs for relative paths based on `API_BASE_URL`.
  - Added `onError` fallback handlers on notification `<img />` tags in `MobileSimulator.tsx` to gracefully hide broken images if a resource fails to load.

- **Airtime & Data Mobile UI/UX Refinement (`edata-mobile`)**:
  - Replaced colored text network cards with official network images from `assets/icons/` (`mtn.png`, `airtel.png`, `glo.png`, `9mobile.png`).
  - Rendered network logos in rounded medium-sized containers (`w-10 h-10` with `rounded-full` image) inside rounded-2xl cards with brand-themed active ring highlights and top-right checkmark badges.
  - Reordered purchase form sequence in `ServiceForm.tsx` to:
    1. **Network Selection** (with official rounded network images)
    2. **Phone Number Input** (with contact picker and auto-detected operator tag)
    3. **Data Plan Dropdown** (for Data) / **Airtime Amount Input** (for Airtime)
  - Added compact **Quick Amount Shortcuts** for Airtime: **₦100**, **₦200**, **₦300**, **₦500**, **₦1,000**, **₦2,000** in a space-efficient 6-column grid (`grid-cols-6`) right below the amount input. Tapping populates amount automatically while custom typing remains supported.
  - Retained all existing prefix auto-detect network logic (`0803`, `0802`, `0805`, `0809`, etc.) and purchase/API integrations.

- **KatPay Deposit History Database Migration**:
  - Created and applied migration `m260721_140000_make_deposit_history_columns_nullable.php` to make KatPay deposit history fields (`reference`, `channel`, `fee`, `gateway_response`, `ip_address`, `narration`, `created_at`, `updated_at`, `status`) nullable, resolving SQL integrity constraint issues during online deposit initialization.

- **Mobile Fund Wallet Redesign & REST API Synchronization**:
  - Removed mock/inconsistent static gateways (Paystack, Flutterwave, Monnify placeholders) from the mobile app.
  - Implemented modern 3-Tab Fund Wallet BottomSheet layout in `MobileSimulator.tsx`:
    1. **⚡ Auto Bank (Automated Virtual Accounts)**: Displays user's assigned virtual bank cards with 1-tap copy account number buttons and instant auto-credit details.
    2. **💳 KatPay Online (Instant Link)**: Amount presets (₦1,000, ₦2,000, ₦5,000, ₦10,000) or custom input -> calls `/api/katpay/init` -> opens KatPay checkout link.
    3. **🏛️ Manual Bank (Live Synced)**: Displays official bank account settings (`bank_name`, `account_number`, `account_name`) synced directly from web backend settings (`Setting` model) with copy buttons and payment proof submission form.
  - Extended `/api/wallet` (`actionWallet`) in `ApiController.php` to return `manual_bank` settings, `virtual_accounts`, and `katpay_enabled` status.
  - Added `/api/katpay/init` (`actionKatpayInit`) REST endpoint to initialize KatPay payment checkout links.
  - Added `/api/wallet/manual-deposit` (`actionManualDeposit`) REST endpoint to process manual payment proofs for admin review.
  - Added `initKatpay` and `submitManualDeposit` to `api.ts` service client and added `VirtualAccount` and `ManualBank` to `types.ts`.
  - Unified all service icons, catalog badges, section headers, and action buttons across the mobile app to the brand **Skyblue** design system (`text-sky-600 bg-sky-50`, `bg-sky-600`, `border-sky-100`).

- **Forgot Password & Forgot PIN System Audit**:
  - Fixed PHP null-pointer exception in `PasswordResetRequestForm.php`.
  - Added `actionResetPassword()` REST API endpoint to `ApiController.php` supporting 6-digit email OTP codes.
  - Upgraded mobile client `MobileSimulator.tsx` Forgot Password modal to a full 2-step OTP verification and password reset flow.

- **Notification Management Module (Backend + REST API + Mobile)**:
  - Executed database migrations `m260721_130000_create_notification_tables.php` on live DB.
  - Added `Notification.php` & `UserNotificationRead.php` ActiveRecord models.
  - Added Admin Notification Management controller `NotificationController.php` & views (`index.php`, `create.php`) into admin sidebar.
  - Added REST API actions `actionNotifications` (`GET /api/notifications`) and `actionMarkNotificationRead` (`POST /api/notifications/read`) to `ApiController.php`.
  - Updated Mobile App top bell icon to re-route to dedicated Notifications view with unread badge overlay and detail BottomSheet modal.

- **Live Production SSH Deployment**:
  - Deployed `ApiController.php` live to production server (`92.112.192.11`) at `/home/dev/web/edata.com.ng/public_html/frontend/controllers/ApiController.php`. Verified 0 PHP syntax errors on live server.
  - Synced all 8 skills documentation files (`Architect.md`, `Debug.md`, `Documentation.md`, `MobileIntegration.md`, `Remember.md`, `Review.md`, `Security.md`, `Testing.md`) to live production server.

### 2026-07-20
- **Mobile 3-Step Registration API (End-to-End with Web):**
  - Added `actionSignupRequest`, `actionSignupVerify`, `actionSignupComplete` in `ApiController.php` — mirrors the web's 3-step flow (`SiteController::actionSignup` → `actionSignupVerify` → `actionSignupPassword`).
  - Step 1 sends a 6-digit OTP to the user's email. On localhost, the OTP is returned in the API response so local dev never blocks.
  - Step 2 validates the OTP code against a 20-minute cached token.
  - Step 3 creates the user account (password, optional PIN, optional referral code), assigns `user` RBAC role, creates Profile + Wallet, sends Welcome email, and returns a bearer token for immediate auto-login.
  - All three endpoints added to `optional` auth behaviors (public/unauthenticated).
  - Added `signupRequest()`, `signupVerify()`, `signupComplete()` methods in `src/services/api.ts`.
  - Updated `MobileSimulator.tsx` handlers (`handleRegisterSubmit`, `handleVerifyOTP`, `handleRegisterPasswordSubmit`) to call live API when connected, with sandbox fallback for offline dev.
  - Updated OTP screen from 4-digit to 6-digit inputs matching web. Wired "Resend Code" button to call `signupRequest` again.
  - On successful registration, mobile auto-logs in the user (no redirect to login screen).

- **Category 3 Exam Scratch Card API Vending:**
  - Added `ExamScratchCard` order creation in `actionPurchase` when `category_id == 3`.
  - Added `3 => 'scratch_card'` to the dynamic provider failover vending loop.
  - On successful vending, updates `ExamScratchCard` with the generated PIN and processed timestamp.

- **Official eData Brand Logo & Google Identity Emblem:**
  - Integrated high-resolution eData brand logo emblem (`edata_logo.png` in `src/assets/`) on the Login/Registration screen header with glowing backdrop blur.
  - Updated "Continue with Google" button to render official 4-color Google "G" SVG emblem (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`).
  - Simplified registration form: removed "How did you find us?" dropdown, replaced with single **Referral Code (Optional)** input.

- **Password & PIN Recovery (Web + Mobile):**
  - Implemented `actionForgotPassword` (public) and `actionForgotPin` (authenticated, 2-step OTP) in `ApiController.php`.
  - Added mobile API methods and interactive bottom sheet modals for Forgot Password and Forgot PIN recovery with real-time PIN matching validation.

- **Skills Documentation Updated:**
  - Updated `MobileIntegration.md` with all new REST API endpoints (15 total), brand identity specs, and simplified registration form.
  - Updated `Architect.md` with 6-category API routing architecture, PIN/Password recovery, and brand asset rules.
  - Updated `Security.md` with OTP token security, anti-enumeration, and bcrypt PIN hashing rules.
  - Updated `Documentation.md` with REST API endpoint specs and brand asset guidelines.

- **Production Audit & 100% Live REST API Enforcement:**
  - Audited backend `ApiController.php` and removed mock vending success fallback (`$vendingSuccess = true`) and mock customer validation fallback (`Verified Customer (Mock Verification)`). Failed vending transactions now execute an automatic wallet refund, and failed validation requests return real error messages.
  - Audited mobile client components (`MobileSimulator.tsx`, `App.tsx`, `api.ts`), eliminating "Running in Sandbox Mode" notice banners, mock login tokens (`'mock-sandbox-token'`, `'google-sandbox-token'`), and local sandbox storage mutations.
  - Connected every user action (Login, Google Auth, Service Purchases, Meter/Smartcard Validation, Reseller Tier Upgrade, Transaction PIN Management) strictly end-to-end to live backend REST API endpoints.
  - Resolved `401 Unauthorized` initial profile fetch errors: Updated `handleLoginSubmit` and `handleLoginSuccess` in `App.tsx` and `MobileSimulator.tsx` to automatically call `setAuthToken(token)` before invoking `fetchAllData()`.
  - Updated `App.tsx` unauthenticated error handling to gracefully reset `edata_token` and switch to the auth screen when receiving 401 statuses without spamming red DevTools console errors.
  - Created `src/vite-env.d.ts` in `edata-mobile` for TypeScript module declarations (`*.png`, `*.jpg`, `*.svg`). Verified clean build (`npx tsc --noEmit`) with 0 errors.
  - Executed git commit & push for both repositories and deployed live to Hostinger production server (`92.112.192.11`) via SSH deploy trigger `/home/dev/web/edata.com.ng/deploy.sh`.

- **Google Cloud Auth Integration & Client Sync:**
  - Extracted Google Cloud Console Project Info details (`Project name: api-auth`, `Project number: 518586633606`, `Project ID: api-auth-325212`) from user-provided Google Cloud Console dashboard screenshot.
  - Updated `googleClientId` parameter in `common/config/params.php` derived from Project Number `518586633606`.
  - Added REST endpoint `actionGoogleAuth()` in `ApiController.php` to verify Google ID tokens / user payloads, auto-register or authenticate users, assign roles, create profiles and wallets, and issue bearer tokens.
  - Added `googleAuth()` API client method in `src/services/api.ts` for mobile integration.
  - Updated "Continue with Google" action handler in `MobileSimulator.tsx` to call live backend Google authentication when connected, with seamless fallback to local sandbox mode.

  - Standardized styling variables inside `index.css` supporting mesh backdrop gradients, premium glass cards, and native spring-transition animations.
  - Substituted all browser `alert()` and `confirm()` dialog patterns with custom React `Toast` systems and confirmation modal panels.
  - Unified 5 separate carrier checkout pages into a single dynamic config-driven `ServiceForm` validator to optimize modularity and eliminate code duplication.
  - Implemented animated drag-handle overlays using custom-styled bottom sheets (`BottomSheet.tsx`) to standardise receipts, PIN dialogs, and pricing summaries.
- **Backend Upgrades Dynamic Alignment & Instant Activation:**
  - Modified yii2 backend `ApiController::actionLogin` and `actionProfile` to dynamically fetch and return the `premium_upgrade_fee` database setting parameters.
  - Updated frontend `App.tsx` and `MobileSimulator.tsx` to read the user's dynamic upgrade fee.
  - Refactored `ApiController::actionUpgrade` to immediately execute wallet balance deductions and elevate account privilege flags (`User::LEVEL_PREMIUM`), creating auto-approved request states so that reseller rates activate instantly across the entire application viewport.
  - Synchronized client-side sandbox actions to support dynamic upgrade fee checkouts, local wallet debit simulation, and immediate premium privilege activation.

### 2026-07-18
- **Responsive Web-App Shell & Container Refactor (Mobile App):**
  - Removed the fixed mobile phone shell wrapper (bezel, notch/island, status bar, and home indicator line) from `MobileSimulator.tsx` and `App.tsx` in the `edata-mobile` repository.
  - Expanded the web app wrapper to stretch full-screen (`w-full min-h-screen`) natively across desktop browsers and mobile screens, removing all box shadow wrappers, roundings, and outer simulator lines.
  - Integrated centered max-width alignment columns (`max-w-md mx-auto w-full`) in headers, inside views, and bottom navigation bars to keep interactive components clean and readable on large browser displays.
  - Converted the home dashboard from a dark theme (`bg-[#111111]`) to a light branded style (`bg-slate-50` body, `bg-white` card elements and header, `text-slate-800` labels) with primary sky-blue accents to unify it with the other application views.
  - This optimizes the UI layout to automatically scale and display elegantly on all device screen sizes (mobile viewports and desktop browsers) as a clean progressive web app.
  - Verified compilation and build health via `npm run lint` (`tsc --noEmit`).
- **Complete AI Removal & Support Tab Overhaul (Mobile Simulator):**
  - Permanently removed the AI Chat Copilot view and the "eData AI Safety Shield" component from all payment and vending views (Airtime, Data, Cable, Electricity, Exam).
  - Redesigned the bottom navigation tabs to have exactly four items:
    1. **Home** (`Smartphone` icon)
    2. **Services** (`Layers` icon)
    3. **Support** (`Headphones` icon) - Opens the brand new Customer Support Desk panel containing instant WhatsApp redirection, phone call support, support ticket submissions, and transaction disputes links.
    4. **Profile** (`User` icon)
  - Mapped the headphone support desk shortcut icon in the top header bar to redirect to the new Customer Support view instead of opening the AI chat helper.
  - Removed the simulated mock phone bezel wrapper shell (`border-[12px] border-zinc-800`), the top status bar (battery indicators, clock, 5G reception, screen recording pills), the simulated notch, and the bottom home indicator line, rendering a clean, stand-alone responsive web app viewport matching modern standard web views natively.
  - Excluded the serverless `api` directory from `tsconfig.json` so client compiler tasks compile cleanly.
  - Successfully verified code stability and executed `git push` to upload all Vercel integrations and AI removal modules to production repositories.
- **Unified Sky-Blue Color Palette Enforcement (Mobile App):**
  - Executed a comprehensive color audit and conversion across all 4,074 lines of `MobileSimulator.tsx`, converting every non-sky-blue brand accent to the unified sky-blue palette.
  - Converted: `text-emerald-*` → `text-sky-*` (verified badge, wallet live dot, promo applied labels, discount displays, AI copilot badge, customer name labels, A2C payout amounts, history funding amounts, exam stats cards, success receipt circles, 2FA enabled badge), `text-amber-*`/`bg-amber-*` → `text-sky-*`/`bg-sky-*` (coins icon, offline notice, promotional banner gradient, dispute status card, upgrade flame icon, Yii2 registration text, waste bill service), `text-cyan-*` → `text-sky-*` (Data, Exam Card grid icons), `text-purple-*` → `text-sky-*` (Refer & Earn grid icon), `text-indigo-*` → `text-sky-*` (More grid icon), `bg-[#f97316]` → `bg-sky-500` (quick transfer fee badge).
  - Promotional referral banner redesigned from gold/amber gradient (`from-amber-400 via-yellow-400 to-yellow-500`) to sky-blue gradient (`from-sky-400 via-sky-500 to-sky-600`) with white text.
  - Full-page Services Catalog: all 6 core payment tiles + 2 fintech tiles + 4 coming-soon tiles converted to `text-sky-600 bg-sky-50`.
  - Only semantic status colors remain: `rose-*` for errors/failures. All risk score badges also converted to `sky-*`.
  - Verified: `npm run lint` (tsc --noEmit) and `npm run build` both pass cleanly with zero errors.
- **Dashboard Compact Layout (Phone Viewport Optimization):**
  - Reduced outer tab container padding (`p-4` → `p-3`) and section gap (`space-y-5` → `space-y-3`).
  - Reduced home dashboard inner gap (`space-y-3.5` → `space-y-2`).
  - Compacted wallet card: padding `p-4.5` → `p-3`, balance font `text-2xl` → `text-xl`, margin `mt-2.5` → `mt-1.5`, Add Money button `py-1.5` → `py-1`.
  - Compacted earnings strip: padding `px-4 py-2.5` → `px-3 py-1.5`, icon sizes reduced.
  - Compacted quick transfer buttons: container `p-3.5` → `p-2.5`, button circles `w-11 h-11` → `w-9 h-9`.
  - Compacted recent transaction row: padding `p-3` → `p-2.5`, font sizes reduced.
  - Compacted services grid: container `p-4.5` → `p-3`, row gap `gap-y-4.5` → `gap-y-3`, icons `w-9 h-9` → `w-8 h-8`, labels `text-[8px]` → `text-[7px]`.
  - Compacted referral banner: reward circle `w-10 h-10` → `w-8 h-8`, padding `p-3.5` → `p-2.5`.
  - Removed banner dot indicators (3 dots row) and "View Pricing Rates >" link — saved ~40px vertical.
  - Compacted membership cards: height `h-[120px]` → `h-[100px]`, padding `p-3.5` → `p-2.5`, button sizes reduced.
  - Compacted promo banner: removed fixed `h-[76px]`, padding `p-3.5` → `p-2.5`, text/coin sizes reduced.
  - Estimated ~200px+ total vertical height savings. Dashboard fits within phone viewport with minimal scrolling.
  - Committed and pushed to GitHub (`e75dc2f`).
- **Yii2 API Backend & Mobile Simulator Alignment & Sandbox Integration:**
  - Fixed static validation exception crash in `ApiController::actionPromo()` and `actionPurchase()` by routing code logic through static helper `PromoCode::validateCode()` instead of non-existent instance methods.
  - Added full Category 3 (Exam Scratch Card) child order creation inside `actionPurchase()` and wired it into the dynamic API vending failover loop using the correct vendor provider ID mapping table.
  - Added `status` and `phone_or_meter` to `/api/services` and `/api/transactions` REST endpoints.
  - Restructured `App.tsx` and `MobileSimulator.tsx` client integration: resolved transaction type naming alignments (`Exam Card` -> `Exam Token`, `Cable TV` -> `Cable TV`), corrected data plan promo code parameter checks to send raw numeric service ID, and added database persistence syncing to `localStorage` under Sandbox mode.
  - Added custom visual biometrics security switches under Profile controls allowing PIN-bypass FaceID/TouchID checkouts.
  - Added visual A6 receipt PDF downloads with `jsPDF` library.
  - Recreated the mobile fintech dashboard screen exactly matching the reference layout mockup in dark mode (`bg-[#111111]`), containing status bar recorders, header controls, balance cards, quick transfers, services grid, referral banners, investment yield cards, and bottom navigation, while strictly preserving the app's established sky-blue brand color palette instead of switching to purple accents.
  - Configured active connection checks on startup to ping the local Yii2 backend, and updated login authentication to attempt live queries first, falling back to local sandbox storage dynamically only on network/connection failure.
  - Synchronized dashboard widgets and features with live backend data models: replaced unsupported mock services (Betting, Insurance, Loan) in the grid with fully supported APIs (Cable TV, A2C Convert, Exam Card); replaced mock Investment yield boxes with live Account Tier levels and a click-through interface to the backend `upgrade` endpoint; mapped Yesterday's Earnings and Recent Transaction feeds to reactive database queries; wired reward share banners to generate and copy the user's live referral link (`ref={userId}`); and updated the "More" button action to redirect to a new dedicated full-page "All Services" tab view instead of opening a half-page bottom drawer.
- **Frictionless Mobile Onboarding & PIN Deferral Alignment (edata-mobile):**
  - Refactored the registration and onboarding flow to strictly align with the frictionless web experience.
  - Simplified the signup screen to only require Email Address (referral/promo code and terms checkbox remain optional). Removed Full Name and Phone Number fields from signup form.
  - Redirected the OTP verification screen to a new dedicated `password_create` screen, bypassing BVN/NIN verification during onboarding.
  - Implemented the password setup screen with Password and Confirm Password inputs, complete with reveal/hide eye icons and validation.
  - Added a defensive check to `handleCheckoutInitiate()` that checks if `currentUser.hasPin` is false, and if so, alerts the user to configure a Transaction PIN and dynamically displays the "Set Transaction PIN" sheet.
  - Added the same check to the Reseller Premium Tier upgrade action, ensuring guests set a Transaction PIN before their first financial action.
  - Enforced a numbers-only and 11-digit maximum constraint on recipient phone number input fields via `maxLength={11}` and string regex filtering.
  - Ran compiler checks (`npx tsc --noEmit`) to verify 100% build health.
- **HereDoc Javascript Variable Scope Fixes:**
  - Resolved runtime `ErrorException: Undefined variable $validateUrl` crashes on the live Buy Data and Buy Airtime pages by replacing PHP variable interpolation syntax (e.g. `'$validateUrl'` and `"$historyUrl"`) inside JS HereDoc blocks with JavaScript global variable references (`validateUrl` and `historyUrl`).
  - Resolved a browser console JS parsing error on the Airtime to Cash (A2C) page by extracting dynamic route definitions to a global HTML `<script>` block and replacing the literal `<?= Url::to(...) ?>` tag inside HereDoc with the global JS variable.
- **Centralized User Deletion Database Integrity Cleanup:**
  - Resolved `Integrity constraint violation (1451)` blocking sub-administrator deletions on the live Super Admin panel.
  - Implemented a centralized `beforeDelete()` method in [User.php](file:///c:/xampp/htdocs/edata/common/models/User.php) that automatically decouples user references across 10 JAMB-related tables, user devices, virtual accounts, upgrade requests, promo assignments, and referrals before final deletion.
  - Added safety checks in [AdminController.php](file:///c:/xampp/htdocs/edata/backend/controllers/AdminController.php) and [UserController.php](file:///c:/xampp/htdocs/edata/backend/controllers/UserController.php) to prevent fatal errors when calling `delete()` on potentially non-existent child rows (`Profile`, `AdminProfile`, `Wallet`, and `AuthAssignment`).

### 2026-07-27
- **Promo Code Relocation to Transaction PIN Modal:**
  - Removed initial promo code input fields from all purchase forms (`ServiceForm.tsx`, `cable-tv/buy.php`, `electricity/buy.php`, `scratch-card/view.php`).
  - Integrated promo code input, instant discount validation (`+₦10.00`), net outflow calculation (`-₦90.00`), and wallet balance after purchase directly into the final PIN authorization BottomSheet modal (`MobileSimulator.tsx`).
- **Exam Scratch Card Wireframe Alignment Redesign:**
  - Redesigned Exam Scratch Card page (`ServiceForm.tsx`) to match user's hand-drawn wireframe.
  - Rendered 4-provider card selection grid (**WAEC**, **NECO**, **NABTEB**, **NBAIS**) using official emblem logo assets (`waec.png`, `neco.png`, `nabteb.png`, `nbais.png`) scaled to `w-14 h-14` (56px).
  - Added rounded Quantity selector counter control box with `-` / `+` buttons and live total calculation (`unit price × quantity`).
  - Removed unnecessary phone number field from Exam Scratch Card form as requested.
  - Simplified order summary box to show minimal 2-line layout displaying **Wallet Balance** (`₦70,791.00`) and **Total Amount** (`-₦3,200.00`).
- **Electricity Distribution Company Custom Logo Dropdown Redesign:**
  - Redesigned Electricity Token purchase form (`ServiceForm.tsx`) following CheapDataHub reference layout.
  - Built an interactive DisCo dropdown displaying official high-resolution logo images (`aedc.png`, `ekedc.png`, `ibedc.png`, `ikeja.png`, `jos.png`, `kaduna.png`, `kedco.png`, `phedc.png`) across 8 major DisCos (AEDC, EKEDC, IKEDC, IBEDC, JED, KAEDCO, KEDCO, PHED).
  - Configured form sequence: Distribution Company (with logos) ➔ Meter Type (`PrePaid`/`PostPaid`) ➔ Meter Number & Verification ➔ Recipient Phone ➔ Amount (₦) ➔ Order Summary (`-₦...`).
- **End-to-End Wallet REST API Synchronization:**
  - Wired `fetchWalletData()` in `MobileSimulator.tsx` to sync `currentUser.walletBalance` live from `GET /api/wallet`.
  - Verified end-to-end integration for KatPay online checkout (`/api/katpay-init`), virtual account generation (`/api/katpay-generate-virtual-account`), and manual deposit proof submission (`/api/manual-deposit`).
- **Eliminated Auth Page Flash on App Refresh:**
  - Lazily initialized `currentScreen` state in `App.tsx` (`() => getAuthToken() ? 'app' : 'auth'`), ensuring authenticated users stay seamlessly on their active screen without flashing `AuthPage`.

### 2026-07-17
- **Network Auto-Detection & Manual Switcher Integration:**
  - Created a centralized backend component [NetworkDetector.php](file:///c:/xampp/htdocs/edata/common/components/NetworkDetector.php) supporting normalization and 4-digit/5-digit Nigerian numbering prefix classification (MTN, Airtel, Glo, 9mobile).
  - Built unified JSON search endpoints inside [AirtimeDataController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/AirtimeDataController.php) and [ApiController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/ApiController.php) to expose operator details and data bundle plan arrays.
  - Revamped [buy-airtime.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/buy-airtime.php) and [buy-data.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/buy-data.php) views with automatic AJAX-based network detection badges, non-reloading target URL updates, and dynamic plan dropdown list rebuilds.
  - Added a collapsible manual operator switcher grid for override.
  - Wired real-time network detection on [a2c/index.php](file:///c:/xampp/htdocs/edata/frontend/views/a2c/index.php) input fields.
  - Synchronized mobile app client logic inside [api.ts](file:///c:/Users/MY%20PC/Desktop/edata-mobile/src/services/api.ts) and [MobileSimulator.tsx](file:///c:/Users/MY%20PC/Desktop/edata-mobile/src/components/MobileSimulator.tsx), expanding carrier lists and verifying production compiler builds.
  - Deployed changes to Hostinger production server via automated Git deployment.
- **Production Server Hotfixes (Case-Sensitivity & HereDoc String Interpolation):**
  - Fixed a `ParseError` on `/complete-profile` caused by an invalid `<?php endphp ?>` tag in [complete-profile.php](file:///c:/xampp/htdocs/edata/frontend/views/site/complete-profile.php) (corrected to `<?php endforeach; ?>`).
  - Fixed a case-sensitivity autoloader crash on Linux production hosts by correcting `'class' => 'yii\web\urlManager'` to `'class' => 'yii\web\UrlManager'` in [common/config/main.php](file:///c:/xampp/htdocs/edata/common/config/main.php).
  - Fixed a major `Array to string conversion` crash on `/airtime-data/buy-data` and `/airtime-data/buy-airtime`. The crash was caused by PHP trying to interpolate `$networkMap` (an array) inside HereDoc (`<<<JS`) blocks which double-interpolate variables. Extracted all PHP variables (such as `$networkMap`, urls, and IDs) out of `$this->registerJs(<<<JS)` blocks into raw HTML `<script>` tags, making them available as standard JS globals.


### 2026-07-11
- **Default Homepage & Auth Flow Refactor:**
  - Redesigned `/` (default homepage) layout to closely replicate the Amigo reference landing page UI: header, logo, centered navigation, and responsive hero columns.
  - Formatted the hero headline as *"Data, airtime, and commerce in one place."* (with *"commerce"* highlighted in brand color) next to an embedded login card on the right.
  - Redesigned the login card's footer links to group signup and recover options into a card with pill buttons and removed redundant footer links.
  - Added a **Popular Data Plans** section below the hero grid featuring grouped network cards (MTN, Glo, Airtel) with preselected plan redirect row handlers.
  - Updated the backend purchase workflow (`buy-data.php`) to listen for a `plan_id` GET parameter to pre-select options and auto-calculate checkout amounts on load.
  - Resolved layout horizontal overflow and responsive breaking bugs on iPhone X sized screens by adjusting header/footer side padding (`px-4 sm:px-6 md:px-margin-desktop`), network cards padding (`p-4 sm:p-6`), and login form card body padding (`p-5 sm:p-8`).
  - Resolved a layout scrolling bug on the landing page by removing the `overflow-hidden` constraint from the `<main>` layout element, enabling full vertical scrolling.
  - Linked the main CTA buttons to `/signup` ("Create account &rarr;", "Become a Marketing Agent") and `/pricing` ("Pricing").
  - Created a dedicated pricing and instant-purchase page at `/pricing` displaying wide tabular rates and network data bundles.
  - Deleted the legacy welcome/landing page view (`welcome.php`) and removed its `/welcome` route entirely.
  - Deployed to the Hostinger production server and verified all routes work.
- **Vending API Switching & Routing Override:**
  - Added columns `is_default` to `service_api_config` and `api_priority` to `data_plan` via a database migration.
  - Wrote a centralized priority router `getActiveProviders()` on the `ServiceApiConfig` model to check for plan-level overrides and fall back to the selected service-level default API.
  - Refactored all vending entrypoints in `AirtimeDataController.php`, `ElectricityController.php`, `CableTvController.php`, `ScratchCardController.php`, `A2cController.php`, and `ApiController.php` to fetch prioritized providers dynamically.
  - Redesigned the admin view `api.php` with styled radio-card switchers to toggle default active service providers, and added the routing override dropdown to the data plan edit form.

### 2026-07-04
- **System Rebranding (BuyDigital ➔ eData):**
  - Updated all text, SEO keywords, headers, and metadata across backend and frontend templates.
  - Rebranded the master database SQL dump ([edata.sql](file:///c:/xampp/htdocs/edata/edata.sql)), updating support emails (`info@edata.com.ng`), portal names (`EDATA`), and SEO descriptions.
- **Wiping out JAMB Services:**
  - Deleted all backend JAMB view folders and controllers ([JambController.php](file:///c:/xampp/htdocs/edata/backend/controllers/JambController.php)).
  - Purged all 12 JAMB-related ActiveRecord models from [common/models/](file:///c:/xampp/htdocs/edata/common/models).
  - Cleared database foreign keys and dependencies pointing to JAMB (e.g. `jamb_olevel_result`, etc.), ensuring PHP runtime code runs without `Class not found` fatal crashes.
- **Service Categories Ordering:**
  - Rearranged all layouts and queries to display products in the following serial order: (1) Airtime Top-ups, (2) Data Bundles, and (3) Exam Scratch Cards.
  - Reassigned category IDs in the database schema: Airtime category = `1`, Data category = `2`, Exam Scratch Cards category = `3`.
  - Updated database query builders across [SiteController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/SiteController.php), [DashboardController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/DashboardController.php), and backend [ServicesController.php](file:///c:/xampp/htdocs/edata/backend/controllers/ServicesController.php) to sort by `category_id ASC, id ASC`.

### 2026-07-05
- **Centralized API Config:**
  - Moved external API configurations (Paystack credentials, CheapDataHub keys, and NaijaResultPins endpoints) from general configurations into a dedicated dashboard view page ([views/configuration/api.php](file:///c:/xampp/htdocs/edata/backend/views/configuration/api.php)) under a new backend route `configuration/api`.
- **Localhost Google reCAPTCHA Disablement:**
  - Commented out external Google reCAPTCHA scripts and form widgets in [signup.php](file:///c:/xampp/htdocs/edata/frontend/views/site/signup.php) to enable testing on local development server.
  - Bypassed validation checks in frontend signup actions to prevent registration blocks on localhost.
- **RBAC Duplicate Entry Bugfix:**
  - Resolved `IntegrityException: Duplicate entry 'user-278' for key 'PRIMARY'` occurring during user signup.
  - Added cleanups in [reset_database.sql](file:///c:/xampp/htdocs/edata/reset_database.sql) to delete orphan role assignments from `auth_assignment` when wiping standard user accounts.
- **Separating Airtime & Data Panels:**
  - Split the client dashboard's combined menu into two distinct links: **Airtime Top-up** and **Data Bundles**.
  - Built independent index view panels ([airtime.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/airtime.php) and [data.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/data.php)) for provider selections.
  - Added pre-filtering parameter constraints (`type=airtime` and `type=data`) to history actions to isolate transactions inside [history.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/history.php).

### 2026-07-06
- **Multi-Provider API Configuration & Failover:**
  - Added new columns to the `setting` table to support configuration for three separate Airtime and Data providers: `airtime_api_name_1`, `airtime_api_name_2`, `airtime_api_endpoint_2`, `airtime_api_key_2`, `airtime_webhook_secret_2`, `airtime_api_name_3`, `airtime_api_endpoint_3`, `airtime_api_key_3`, `airtime_webhook_secret_3`.
  - Updated the database reset script [reset_database.sql](file:///c:/xampp/htdocs/edata/reset_database.sql) to dynamically add these columns via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` queries.
  - Redesigned the admin configuration view [backend/views/configuration/api.php](file:///c:/xampp/htdocs/edata/backend/views/configuration/api.php) to display a clean tabbed panel using Bootstrap 4 nav pills, enabling Superadmins to enter configurations for all three providers under a unified panel.
  - Declared model attributes, validation rules, and user-friendly labels in [common/models/Setting.php](file:///c:/xampp/htdocs/edata/common/models/Setting.php).
  - Implemented priority-based sequential automatic failover inside `attemptVending()` of [frontend/controllers/AirtimeDataController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/AirtimeDataController.php). Requests attempt Provider 1 first, fallback to Provider 2, then Provider 3 upon failure, and detail execution attempts inside `api_response_log`.
- **Desktop Mobile App Setup (edata-mobile):**
  - Cloned the React/Vite-based mobile repository from `https://github.com/mubarakkasimmaishanu/edata-.git` to the user's Desktop as [edata-mobile](file:///C:/Users/MY%20PC/Desktop/edata-mobile).
  - Configured the environment files [.env](file:///C:/Users/MY%20PC/Desktop/edata-mobile/.env) and [.env.local](file:///C:/Users/MY%20PC/Desktop/edata-mobile/.env.local) with the user's Gemini API Key.
  - Installed node dependencies via `npm install` and verified the project compiles and checks out without errors using `npm run lint`.
- **Customer-Facing Portal Redesign (Tailwind CSS & Material Symbols):**
  - Completely redesigned the customer-facing frontend module layout, templates, and view files to match the brand identity, typography (Google Manrope), and sky-blue color scheme of the eData React Native mobile app.
  - Replaced obsolete Bootstrap structures with Tailwind CSS and modern CSS utility classes inside layout wrappers ([main.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/main.php), [header.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/header.php), [sidebar.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/sidebar.php)).
  - Upgraded authentication templates ([login.php](file:///c:/xampp/htdocs/edata/frontend/views/site/login.php), [signup.php](file:///c:/xampp/htdocs/edata/frontend/views/site/signup.php), [resetPassword.php](file:///c:/xampp/htdocs/edata/frontend/views/site/resetPassword.php)), user dashboard panel ([dashboard/index.php](file:///c:/xampp/htdocs/edata/frontend/views/dashboard/index.php)), and wallet page ([wallet/index.php](file:///c:/xampp/htdocs/edata/frontend/views/wallet/index.php)) with premium visual cards.
  - Redesigned airtime & data product pages (`airtime-data/airtime.php`, `airtime-data/data.php`, `airtime-data/buy-airtime.php`, `airtime-data/buy-data.php`, `airtime-data/history.php`) and exam scratch card vended sheets (`scratch-card/view.php`, `scratch-card/submit-entry.php`, `scratch-card/view-order.php` with print support, `scratch-card/history.php`).
  - Redesigned profile and security interfaces (`account/index.php`, `account/change-password.php`).
  - Retained exact original form attributes, input IDs, script targets, and AJAX/DataTable handles to guarantee absolute backward compatibility.
- **DataTables AJAX POST CSRF Validation Fix:**
  - Bypassed CSRF validation on all read-only AJAX data table actions inside controller `beforeAction()` handlers, specifically including the `load-wallet-funding-history` action in [WalletController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/WalletController.php) to match other controllers.
  - Implemented custom `headers` objects inside DataTable AJAX configurations to inject the `X-CSRF-Token` header dynamically across `wallet.js`, `scratch-card.js`, `buy-airtime.php`, `buy-data.php`, `history.php`, and `scratch-card/view.php`.
  - Configured `assetManager` in [main.php](file:///c:/xampp/htdocs/edata/frontend/config/main.php) with `appendTimestamp => true` to invalidate browser caching of modified javascript and stylesheet files automatically.
  - Styled DataTables elements (length selectors, search boxes, info blocks, and paginator buttons) globally in [site.css](file:///c:/xampp/htdocs/edata/frontend/web/css/site.css) to match premium Tailwind CSS visuals and typography standards.
  - Set the baseline system font size to `15px` inside [main.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/main.php) and [site.css](file:///c:/xampp/htdocs/edata/frontend/web/css/site.css) to increase text readability across all dashboard modules.
  - Converted raw Javascript tags inside layout files ([main.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/main.php), [sidebar.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/sidebar.php), [header.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/header.php)) to native Yii `registerJs()` calls to prevent ReferenceErrors and ensure safe execution after core jQuery bundles load. This resolves the sliding sidebar drawer menu toggle controls issue on mobile screens.
- **Landing Page & Service Index Redesigns:**
  - Redesigned landing page action buttons (`btn-primary` in [main-index.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/main-index.php)) to use the primary green theme (`#00531a` / `#047857` hover) to unify the site aesthetics.
  - Redesigned catalog indices for both scratch cards ([scratch-card/index.php](file:///c:/xampp/htdocs/edata/frontend/views/scratch-card/index.php)) and vended items ([airtime-data/index.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/index.php)) into responsive grid layouts matching the main design system.
  - Consolidated airtime, data, exam scratch cards, and wallet funding histories under a single view page ([views/transaction/index.php](file:///c:/xampp/htdocs/edata/frontend/views/transaction/index.php)) powered by a SQL `UNION` query.
  - Implemented the backend handler in [TransactionController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/TransactionController.php).
  - Integrated filter tabs (All, Funding, Airtime, Data, Exam Cards) and linked them dynamically to reload the single DataTable client-side.
  - Updated [sidebar.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/sidebar.php) to use the new Transactions links and configured redirections for legacy routes.
  - Retained and styled the standalone, funding-only recent transaction DataTable inside the wallet dashboard page ([wallet/index.php](file:///c:/xampp/htdocs/edata/frontend/views/wallet/index.php) and [wallet.js](file:///c:/xampp/htdocs/edata/frontend/web/js/wallet.js)).
- **Multi-Tier Membership System & Pricing Tiers:**
  - Designed and implemented a three-tier membership system: Basic User (default), Referred User, and Premium User.
  - Implemented the database migration `m260706_180337_add_membership_tiers` adding `user_level`, `referred_by` to the `user` table, `referred_price` and `premium_price` to the `service_type` and `data_plan` tables, `premium_upgrade_fee` to the `setting` table, and creating the `upgrade_request` table.
  - Updated models `User`, `ServiceType`, `DataPlan`, `Setting`, and created `UpgradeRequest` to handle tier calculations via `getEffectivePrice()`.
  - Implemented the wallet-deducted Premium upgrade request workflow in `AccountController::actionUpgrade()` and added a premium membership status card in `frontend/views/account/index.php`.
  - Added user membership level badges (slate for Basic, blue for Referred, and amber verified badge for Premium) in `frontend/views/layouts/sidebar.php`.
  - Built the admin upgrade requests DataTable review queue (`actionUpgradeRequests`, `actionLoadUpgradeRequests`, `actionApproveUpgrade`, `actionRejectUpgrade`) in `backend/controllers/UserController.php` with automatic wallet refund on rejection, and created the corresponding admin view `backend/views/user/upgrade-requests.php` and sidebar navigation item.
  - Integrated multi-price input fields inside `backend/views/services/update.php`, `backend/views/data-plan/_form.php`, and `backend/views/configuration/index.php`.
  - Integrated dynamic price resolution inside frontend purchase controllers (`AirtimeDataController.php`, `ScratchCardController.php`) and views (`buy-data.php`, `view.php`).

### 2026-07-07
- **Referral Flow & Manual Membership Administrative Controls:**
  - Configured `SiteController::beforeAction()` to intercept referrer IDs (`ref` parameter) and store them in the user session.
  - Updated `SignupForm::signup()` to read from the session, automatically link referred users via `referred_by`, and elevate their tier to `User::LEVEL_REFERRED` (Referred User).
  - Integrated a copiable "Referral Program" sharing interface in `frontend/views/account/index.php` using Tailwind CSS and wrote the Javascript copy logic in `account.js`.
  - Added user level badges (Basic, Referred, Premium) to the administrative users listing table (`UserController::actionLoadUsers()`) and detail view.
  - Implemented `UserController::actionUpdateLevel($id)` to process manual tier modifications and embedded a dropdown level editor in the admin details card (`backend/views/user/view.php`).
  - Verified signup mechanics and database constraints using console integration mock tests.
- **Promo Code System Integration**:
  - Generated and applied database migrations `m260707_154617_add_promo_codes` and `m260707_154923_extend_promo_codes_sub_admins` establishing tables `promo_code`, `promo_code_assignment`, and `promo_code_usage` with indices and foreign keys pointing to `user`, `service_type`, and `transaction`.
  - Created ActiveRecord models `PromoCode`, `PromoCodeAssignment`, and `PromoCodeUsage` in `common/models/` containing validation and dynamic discount calculation logic.
  - Implemented `PromoCode::validateCode()` executing date validity checks, global limits, single redemption per user checks, service type restrictions, and Sub Admin allocation limits.
  - Built frontend AJAX validation route `PromoController::actionValidate()` returning real-time payable totals and discount margins.
  - Embedded validation fields and dynamic script handlers in `buy-airtime.php`, `buy-data.php`, and `scratch-card/view.php` utilizing dynamic Yii2 URL helpers to guarantee virtual host compatibility.
  - Integrated promo checks into purchase checkouts (`AirtimeDataController.php` and `ScratchCardController.php`), deducting discounts from wallets, registering usages, and incrementing limit metrics.
  - Added Super Admin CRUD panel with checkbox assignments, allocation trackers, status toggles, and redemption logs, with a view-only version for Sub Admins.
  - Integrated audit logs in the unified transaction history view (`TransactionController.php`).
  - Corrected database name lookup bugs by replacing non-existent `$user->username` attributes with dynamic lookups using `AdminProfile`.
- **Service Architecture Scaling and Extension**:
  - Created database table `service_api_config` and migrated flat-column parameters for Airtime, Data, and Scratch Cards via migration `m260707_181200_create_service_api_config`.
  - Added child tables `cable_tv_order`, `electricity_order`, and `a2c_order` and new service types for DSTV, GOTV, Startimes, IKEDC, EKEDC, AEDC, KEDCO, and A2C via migration `m260707_182000_add_new_services`.
  - Refactored `attemptVending()` failover sequential priority routines in `AirtimeDataController` and `ScratchCardController` to run dynamically using active `service_api_config` rows.
  - Built frontend modules (`CableTvController`, `ElectricityController`, `A2cController` and their respective Tailwind views) supporting instant purchases, verification name validations, wallet deductions, and order logging.
  - Redesigned backend configuration route `configuration/api` to display a nested tab interface for tabular settings updates across all 6 service lines.
  - Embedded new categories inside transaction load histories (`TransactionController`), dashboard service catalog grids (`dashboard/index.php`), and navigation drawers (`sidebar.php`).
- **Mobile Integration Architecture Guide:**
  - Created a dedicated instruction set [MobileIntegration.md](file:///c:/xampp/htdocs/edata/Skills/MobileIntegration.md) in the `Skills` directory, laying out a complete development blueprint for JWT authentication, Yii2 ActiveController serialization, Axios HTTP request interceptors, and TanStack Query state caching to guide subsequent development phases.
- **Google Sign-In Integration:**
  - Added "Continue with Google" buttons on both [login.php](file:///c:/xampp/htdocs/edata/frontend/views/site/login.php) and [signup.php](file:///c:/xampp/htdocs/edata/frontend/views/site/signup.php) using Google Identity Services (`accounts.google.com/gsi/client`).
  - Implemented `SiteController::actionGoogleAuth()` to verify Google JWT ID tokens server-side, auto-create accounts for new Google users or log in existing users.
  - Google-authenticated users are auto-activated (bypass 2FA) since Google already verified their email ownership.
- **Two-Factor Authentication (2FA) — Email OTP Verification:**
  - Modified `SignupForm::signup()` to set new user status to `User::STATUS_INACTIVE` and generate a 6-digit OTP code stored in `verification_token` (format: `{6-digit-code}:{unix_expiry_timestamp}`) with a 20-minute expiry window.
  - Applied migration `m260707_183500_add_verification_token_to_user` to ensure the `verification_token` column exists on the `user` table.
  - Updated `LoginForm` to block inactive users with a flash message redirecting them to email verification.
  - Built `SiteController::actionVerifyEmail()` presenting a 6-digit OTP input form, validating the code and expiry, and activating the account on success.
  - Built `SiteController::actionResendVerification($email)` to regenerate and resend the OTP code, then redirect back to the verify page.
  - Created view template: [verify-email.php](file:///c:/xampp/htdocs/edata/frontend/views/site/verify-email.php) (handles both initial verification and resend flows).
- **Session Persistence & Revocation:**
  - Configured Yii2 identity cookie duration to 30 days (`loginDuration = 2592000`) for persistent sessions across browser launches.
  - Added `auth_key` regeneration in `SiteController::actionLogout()` to immediately invalidate all other active sessions across devices upon logout.
  - Added `auth_key` regeneration in `AccountController::actionChangePassword()` alongside password hash update to force-terminate all other sessions when a password is changed.
  - Session revocation works because Yii2 `validateAuthKey()` compares the cookie's stored `auth_key` against the database — regenerating the key invalidates all old cookies.
- **Promo Code Completion — Cable TV & Electricity:**
  - Integrated full promo code validation, discount calculation, wallet deduction, usage logging, and counter increments in [CableTvController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/CableTvController.php) and [ElectricityController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/ElectricityController.php).
  - Added promo code input fields, Apply buttons, status messages, and AJAX validation handlers in [cable-tv/buy.php](file:///c:/xampp/htdocs/edata/frontend/views/cable-tv/buy.php) and [electricity/buy.php](file:///c:/xampp/htdocs/edata/frontend/views/electricity/buy.php).
  - All 5 service types (Airtime, Data, Scratch Card, Cable TV, Electricity) now have complete promo code support across both controllers and views.
- **Mobile Integration REST API Endpoints:**
  - Implemented the dynamic and secure [ApiController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/ApiController.php) providing REST JSON outputs.
  - Enabled JsonParser requests parsing globally inside [main.php](file:///c:/xampp/htdocs/edata/frontend/config/main.php) configuration.
  - Formatted active plan queries to resolve dynamic price hierarchies based on user-tiers and correct database attributes (e.g. `selling_price` and `plan_name` instead of legacy column names).
  - Executed mock console integration tests to verify the authentication loop, token security headers, and carriers list serialization outputs.

### 2026-07-08
- **Transaction PIN System:**
  - Created and applied migration `m260708_120000_add_transaction_pin.php` to append `transaction_pin` column (`VARCHAR(255)`) to the `user` table.
  - Added helper methods `setTransactionPin()`, `validateTransactionPin()`, and `hasTransactionPin()` to `User` model.
  - Added `transaction_pin` and `confirm_transaction_pin` fields to `SignupForm` with validation rules requiring a 4-digit numeric pattern.
  - Integrated PIN validation checks in POST checkout methods in `AirtimeDataController.php` (buy airtime, buy data), `ScratchCardController.php` (buy scratch cards), `CableTvController.php` (cable TV purchases), `ElectricityController.php` (electricity bills), `A2cController.php` (airtime-to-cash conversions), and `AccountController.php` (premium upgrades).
  - Added frontend `transaction_pin` password-type numeric input fields in `buy-airtime.php`, `buy-data.php`, `scratch-card/view.php`, `cable-tv/buy.php`, `electricity/buy.php`, `a2c/index.php`, `signup.php`, and `account/index.php` (upgrade form).
  - Implemented complete Transaction PIN Management inside the user profile (`account/index.php`) featuring Set PIN, Change PIN, and Forgot PIN (verified via email OTP code matching the 2FA flow).
  - Created view templates: `set-pin.php`, `change-pin.php`, `forgot-pin-request.php`, and `forgot-pin-verify.php`.
- **Mobile Simulator Refactor & Features Sync:**
  - Renamed all legacy references of `'Super User'` to `'Premium User'` across the simulator UI, getDynamicPrice models, upgrade modals, and user profile panels.
  - Implemented interactive Promo Code validation input fields and Apply/Clear buttons on checkout panels for all 5 vending streams: Airtime, Data, Electricity, Cable TV, and Exam Tokens.
  - Wired Dynamic Checkout Total updates reflecting applied discounts (e.g. `EDATA50`, `WELCOME10`, `PROMO200`).
  - Added Transaction PIN security prompt dialog validations during mock checkout submissions and secure Pin creation/reset utilities under Profile view controls.
  - Validated compilation stability with a clean production Vite build (`npm run build`).
- **Vending API Security & Mobile Rebranding Sync:**
  - Enforced `transaction_pin` validation inside the backend API checkouts (`ApiController::actionPurchase()`).
  - Added `has_pin` and `has_pending_upgrade` status properties to user identity API responses.
  - Implemented new backend API routes for upgrades (`actionUpgrade()`) and PIN setups/changes (`actionSetPin()`, `actionChangePin()`).
  - Renamed `priceSuper` properties and types to `pricePremium` across `types.ts`, `data.ts`, and `MobileSimulator.tsx` inside the mobile simulator project.
  - Rebranded AI copilot descriptions from `'Super User'` to `'Premium User'` inside `server.ts`.
  - Validated stability through a successful production build compilation of the simulator.

- **Resend Mailer Integration:**
  - Created custom `ResendMailer` component (`common/components/ResendMailer.php`) extending `yii\symfonymailer\Mailer` to send transactional mail via Resend's HTTP API, with automatic fallback to standard SMTP.
  - Switched the `'mailer'` component class inside `common/config/main-local.php` to `common\components\ResendMailer`.
  - Added `resendApiKey` configuration param placeholder to `common/config/params-local.php`.
- **Responsive Professional Landing Page Typography:**
  - Redesigned landing page header brand logotype, navigation menus, and footers in [main-index.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/main-index.php) using flexible responsive sizes (`text-sm lg:text-base` for nav-bar links, `text-2xl sm:text-3xl` for branding name).
  - Scaled custom Tailwind config font size tokens (`label-sm`, `label-lg`, `body-md`, `body-lg`, `headline-md`, `headline-lg`) to follow professional UI/UX design standards.
  - Refactored text and heading components in [index.php](file:///c:/xampp/htdocs/edata/frontend/views/site/index.php) from static sizes to responsive Tailwind scales (`text-4xl sm:text-5xl lg:text-[60px] xl:text-[64px]` for the hero heading), improving readability and solving viewport clipping issues on mobile devices.
- **Sidebar Navigation Simplification & Consolidation:**
  - Removed redundant individual history links (Airtime History, Data History, Cable History, Recharge History, and A2C History) from the sidebar.
  - Converted the dropdown menus for Airtime, Data, Cable, Electricity, and A2C into clean, direct links pointing straight to their respective buy/subscribe actions.
  - Retained the **Exam Cards** dropdown to group multiple provider choices while keeping it clear of history submenus.
  - Simplified active menu highlights to consolidate history tracking under the single **Recent Transactions** menu item.
- **Codebase Cleanups & Scratch File Removal:**
  - Purged untracked development scratch files and draft scripts (`scratch_db.php`, `scratch_schema.php`, `scratch_tables.php`, `scratch_test.php`, and `php`) from the root directory.
  - Cleared temporary files and error logs (`hello.txt` and `error_log`) from the `backend/web/` folder, ensuring a pristine codebase.

### 2026-07-10
- **Hostinger Production Deployment:**
  - Packed local workspace files into an optimized ZIP archive (~6.5 MB), excluding `vendor/`, `node_modules/`, `runtime/`, `assets/`, and local uploads.
  - Uploaded via SSH stdin stream (`cat > deploy.zip`) to bypass Hostinger's SFTP protocol blocks.
  - Ran production environment initialization (`php init --env=Production --overwrite=All`), created required `runtime/` and `assets/` directories with `chmod -R 777`, and installed production dependencies (`composer install --no-dev --optimize-autoloader`).
  - Imported the Yii2 database schema from `edata.sql` into the production MySQL database `dev_airtime_to_cash`.
- **Git Pull-to-Deploy Pipeline:**
  - Configured Git on the Hostinger server, initialized repository tracking against `origin/main`, and ran `git reset --mixed origin/main` to sync the index.
  - Created an executable deployment script at `/home/dev/web/edata.com.ng/deploy.sh` that automates: `git pull`, `composer install --no-dev`, `php yii migrate --interactive=0`, and runtime permission resets.
  - Generated an SSH deploy key on the server and added it to the GitHub repository as a Deploy Key for passwordless `git pull` operations.
- **Admin Backend URL Routing:**
  - Renamed backend entry points from the default path to `/office` inside the root [.htaccess](file:///c:/xampp/htdocs/edata/.htaccess) (`RewriteRule ^office/?(.*)?$ backend/web/$1 [L]`).
  - Set production base URLs: `baseUrl => '/office'` in `environments/prod/backend/config/main-local.php` and `baseUrl => ''` in `environments/prod/frontend/config/main-local.php`.
- **Pretty URLs (Hide index.php):**
  - Enabled `enablePrettyUrl => true` and `showScriptName => false` in both [frontend/config/main.php](file:///c:/xampp/htdocs/edata/frontend/config/main.php) and [backend/config/main.php](file:///c:/xampp/htdocs/edata/backend/config/main.php).
  - URLs are now clean: `/login`, `/signup`, `/office/login` instead of showing `/index.php?r=site/login`.
- **Typography & UI/UX Upgrades (Industry Standard):**
  - Updated login, signup, verify-email, request-password-reset, and reset-password views.
  - Form labels: `text-xs` (12px) → `text-sm` (14px), `font-bold uppercase` → `font-semibold tracking-wide`.
  - Form inputs: `text-sm` (14px) → `text-base` (16px) with `py-3.5` — prevents iOS mobile browser auto-zoom on focus.
  - Submit buttons: `text-sm` → `text-base` (16px).
  - Footer helper links: `text-xs` → `text-sm` (14px).
- **Admin Password Reset:**
  - Diagnosed `InvalidArgumentException: Hash is invalid` error caused by bash `$` interpolation corrupting the bcrypt hash during MySQL UPDATE.
  - Fixed by uploading a PHP script directly to the server that generates the hash with `password_hash()` and stores it via PDO prepared statements, avoiding shell escaping entirely.
  - Admin credentials: email `anastukur008@gmail.com`, password `Admin@Edata2026`.

### 2026-07-16
- **Registration & Onboarding Module (Frictionless Multi-Step Signup + Device-Based 2FA):**
  - Implemented multi-step registration flow replacing the old single-page signup:
    - **Step 1 (`/signup`):** Email, Terms & Conditions agreement (with link to `/terms`), and optional Promo Code. Sends OTP to email and stores it in session.
    - **Step 2 (`/signup-verify`):** User enters the 6-digit OTP code. Validates session OTP. Supports resend.
    - **Step 3 (`/signup-password`):** User creates password and 4-digit transaction PIN. Creates user account (status=Active), empty profile placeholder, wallet, and trusts the current device immediately.
  - **Device-Based 2FA on Login:**
    - Login checks for a `edata_trusted_device` cookie matching a `user_device` table row. If trusted, logs in immediately. If untrusted (new device), sends a 6-digit token via email and redirects to `/login-2fa`.
    - `/login-2fa` validates the token (stored in `verification_token` with `:2fa` suffix), trusts the device (creates `user_device` row + sets 10-year cookie), and logs in permanently.
  - **Progressive Profile Onboarding:**
    - `OnboardingFilter.php` globally intercepts all dashboard/vending routes. Users with incomplete profiles (empty firstname/lastname/phone or missing transaction PIN) are redirected to `/complete-profile` before gaining access.
    - `/complete-profile` collects First Name, Last Name, Phone Number, and optionally Transaction PIN (skipped if already set).
  - **Google Sign-In Integration Updated:**
    - New Google users bypass OTP, create with empty profile, trust device immediately, redirect to dashboard (then to complete-profile via filter).
    - Existing Google users on untrusted devices go through 2FA flow before login.
  - **Single Session Policy:** `auth_key` is regenerated on every login and 2FA confirmation to invalidate all other device cookies.
  - **New Files Created:**
    - `common/models/UserDevice.php` — ActiveRecord model for trusted device tracking.
    - `console/migrations/m260716_161509_create_user_device_table.php` — Migration for `user_device` table.
    - `common/mail/login2fa-html.php` — HTML email template for 2FA login codes.
    - `frontend/components/OnboardingFilter.php` — Global action filter for profile completeness gating.
    - `frontend/views/site/signup-verify.php` — OTP entry view (Step 2).
    - `frontend/views/site/signup-password.php` — Password + PIN setup view (Step 3).
    - `frontend/views/site/login-2fa.php` — Device 2FA verification view.
    - `frontend/views/site/complete-profile.php` — Progressive profile completion form.
    - `frontend/views/site/terms.php` — Terms and Conditions page.
  - **Modified Files:**
    - `common/models/User.php` — Added `getUserDevices()`, `generate2faToken()`, `validate2faToken()`.
    - `common/models/Profile.php` — Made firstname/lastname/phone optional for placeholder saves.
    - `frontend/models/SignupForm.php` — Refactored to `step1` and `step3` scenarios.
    - `frontend/config/main.php` — Registered `OnboardingFilter`, added pretty URL rules.
    - `frontend/controllers/SiteController.php` — Full rewrite with all new action methods.
    - `frontend/views/site/signup.php` — Updated to email-only Step 1.
  - **Verification Token Format for 2FA:** `{6digit-code}:{expiry_unix_timestamp}:2fa` — the `:2fa` suffix distinguishes it from standard inactive-account tokens.
  - Sandbox tests passed: user creation, empty profile placeholder, wallet, and transaction PIN all verified programmatically.

### 2026-07-13
- **Auth Redesign & Viewport Compactness:**
  - Redesigned the auth layout ([main-login.php](file:///c:/xampp/htdocs/edata/frontend/views/layouts/main-login.php)) to use the new blue branding color (`#0051d5` secondary), Inter font, and Material Design 3 design tokens.
  - Configured layout bounds to `h-screen overflow-hidden`, shrunk top header heights to `56px`, and wrapped the card container in a scrollable `flex-grow overflow-y-auto` main canvas, ensuring auth screens fit perfectly within one screen viewport without scrolling.
  - Completely updated [login.php](file:///c:/xampp/htdocs/edata/frontend/views/site/login.php), [signup.php](file:///c:/xampp/htdocs/edata/frontend/views/site/signup.php), [requestPasswordResetToken.php](file:///c:/xampp/htdocs/edata/frontend/views/site/requestPasswordResetToken.php), [resetPassword.php](file:///c:/xampp/htdocs/edata/frontend/views/site/resetPassword.php), [verify-email.php](file:///c:/xampp/htdocs/edata/frontend/views/site/verify-email.php), and [error.php](file:///c:/xampp/htdocs/edata/frontend/views/site/error.php) to use compact wrappers, `12x12` icon elements, and single-row inline check-pricing callouts.
  - Amplified label sizes to `text-sm font-semibold`, input texts to `text-base` (42px height), and primary buttons to `text-base font-semibold` to maximize readability on web views.
- **Pricing & Direct Purchase Page Redesign:**
  - Redesigned [pricing.php](file:///c:/xampp/htdocs/edata/frontend/views/site/pricing.php) into a direct-purchase table loading active plans dynamically from the database.
  - Mapped network providers to specific icons and badge classes (Basic price, Affiliate price, and Premium price inside blue pills).
  - Embedded inline beneficiary inputs and Buy buttons with javascript check validation, visual spinner loaders, and redirect routing.
  - Created a mobile card-list template (`block md:hidden`) that stacks options vertically and stretches purchase forms full-width, eliminating horizontal scrolling on phone screens.
  - Scaled table headers to `font-bold text-xs uppercase tracking-wider text-primary` to make columns highly visible.
  - Refactored [buy-data.php](file:///c:/xampp/htdocs/edata/frontend/views/airtime-data/buy-data.php) and [AirtimeDataController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/AirtimeDataController.php) to automatically parse beneficiary phone GET arguments on load, and store redirect URL session context for guests.
- **Paramiko Deploy Scripting:**
  - Implemented `deploy_ssh.py` using `paramiko` to trigger the production deploy script (`/home/dev/web/edata.com.ng/deploy.sh`) over SSH.

### 2026-07-21
- **Katpay Key Column Length & Admin API Config Fix:**
  - Updated [Setting.php](file:///c:/xampp/htdocs/edata/common/models/Setting.php#L73) rules to remove `max => 255` string validation for `katpay_secret_key`, `katpay_public_key`, `katpay_merchant_id`, `paystack_secret_key`, `paystack_public_key`, removing the HTML `maxlength="255"` attribute limit from admin API config.
  - Created migration `console/migrations/m260721_120000_alter_katpay_secret_key_length.php` and altered `setting` database table columns to `TEXT` type on production.
- **Katpay API Endpoint HTTP 405 Fix & Official API Integration:**
  - Resolved `Katpay Error: HTTP 405` when initializing Katpay online payments. Replaced invalid endpoints (`/v1/checkout`, `/v1/payments/initialize`) in `WalletController::initializeKatpay()` with Katpay's official API endpoint `https://api.katpay.co/v1/transfer-payments`.
  - Updated payload parameter mapping to Katpay's exact required fields (`customer_name`, `customer_email`, `customer_phone`, `merchant_reference`, `merchant_id`, `callback_url`, `redirect_url`, `amount`), returning `HTTP 201 Created` with valid `checkout_url`.
  - Updated `WalletController::actionGenerateVirtualAccount()` to call `https://api.katpay.co/v1/transfer-payments` and parse `payment_account` details (`bank_name`, `account_number`, `account_name`) into `UserVirtualAccount` database records.
- **Wallet & Dashboard UI/UX Simplification (Integrated Skyblue Wallet Card):**
  - Removed separate Virtual Account container blocks from both Dashboard ([dashboard/index.php](file:///c:/xampp/htdocs/edata/frontend/views/dashboard/index.php)) and Wallet page ([wallet/index.php](file:///c:/xampp/htdocs/edata/frontend/views/wallet/index.php)).
  - Integrated dedicated virtual bank transfer details directly inside the main Skyblue Wallet Balance card (`sky-gradient rounded-[2rem] p-6 text-slate-900`) on both Dashboard and Wallet pages, maintaining a compact 2-column internal grid with backdrop-blur white sub-cards (`bg-white/60`).
  - Implemented `copyVirtualAccount()` and `showCopyToast()` in [wallet.js](file:///c:/xampp/htdocs/edata/frontend/web/js/wallet.js), providing reliable clipboard copying with toast message `"Account number copied"` and green checkmark button animation.
- **Deposit History Database Column Nullable Fix (HY000):**
  - Fixed MySQL strict mode `SQLSTATE[HY000]: General error: 1364 Field 'account_name' doesn't have a default value` error when submitting online Katpay/Paystack funding.
  - Updated [WalletController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/WalletController.php#L155) to supply default values (`'Katpay Online Checkout'`, `''`) for `account_name` and `screenshot` on online deposits and webhooks.
  - Created migration `console/migrations/m260721_140000_make_deposit_history_columns_nullable.php` and altered `deposit_history` columns `account_name` and `screenshot` to `NULL DEFAULT NULL` on production.
  - Executed SSH automated deployment script updating production server (`92.112.192.11`).

---

## 🏗️ Production Deployment Reference

### Server Access
- **SSH:** `ssh dev@92.112.192.11` / password: `49nf;&n^#Hs]{jhV`
- **Web Root:** `/home/dev/web/edata.com.ng/public_html`
- **Database:** `dev_airtime_to_cash` @ `127.0.0.1` / user: `dev_airtime_to_cash` / password: `Airtime_to_cash1?`
- **Domain:** `edata.com.ng` (Cloudflare CDN)

### Deployment Workflow
1. Push code to GitHub: `git push origin main`
2. SSH into server and run: `/home/dev/web/edata.com.ng/deploy.sh`
3. Script auto-handles: git pull → composer install → migrations → permission resets

### Server Constraints
- **Directory Protections:** Hostinger sets `~/web/edata.com.ng` to `555`. Run `chmod u+w` before creating/renaming files, then `chmod u-w` after.
- **SFTP Blocked:** Use SSH stdin streams (`cat > file`) for binary uploads instead of Paramiko SFTP.
- **Runtime Directories:** Must exist with `777` permissions: `frontend/runtime/`, `frontend/web/assets/`, `backend/runtime/`, `backend/web/assets/`, `console/runtime/`.

### Admin Panel Access
- **URL:** `https://edata.com.ng/office`
- **Admin Users (from DB):**
  - `anastukur008@gmail.com` (id=210, type=admin)
  - `alkadismohammed@gmail.com` (id=211, type=admin)
  - `iu9410540@gmail.com` (id=213, type=admin)

---

## 🛠️ Remote Diagnostics & SSH Troubleshooting Guide

If another tab or session is having difficulty accessing Hostinger SSH or running commands, follow this guide:

### 1. Direct SSH Connection Info
Run this command from your terminal:
```bash
ssh dev@92.112.192.11
```
When prompted, paste the password:
```text
49nf;&n^#Hs]{jhV
```

### 2. Tail the Production Error Logs
Once connected via SSH, run this command to inspect the latest errors on the live site:
```bash
tail -n 100 /home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log
```
Or filter for errors only:
```bash
grep -n -B 5 -A 25 '\[error\]' /home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log | tail -n 50
```

### 3. Check PHP Syntax/Lint Remotely
To test if a file has a syntax error on production without loading it in the browser:
```bash
php -l /home/dev/web/edata.com.ng/public_html/frontend/views/airtime-data/buy-data.php
```

### 4. Direct Python/Paramiko Debugging Script (Run locally)
If you cannot run an interactive terminal because of password prompts, save the following script as `scratch/ssh_run.py` on your local workspace and run `python scratch/ssh_run.py`. It uses Paramiko to run any command cleanly and outputs stdout/stderr:

```python
import paramiko
import sys

def main():
    host = "92.112.192.11"
    port = 22
    username = "dev"
    password = r"49nf;&n^#Hs]{jhV"

    # Define your remote command here!
    command = "tail -n 50 /home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log"

    print(f"Connecting to Hostinger to execute: {command}")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port, username, password, timeout=30)
        stdin, stdout, stderr = ssh.exec_command(command)
        
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out:
            print("--- STDOUT ---")
            print(out)
        if err:
            print("--- STDERR ---")
            print(err)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
```

### 2026-07-21
- **Profile Photo Upload & Complete Profile Fix:**
  - Added migration `m260721_120000_add_photo_to_profile` adding `photo VARCHAR(255) DEFAULT NULL` to the `profile` table.
  - Updated `Profile` model (`common/models/Profile.php`) with `'photo'` attribute rules and labels.
  - Updated `SiteController::actionCompleteProfile()` and `AccountController::actionIndex()` to handle profile image uploads via `UploadedFile::getInstanceByName('photo')` and save files into `@frontend/web/uploads/profiles/`.
  - Added `enctype="multipart/form-data"` form attributes, round photo preview circles, camera button pickers, and client-side FileReader image preview JavaScript in `frontend/views/site/complete-profile.php` and `frontend/views/account/index.php`.
- **Google OAuth Error 401 Debugging:**
  - Diagnosed `Error 401: invalid_client` ("The OAuth client was not found") caused by placeholder Google Client ID (`518586633606-apiauth325212.apps.googleusercontent.com`) in `common/config/params.php`.
  - Documented requirement for real Google Cloud Console OAuth 2.0 Web Client ID in `implementation_plan.md`.
- **Complete Notification System (Admin Module + REST API + Mobile Client):**
  - Database schema: `m260721_130000_create_notification_tables.php` creating `notification` and `user_notification_read` tables.
  - ActiveRecord models: `Notification.php` (with `findForUser($user)` and `getUnreadCountForUser($user)`) and `UserNotificationRead.php`.
  - Admin module: `NotificationController.php` with `index` and `create` actions supporting recipient groups (All Users, Basic Users, Referred Users, Premium Users, Sub Admins, Individual User) and image uploads. Views in `backend/views/notification/` and "Notification Desk" added to `sidebar.php`.
  - REST API: `actionNotifications` (`GET /api/notifications`) and `actionMarkNotificationRead` (`POST /api/notifications/read`) in `ApiController.php`.
  - Mobile client: Updated header bell icon in `MobileSimulator.tsx` to open dedicated Notifications view with unread badge counter. Created Notifications view with filter pills (All, Unread), notification cards, mark all read, and detail BottomSheet modal. Added API methods in `api.ts` and `AppNotification` interface in `types.ts`.
- **Forgot Password, Forgot Transaction PIN & Email Delivery Audit & Deployment:**
  - Added missing `actionResetPassword()` REST API endpoint in `ApiController.php` allowing mobile clients to complete password reset via 6-digit email OTP codes.
  - Updated `PasswordResetRequestForm.php` to prevent PHP fatal null-pointer exception on profile lookup and standardized sender email parameters.
  - Added `resetPassword()` in `api.ts` and upgraded `MobileSimulator.tsx` Forgot Password modal to a complete 2-step flow (Request 6-digit OTP code -> Verify OTP & Set New Password).
  - Deployed modified files to live server via SSH and verified 0 syntax errors.

### 2026-07-22
- **Mobile App Authentication & OTP Registration Flow Refactoring:**
  - Enforced OTP verification **strictly during first-time account registration** (`signupRequest`, `signupVerify`, `signupComplete`).
  - Streamlined standard logins to require **email and password** (or Google OAuth) only, removing intrusive OTP prompts.
  - Updated `actionSignupComplete()` in `ApiController.php` to validate 6-digit OTP codes against server Yii cache (`signup_otp_<md5(email)>`) before creating accounts, closing endpoint bypass loopholes.
  - Saved user `firstname`, `lastname`, and `phone` into `Profile` upon registration completion.
- **REST API CORS & Preflight OPTIONS Routing:**
  - Added `'on beforeSend'` response event handler in `frontend/config/main.php` to automatically attach CORS headers (`Access-Control-Allow-Origin: *`) and format error responses as JSON across all API endpoints.
  - Fixed preflight `OPTIONS` routing in `urlManager` by adding explicit routes for `api/<action>`, `api/login`, `api/signup`, `api/google-auth`, etc., at the top of `urlManager.rules`.
  - Set `Yii::$app->user->enableSession = false;` and `Yii::$app->user->loginUrl = null;` in `ApiController::beforeAction()` to prevent REST API Bearer token authentication failures from redirecting to `/site/login` HTML pages.
- **Google OAuth REST API Route & Exception Handling:**
  - Fixed `POST api/google-auth` 500 error by adding top-level `urlManager` routing rules (`POST api/google-auth`, `OPTIONS api/google-auth`, `POST frontend/web/api/google-auth`).
  - Wrapped `actionGoogleAuth()` in `ApiController.php` with a `try-catch` exception handler and safe IP address resolution (`Yii::$app->request->userIP`).
  - Verified live endpoint with preflight `200 OK` and POST success JSON output (`{"success": true, ...}`).
- **KatPay Gateway & Manual Deposit Integration:**
  - Integrated KatPay payment gateway (`actionKatpayInit`, `actionKatpayGenerateVirtualAccount`, `katpay-webhook.php`) and manual wallet deposit submission (`actionManualDeposit`).
- **Live Deployment & Version Control:**
  - Deployed all updated web controllers, configuration files, and components to Hostinger live server (`92.112.192.11`).
  
- **Database Collation & KatPay Account Cleanup:**
  - Fixed MySQL 1271 Illegal Mix of Collations in `TransactionController.php` by adding explicit `CONVERT(column USING utf8mb4) COLLATE utf8mb4_unicode_ci` to UNION query string columns.
  - Created migration `m260722_165000_delete_old_katpay_virtual_accounts.php` to delete obsolete KatPay virtual account records from `user_virtual_account`.
  - Disabled automatic KatPay virtual account generation in `WalletController.php`.
- **Live Server Database Configuration & Deployment:**
  - Added `/common/config/main-local.php` to `.gitignore` and updated server `deploy.sh` to preserve production database credentials (`dev_airtime_to_cash`).
- **Web Navigation, Sidebar, Logo & Session Locking:**
  - Registered jQuery event handlers for `[data-toggle="aside"]` mobile sidebar toggle (`-translate-x-full` ↔ `translate-x-0`), backdrop overlay, and accordion dropdowns in `frontend/views/layouts/main.php`.
  - Replaced broken logo image paths in `header.php`, `main-index.php`, and `main-login.php` with `Yii::$app->request->baseUrl . '/images/logo.png'`.
  - Added favicon link tags in `main.php` and copied `favicon.ico` to root.
  - Locked user sessions across web pages by removing hardcoded `'baseUrl' => '/edata'` in `frontend/config/main.php` and setting cookie `'path' => '/'` and `'httpOnly' => true`.
- **Clean Base URL Resolution & Route Pollution Fix:**
  - Configured `'baseUrl' => ''` (empty string) under the `request` component in `frontend/config/main.php`.
  - Removed faulty wildcard rule `'OPTIONS api/<controller:[\w-]+>/<action:[\w-]+>' => '<controller>/<action>'` from `urlManager` which was hijacking standard web routes (such as `site/logout` and `dashboard/index`) and prefixing `api/` to web URLs.
  - Restricted `Response::FORMAT_JSON` conversions in `on beforeSend` exclusively to `ApiController` actions or explicit JSON requests, ensuring standard web error pages render clean HTML layouts.
- **REST API Dashboard Summary Endpoint (`actionDashboard`):**
  - Added `actionDashboard()` to `ApiController.php` returning user details, wallet balance, active virtual accounts, recent transactions, and service categories as JSON.
  - Added browser detection in `actionDashboard()` to redirect direct web browser accesses to `/dashboard`.
- **Session Redirect Sanitation:**
  - Sanitized `redirectUrl` in `SiteController.php` after authentication to strip out any `/api` routes from user session cookies.
- **Google Sign-In Direct Dashboard Landing & Profile Data Auto-Extraction:**
  - Removed forced intercept and hard redirects to `/complete-profile` in `OnboardingFilter.php`. Logged-in users now land directly on the Dashboard upon authentication.
  - Updated `SiteController::actionGoogleAuth()` and `ApiController::actionGoogleAuth()` to automatically extract Google Profile Photo (`picture`), First Name (`given_name`), Last Name (`family_name`), and Email (`email`) and save them to the user's `Profile`.
  - Updated Mobile App (`MobileSimulator.tsx`) Google OAuth callback to set `currentScreen = 'app'` and navigate directly to the Dashboard screen with Google profile details.
- **Deferred Transaction PIN Creation (Web & Mobile):**
  - Removed mandatory Transaction PIN creation from initial registration and sign-in.
  - Deferred PIN setup to the user's **first financial transaction or purchase** attempt (Airtime, Data, Cable, Electricity, A2C, Exam Cards). A 4-digit PIN setup modal prompts the user to create a PIN before finalizing the transaction.
- **Full Production Deployment & Repository Synchronization:**
  - Deployed updated controllers (`ApiController.php`, `SiteController.php`, `OnboardingFilter.php`) to Hostinger live server (`92.112.192.11`).
  - Synchronized Git repositories for Web (`https://github.com/mubarakkasimmaishanu/edata.git`) and Mobile (`https://github.com/mubarakkasimmaishanu/edata-.git`).

### 2026-07-23
- **cPanel & Hostinger GitHub Actions Deployment Pipeline:**
  - Designed and configured automated cPanel deployment pipelines via `.github/workflows/deploy.yml`.
  - Configured git ignore and deployment synchronization rules to preserve live environment database configurations (`common/config/main-local.php`) and upload directories.
- **Paramiko Remote Server Diagnostics & Self-Healing Utilities:**
  - Built non-interactive Python SSH helper scripts (`scratch/fetch_recent_errors.py`, `scratch/fetch_error_log.py`, `scratch/fix_server_now.py`) to stream live Yii2 app logs (`frontend/runtime/logs/app.log`) and trigger un-attended database migrations (`php yii migrate --interactive=0`).
- **Debugging & Self-Skill Guidelines Update:**
  - Updated project `Skills/Debug.md` and `Skills/Remember.md` with guidelines covering MySQL 1271 collation resolution, Paramiko remote log extraction, cPanel CI/CD pipelines, and deferred transaction PIN checkout handling.
- **Hostinger Native Mailer & Real OTP Email Delivery:**
  - Fixed `Name or service not known` mailer connection error by setting `'scheme' => 'native'` in `common/config/main-local.php` on live server. Real 6-digit OTP verification codes are now sent instantly to user email addresses.
- **Mobile Registration OTP Sandbox Fallback Cleanup:**
  - Removed `Sandbox OTP Code: 123456` toasts and `apiStatus === 'connected'` gates in `MobileSimulator.tsx` and `AuthPage.tsx`. Registration invokes `api.signupRequest` directly to trigger live mailer delivery.
- Removed separate Virtual Account container blocks from both Dashboard ([dashboard/index.php](file:///c:/xampp/htdocs/edata/frontend/views/dashboard/index.php)) and Wallet page ([wallet/index.php](file:///c:/xampp/htdocs/edata/frontend/views/wallet/index.php)).
  - Integrated dedicated virtual bank transfer details directly inside the main Skyblue Wallet Balance card (`sky-gradient rounded-[2rem] p-6 text-slate-900`) on both Dashboard and Wallet pages, maintaining a compact 2-column internal grid with backdrop-blur white sub-cards (`bg-white/60`).
  - Implemented `copyVirtualAccount()` and `showCopyToast()` in [wallet.js](file:///c:/xampp/htdocs/edata/frontend/web/js/wallet.js), providing reliable clipboard copying with toast message `"Account number copied"` and green checkmark button animation.
- **Deposit History Database Column Nullable Fix (HY000):**
  - Fixed MySQL strict mode `SQLSTATE[HY000]: General error: 1364 Field 'account_name' doesn't have a default value` error when submitting online Katpay/Paystack funding.
  - Updated [WalletController.php](file:///c:/xampp/htdocs/edata/frontend/controllers/WalletController.php#L155) to supply default values (`'Katpay Online Checkout'`, `''`) for `account_name` and `screenshot` on online deposits and webhooks.
  - Created migration `console/migrations/m260721_140000_make_deposit_history_columns_nullable.php` and altered `deposit_history` columns `account_name` and `screenshot` to `NULL DEFAULT NULL` on production.
  - Executed SSH automated deployment script updating production server (`92.112.192.11`).

---

## 🏗️ Production Deployment Reference

### Server Access
- **SSH:** `ssh dev@92.112.192.11` / password: `49nf;&n^#Hs]{jhV`
- **Web Root:** `/home/dev/web/edata.com.ng/public_html`
- **Database:** `dev_airtime_to_cash` @ `127.0.0.1` / user: `dev_airtime_to_cash` / password: `Airtime_to_cash1?`
- **Domain:** `edata.com.ng` (Cloudflare CDN)

### Deployment Workflow
1. Push code to GitHub: `git push origin main`
2. SSH into server and run: `/home/dev/web/edata.com.ng/deploy.sh`
3. Script auto-handles: git pull → composer install → migrations → permission resets

### Server Constraints
- **Directory Protections:** Hostinger sets `~/web/edata.com.ng` to `555`. Run `chmod u+w` before creating/renaming files, then `chmod u-w` after.
- **SFTP Blocked:** Use SSH stdin streams (`cat > file`) for binary uploads instead of Paramiko SFTP.
- **Runtime Directories:** Must exist with `777` permissions: `frontend/runtime/`, `frontend/web/assets/`, `backend/runtime/`, `backend/web/assets/`, `console/runtime/`.

### Admin Panel Access
- **URL:** `https://edata.com.ng/office`
- **Admin Users (from DB):**
  - `anastukur008@gmail.com` (id=210, type=admin)
  - `alkadismohammed@gmail.com` (id=211, type=admin)
  - `iu9410540@gmail.com` (id=213, type=admin)

---

## 🛠️ Remote Diagnostics & SSH Troubleshooting Guide

If another tab or session is having difficulty accessing Hostinger SSH or running commands, follow this guide:

### 1. Direct SSH Connection Info
Run this command from your terminal:
```bash
ssh dev@92.112.192.11
```
When prompted, paste the password:
```text
49nf;&n^#Hs]{jhV
```

### 2. Tail the Production Error Logs
Once connected via SSH, run this command to inspect the latest errors on the live site:
```bash
tail -n 100 /home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log
```
Or filter for errors only:
```bash
grep -n -B 5 -A 25 '\[error\]' /home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log | tail -n 50
```

### 3. Check PHP Syntax/Lint Remotely
To test if a file has a syntax error on production without loading it in the browser:
```bash
php -l /home/dev/web/edata.com.ng/public_html/frontend/views/airtime-data/buy-data.php
```

### 4. Direct Python/Paramiko Debugging Script (Run locally)
If you cannot run an interactive terminal because of password prompts, save the following script as `scratch/ssh_run.py` on your local workspace and run `python scratch/ssh_run.py`. It uses Paramiko to run any command cleanly and outputs stdout/stderr:

```python
import paramiko
import sys

def main():
    host = "92.112.192.11"
    port = 22
    username = "dev"
    password = r"49nf;&n^#Hs]{jhV"

    # Define your remote command here!
    command = "tail -n 50 /home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log"

    print(f"Connecting to Hostinger to execute: {command}")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port, username, password, timeout=30)
        stdin, stdout, stderr = ssh.exec_command(command)
        
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out:
            print("--- STDOUT ---")
            print(out)
        if err:
            print("--- STDERR ---")
            print(err)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
```

### 2026-07-21
- **Profile Photo Upload & Complete Profile Fix:**
  - Added migration `m260721_120000_add_photo_to_profile` adding `photo VARCHAR(255) DEFAULT NULL` to the `profile` table.
  - Updated `Profile` model (`common/models/Profile.php`) with `'photo'` attribute rules and labels.
  - Updated `SiteController::actionCompleteProfile()` and `AccountController::actionIndex()` to handle profile image uploads via `UploadedFile::getInstanceByName('photo')` and save files into `@frontend/web/uploads/profiles/`.
  - Added `enctype="multipart/form-data"` form attributes, round photo preview circles, camera button pickers, and client-side FileReader image preview JavaScript in `frontend/views/site/complete-profile.php` and `frontend/views/account/index.php`.
- **Google OAuth Error 401 Debugging:**
  - Diagnosed `Error 401: invalid_client` ("The OAuth client was not found") caused by placeholder Google Client ID (`518586633606-apiauth325212.apps.googleusercontent.com`) in `common/config/params.php`.
  - Documented requirement for real Google Cloud Console OAuth 2.0 Web Client ID in `implementation_plan.md`.
- **Complete Notification System (Admin Module + REST API + Mobile Client):**
  - Database schema: `m260721_130000_create_notification_tables.php` creating `notification` and `user_notification_read` tables.
  - ActiveRecord models: `Notification.php` (with `findForUser($user)` and `getUnreadCountForUser($user)`) and `UserNotificationRead.php`.
  - Admin module: `NotificationController.php` with `index` and `create` actions supporting recipient groups (All Users, Basic Users, Referred Users, Premium Users, Sub Admins, Individual User) and image uploads. Views in `backend/views/notification/` and "Notification Desk" added to `sidebar.php`.
  - REST API: `actionNotifications` (`GET /api/notifications`) and `actionMarkNotificationRead` (`POST /api/notifications/read`) in `ApiController.php`.
  - Mobile client: Updated header bell icon in `MobileSimulator.tsx` to open dedicated Notifications view with unread badge counter. Created Notifications view with filter pills (All, Unread), notification cards, mark all read, and detail BottomSheet modal. Added API methods in `api.ts` and `AppNotification` interface in `types.ts`.
- **Forgot Password, Forgot Transaction PIN & Email Delivery Audit & Deployment:**
  - Added missing `actionResetPassword()` REST API endpoint in `ApiController.php` allowing mobile clients to complete password reset via 6-digit email OTP codes.
  - Updated `PasswordResetRequestForm.php` to prevent PHP fatal null-pointer exception on profile lookup and standardized sender email parameters.
  - Added `resetPassword()` in `api.ts` and upgraded `MobileSimulator.tsx` Forgot Password modal to a complete 2-step flow (Request 6-digit OTP code -> Verify OTP & Set New Password).
  - Deployed modified files to live server via SSH and verified 0 syntax errors.

### 2026-07-22
- **Mobile App Authentication & OTP Registration Flow Refactoring:**
  - Enforced OTP verification **strictly during first-time account registration** (`signupRequest`, `signupVerify`, `signupComplete`).
  - Streamlined standard logins to require **email and password** (or Google OAuth) only, removing intrusive OTP prompts.
  - Updated `actionSignupComplete()` in `ApiController.php` to validate 6-digit OTP codes against server Yii cache (`signup_otp_<md5(email)>`) before creating accounts, closing endpoint bypass loopholes.
  - Saved user `firstname`, `lastname`, and `phone` into `Profile` upon registration completion.
- **REST API CORS & Preflight OPTIONS Routing:**
  - Added `'on beforeSend'` response event handler in `frontend/config/main.php` to automatically attach CORS headers (`Access-Control-Allow-Origin: *`) and format error responses as JSON across all API endpoints.
  - Fixed preflight `OPTIONS` routing in `urlManager` by adding explicit routes for `api/<action>`, `api/login`, `api/signup`, `api/google-auth`, etc., at the top of `urlManager.rules`.
  - Set `Yii::$app->user->enableSession = false;` and `Yii::$app->user->loginUrl = null;` in `ApiController::beforeAction()` to prevent REST API Bearer token authentication failures from redirecting to `/site/login` HTML pages.
- **Google OAuth REST API Route & Exception Handling:**
  - Fixed `POST api/google-auth` 500 error by adding top-level `urlManager` routing rules (`POST api/google-auth`, `OPTIONS api/google-auth`, `POST frontend/web/api/google-auth`).
  - Wrapped `actionGoogleAuth()` in `ApiController.php` with a `try-catch` exception handler and safe IP address resolution (`Yii::$app->request->userIP`).
  - Verified live endpoint with preflight `200 OK` and POST success JSON output (`{"success": true, ...}`).
- **KatPay Gateway & Manual Deposit Integration:**
  - Integrated KatPay payment gateway (`actionKatpayInit`, `actionKatpayGenerateVirtualAccount`, `katpay-webhook.php`) and manual wallet deposit submission (`actionManualDeposit`).
- **Live Deployment & Version Control:**
  - Deployed all updated web controllers, configuration files, and components to Hostinger live server (`92.112.192.11`).
  
- **Database Collation & KatPay Account Cleanup:**
  - Fixed MySQL 1271 Illegal Mix of Collations in `TransactionController.php` by adding explicit `CONVERT(column USING utf8mb4) COLLATE utf8mb4_unicode_ci` to UNION query string columns.
  - Created migration `m260722_165000_delete_old_katpay_virtual_accounts.php` to delete obsolete KatPay virtual account records from `user_virtual_account`.
  - Disabled automatic KatPay virtual account generation in `WalletController.php`.
- **Live Server Database Configuration & Deployment:**
  - Added `/common/config/main-local.php` to `.gitignore` and updated server `deploy.sh` to preserve production database credentials (`dev_airtime_to_cash`).
- **Web Navigation, Sidebar, Logo & Session Locking:**
  - Registered jQuery event handlers for `[data-toggle="aside"]` mobile sidebar toggle (`-translate-x-full` ↔ `translate-x-0`), backdrop overlay, and accordion dropdowns in `frontend/views/layouts/main.php`.
  - Replaced broken logo image paths in `header.php`, `main-index.php`, and `main-login.php` with `Yii::$app->request->baseUrl . '/images/logo.png'`.
  - Added favicon link tags in `main.php` and copied `favicon.ico` to root.
  - Locked user sessions across web pages by removing hardcoded `'baseUrl' => '/edata'` in `frontend/config/main.php` and setting cookie `'path' => '/'` and `'httpOnly' => true`.
- **Clean Base URL Resolution & Route Pollution Fix:**
  - Configured `'baseUrl' => ''` (empty string) under the `request` component in `frontend/config/main.php`.
  - Removed faulty wildcard rule `'OPTIONS api/<controller:[\w-]+>/<action:[\w-]+>' => '<controller>/<action>'` from `urlManager` which was hijacking standard web routes (such as `site/logout` and `dashboard/index`) and prefixing `api/` to web URLs.
  - Restricted `Response::FORMAT_JSON` conversions in `on beforeSend` exclusively to `ApiController` actions or explicit JSON requests, ensuring standard web error pages render clean HTML layouts.
- **REST API Dashboard Summary Endpoint (`actionDashboard`):**
  - Added `actionDashboard()` to `ApiController.php` returning user details, wallet balance, active virtual accounts, recent transactions, and service categories as JSON.
  - Added browser detection in `actionDashboard()` to redirect direct web browser accesses to `/dashboard`.
- **Session Redirect Sanitation:**
  - Sanitized `redirectUrl` in `SiteController.php` after authentication to strip out any `/api` routes from user session cookies.
- **Google Sign-In Direct Dashboard Landing & Profile Data Auto-Extraction:**
  - Removed forced intercept and hard redirects to `/complete-profile` in `OnboardingFilter.php`. Logged-in users now land directly on the Dashboard upon authentication.
  - Updated `SiteController::actionGoogleAuth()` and `ApiController::actionGoogleAuth()` to automatically extract Google Profile Photo (`picture`), First Name (`given_name`), Last Name (`family_name`), and Email (`email`) and save them to the user's `Profile`.
  - Updated Mobile App (`MobileSimulator.tsx`) Google OAuth callback to set `currentScreen = 'app'` and navigate directly to the Dashboard screen with Google profile details.
- **Deferred Transaction PIN Creation (Web & Mobile):**
  - Removed mandatory Transaction PIN creation from initial registration and sign-in.
  - Deferred PIN setup to the user's **first financial transaction or purchase** attempt (Airtime, Data, Cable, Electricity, A2C, Exam Cards). A 4-digit PIN setup modal prompts the user to create a PIN before finalizing the transaction.
- **Full Production Deployment & Repository Synchronization:**
  - Deployed updated controllers (`ApiController.php`, `SiteController.php`, `OnboardingFilter.php`) to Hostinger live server (`92.112.192.11`).
  - Synchronized Git repositories for Web (`https://github.com/mubarakkasimmaishanu/edata.git`) and Mobile (`https://github.com/mubarakkasimmaishanu/edata-.git`).

### 2026-07-23
- **cPanel & Hostinger GitHub Actions Deployment Pipeline:**
  - Designed and configured automated cPanel deployment pipelines via `.github/workflows/deploy.yml`.
  - Configured git ignore and deployment synchronization rules to preserve live environment database configurations (`common/config/main-local.php`) and upload directories.
- **Paramiko Remote Server Diagnostics & Self-Healing Utilities:**
  - Built non-interactive Python SSH helper scripts (`scratch/fetch_recent_errors.py`, `scratch/fetch_error_log.py`, `scratch/fix_server_now.py`) to stream live Yii2 app logs (`frontend/runtime/logs/app.log`) and trigger un-attended database migrations (`php yii migrate --interactive=0`).
- **Debugging & Self-Skill Guidelines Update:**
  - Updated project `Skills/Debug.md` and `Skills/Remember.md` with guidelines covering MySQL 1271 collation resolution, Paramiko remote log extraction, cPanel CI/CD pipelines, and deferred transaction PIN checkout handling.
- **Hostinger Native Mailer & Real OTP Email Delivery:**
  - Fixed `Name or service not known` mailer connection error by setting `'scheme' => 'native'` in `common/config/main-local.php` on live server. Real 6-digit OTP verification codes are now sent instantly to user email addresses.
- **Mobile Registration OTP Sandbox Fallback Cleanup:**
  - Removed `Sandbox OTP Code: 123456` toasts and `apiStatus === 'connected'` gates in `MobileSimulator.tsx` and `AuthPage.tsx`. Registration invokes `api.signupRequest` directly to trigger live mailer delivery.
- **CORS Preflight & Browser 401 Error Resolution:**
  - Resolved CORS preflight redirects via wildcard OPTIONS routing in `frontend/config/main.php`.
  - Added pre-flight token check in `src/services/api.ts` to prevent red 401 console errors in browser DevTools.
- **Google Auth MySQL 1364 Null Default Constraint Migration:**
  - Created and ran migration `m260723_190000_make_profile_fields_nullable` altering `phone`, `firstname`, and `lastname` in `profile` to `NULL DEFAULT NULL`.
- **Full Live Server Deployment & Repository Synchronization:**
  - Live Hostinger environment (`92.112.192.11`) updated.
  - Synchronized GitHub repositories for Web (`4ed252d`) and Mobile (`c4c9295`).
- **KatPay Encrypted Secret Key Database Column Expansion:**
  - Fixed `SQLSTATE[22001]: Data truncation: 1406 Data too long for column 'katpay_secret_key'` by altering `katpay_secret_key` and `katpay_public_key` in table `setting` to `TEXT` type on both local and live Hostinger MariaDB databases. Created migration `m260723_200000_expand_katpay_key_columns.php`.
- **KatPay Controller Reference Variable Fix:**
  - Replaced undefined `$model->reference` with `$reference` in `ApiController::actionKatpayInit()`. Verified live endpoint `POST https://edata.com.ng/api/katpay-init` returns `200 OK` with valid `checkout_url`.
- **Admin User List Query LEFT JOIN Refactoring:**
  - Updated `UserController::actionLoadUsers()` in `backend/controllers/UserController.php` from `FROM user, profile` to `LEFT JOIN profile ON user.id = profile.user_id` so registered users without profile rows are not hidden from the Admin Panel.

### 2026-07-26
- **Google Play Store Publishing & Package Name Alignment (`com.edata.app`)**:
  - Aligned package name (`applicationId`) across all mobile configurations (`capacitor.config.ts`, `android/app/build.gradle`, `strings.xml`, `MainActivity.java`) to `com.edata.app` to match the existing live app on Google Play Store (`https://play.google.com/store/apps/details?id=com.eDATA.app`).
  - Bumped `versionCode` to `2` and `versionName` to `"1.0.1"` in `android/app/build.gradle`.
- **Release Signing & Keystore Reset Certificate Setup**:
  - Configured release `signingConfigs` in `android/app/build.gradle` pointing to generated keystore `edata-release-key.jks` (`edata-key-alias`).
  - Generated public upload certificate `upload_certificate.pem` at `android/app/upload_certificate.pem` using `keytool` for Play Console upload key reset.
  - Protected `*.jks` and `*.keystore` inside `.gitignore`.
- **Adaptive Launcher Icons & Manifest Security**:
  - Added adaptive launcher icon XML files `ic_launcher.xml` and `ic_launcher_round.xml` in `android/app/src/main/res/mipmap-anydpi-v26/`.
  - Set `android:allowBackup="false"` in `AndroidManifest.xml` for financial app compliance.
  - Purged unused `@google/genai` dependency from `package.json` to prevent unnecessary Play Store data safety questions.
- **In-App Compliance Screens (Mobile App)**:
  - Created `PrivacyTerms.tsx` component adhering strictly to the eData sky-blue color palette.
  - Created `DeleteAccount.tsx` component with 2-step password verification, warning notice, loading indicator, and error/success messaging.
  - Added `deleteAccount(password)` method to `api.ts` calling `/api/delete-account`.
  - Integrated Privacy Policy, Terms of Service, and Delete Account navigation options into `MobileSimulator.tsx`.
- **Public Web Compliance Pages & REST API Endpoint (Web Backend)**:
  - Added REST API action `actionDeleteAccount` to `ApiController.php` validating password, deactivating user account (`status = User::STATUS_BLOCKED`), revoking auth key, and logging activity.
  - Created public web Privacy Policy page `frontend/views/site/privacy-policy.php` (`https://edata.com.ng/privacy-policy`).
  - Created public web Account Deletion page `frontend/views/site/delete-account.php` (`https://edata.com.ng/delete-account`).
  - Added `SiteController::actionDeleteAccount()` handling POST form requests, deactivating accounts, logging activity, setting flash messages, and redirecting cleanly to `/site/login`.
  - Refactored `delete-account.php` to strictly match the sky-blue design system (`bg-sky-50 text-sky-600`, `focus:ring-sky-500`, `bg-sky-600 hover:bg-sky-700 text-white`).
- **Yii2 urlManager Route Resolution Fix**:
  - Added explicit routes in `frontend/config/main.php` for `'privacy-policy' => 'site/privacy-policy'`, `'delete-account' => 'site/delete-account'`, `'POST api/delete-account' => 'api/delete-account'`, and `'OPTIONS api/delete-account' => 'api/delete-account'`.
  - Resolved issue where unmapped URLs defaulted to fallback rules and redirected to the home login page (`/site/login`). Verified live HTTP 200 OK responses with 0 redirects.
- **Full Production Deployment**:
  - Committed and pushed changes to GitHub `main` for both `edata-mobile` and `edata`.
  - Deployed live to Hostinger server (`92.112.192.11`) and verified 0 PHP syntax errors.
- **Digital Asset Links Deployment (`.well-known/assetlinks.json`)**:
  - Published Android Digital Asset Links file at `frontend/web/.well-known/assetlinks.json` mapping package `com.eDATA.app` with SHA-256 fingerprint `55:8A:6B:ED:FC:D9:DF:9F:D6:3F:74:4F:90:BF:49:B2:90:09:36:18:1E:A4:08:A7:A7:24:26:59:AE:36:96:34` for App Links and Play Console domain verification. Tested live URL `https://edata.com.ng/.well-known/assetlinks.json` (200 OK).
- **Play Console Upload Key Reset Permission Audit**:
  - Identified that Upload Key Reset in Play Console requires logging in with the **Account Owner email** (or an account with "Manage app signing keys" permission) to unlock the `🔒 You need permission` gate.

### 2026-07-27
- **Production Google OAuth 2.0 Native & Cryptographic Integration (Phases 0, 1, 2, 3, 4 Completed & Deployed Live)**:
  - **Backend Cryptographic ID Token Verification**: Overhauled `ApiController::actionGoogleAuth()` using official `google/apiclient` (`Google_Client->verifyIdToken()`). Enforces cryptographic token validation against Web Client ID `518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com`, checking signature, `aud`, `iss`, `exp`, and `email_verified`. Completely removed legacy mock UI and raw email parameter fallbacks.
  - **Database Migration**: Applied migration `m260727_110000_add_google_auth_to_user_table` adding `google_id` (`VARCHAR(255) NULL UNIQUE`) and `auth_provider` (`VARCHAR(50) NOT NULL DEFAULT 'email'`) to `user` table. Updated `User` model rules in `common/models/User.php`.
  - **Native Capacitor Plugin Integration**: Integrated `@codetrix-studio/capacitor-google-auth` (`v3.4.0-rc.4`) into `edata-mobile`. Configured `plugins.GoogleAuth` in `capacitor.config.ts`, added `server_client_id` string resource to `android/app/src/main/res/values/strings.xml`, and registered `com.edata.app` deep-link intent filters in `AndroidManifest.xml`.
  - **Vercel CI/CD Build Resolution**: Created `.npmrc` with `legacy-peer-deps=true` in `edata-mobile` root to resolve Vercel automated build `npm install` peer dependency locks.
  - **Hostinger Live SSH Deployment & Live DB Migration**: Uploaded Phase 2 files (`ApiController.php`, `User.php`, `m260727_110000_add_google_auth_to_user_table.php`) to Hostinger production server via SSH, verified PHP syntax (`php -l`), executed `php yii migrate/up` on live database (`3 migrations applied`), and verified live endpoint `https://edata.com.ng/api/google-auth` returns cryptographic verification output (`Google Auth verification failed: Wrong number of segments`).
  - **KatPay Webhook & Financial Ledger Synchronization Fix (End-to-End)**:
    - **Atomic Webhook Updates**: Updated `frontend/web/katpay-webhook.php` and `WalletController::actionKatpayWebhook()` to run inside a single `Yii::$app->db->beginTransaction()`, updating `DepositHistory` (`STATUS_SUCCESSFUL`), `Wallet` balance, `ActivityLog`, and generating in-app `Notification` (`GROUP_INDIVIDUAL`).
    - **Reference Clipping Safety**: Added `substr($reference, 0, 30)` to prevent string truncation failures on `deposit_history.reference` (`VARCHAR(30)`).
    - **REST API Parity**: Updated `ApiController::actionTransactions()` to perform a `UNION ALL` combining purchases (`transaction`) and deposits (`deposit_history`). Pre-created `STATUS_PENDING` deposit records in `actionKatpayInit()`.
    - **Admin Ledger Query Fix**: Refactored `DepositController.php` (`actionLoadPendingDeposit`, `actionLoadDepositHistory`) and `TransactionController.php` (`actionLoadTransactions`) to use `LEFT JOIN profile` and `LEFT JOIN user` instead of implicit inner joins (`FROM ..., profile WHERE ...`). Users created without profile rows (e.g. Google Sign-In or quick registration) now render reliably in the Admin Panel.
    - **DepositHistory CLI Session Safety**: Updated `DepositHistory::updatePayment()` to safely fall back `approved_by` and `user_id` (`(Yii::$app->user && !Yii::$app->user->isGuest) ? Yii::$app->user->id : $model->created_by`) when executed from CLI or automated scripts without an active web session.
    - **Admin Dashboard Recent Transactions Table**: Updated `SiteController::actionIndex()` and `backend/views/site/index.php` to query both `transaction` and `deposit_history` via `UNION ALL`. Existing and future deposit transactions now render under Recent Transactions on `https://edata.com.ng/office` with blue `Wallet Funding` badge tags.
    - **Admin Dashboard Total Payment Stat Box**: Updated `$totalPayment` calculation in `SiteController.php` to sum both successful wallet deposits (`deposit_history`) and purchase transactions (`transaction`), displaying **₦1,100.00** total platform payment volume.
    - **Full Production Deployment**: Pushed commit `defb4ab` / `dc00271` to GitHub `main` and deployed live to Hostinger server (`92.112.192.11`). Verified 0 syntax errors with `php -l`.
  - **Google Play Version Code & Name Increment (`versionCode 8`, `versionName 2.2.0`)**:
    - **Root Cause of Rejection**: Google Play Console active release history showed `7 (2.1.0)`. Rejections occurred because `android/app/build.gradle` was previously set to `versionCode 2`.
    - **Resolution**: Bumped `versionCode` from `2` to `8` and `versionName` from `1.0.1` to `2.2.0` in `android/app/build.gradle`. Updated `package.json` to `"version": "2.2.0"`. Rebuilt web bundle (`npm run build`) and synced native assets (`npx cap copy android`).


- **Dynamic Header Membership Badge (`edata-mobile`)**:
  - Added a compact, dynamic **Account Type Badge** (`PREMIUM`, `REFERRED`, `BASIC`) around the profile avatar in the dashboard header in `MobileSimulator.tsx`.
  - Automatically synced with backend REST API `/api/profile` (`user.level_label`). Tapping avatar/badge navigates directly to user Profile screen.
- **Simplified 3-Tier API Configuration Architecture (`backend/views/configuration/api.php`)**:
  - Redesigned `api.php` and `ConfigurationController::actionApi` to strictly follow 3-tier API routing architecture:
    - **API 1 (Universal Default)**: Handles Airtime, Data, Cable TV, Electricity, and Exam Pins.
    - **API 2 (Dedicated Data Provider)**: Specialized tunnel / failover provider for Data services.
    - **API 3 (Granular Plan Overrides)**: Plan-specific provider for Data only, featuring real-time plan search filter & checkboxes mapping to `data_plan.api_priority`.
- **Dedicated Payment Gateways Admin Page & Sidebar Link**:
  - Created `backend/views/configuration/payment.php` to house Paystack & Katpay Gateway Settings and Vending Operation Modes separately from VTU Vending API routing.
  - Added **Payment Gateways** link to `backend/views/layouts/sidebar.php` under **API Config**.
  - Preserved existing Katpay credentials (`pk_live_9cXQRb5JX4ONUbPTbqpQ2CiQi2`, secret key, merchant ID).
- **Database Migration & Auto-Seeding of 73 SirpData Data Plans**:
  - Migration `m260727_190000_add_plan_type_to_data_plan_table` added `plan_type` column (`SME`, `SME2`, `DATA-SHARE`, `CG`, `DIRECT-GIFTING`) to `data_plan` table on Hostinger production DB.
  - Auto-seeded 73 SirpData data plans across MTN, Airtel, Glo, and 9mobile into `data_plan` table with tier pricing (`selling_price`, `referred_price`, `premium_price`) mapped to API 1 (`api_priority = 1`).
- **Mobile App Data Package UI Overhaul (`edata-mobile`)**:
  - Added Data Type Filter Pills (`ALL`, `SME`, `CG`, `GIFTING`, `SME2`, `DATA-SHARE`) to filter plans in real-time.
  - Enhanced package selector options to include plan type tags (`[SME]`, `[CG]`, `[DIRECT-GIFTING]`).
  - Added Selected Package Detail Preview Banner displaying full plan name, duration, plan type badge, and user tier rate (`₦1,300.00`).
- **SirpData Live Connection Audit & Standardized Endpoints**:
  - Verified live HTTP 200 OK connection against `https://www.sirpdata.com/api/balance` returning authenticated user account (`bukesterisrael@gmail.com`).
  - Standardized all Priority 1 API Config records to `https://www.sirpdata.com/api/` with `Token` authentication header (`Authentication: Token <key>`).
- **Full Production Deployment**:
  - Committed (`c0fedfa` in `edata` and `46e969a` in `edata-mobile`) and pushed to GitHub `main` branches.
  - Live deployed to Hostinger server (`92.112.192.11`) and Vercel (`https://edata-chi.vercel.app`).

- **Android APK Build & Play Store Optimization**:
  - **Play Store Guide Created (`Skills/PlayStore.md`)**: Documented versioning rules (`versionCode 8`, `versionName 2.2.0`), JDK/Capacitor compatibility matrix, configuration files, error resolution patterns, and Play Console submission steps.
  - **Java 17 & Capacitor 6 Downgrade Alignment**: Fixed `invalid source release: 21` error by downgrading Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) to `6.2.0`, AGP to `8.2.1`, and Gradle wrapper to `8.5` to align with installed OpenJDK 17.
  - **JCenter Dead Repository Resolution**: Replaced dead `jcenter()` repository links with `mavenCentral()` in `@codetrix-studio/capacitor-google-auth/android/build.gradle` and root `build.gradle`.
  - **Adaptive Launcher Icon Linking Fix**: Fixed AAPT linking crash (`ResourceNotFoundException`) by updating `ic_launcher.xml` and `ic_launcher_round.xml` background drawable paths (`@drawable/ic_launcher_background`).
  - **Successful Release Build**: Generated crash-free release APK (`app-release.apk`, `4.52 MB`, `versionCode 8`) at `c:\Users\MY PC\Desktop\edata-mobile\android\app\build\outputs\apk\release\app-release.apk`.
- **Hostinger Production DB Credential Restoration & Native Sendmail Transport Integration**:
  - **Database Access Denied Fix**: Restored Hostinger MariaDB production credentials (`mysql:host=127.0.0.1;dbname=dev_airtime_to_cash`, user `dev_airtime_to_cash`, password `Airtime_to_cash1?`) in `/home/dev/web/edata.com.ng/public_html/common/config/main-local.php` following a temporary overwrite with local development credentials (`root` with no password). Verified database connection (`HOSTINGER_PROD_DB_OK: User count = 18`).
  - **Native OTP Mailer Transport**: Updated `common/config/main-local.php` to use Hostinger native sendmail transport (`'dsn' => 'sendmail://localhost'`). Fixes external SMTP authentication blocks (`535 5.7.8 Error: authentication failed`) and delivers 6-digit OTP verification emails directly to Gmail inboxes instantly with 0 errors.
- **Firebase Console & Native Google OAuth 2.0 Android Setup**:
  - Registered both **Debug SHA-1** (`0D:6E:9B:44:6A:FB:00:CC:A3:A8:EB:7A:5E:EE:0A:75:27:46:69:84`) and **Release Upload SHA-1** (`54:2F:0E:76:32:BF:AF:66:FA:D4:1B:49:04:21:47:C7:D0:8C:72:FB`) under app `com.edata.app` in Firebase Console (`saukiglobal-8ab14`).
  - Saved `google-services.json` into `android/app/google-services.json` and verified Gradle plugin auto-detection (`com.google.gms.google-services`).
- **Mobile React Date Parsing (`Invalid Date`) Resolution**:
  - Created `safeFormatDate` helper in `MobileSimulator.tsx` to handle ISO dates, space-separated dates, and pre-formatted string dates. Updated Transaction Details BottomSheet modal, transaction history list items, PDF receipt generator, and copy receipt clipboard function.
- **Web & Mobile End-to-End Functional & Business Logic Synchronization**:
  - **Airtime Tier Pricing & Minimum Validation**: Updated `ApiController::actionPurchase()` to calculate airtime cost using the user's membership tier discount percentage rate ($payableAmount = amount \times \frac{effectiveRate}{100}$) matching `AirtimeDataController.php`, and enforced the ₦50 minimum amount check.
  - **Exam Scratch Pins Multi-Quantity Vending**: Updated `ApiController::actionPurchase()` and `ExamPins.tsx` to support quantity ($Q \ge 1$), pass $Q$ to the SIRP `educational-pins` API payload, and loop creation of $Q$ distinct `ExamScratchCard` records in the database.
  - **Electricity Minimum Amount Enforcement**: Updated `ApiController::actionPurchase()` to validate the ₦500 minimum threshold for electricity bill purchases.
  - **Reseller Account Upgrade Parity**: Synchronized `actionUpgrade` in `ApiController.php` to set `UpgradeRequest` status to `STATUS_PENDING`, keeping the fee deducted while preserving the Web source-of-truth workflow where Superadmin approves requests in the AdminLTE dashboard before elevating user privileges.
- **Google Identity Services (GIS) Web Popup & Dual Token Server Verification**:
  - Switched Web browser Google Sign-In in `AuthPage.tsx` to use Google's official GIS OAuth2 popup client (`google.accounts.oauth2.initTokenClient`), bypassing One Tap 400 Bad Request iframe errors (`accounts.google.com/gsi/issue 400`).
  - Updated `ApiController::actionGoogleAuth` to support dual token cryptographic verification: JWT `id_token` via `Google_Client->verifyIdToken()` for native Android, and `access_token` via Google OAuth `userinfo` API (`https://www.googleapis.com/oauth2/v3/userinfo`) for web popups.
- **Installed Android APK Google Auth Script Injection Isolation**:
  - Isolated native Capacitor `@codetrix-studio/capacitor-google-auth` inside `if (Capacitor.isNativePlatform())` with an early return on failure in `AuthPage.tsx`. Prevents Android WebView from attempting to inject `https://accounts.google.com/gsi/client` script, resolving the red `Failed to load Google Identity Services SDK` toast error in installed APKs.
- **Case-Sensitive Package Name Alignment (`com.eDATA.app`) & Version Code 9 Bump**:
  - Resolved Google Play Console package mismatch error (`Your APK or Android App Bundle needs to have the package name com.eDATA.app`) by updating `applicationId` and `namespace` to `com.eDATA.app` in `build.gradle`, `capacitor.config.ts`, `strings.xml`, and `google-services.json`.
  - Bumped `versionCode` to `9` in `build.gradle` to resolve `Version code 8 has already been used` error.
  - Added `<uses-permission android:name="com.google.android.gms.permission.AD_ID" />` to `AndroidManifest.xml` to satisfy Play Console AD_ID declaration error.
- **Play Console Photo/Video Permissions Declaration & Production Bundle Build**:
  - Built and signed production `.aab` release bundle (`app-release.aab`, `6.5 MB`, `versionCode 9`, `versionName 2.2.0`) with `edata-release-key.jks` (`SHA-1: 54:2F:0E:76:32:BF:AF:66:FA:D4:1B:49:04:21:47:C7:D0:8C:72:FB`).
  - Formulated exact compliant text declaration for Google Play Console Photo & Video permissions policy (`READ_MEDIA_IMAGES`).

- **Phone Network Auto-Detection & Carrier Mapping Component (`PhoneNetworkDetector`)**:
  - Implemented `common/components/PhoneNetworkDetector.php` to resolve Nigerian mobile network prefixes (MTN, Airtel, Glo, 9mobile) automatically from input phone numbers (`0803`, `0802`, `0805`, `0809`, etc.). Sanitizes international formats (`+234...`, `234...`) into standardized 11-digit local numbers.
  - Integrated network auto-detection fallback into `ApiController::actionPurchase` when carrier IDs are missing or mismatched, ensuring accurate carrier lookup for airtime and data purchases.

- **NaijaResultPins Exam Card Provider Integration**:
  - Integrated `NaijaResultPins` as the default provider for Exam Scratch Cards (WAEC, NECO, NBAIS, NABTEB) in `common/components/VendingService.php`.
  - Synchronized exam pin vending across the mobile client and backend REST API.

- **Plan Type Management & Tier Auto-Pricing**:
  - Created `PlanType` model (`common/models/PlanType.php`) and Admin CRUD controller (`backend/controllers/PlanTypeController.php`) for dynamic Data Plan Type management (`SME`, `SME2`, `CG`, `DIRECT-GIFTING`, `DATA-SHARE`).
  - Integrated percentage-based discount tier auto-pricing in `DataPlan` form (`backend/views/data-plan/_form.php`), dynamically computing `Basic`, `Referred`, and `Premium`/`Reseller` prices from baseline cost. Made `bundle_id` optional for custom manual data plans.

- **Location & Telecom Carrier Detection (`GeoHelper` + MaxMind GeoIP2)**:
  - Added `GeoHelper` component (`common/components/GeoHelper.php`) with MaxMind GeoIP2 integration for zero-permission location and telecom carrier detection.

- **Marketing Hierarchy Official Role Title Standardization**:
  - Standardized marketing role titles across backend models and views to official names: **GA** (Growth Associate), **GAS** (Growth Associate Supervisor), **SBM** (State Business Manager), **RGD** (Regional Growth Director), and **NBD** (National Business Director).

- **Support Contact REST API Sync**:
  - Extended `/api/config` (`actionConfig`) in `ApiController.php` to sync `support_phone` and `support_email` from website configuration settings directly to the mobile application.

- **Mobile Client Enhancements (`edata-mobile`)**:
  - Dedicated `ServiceForm.tsx` components for Airtime, Data, Cable TV, Electricity, and Exam Pins with contact picker integration and promo code support.
  - Dedicated **Reseller Upgrade Details** page (`ResellerUpgrade.tsx`) featuring side-by-side tier comparison matrix, discount rate sheets, profit calculator, perks, and FAQs.
  - Enhanced **Transaction Details Modal**: 1-tap reference copying, status banners, direct WhatsApp issue reporting links (`https://wa.me/...`), and retry purchase capabilities.
  - Android Autofill & Google Password Manager support with standard form attributes (`autocomplete="username"`, `autocomplete="current-password"`).
  - Capacitor App lifecycle management and updated Android release assets (`eData-v2.2.0-release.apk`).

- **Live Hostinger Deployment Script (`scratch/deploy_to_hostinger_live.py`)**:
  - Updated SSH Paramiko deployment script (`scratch/deploy_to_hostinger_live.py`) with updated checkout target directories, automatic database migrations (`php yii migrate --interactive=0`), and PHP syntax checking (`php -l`).









