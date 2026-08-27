import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/Toast';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction, QuickAction, PlanTypeItem, PopupBanner as PopupBannerType } from './types';
import { api, getAuthToken, setAuthToken, API_BASE_URL, resolveImageUrl } from './services/api';
import { runBackHandlers } from './utils/backHandler';
import PopupBanner from './components/PopupBanner';
import { initPushNotifications, syncPushTokenOnLogin } from './services/pushNotification';

// Eager: always visible on cold start OR needed instantly (no route wait
// is acceptable). Dashboard is the entry point, BottomNav sits over every
// route, PinScreen must open the moment a user taps "Pay" from any screen,
// AuthPage/SplashScreen/PopupBanner are pre-app critical.
import AuthPage from './components/AuthPage';
import SplashScreen from './components/SplashScreen';
import UserDashboard from './components/UserDashboard';
import BottomNav from './components/BottomNav';
import PinScreen from './components/PinScreen';

// Lazy: secondary routes. Each becomes its own chunk fetched only when
// the user navigates to it — cold start bundle shrinks by ~300 KB and
// each chunk downloads in <200 ms on typical mobile networks. Suspense
// boundary below shows a minimal dot loader during the fetch.
const BuyAirtime = React.lazy(() => import('./components/BuyAirtime'));
const BuyData = React.lazy(() => import('./components/BuyData'));
const CableTV = React.lazy(() => import('./components/CableTV'));
const ElectricityBill = React.lazy(() => import('./components/ElectricityBill'));
const ExamPins = React.lazy(() => import('./components/ExamPins'));
const AirtimeToCash = React.lazy(() => import('./components/AirtimeToCash'));
const FundWallet = React.lazy(() => import('./components/FundWallet'));
const TransactionHistory = React.lazy(() => import('./components/TransactionHistory'));
const ProfileSettings = React.lazy(() => import('./components/ProfileSettings'));
const HelpSupport = React.lazy(() => import('./components/HelpSupport'));
const Notifications = React.lazy(() => import('./components/Notifications'));
const ServicesCatalog = React.lazy(() => import('./components/ServicesCatalog'));
const ResellerUpgrade = React.lazy(() => import('./components/ResellerUpgrade'));
const ReferralScreen = React.lazy(() => import('./components/ReferralScreen'));

