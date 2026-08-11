import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/Toast';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction, QuickAction, PlanTypeItem } from './types';
import { api, getAuthToken, setAuthToken, API_BASE_URL, resolveImageUrl } from './services/api';

import AuthPage from './components/AuthPage';
import SplashScreen from './components/SplashScreen';
import UserDashboard from './components/UserDashboard';
import BuyAirtime from './components/BuyAirtime';
import BuyData from './components/BuyData';
import CableTV from './components/CableTV';
import ElectricityBill from './components/ElectricityBill';
import ExamPins from './components/ExamPins';
import AirtimeToCash from './components/AirtimeToCash';
import FundWallet from './components/FundWallet';
import TransactionHistory from './components/TransactionHistory';
import ProfileSettings from './components/ProfileSettings';
import HelpSupport from './components/HelpSupport';
import Notifications from './components/Notifications';
import BottomNav from './components/BottomNav';
import ServicesCatalog from './components/ServicesCatalog';
import PinScreen from './components/PinScreen';
import ResellerUpgrade from './components/ResellerUpgrade';
import ReferralScreen from './components/ReferralScreen';

type ActiveView =
  | 'dashboard'
  | 'services'
  | 'airtime'
  | 'data'
  | 'cable'
  | 'electricity'
  | 'exams'
  | 'a2c'
  | 'fund'
  | 'history'
  | 'profile'
  | 'support'
  | 'notifications'
  | 'upgrade'
  | 'referral';

