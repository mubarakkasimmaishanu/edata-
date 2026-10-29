import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { api } from './api';
import { AppVersionData } from '../types';

export const FALLBACK_APP_VERSION = '2.4.7';
export const DEFAULT_ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.eDATA.app';
export const DEFAULT_IOS_STORE_URL = 'https://apps.apple.com/app/id6740000000';

/**
 * Determine whether the app is running on iOS (via explicit platform hint, Capacitor native runtime, or User-Agent).
 */
export function isIosPlatform(platformHint?: string | null): boolean {
  if (platformHint) {
    const clean = platformHint.trim().toLowerCase();
    if (clean === 'ios') return true;
    if (clean === 'android') return false;
  }
  const capPlat = Capacitor.getPlatform();
  if (capPlat === 'ios') return true;
  if (capPlat === 'android') return false;
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  return false;
}

/**
 * Resolve the appropriate store URL for the active platform (Apple App Store on iOS, Google Play Store on Android).
 */
export function resolveStoreUrl(updateData?: Partial<AppVersionData> | null): string {
  const isIos = isIosPlatform(updateData?.platform);

  if (isIos) {
    const candidate = (
      updateData?.app_store_url ||
      updateData?.store_url ||
      updateData?.play_store_url ||
      DEFAULT_IOS_STORE_URL
    ).trim();

    // Never allow an iOS client to open a Google Play Store or market:// URL
    if (
      !candidate ||
      /play\.google\.com/i.test(candidate) ||
      candidate.toLowerCase().startsWith('market://')
    ) {
      return DEFAULT_IOS_STORE_URL;
    }
    return candidate;
  }

  const androidCandidate = (
    updateData?.market_url ||
    updateData?.store_url ||
    updateData?.play_store_url ||
    DEFAULT_ANDROID_STORE_URL
  ).trim();

  if (
    !androidCandidate ||
    /apps\.apple\.com/i.test(androidCandidate) ||
    androidCandidate.toLowerCase().startsWith('itms-apps://')
  ) {
    return DEFAULT_ANDROID_STORE_URL;
  }

  return androidCandidate;
}

/**
 * Semver comparison utility.
 * Returns -1 if a < b, 0 if a == b, 1 if a > b.
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();
  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

/**
 * Retrieve the current installed application version via Capacitor.
 * Seamlessly falls back to the package version for web/dev environments.
 */
export async function getInstalledAppVersion(): Promise<string> {
  try {
    const info = await App.getInfo();
    if (info && info.version) {
      return info.version.replace(/^v/i, '').trim();
    }
  } catch (err) {
    // In browser dev mode, App.getInfo() might fail or return mock data
  }
  return FALLBACK_APP_VERSION.replace(/^v/i, '').trim();
}

/**
 * Perform version handshake with the backend.
 * Evaluates minimum version, grace period deadline, and days to expire.
 */
export async function checkAppUpdate(platform?: string): Promise<AppVersionData | null> {
  try {
    const activePlatform = platform || (isIosPlatform() ? 'ios' : 'android');
    const version = await getInstalledAppVersion();
    const res: any = await api.getAppConfig(activePlatform, version, true);
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
 * Open the platform-appropriate App Store (Apple App Store on iOS, Google Play Store on Android)
 * or web link cleanly via Capacitor Browser.
 */
export async function openStoreLink(url: string, platformHint?: string | null): Promise<void> {
  if (!url) return;
  let cleanUrl = url.trim();
  const isIos = isIosPlatform(platformHint);

  if (isIos) {
    // On iOS, never redirect to Google Play Store or market:// URIs
    if (
      cleanUrl.toLowerCase().startsWith('market://') ||
      /play\.google\.com/i.test(cleanUrl)
    ) {
      cleanUrl = DEFAULT_IOS_STORE_URL;
    }
  } else {
    // On Android, normalize market:// URI to official Play Store web URL for Capacitor Browser compatibility
    if (cleanUrl.startsWith('market://details?id=')) {
      cleanUrl = cleanUrl.replace('market://details?id=', 'https://play.google.com/store/apps/details?id=');
    }
  }

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
