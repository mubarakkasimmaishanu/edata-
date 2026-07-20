# eData Mobile App Suite

The high-fidelity mobile application suite for the eData platform. Configured natively to sync with live backend core endpoints and bundle directly to Android platforms.

## Development Workflow

### Prerequisites
- **Node.js** (v18+)
- **Android Studio** (for building Gradle packages and signing APKs)

### 1. Run the Development Server
Install dependencies and launch the local developer portal:
```bash
npm install
npm run dev
```

### 2. Build Web Distribution Assets
Compile the static web assets inside the `dist/` directory:
```bash
npm run build
```

### 3. Sync and Package with Capacitor
Synchronize compiled production builds into the native Android platform code:
```bash
npm run cap:sync
```

### 4. Open in Android Studio
Open the generated native Gradle project wrapper directly inside Android Studio:
```bash
npm run cap:open
```
Once opened in Android Studio, use **Build > Build Bundle(s) / APK(s) > Build APK** or **Generate Signed Bundle / APK** to package your production release app.
