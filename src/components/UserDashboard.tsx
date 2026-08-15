import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, QuickAction, VirtualAccount } from '../types';
import { formatMoney } from '../utils/formatters';
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
import nabtebIcon from '@/assets/icons/nabteb.png';
import nbaisIcon from '@/assets/icons/nbais.png';
import aedcIcon from '@/assets/icons/aedc.png';
import ekedcIcon from '@/assets/icons/ekedc.png';
import ikejaIcon from '@/assets/icons/ikeja.png';
import ibedcIcon from '@/assets/icons/ibedc.png';
import kedcoIcon from '@/assets/icons/kedco.png';
import kadunaIcon from '@/assets/icons/kaduna.png';
import josIcon from '@/assets/icons/jos.png';
import phedcIcon from '@/assets/icons/phedc.png';
import supportIcon from '@/assets/icons/support.png';
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
  nabteb: nabtebIcon,
  nbais: nbaisIcon,
  aedc: aedcIcon,
  ekedc: ekedcIcon,
  ikeja: ikejaIcon,
  ibedc: ibedcIcon,
  kedco: kedcoIcon,
  kaduna: kadunaIcon,
  kaedco: kadunaIcon,
  jos: josIcon,
  jed: josIcon,
  phedc: phedcIcon,
  phed: phedcIcon,
  electricity: aedcIcon,
  a2c: walletIcon,
  support: supportIcon,
};

function getActionIcon(iconName?: string, network?: string): string {
  const iconLower = (iconName || '').toLowerCase().trim();
  const netLower = (network || '').toLowerCase().trim();

  if (ICON_MAP[iconLower]) return ICON_MAP[iconLower];
  if (ICON_MAP[netLower]) return ICON_MAP[netLower];

  if (netLower.includes('mtn')) return mtnIcon;
  if (netLower.includes('airtel')) return airtelIcon;
  if (netLower.includes('glo')) return gloIcon;
  if (netLower.includes('9mobile')) return nineMobileIcon;
  if (netLower.includes('dstv')) return dstvIcon;
  if (netLower.includes('gotv')) return gotvIcon;
  if (netLower.includes('startimes')) return startimesIcon;
  if (netLower.includes('waec')) return waecIcon;
  if (netLower.includes('neco')) return necoIcon;
  if (netLower.includes('nabteb')) return nabtebIcon;
  if (netLower.includes('nbais')) return nbaisIcon;
  if (netLower.includes('aedc')) return aedcIcon;
  if (netLower.includes('ekedc')) return ekedcIcon;
  if (netLower.includes('ikeja')) return ikejaIcon;
  if (netLower.includes('ibedc')) return ibedcIcon;
  if (netLower.includes('kedco')) return kedcoIcon;
  if (netLower.includes('kaduna') || netLower.includes('kaedco')) return kadunaIcon;
  if (netLower.includes('jos') || netLower.includes('jed')) return josIcon;
  if (netLower.includes('phed')) return phedcIcon;

  return mtnIcon;
}

interface UserDashboardProps {
  currentUser: UserProfile;
  transactions: Transaction[];
  quickActions?: QuickAction[];
  /**
   * List of service_type verbs (`airtime`, `data`, `cable`, `electricity`,
   * `exams`, `a2c`) that currently have ≥1 ACTIVE ServiceType on the
   * backend. Computed live from /api/services in App.tsx. Categories the
   * admin has fully disabled are omitted so their tiles disappear.
   */
  serviceCategories?: string[];
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
  serviceCategories = [],
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

