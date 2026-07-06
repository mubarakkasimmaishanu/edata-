import React, { useState } from 'react';
import MobileSimulator from './components/MobileSimulator';
import { INITIAL_SUBSCRIBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_USER } from './data';
import { UserProfile, ProductItem, Transaction } from './types';
import { Smartphone, RotateCw, Shield, AlertCircle } from 'lucide-react';

export default function App() {
  const [subscribers, setSubscribers] = useState<UserProfile[]>(INITIAL_SUBSCRIBERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline'>('connected');
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Global Refresh function to simulate reloading from Yii2 API
  const handleGlobalRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSynced(new Date().toLocaleTimeString());
      setApiStatus('connected');
      // Briefly restore default user stats or update balance slightly to simulate live API reload
      setCurrentUser(curr => ({
        ...curr,
        walletBalance: curr.walletBalance + (Math.random() > 0.5 ? 500 : 0) // Simulated random funding or dynamic sync
      }));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 font-sans selection:bg-sky-500 selection:text-white" id="standalone-mobile-frame">
      
      {/* Top API Status bar for Developer preview context */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[390px] px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl mb-3 text-xs gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiStatus === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Yii2 Core API: <span className="text-white">Connected</span>
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

      {/* Central mobile phone view container */}
      <div className="w-full sm:w-[390px] h-full sm:h-auto shrink-0 flex flex-col items-center justify-center bg-slate-950/20 sm:border sm:border-slate-800/80 rounded-none sm:rounded-[40px] p-0 sm:p-2 sm:shadow-2xl">
        <MobileSimulator 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          products={products}
          transactions={transactions}
          setTransactions={setTransactions}
          subscribers={subscribers}
          setSubscribers={setSubscribers}
          handleGlobalRefresh={handleGlobalRefresh}
          isSyncing={isSyncing}
        />
      </div>

      {/* Standalone footer notice */}
      <div className="hidden sm:block text-center text-[10px] text-slate-500 mt-4 max-w-[320px] font-mono leading-relaxed">
        eData Mobile Native Client. Communicating securely with Yii2 Advanced Backend.
      </div>

    </div>
  );
}
