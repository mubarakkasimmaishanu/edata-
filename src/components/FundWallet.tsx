import React, { useState, useEffect } from 'react';
import { UserProfile, VirtualAccount } from '../types';
import { ChevronLeft, Copy, Landmark, Check, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';

interface FundWalletProps {
  currentUser: UserProfile;
  onBack: () => void;
  onRefreshWallet?: () => void;
}

export default function FundWallet({ currentUser, onBack, onRefreshWallet }: FundWalletProps) {
  const toast = useToast();
  const [fundTab, setFundTab] = useState<'virtual' | 'katpay' | 'manual'>('virtual');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [manualBank, setManualBank] = useState<{ bank_name: string; account_name: string; account_number: string }>({
    bank_name: 'Wema Bank',
    account_name: 'CIZAR Innovation',
    account_number: '0127189291',
  });
  const [loading, setLoading] = useState(false);

  // KatPay state
  const [katpayAmount, setKatpayAmount] = useState('2000');
  const [katpaySubmitting, setKatpaySubmitting] = useState(false);

  // Manual funding state
  const [manualAmount, setManualAmount] = useState('20000');
  const [manualRef, setManualRef] = useState('');
  const [manualSender, setManualSender] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    fetchFundData();
  }, []);

  const fetchFundData = async () => {
    setLoading(true);
    try {
      const res = await api.getWallet();
      const accounts = res.data?.virtual_accounts || res.virtual_accounts || [];
      if (Array.isArray(accounts)) {
        setVirtualAccounts(accounts);
      }
      const mb = res.data?.manual_bank || res.manual_bank;
      if (mb) {
        setManualBank(mb);
      }
    } catch (err: any) {
      console.warn('Fund Wallet fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKatpayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(katpayAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      toast.warning('Minimum funding amount is ₦100.');
      return;
    }
    setKatpaySubmitting(true);
    try {
      const res = await api.initKatpay(amountNum);
      if (res.success && (res.checkout_url || res.data?.checkout_url)) {
        const checkoutUrl = res.checkout_url || res.data?.checkout_url;
        toast.success('KatPay Gateway Initialized! Opening checkout window...');
        window.open(checkoutUrl, '_system');
      } else {
        toast.error(res.error || res.message || 'Failed to initialize KatPay payment.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error connecting to KatPay payment gateway.');
    } finally {
      setKatpaySubmitting(false);
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
            onClick={() => setFundTab('katpay')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              fundTab === 'katpay' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💳 KatPay Online
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
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
              <p className="text-xs text-sky-300">
                Transfer any amount to your dedicated <strong>Wallet Account</strong> below. Your eData wallet will be credited <strong>instantly</strong>.
              </p>
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
                    onClick={async () => {
                      setLoading(true);
                      try {
                        let created = false;
                        try {
                          const genRes = await api.generateVirtualAccount();
                          if (genRes && (genRes.account_number || genRes.data?.account_number)) {
                            created = true;
                          }
                        } catch (e) {
                          console.warn('KatPay direct generation notice:', e);
                        }

                        // Always refresh wallet to load virtual accounts
                        const res = await api.getWallet();
                        const accs = res.data?.virtual_accounts || res.virtual_accounts || [];
                        if (Array.isArray(accs) && accs.length > 0) {
                          setVirtualAccounts(accs);
                          toast.success('Wallet Account generated successfully!');
                        } else if (created) {
                          fetchFundData();
                          toast.success('Wallet Account request processed. Refreshing details...');
                        } else {
                          toast.info('Virtual Account request queued. Using default bank account details below.');
                        }
                      } catch (err: any) {
                        toast.error(err?.message || 'Unable to generate virtual account right now.');
                      } finally {
                        setLoading(false);
                      }
                    }}
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
                        onClick={() => copyToClipboard(acc.account_number, acc.bank_name)}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all cursor-pointer"
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

        {/* Tab 2: KatPay Online Checkout */}
        {fundTab === 'katpay' && (
          <form onSubmit={handleKatpayCheckout} className="space-y-4">
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
              <p className="text-xs text-sky-300 leading-relaxed">
                Pay online using <strong>Debit Card, USSD, or Bank Transfer</strong> via KatPay Payment Gateway. Your wallet will be credited automatically.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Funding Amount (₦)</label>
                <input
                  type="number"
                  value={katpayAmount}
                  onChange={(e) => setKatpayAmount(e.target.value)}
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
                    onClick={() => setKatpayAmount(String(amt))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      katpayAmount === String(amt)
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    +₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={katpaySubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {katpaySubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Connecting KatPay Gateway...</span>
                  </>
                ) : (
                  <span>Pay ₦{parseFloat(katpayAmount || '0').toLocaleString()} with KatPay</span>
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
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                <p className="text-xs text-slate-400">Bank: <strong className="text-white">{manualBank.bank_name}</strong></p>
                <p className="text-xs text-slate-400">Account Name: <strong className="text-white">{manualBank.account_name}</strong></p>
                <p className="text-xs text-slate-400">Account Number: <strong className="text-sky-400 font-mono">{manualBank.account_number}</strong></p>
              </div>
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
    </div>
  );
}
