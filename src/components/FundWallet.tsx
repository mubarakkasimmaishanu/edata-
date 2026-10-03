import React, { useState, useEffect } from 'react';
import { UserProfile, VirtualAccount } from '../types';
import { ChevronLeft, Copy, Landmark, Check, RefreshCw, Info, ShieldCheck, X } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

interface FundWalletProps {
  currentUser: UserProfile;
  setCurrentUser?: React.Dispatch<React.SetStateAction<UserProfile>> | ((user: UserProfile | ((prev: UserProfile) => UserProfile)) => void);
  onBack: () => void;
  onRefreshWallet?: () => void;
}

export default function FundWallet({ currentUser, setCurrentUser, onBack, onRefreshWallet }: FundWalletProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const [fundTab, setFundTab] = useState<'virtual' | 'online' | 'manual'>('virtual');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [manualBank, setManualBank] = useState<{ bank_name: string; account_name: string; account_number: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [showKycModal, setShowKycModal] = useState(false);
  const [kycType, setKycType] = useState<'bvn' | 'nin'>('bvn');
  const [kycValue, setKycValue] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const hasExistingKyc = Boolean(
    (currentUser.bvn && currentUser.bvn.length === 11) ||
    (currentUser.nin && currentUser.nin.length === 11) ||
    currentUser.hasKyc ||
    currentUser.has_kyc
  );

  const handleStartGenerateAccount = () => {
    if (!hasExistingKyc) {
      setShowKycModal(true);
      return;
    }
    handleGenerateVirtualAccount();
  };

  const handleGenerateVirtualAccount = async (manualKyc?: { bvn?: string; nin?: string }) => {
    setLoading(true);
    try {
      let created = false;
      let errMsg = '';
      const kycPayload = manualKyc || ((currentUser.bvn || currentUser.nin) ? {
        bvn: currentUser.bvn,
        nin: currentUser.nin,
      } : undefined);

      try {
        const genRes = await api.generateVirtualAccount(kycPayload);
        if (genRes?.require_kyc) {
          setShowKycModal(true);
          return;
        }
        if (genRes && (genRes.account_number || genRes.data?.account_number || genRes.success)) {
          created = true;
          if (manualKyc?.bvn) currentUser.bvn = manualKyc.bvn;
          if (manualKyc?.nin) currentUser.nin = manualKyc.nin;
          currentUser.hasKyc = true;
        } else if (genRes && (genRes.error || genRes.message)) {
          errMsg = genRes.error || genRes.message;
        }
      } catch (e: any) {
        console.warn('Dedicated account generation notice:', e);
        errMsg = e?.message || '';
      }

      // Refresh wallet to load virtual accounts
      const res = await api.getWallet();
      const rawAccs = res.data?.virtual_accounts || res.virtual_accounts || [];
      const accs = Array.isArray(rawAccs) ? rawAccs.filter((a: any) => {
        const b = (a.bank_name || a.bank || '').toLowerCase();
        const num = (a.account_number || a.accountNo || a.account_no || '').trim();
        return !b.includes('wema') && !b.includes('katpay') && num !== '0127189291';
      }) : [];

      if (accs.length > 0) {
        setVirtualAccounts(accs);
        setShowKycModal(false);
        toast.success('Dedicated Virtual Account ready!');
      } else if (created) {
        await fetchFundData();
        setShowKycModal(false);
        toast.success('Virtual Account generated. Refreshing details...');
      } else {
        if (errMsg) {
          toast.error(errMsg);
        } else {
          toast.info('Dedicated virtual account request submitted.');
        }
      }
      if (onRefreshWallet) onRefreshWallet();
    } catch (err: any) {
      toast.error(err?.message || 'Unable to generate virtual account right now.');
    } finally {
      setLoading(false);
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
    try {
      await handleGenerateVirtualAccount({ [kycType]: clean });
    } finally {
      setKycSubmitting(false);
    }
  };

  const handlePasteKyc = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, '').slice(0, 11);
      if (clean) {
        setKycValue(clean);
        toast.success(`Pasted ${kycType.toUpperCase()}!`);
      } else {
        toast.info('No digits found in clipboard.');
      }
    } catch {
      toast.info('Please type or paste directly.');
    }
  };

  // Online funding state (Paystack & Payvessel)
  const [gateway, setGateway] = useState<'paystack' | 'payvessel'>('payvessel');
  const [onlineAmount, setOnlineAmount] = useState('2000');
  const grossOnline = parseFloat(onlineAmount || '0') || 0;
  const chargePercent = gateway === 'paystack' ? 0.015 : 0.01;
  const onlineFee = Math.round(grossOnline * chargePercent * 100) / 100;
  const netOnlineCredit = Math.max(0, Math.round((grossOnline - onlineFee) * 100) / 100);
  const [onlineSubmitting, setOnlineSubmitting] = useState(false);

  // Manual funding state
  const [manualAmount, setManualAmount] = useState('20000');
  const [manualRef, setManualRef] = useState('');
  const [manualSender, setManualSender] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    fetchFundData();

    // ── Rapid 2.5-Second Live DVA Top-Up Listener ──
    const interval = setInterval(() => {
      if (onRefreshWallet) {
        onRefreshWallet();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const fetchFundData = async () => {
    setLoading(true);
    try {
      const res = await api.getWallet();
      const rawAccounts = res.data?.virtual_accounts || res.virtual_accounts || [];
      const accounts = Array.isArray(rawAccounts) ? rawAccounts.filter((a: any) => {
        const b = (a.bank_name || a.bank || '').toLowerCase();
        const num = (a.account_number || a.accountNo || a.account_no || '').trim();
        return !b.includes('wema') && !b.includes('katpay') && num !== '0127189291';
      }) : [];
      setVirtualAccounts(accounts);

      const mb = res.data?.manual_bank || res.manual_bank;
      if (mb) {
        const mbName = (mb.bank_name || '').toLowerCase();
        const mbNum = (mb.account_number || '').trim();
        if (!mbName.includes('wema') && !mbName.includes('katpay') && mbNum !== '0127189291') {
          setManualBank(mb);
        } else {
          setManualBank(null);
        }
      }
    } catch (err: any) {
      console.warn('Fund Wallet fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnlineCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(onlineAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      toast.warning('Minimum funding amount is ₦100.');
      return;
    }
    setOnlineSubmitting(true);
    try {
      const res = gateway === 'paystack'
        ? await api.initPaystack(amountNum)
        : await api.initPayvessel(amountNum);

      const checkoutUrl = res.checkout_url || res.data?.checkout_url;
      if (res.success && checkoutUrl) {
        toast.success(`${gateway === 'paystack' ? 'Paystack' : 'Payvessel'} Gateway Initialized! Opening checkout...`);
        try {
          await Browser.open({ url: checkoutUrl });
        } catch {
          window.open(checkoutUrl, '_system');
        }
      } else {
        toast.error(res.error || res.message || `Failed to initialize ${gateway === 'paystack' ? 'Paystack' : 'Payvessel'} payment.`);
      }
    } catch (err: any) {
      toast.error(err.message || `Error connecting to ${gateway === 'paystack' ? 'Paystack' : 'Payvessel'} payment gateway.`);
    } finally {
      setOnlineSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    toast.success(`Copied ${label}!`);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleManualFundingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(manualAmount);
    if (isNaN(amountNum) || amountNum < 20000) {
      toast.warning('Minimum amount for Fund Through Admin is ₦20,000. Redirecting to instant automated funding for smaller amounts...');
      setFundTab('virtual');
      return;
    }
    if (!manualRef || !manualSender) {
      toast.warning('Please enter payment reference and sender name.');
      return;
    }
    setManualSubmitting(true);
    try {
      const res = await api.submitManualDeposit(amountNum, manualRef, manualSender);
      toast.success(res.message || 'Manual deposit notification submitted to Admin dashboard!');
      setManualRef('');
      setManualSender('');
      if (onRefreshWallet) onRefreshWallet();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit manual funding notification.');
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Fund Wallet</h1>
            <p className="text-xs text-slate-400">Add money to your eData balance</p>
          </div>
        </div>

        <button
          onClick={fetchFundData}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5">
        {/* Funding Method Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setFundTab('virtual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              fundTab === 'virtual' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Wallet Account
          </button>
          <button
            onClick={() => setFundTab('online')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              fundTab === 'online' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💳 Online Checkout
          </button>
          <button
            onClick={() => setFundTab('manual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              fundTab === 'manual' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏛️ Fund Through Admin
          </button>
        </div>

        {/* Tab 1: Virtual / Wallet Accounts */}
        {fundTab === 'virtual' && (
          <div className="space-y-4">
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl space-y-2">
              <p className="text-xs text-sky-300 leading-relaxed">
                Transfer from <strong>₦100</strong> to your dedicated <strong>Wallet Account</strong> below. Your eData wallet will be credited <strong>instantly</strong>.
              </p>
              <div className="pt-2 border-t border-sky-500/20 flex items-start gap-2 text-[11px] text-amber-300">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>Notice:</strong> Minimum funding amount is <strong>₦100</strong>. A 1% transaction charge applies across all amounts (e.g. ₦1,000 transfer credits <strong>₦990.00</strong> to your wallet). Transfers below ₦100 cannot be processed.
                </span>
              </div>
            </div>

            {virtualAccounts.length === 0 ? (
              <div className="p-6 bg-slate-800/80 border border-slate-700/80 rounded-3xl space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2 text-sky-400">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-white font-display">Wallet Account Setup</h3>
                  <p className="text-xs text-slate-400">
                    Generate your dedicated bank transfer account for 24/7 automated instant funding.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      readOnly
                      value={currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() || currentUser.email}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-slate-300 font-medium focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Registered Phone</label>
                    <input
                      type="text"
                      readOnly
                      value={currentUser.phone || '08000000000'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-slate-300 font-medium focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleStartGenerateAccount}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display mt-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Wallet Account'}
                  </button>
                </div>

                {/* Secondary manual bank option if present */}
                {manualBank && manualBank.account_number && (
                  <div className="pt-3 border-t border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Alternative Bank Transfer Account</span>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] text-sky-400 font-bold uppercase">{manualBank.bank_name}</span>
                        <p className="text-sm font-mono font-bold text-white tracking-wider">{manualBank.account_number}</p>
                        <p className="text-[11px] text-slate-400">{manualBank.account_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(manualBank.account_number, 'Account Number')}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer"
                      >
                        {copiedBank === 'Account Number' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {virtualAccounts.map((acc, i) => (
                  <div key={i} className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-400">{acc.bank_name}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Automatic</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-mono font-extrabold text-white tracking-wider">{acc.account_number}</p>
                        <p className="text-xs text-slate-400">{acc.account_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.account_number, acc.bank_name)}
                        className="p-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl transition-all cursor-pointer active:scale-95"
                      >
                        {copiedBank === acc.bank_name ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Online Payment Gateway Checkout */}
        {fundTab === 'online' && (
          <form onSubmit={handleOnlineCheckout} className="space-y-4">
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl space-y-2">
              <p className="text-xs text-sky-300 leading-relaxed">
                Pay online using <strong>Debit Card, USSD, or Bank Transfer</strong>. Your wallet will be credited automatically upon payment.
              </p>
              <div className="pt-2 border-t border-sky-500/20 flex items-start gap-2 text-[11px] text-amber-300">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  {gateway === 'paystack'
                    ? 'A 1.5% transaction charge applies to Paystack checkout.'
                    : 'A 1% transaction charge applies to Payvessel checkout.'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-4">
              {/* Payment Gateway Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Payment Gateway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway('payvessel')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gateway === 'payvessel'
                        ? 'bg-sky-500/15 border-sky-400 text-white ring-1 ring-sky-400'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white font-display">Payvessel</span>
                      <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Instant</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">Instant Transfer • 1% fee</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway('paystack')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gateway === 'paystack'
                        ? 'bg-emerald-500/15 border-emerald-400 text-white ring-1 ring-emerald-400'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white font-display">Paystack</span>
                      <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Active</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">Card, USSD & Bank • 1.5% fee</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount to Pay (₦)</label>
                <input
                  type="number"
                  value={onlineAmount}
                  onChange={(e) => setOnlineAmount(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base font-mono font-bold focus:outline-none focus:border-sky-500"
                  required
                  min="100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 5000, 10000, 20000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setOnlineAmount(String(amt))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      onlineAmount === String(amt)
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    +₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Fee Calculation Breakdown Card */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Payment Amount:</span>
                  <span className="font-mono font-bold text-white">₦{grossOnline.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> {(chargePercent * 100).toFixed(1)}% Transaction Charge:
                  </span>
                  <span className="font-mono font-bold">-₦{onlineFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-emerald-400 font-bold">
                  <span>Net Wallet Credit:</span>
                  <span className="text-sm font-mono tracking-wider">₦{netOnlineCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={onlineSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-display"
              >
                {onlineSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Connecting {gateway === 'paystack' ? 'Paystack' : 'Payvessel'} Gateway...</span>
                  </>
                ) : (
                  <span>Pay ₦{grossOnline.toLocaleString()} with {gateway === 'paystack' ? 'Paystack' : 'Payvessel'} (Net: ₦{netOnlineCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Fund Through Admin */}
        {fundTab === 'manual' && (
          <form onSubmit={handleManualFundingSubmit} className="space-y-4">
            <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Manual Deposit Account</h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold font-display">
                  Min of ₦20,000
                </span>
              </div>
              {manualBank ? (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                  <p className="text-xs text-slate-400">Bank: <strong className="text-white">{manualBank.bank_name}</strong></p>
                  <p className="text-xs text-slate-400">Account Name: <strong className="text-white">{manualBank.account_name}</strong></p>
                  <p className="text-xs text-slate-400">Account Number: <strong className="text-sky-400 font-mono">{manualBank.account_number}</strong></p>
                </div>
              ) : (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-center">
                  <p className="text-xs text-slate-400">Loading bank details...</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400">Deposit Amount (₦)</label>
                  <span className="text-[11px] font-extrabold text-amber-400 font-display">Min of ₦20,000</span>
                </div>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="20000"
                  min="20000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono font-bold focus:outline-none focus:border-sky-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Amounts under ₦20,000 will automatically redirect to instant automated funding options.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Transfer Reference / Narration</label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. TRF/EDATA/908712"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Sender Account Name</label>
                <input
                  type="text"
                  value={manualSender}
                  onChange={(e) => setManualSender(e.target.value)}
                  placeholder="Your Bank Account Name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={manualSubmitting}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-extrabold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer font-display shadow-lg shadow-sky-500/20"
              >
                {manualSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* KYC Verification Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => { if (!kycSubmitting) setShowKycModal(false); }}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl shadow-black/40 font-display">
            <button
              type="button"
              onClick={() => setShowKycModal(false)}
              disabled={kycSubmitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-sky-500" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white text-center">
              Identity Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5 leading-relaxed font-medium">
              Enter your 11-digit BVN or NIN to assign your dedicated bank account.
            </p>

            {/* Toggle BVN / NIN */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => { setKycType('bvn'); setKycValue(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  kycType === 'bvn'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                BVN
              </button>
              <button
                type="button"
                onClick={() => { setKycType('nin'); setKycValue(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  kycType === 'nin'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                NIN
              </button>
            </div>

            <form onSubmit={handleKycSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {kycType === 'bvn' ? '11-Digit BVN' : '11-Digit NIN'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={kycValue}
                    onChange={(e) => setKycValue(e.target.value.replace(/\D/g, ''))}
                    placeholder={kycType === 'bvn' ? 'Enter 11-digit BVN' : 'Enter 11-digit NIN'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 pr-20 text-slate-900 dark:text-white font-mono text-center tracking-widest text-base focus:outline-none transition-colors"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={handlePasteKyc}
                    className="absolute right-2 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={kycValue.length !== 11 || kycSubmitting}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25 font-display"
              >
                {kycSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Generate Account'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
