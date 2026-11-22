import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eDATA.app',
  appName: 'eData',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  },
  plugins: {
    // Live (OTA) updates served by our own backend: `npm run build:web` publishes
    // a bundle, installed apps download it in the background and switch on next open.
    // Managed in Admin > App Version > Live Updates.
    CapacitorUpdater: {
      autoUpdate: true,
      updateUrl: 'https://edata.com.ng/api/ota-update',
      statsUrl: '',
      channelUrl: '',
      appReadyTimeout: 15000,
      responseTimeout: 30,
      resetWhenUpdate: true,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '452311037053-nqv6g7b0jhn0iv703jed97fbuhf1n14v.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: false,
      splashImmersive: false
    }
  }
};

export default config;