function MainApp() {
  const toast = useToast();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_products');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRODUCTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_transactions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TRANSACTIONS;
  });
  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_quick_actions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [planTypes, setPlanTypes] = useState<PlanTypeItem[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_plan_types');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  // Set of mobile service_type keys (`airtime`, `data`, `cable`, `electricity`,
  // `exams`, `a2c`) that have at least one ACTIVE ServiceType row on the
  // backend. Populated live from /api/services on every poll. Used to
  // hide tiles for categories the admin has fully disabled — Manage
  // Services is the sole source of truth for what appears.
  const [serviceCategories, setServiceCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_service_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [preselectedNetwork, setPreselectedNetwork] = useState<string>('');
  const [preselectedPlanId, setPreselectedPlanId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('edata_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER;
  });
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline'>('offline');
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'app'>(() => {
    return getAuthToken() ? 'app' : 'auth';
  });
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewHistory, setViewHistory] = useState<ActiveView[]>(['dashboard']);

  // Direct Quick Action Checkout state
  const [activeQuickAction, setActiveQuickAction] = useState<QuickAction | null>(null);
  const [quickActionPrice, setQuickActionPrice] = useState<number>(0);
  const [pinScreenMode, setPinScreenMode] = useState<'purchase' | 'set_pin' | null>(null);

  const handleGoBack = () => {
    if (pinScreenMode) {
      setPinScreenMode(null);
      setActiveQuickAction(null);
      return;
    }

    if (viewHistory.length > 1) {
      setViewHistory(prev => {
        const copy = [...prev];
        copy.pop();
        const prevView = copy[copy.length - 1] || 'dashboard';
        setActiveView(prevView);
        return copy;
      });
    } else if (activeView !== 'dashboard') {
      setActiveView('dashboard');
      setViewHistory(['dashboard']);
    } else {
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.exitApp();
      }).catch(() => {});
    }
  };

  const handleNavigate = (view: ActiveView, network?: string, planId?: number) => {
    if (network) setPreselectedNetwork(network);
    if (planId !== undefined) setPreselectedPlanId(planId);
    setActiveView(view);
    setViewHistory(prev => [...prev, view]);
  };

  useEffect(() => {
    let handler: any;
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('backButton', () => {
        handleGoBack();
      }).then(h => {
        handler = h;
      });
    }).catch(() => {});

    return () => {
      if (handler && handler.remove) {
        handler.remove();
      }
    };
  }, [activeView, viewHistory, pinScreenMode]);

  const handleSetCurrentUser = (user: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setCurrentUser(prev => {
      const next = typeof user === 'function' ? user(prev) : user;
      try {
        localStorage.setItem('edata_current_user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSetTransactions = (txs: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactions(prev => {
      const next = typeof txs === 'function' ? txs(prev) : txs;
      return next;
    });
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [profileRes, walletRes, txRes, servicesRes] = await Promise.all([
        api.getProfile(silent),
        api.getWallet(silent),
        api.getTransactions(silent),
        api.getServices(silent),
      ]);

      const resData = servicesRes?.data || servicesRes || {};
      const dbServices: any[] = resData.services || (Array.isArray(resData) ? resData : []);
      let dbPlans: any[] = resData.plans || resData.data_plans || resData.plans_list || [];

      // Extract nested plans if any service contains a nested 'plans', 'data_plans', 'packages', or 'items' array
      dbServices.forEach((srv) => {
        const nestedPlans = srv.plans || srv.data_plans || srv.packages || srv.variations || srv.items;
        if (Array.isArray(nestedPlans)) {
          nestedPlans.forEach((np: any) => {
            dbPlans.push({
              ...np,
              service_type_id: np.service_type_id || srv.id,
              operator: np.operator || srv.slug || srv.name,
            });
          });
        }
      });

      const mappedProducts: ProductItem[] = [];

      // Derive "container services" purely from the shape of the admin's
      // response: any service that has at least one plan hanging off it
      // (via `service_type_id`) is a container — its own row shouldn't be
      // pushed as a buyable, because the plans are the buyables. This
      // stays flexible: whatever the admin sets up, we mirror.
      const serviceIdsWithPlans = new Set<string>();
      dbPlans.forEach((plan: any) => {
        const sid = plan.service_type_id;
        if (sid !== undefined && sid !== null) {
          serviceIdsWithPlans.add(String(sid));
        }
      });

      dbServices.forEach((srv) => {
        let category: any = 'Airtime';
        if (srv.category_id === 1) category = 'Airtime';
        else if (srv.category_id === 2) category = 'Data';
        else if (srv.category_id === 3) category = 'Exam Token';
        else if (srv.category_id === 4) category = 'Cable TV';
        else if (srv.category_id === 5) category = 'Electricity';
        else if (srv.category_id === 6) category = 'A2C';

        // Skip container services — the buyables are the individual plans
        // the admin attached (one DataPlan per bundle, one CableBouquet
        // per package, one MeterTariff per band). Without this, a
        // container leaks a ₦0 row like "MTN Data — ₦0" into the picker.
        if (serviceIdsWithPlans.has(String(srv.id))) return;

        const slugLower = String(srv.slug || srv.name || '').toLowerCase();
        const opName = slugLower.includes('mtn') ? 'MTN'
          : slugLower.includes('glo') ? 'Glo'
          : slugLower.includes('airtel') ? 'Airtel'
          : slugLower.includes('9mobile') || slugLower.includes('etisalat') ? '9mobile'
          : (srv.slug || srv.name || 'MTN').toUpperCase();

        mappedProducts.push({
          id: String(srv.id),
          category: category,
          name: srv.name,
          operator: opName,
          priceNormal: parseFloat(srv.price || '0'),
          priceReferred: parseFloat(srv.price || '0'),
          pricePremium: parseFloat(srv.price || '0'),
          active: srv.status === 1 || srv.status === true || srv.status === undefined,
          description: srv.description || '',
        });
      });

      dbPlans.forEach((plan) => {
        const parentSrv = dbServices.find(s => String(s.id) === String(plan.service_type_id));
        let operatorName = plan.operator || (parentSrv ? parentSrv.slug || parentSrv.name : '');

        const opLower = String(operatorName).toLowerCase();
        const pNameLower = String(plan.name || '').toLowerCase();
        const combined = `${opLower} ${pNameLower}`;

        if (combined.includes('mtn')) operatorName = 'MTN';
        else if (combined.includes('airtel')) operatorName = 'Airtel';
        else if (combined.includes('glo')) operatorName = 'Glo';
        else if (combined.includes('9mobile') || combined.includes('etisalat')) operatorName = '9mobile';
        else operatorName = plan.operator || 'MTN';

        let planCat: any = 'Data';
        const catId = Number(plan.category_id || (parentSrv ? parentSrv.category_id : 2));
        if (catId === 1) planCat = 'Airtime';
        else if (catId === 2) planCat = 'Data';
        else if (catId === 3) planCat = 'Exam Token';
        else if (catId === 4) planCat = 'Cable TV';
        else if (catId === 5) planCat = 'Electricity';

        // Prefer per-tier prices coming from the backend so the UI can
        // resolve `Basic / Referred / Premium` accurately. Fall back to
        // the resolved `price` (already per-user) if a specific tier
        // column is absent. NEVER inject a hardcoded amount.
        const rawSelling = plan.selling_price ?? plan.price ?? plan.amount;
        const rawReferred = plan.referred_price ?? plan.price ?? plan.amount;
        const rawPremium = plan.premium_price ?? plan.price ?? plan.amount;

        mappedProducts.push({
          id: `plan-${plan.id}-${plan.service_type_id || '0'}`,
          category: planCat,
          name: plan.name || plan.plan_name || '',
          operator: operatorName,
          priceNormal: parseFloat(String(rawSelling ?? '0')),
          priceReferred: parseFloat(String(rawReferred ?? '0')),
          pricePremium: parseFloat(String(rawPremium ?? '0')),
          active: plan.status === undefined || plan.status === 1 || plan.status === true,
          description: plan.description || plan.name || plan.plan_name || '',
          // Keep the admin-assigned plan type as-is. Do NOT coerce to 'SME'
          // — filters and grouping in ServiceForm build entirely from the
          // /api/services `plan_types` list plus whatever plans actually
          // carry.
          planType: (plan.plan_type || plan.type || '').toString(),
        });
      });

      // Sync Quick Actions from backend REST API
      const qaFromServices = resData.quick_actions || servicesRes?.data?.quick_actions || servicesRes?.quick_actions;
      if (Array.isArray(qaFromServices)) {
        setQuickActions(qaFromServices);
      } else {
        try {
          const qaRes = await api.getQuickActions(silent);
          const qaList = qaRes?.data?.quick_actions || qaRes?.data || qaRes || [];
          if (Array.isArray(qaList)) setQuickActions(qaList);
        } catch {}
      }

      // Sync Plan Types from backend REST API
      const ptFromServices = resData.plan_types || servicesRes?.data?.plan_types || servicesRes?.plan_types;
      if (Array.isArray(ptFromServices)) {
        setPlanTypes(ptFromServices);
      }

      setProducts(mappedProducts);

      // Derive the set of active service categories directly from what
      // the backend returned. If /api/services drops (say) every
      // Electricity ServiceType, `electricity` will not appear here and
      // the UserDashboard + ServicesCatalog will hide the Electricity
      // tile on the very next render.
      const catToVerb: Record<number, string> = {
        1: 'airtime', 2: 'data', 3: 'exams',
        4: 'cable', 5: 'electricity', 6: 'a2c',
      };
      const catSet = new Set<string>();
      dbServices.forEach((srv) => {
        const cid = Number(srv.category_id);
        const isActive = srv.status === 1 || srv.status === true || srv.status === undefined;
        if (isActive && catToVerb[cid]) catSet.add(catToVerb[cid]);
      });
      const catArray = Array.from(catSet);
      setServiceCategories(catArray);
      try {
        localStorage.setItem('edata_cached_service_categories', JSON.stringify(catArray));
      } catch {}

      const mappedTx: Transaction[] = ((txRes && txRes.data) || txRes || []).map((t: any) => ({
        id: t.reference,
        type: t.type === 'Exam Card' ? 'Exam Token' : (t.type === 'Cable TV' || t.type === 'Cable' ? 'Cable TV' : t.type),
        productName: t.description,
        amount: parseFloat(t.amount),
        phoneOrMeter: t.phone_or_meter || t.reference,
        reference: t.reference,
        status: t.status === 'Completed' ? 'Completed' : t.status === 'Failed' ? 'Failed' : 'Pending',
        date: t.date,
        disputeRaised: false,
      }));
      setTransactions(mappedTx);

      try {
        localStorage.setItem('edata_cached_products', JSON.stringify(mappedProducts));
        localStorage.setItem('edata_cached_transactions', JSON.stringify(mappedTx));
        if (Array.isArray(qaFromServices)) {
          localStorage.setItem('edata_cached_quick_actions', JSON.stringify(qaFromServices));
        }
        if (Array.isArray(ptFromServices)) {
          localStorage.setItem('edata_cached_plan_types', JSON.stringify(ptFromServices));
        }
      } catch {}

      const user = profileRes?.data?.user || profileRes?.data || profileRes?.user || profileRes || {};
      const walletSucceeded = walletRes?.success !== false;
      const profileSucceeded = profileRes?.success !== false;
      const walletData = walletSucceeded ? (walletRes?.data?.wallet || walletRes?.data || walletRes?.wallet || {}) : {};

      // Extract balance from all possible API response locations
      let extractedBalance: number | null = null;

      // 1. Try wallet endpoint response (data.balance)
      if (walletSucceeded && walletRes?.data?.balance !== undefined && walletRes?.data?.balance !== null) {
        extractedBalance = parseFloat(walletRes.data.balance);
      }
      // 2. Try wallet endpoint alternate key (data.wallet_balance)
      if (extractedBalance === null && walletSucceeded && walletRes?.data?.wallet_balance !== undefined) {
        extractedBalance = parseFloat(walletRes.data.wallet_balance);
      }
      // 3. Try profile endpoint (data.wallet_balance or data.balance)
      if (extractedBalance === null && profileSucceeded) {
        const profData = profileRes?.data || {};
        if (profData.wallet_balance !== undefined && profData.wallet_balance !== null) {
          extractedBalance = parseFloat(profData.wallet_balance);
        } else if (profData.balance !== undefined && profData.balance !== null) {
          extractedBalance = parseFloat(profData.balance);
        }
        // Also check nested user object from profile
        const profUser = profData.user || profData;
        if (extractedBalance === null && profUser.wallet_balance !== undefined) {
          extractedBalance = parseFloat(profUser.wallet_balance);
        }
        if (extractedBalance === null && profUser.balance !== undefined) {
          extractedBalance = parseFloat(profUser.balance);
        }
      }
      // 4. Fallback: try walletData generic extraction
      if (extractedBalance === null && walletSucceeded) {
        const wb = walletData?.balance ?? walletData?.wallet_balance ?? walletData?.walletBalance;
        if (wb !== undefined && wb !== null) {
          extractedBalance = parseFloat(wb);
        }
      }

      // If we couldn't extract a valid balance from the API, preserve the current balance
      // This prevents silent sync failures from resetting the balance to ₦0.00
      const parsedBalance = (extractedBalance !== null && !isNaN(extractedBalance))
        ? extractedBalance
        : currentUser.walletBalance;

      // Real-time live credit notification alert
      if (silent && currentUser.walletBalance > 0 && parsedBalance > currentUser.walletBalance) {
        const diff = parsedBalance - currentUser.walletBalance;
        toast.success(`Wallet Credited! +₦${diff.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (New Balance: ₦${parsedBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })})`);
      }

      const firstName = user.firstname || user.first_name || '';
      const lastName = user.lastname || user.last_name || '';
      const computedName = `${firstName} ${lastName}`.trim() || user.name || user.username || user.email?.split('@')[0] || currentUser.name || 'eData User';

      const vAccounts: any[] = walletRes?.data?.virtual_accounts || walletRes?.virtual_accounts || (walletRes?.data?.virtual_account ? [walletRes.data.virtual_account] : walletRes?.virtual_account ? [walletRes.virtual_account] : []);
      const primaryVAccount = vAccounts.length > 0 && vAccounts[0].account_number ? {
        bank_name: vAccounts[0].bank_name || vAccounts[0].bank || 'KatPay / Wema Bank',
        account_number: vAccounts[0].account_number || vAccounts[0].accountNo || '',
        account_name: vAccounts[0].account_name || vAccounts[0].accountName || computedName,
      } : (currentUser.virtualAccount || null);

      if (primaryVAccount && primaryVAccount.account_number) {
        try {
          localStorage.setItem('edata_virtual_account', JSON.stringify(primaryVAccount));
        } catch {}
      }

      const syncedUser: UserProfile = {
        id: user.id || currentUser.id,
        name: computedName,
        firstname: firstName || currentUser.firstname || '',
        lastname: lastName || currentUser.lastname || '',
        email: user.email || currentUser.email || '',
        phone: user.phone || user.mobile || currentUser.phone || '',
        walletBalance: parsedBalance,
        category: user.level_label || user.category || user.user_level || currentUser.category || 'Basic User',
        bvn: user.bvn || currentUser.bvn || '',
        nin: user.nin || currentUser.nin || '',
        isVerified: true,
        pinCode: '',
        hasPin: user.has_pin !== undefined ? Boolean(user.has_pin) : (user.hasPin !== undefined ? Boolean(user.hasPin) : currentUser.hasPin),
        hasPendingUpgrade: Boolean(user.has_pending_upgrade),
        // Upgrade fee is admin-managed via Setting; if the profile hasn't
        // returned it yet, hold 0 (the UI treats 0 as "waiting for server").
        upgradeFee: parseFloat(user.premium_upgrade_fee || user.upgrade_fee || '0'),
        photo: resolveImageUrl(user.photo || user.avatar || user.picture) || currentUser.photo || null,
        avatar: resolveImageUrl(user.avatar || user.photo || user.picture) || currentUser.avatar || null,
        picture: resolveImageUrl(user.picture || user.photo || user.avatar) || currentUser.picture || null,
        virtualAccount: primaryVAccount,
        virtualAccounts: vAccounts,
      };

      handleSetCurrentUser(syncedUser);

      setApiStatus('connected');
      setLastSynced(new Date().toLocaleTimeString());

      // Sync Notifications unread count
      try {
        const notifsRes = await api.getNotifications(silent);
        const notifArray = notifsRes?.data?.notifications || notifsRes?.notifications || (Array.isArray(notifsRes?.data) ? notifsRes.data : Array.isArray(notifsRes) ? notifsRes : []);
        const unread = notifsRes?.data?.unread_count ?? notifArray.filter((n: any) => !n.is_read && !n.read).length;
        setUnreadCount(unread);
      } catch {}
    } catch (err: any) {
      if (!silent) {
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid credentials') || msg.includes('no authentication token')) {
          // Token is invalid/expired — force back to login
          setAuthToken(null);
          setCurrentScreen('auth');
        } else if (!getAuthToken()) {
          // No token at all — force auth screen
          setCurrentScreen('auth');
        } else {
          // Network/server error but token exists — stay on app, show offline
          console.warn('API Sync Notice:', err?.message || err);
        }
        setApiStatus('offline');
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    const checkConnectionOnLoad = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/detect-network?phone=0803`);
        if (res.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('offline');
        }
      } catch (err) {
        setApiStatus('offline');
      }
    };

    const token = getAuthToken();
    if (token) {
      // Token exists — try to load data; fetchAllData will redirect to auth if token is invalid
      setCurrentScreen('app');
      fetchAllData().catch(() => {
        // If fetchAllData itself throws uncaught, ensure we fall back to auth
        if (!getAuthToken()) {
          setCurrentScreen('auth');
        }
      });
    } else {
      // No token — always show login screen
      setCurrentScreen('auth');
      checkConnectionOnLoad();
    }

    return () => clearTimeout(splashTimer);
  }, []);

  // ── Ultra-Fast Real-Time Background Synchronization Engine (3-Second Heartbeat) ──
  useEffect(() => {
    let pollInterval: any = null;
    let capAppListener: any = null;

    const startPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => {
        if (getAuthToken() && currentScreen === 'app') {
          fetchAllData(true);
        }
      }, 3000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    if (getAuthToken() && currentScreen === 'app') {
      startPolling();
    } else {
      stopPolling();
    }

    // Immediate Sync on Foreground App Focus (Browser Tab & Native Mobile App Focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && getAuthToken() && currentScreen === 'app') {
        fetchAllData(true);
        startPolling();
      } else if (document.visibilityState === 'hidden') {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appStateChange', (state) => {
        if (state.isActive && getAuthToken() && currentScreen === 'app') {
          fetchAllData(true);
          startPolling();
        } else if (!state.isActive) {
          stopPolling();
        }
      }).then(l => {
        capAppListener = l;
      });
    }).catch(() => {});

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capAppListener && capAppListener.remove) {
        capAppListener.remove();
      }
    };
  }, [currentScreen, currentUser.walletBalance]);

  const handleGlobalRefresh = () => {
    fetchAllData();
  };

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    setCurrentScreen('app');
    setActiveView('dashboard');
    setViewHistory(['dashboard']);
    fetchAllData();
  };

  const handleLogout = () => {
    setAuthToken(null);
    // Clear every cache — auth tokens, user profile, wallet virtual
    // account, AND the admin-managed catalogue caches (products, plan
    // types, quick actions, service categories, transactions). Without
    // this, the next user (or the same user after a plan/type change)
    // would briefly see stale data plucked from the previous session's
    // localStorage before the first /api/services poll completes.
    [
      'edata_token',
      'edata_current_user',
      'edata_sandbox',
      'google_session',
      'edata_virtual_account',
      'edata_cached_products',
      'edata_cached_plan_types',
      'edata_cached_quick_actions',
      'edata_cached_service_categories',
      'edata_cached_transactions',
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    setCurrentUser(DEFAULT_USER);
    setProducts([]);
    setPlanTypes([]);
    setQuickActions([]);
    setServiceCategories([]);
    setTransactions([]);
    setApiStatus('offline');
    setCurrentScreen('auth');
    setActiveView('dashboard');
    setViewHistory(['dashboard']);
  };

  const navigateTo = (view: string, params?: { network?: string; planId?: number | null; quickAction?: QuickAction }) => {
    let targetView = (view || 'data') as ActiveView;
    let targetNetwork = params?.network || '';
    let targetPlanId = params?.planId !== undefined ? params.planId : null;

    if (params?.quickAction) {
      if (params.quickAction.service_type) {
        targetView = params.quickAction.service_type as ActiveView;
      }
      if (params.quickAction.network) {
        targetNetwork = params.quickAction.network;
      }
      if (params.quickAction.plan_id) {
        targetPlanId = params.quickAction.plan_id;
      }
    }

    // Refuse to navigate into a service view the admin has fully
    // disabled. `fund` / `history` / `profile` / `support` / `notifications`
    // / `upgrade` / `referral` / `services` / `dashboard` are app-level
    // views (not admin-managed service categories) and always work.
    const gatedViews = ['airtime', 'data', 'cable', 'electricity', 'exams', 'a2c'];
    if (gatedViews.includes(targetView)
        && serviceCategories.length > 0
        && !serviceCategories.includes(targetView)) {
      toast.info('This service is currently unavailable.');
      return;
    }

    if (targetView !== activeView) {
      setViewHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1] === targetView) return prev;
        return [...prev, targetView];
      });
      setActiveView(targetView);
    }

    setPreselectedNetwork(targetNetwork);
    setPreselectedPlanId(targetPlanId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickActionDirectCheckout = (action: QuickAction) => {
    // 1. Resolve product & dynamic item price strictly from admin-managed
    //    /api/services data. There is NO hardcoded price fallback — if the
    //    referenced plan is not in the synced products list we refuse to
    //    check out and send the user through the full service form instead,
    //    where they can pick the current admin-defined plan.
    let itemPrice = 0;
    let matchingProduct: ProductItem | undefined;

    if (action.plan_id && products.length > 0) {
      matchingProduct = products.find(p =>
        p.id === `plan-${action.plan_id}` ||
        p.id === String(action.plan_id) ||
        p.id.includes(`-${action.plan_id}-`) ||
        p.id.startsWith(`plan-${action.plan_id}-`)
      );
    }

    if (matchingProduct) {
      if (currentUser.category === 'Premium User') itemPrice = matchingProduct.pricePremium ?? matchingProduct.priceNormal;
      else if (currentUser.category === 'Referred User') itemPrice = matchingProduct.priceReferred ?? matchingProduct.priceNormal;
      else itemPrice = matchingProduct.priceNormal;
    } else {
      // No matching admin plan found (deleted/deactivated on the backend,
      // or the local cache is stale). Redirect to the service form so the
      // user selects a currently-available plan instead of paying an
      // outdated hardcoded amount.
      toast.info('This shortcut is no longer available. Please pick a current plan.');
      navigateTo(action.service_type || 'data', { network: action.network });
      return;
    }

    // 2. Check if user has Transaction PIN set
    if (!currentUser.hasPin) {
      toast.info('Please set up your 4-digit Transaction PIN first.');
      setActiveQuickAction(action);
      setQuickActionPrice(itemPrice);
      setPinScreenMode('set_pin');
      return;
    }

    // 3. Preload action & open PIN screen directly with summary details
    setActiveQuickAction(action);
    setQuickActionPrice(itemPrice);
    setPinScreenMode('purchase');
  };

  const handleConfirmQuickActionPurchase = async (pinInput: string, customRecipient?: string, promoCode?: string) => {
    if (!activeQuickAction) return;

    if (quickActionPrice > currentUser.walletBalance) {
      toast.error(`Insufficient wallet balance. Required: ₦${quickActionPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}, Current Balance: ₦${currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      return;
    }

    const netUpper = (activeQuickAction.network || '').toUpperCase();
    const serviceType = activeQuickAction.service_type || 'data';

    // Prefer the service_type_id that came in with the admin-defined plan
    // (encoded as `plan-<planId>-<serviceTypeId>` in ProductItem.id) —
    // that way this call goes straight to the same row the admin edited.
    let serviceId: number | undefined;
    if (activeQuickAction.plan_id) {
      const prod = products.find(p =>
        p.id === `plan-${activeQuickAction.plan_id}` ||
        p.id.startsWith(`plan-${activeQuickAction.plan_id}-`) ||
        p.id.includes(`-${activeQuickAction.plan_id}-`)
      );
      const idMatch = prod?.id.match(/^plan-\d+-(\d+)$/);
      if (idMatch) serviceId = parseInt(idMatch[1], 10);
    }

    // For services that carry no per-network plan row (electricity, cable,
    // A2C, exams) look up the ServiceType by category from the same
    // /api/services payload the admin controls, then match on operator
    // where relevant. This avoids hardcoded numeric IDs in the client.
    if (!serviceId) {
      const categoryForType: Record<string, number> = {
        airtime: 1, data: 2, exams: 3, exam: 3, cable: 4, electricity: 5, a2c: 6,
      };
      const wantCat = categoryForType[serviceType];
      const matches = products.filter(p => {
        const catStr = String(p.category || '').toLowerCase();
        if (wantCat === 1) return catStr === 'airtime';
        if (wantCat === 2) return catStr.includes('data');
        if (wantCat === 3) return catStr.includes('exam');
        if (wantCat === 4) return catStr.includes('cable');
        if (wantCat === 5) return catStr === 'electricity';
        if (wantCat === 6) return catStr === 'a2c';
        return false;
      });
      const byOperator = netUpper
        ? matches.find(p => (p.operator || '').toUpperCase() === netUpper)
        : undefined;
      const chosen = byOperator || matches[0];
      if (chosen && /^\d+$/.test(String(chosen.id))) {
        serviceId = parseInt(String(chosen.id), 10);
      }
    }

    if (!serviceId) {
      toast.error('Unable to resolve service. Please open the full service page and retry.');
      return;
    }

    const recipientNum = customRecipient || currentUser.phone || '';
    if (!recipientNum) {
      toast.warning('Please add your phone number in Profile before using shortcuts.');
      return;
    }

    const res = await api.purchase({
      service_id: serviceId,
      amount: quickActionPrice,
      target_number: recipientNum,
      plan_id: activeQuickAction.plan_id || undefined,
      transaction_pin: pinInput,
      promo_code: promoCode,
    });

    toast.success(res.message || `${activeQuickAction.title} purchase successful!`);
    setPinScreenMode(null);
    setActiveQuickAction(null);
    handleGlobalRefresh();
  };

  return (
    <>
      {showSplash && <SplashScreen />}
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        <div className="w-full flex-1 flex flex-col">
          {currentScreen !== 'app' ? (
            <AuthPage
              onLoginSuccess={handleLoginSuccess}
              setCurrentUser={handleSetCurrentUser}
              apiStatus={apiStatus}
              setApiStatus={setApiStatus}
              subscribers={subscribers}
            />
          ) : (
            <>
              {activeView === 'dashboard' && (
                <UserDashboard
                  currentUser={currentUser}
                  transactions={transactions}
                  quickActions={quickActions}
                  serviceCategories={serviceCategories}
                  onNavigate={navigateTo}
                  onRefresh={handleGlobalRefresh}
                  isSyncing={isSyncing}
                  apiStatus={apiStatus}
                  unreadNotificationsCount={unreadCount}
                />
              )}

              {activeView === 'services' && (
                <ServicesCatalog
                  currentUser={currentUser}
                  serviceCategories={serviceCategories}
                  onNavigate={navigateTo}
                />
              )}

              {activeView === 'airtime' && (
                <BuyAirtime
                  currentUser={currentUser}
                  products={products}
                  initialNetwork={preselectedNetwork}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'data' && (
                <BuyData
                  currentUser={currentUser}
                  products={products}
                  planTypes={planTypes}
                  initialNetwork={preselectedNetwork}
                  initialPlanId={preselectedPlanId}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'cable' && (
                <CableTV
                  currentUser={currentUser}
                  products={products}
                  initialProvider={preselectedNetwork}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'electricity' && (
                <ElectricityBill
                  currentUser={currentUser}
                  products={products}
                  initialDisco={preselectedNetwork}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'exams' && (
                <ExamPins
                  currentUser={currentUser}
                  products={products}
                  initialProvider={preselectedNetwork}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'a2c' && (
                <AirtimeToCash
                  currentUser={currentUser}
                  products={products}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'fund' && (
                <FundWallet
                  currentUser={currentUser}
                  onBack={handleGoBack}
                  onRefreshWallet={handleGlobalRefresh}
                />
              )}

              {activeView === 'history' && (
                <TransactionHistory
                  transactions={transactions}
                  onBack={handleGoBack}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'profile' && (
                <ProfileSettings
                  currentUser={currentUser}
                  setCurrentUser={handleSetCurrentUser}
                  onBack={handleGoBack}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'upgrade' && (
                <ResellerUpgrade
                  currentUser={currentUser}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'support' && (
                <HelpSupport
                  onBack={handleGoBack}
                />
              )}

              {activeView === 'notifications' && (
                <Notifications
                  onBack={handleGoBack}
                  onRefreshUnreadCount={(count) => setUnreadCount(count)}
                />
              )}

              {activeView === 'referral' && (
                <ReferralScreen
                  currentUser={currentUser}
                  onBack={handleGoBack}
                  onNavigate={navigateTo}
                />
              )}

              {/* Floating Glassmorphic Bottom Navigation */}
              <BottomNav activeView={activeView} onNavigate={navigateTo} />

              {/* ── Direct Quick Action PIN Checkout Screen ── */}
              {pinScreenMode && (
                <PinScreen
                  mode={pinScreenMode}
                  userEmail={currentUser.email}
                  summary={
                    pinScreenMode === 'purchase' && activeQuickAction
                      ? {
                          title: activeQuickAction.title,
                          subtitle: `${activeQuickAction.network} • Instant Delivery`,
                          amount: quickActionPrice,
                          recipient: (activeQuickAction.service_type === 'exams' || activeQuickAction.service_type === 'exam')
                            ? undefined
                            : (currentUser.phone || '08000000000'),
                          provider: activeQuickAction.network,
                          iconType: (activeQuickAction.service_type as any) || 'data',
                          details: [
                            { label: 'Service', value: (activeQuickAction.service_type || 'data').toUpperCase() },
                            { label: 'Provider', value: activeQuickAction.network },
                          ],
                        }
                      : undefined
                  }
                  onBack={() => {
                    setPinScreenMode(null);
                    setActiveQuickAction(null);
                  }}
                  onSuccess={() => {
                    if (pinScreenMode === 'set_pin') {
                      setCurrentUser(prev => ({ ...prev, hasPin: true }));
                      if (activeQuickAction) {
                        toast.success('PIN created successfully! Continuing purchase authorization.');
                        setPinScreenMode('purchase');
                      } else {
                        setPinScreenMode(null);
                      }
                    } else {
                      setPinScreenMode(null);
                      setActiveQuickAction(null);
                    }
                  }}
                  onSubmitPurchase={handleConfirmQuickActionPurchase}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
