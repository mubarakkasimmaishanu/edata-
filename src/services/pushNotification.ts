import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { api } from './api';

let isInitialized = false;

export async function initPushNotifications(
  onNavigate?: (view: string) => void,
  toast?: { info: (msg: string) => void; success: (msg: string) => void }
) {
  if (!Capacitor.isNativePlatform()) {
    // Push notifications via Capacitor are native-only (Android/iOS)
    return;
  }

  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    // 1. Check & Request Permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission was not granted:', permStatus.receive);
      return;
    }

    // 2. Create High-Priority Android Notification Channel
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'edata_main_channel',
          name: 'eData Alerts',
          description: 'Transaction and service updates',
          importance: 5, // High priority (heads-up pop-up & sound)
          visibility: 1,
          sound: 'default',
          vibration: true,
          lights: true,
        });
      } catch (channelErr) {
        console.warn('Failed to create Android notification channel:', channelErr);
      }
    }

    // 3. Register with Apple / Google APNs/FCM
    await PushNotifications.register();

    // 3. Listen for device token
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, device token:', token.value);
      try {
        localStorage.setItem('edata_push_token', token.value);
        await api.registerPushToken(token.value, Capacitor.getPlatform());
      } catch (err) {
        console.warn('Failed to submit push token to backend:', err);
      }
    });

    // 4. Handle registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error: ', JSON.stringify(error));
    });

    // 5. Handle foreground push notification received
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received in foreground: ', notification);
      if (toast && notification.title) {
        toast.info(`${notification.title}: ${notification.body || ''}`);
      }
    });

    // 6. Handle notification click / tap action
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed: ', notification);
      const data = notification.notification.data || {};
      const targetView = data.view || data.screen || data.route || 'notifications';

      if (onNavigate) {
        onNavigate(targetView);
      }
    });
  } catch (err) {
    console.error('Error initializing Push Notifications:', err);
  }
}

// Re-register push token on user login if token already exists in storage
export async function syncPushTokenOnLogin() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const savedToken = localStorage.getItem('edata_push_token');
    if (savedToken) {
      await api.registerPushToken(savedToken, Capacitor.getPlatform());
    }
  } catch (err) {
    console.warn('Push token login sync warning:', err);
  }
}
