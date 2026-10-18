# Team Responsibilities & Work Division

- **API Provider Integration**: Managed exclusively by developer **obasekore** (e.g. `common/components/*Service.php`, provider migrations, API endpoints).
- **Core App Features & UI**: Primary developer handles frontend (React + Capacitor), backend controllers/models, UI/UX, and non-provider feature workflows. Do not initiate or modify API provider integration logic unless requested.

# Architecture & Platform Rule: Mobile as Mirror

- **Mobile Client as Mirror (Final Play Store Build)**:
  - The mobile app (React + Capacitor) is the final ship build to the Play Store and acts strictly as a UI mirror.
  - All future fixes relating to product purchases, pricing, discount calculations, transaction validation, and response data MUST be handled on the backend API (`frontend/controllers/ApiController.php`, models, and components).
  - Do not introduce client-dependent purchase logic or attempt mobile-side fixes for product transactions; all business rules and response payloads must be enforced server-side.

# Android Binary Output Rule (APK & AAB)

- **Original Build Location Only (Never Copy or Duplicate)**:
  - When Android binaries are generated (whether `.apk` via `assembleRelease` or `.aab` / `.abb` via `bundleRelease`), **leave them in their original root build output place**.
  - **DO NOT copy, move, or duplicate** `.apk` or `.aab` files to the project root, Desktop, `frontend/web/downloads/`, or any other folder.
  - Standard original build output locations:
    - Release APK: `android/app/build/outputs/apk/release/app-release.apk`
    - Release AAB Bundle: `android/app/build/outputs/bundle/release/app-release.aab`
