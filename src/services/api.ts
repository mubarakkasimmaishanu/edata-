export const API_BASE_URL = (import.meta as any).env.VITE_YII_API_URL || 'https://edata.com.ng/api';

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const hostBase = API_BASE_URL.replace(/\/api\/?.*$/, '').replace(/\/index\.php\/?.*$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${hostBase}${cleanPath}`;
}

export function getAuthToken(): string | null {
  const token = localStorage.getItem('edata_token');
  if (!token || token === 'google-sandbox-token' || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('edata_token', token);
  } else {
    localStorage.removeItem('edata_token');
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const publicEndpoints = [
    '/login', '/signup', '/signup-request', '/signup-verify',
    '/signup-complete', '/google-auth', '/detect-network',
    '/forgot-password', '/reset-password'
  ];

  const isPublic = publicEndpoints.some(p => endpoint.startsWith(p));
  if (!isPublic && !token) {
    throw new Error('401 Unauthorized: No authentication token provided.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok || (data && data.success === false)) {
      let msg = data?.error || data?.message;
      if (!msg) {
        if (response.status === 404 || response.status === 405) {
          msg = 'Service endpoint currently unavailable. Please try again.';
        } else if (response.status >= 500) {
          msg = 'Server encountered an issue. Please try again shortly.';
        } else {
          msg = 'Unable to complete request. Please try again.';
        }
      }
      throw new Error(msg);
    }

    return data || { success: true };
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
      throw new Error('Network connection issue. Please check your internet connection.');
    }
    throw err;
  }
}

export const api = {
  async login(email: string, password: string) {
    const data = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.data?.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },

  async googleAuth(params: { id_token?: string; email?: string; name?: string }) {
    const data = await request('/google-auth', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (data.success && data.data?.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },


  async getProfile() {
    return request('/profile');
  },

  async uploadPhoto(photoBase64: string) {
    return request('/upload-photo', {
      method: 'POST',
      body: JSON.stringify({ photo_base64: photoBase64 }),
    });
  },

  async getWallet() {
    return request('/wallet');
  },

  async initKatpay(amount: number) {
    return request('/katpay-init', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async generateVirtualAccount() {
    return request('/katpay-generate-virtual-account', {
      method: 'POST',
    });
  },

  async submitManualDeposit(amount: number, reference: string, accountName?: string) {
    return request('/manual-deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, reference, account_name: accountName }),
    });
  },

  async getTransactions() {
    return request('/transactions');
  },

  async getServices() {
    return request('/services');
  },

  async detectNetwork(phone: string) {
    return request(`/detect-network?phone=${encodeURIComponent(phone)}`);
  },


  async validateMeterOrSmartcard(serviceId: number | string, number: string) {
    return request('/validate', {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId, number }),
    });
  },

  async validatePromo(code: string, serviceId: number | string, amount: number) {
    return request('/promo', {
      method: 'POST',
      body: JSON.stringify({ code, service_id: serviceId, amount }),
    });
  },

  async purchase(params: {
    service_id: number | string;
    amount: number;
    target_number: string;
    transaction_pin: string;
    plan_id?: number | string;
    promo_id?: number | string;
    bank_name?: string;
    account_number?: string;
  }) {
    return request('/purchase', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async upgrade(transactionPin: string) {
    return request('/upgrade', {
      method: 'POST',
      body: JSON.stringify({ transaction_pin: transactionPin }),
    });
  },

  async updateProfile(params: { firstname?: string; lastname?: string; phone?: string }) {
    return request('/update-profile', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async setPin(pin: string, confirmPin: string) {
    return request('/set-pin', {
      method: 'POST',
      body: JSON.stringify({ pin, confirm_pin: confirmPin }),
    });
  },

  async changePin(currentPin: string, newPin: string, confirmPin: string) {
    return request('/change-pin', {
      method: 'POST',
      body: JSON.stringify({ current_pin: currentPin, new_pin: newPin, confirm_pin: confirmPin }),
    });
  },

  async forgotPassword(email: string) {
    return request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string, confirmPassword?: string) {
    return request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password: newPassword, confirm_password: confirmPassword }),
    });
  },

  async forgotPinRequest() {
    return request('/forgot-pin', {
      method: 'POST',
      body: JSON.stringify({ step: 'request' }),
    });
  },

  async forgotPinVerify(code: string, newPin: string, confirmPin: string) {
    return request('/forgot-pin', {
      method: 'POST',
      body: JSON.stringify({ step: 'verify', code, new_pin: newPin, confirm_pin: confirmPin }),
    });
  },

  async signupRequest(email: string, referralCode?: string) {
    return request('/signup-request', {
      method: 'POST',
      body: JSON.stringify({ email, referral_code: referralCode }),
    });
  },

  async signupVerify(email: string, code: string) {
    return request('/signup-verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  async signupComplete(
    email: string,
    code: string,
    password: string,
    confirmPassword?: string,
    transactionPin?: string,
    referralCode?: string,
    firstname?: string,
    lastname?: string,
    phone?: string
  ) {
    return request('/signup-complete', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        password,
        confirm_password: confirmPassword || password,
        transaction_pin: transactionPin,
        referral_code: referralCode,
        firstname,
        lastname,
        phone,
      }),
    });
  },

  async getNotifications() {
    return request('/notifications');
  },

  async markNotificationRead(id?: number | 'all') {
    return request('/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },
};


