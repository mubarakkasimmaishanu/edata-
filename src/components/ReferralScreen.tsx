import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralConfig, CustomerWithdrawalItem, PayoutBankAccount } from '../types';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { useBackHandler } from '../utils/backHandler';
import {
  ChevronLeft, Copy, Check, ArrowRight,
  Users, RefreshCw, Award, TrendingUp, Target, Clock, CheckCircle2, Gift,
  Landmark, AlertCircle, ArrowUpRight, DollarSign, Wallet as WalletIcon, Lock, Edit3, ShieldCheck, ChevronDown
} from 'lucide-react';
import { FaWhatsapp, FaShareNodes } from 'react-icons/fa6';
import { formatMoney } from '../utils/formatters';
import edataLogo from '../assets/edata_logo.png';
import mtnIcon from '@/assets/icons/mtn.png';
import airtelIcon from '@/assets/icons/airtel.png';
import gloIcon from '@/assets/icons/glo.png';
import nineMobileIcon from '@/assets/icons/9mobile.png';
import walletIcon from '@/assets/icons/airtimetocash.png';
import userVerifyIcon from '@/assets/icons/user-verify.png';
import PinInput from './PinInput';

// Real official brand icons wrapped for React 19
const OfficialWhatsApp = ({ className = 'w-5 h-5' }: { className?: string }) => {
  const Icon = FaWhatsapp as any;
  return <Icon className={className} />;
};

const OfficialShareNodes = ({ className = 'w-4 h-4' }: { className?: string }) => {
  const Icon = FaShareNodes as any;
  return <Icon className={className} />;
};

interface ReferralScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

