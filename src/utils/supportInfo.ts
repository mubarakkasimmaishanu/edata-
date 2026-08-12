// Single source of truth for support contact info in the mobile app.
//
// Every consumer (HelpSupport screen, TransactionHistory "Report Issue",
// PrivacyTerms contact section) reads through here so no component has
// its own baked-in phone/email/address. Values come from the admin
// Website Configuration through /api/support; we cache the last good
// response in localStorage so low-network / airplane-mode launches keep
// showing the admin's real values instead of stale hardcoded strings.

import { api } from '../services/api';

export interface SupportInfo {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
}

const CACHE_KEY = 'edata_cached_support_info';

// Empty struct — used when we have never fetched and have no cache.
// Deliberately blank strings (not fake numbers) so the UI can decide to
// hide/disable buttons rather than mislead the user with a wrong number.
export const EMPTY_SUPPORT: SupportInfo = {
  phone: '',
  email: '',
  address: '',
  whatsapp: '',
};

export function readCachedSupportInfo(): SupportInfo {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY_SUPPORT;
    const parsed = JSON.parse(raw);
    return {
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      address: typeof parsed.address === 'string' ? parsed.address : '',
      whatsapp: typeof parsed.whatsapp === 'string' ? parsed.whatsapp : '',
    };
  } catch {
    return EMPTY_SUPPORT;
  }
}

function writeCachedSupportInfo(info: SupportInfo) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(info));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

// Fetch fresh support info from the admin-configured backend.
// On failure (offline, low network, server down) we resolve with the
// cached copy so callers don't need to duplicate that fallback logic.
export async function fetchSupportInfo(): Promise<SupportInfo> {
  try {
    const res: any = await api.getSupportInfo();
    if (res?.success && res?.data) {
      const info: SupportInfo = {
        phone: typeof res.data.phone === 'string' ? res.data.phone : '',
        email: typeof res.data.email === 'string' ? res.data.email : '',
        address: typeof res.data.address === 'string' ? res.data.address : '',
        whatsapp: typeof res.data.whatsapp === 'string' ? res.data.whatsapp : '',
      };
      writeCachedSupportInfo(info);
      return info;
    }
  } catch {
    /* fall through to cache */
  }
  return readCachedSupportInfo();
}
