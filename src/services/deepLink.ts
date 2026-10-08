import { App, URLOpenListenerEvent } from '@capacitor/app';
import { registerPlugin, Capacitor } from '@capacitor/core';

export const PENDING_REFERRAL_KEY = 'edata_pending_referral';
export const PENDING_CLICK_ID_KEY = 'edata_pending_click_id';
export const RAW_INSTALL_REFERRER_KEY = 'edata_raw_install_referrer';

interface InstallReferrerPluginType {
  getReferrerDetails(): Promise<{
    installReferrer?: string;
    clickTimestamp?: number;
    installTimestamp?: number;
    responseCode?: number;
    error?: string;
    success?: boolean;
  }>;
}

const InstallReferrer = registerPlugin<InstallReferrerPluginType>('InstallReferrer');

type ReferralCallback = (code: string) => void;
const referralListeners: ReferralCallback[] = [];

/**
 * Register a listener to be notified whenever a referral code is captured.
 */
export function onReferralCaptured(callback: ReferralCallback): () => void {
  referralListeners.push(callback);
  return () => {
    const idx = referralListeners.indexOf(callback);
    if (idx !== -1) referralListeners.splice(idx, 1);
  };
}

function notifyListeners(code: string) {
  referralListeners.forEach(cb => {
    try {
      cb(code);
    } catch (err) {
      console.warn('Referral listener error:', err);
    }
  });
}

/**
 * Save pending referral code to localStorage
 */
export function savePendingReferral(code: string): string | null {
  if (!code || typeof code !== 'string') return null;
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length > 0) {
    localStorage.setItem(PENDING_REFERRAL_KEY, cleanCode);
    notifyListeners(cleanCode);
    return cleanCode;
  }
  return null;
}

/**
 * Get currently stored pending referral code
 */
export function getPendingReferral(): string | null {
  try {
    return localStorage.getItem(PENDING_REFERRAL_KEY);
  } catch {
    return null;
  }
}

/**
 * Get stored pending click tracking ID
 */