export default function ReferralScreen({ currentUser, onBack, onNavigate }: ReferralScreenProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralConfig, setReferralConfig] = useState<ReferralConfig | null>(null);

  // 2-Step Payout Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'amount' | 'pin'>('amount');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Bank Setup / Change Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankPin, setBankPin] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  // Android hardware back handler for open modals
  useBackHandler(showWithdrawModal, () => {
    if (withdrawStep === 'pin') {
      setWithdrawStep('amount');
      setWithdrawPin('');
    } else {
      setShowWithdrawModal(false);
    }
  });

  useBackHandler(showBankModal, () => {
    setShowBankModal(false);
  });

  // Derived fallbacks in case API is loading / offline
  const fallbackCode = currentUser.phone || currentUser.email?.split('@')[0] || String(currentUser.id || 'EDATA');
  const fallbackLink = `https://edata.com.ng/join?ref=${encodeURIComponent(fallbackCode)}`;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.getReferralConfig(true);
      if (res && res.success && res.data) {
        setReferralConfig(res.data);
      }
    } catch (err) {
      console.warn('Referral config fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const refCode = referralConfig?.referral_code || fallbackCode;
  const refLink = referralConfig?.referral_link || fallbackLink;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    toast.success('Referral code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareText = `Join me on eData Mobile to buy cheap data bundles, airtime, and pay electricity & TV bills at wholesale prices!\n\nUse my referral code: ${refCode}\nRegister here: ${refLink}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'eData Mobile - Instant VTU & Data',
          text: shareText,
          url: refLink,
        });
      } catch {
        /* user dismissed native share sheet */
      }
    } else {
      handleWhatsAppShare();
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const case1Label = referralConfig?.case1_label || 'Price Difference';
  const case1Desc = referralConfig?.case1_desc || "Earn the profit difference on downline's first 5 orders";
  const case2Label = referralConfig?.case2_label || '₦2,500 Bonus';
  const case2Desc = referralConfig?.case2_desc || 'Immediate cash bonus on Reseller account upgrades';
  const case3Label = referralConfig?.case3_label || '₦2,000 Bonus';
  const case3Desc = referralConfig?.case3_desc || 'Standard bonus on reseller downline registrations';

  const howItWorksSteps = referralConfig?.how_it_works && referralConfig.how_it_works.length > 0
    ? referralConfig.how_it_works
    : [
        { step: 1, title: 'Share Your Code or Link', desc: 'Send your referral code or invite link to friends, family, or business contacts.' },
        { step: 2, title: 'Friends Register & Transact', desc: 'Your friends sign up and make purchases or upgrade to a Reseller account.' },
        { step: 3, title: 'Earn Instant Cash', desc: 'Commissions credit automatically into your Commission Wallet to fund transactions or withdraw directly to your bank!' }
      ];

  const downlines = referralConfig?.downlines || [];
  const profitShare = referralConfig?.profit_share;
  const totalDownlinesCount = referralConfig?.total_referrals_count ?? downlines.length;
  const commissionBalance = referralConfig?.commission_wallet_balance ?? currentUser.commissionWallet ?? 0;

  // Dynamic Payout Config configured by Admin (Mobile as Mirror)
  const isPayoutEnabled = referralConfig?.payout_config?.is_enabled ?? true;
  const payoutNotice = referralConfig?.payout_config?.notice_message;
  const minPayoutAmount = referralConfig?.payout_config?.min_amount ?? 2500.00;
  const payoutFee = referralConfig?.payout_config?.fee ?? 50.00;

  // Destination Bank Info
  const serverBank: PayoutBankAccount | undefined = referralConfig?.payout_config?.bank_account;
  const hasConfiguredBank = Boolean(
    serverBank?.is_configured ||
    currentUser.has_bank_account ||
    currentUser.account_number_masked ||
    currentUser.bank_name
  );
  const activeBankName = serverBank?.bank_name || currentUser.bank_name || '';
  const activeAccountMasked = serverBank?.account_number_masked || currentUser.account_number_masked || '******';
  const activeAccountName = serverBank?.account_name || currentUser.account_name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() || currentUser.name;

  const recentPayouts: CustomerWithdrawalItem[] = referralConfig?.payout_config?.recent_payouts || [];

  // Payout calculation
  const parsedWithdrawAmount = parseFloat(withdrawAmount) || 0;
  const netDisbursement = Math.max(0, parsedWithdrawAmount - payoutFee);
  const hasPendingPayout = recentPayouts.some(p => p.status === 1);

  // Open Bank Setup Modal
  const openBankSetupModal = () => {
    setBankName(activeBankName);
    setAccountNumber('');
    setAccountName(activeAccountName);
    setBankPin('');
    setShowBankModal(true);
  };

  // Save / Update Bank Account
  const handleSaveBank = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.warning('Bank name, 10-digit account number, and account name are required.');
      return;
    }
    const cleanNum = accountNumber.replace(/\D/g, '');
    if (cleanNum.length !== 10) {
      toast.warning('Account number must be exactly 10 digits (NUBAN format).');
      return;
    }
    if (hasConfiguredBank && bankPin.length !== 4) {
      toast.warning('Please enter your 4-digit Transaction PIN to modify your payout bank account.');
      return;
    }

    setSavingBank(true);
    try {
      const res = await api.savePayoutAccount({
        bank_name: bankName.trim(),
        account_number: cleanNum,
        account_name: accountName.trim(),
        transaction_pin: bankPin || undefined,
      });

      if (res && res.success) {
        toast.success('Payout bank account saved successfully!');
        setShowBankModal(false);
        setBankPin('');
        setAccountNumber('');
        fetchConfig();
      } else {
        toast.error(res?.error || 'Failed to save payout bank details.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  // Step 1: Validate Amount & Proceed to PIN
  const handleProceedToPin = () => {
    if (parsedWithdrawAmount < minPayoutAmount) {
      toast.warning(`Minimum withdrawal threshold set by administration is ₦${minPayoutAmount.toLocaleString()}.`);
      return;
    }
    if (parsedWithdrawAmount > commissionBalance) {
      toast.warning(`Insufficient commission balance. You have ₦${commissionBalance.toLocaleString()}.`);
      return;
    }
    setWithdrawPin('');
    setWithdrawStep('pin');
  };

  // Step 2: Submit Payout with 4-Digit PIN
  const handleConfirmWithdraw = async (enteredPin?: string) => {
    const finalPin = enteredPin || withdrawPin;
    if (finalPin.length !== 4) {
      toast.warning('Please enter your 4-digit Transaction PIN to authorize withdrawal.');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await api.requestReferralWithdraw({
        amount: parsedWithdrawAmount,
        transaction_pin: finalPin,
      });

      if (res && res.success) {
        toast.success('Payout request submitted successfully! Your funds will be reviewed and disbursed to your account.');
        setShowWithdrawModal(false);
        setWithdrawStep('amount');
        setWithdrawAmount('');
        setWithdrawPin('');
        fetchConfig();
      } else {
        toast.error(res?.error || 'Withdrawal request failed.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Withdrawal request failed.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-36 font-display">
      {/* 🧭 App Header 🧭 */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 p-1 flex items-center justify-center shrink-0">
              <img src={edataLogo} alt="eData" className="w-6 h-6 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white font-display truncate">Refer & Earn</h1>
              <p className="text-[10.5px] text-slate-400 font-medium truncate">Affiliate Commissions & Payouts</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchConfig}
          disabled={loading}
          className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-all active:scale-95 cursor-pointer"
          title="Refresh Config"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* 🏆 Marketer Profit-Share Live Counter (If Qualified) 🏆 */}
        {profitShare && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{profitShare.tier_name} ({profitShare.tier_share_label})</span>
              </div>
              <span className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-sky-400" />
                {profitShare.month_label}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block font-display">
                Monthly Profit-Share Earnings
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {profitShare.current_month_earned_formatted}
                </h2>
                {profitShare.today_earned > 0 && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/30">
                    +{profitShare.today_earned_formatted} today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                Automated share from all completed reseller orders in your leadership group.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="rounded-2xl p-3 bg-slate-900/60 border border-slate-700/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-display">
                    Active Resellers
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    {profitShare.active_resellers_count}
                    <span className="text-xs text-slate-400 font-normal"> / {profitShare.target_resellers_required} req.</span>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl p-3 bg-slate-900/60 border border-slate-700/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-display">
                    Team Orders
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    {profitShare.total_reseller_transactions}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-3.5 bg-slate-900/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-300 font-display">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Monthly Target Progress
                </span>
                <span className="font-mono text-sky-400">{profitShare.target_percent}%</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profitShare.target_met ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-sky-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, profitShare.target_percent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className={`font-semibold flex items-center gap-1.5 ${profitShare.target_met ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {profitShare.target_met ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  {profitShare.target_met
                    ? `Qualified for Payout (${profitShare.settlement_date})`
                    : `${profitShare.active_resellers_count}/${profitShare.target_resellers_required} active downline resellers required`}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {profitShare.days_remaining}d left
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 🎁 Bespoke Hero Invitation Card (Understated & Premium) 🎁 */}
        <div className="hero-wallet-card bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl shadow-xl space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="bg-sky-500/15 text-sky-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-sky-500/30 flex items-center gap-1.5 font-display">
              <Gift className="w-3 h-3 text-sky-400" /> Referral Rewards
            </span>

            <span className="bg-slate-900/80 px-3 py-1 rounded-full text-xs font-bold text-white border border-slate-700 flex items-center gap-1 font-mono">
              Commission: {formatMoney(commissionBalance)}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white font-display leading-tight">
              {referralConfig?.banner_title || 'Invite Contacts & Earn Commission'}
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">
              {referralConfig?.banner_subtitle ||
                "Earn price difference on first 5 downline orders, plus up to ₦2,500 bonus on Reseller account upgrades!"}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> Direct Bank Payouts
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> Instant Commission Wallet
            </span>
          </div>
        </div>

        {/* 💳 COMMISSION PAYOUT CARD (Non-Flashy, Bespoke Banking UI) 💳 */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/25">
                <Landmark className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
                  Commission Payout
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Withdraw balance to your Nigerian bank</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-400 font-mono block">
                {formatMoney(commissionBalance)}
              </span>
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider font-display">
                Withdrawable
              </span>
            </div>
          </div>

          {/* Linked Bank Destination Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700/60">
                <Landmark className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block font-display">
                    Destination Bank
                  </span>
                  {hasConfiguredBank && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-display">
                      Verified
                    </span>
                  )}
                </div>
                {hasConfiguredBank ? (
                  <div>
                    <span className="text-xs font-bold text-white font-mono block truncate">
                      {activeBankName} • {activeAccountMasked}
                    </span>
                    {activeAccountName && (
                      <span className="text-[10.5px] text-slate-400 block truncate font-medium">
                        {activeAccountName}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-amber-400 font-display block">
                    No Payout Bank Account Linked
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={openBankSetupModal}
              className="bg-slate-800 hover:bg-slate-750 text-sky-400 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{hasConfiguredBank ? 'Change' : '+ Add Bank'}</span>
            </button>
          </div>

          {/* Optional Broadcast Maintenance / Policy Notice from Admin */}
          {payoutNotice && (
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center gap-2 text-[11px] text-sky-200 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{payoutNotice}</span>
            </div>
          )}

          {/* Payout Action State: Paused by Admin, Pending in Queue, or Active */}
          {!isPayoutEnabled ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-200 font-medium leading-relaxed">
                {payoutNotice || 'Referral commission withdrawals are temporarily paused for maintenance. Please check back shortly.'}
              </p>
            </div>
          ) : hasPendingPayout ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200 font-medium leading-relaxed">
                You have a pending payout awaiting admin review. Once marked paid, funds will appear in your bank account.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={!hasConfiguredBank || commissionBalance < minPayoutAmount}
                onClick={() => {
                  setWithdrawAmount(String(commissionBalance));
                  setWithdrawStep('amount');
                  setWithdrawPin('');
                  setShowWithdrawModal(true);
                }}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg shadow-sky-950/20 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 font-display"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw to Bank Account</span>
              </button>

              <div className="flex items-center justify-between text-[10.5px] text-slate-400 px-1">
                <span>Minimum Withdrawal: <strong className="text-white font-mono">₦{minPayoutAmount.toLocaleString()}</strong></span>
                <span>Fee: <strong className="text-white font-mono">₦{payoutFee.toFixed(2)}</strong></span>
              </div>
            </div>
          )}
        </section>

        {/* 📊 WITHDRAWAL HISTORY SECTION (Itemized Receipts) 📊 */}
        {recentPayouts.length > 0 && (
          <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">
                Withdrawal History
              </h3>
              <span className="text-[10px] text-sky-400 font-mono font-bold">
                {recentPayouts.length} record{recentPayouts.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recentPayouts.map((p) => {
                const isPaid = p.status === 2;
                const isRejected = p.status === 3;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-white font-mono">{formatMoney(p.net_amount)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({p.reference})</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1 font-display ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isPaid && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {isRejected && <AlertCircle className="w-2.5 h-2.5" />}
                        {!isPaid && !isRejected && <Clock className="w-2.5 h-2.5" />}
                        {p.status_label || (isPaid ? 'Paid' : isRejected ? 'Rejected' : 'Pending')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="truncate">{p.bank_name} • {p.account_number}</span>
                      <span className="font-mono shrink-0">{p.created_at}</span>
                    </div>

                    {isRejected && p.admin_notes && (
                      <p className="text-[10px] text-rose-300 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                        Reason: {p.admin_notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 💰 Commission Breakdown 💰 */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-black uppercase tracking-[0.16em] text-slate-400 font-display">
              COMMISSION BREAKDOWN
            </span>
            <span className="text-xs font-bold text-sky-400 font-mono">3 Earning Paths</span>
          </div>

          <div className="space-y-2.5">
            {/* Benefit 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 mt-0.5">
                <div className="grid grid-cols-2 gap-1 w-full h-full">
                  <img src={mtnIcon} alt="MTN" className="w-full h-full object-contain rounded" />
                  <img src={airtelIcon} alt="Airtel" className="w-full h-full object-contain rounded" />
                  <img src={gloIcon} alt="Glo" className="w-full h-full object-contain rounded" />
                  <img src={nineMobileIcon} alt="9mobile" className="w-full h-full object-contain rounded" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white font-display">First 5 Transactions</h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0 font-mono">
                    {case1Label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  {case1Desc}
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 p-2 flex items-center justify-center shrink-0 mt-0.5">
                <img src={userVerifyIcon} alt="Reseller Upgrade" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white font-display">Instant Reseller Upgrade</h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 font-mono">
                    {case2Label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  {case2Desc}
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 p-2 flex items-center justify-center shrink-0 mt-0.5">
                <img src={walletIcon} alt="Cash Bonus" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white font-display">Standard Reseller Upgrade</h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 font-mono">
                    {case3Label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  {case3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔗 Referral Details & Sharing 🔗 */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">
              Your Referral Details
            </h3>
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono bg-sky-500/15 px-2.5 py-1 rounded-full border border-sky-500/30">
              <Users className="w-3 h-3" />
              {totalDownlinesCount} Downline{totalDownlinesCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block font-display">
              Referral Code
            </label>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 gap-3">
              <span className="text-lg font-black font-mono tracking-wider text-sky-400 truncate">
                {refCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 font-display shrink-0 ${
                  copiedCode
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30'
                }`}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block font-display">
              Referral Link
            </label>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 gap-2">
              <span className="text-xs font-mono text-slate-300 truncate min-w-0 flex-1">
                {refLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 font-display shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-950/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 font-display"
            >
              <OfficialWhatsApp className="w-5 h-5 text-white" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-sky-950/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 font-display"
            >
              <OfficialShareNodes className="w-4 h-4 text-white" />
              <span>More Share Options</span>
            </button>
          </div>
        </section>

        {/* 📖 How It Works 📖 */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">
              How It Works
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Simple 3-Step Guide</span>
          </div>

          <div className="space-y-2.5">
            {howItWorksSteps.map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center font-black text-xs font-mono shrink-0 mt-0.5">
                  {step.step || idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-white font-display">{step.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 👥 Downlines List 👥 */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">
              Your Downlines ({downlines.length})
            </h3>
            {downlines.length > 0 && (
              <span className="text-xs text-sky-400 font-mono font-bold">
                {downlines.length} registered
              </span>
            )}
          </div>

          {downlines.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {downlines.map((dl) => (
                <div
                  key={dl.id}
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xs font-black font-display shrink-0">
                      {(dl.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate font-display">{dl.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate font-mono">
                        {dl.email} • {dl.date}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 font-display ${
                      dl.level === 'Reseller'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    }`}
                  >
                    {dl.level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-700/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white font-display">No Downlines Yet</h4>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                Share your referral code or link with friends to start earning instant price difference commissions and upgrade bonuses!
              </p>
            </div>
          )}
        </section>

        {/* 🚀 Reseller Upsell Banner 🚀 */}
        {currentUser.category !== 'Premium User' && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('upgrade')}
            className="w-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/40 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer text-left group"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block font-display">
                Boost Your Earnings
              </span>
              <h4 className="text-sm font-black text-white font-display mt-0.5">Upgrade to Reseller</h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Unlock wholesale rates & earn up to ₦2,500 on downline upgrades
              </p>
            </div>
            <span className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md shrink-0 flex items-center gap-1.5 font-display group-hover:scale-105 transition-transform">
              Upgrade <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        )}
      </main>

      {/* 💸 2-STEP WITHDRAWAL MODAL WITH MANDATORY TRANSACTION PIN */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border bg-slate-900 border-slate-700/80 text-white transition-all max-h-[90vh] overflow-y-auto space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/25">
                  {withdrawStep === 'pin' ? <Lock className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h3 className="text-sm font-black font-display text-white">
                    {withdrawStep === 'pin' ? 'Authorize Withdrawal' : 'Withdraw Commission'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    {withdrawStep === 'pin' ? 'Step 2 of 2: Confirm Transaction PIN' : 'Step 1 of 2: Enter Amount'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawStep('amount');
                  setWithdrawPin('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: AMOUNT ENTRY & DESTINATION SUMMARY */}
            {withdrawStep === 'amount' && (
              <div className="space-y-4">
                {/* Destination Preview Card */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/25">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-display">
                      Destination Account
                    </span>
                    <span className="text-xs font-bold text-white font-mono block truncate">
                      {activeBankName} • {activeAccountMasked}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">{activeAccountName}</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-[11px] font-bold text-slate-300 font-display">Withdrawal Amount (₦)</label>
                    <span className="text-[10.5px] text-emerald-400 font-mono font-bold">
                      Available: {formatMoney(commissionBalance)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                      ₦
                    </span>
                    <input
                      type="number"
                      placeholder={String(minPayoutAmount)}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-black text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="flex gap-1.5 pt-1">
                    {[minPayoutAmount, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(String(amt))}
                        className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-all font-mono active:scale-95 cursor-pointer"
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(commissionBalance))}
                      className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-all font-display active:scale-95 cursor-pointer"
                    >
                      All / Max
                    </button>
                  </div>
                </div>

                {/* Real-Time Fee Breakdown */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Withdrawal</span>
                    <span className="font-mono text-white">{formatMoney(parsedWithdrawAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Processing Fee</span>
                    <span className="font-mono text-amber-400">- {formatMoney(payoutFee)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-700/60 flex justify-between font-black text-sm">
                    <span className="text-white font-display">Net Payout to Bank</span>
                    <span className="font-mono text-emerald-400">{formatMoney(netDisbursement)}</span>
                  </div>
                </div>

                {/* Continue to PIN Button */}
                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedToPin}
                    disabled={parsedWithdrawAmount < minPayoutAmount || parsedWithdrawAmount > commissionBalance}
                    className="w-full py-3.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-950/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
                  >
                    <span>Proceed to PIN Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Minimum threshold: ₦{minPayoutAmount.toLocaleString()} • Transaction PIN required on next screen
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: DEDICATED TRANSACTION PIN VERIFICATION */}
            {withdrawStep === 'pin' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Transfer Amount:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">{formatMoney(netDisbursement)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Recipient Bank:</span>
                    <span className="font-mono text-white font-bold">{activeBankName} • {activeAccountMasked}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[180px]">{activeAccountName}</span>
                  </div>
                </div>

                <div className="text-center space-y-1 pt-1">
                  <span className="text-xs font-black text-white font-display block">
                    Enter 4-Digit Transaction PIN
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Authorize the release of your referral commission payout
                  </p>
                </div>

                {/* Centralized PIN Input Component */}
                <div className="flex justify-center py-2">
                  <PinInput
                    length={4}
                    value={withdrawPin}
                    onChange={setWithdrawPin}
                    onComplete={(pin) => handleConfirmWithdraw(pin)}
                    disabled={submittingWithdraw}
                    mask={true}
                    autoFocus={true}
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleConfirmWithdraw()}
                    disabled={submittingWithdraw || withdrawPin.length !== 4}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
                  >
                    {submittingWithdraw ? (
                      <span>Authorizing Payout...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Submit Withdrawal</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawStep('amount');
                      setWithdrawPin('');
                    }}
                    disabled={submittingWithdraw}
                    className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    ← Back to Edit Amount
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🏦 BANK ACCOUNT SETUP / EDIT MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border bg-slate-900 border-slate-700/80 text-white transition-all max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/25">
                  <Landmark className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display text-white">
                    {hasConfiguredBank ? 'Update Payout Bank' : 'Setup Payout Bank'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Link your Nigerian bank account for referral withdrawals</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Popular Banks Chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-display mb-1.5">
                  Popular Banks
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['OPay', 'Moniepoint', 'PalmPay', 'Kuda', 'GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBankName(b)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        bankName === b
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block font-display">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. OPay, Moniepoint, Access Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Account Number Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 block font-display">10-Digit Account Number</label>
                  <span className="text-[10px] text-slate-400 font-mono">{accountNumber.length}/10</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Account Name Input & Matching Warning */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 block font-display">Account Name</label>
                  <span className="text-[9.5px] text-amber-400 font-semibold font-display">Must match profile name</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. JOHN DOE"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
                />
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Registered Name: <strong className="text-white">{`${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() || currentUser.name}</strong>. Third-party accounts are strictly prohibited.
                </p>
              </div>

              {/* PIN input if updating existing account */}
              {hasConfiguredBank && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 block font-display">
                    Authorize Change with 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={bankPin}
                    onChange={(e) => setBankPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-[0.4em] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveBank}
                  disabled={savingBank}
                  className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-950/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
                >
                  {savingBank ? <span>Saving Bank Details...</span> : <span>Save Bank Account</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  disabled={savingBank}
                  className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
