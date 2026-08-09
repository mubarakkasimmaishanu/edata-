---
name: edata-vtu-deployment
description: Workflow for building, syncing, and deploying the eData VTU mobile app and Yii2 web backend to GitHub/Hostinger, including Android Capacitor icon assets, Quick Actions, direct PIN checkout flows, SILVA SUB & NaijaResultPins data plan mappings, phone network prefix detection, plan type auto-pricing, and notification sync.
---

# eData VTU System Deployment & Sync Skill

This skill documents the standard end-to-end workflow for building, syncing, and deploying updates across the **eData VTU Mobile App** (`C:\Users\MY PC\Desktop\edata-mobile`) and the **Yii2 PHP Web Backend** (`c:\xampp\htdocs\edata`).

---

## 1. Web Backend (Yii2 PHP) Architecture & Deployment

### Workspace Location
`c:\xampp\htdocs\edata`

### Key Controller, Model & Component Files
- **Primary REST API Controller:** `frontend/controllers/ApiController.php` 
  - Key Actions: `actionDashboard`, `actionQuickActions`, `actionPurchase`, `actionValidatePromo`, `actionConfig`, `actionNotifications`, `actionDetectNetwork`, `actionKatpayInit`, `actionWallet`.
  - Config Sync: `actionConfig` syncs `support_phone` and `support_email` from `Setting` model to the client.
- **Phone Network Auto-Detection & Carrier Mapping:**
  - Component: `common/components/PhoneNetworkDetector.php` (Auto-detects Nigerian prefixes: MTN `0803`, `0806`, `0703`, `0903`, `0913`...; AIRTEL `0802`, `0808`, `0708`, `0902`...; GLO `0805`, `0807`, `0815`...; 9MOBILE `0809`, `0818`...; strips `+234` / `234` to `080...`).
  - Fallback in `ApiController::actionPurchase`: automatically resolves missing or mismatched network IDs using `PhoneNetworkDetector` before looking up `ServiceType`.
- **Exam Scratch Cards & NaijaResultPins Provider:**
  - Provider integration: `NaijaResultPins` set as default provider for WAEC, NECO, NBAIS, and NABTEB scratch cards in `common/components/VendingService.php`.
- **Plan Type Management & Tier Auto-Pricing:**
  - Model: `common/models/PlanType.php`
  - Admin Controller: `backend/controllers/PlanTypeController.php` (CRUD for Plan Types like `SME`, `SME2`, `CG`, `DIRECT-GIFTING`, `DATA-SHARE`).
  - Tier Auto-Pricing: `common/models/DataPlan.php` and `backend/views/data-plan/_form.php` calculate tier prices (`Basic`, `Referred`, `Premium`/`Reseller`) dynamically using percentage discount inputs. `bundle_id` (API plan ID) is optional for manual custom plans.
- **Location & Telecom Carrier Detection (MaxMind GeoIP2):**
  - Component: `common/components/GeoHelper.php` (Zero-permission location and telecom carrier detection for user sessions).
- **Marketing Hierarchy Role Titles:**
  - Official titles: **GA** (Growth Associate), **GAS** (Growth Associate Supervisor), **SBM** (State Business Manager), **RGD** (Regional Growth Director), **NBD** (National Business Director).
- **Quick Actions System:**
  - Migration: `console/migrations/m260731_150000_create_quick_action_table.php`
  - Model: `common/models/QuickAction.php`
  - Admin Controller: `backend/controllers/QuickActionController.php`
  - Admin Views: `backend/views/quick-action/` (`index.php`, `_form.php`, `create.php`, `update.php`)
- **Service API Configuration & SILVA SUB Integration:**
  - Model: `common/models/ServiceApiConfig.php`
  - Vending Component: `common/components/VendingService.php`
  - Data Plan Model: `common/models/DataPlan.php`
- **Notification System:** `common/models/Notification.php`, `common/models/UserNotificationDelete.php`

### Live Hostinger Deployment Script
Use SSH Paramiko deployment script at `scratch/deploy_to_hostinger_live.py`:
- **Server IP:** `92.112.192.11` (User: `dev`, Web Root: `/home/dev/web/edata.com.ng/public_html`)
- **Commands Executed:** `git fetch origin && git reset --hard origin/main`, `php yii migrate --interactive=0`, `php -l` linting across modified files.

### Verification & Git Commands
```powershell
# 1. Check PHP syntax across modified backend files
php -l common/components/PhoneNetworkDetector.php; php -l common/components/VendingService.php; php -l common/models/PlanType.php; php -l frontend/controllers/ApiController.php

# 2. Stage, commit, and push to GitHub
git add .
git commit -m "Update Phone Network Detector, NaijaResultPins exam card vending, Plan Type auto-pricing, and REST API support config"
git push origin main

# 3. Execute Hostinger SSH deployment
python scratch/deploy_to_hostinger_live.py
```

---

## 2. Mobile App (React + Capacitor) Architecture & Flow

### Workspace Location
`C:\Users\MY PC\Desktop\edata-mobile`

### Key Components & Features
- **App Entry & Navigation:** `src/App.tsx`
- **API Service Layer:** `src/services/api.ts` (includes `getQuickActions`, `purchase`, `validatePromoCode`, `uploadAvatar`, `getConfig`, `getNotifications`)
- **Dedicated Service Forms & Flows:**
  - `src/components/ServiceForm.tsx`: Unified purchase forms for Airtime, Data, Cable TV, Electricity, and Exam Pins with contact picker integration, operator auto-detection tags, and promo code support.
- **Direct Quick Actions PIN Checkout Flow:**
  - `src/components/UserDashboard.tsx`: Dynamic Quick Action tiles fetched from backend `/api/quick-actions`.
  - `src/components/PinScreen.tsx` / `PinSheet.tsx`:
    - Full-screen PIN authorization overlay preloaded with item title, official network logo image, dynamic tier price, and Promo Code input.
    - Context-aware target inputs: Hidden for Exam Pins, Phone input for Airtime/Data, Smartcard for Cable TV, Meter for Electricity.
- **Reseller Upgrade Details Page:**
  - `src/components/ResellerUpgrade.tsx`: Dedicated upgrade page featuring side-by-side tier comparison matrix, discount rate sheets, profit calculator, perks, and FAQs.
- **Transaction History & Issue Reporting:**
  - `src/components/TransactionDetailsModal.tsx`: Enhanced modal with status banners, 1-tap reference copy buttons, direct WhatsApp issue reporting links (`https://wa.me/...`), and retry purchase capabilities.
- **Android Integration & Native Assets:**
  - Capacitor App lifecycle management, native Android icons and splash assets (`eData-v2.2.0-release.apk`).
  - Android Autofill & Google Password Manager support with `autocomplete="username"` and `autocomplete="current-password"`.
  - Native Google Auth integration via `@codetrix-studio/capacitor-google-auth`.

### Build & Push Commands
```powershell
# 1. Check TypeScript compilation
npx tsc --noEmit

# 2. Build React production bundle
npm run build

# 3. Commit and push
git add .
git commit -m "Optimize Quick Actions direct PIN checkout flow, context-aware target inputs, Reseller Upgrade page, and Android assets"
git push origin main
```

---

## 3. Hostinger Server & Database Details
- **Production Server IP:** `92.112.192.11`
- **SSH User:** `dev`
- **GitHub Repository:** `https://github.com/mubarakkasimmaishanu/edata.git` (`main` branch)
- **Live Domain:** `https://edata.com.ng`
- **Admin Dashboard:** `https://edata.com.ng/office`