// Minimal in-app route loader — matches the existing dot-loading utility
// so the transition is silent (no white flash, no jarring spinner).
function RouteFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-16 animate-fade-in">
      <div className="dot-loading" aria-label="Loading">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}

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
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_products');
      if (saved) return JSON.parse(saved);
    } catch { }
    return INITIAL_PRODUCTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_transactions');
      if (saved) return JSON.parse(saved);
    } catch { }
    return INITIAL_TRANSACTIONS;
  });
  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_quick_actions');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });
  const [planTypes, setPlanTypes] = useState<PlanTypeItem[]>(() => {
    try {
      const saved = localStorage.getItem('edata_cached_plan_types');
      if (saved) return JSON.parse(saved);
    } catch { }
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
    } catch { }
    return [];
  });
  const [preselectedNetwork, setPreselectedNetwork] = useState<string>('');
  const [preselectedPlanId, setPreselectedPlanId] = useState<number | null>(null);

  // ── Admin-driven popup banners ────────────────────────────────────────
  // `popups` is the full list of active popups the backend returned on
  // the last /api/popups poll. `activePopup` is whichever qualifying
  // popup we're currently showing on screen (never more than one at a
  // time — the user answers one before the next appears).
  //
  // Dismissed IDs are persisted per-device in localStorage. For
  // `show_once` popups this is permanent until the admin either
  // disables the popup or edits it (which bumps `updated_at`, giving
  // the popup a new fingerprint so it re-shows). For non-`show_once`
  // popups the dismissal only lasts the current app session.
  const [popups, setPopups] = useState<PopupBannerType[]>([]);
  const [activePopup, setActivePopup] = useState<PopupBannerType | null>(null);
  const dismissedPopupsRef = useRef<Set<string>>(new Set(
    (() => {
      try {
        const raw = localStorage.getItem('edata_dismissed_popups');
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch { return []; }
    })()
  ));
  const sessionDismissedPopupsRef = useRef<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('edata_current_user');
      if (saved) return JSON.parse(saved);
    } catch { }
    return DEFAULT_USER;
  });
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline'>('offline');
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Tracks the last time a wallet change toast was shown to prevent duplicate
  // toasts from fetchWalletFast and syncProfileAndWallet firing simultaneously.
  const lastWalletToastRef = useRef<number>(0);
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
    // App-level Quick Action PIN sheet takes precedence over the
    // view-history pop. Screen-internal overlays (BuyData's PIN, the
    // package/contact modals in ServiceForm, etc.) hook into the
    // Capacitor listener directly via `useBackHandler` and are drained
    // before this function is ever called.
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
      // Genuinely nothing to go back to — follow the Android convention
      // and exit the app.
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.exitApp();
      }).catch(() => { });
    }
  };

  // Route the legacy `handleNavigate` (still used by ProfileSettings,
  // TransactionHistory, ResellerUpgrade, referral) through `navigateTo`
  // so both paths share the same dedupe-consecutive-view rule. Without
  // this, back needed two presses after any of those screens navigated.
  const handleNavigate = (view: ActiveView, network?: string, planId?: number) => {
    navigateTo(view, { network, planId });
  };

  // Keep the Capacitor back-button listener wired to the LATEST
  // handleGoBack via a ref, and register it exactly ONCE on mount.
  // The previous implementation re-ran this effect on every relevant
  // state change and re-registered inside an async `import()`, so
  // cleanup often fired before the handler existed — leaving stacked
  // listeners with stale closures firing on every press.
  const handleGoBackRef = useRef(handleGoBack);
  handleGoBackRef.current = handleGoBack;

  useEffect(() => {
    let removeListener: (() => void) | null = null;
    let cancelled = false;

    import('@capacitor/app').then(({ App: CapApp }) => {
      if (cancelled) return;
      CapApp.addListener('backButton', () => {
        // Give any open overlay first crack at the press — a modal
        // or in-screen PIN closes without touching the view history.
        if (runBackHandlers()) return;
        handleGoBackRef.current();
      }).then(h => {
        if (cancelled) {
          h.remove();
          return;
        }
        removeListener = () => h.remove();
      });
    }).catch(() => { });

    return () => {
      cancelled = true;
      if (removeListener) removeListener();
    };
  }, []);

  const handleSetCurrentUser = (user: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setCurrentUser(prev => {
      const next = typeof user === 'function' ? user(prev) : user;
      try {
        localStorage.setItem('edata_current_user', JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const handleSetTransactions = (txs: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactions(prev => {
      const next = typeof txs === 'function' ? txs(prev) : txs;
      return next;
    });
  };


  // ── 1. Fast Independent Catalog Synchronizer (<0ms perceived from cache, silent live refresh) ──
  const syncCatalog = async (silent = true) => {
    try {
      const servicesRes = await api.getServices(silent);
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
      // pushed as a buyable, because the plans are the buyables.
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
          planTypeId: plan.plan_type_id ? Number(plan.plan_type_id) : null,
          planTypeName: plan.plan_type_name || '',
        });
      });

      // Sync Quick Actions from backend REST API
      const qaFromServices = resData.quick_actions || servicesRes?.data?.quick_actions || servicesRes?.quick_actions;
      if (Array.isArray(qaFromServices)) {
        setQuickActions(qaFromServices);
        try { localStorage.setItem('edata_cached_quick_actions', JSON.stringify(qaFromServices)); } catch { }
      } else {
        try {
          const qaRes = await api.getQuickActions(silent);
          const qaList = qaRes?.data?.quick_actions || qaRes?.data || qaRes || [];
          if (Array.isArray(qaList)) {
            setQuickActions(qaList);
            try { localStorage.setItem('edata_cached_quick_actions', JSON.stringify(qaList)); } catch { }
          }
        } catch { }
      }

      // Sync Plan Types from backend REST API
      const ptFromServices = resData.plan_types || servicesRes?.data?.plan_types || servicesRes?.plan_types;
      if (Array.isArray(ptFromServices)) {
        setPlanTypes(ptFromServices);
        try { localStorage.setItem('edata_cached_plan_types', JSON.stringify(ptFromServices)); } catch { }
      }

      if (mappedProducts.length > 0) {
        setProducts(mappedProducts);
        try { localStorage.setItem('edata_cached_products', JSON.stringify(mappedProducts)); } catch { }
      }

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
      if (catArray.length > 0) {
        setServiceCategories(catArray);
        try { localStorage.setItem('edata_cached_service_categories', JSON.stringify(catArray)); } catch { }
      }
    } catch (err) {
      // silent catalog sync
    }
  };

  // ── 2. User Profile & Wallet Synchronizer ──
  const syncProfileAndWallet = async (silent = true) => {
    const [profileRes, walletRes] = await Promise.all([
      api.getProfile(silent),
      api.getWallet(silent),
    ]);

    const user = profileRes?.data?.user || profileRes?.data || profileRes?.user || profileRes || {};
    const walletSucceeded = walletRes?.success !== false;
    const profileSucceeded = profileRes?.success !== false;
    const walletData = walletSucceeded ? (walletRes?.data?.wallet || walletRes?.data || walletRes?.wallet || {}) : {};

    let extractedBalance: number | null = null;
    if (walletSucceeded && walletRes?.data?.balance !== undefined && walletRes?.data?.balance !== null) {
      extractedBalance = parseFloat(walletRes.data.balance);
    }
    if (extractedBalance === null && walletSucceeded && walletRes?.data?.wallet_balance !== undefined) {
      extractedBalance = parseFloat(walletRes.data.wallet_balance);
    }
    if (extractedBalance === null && profileSucceeded) {
      const profData = profileRes?.data || {};
      if (profData.wallet_balance !== undefined && profData.wallet_balance !== null) {
        extractedBalance = parseFloat(profData.wallet_balance);
      } else if (profData.balance !== undefined && profData.balance !== null) {
        extractedBalance = parseFloat(profData.balance);
      }
      const profUser = profData.user || profData;
      if (extractedBalance === null && profUser.wallet_balance !== undefined) {
        extractedBalance = parseFloat(profUser.wallet_balance);
      }
      if (extractedBalance === null && profUser.balance !== undefined) {
        extractedBalance = parseFloat(profUser.balance);
      }
    }
    if (extractedBalance === null && walletSucceeded) {
      const wb = walletData?.balance ?? walletData?.wallet_balance ?? walletData?.walletBalance;
      if (wb !== undefined && wb !== null) {
        extractedBalance = parseFloat(wb);
      }
    }

    const parsedBalance = (extractedBalance !== null && !isNaN(extractedBalance))
      ? extractedBalance
      : currentUser.walletBalance;

    if (extractedBalance === null) {
      console.warn('[eData Wallet Sync] Could not extract balance from /api/wallet or /api/profile — using stale cached balance. walletRes:', walletRes, 'profileRes:', profileRes);
    }

    if (silent && currentUser.walletBalance > 0) {
      const now = Date.now();
      const canToast = now - lastWalletToastRef.current > 5000;
      if (parsedBalance > currentUser.walletBalance && canToast) {
        const diff = parsedBalance - currentUser.walletBalance;
        lastWalletToastRef.current = now;
        toast.success(`Wallet Credited! +₦${diff.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (New Balance: ₦${parsedBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })})`);
      } else if (parsedBalance < currentUser.walletBalance && canToast) {
        // Balance decreased — website purchase, admin deduction, or external transaction
        lastWalletToastRef.current = now;
        toast.info(`💳 Balance Updated: ₦${parsedBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      }
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
      } catch { }
    }

    const mainW = parseFloat(walletRes?.data?.main_wallet ?? walletRes?.data?.balance ?? parsedBalance);
    const commW = parseFloat(walletRes?.data?.commission_wallet ?? 0);
    const bonusW = parseFloat(walletRes?.data?.bonus_wallet ?? 0);
    const bonusExp = walletRes?.data?.bonus_expires_at ?? null;
    const totalEff = parseFloat(walletRes?.data?.total_effective_balance ?? (mainW + commW + bonusW));

    const syncedUser: UserProfile = {
      id: user.id || currentUser.id,
      name: computedName,
      firstname: firstName || currentUser.firstname || '',
      lastname: lastName || currentUser.lastname || '',
      email: user.email || currentUser.email || '',
      phone: user.phone || user.mobile || currentUser.phone || '',
      walletBalance: totalEff > 0 ? totalEff : parsedBalance,
      mainWallet: mainW,
      commissionWallet: commW,
      bonusWallet: bonusW,
      bonusExpiresAt: bonusExp,
      totalEffectiveBalance: totalEff,
      category: user.level_label || user.category || user.user_level || currentUser.category || 'Basic User',
      bvn: user.bvn || currentUser.bvn || '',
      nin: user.nin || currentUser.nin || '',
      isVerified: true,
      pinCode: '',
      hasPin: user.has_pin !== undefined ? Boolean(user.has_pin) : (user.hasPin !== undefined ? Boolean(user.hasPin) : currentUser.hasPin),
      hasPendingUpgrade: Boolean(user.has_pending_upgrade),
      upgradeFee: parseFloat(user.premium_upgrade_fee || user.upgrade_fee || '0'),
      photo: resolveImageUrl(user.photo || user.avatar || user.picture) || currentUser.photo || null,
      avatar: resolveImageUrl(user.avatar || user.photo || user.picture) || currentUser.avatar || null,
      picture: resolveImageUrl(user.picture || user.photo || user.avatar) || currentUser.picture || null,
      virtualAccount: primaryVAccount,
      virtualAccounts: vAccounts,
    };

    handleSetCurrentUser(syncedUser);
  };

  // ── 3. Transaction History Synchronizer ──
  const syncTransactions = async (silent = true) => {
    try {
      const txRes = await api.getTransactions(silent);
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
      try { localStorage.setItem('edata_cached_transactions', JSON.stringify(mappedTx)); } catch { }
    } catch { }
  };

  // ── 4. Notifications Synchronizer ──
  const syncNotifications = async (silent = true) => {
    try {
      const notifsRes = await api.getNotifications(silent);
      const notifArray = notifsRes?.data?.notifications || notifsRes?.notifications || (Array.isArray(notifsRes?.data) ? notifsRes.data : Array.isArray(notifsRes) ? notifsRes : []);
      const unread = notifsRes?.data?.unread_count ?? notifArray.filter((n: any) => !n.is_read && !n.read).length;
      setUnreadCount(unread);
    } catch { }
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      await Promise.allSettled([
        syncCatalog(silent),
        syncProfileAndWallet(silent),
        syncTransactions(silent),
        syncNotifications(silent),
      ]);
      setApiStatus('connected');
      setLastSynced(new Date().toLocaleTimeString());
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
      // Initialize Push Notifications on mobile
      initPushNotifications((targetView) => {
        if (targetView) navigateTo(targetView);
      }, toast);
    } else {
      // No token — always show login screen
      setCurrentScreen('auth');
      checkConnectionOnLoad();
    }
  }, []);

  // ── Rapid Lightweight Wallet Synchronizer (<100ms response) ──
  // Polls /api/wallet every 2.5s to detect credits AND debits (website
  // purchases, admin adjustments, etc.) and keeps the mobile UI in sync.
  const fetchWalletFast = async (silent = true) => {
    if (!getAuthToken()) return;
    try {
      const walletRes = await api.getWallet(silent);
      if (walletRes && walletRes.success !== false) {
        const walletData = walletRes.data || walletRes;
        const mainW = parseFloat(walletData?.main_wallet ?? walletData?.balance ?? 0);
        const commW = parseFloat(walletData?.commission_wallet ?? 0);
        const bonusW = parseFloat(walletData?.bonus_wallet ?? 0);
        const bonusExp = walletData?.bonus_expires_at ?? null;
        const totalEff = parseFloat(walletData?.total_effective_balance ?? (mainW + commW + bonusW));
        const newBalance = totalEff > 0 ? totalEff : mainW;

        if (newBalance !== undefined && !isNaN(newBalance)) {
          setCurrentUser(prev => {
            const now = Date.now();
            const canToast = now - lastWalletToastRef.current > 5000; // Prevent duplicate toasts within 5s

            if (prev.walletBalance > 0 && newBalance > prev.walletBalance && canToast) {
              const diff = newBalance - prev.walletBalance;
              lastWalletToastRef.current = now;
              toast.success(`⚡ Wallet Credited! +₦${diff.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (New Balance: ₦${newBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })})`);
            } else if (prev.walletBalance > 0 && newBalance < prev.walletBalance && canToast) {
              // Debit detected — likely a website purchase, admin deduction, or
              // external transaction. Notify the user so they know the mobile
              // app is fully synced with the server.
              lastWalletToastRef.current = now;
              toast.info(`💳 Balance Updated: ₦${newBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
            }
            const updated: UserProfile = {
              ...prev,
              walletBalance: newBalance,
              mainWallet: mainW,
              commissionWallet: commW,
              bonusWallet: bonusW,
              bonusExpiresAt: bonusExp,
              totalEffectiveBalance: totalEff,
            };
            try {
              localStorage.setItem('edata_current_user', JSON.stringify(updated));
            } catch { }
            return updated;
          });
        }
      } else {
        console.warn('[eData Wallet Sync] /api/wallet returned failure:', walletRes);
      }
    } catch (err) {
      // Log wallet sync errors so they can be debugged — previously silent.
      console.warn('[eData Wallet Sync] fetchWalletFast error:', err);
    }
  };

  // ── Ultra-Fast Real-Time Background Synchronization Engine (2.5s Rapid Wallet Heartbeat) ──
  useEffect(() => {
    let walletPollInterval: any = null;
    let fullSyncInterval: any = null;
    let capAppListener: any = null;

    const startPolling = () => {
      stopPolling();
      // Rapid 2.5s lightweight wallet top-up check (DVA auto-credit detection)
      walletPollInterval = setInterval(() => {
        if (getAuthToken() && currentScreen === 'app') {
          fetchWalletFast(true);
        }
      }, 2500);

      // Periodic 30s full catalog & transaction sync
      fullSyncInterval = setInterval(() => {
        if (getAuthToken() && currentScreen === 'app') {
          fetchAllData(true);
        }
      }, 30000);
    };

    const stopPolling = () => {
      if (walletPollInterval) {
        clearInterval(walletPollInterval);
        walletPollInterval = null;
      }
      if (fullSyncInterval) {
        clearInterval(fullSyncInterval);
        fullSyncInterval = null;
      }
    };

    if (getAuthToken() && currentScreen === 'app') {
      startPolling();
    } else {
      stopPolling();
    }

    // Instant Sync on Foreground App Focus (When returning from Banking App after DVA transfer)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && getAuthToken() && currentScreen === 'app') {
        fetchWalletFast(true);
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
          fetchWalletFast(true);
          fetchAllData(true);
          startPolling();
        } else if (!state.isActive) {
          stopPolling();
        }
      }).then(l => {
        capAppListener = l;
      });
    }).catch(() => { });

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capAppListener && capAppListener.remove) {
        capAppListener.remove();
      }
    };
  }, [currentScreen]);

  const handleGlobalRefresh = () => {
    fetchAllData();
  };

  // ── Popup banner fetcher ────────────────────────────────────────────
  // Kept independent of `fetchAllData` so the /api/popups endpoint can be
  // rolled out separately without threatening the main sync. Runs silent
  // (never toasts an error) — a popup source going down should never
  // interrupt the user, just quietly leave popups off.
  const fetchPopups = async () => {
    try {
      const res: any = await api.getPopups(true);
      const list: PopupBannerType[] =
        res?.data?.popups
        || res?.popups
        || (Array.isArray(res?.data) ? res.data : [])
        || [];
      if (Array.isArray(list)) {
        setPopups(list);
      }
    } catch {
      // Endpoint unavailable → no popups this cycle; keep last-known list.
    }
  };

  // Compute a stable per-popup fingerprint. Editing a popup in the admin
  // panel bumps `updated_at`, which changes the fingerprint — so a popup
  // the user dismissed earlier will re-show after the admin refreshes
  // its copy. Without this, an admin fixing a typo would never reach
  // users who'd already tapped "Got it" on the buggy version.
  const popupKey = (p: PopupBannerType) => `${p.id}::${p.updated_at || p.created_at || ''}`;

  // Pick the highest-priority popup that:
  //   1. Is active
  //   2. The user hasn't dismissed on this device (or session, for
  //      non-show_once popups)
  //   3. Isn't already the one showing
  useEffect(() => {
    if (activePopup) return; // Only one popup at a time
    if (!popups || popups.length === 0) return;

    // Sort: display_order asc, then id desc (same order the backend
    // returned, but be defensive in case a caller re-ordered).
    const sorted = [...popups].sort((a, b) => {
      const oa = a.display_order ?? 0;
      const ob = b.display_order ?? 0;
      if (oa !== ob) return oa - ob;
      return Number(b.id) - Number(a.id);
    });

    const next = sorted.find(p => {
      if (p.status === 0 || p.status === false) return false;
      const key = popupKey(p);
      const forThisSession = sessionDismissedPopupsRef.current.has(key);
      const permanent = p.show_once !== false
        ? dismissedPopupsRef.current.has(key)
        : false;
      return !forThisSession && !permanent;
    });

    if (next) setActivePopup(next);
  }, [popups, activePopup]);

  const persistDismissedPopups = () => {
    try {
      localStorage.setItem(
        'edata_dismissed_popups',
        JSON.stringify(Array.from(dismissedPopupsRef.current))
      );
    } catch { }
  };

  const handlePopupDismiss = () => {
    if (!activePopup) return;
    const key = popupKey(activePopup);
    sessionDismissedPopupsRef.current.add(key);
    if (activePopup.show_once !== false) {
      dismissedPopupsRef.current.add(key);
      persistDismissedPopups();
    }
    setActivePopup(null);
  };

  // Resolve a popup URL into an action. Supported forms:
  //   • `https://…` / `http://…`       → open externally (Capacitor Browser
  //                                       plugin if available, else window.open)
  //   • `app://<view>`                  → in-app navigate to a known ActiveView
  //   • bare `<view>` (matches ActiveView) → in-app navigate
  //   • anything else                   → open externally as best-effort
  const handlePopupAction = (rawUrl: string) => {
    if (!rawUrl) { handlePopupDismiss(); return; }
    const url = rawUrl.trim();

    const knownViews: ActiveView[] = [
      'dashboard', 'services', 'airtime', 'data', 'cable', 'electricity',
      'exams', 'a2c', 'fund', 'history', 'profile', 'support',
      'notifications', 'upgrade', 'referral',
    ];

    const tryInAppRoute = (route: string) => {
      const clean = route.replace(/^\/+/, '').split(/[?#]/)[0];
      if ((knownViews as string[]).includes(clean)) {
        navigateTo(clean as ActiveView);
        return true;
      }
      return false;
    };

    // app://<view>
    if (url.startsWith('app://')) {
      const route = url.slice('app://'.length);
      if (tryInAppRoute(route)) {
        handlePopupDismiss();
        return;
      }
    }

    // Bare in-app view name (no scheme)
    if (!/^[a-z]+:\/\//i.test(url) && tryInAppRoute(url)) {
      handlePopupDismiss();
      return;
    }

    // External URL — prefer Capacitor's in-app browser so users return
    // to eData cleanly. Falls back to window.open for plain web builds.
    import('@capacitor/browser')
      .then(({ Browser }) => Browser.open({ url }))
      .catch(() => {
        try { window.open(url, '_blank', 'noopener,noreferrer'); } catch { }
      });

    // For force-update popups (dismissible=false) DON'T remove the popup
    // from screen — the user should be nudged back to it if they cancel
    // the store install. For dismissible popups, treating the tap as a
    // dismissal is the expected UX.
    if (activePopup?.dismissible !== false) {
      handlePopupDismiss();
    }
  };

  // Fetch popups on login and on foreground focus, then every 60s while
  // the app is in the foreground. This uses its own cadence — the
  // 3-second wallet/tx heartbeat is too aggressive for content that
  // rarely changes.
  useEffect(() => {
    if (currentScreen !== 'app' && currentScreen !== 'auth') return;

    // First fetch immediately (both on auth screen and logged-in state,
    // so guest-targeted popups render on the login page too).
    fetchPopups();

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchPopups();
    }, 60_000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchPopups();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentScreen]);

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    setCurrentScreen('app');
    setActiveView('dashboard');
    setViewHistory(['dashboard']);
    fetchAllData();
    initPushNotifications((targetView) => {
      if (targetView) navigateTo(targetView);
    }, toast);
    syncPushTokenOnLogin();
  };

  const handleLogout = () => {
    setAuthToken(null);
    // Clear user-specific private data (tokens, profile, wallet, transactions).
    // The public catalog (plans, plan types, quick actions) is retained so the next
    // session / login renders instantly with 0ms delay.
    [
      'edata_token',
      'edata_current_user',
      'edata_sandbox',
      'google_session',
      'edata_virtual_account',
      'edata_cached_transactions',
      'edata_dismissed_popups',
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch { }
    });
    dismissedPopupsRef.current.clear();
    sessionDismissedPopupsRef.current.clear();
    setActivePopup(null);
    setPopups([]);
    setCurrentUser(DEFAULT_USER);
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

    // Trigger silent background catalog check when switching between active service views
    if (['dashboard', 'services', 'airtime', 'data'].includes(targetView) && getAuthToken()) {
      syncCatalog(true);
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
              {/* Dashboard is eager — renders instantly on entry, no chunk fetch. */}
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

              {/* Lazy routes — each screen is its own chunk. Suspense shows a
                  quiet dot loader for the ~50-200 ms of first fetch; subsequent
                  visits to the same route render instantly from cache. */}
              <React.Suspense fallback={<RouteFallback />}>
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
              </React.Suspense>

              {/* Floating Glassmorphic Bottom Navigation */}
              <BottomNav activeView={activeView} onNavigate={navigateTo} />

              {/* ── Direct Quick Action PIN Checkout Screen ── */}
              {pinScreenMode && (
                <PinScreen
                  mode={pinScreenMode}
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

        {/* ── Dynamic In-App Popup Banner ────────────────────────────────
            Admin-managed via /api/popups. Renders above every screen
            (auth and app) so guest-targeted popups can reach signed-out
            users too. Only one popup is ever on screen; the effect that
            picks `activePopup` promotes the next qualifying popup after
            the current one is dismissed. */}
        {activePopup && (
          <PopupBanner
            popup={activePopup}
            onDismiss={handlePopupDismiss}
            onAction={handlePopupAction}
            onSecondary={handlePopupAction}
          />
        )}
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