  useEffect(() => {
    if (!localVirtualAccount) {
      api.getWallet()
        .then((res) => {
          const vAccounts: any[] = res.data?.virtual_accounts || res.virtual_accounts || (res.data?.virtual_account ? [res.data.virtual_account] : res.virtual_account ? [res.virtual_account] : []);
          if (vAccounts.length > 0 && (vAccounts[0].account_number || vAccounts[0].account_no)) {
            const acc: VirtualAccount = {
              bank_name: vAccounts[0].bank_name || vAccounts[0].bank || 'KatPay / Wema Bank',
              account_number: vAccounts[0].account_number || vAccounts[0].account_no || vAccounts[0].accountNo,
              account_name: vAccounts[0].account_name || vAccounts[0].accountName || 'eData User',
            };
            setLocalVirtualAccount(acc);
            try {
              localStorage.setItem('edata_virtual_account', JSON.stringify(acc));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleGenerateVirtualAccount = async () => {
    setIsGeneratingAccount(true);
    try {
      let fetchedAcc: VirtualAccount | null = null;
      
      // 1. Attempt KatPay virtual account generation API
      try {
        const genRes = await api.generateVirtualAccount();
        if (genRes && (genRes.account_number || genRes.data?.account_number || genRes.data?.virtual_account)) {
          const raw = genRes.data?.virtual_account || genRes.data || genRes;
          fetchedAcc = {
            bank_name: raw.bank_name || raw.bank || 'KatPay / Wema Bank',
            account_number: raw.account_number || raw.accountNo || raw.account_no,
            account_name: raw.account_name || raw.accountName || displayName,
          };
        }
      } catch (e) {
        console.warn('KatPay direct virtual account generation warning:', e);
      }

      // 2. Fallback / Check wallet accounts from server
      if (!fetchedAcc || !fetchedAcc.account_number) {
        const walletRes = await api.getWallet();
        const vAccounts: any[] = walletRes.data?.virtual_accounts || walletRes.virtual_accounts || (walletRes.data?.virtual_account ? [walletRes.data.virtual_account] : walletRes.virtual_account ? [walletRes.virtual_account] : []);
        if (vAccounts.length > 0 && (vAccounts[0].account_number || vAccounts[0].account_no)) {
          fetchedAcc = {
            bank_name: vAccounts[0].bank_name || vAccounts[0].bank || 'KatPay / Wema Bank',
            account_number: vAccounts[0].account_number || vAccounts[0].account_no || vAccounts[0].accountNo,
            account_name: vAccounts[0].account_name || vAccounts[0].accountName || displayName,
          };
        } else {
          const mb = walletRes.data?.manual_bank || walletRes.manual_bank;
          if (mb && mb.account_number) {
            fetchedAcc = {
              bank_name: mb.bank_name || 'Bank Transfer',
              account_number: mb.account_number,
              account_name: mb.account_name || displayName,
            };
          }
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
        toast.info('Opening wallet funding options...');
        onNavigate('fund');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Opening funding options...');
      onNavigate('fund');
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

  // Quick Actions are 100 % admin-managed via /api/quick-actions. If the
  // backend hasn't returned any yet (first load / offline), we render
  // NOTHING here rather than inject hardcoded "MTN Data / DStv / WAEC"
  // shortcuts that would ignore admin edits.
  const actionsToDisplay = (quickActions && quickActions.length > 0) ? quickActions : [];

  // Services grid — every entry with `adminGated: true` corresponds to a
  // ServiceType category the admin manages under Manage Services. If the
  // backend returns no active ServiceType in that category, the tile is
  // hidden here. `support` is an app-level nav item, not an admin-managed
  // service category, so it always shows.
  const allServiceTiles: { id: string; name: string; icon: any; adminGated?: boolean }[] = [
    { id: 'airtime',     name: 'Airtime',     icon: Smartphone, adminGated: true },
    { id: 'data',        name: 'Data',        icon: Layers,     adminGated: true },
    { id: 'cable',       name: 'Cable TV',    icon: Tv,         adminGated: true },
    { id: 'electricity', name: 'Electricity', icon: Lightbulb,  adminGated: true },
    { id: 'a2c',         name: 'A2C',         icon: Repeat,     adminGated: true },
    { id: 'exams',       name: 'Exam Card',   icon: BookOpen,   adminGated: true },
    { id: 'support',     name: 'Support',     icon: Headphones },
  ];
  const services = allServiceTiles.filter(tile =>
    !tile.adminGated
    || serviceCategories.length === 0 // no sync yet — show everything so nothing looks broken
    || serviceCategories.includes(tile.id)
  );

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
        <div className="hero-wallet-card bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white p-4 rounded-[1.8rem] shadow-xl shadow-sky-950/50 relative overflow-hidden border border-sky-400/30 space-y-2.5">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

          {/* Top Row: Main Wallet Pill + History > */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xl px-2.5 py-0.5 rounded-full border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
              <span className="text-[9.5px] text-white font-black uppercase tracking-widest font-display">MAIN WALLET</span>
            </div>

            <button
              onClick={() => onNavigate('history')}
              className="text-[11px] font-bold text-white hover:text-sky-100 flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/25 transition-all cursor-pointer font-display"
            >
              History <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Middle Row: Balance Digits + Eye Toggle + Add Money Capsule */}
          <div className="flex items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="font-black font-mono tracking-tight text-white drop-shadow-sm tabular-nums whitespace-nowrap"
                style={{ fontSize: 'clamp(1.125rem, 5.5vw, 1.75rem)' }}
              >
                {isBalanceHidden ? '₦ ••••••••' : formatMoney(currentUser.mainWallet ?? currentUser.walletBalance)}
              </span>

              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-white/80 hover:text-white transition-colors p-1 bg-white/20 rounded-lg backdrop-blur-md border border-white/20 active:scale-95 cursor-pointer shrink-0"
                aria-label={isBalanceHidden ? 'Show balance' : 'Hide balance'}
              >
                {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Add Money Button */}
            <button
              onClick={() => onNavigate('fund')}
              className="bg-white text-sky-950 font-black text-xs px-3 py-2 rounded-full shadow-lg transition-spring active:scale-95 flex items-center justify-center gap-1 btn-sheen cursor-pointer shrink-0 font-display"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600 stroke-[3]" />
              Add Money
            </button>
          </div>

          {/* Compact 2-Column Sub-Wallets Transparency Strip (COMMISSION & BONUS) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 px-2.5 bg-sky-950/40 backdrop-blur-md border border-white/15 rounded-xl">
            <div className="flex items-center justify-between min-w-0 pr-2 border-r border-white/10">
              <span className="text-[9px] font-black text-emerald-300/90 uppercase tracking-wider font-display truncate">COMMISSION</span>
              <span className="text-xs font-black text-emerald-300 font-mono tabular-nums shrink-0 ml-1">
                {isBalanceHidden ? '••••' : formatMoney(currentUser.commissionWallet ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between min-w-0 pl-1">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[9px] font-black text-amber-300/90 uppercase tracking-wider font-display truncate">BONUS</span>
                {currentUser.bonusExpiresAt && (
                  <span className="text-[7.5px] font-bold text-amber-200 bg-amber-500/25 px-1 rounded border border-amber-400/30 shrink-0">
                    14d
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-amber-300 font-mono tabular-nums shrink-0 ml-1">
                {isBalanceHidden ? '••••' : formatMoney(currentUser.bonusWallet ?? 0)}
              </span>
            </div>
          </div>

          {/* Bottom Area: Backend KatPay Virtual Account Capsule */}
          {(() => {
            const vAcc = localVirtualAccount || currentUser.virtualAccount || (currentUser.virtualAccounts && currentUser.virtualAccounts.length > 0 ? currentUser.virtualAccounts[0] : null);

            if (vAcc && vAcc.account_number) {
              const accNum = vAcc.account_number;
              const bankName = vAcc.bank_name || 'Virtual Account';
              return (
                // the number gets the widest possible track.
                <div className="p-2 px-3 bg-sky-950/70 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-between gap-2 shadow-inner">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] font-black text-sky-300 uppercase tracking-widest font-display">VIRTUAL ACCOUNT</span>
                      <span className="text-[9.5px] font-bold text-white/70 uppercase tracking-wider font-display">• {bankName}</span>
                    </div>
                    <p className="text-sm font-black text-white font-mono tracking-wider whitespace-nowrap tabular-nums">
                      {accNum}
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
                      className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/25 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title={copiedAccount ? 'Copied' : 'Copy Account Number'}
                      aria-label={copiedAccount ? 'Copied' : 'Copy Account Number'}
                    >
                      {copiedAccount ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('fund')}
                      className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/25 transition-all active:scale-95 cursor-pointer"
                      title="Funding Options"
                      aria-label="Funding Options"
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
                  className="flex flex-col items-center justify-start gap-1.5 transition-all group cursor-pointer active:scale-95 min-w-0"
                  title={item.title}
                >
                  <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md p-1 group-hover:scale-105 transition-transform">
                    <img src={iconSrc} alt={item.title} className="w-full h-full object-contain rounded-full" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-200 tracking-tight font-display w-full text-center leading-tight whitespace-normal break-words hyphens-auto">
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

        {/* ── 5. Reseller License Banner Card ──
             Basic users see the Upgrade CTA (routes straight to payment).
             Users with a pending UpgradeRequest see a Pending Approval pill
             instead so they don't tap Upgrade a second time — matching the
             Web card at [account/index.php]. */}
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
              }`}>
                {currentUser.hasPendingUpgrade
                  ? 'Payment received. Awaiting admin approval.'
                  : 'Get wholesale agent discounts on all purchases.'}
              </p>
            </div>

            {currentUser.hasPendingUpgrade ? (
              <span
                className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-500 border border-amber-500/30 font-black text-[11px] px-3 py-2 rounded-xl shrink-0 font-display whitespace-nowrap"
                title="Your upgrade request is awaiting admin review"
              >
                <Clock className="w-3.5 h-3.5" />
                Pending Review
              </span>
            ) : (
              <button
                onClick={() => onNavigate('upgrade')}
                className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-spring active:scale-95 cursor-pointer shrink-0 font-display whitespace-nowrap"
              >
                {currentUser.upgradeFee && currentUser.upgradeFee > 0
                  ? `Upgrade ₦${currentUser.upgradeFee.toLocaleString('en-NG')}`
                  : 'Upgrade Now'}
              </button>
            )}
          </section>
        )}

        {/* ── 6. Earn / Referral Banner Card ── */}
        <section
          onClick={() => onNavigate('referral')}
          className={`rounded-3xl p-4 flex items-center justify-between text-white transition-all cursor-pointer active:scale-98 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1d4ed8] border border-sky-400/30 shadow-lg shadow-sky-600/15'
              : 'bg-gradient-to-r from-sky-900 to-indigo-950 border border-sky-500/40 shadow-xl'
          }`}
        >
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
