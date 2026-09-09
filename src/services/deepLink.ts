import { App, URLOpenListenerEvent } from '@capacitor/app';

export const PENDING_REFERRAL_KEY = 'edata_pending_referral';

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
 * Clear pending referral code after successful registration
 */
export function clearPendingReferral(): void {
  try {
    localStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {}
}

/**
 * Extract referral code from any raw URL string (App Link, Universal Link, or Custom Scheme)
 */
export function extractReferralFromUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    // 1. Check standard URL query params
    const parsed = new URL(rawUrl);
    const refParam = parsed.searchParams.get('ref') || parsed.searchParams.get('referrer');
    if (refParam) {
      // If referrer was encoded like ref%3DCODE or ref=CODE
      const match = refParam.match(/(?:ref=)?([A-Za-z0-9_.-]+)/i);
      if (match && match[1]) return match[1].trim().toUpperCase();
      return refParam.trim().toUpperCase();
    }

    // 2. Check path pattern like /r/CODE or /join/CODE
    const pathMatch = parsed.pathname.match(/\/(?:r|join)\/([A-Za-z0-9_.-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].trim().toUpperCase();
    }
  } catch {
    // Fallback regex for non-standard URI schemes (e.g. com.eDATA.app://join?ref=CODE)
    const regexMatch = rawUrl.match(/[?&](?:ref|referrer)=([A-Za-z0-9_.-]+)/i);
    if (regexMatch && regexMatch[1]) {
      return regexMatch[1].trim().toUpperCase();
    }
  }

  return null;
}

/**
 * Check device clipboard for 'edata-ref:<CODE>' deferred bridge
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
            // Clear clipboard bridge token to avoid duplicate captures
            try {
              await navigator.clipboard.writeText('');
            } catch {}
            return code;
          }
        }
      }
    }
  } catch (err) {
    // Clipboard permission denied or unavailable — normal for non-user-gesture runs
  }
  return null;
}

/**
 * Initialize Deep Linking system (Direct App Links + Deferred Clipboard Bridge)
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
    }
  }).catch(() => {});

  // 3. Check clipboard for deferred deep link
  checkClipboardForReferral();
}
