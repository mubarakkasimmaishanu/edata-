import React, { useState, useEffect } from 'react';
import MobileSimulator from './components/MobileSimulator';
import { ToastProvider } from './components/Toast';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction } from './types';
import { api, getAuthToken, setAuthToken, API_BASE_URL } from './services/api';

export default function App() {
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline' | 'sandbox'>('offline');
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'otp' | 'password_create' | 'bvn_verify' | 'app'>('auth');

  // Helper wrappers to sync updates
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

  const handleSetSubscribers = (subs: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    setSubscribers(prev => {
      const next = typeof subs === 'function' ? subs(prev) : subs;
      return next;
    });
  };

  // Fetch all user information, wallet status, transaction history, and dynamic rates/services
  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch Profile
      const profileRes = await api.getProfile();
      // 2. Fetch Wallet
      const walletRes = await api.getWallet();
      // 3. Fetch Transactions
      const txRes = await api.getTransactions();
      // 4. Fetch Services & Plans
      const servicesRes = await api.getServices();

      // Map dynamic services/plans to products
      const dbServices: any[] = servicesRes.data.services || [];
      const dbPlans: any[] = servicesRes.data.plans || [];

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
          description: '',
        });
      });

      setProducts(mappedProducts);

      const mappedTx: Transaction[] = (txRes.data || []).map((t: any) => ({
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

      const user = profileRes.data;
      setCurrentUser({
        id: user.id,
        name: `${user.firstname} ${user.lastname}`.trim() || 'eData User',
        email: user.email,
        phone: user.phone || '',
        walletBalance: parseFloat(walletRes.data.balance || '0'),
        category: user.level_label || 'Basic User',
        bvn: '',
        nin: '',
        isVerified: true,
        pinCode: '',
        hasPin: user.has_pin || false,
        hasPendingUpgrade: user.has_pending_upgrade || false,
        upgradeFee: user.premium_upgrade_fee || 5000,
      });

      setApiStatus('connected');
      setLastSynced(new Date().toLocaleTimeString());
      setCurrentScreen('app');
    } catch (err) {
      console.error('API Sync Error:', err);
      setApiStatus('offline');
      setCurrentScreen('auth');
    } finally {
      setIsSyncing(false);
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
      fetchAllData();
    } else {
      setCurrentScreen('auth');
      checkConnectionOnLoad();
    }
  }, []);

  const handleGlobalRefresh = () => {
    fetchAllData();
  };

  const handleLoginSuccess = (token: string) => {
    fetchAllData();
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(DEFAULT_USER);
    setApiStatus('offline');
    setCurrentScreen('auth');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white" id="standalone-mobile-frame">
        {/* Full Width Responsive App Container */}
        <div className="w-full flex-1 flex flex-col">
          <MobileSimulator 
            currentUser={currentUser}
            setCurrentUser={handleSetCurrentUser}
            products={products}
            transactions={transactions}
            setTransactions={handleSetTransactions}
            subscribers={subscribers}
            setSubscribers={handleSetSubscribers}
            handleGlobalRefresh={handleGlobalRefresh}
            isSyncing={isSyncing}
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
            apiStatus={apiStatus}
            setApiStatus={setApiStatus}
          />
        </div>
      </div>
    </ToastProvider>
  );
}
