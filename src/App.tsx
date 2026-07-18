import React, { useState, useEffect } from 'react';
import MobileSimulator from './components/MobileSimulator';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction } from './types';
import { Smartphone, RotateCw } from 'lucide-react';
import { api, getAuthToken, setAuthToken } from './services/api';

export default function App() {
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline' | 'sandbox'>('offline');
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'otp' | 'password_create' | 'bvn_verify' | 'app'>('auth');

  // Helper wrappers to sync sandbox updates to localStorage
  const handleSetCurrentUser = (user: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setCurrentUser(prev => {
      const next = typeof user === 'function' ? user(prev) : user;
      if (localStorage.getItem('edata_sandbox') === 'true') {
        localStorage.setItem('edata_current_user', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSetTransactions = (txs: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactions(prev => {
      const next = typeof txs === 'function' ? txs(prev) : txs;
      if (localStorage.getItem('edata_sandbox') === 'true') {
        localStorage.setItem('edata_transactions', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSetSubscribers = (subs: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    setSubscribers(prev => {
      const next = typeof subs === 'function' ? subs(prev) : subs;
      if (localStorage.getItem('edata_sandbox') === 'true') {
        localStorage.setItem('edata_subscribers', JSON.stringify(next));
      }
      return next;
    });
  };

  // Fetch all user information, wallet status, transaction history, and dynamic rates/services
  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      const sandboxFlag = localStorage.getItem('edata_sandbox') === 'true';
      if (sandboxFlag) {
        setApiStatus('sandbox');
        
        // Hydrate from localStorage or defaults
        const storedUsers = localStorage.getItem('edata_subscribers');
        if (storedUsers) {
          setSubscribers(JSON.parse(storedUsers));
        } else {
          localStorage.setItem('edata_subscribers', JSON.stringify(INITIAL_SUBSCRIBERS));
          setSubscribers(INITIAL_SUBSCRIBERS);
        }

        const storedProducts = localStorage.getItem('edata_products');
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        } else {
          localStorage.setItem('edata_products', JSON.stringify(INITIAL_PRODUCTS));
          setProducts(INITIAL_PRODUCTS);
        }

        const storedTx = localStorage.getItem('edata_transactions');
        if (storedTx) {
          setTransactions(JSON.parse(storedTx));
        } else {
          localStorage.setItem('edata_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
          setTransactions(INITIAL_TRANSACTIONS);
        }

        const storedUser = localStorage.getItem('edata_current_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          localStorage.setItem('edata_current_user', JSON.stringify(DEFAULT_USER));
          setCurrentUser(DEFAULT_USER);
        }

        setLastSynced(new Date().toLocaleTimeString());
        setCurrentScreen('app');
        setIsSyncing(false);
        return;
      }

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
      });

      setApiStatus('connected');
      setLastSynced(new Date().toLocaleTimeString());
      setCurrentScreen('app');
    } catch (err) {
      console.error('API Sync Error:', err);
      // If we encounter a sync error, set to offline. Don't auto-force screen to auth if we are already in sandbox
      if (localStorage.getItem('edata_sandbox') !== 'true') {
        setApiStatus('offline');
        setCurrentScreen('auth');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const checkConnectionOnLoad = async () => {
      try {
        const res = await fetch('http://localhost/edata/api/detect-network?phone=0803');
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
    const sandbox = localStorage.getItem('edata_sandbox') === 'true';
    if (sandbox) {
      fetchAllData();
    } else if (token) {
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
    localStorage.removeItem('edata_sandbox');
    localStorage.removeItem('edata_current_user');
    setCurrentUser(DEFAULT_USER);
    setApiStatus('offline');
    setCurrentScreen('auth');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 font-sans selection:bg-sky-500 selection:text-white" id="standalone-mobile-frame">
      
      {/* Top API Status bar for Developer preview context */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[390px] px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl mb-3 text-xs gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              apiStatus === 'connected' ? 'bg-emerald-400' : apiStatus === 'sandbox' ? 'bg-amber-400' : 'bg-rose-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'sandbox' ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Yii2 Core API: <span className="text-white">{
              apiStatus === 'connected' ? 'Connected' : apiStatus === 'sandbox' ? 'Sandbox Mode' : 'Offline'
            }</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Synced {lastSynced}</span>
          <button 
            type="button" 
            onClick={handleGlobalRefresh}
            className={`p-1 hover:bg-slate-800 rounded text-slate-300 transition-all ${isSyncing ? 'animate-spin text-sky-400' : ''}`}
            title="Force Sync with Backend API"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Responsive App Container */}
      <div className="w-full max-w-md flex flex-col items-center justify-center">
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

      {/* Standalone footer notice */}
      <div className="hidden sm:block text-center text-[10px] text-slate-500 mt-4 max-w-[320px] font-mono leading-relaxed">
        eData Mobile Native Client. Communicating securely with Yii2 Advanced Backend.
      </div>

    </div>
  );
}
