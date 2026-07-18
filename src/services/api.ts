export const API_BASE_URL = (import.meta as any).env.VITE_YII_API_URL || 'https://edata.com.ng/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('edata_token');
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
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok || (data && data.success === false)) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
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

  async getProfile() {
    return request('/profile');
  },

  async getWallet() {
    return request('/wallet');
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
};
