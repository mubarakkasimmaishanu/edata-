import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/Toast';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction, QuickAction } from './types';
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
  | 'upgrade';

function MainApp() {
  const toast = useToast();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
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

  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      const [profileRes, walletRes, txRes, servicesRes] = await Promise.all([
        api.getProfile(),
        api.getWallet(),
        api.getTransactions(),
        api.getServices(),
      ]);

      const resData = servicesRes.data || servicesRes;
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

      dbServices.forEach((srv) => {
        let category: any = 'Airtime';
        if (srv.category_id === 1) category = 'Airtime';
        else if (srv.category_id === 2) category = 'Data';
        else if (srv.category_id === 3) category = 'Exam Token';
        else if (srv.category_id === 4) category = 'Cable TV';
        else if (srv.category_id === 5) category = 'Electricity';
        else if (srv.category_id === 6) category = 'A2C';

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

        mappedProducts.push({
          id: `plan-${plan.id}-${plan.service_type_id || '0'}`,
          category: planCat,
          name: plan.name || 'Data Plan',
          operator: operatorName,
          priceNormal: parseFloat(plan.price || plan.amount || '0'),
          priceReferred: parseFloat(plan.price || plan.amount || '0'),
          pricePremium: parseFloat(plan.price || plan.amount || '0'),
          active: plan.status === undefined || plan.status === 1 || plan.status === true,
          description: plan.description || plan.name || '',
          planType: plan.plan_type || plan.type || 'SME',
        });
      });

      // Sync Quick Actions from backend REST API
      const qaFromServices = resData.quick_actions || servicesRes.data?.quick_actions || servicesRes.quick_actions;
      if (Array.isArray(qaFromServices)) {
        setQuickActions(qaFromServices);
      } else {
        try {
          const qaRes = await api.getQuickActions();
          const qaList = qaRes.data?.quick_actions || qaRes.data || qaRes || [];
          if (Array.isArray(qaList)) setQuickActions(qaList);
        } catch {}
      }

      setProducts(mappedProducts);

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

      const user = profileRes.data?.user || profileRes.data || profileRes.user || profileRes;
      const walletData = walletRes.data?.wallet || walletRes.data || walletRes.wallet || walletRes;

      const rawBalance = walletData?.balance ?? walletData?.walletBalance ?? walletData?.wallet ?? user?.walletBalance ?? user?.balance ?? '0';
      const parsedBalance = !isNaN(parseFloat(rawBalance)) ? parseFloat(rawBalance) : 0;

      const firstName = user.firstname || user.first_name || '';
      const lastName = user.lastname || user.last_name || '';
      const computedName = `${firstName} ${lastName}`.trim() || user.name || user.username || user.email?.split('@')[0] || currentUser.name || 'eData User';

      const vAccounts: any[] = walletRes.data?.virtual_accounts || walletRes.virtual_accounts || (walletRes.data?.virtual_account ? [walletRes.data.virtual_account] : walletRes.virtual_account ? [walletRes.virtual_account] : []);
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
        upgradeFee: parseFloat(user.premium_upgrade_fee || '5000'),
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
        const notifsRes = await api.getNotifications();
        const notifArray = notifsRes?.data?.notifications || notifsRes?.notifications || (Array.isArray(notifsRes?.data) ? notifsRes.data : Array.isArray(notifsRes) ? notifsRes : []);
        const unread = notifsRes?.data?.unread_count ?? notifArray.filter((n: any) => !n.is_read && !n.read).length;
        setUnreadCount(unread);
      } catch {}
    } catch (err: any) {
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
    } finally {
      setIsSyncing(false);
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
    localStorage.removeItem('edata_token');
    localStorage.removeItem('edata_current_user');
    localStorage.removeItem('edata_sandbox');
    localStorage.removeItem('google_session');
    setCurrentUser(DEFAULT_USER);
    setApiStatus('offline');
    setCurrentScreen('auth');
    setActiveView('dashboard');
    setViewHistory(['dashboard']);
  };

  const navigateTo = (view: string, params?: { network?: string; planId?: number | null; quickAction?: QuickAction }) => {
    // If a Quick Action object with a specific plan_id was selected, trigger direct PIN checkout flow
    if (params?.quickAction && params.quickAction.plan_id) {
      handleQuickActionDirectCheckout(params.quickAction);
      return;
    }

    const nextView = view as ActiveView;
    if (nextView !== activeView) {
      setViewHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1] === nextView) return prev;
        return [...prev, nextView];
      });
      setActiveView(nextView);
    }

    if (params?.network) setPreselectedNetwork(params.network);
    else setPreselectedNetwork('');
    if (params?.planId !== undefined) setPreselectedPlanId(params.planId);
    else setPreselectedPlanId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickActionDirectCheckout = (action: QuickAction) => {
    // 1. Resolve product & dynamic item price
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
      const titleLower = action.title.toLowerCase();
      if (titleLower.includes('1gb')) itemPrice = 300;
      else if (titleLower.includes('2gb')) itemPrice = 600;
      else if (titleLower.includes('5gb')) itemPrice = 1500;
      else if (titleLower.includes('waec')) itemPrice = 3500;
      else itemPrice = 500;
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

    const netUpper = (activeQuickAction.network || 'MTN').toUpperCase();
    const serviceType = activeQuickAction.service_type || 'data';

    let serviceId = 27; // MTN Data by default
    if (serviceType === 'airtime') {
      const netMap: Record<string, number> = { MTN: 23, GLO: 25, AIRTEL: 24, '9MOBILE': 26 };
      serviceId = netMap[netUpper] || 23;
    } else if (serviceType === 'data') {
      const dataMap: Record<string, number> = { MTN: 27, GLO: 29, AIRTEL: 28, '9MOBILE': 30 };
      serviceId = dataMap[netUpper] || 27;
    } else if (serviceType === 'exams') {
      serviceId = 13;
    } else if (serviceType === 'cable') {
      serviceId = 4;
    } else if (serviceType === 'electricity') {
      serviceId = 5;
    } else if (serviceType === 'a2c') {
      serviceId = 6;
    }

    const recipientNum = customRecipient || currentUser.phone || '08000000000';

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
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'electricity' && (
                <ElectricityBill
                  currentUser={currentUser}
                  products={products}
                  onBack={handleGoBack}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'exams' && (
                <ExamPins
                  currentUser={currentUser}
                  products={products}
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
                />
              )}

              {activeView === 'profile' && (
                <ProfileSettings
                  currentUser={currentUser}
                  setCurrentUser={handleSetCurrentUser}
                  onBack={handleGoBack}
                  onLogout={handleLogout}
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

              {activeView === 'upgrade' && (
                <PinScreen
                  mode="upgrade_pin"
                  userEmail={currentUser.email}
                  onBack={handleGoBack}
                  onSuccess={() => {
                    setCurrentUser(prev => ({ ...prev, category: 'Premium User' }));
                    handleGlobalRefresh();
                    handleGoBack();
                  }}
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
