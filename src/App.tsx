import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction } from './types';
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
  | 'notifications';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline'>('offline');
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'app'>(() => {
    return getAuthToken() ? 'app' : 'auth';
  });
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const handleSetCurrentUser = (user: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setCurrentUser(prev => {
      const next = typeof user === 'function' ? user(prev) : user;
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

      const dbServices: any[] = servicesRes.data?.services || servicesRes.services || [];
      const dbPlans: any[] = servicesRes.data?.plans || servicesRes.plans || [];

      const mappedProducts: ProductItem[] = [];

      dbServices.forEach((srv) => {
        let category: any = 'Airtime';
        if (srv.category_id === 1) category = 'Airtime';
        else if (srv.category_id === 2) category = 'Data';
        else if (srv.category_id === 3) category = 'Exam Token';
        else if (srv.category_id === 4) category = 'Cable TV';
        else if (srv.category_id === 5) category = 'Electricity';
        else if (srv.category_id === 6) category = 'A2C';

        mappedProducts.push({
          id: String(srv.id),
          category: category,
          name: srv.name,
          operator: srv.slug.includes('mtn') ? 'MTN' : srv.slug.includes('glo') ? 'Glo' : srv.slug.includes('airtel') ? 'Airtel' : srv.slug.includes('9mobile') ? '9mobile' : srv.slug.toUpperCase(),
          priceNormal: parseFloat(srv.price),
          priceReferred: parseFloat(srv.price),
          pricePremium: parseFloat(srv.price),
          active: srv.status === 1,
          description: srv.description || '',
        });
      });

      dbPlans.forEach((plan) => {
        const parentSrv = dbServices.find(s => s.id === plan.service_type_id);
        const operatorName = parentSrv 
          ? (parentSrv.slug.includes('mtn') ? 'MTN' : parentSrv.slug.includes('glo') ? 'Glo' : parentSrv.slug.includes('airtel') ? 'Airtel' : parentSrv.slug.includes('9mobile') ? '9mobile' : parentSrv.slug.toUpperCase())
          : 'MTN';

        mappedProducts.push({
          id: `plan-${plan.id}-${plan.service_type_id}`,
          category: 'Data',
          name: plan.name,
          operator: operatorName,
          priceNormal: parseFloat(plan.price),
          priceReferred: parseFloat(plan.price),
          pricePremium: parseFloat(plan.price),
          active: true,
          description: plan.description || plan.name,
          planType: plan.plan_type || 'SME',
        });
      });

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

      const user = profileRes.data || profileRes;
      const walletData = walletRes.data || walletRes;
      setCurrentUser({
        id: user.id,
        name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'eData User',
        email: user.email,
        phone: user.phone || '',
        walletBalance: parseFloat(walletData.balance || '0'),
        category: user.level_label || 'Basic User',
        bvn: '',
        nin: '',
        isVerified: true,
        pinCode: '',
        hasPin: user.has_pin || false,
        hasPendingUpgrade: user.has_pending_upgrade || false,
        upgradeFee: user.premium_upgrade_fee || 5000,
        photo: resolveImageUrl(user.photo) || null,
      });

      setApiStatus('connected');
      setLastSynced(new Date().toLocaleTimeString());
      setCurrentScreen('app');

      // Sync Notifications unread count from exact Yii2 ApiController schema
      try {
        const notifsRes = await api.getNotifications();
        const notifArray = notifsRes?.data?.notifications || notifsRes?.notifications || (Array.isArray(notifsRes?.data) ? notifsRes.data : Array.isArray(notifsRes) ? notifsRes : []);
        const unread = notifsRes?.data?.unread_count ?? notifArray.filter((n: any) => !n.is_read && !n.read).length;
        setUnreadCount(unread);
      } catch {}
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid credentials')) {
        setAuthToken(null);
        setCurrentScreen('auth');
      } else {
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
      fetchAllData();
    } else {
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
  };

  const navigateTo = (view: string) => {
    setActiveView(view as ActiveView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ToastProvider>
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
                  onBack={() => navigateTo('dashboard')}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'data' && (
                <BuyData
                  currentUser={currentUser}
                  products={products}
                  onBack={() => navigateTo('dashboard')}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'cable' && (
                <CableTV
                  currentUser={currentUser}
                  products={products}
                  onBack={() => navigateTo('dashboard')}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'electricity' && (
                <ElectricityBill
                  currentUser={currentUser}
                  products={products}
                  onBack={() => navigateTo('dashboard')}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'exams' && (
                <ExamPins
                  currentUser={currentUser}
                  products={products}
                  onBack={() => navigateTo('dashboard')}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'a2c' && (
                <AirtimeToCash
                  currentUser={currentUser}
                  products={products}
                  onBack={() => navigateTo('dashboard')}
                  onSuccess={handleGlobalRefresh}
                />
              )}

              {activeView === 'fund' && (
                <FundWallet
                  currentUser={currentUser}
                  onBack={() => navigateTo('dashboard')}
                  onRefreshWallet={handleGlobalRefresh}
                />
              )}

              {activeView === 'history' && (
                <TransactionHistory
                  transactions={transactions}
                  onBack={() => navigateTo('dashboard')}
                />
              )}

              {activeView === 'profile' && (
                <ProfileSettings
                  currentUser={currentUser}
                  setCurrentUser={handleSetCurrentUser}
                  onBack={() => navigateTo('dashboard')}
                  onLogout={handleLogout}
                />
              )}

              {activeView === 'support' && (
                <HelpSupport
                  onBack={() => navigateTo('dashboard')}
                />
              )}

              {activeView === 'notifications' && (
                <Notifications
                  onBack={() => navigateTo('dashboard')}
                  onRefreshUnreadCount={(count) => setUnreadCount(count)}
                />
              )}

              {/* Floating Glassmorphic Bottom Navigation */}
              <BottomNav activeView={activeView} onNavigate={navigateTo} />
            </>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