export function getPendingClickId(): string | null {
  try {
    return localStorage.getItem(PENDING_CLICK_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Get raw install referrer string
 */
export function getRawInstallReferrer(): string | null {
  try {
    return localStorage.getItem(RAW_INSTALL_REFERRER_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear pending referral code after successful registration
 */
export function clearPendingReferral(): void {
  try {
    localStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {}
}

/**
 * Extract click_id from raw URL or install referrer query string
 */
export function extractClickIdFromUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    let urlToParse = rawUrl;
    if (urlToParse.includes('%')) {
      try { urlToParse = decodeURIComponent(urlToParse); } catch {}
    }
    const match = urlToParse.match(/(?:[?&]|\b)click_id=([A-Za-z0-9_.-]+)/i);
    if (match && match[1]) return match[1].trim();
  } catch {}
  return null;
}

/**
 * Extract referral code from any raw URL string (App Link, Play Referrer, or Scheme)
 */
export function extractReferralFromUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    let urlToParse = rawUrl;
    if (urlToParse.includes('%')) {
      try {
        urlToParse = decodeURIComponent(urlToParse);
      } catch {}
    }

    // 1. Check standard query params: ref or promo_code
    const matchRef = urlToParse.match(/(?:[?&]|\b)(?:ref|promo_code)=([^&#\s]+)/i);
    if (matchRef && matchRef[1]) return matchRef[1].trim().toUpperCase();

    // 2. Check utm_campaign fallback (if not generic)
    const matchUtm = urlToParse.match(/(?:[?&]|\b)utm_campaign=([^&#\s]+)/i);
    if (matchUtm && matchUtm[1] && !matchUtm[1].toLowerCase().includes('google') && !matchUtm[1].toLowerCase().includes('android')) {
      return matchUtm[1].trim().toUpperCase();
    }

    // 3. Check path pattern like /r/CODE or /join/CODE
    const pathMatch = urlToParse.match(/\/(?:r|join)\/([A-Za-z0-9_.-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].trim().toUpperCase();
    }

    // 4. Custom fallback regex for com.eDATA.app://join?ref=CODE
    const schemeMatch = urlToParse.match(/[?&]ref=([A-Za-z0-9_.-]+)/i);
    if (schemeMatch && schemeMatch[1]) {
      return schemeMatch[1].trim().toUpperCase();
    }
  } catch {}

  return null;
}

/**
 * Native Google Play Install Referrer API Query (survives store redirect 100%)
 */
export async function checkPlayInstallReferrer(): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return null;
  }

  const alreadyChecked = localStorage.getItem('edata_install_referrer_checked');
  if (alreadyChecked === 'true' && getPendingReferral()) {
    return getPendingReferral();
  }

  try {
    console.log('[DeepLink] Querying Google Play Install Referrer API...');
    const result = await InstallReferrer.getReferrerDetails();
    localStorage.setItem('edata_install_referrer_checked', 'true');

    if (result && result.installReferrer) {
      const raw = result.installReferrer.trim();
      console.log('[DeepLink] Received Play Install Referrer:', raw);
      localStorage.setItem(RAW_INSTALL_REFERRER_KEY, raw);

      const clickId = extractClickIdFromUrl(raw);
      if (clickId) {
        localStorage.setItem(PENDING_CLICK_ID_KEY, clickId);
      }

      const code = extractReferralFromUrl(raw);
      if (code) {
        console.log('[DeepLink] Extracted referral code from Play Store install:', code);
        savePendingReferral(code);
        return code;
      }
    }
  } catch (err) {
    console.warn('[DeepLink] Install Referrer query failed:', err);
  }
  return null;
}

/**
 * Check device clipboard for 'edata-ref:<CODE>' deferred bridge (user-initiated fallback)
 */
export async function checkClipboardForReferral(): Promise<string | null> {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const clipText = await navigator.clipboard.readText();
      if (clipText && typeof clipText === 'string') {
        const trimmed = clipText.trim();
        if (trimmed.startsWith('edata-ref:')) {
          const code = trimmed.replace('edata-ref:', '').trim().toUpperCase();
          if (code) {
            console.log('[DeepLink] Captured referral code from clipboard bridge:', code);
            savePendingReferral(code);
            try {
              await navigator.clipboard.writeText('');
            } catch {}
            return code;
          }
        }
      }
    }
  } catch (err) {
    // Clipboard permission denied or unavailable without user gesture — silently ignored
  }
  return null;
}

/**
 * Initialize Deep Linking system (Google Play Install Referrer + Direct App Links)
 */
export function initDeepLinking(): void {
  // 1. Listen for App Links while running or launching
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    console.log('[DeepLink] appUrlOpen event:', event.url);
    const code = extractReferralFromUrl(event.url);
    if (code) {
      console.log('[DeepLink] Referral code extracted from App Link:', code);
      savePendingReferral(code);
    }
    const clickId = extractClickIdFromUrl(event.url);
    if (clickId) {
      localStorage.setItem(PENDING_CLICK_ID_KEY, clickId);
    }
  }).catch(err => {
    console.warn('[DeepLink] Failed to attach appUrlOpen listener:', err);
  });

  // 2. Check launch URL on cold start
  App.getLaunchUrl().then(launchData => {
    if (launchData && launchData.url) {
      console.log('[DeepLink] Cold start launch URL:', launchData.url);
      const code = extractReferralFromUrl(launchData.url);
      if (code) {
        savePendingReferral(code);
      }
      const clickId = extractClickIdFromUrl(launchData.url);
      if (clickId) {
        localStorage.setItem(PENDING_CLICK_ID_KEY, clickId);
      }
    }
  }).catch(() => {});

  // 3. Query native Google Play Install Referrer API
  checkPlayInstallReferrer();
}
