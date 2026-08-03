import React, { useState } from 'react';
import { UserProfile, Transaction, QuickAction, VirtualAccount } from '../types';
import {
  Eye, EyeOff, Plus, RefreshCw, Bell, Smartphone, Wifi, Tv, Lightbulb,
  BookOpen, Repeat, ArrowRight, ShieldCheck, ChevronRight, Copy, Check, Sparkles, Layers, Headphones, Clock, Gift, User, Sun, Moon, MoreHorizontal
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import mtnIcon from '@/assets/icons/mtn.png';
import airtelIcon from '@/assets/icons/airtel.png';
import gloIcon from '@/assets/icons/glo.png';
import nineMobileIcon from '@/assets/icons/9mobile.png';
import dstvIcon from '@/assets/icons/dstv.png';
import gotvIcon from '@/assets/icons/gotv.png';
import startimesIcon from '@/assets/icons/startimes.png';
import waecIcon from '@/assets/icons/waec.png';
import necoIcon from '@/assets/icons/neco.png';
import aedcIcon from '@/assets/icons/aedc.png';
import walletIcon from '@/assets/icons/airtimetocash.png';
import { useToast } from './Toast';
import { api, resolveImageUrl } from '../services/api';

const ICON_MAP: Record<string, string> = {
  mtn: mtnIcon,
  airtel: airtelIcon,
  glo: gloIcon,
  '9mobile': nineMobileIcon,
  dstv: dstvIcon,
  gotv: gotvIcon,
  startimes: startimesIcon,
  waec: waecIcon,
  neco: necoIcon,
  electricity: aedcIcon,
  a2c: walletIcon,
};

function getActionIcon(iconName?: string, network?: string): string {
  const iconLower = (iconName || '').toLowerCase();
  const netLower = (network || '').toLowerCase();
  if (ICON_MAP[iconLower]) return ICON_MAP[iconLower];
  if (ICON_MAP[netLower]) return ICON_MAP[netLower];
  if (netLower.includes('mtn')) return mtnIcon;
  if (netLower.includes('airtel')) return airtelIcon;
  if (netLower.includes('glo')) return gloIcon;
  if (netLower.includes('9mobile')) return nineMobileIcon;
  if (netLower.includes('dstv')) return dstvIcon;
  if (netLower.includes('gotv')) return gotvIcon;
  if (netLower.includes('waec')) return waecIcon;
  return mtnIcon;
}

interface UserDashboardProps {
  currentUser: UserProfile;
  transactions: Transaction[];
  quickActions?: QuickAction[];
  onNavigate: (view: string, params?: { network?: string; planId?: number | null; quickAction?: QuickAction }) => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
  apiStatus: 'connected' | 'offline';
  unreadNotificationsCount?: number;
  onSelectTransaction?: (tx: Transaction) => void;
}

export default function UserDashboard({
  currentUser,
  transactions,
  quickActions = [],
  onNavigate,
  onRefresh,
  isSyncing = false,
  apiStatus,
  unreadNotificationsCount = 0,
  onSelectTransaction
}: UserDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);
  const [localVirtualAccount, setLocalVirtualAccount] = useState<VirtualAccount | null>(() => {
    try {
      const saved = localStorage.getItem('edata_virtual_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleGenerateVirtualAccount = async () => {
    setIsGeneratingAccount(true);
    try {
      // 1. Attempt KatPay virtual account generation
      const genRes = await api.generateVirtualAccount();
      
      let fetchedAcc: VirtualAccount | null = null;
      if (genRes && (genRes.account_number || genRes.data?.account_number || genRes.data?.virtual_account)) {
        const raw = genRes.data?.virtual_account || genRes.data || genRes;
        fetchedAcc = {
          bank_name: raw.bank_name || raw.bank || 'KatPay / Wema Bank',
          account_number: raw.account_number || raw.accountNo || raw.account_no,
          account_name: raw.account_name || raw.accountName || displayName,
        };
      }

      // 2. Fallback / Refresh wallet data if direct response lacked account_number
      if (!fetchedAcc || !fetchedAcc.account_number) {
        const walletRes = await api.getWallet();
        const vAccounts: any[] = walletRes.data?.virtual_accounts || walletRes.virtual_accounts || (walletRes.data?.virtual_account ? [walletRes.data.virtual_account] : walletRes.virtual_account ? [walletRes.virtual_account] : []);
        if (vAccounts.length > 0 && vAccounts[0].account_number) {
          fetchedAcc = {
            bank_name: vAccounts[0].bank_name || vAccounts[0].bank || 'KatPay / Wema Bank',
            account_number: vAccounts[0].account_number || vAccounts[0].accountNo,
            account_name: vAccounts[0].account_name || vAccounts[0].accountName || displayName,
          };
        }
      }

      if (fetchedAcc && fetchedAcc.account_number) {
        setLocalVirtualAccount(fetchedAcc);
        try {
          localStorage.setItem('edata_virtual_account', JSON.stringify(fetchedAcc));
        } catch {}
        toast.success(`Virtual Account ${fetchedAcc.account_number} ready! Copy to fund your wallet.`);
        if (onRefresh) onRefresh();
      } else {
        toast.info(genRes?.message || 'Virtual Account request submitted. Refreshing dashboard...');
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Unable to generate virtual account right now. Please try again.');
    } finally {
      setIsGeneratingAccount(false);
    }
  };

  const avatarUrl = resolveImageUrl(currentUser.avatar || currentUser.picture || currentUser.photo);
  const displayName = currentUser.firstname
    ? `${currentUser.firstname} ${currentUser.lastname || ''}`.trim()
    : (currentUser.name && currentUser.name !== 'User' && currentUser.name !== 'DEFAULT_USER'
        ? currentUser.name
        : currentUser.email
        ? currentUser.email.split('@')[0]
        : 'eData User');
  const avatarInitial = displayName ? displayName[0].toUpperCase() : 'U';

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  // Fallback quick actions if backend has not loaded any yet
  const defaultActions: QuickAction[] = [
    { id: 1, title: 'MTN Data', service_type: 'data', network: 'MTN', icon: 'mtn', display_order: 1, status: 1 },
    { id: 2, title: 'Airtime', service_type: 'airtime', network: 'Airtel', icon: 'airtel', display_order: 2, status: 1 },
    { id: 3, title: 'DStv', service_type: 'cable', network: 'DSTV', icon: 'dstv', display_order: 3, status: 1 },
    { id: 4, title: 'GOtv', service_type: 'cable', network: 'GOTV', icon: 'gotv', display_order: 4, status: 1 },
    { id: 5, title: 'WAEC', service_type: 'exams', network: 'WAEC', icon: 'waec', display_order: 5, status: 1 },
  ];

  const actionsToDisplay = (quickActions && quickActions.length > 0) ? quickActions : defaultActions;

  // Services grid — 7 core services + "More" navigation card
  const services = [
    { id: 'airtime', name: 'Airtime', icon: Smartphone },
    { id: 'data', name: 'Data', icon: Layers },
    { id: 'cable', name: 'Cable TV', icon: Tv },
    { id: 'electricity', name: 'Electricity', icon: Lightbulb },
    { id: 'a2c', name: 'A2C', icon: Repeat },
    { id: 'exams', name: 'Exam Card', icon: BookOpen },
    { id: 'support', name: 'Support', icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col pb-28">
      {/* ── 1. Top Header App Bar (Matching Image 1) ── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg safe-top">
        <div className="flex items-center gap-3">
          {/* User Avatar Circle + Membership Badge Column */}
          <div className="flex flex-col items-center shrink-0">
            <button
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 border-2 border-sky-400/40 p-0.5 flex items-center justify-center shadow-md overflow-hidden shrink-0 cursor-pointer active:scale-95 transition-transform relative"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-black text-sm font-display">
                  {avatarInitial}
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-white">
                ✓
              </span>
            </button>

            {/* Membership Tier Badge under image */}
            <span className="mt-1 px-1.5 py-0.5 text-[7.5px] font-black uppercase tracking-wider rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 font-display whitespace-nowrap">
              {currentUser.category || 'Basic User'}
            </span>
          </div>

          {/* User Welcome Text */}
          <div className="text-left flex flex-col justify-center">
            <span className="text-[11px] font-medium text-slate-400 block leading-none">Welcome back</span>
            <span className="text-sm font-black text-white font-display tracking-tight block mt-1 truncate max-w-[170px] sm:max-w-xs">
              {displayName}
            </span>
          </div>
        </div>

        {/* Right Action Icons: Theme, Support & Notifications */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl transition-all active:scale-95 cursor-pointer border border-slate-700/60"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4.5 h-4.5 text-slate-700" />
            ) : (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            )}
          </button>

          {/* Support Headset Button */}
          <button
            onClick={() => onNavigate('support')}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl transition-all active:scale-95 cursor-pointer border border-slate-700/60"
            title="Customer Support"
          >
            <Headphones className="w-4.5 h-4.5 text-slate-300" />
          </button>

          {/* Notifications Bell Button */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl transition-all active:scale-95 cursor-pointer border border-slate-700/60"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5 text-slate-300" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9.5px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center border border-slate-950 shadow-md font-mono">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
        {/* ── 2. Hero Wallet Balance Card (Matching Image 1 & 2) ── */}
        <div className="hero-wallet-card bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white p-5.5 rounded-[2.2rem] shadow-2xl shadow-sky-950/60 relative overflow-hidden border border-sky-400/30 space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

          {/* Top Row: Live Balance Pill + Details > */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-glow-pulse" />
              <span className="text-[10px] text-white font-black uppercase tracking-widest font-display">LIVE BALANCE</span>
            </div>

            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-bold text-white hover:text-sky-100 flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/25 transition-all cursor-pointer font-display"
            >
              History <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Middle Row: Balance Digits + Eye Toggle + Add Money Capsule */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 min-w-0 shrink">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm tabular-nums whitespace-nowrap">
                {isBalanceHidden ? '₦ ••••••••' : formatMoney(currentUser.walletBalance)}
              </span>

              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-white/80 hover:text-white transition-colors p-1.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 active:scale-95 cursor-pointer shrink-0"
              >
                {isBalanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Add Money Button */}
            <button
              onClick={() => onNavigate('fund')}
              className="bg-white text-sky-950 font-black text-xs px-4 py-2.5 rounded-full shadow-xl transition-spring active:scale-95 flex items-center justify-center gap-1.5 btn-sheen cursor-pointer shrink-0 font-display"
            >
              <Plus className="w-4 h-4 text-sky-600 stroke-[3]" />
              Add Money
            </button>
          </div>

          {/* Bottom Area: Backend KatPay Virtual Account Capsule */}
          {(() => {
            const vAcc = localVirtualAccount || currentUser.virtualAccount || (currentUser.virtualAccounts && currentUser.virtualAccounts.length > 0 ? currentUser.virtualAccounts[0] : null);

            if (vAcc && vAcc.account_number) {
              const accNum = vAcc.account_number;
              const bankName = vAcc.bank_name || 'Virtual Account';
              return (
                <div className="p-3 bg-sky-950/70 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-black text-sky-300 uppercase tracking-widest block font-display">VIRTUAL ACCOUNT</span>
                    </div>
                    <p className="text-xs font-bold text-white font-mono tracking-wider truncate">
                      {bankName} • <span className="text-sky-200">{accNum}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(accNum);
                        setCopiedAccount(true);
                        toast.success(`Account number ${accNum} copied! Transfer from any bank app to fund wallet.`);
                        setTimeout(() => setCopiedAccount(false), 2500);
                      }}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold border border-white/25 flex items-center gap-1 transition-all active:scale-95 cursor-pointer font-display"
                      title="Copy Account Number"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('fund')}
                      className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/25 transition-all active:scale-95 cursor-pointer"
                      title="Funding Options"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-3 bg-sky-950/70 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9.5px] font-black text-sky-300 uppercase tracking-widest block font-display">VIRTUAL ACCOUNT</span>
                  <p className="text-xs font-bold text-white font-display">
                    Instant Bank Transfer Account
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVirtualAccount}
                  disabled={isGeneratingAccount}
                  className="px-3 py-1.5 bg-white text-sky-950 hover:bg-sky-50 rounded-xl text-xs font-black shadow-md border border-white/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-display shrink-0"
                >
                  {isGeneratingAccount ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Get Virtual Account</>
                  )}
                </button>
              </div>
            );
          })()}
        </div>

        {/* ── 3. QUICK ACTIONS Card Section (Matching Image 1 & 2) ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-display">QUICK ACTIONS</span>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-display"
            >
              All →
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {actionsToDisplay.map((item, idx) => {
              const iconSrc = getActionIcon(item.icon, item.network);
              return (
                <button
                  key={item.id || idx}
                  onClick={() => onNavigate(item.service_type || 'data', { network: item.network, planId: item.plan_id, quickAction: item })}
                  className="flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer active:scale-95"
                  title={item.title}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md p-1 group-hover:scale-105 transition-transform">
                    <img src={iconSrc} alt={item.title} className="w-full h-full object-contain rounded-full" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-200 tracking-tight font-display truncate w-full text-center">
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 4. SERVICES Grid — Premium Square Cards (SaukiGlobal-inspired) ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-xl">
          <div className="px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-display">SERVICES</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {services.map((srv) => {
              const Icon = srv.icon;
              return (
                <button
                  key={srv.id}
                  onClick={() => onNavigate(srv.id)}
                  className="flex flex-col items-center gap-2 transition-all group cursor-pointer active:scale-[0.93]"
                >
                  <div className="w-full aspect-square rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center shadow-md group-hover:border-sky-500/40 group-hover:bg-slate-800/90 group-active:bg-slate-700/70 transition-all duration-200">
                    <Icon className="w-7 h-7 text-sky-400 stroke-[1.8] drop-shadow-sm" />
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-300 font-display tracking-tight text-center leading-tight group-hover:text-white transition-colors">
                    {srv.name}
                  </span>
                </button>
              );
            })}

            {/* "More" navigation card — same style as service cards */}
            <button
              onClick={() => onNavigate('services')}
              className="flex flex-col items-center gap-2 transition-all group cursor-pointer active:scale-[0.93]"
            >
              <div className="w-full aspect-square rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center shadow-md group-hover:border-sky-500/40 group-hover:bg-slate-800/90 group-active:bg-slate-700/70 transition-all duration-200">
                <MoreHorizontal className="w-7 h-7 text-sky-400 stroke-[1.8] drop-shadow-sm" />
              </div>
              <span className="text-[10.5px] font-bold text-slate-300 font-display tracking-tight text-center leading-tight group-hover:text-white transition-colors">
                More
              </span>
            </button>
          </div>
        </section>

        {/* ── 5. Reseller License Banner Card ── */}
        {currentUser.category !== 'Premium User' && (
          <section className={`rounded-3xl p-4 flex items-center justify-between gap-3 transition-all ${
            theme === 'light'
              ? 'bg-gradient-to-r from-sky-50/90 via-indigo-50/60 to-blue-50/90 border border-sky-200/80 shadow-md shadow-sky-100/50'
              : 'bg-slate-800/90 border border-slate-700/80 shadow-xl'
          }`}>
            <div className="space-y-1">
              <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border font-display ${
                theme === 'light'
                  ? 'bg-sky-100 text-sky-700 border-sky-300/80'
                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
              }`}>
                BASIC USER • Current Tier
              </span>
              <h3 className={`text-sm font-black font-display pt-0.5 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Reseller License</h3>
              <p className={`text-[11px] font-medium ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>Get wholesale agent discounts on all purchases.</p>
            </div>

            <button
              onClick={() => onNavigate('upgrade')}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-spring active:scale-95 cursor-pointer shrink-0 font-display whitespace-nowrap"
            >
              Upgrade ₦5,000
            </button>
          </section>
        )}

        {/* ── 6. Earn / Referral Banner Card ── */}
        <section className={`rounded-3xl p-4 flex items-center justify-between text-white transition-all ${
          theme === 'light'
            ? 'bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1d4ed8] border border-sky-400/30 shadow-lg shadow-sky-600/15'
            : 'bg-gradient-to-r from-sky-900 to-indigo-950 border border-sky-500/40 shadow-xl'
        }`}>
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white font-display">Earn up to ₦2,500</h4>
            <p className="text-[11px] text-sky-100 font-medium">Invite friends and earn dynamic cash payouts</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/20 text-white border border-white/25 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
        </section>
      </main>
    </div>
  );
}
