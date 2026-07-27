import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edata.app',
  appName: 'eData',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
