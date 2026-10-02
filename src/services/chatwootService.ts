// eData Customer Support Chatwoot Live Chat Service
// Connects to self-hosted Chatwoot instance (https://chat.edata.com.ng)

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      setUser: (id: string | number, user: Record<string, any>) => void;
      setCustomAttributes: (attributes: Record<string, any>) => void;
      deleteUserIdentity: () => void;
      toggle: (state?: 'open' | 'close') => void;
      isOpen: () => boolean;
      hide: () => void;
      show: () => void;
    };
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: 'left' | 'right';
      locale?: string;
      type?: 'standard' | 'expanded_bubble';
      darkMode?: 'auto' | 'light';
    };
  }
}

export const DEFAULT_CHATWOOT_BASE_URL = 'https://chat.edata.com.ng';
export const DEFAULT_CHATWOOT_WEBSITE_TOKEN = '5b84b0982ffc4c0dbd189236';

let isChatwootInitialized = false;

export function initChatwoot(options?: {
  baseUrl?: string;
  websiteToken?: string;
  hideBubble?: boolean;
}) {
  if (typeof window === 'undefined') return;

  const baseUrl = options?.baseUrl || DEFAULT_CHATWOOT_BASE_URL;
  const websiteToken = options?.websiteToken || DEFAULT_CHATWOOT_WEBSITE_TOKEN;
  const hideBubble = options?.hideBubble ?? true;

  window.chatwootSettings = {
    hideMessageBubble: hideBubble,
    position: 'right',
    type: 'standard',
    darkMode: 'auto',
  };

  if (document.getElementById('chatwoot-sdk-script')) {
    if (window.chatwootSDK && !isChatwootInitialized) {
      window.chatwootSDK.run({ websiteToken, baseUrl });
      isChatwootInitialized = true;
    }
    return;
  }

  const script = document.createElement('script');
  script.id = 'chatwoot-sdk-script';
  script.src = `${baseUrl.replace(/\/+$/, '')}/packs/js/sdk.js`;
  script.defer = true;
  script.async = true;

  script.onload = () => {
    if (window.chatwootSDK) {
      window.chatwootSDK.run({ websiteToken, baseUrl });
      isChatwootInitialized = true;
    }
  };

  document.head.appendChild(script);
}

export function syncChatwootUser(user?: {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  balance?: number | string;
  role?: string;
  user_type?: string;
}) {
  if (typeof window === 'undefined' || !user || !user.id) return;

  const performSync = () => {
    if (window.$chatwoot) {
      window.$chatwoot.setUser(String(user.id), {
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone || '',
        avatar_url: user.avatar || '',
        custom_attributes: {
          user_id: user.id,
          wallet_balance: user.balance !== undefined ? `₦${Number(user.balance).toLocaleString()}` : '',
          user_type: user.user_type || user.role || 'user',
        },
      });
    }
  };

  if (window.$chatwoot) {
    performSync();
  } else {
    window.addEventListener('chatwoot:ready', performSync, { once: true });
  }
}

export function restoreAppStatusBar() {
  if (typeof window === 'undefined') return;
  const isDark = document.documentElement.classList.contains('dark');
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: isDark ? '#0f172a' : '#ffffff' }).catch(() => {});
  }).catch(() => {});
}

export function openChatwoot() {
  if (typeof window === 'undefined') return;

  // Adapt status bar for Chatwoot overlay (crisp white header with dark icons)
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
  }).catch(() => {});

  if (window.$chatwoot) {
    window.$chatwoot.toggle('open');
  } else {
    // If SDK not yet loaded, initialize and wait for ready event
    initChatwoot({ hideBubble: false });
    window.addEventListener(
      'chatwoot:ready',
      () => {
        window.$chatwoot?.toggle('open');
      },
      { once: true }
    );
  }
}

export function closeChatwoot() {
  if (typeof window === 'undefined') return;
  window.$chatwoot?.toggle('close');
  restoreAppStatusBar();
}

export function clearChatwootIdentity() {
  if (typeof window === 'undefined') return;
  if (window.$chatwoot?.deleteUserIdentity) {
    window.$chatwoot.deleteUserIdentity();
  }
}

// Global listener for Chatwoot postMessages (e.g. user taps close 'X' button inside widget)
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data?.event === 'chatwoot-widget:close' || data?.event === 'chatwoot:closed') {
        restoreAppStatusBar();
      }
    } catch {}
  });
}

