---
name: edata-vtu-deployment
description: Workflow for building, syncing, and deploying the eData VTU mobile app and Yii2 web backend to GitHub/Hostinger, including Android Capacitor icon assets, PIN flows, and notification sync.
---

# eData VTU System Deployment & Sync Skill

This skill documents the standard end-to-end workflow for building, syncing, and deploying updates across the **eData VTU Mobile App** (`C:\Users\MY PC\Desktop\edata-mobile`) and the **Yii2 PHP Web Backend** (`c:\xampp\htdocs\edata`).

---

## 1. Web Backend (Yii2 PHP) Deployment Workflow

### Workspace Location
`c:\xampp\htdocs\edata`

### Key Controller & Model Files
- **Primary API Controller:** `frontend/controllers/ApiController.php`
- **Notification Model:** `common/models/Notification.php`
- **User Notification Deletion Model:** `common/models/UserNotificationDelete.php`
- **Notification Deletion Migration:** `console/migrations/m260731_180000_create_user_notification_delete_table.php`

### Verification & Push Commands
```powershell
# 1. Check PHP syntax across modified files
php -l common/models/Notification.php; php -l common/models/UserNotificationDelete.php; php -l frontend/controllers/ApiController.php

# 2. Stage, commit, and push to GitHub (auto-triggers Hostinger deployment)
git add .
git commit -m "Refactor notification system: registration date filtering, user notification deletion, and unread count sync"
git push origin main
```

---

## 2. Mobile App (React + Capacitor) Workflow

### Workspace Location
`C:\Users\MY PC\Desktop\edata-mobile`

### Key Components & Files
- **App Entry & Navigation:** `src/App.tsx`
- **API Service Layer:** `src/services/api.ts`
- **Capacitor Config:** `capacitor.config.ts`
- **Full-Screen PIN System:** `src/components/PinInput.tsx`, `src/components/PinScreen.tsx`
- **Notifications Screen:** `src/components/Notifications.tsx`
- **User Dashboard Header:** `src/components/UserDashboard.tsx`
- **Dark Theme System Modals:** `src/components/BottomSheet.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/DeleteAccount.tsx`

### Asset Management (Official Brand Logo)
- **Primary Flower Logo:** `assets/icons/eData.png`
- **App Assets:** `src/assets/edata_logo.png`, `src/assets/edata_web_logo.png`, `public/favicon.ico`, `public/favicon.png`
- **Android Drawables & Launcher Icons:** Overwrite all `splash.png`, `ic_launcher.png`, `ic_launcher_round.png`, and `ic_launcher_foreground.png` across `android/app/src/main/res/` density folders (`drawable`, `drawable-land-*`, `drawable-port-*`, `mipmap-*`).

### Build & Push Commands
```powershell
# 1. Build React production bundle
npm run build

# 2. Stage, commit, and push to GitHub repository
git add .
git commit -m "Refactor PIN flows, popups, brand logos, dark system UI theme, and notification system sync"
git push origin main
```

---

## 3. Hostinger Deployment Details
- **Repository:** `https://github.com/mubarakkasimmaishanu/edata.git` (`main` branch)
- **Auto-Deploy Webhook:** `frontend/web/deploy_git_pull.php`
- **Database Migrations:** When updating DB tables, run Yii2 console migrations (`php yii migrate`) or execute SQL migrations in phpMyAdmin.
