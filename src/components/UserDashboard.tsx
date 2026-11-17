import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, QuickAction, VirtualAccount, DvaProviderInfo } from '../types';
import { formatMoney } from '../utils/formatters';
import {
  Eye, EyeOff, Plus, RefreshCw, Bell, Smartphone, Wifi, Tv, Lightbulb,
  BookOpen, Repeat, ArrowRight, ShieldCheck, ChevronRight, Copy, Check, Sparkles, Layers, Headphones, Clock, Gift, User, Sun, Moon, MoreHorizontal, Package, CreditCard, Zap, X
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
  if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://') || iconName.startsWith('/uploads/') || iconName.startsWith('data:'))) {
    return resolveImageUrl(iconName);
  }

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
  setCurrentUser?: (user: UserProfile) => void;
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
  setCurrentUser,
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
  const [copiedModalAccount, setCopiedModalAccount] = useState(false);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);
  const [priorityProviderCode, setPriorityProviderCode] = useState<string>('');
  const [priorityProviderName, setPriorityProviderName] = useState<string>('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycType, setKycType] = useState<'bvn' | 'nin'>('bvn');
  const [kycValue, setKycValue] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [targetProviderInfo, setTargetProviderInfo] = useState<DvaProviderInfo | null>(null);
  const [showDvaSuccessModal, setShowDvaSuccessModal] = useState(false);
  const [generatedAccountDetails, setGeneratedAccountDetails] = useState<VirtualAccount | null>(null);
  const [localVirtualAccount, setLocalVirtualAccount] = useState<VirtualAccount | null>(() => {
    try {
      const saved = localStorage.getItem('edata_virtual_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        const bName = (parsed.bank_name || '').toLowerCase();
        const accNo = (parsed.account_number || '').trim();
        if (bName.includes('wema') || accNo === '0127189291') {
          localStorage.removeItem('edata_virtual_account');
          return null;
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  });

  useEffect(() => {
    if (currentUser.virtualAccount && currentUser.virtualAccount.account_number) {
      if (!priorityProviderCode || currentUser.virtualAccount.provider === priorityProviderCode || currentUser.virtualAccount.is_primary === true) {
        setLocalVirtualAccount(currentUser.virtualAccount);
      } else {
        setLocalVirtualAccount(null);
      }
    } else if (priorityProviderCode && localVirtualAccount && localVirtualAccount.provider && localVirtualAccount.provider !== priorityProviderCode) {
      setLocalVirtualAccount(null);
    }
  }, [currentUser.virtualAccount, priorityProviderCode]);

  useEffect(() => {
    api.getWallet()
      .then((res) => {
        const priorityCode = res.data?.dashboard_priority_code || res.dashboard_priority_code || '';
        const priorityName = res.data?.dashboard_priority_name || res.dashboard_priority_name || '';
        if (priorityCode) setPriorityProviderCode(priorityCode);
        if (priorityName) setPriorityProviderName(priorityName);

        const rawAccounts: any[] = res.data?.virtual_accounts || res.virtual_accounts || (res.data?.virtual_account ? [res.data.virtual_account] : res.virtual_account ? [res.virtual_account] : []);
        const vAccounts = rawAccounts.filter((a: any) => {
          const b = (a.bank_name || a.bank || '').toLowerCase();
          const num = (a.account_number || a.accountNo || a.account_no || '').trim();
          return !b.includes('wema') && num !== '0127189291';
        });

        const chosen = priorityCode
          ? vAccounts.find((a: any) => a.is_primary === true || a.provider === priorityCode)
          : (vAccounts.find((a: any) => a.is_primary === true) || vAccounts[0]);

        if (chosen && (chosen.account_number || chosen.account_no || chosen.accountNo)) {
          const acc: VirtualAccount = {
            bank_name: chosen.bank_name || chosen.bank || 'Dedicated Virtual Account',
            account_number: chosen.account_number || chosen.account_no || chosen.accountNo,
            account_name: chosen.account_name || chosen.accountName || displayName,
            provider: chosen.provider,
            is_primary: chosen.is_primary,
            badge: chosen.badge,
          };
          setLocalVirtualAccount(acc);
          try {
            localStorage.setItem('edata_virtual_account', JSON.stringify(acc));
          } catch {}
        } else {
          setLocalVirtualAccount(null);
          try {
            localStorage.removeItem('edata_virtual_account');
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerateVirtualAccount = async () => {
    setIsGeneratingAccount(true);
    try {
      // 1. Detect dynamic priority provider configured by admin
      let targetProvider: DvaProviderInfo | null = null;
      try {
        const dvaRes = await api.getDvaProviders(true);
        if (dvaRes?.data?.providers && Array.isArray(dvaRes.data.providers)) {
          const list: DvaProviderInfo[] = dvaRes.data.providers;
          const priCode = dvaRes.data.dashboard_priority_code;
          targetProvider = list.find((p) => p.code === priCode || p.is_dashboard_priority) || list[0];
          if (targetProvider) {
            setPriorityProviderCode(targetProvider.code);
            setPriorityProviderName(targetProvider.name);
          }
        }
      } catch (err) {
        console.warn('Priority provider detection fallback:', err);
      }

      if (!targetProvider) {
        targetProvider = {
          code: priorityProviderCode || 'katpay',
          name: priorityProviderName || 'PalmPay',
          provider_title: 'Dedicated Virtual Account',
          requires_kyc: (priorityProviderCode || 'katpay') === 'payvessel',
          is_active: true,
          is_dashboard_priority: true,
          priority_rank: 1,
          has_account: false,
          accounts: [],
        };
      }
      setTargetProviderInfo(targetProvider);

      const hasUserKyc = Boolean(
        currentUser.has_kyc ||
        (currentUser.bvn && /^\d{11}$/.test(currentUser.bvn)) ||
        (currentUser.nin && /^\d{11}$/.test(currentUser.nin))
      );

      // Workflow 1: PayVessel (KYC Required)
      // If priority provider requires KYC and user hasn't provided BVN or NIN yet:
      // Open a pop-up form prompting BVN or NIN
      if (targetProvider.requires_kyc && !hasUserKyc) {
        setKycValue('');
        setShowKycModal(true);
        setIsGeneratingAccount(false);
        return;
      }

      // Workflow 2: KatPay (Zero KYC Required) or User already has KYC:
      // Automatically initiate account generation without requesting BVN or NIN
      await executeAccountGeneration(targetProvider.code);
    } catch (err: any) {
      toast.error(err?.message || 'Unable to start account generation.');
      setIsGeneratingAccount(false);
    }
  };

  const executeAccountGeneration = async (providerCode: string, manualKyc?: { bvn?: string; nin?: string }) => {
    setIsGeneratingAccount(true);
    try {
      const kycPayload = manualKyc || (
        (currentUser.bvn && /^\d{11}$/.test(currentUser.bvn)) ? { bvn: currentUser.bvn } :
        ((currentUser.nin && /^\d{11}$/.test(currentUser.nin)) ? { nin: currentUser.nin } : undefined)
      );

      const genRes = await api.generateDvaAccount(providerCode, kycPayload);

      if (genRes?.require_kyc && !manualKyc) {
        setShowKycModal(true);
        setIsGeneratingAccount(false);
        return;
      }

      if (genRes && !genRes.success && genRes.error) {
        toast.error(genRes.error);
        setIsGeneratingAccount(false);
        return;
      }

      const accData = genRes.data || genRes;
      const raw = accData?.virtual_account || (Array.isArray(accData?.accounts) ? accData.accounts[0] : null) || accData;

      let newAccount: VirtualAccount | null = null;
      if (raw && (raw.account_number || raw.accountNo || raw.account_no)) {
        newAccount = {
          bank_name: raw.bank_name || raw.bank || 'Dedicated Virtual Account',
          account_number: raw.account_number || raw.accountNo || raw.account_no,
          account_name: raw.account_name || raw.accountName || displayName,
          provider: raw.provider || providerCode,
          is_primary: true,
          badge: raw.badge || (providerCode === 'katpay' ? 'Free Transfer • Instant' : 'Instant Funding'),
        };
      }

      // Fallback: reload wallet to grab newly assigned accounts
      if (!newAccount) {
        const walletRes = await api.getWallet();
        const rawAccounts: any[] = walletRes.data?.virtual_accounts || walletRes.virtual_accounts || [];
        const chosen = rawAccounts.find((a: any) => a.provider === providerCode || a.is_primary === true) || rawAccounts[0];
        if (chosen && (chosen.account_number || chosen.account_no)) {
          newAccount = {
            bank_name: chosen.bank_name || chosen.bank || 'Dedicated Virtual Account',
            account_number: chosen.account_number || chosen.account_no,
            account_name: chosen.account_name || chosen.accountName || displayName,
            provider: chosen.provider || providerCode,
            is_primary: true,
            badge: chosen.badge,
          };
        }
      }

      if (newAccount) {
        setLocalVirtualAccount(newAccount);
        try {
          localStorage.setItem('edata_virtual_account', JSON.stringify(newAccount));
        } catch {}

        // Persist KYC to customer profile if entered
        if (manualKyc?.bvn || manualKyc?.nin) {
          const updatedUser: UserProfile = {
            ...currentUser,
            bvn: manualKyc.bvn || currentUser.bvn,
            nin: manualKyc.nin || currentUser.nin,
            has_kyc: true,
            hasKyc: true,
          };
          if (setCurrentUser) {
            setCurrentUser(updatedUser);
          }
          try {
            localStorage.setItem('edata_current_user', JSON.stringify(updatedUser));
          } catch {}
          api.updateProfile({
            ...(manualKyc.bvn ? { bvn: manualKyc.bvn } : {}),
            ...(manualKyc.nin ? { nin: manualKyc.nin } : {}),
          }).catch(() => {});
        }

        setShowKycModal(false);
        setGeneratedAccountDetails(newAccount);
        setShowDvaSuccessModal(true);
        if (onRefresh) onRefresh();
      } else {
        toast.info('Dedicated virtual account created. Refreshing dashboard...');
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate virtual account.');
    } finally {
      setIsGeneratingAccount(false);
      setKycSubmitting(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = kycValue.replace(/\D/g, '');
    if (clean.length !== 11) {
      toast.error(`${kycType.toUpperCase()} must be exactly 11 digits.`);
      return;
    }
    setKycSubmitting(true);
    const provCode = targetProviderInfo?.code || priorityProviderCode || 'payvessel';
    await executeAccountGeneration(provCode, { [kycType]: clean });
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
  const allServiceTiles: { id: string; name: string; icon: any; adminGated?: boolean; isNew?: boolean }[] = [
    { id: 'airtime',           name: 'Airtime',        icon: Smartphone, adminGated: true },
    { id: 'data',              name: 'Data',           icon: Layers,     adminGated: true },
    { id: 'cable',             name: 'Cable TV',       icon: Tv,         adminGated: true },
    { id: 'electricity',       name: 'Electricity',    icon: Lightbulb,  adminGated: true },
    { id: 'installment-phone', name: 'Phones',         icon: Smartphone, isNew: true },
    { id: 'pos-device',        name: 'POS',            icon: CreditCard, isNew: true },
    { id: 'prepaid-meter',     name: 'Prepaid Meter',  icon: Zap,        isNew: true },
    { id: 'solar',             name: 'Solar',          icon: Sun,        isNew: true },
    { id: 'a2c',               name: 'A2C',            icon: Repeat,     adminGated: true },
    { id: 'exams',             name: 'Exam Card',      icon: BookOpen,   adminGated: true },
  ];
  const services = allServiceTiles.filter(tile =>
    !tile.adminGated
    || serviceCategories.length === 0 // no sync yet — show everything so nothing looks broken
    || serviceCategories.includes(tile.id)
  );
  // Display up to 11 services on the dashboard so all 4 new hardware services (Phones, POS, Meter, Solar) are directly visible, with the 12th tile as 'More' (+) in a clean 3x4 grid
  const MAX_DASHBOARD_SERVICES = 11;
  const displayedServices = services.slice(0, MAX_DASHBOARD_SERVICES);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col pb-36">
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

      <main className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full pb-12">
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

          {/* Separate Rounded Pill Containers for COMMISSION & BONUS (Matching Sketch) */}
          <div className="grid grid-cols-2 gap-3 pt-0.5">
            {/* Commission Pill Container */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-sky-950/55 hover:bg-sky-950/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm transition-all">
              <span className="text-[11px] font-bold text-sky-100 font-display tracking-tight">Commission</span>
              <span className="text-xs font-black text-emerald-300 font-mono tabular-nums ml-1">
                {isBalanceHidden ? '••••' : formatMoney(currentUser.commissionWallet ?? 0)}
              </span>
            </div>

            {/* Bonus Pill Container */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-sky-950/55 hover:bg-sky-950/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm transition-all">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[11px] font-bold text-sky-100 font-display tracking-tight truncate">Bonus</span>
                {currentUser.bonusExpiresAt && (currentUser.bonusWallet ?? 0) > 0 && (() => {
                  const diffMs = new Date(currentUser.bonusExpiresAt).getTime() - Date.now();
                  const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                  return (
                    <span className="text-[7.5px] font-bold text-amber-200 bg-amber-500/35 px-1.5 py-0.2 rounded-full border border-amber-400/40 shrink-0">
                      {daysLeft}d
                    </span>
                  );
                })()}
              </div>
              <span className="text-xs font-black text-amber-300 font-mono tabular-nums ml-1">
                {isBalanceHidden ? '••••' : formatMoney(currentUser.bonusWallet ?? 0)}
              </span>
            </div>
          </div>

          {/* Bottom Area: Dedicated Virtual Account Capsule */}
          {(() => {
            const candidateFromList = Array.isArray(currentUser.virtualAccounts) && currentUser.virtualAccounts.length > 0
              ? (priorityProviderCode
                  ? currentUser.virtualAccounts.find((a) => a.is_primary === true || a.provider === priorityProviderCode)
                  : (currentUser.virtualAccounts.find((a) => a.is_primary === true) || currentUser.virtualAccounts[0]))
              : null;

            const rawV = localVirtualAccount || currentUser.virtualAccount || candidateFromList;
            const matchesPriority = !priorityProviderCode || rawV?.provider === priorityProviderCode || rawV?.is_primary === true;
            const vAcc = rawV && matchesPriority && !(
              (rawV.bank_name || '').toLowerCase().includes('wema') ||
              (rawV.account_number || '').trim() === '0127189291'
            ) ? rawV : null;

            if (vAcc && vAcc.account_number) {
              const accNum = vAcc.account_number;
              const bankName = vAcc.bank_name || 'Virtual Account';
              return (
                // the number gets the widest possible track.
                <div
                  onClick={() => {
                    setGeneratedAccountDetails(vAcc);
                    setShowDvaSuccessModal(true);
                  }}
                  className="p-2 px-3 bg-sky-950/70 hover:bg-sky-950/85 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-between gap-2 shadow-inner cursor-pointer transition-all"
                  title="View Dedicated Virtual Account details"
                >
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
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          if (navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(accNum).catch(() => {});
                          } else {
                            const ta = document.createElement('textarea');
                            ta.value = accNum;
                            ta.style.position = 'fixed';
                            ta.style.opacity = '0';
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand('copy');
                            document.body.removeChild(ta);
                          }
                        } catch {}
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
                  <span className="text-[9.5px] font-black text-sky-300 uppercase tracking-widest block font-display">
                    VIRTUAL ACCOUNT {priorityProviderName ? `• ${priorityProviderName.toUpperCase()}` : ''}
                  </span>
                  <p className="text-xs font-bold text-white font-display">
                    {priorityProviderName ? `Instant ${priorityProviderName} Transfer Account` : 'Instant Bank Transfer Account'}
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
            {actionsToDisplay.length > 0 ? (
              actionsToDisplay.map((item, idx) => {
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
              })
            ) : isSyncing ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse min-w-0">
                  <div className="w-12 h-12 rounded-full bg-slate-700/60 border border-slate-700/50" />
                  <div className="h-2 w-10 bg-slate-750/70 rounded" />
                </div>
              ))
            ) : null}
          </div>
        </section>

        {/* ── 4. SERVICES Grid — Premium Square Cards (SaukiGlobal-inspired) ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-xl">
          <div className="px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-display">SERVICES</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {displayedServices.map((srv) => {
              const Icon = srv.icon;
              return (
                <button
                  key={srv.id}
                  onClick={() => onNavigate(srv.id)}
                  className="flex flex-col items-center gap-2 transition-all group cursor-pointer active:scale-[0.93]"
                >
                  <div className="w-full aspect-square rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center shadow-md group-hover:border-sky-500/40 group-hover:bg-slate-800/90 group-active:bg-slate-700/70 transition-all duration-200 relative">
                    <Icon className="w-7 h-7 text-sky-400 stroke-[1.8] drop-shadow-sm group-hover:scale-105 transition-transform" />
                    {srv.isNew && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider bg-sky-500 text-white shadow-md shadow-sky-500/30 border border-sky-400/40 font-display">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-300 font-display tracking-tight text-center leading-tight group-hover:text-white transition-colors">
                    {srv.name}
                  </span>
                </button>
              );
            })}

            {/* "More" navigation card with Plus (+) icon */}
            <button
              onClick={() => onNavigate('services')}
              className="flex flex-col items-center gap-2 transition-all group cursor-pointer active:scale-[0.93]"
              title="View all services"
            >
              <div className="w-full aspect-square rounded-2xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center shadow-md group-hover:border-sky-400 group-hover:bg-sky-500/20 group-active:bg-sky-500/30 transition-all duration-200 relative">
                <Plus className="w-7 h-7 text-sky-400 stroke-[2.4] drop-shadow-sm group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider bg-sky-500 text-white shadow-md shadow-sky-500/30 border border-sky-400/40 font-display">
                  MORE
                </span>
              </div>
              <span className="text-[10.5px] font-bold text-sky-300 font-display tracking-tight text-center leading-tight group-hover:text-white transition-colors">
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

      {/* ── Dynamic KYC Pop-up Modal (Required by PayVessel or KYC providers) ── */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display">Identity Verification</h3>
                  <p className="text-[10px] text-slate-400">
                    {targetProviderInfo?.name || priorityProviderName || 'DVA Provider'} Virtual Account Assignment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { if (!kycSubmitting) setShowKycModal(false); }}
                disabled={kycSubmitting}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-4 pt-4">
              <div className="p-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-2xl text-xs text-sky-800 dark:text-sky-300">
                To assign your dedicated bank account, please provide your 11-digit BVN or NIN. You can select whichever you prefer.
              </div>

              {/* BVN / NIN Toggle Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Choose Verification Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setKycType('bvn'); setKycValue(''); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      kycType === 'bvn'
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300'
                    }`}
                  >
                    <span>BVN</span>
                    <span className="text-[10px] opacity-80">(Bank Number)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setKycType('nin'); setKycValue(''); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      kycType === 'nin'
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300'
                    }`}
                  >
                    <span>NIN</span>
                    <span className="text-[10px] opacity-80">(National ID)</span>
                  </button>
                </div>
              </div>

              {/* Number Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {kycType === 'bvn' ? '11-Digit BVN' : '11-Digit NIN'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{kycValue.length}/11</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  value={kycValue}
                  onChange={(e) => setKycValue(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder={kycType === 'bvn' ? 'Enter 11-digit BVN' : 'Enter 11-digit NIN'}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                🔒 Your identity details are encrypted and securely stored in your customer profile to generate your virtual account.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  disabled={kycSubmitting}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kycValue.length !== 11 || kycSubmitting}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {kycSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Generate Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Virtual Account Details Pop-up Modal ── */}
      {showDvaSuccessModal && generatedAccountDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all text-center space-y-4 ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7 text-emerald-500 fill-emerald-500/20" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 font-display">
                {generatedAccountDetails.provider ? `${generatedAccountDetails.provider.toUpperCase()} • HIGHEST PRIORITY` : 'PRIORITY DVA'}
              </span>
              <h3 className="text-base font-bold font-display pt-1">Virtual Account Generated!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your dedicated wallet account is active and ready for automatic funding.
              </p>
            </div>

            {/* Account Card Box */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-500/30 rounded-2xl text-left space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-sky-300 block font-display">Bank Name</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{generatedAccountDetails.bank_name}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-sky-300 block font-display">Account Number</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-lg font-black font-mono tracking-wider text-sky-600 dark:text-sky-400">
                    {generatedAccountDetails.account_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (navigator.clipboard?.writeText) {
                          navigator.clipboard.writeText(generatedAccountDetails.account_number);
                        }
                      } catch {}
                      setCopiedModalAccount(true);
                      toast.success(`Account number ${generatedAccountDetails.account_number} copied!`);
                      setTimeout(() => setCopiedModalAccount(false), 2500);
                    }}
                    className="p-1.5 px-2.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer font-display"
                  >
                    {copiedModalAccount ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedModalAccount ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-sky-300 block font-display">Account Name</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{generatedAccountDetails.account_name}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-left flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Transfer any amount to this account from any Nigerian bank app or USSD to instantly fund your wallet. Transfers reflect within seconds.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDvaSuccessModal(false);
                setGeneratedAccountDetails(null);
              }}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer font-display"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
