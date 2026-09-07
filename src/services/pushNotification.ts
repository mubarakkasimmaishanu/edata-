import { registerPlugin, Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { api } from './api';

const NativeNotifier = registerPlugin<{
  notify: (options: { title: string; body: string }) => Promise<void>;
}>('NativeNotifier');

let isInitialized = false;

let lastNotifKey = '';
let lastNotifTime = 0;

/**
 * Triggers a real Android/iOS system tray / status bar notification.
 * Posts directly to the phone's notification bar even when inside the app!
 */
export async function triggerDeviceNotification(title: string, body: string, data?: any) {
  if (!Capacitor.isNativePlatform()) return;
  const key = `${title}::${body}`;
  const now = Date.now();
  if (key === lastNotifKey && now - lastNotifTime < 4000) {
    return;
  }
  lastNotifKey = key;
  lastNotifTime = now;
  try {
    await NativeNotifier.notify({ title, body });
  } catch (err) {
    console.warn('NativeNotifier.notify error:', err);
  }
}

export async function initPushNotifications(
  onNavigate?: (view: string) => void,
  toast?: any
) {
  if (!Capacitor.isNativePlatform()) {
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

    // 3. Register with Google FCM
    await PushNotifications.register();

    // 4. Listen for device token
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, device token:', token.value);
      try {
        localStorage.setItem('edata_push_token', token.value);
        await api.registerPushToken(token.value, Capacitor.getPlatform());
      } catch (err) {
        console.warn('Failed to submit push token to backend:', err);
      }
    });

    // 5. Handle registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error: ', JSON.stringify(error));
    });

    // 6. Handle foreground push notification received -> POST TO PHONE NOTIFICATION BAR
    await PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('Push notification received in foreground: ', notification);
      if (notification.title) {
        await triggerDeviceNotification(
          notification.title,
          notification.body || ''
        );
      }
    });

    // 7. Handle notification click / tap action
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
