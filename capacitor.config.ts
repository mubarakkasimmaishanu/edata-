import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edata.mobile',
  appName: 'eData',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
