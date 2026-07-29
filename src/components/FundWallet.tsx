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
  const [loading, setLoading] = useState(false);

  // KatPay state
  const [katpayAmount, setKatpayAmount] = useState('2000');
  const [katpaySubmitting, setKatpaySubmitting] = useState(false);

  // Manual funding state
  const [manualAmount, setManualAmount] = useState('5000');
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
    if (isNaN(amountNum) || amountNum < 100) {
      toast.warning('Minimum funding amount is ₦100.');
      return;
    }
    if (!manualRef || !manualSender) {
      toast.warning('Please enter payment reference and sender name.');
      return;
    }
    setManualSubmitting(true);
    try {
      const res = await api.submitManualDeposit(amountNum, manualRef, manualSender);
      toast.success(res.message || 'Manual funding notification submitted!');
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
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
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
            ⚡ Auto Bank
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
            🏦 Manual Bank
          </button>
        </div>

        {/* Tab 1: Virtual Accounts */}
        {fundTab === 'virtual' && (
          <div className="space-y-4">
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
              <p className="text-xs text-sky-300">
                Transfer any amount to the dedicated virtual bank accounts below. Your eData wallet will be credited <strong>instantly</strong>.
              </p>
            </div>

            {virtualAccounts.length === 0 ? (
              <div className="p-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                <Landmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">Dedicated Account</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">Wema Bank / Monnify Automatic Funding</p>
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase">Account Number</span>
                    <p className="text-base font-mono font-bold text-sky-400">7980123456</p>
                    <p className="text-[11px] text-slate-300">eData / {currentUser.name}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard('7980123456', 'Account Number')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                  >
                    {copiedBank === 'Account Number' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
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

        {/* Tab 3: Manual Funding */}
        {fundTab === 'manual' && (
          <form onSubmit={handleManualFundingSubmit} className="space-y-4">
            <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Manual Deposit Account</h3>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                <p className="text-xs text-slate-400">Bank: <strong className="text-white">Fidelity Bank / Kuda</strong></p>
                <p className="text-xs text-slate-400">Account Name: <strong className="text-white">eData Global Enterprise</strong></p>
                <p className="text-xs text-slate-400">Account Number: <strong className="text-sky-400 font-mono">5600123490</strong></p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deposit Amount (₦)</label>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500"
                  required
                />
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
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {manualSubmitting ? 'Submitting...' : 'Submit Deposit Notification'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
