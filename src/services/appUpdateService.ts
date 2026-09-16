import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { api } from './api';
import { AppVersionData } from '../types';

export const FALLBACK_APP_VERSION = '2.3.14';

/**
 * Retrieve the current installed application version via Capacitor.
 * Seamlessly falls back to the package version for web/dev environments.
 */
export async function getInstalledAppVersion(): Promise<string> {
  try {
    const info = await App.getInfo();
    if (info && info.version) {
      return info.version.trim();
    }
  } catch (err) {
    // In browser dev mode, App.getInfo() might fail or return mock data
  }
  return FALLBACK_APP_VERSION;
}

/**
 * Perform version handshake with the backend.
 * Evaluates minimum version, grace period deadline, and days to expire.
 */
export async function checkAppUpdate(platform: string = 'android'): Promise<AppVersionData | null> {
  try {
    const version = await getInstalledAppVersion();
    const res: any = await api.getAppConfig(platform, version, true);
    if (res && res.success && res.data) {
      return res.data as AppVersionData;
    }
  } catch (err) {
    // Network or server temporarily unreachable; fail gracefully without disrupting the user
    console.warn('[AppUpdate] Failed to verify app version handshake:', err);
  }
  return null;
}

/**
 * Check if the user snoozed flexible update reminders for today.
 */
export function isUpdateSnoozed(targetVersion: string): boolean {
  try {
    const key = `edata_update_snooze_${targetVersion}`;
    const stored = localStorage.getItem(key);
    if (!stored) return false;
    const expiresAt = Number(stored);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

/**
 * Snooze flexible update reminders for 24 hours.
 */
export function snoozeUpdate(targetVersion: string): void {
  try {
    const key = `edata_update_snooze_${targetVersion}`;
    const nextPrompt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(key, String(nextPrompt));
  } catch { }
}

/**
 * Open the Google Play Store or web link cleanly via Capacitor Browser.
 */
export async function openStoreLink(url: string): Promise<void> {
  if (!url) return;
  const cleanUrl = url.trim();

  // Try opening via Capacitor Browser for in-app store overlay / external browser
  try {
    await Browser.open({ url: cleanUrl });
  } catch (err) {
    try {
      window.open(cleanUrl, '_system');
    } catch {
      window.location.href = cleanUrl;
    }
  }
}

/**
 * Direct WhatsApp Customer Care link for update assistance.
 */
export function openUpdateSupport(whatsappNumber: string = '2348030000000', currentVersion: string): void {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(
    `Hello eData Support, I am having trouble updating my mobile app (currently on v${currentVersion}). Please assist me.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${text}`;
  Browser.open({ url: waUrl }).catch(() => {
    window.open(waUrl, '_blank');
  });
}
