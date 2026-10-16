import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralConfig } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import {
  ChevronLeft, Copy, Check, ArrowRight,
  Users, RefreshCw, Award, TrendingUp, Target, Clock, CheckCircle2, Gift
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralConfig, setReferralConfig] = useState<ReferralConfig | null>(null);

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
        { step: 3, title: 'Earn Instant Cash', desc: 'Commissions credit automatically into your Commission Wallet to fund transactions!' }
      ];

  const downlines = referralConfig?.downlines || [];
  const profitShare = referralConfig?.profit_share;
  const totalDownlinesCount = referralConfig?.total_referrals_count ?? downlines.length;
  const commissionBalance = referralConfig?.commission_wallet_balance ?? currentUser.commissionWallet ?? 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-36 font-display">
      {/* ── App Header ── */}
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
              <p className="text-[10.5px] text-slate-400 font-medium truncate">Invite Friends & Earn Commissions</p>
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
        {/* ── Marketer Profit-Share Live Counter (OPay / PalmPay Executive Agent Tier) ── */}
        {profitShare && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
            {/* Top Bar: Tier Badge & Month */}
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

            {/* Main Balance Display */}
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

            {/* Stats Grid: Resellers & Orders */}
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

            {/* Target Progress Bar & Settlement Status */}
            <div className="rounded-2xl p-3.5 bg-slate-900/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-300 font-display">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Monthly Target Progress
                </span>
                <span className="font-mono text-sky-400">{profitShare.target_percent}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profitShare.target_met ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-sky-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, profitShare.target_percent))}%` }}
                />
              </div>

              {/* Unlock / Settlement Info */}
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

        {/* ── eData Signature Hero Invitation Card ── */}
        <div className="hero-wallet-card bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white p-5 rounded-3xl shadow-xl border border-sky-400/30 space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/20 flex items-center gap-1.5 font-display">
              <Gift className="w-3 h-3 text-sky-200" /> Referral Rewards
            </span>

            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 flex items-center gap-1 font-mono">
              Wallet: {formatMoney(commissionBalance)}
            </span>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-display leading-tight">
              {referralConfig?.banner_title || 'Invite Friends & Earn Real Cash'}
            </h2>
            <p className="text-xs text-sky-100 font-medium leading-relaxed mt-1">
              {referralConfig?.banner_subtitle ||
                "Get instant price difference commission on your downline's first 5 orders, plus up to ₦2,500 on Reseller account upgrades!"}
            </p>
          </div>

          {/* Feature Highlights Pills */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl bg-sky-950/40 border border-white/20 text-[10px] font-bold text-sky-100 flex items-center gap-1.5">
              <Check className="w-2.5 h-2.5 text-emerald-300" /> Instant Payouts
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-sky-950/40 border border-white/20 text-[10px] font-bold text-sky-100 flex items-center gap-1.5">
              <Check className="w-2.5 h-2.5 text-emerald-300" /> Automatic Wallet Credit
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-sky-950/40 border border-white/20 text-[10px] font-bold text-sky-100 flex items-center gap-1.5">
              <Check className="w-2.5 h-2.5 text-emerald-300" /> Unlimited Downlines
            </span>
          </div>
        </div>

        {/* ── Clear Commission Benefits Section (Official Real Brand Icons) ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-black uppercase tracking-[0.16em] text-slate-400 font-display">
              COMMISSION BREAKDOWN
            </span>
            <span className="text-xs font-bold text-sky-400 font-mono">3 Earning Paths</span>
          </div>

          <div className="space-y-2.5">
            {/* Benefit 1: First 5 Orders (Real Telecom Logos) */}
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

            {/* Benefit 2: Immediate Reseller Upgrade (Real Official Reseller Badge) */}
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

            {/* Benefit 3: Standard Upgrade (Real Official Wallet/Cash Badge) */}
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

        {/* ── Your Referral Details & Sharing Box (Official WhatsApp & Share Icons) ── */}
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

          {/* Referral Code Row */}
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

          {/* Referral Link Row */}
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

          {/* Share Action Buttons */}
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

        {/* ── How It Works (Simple 3 Steps) ── */}
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

        {/* ── Downlines List ── */}
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

        {/* ── Reseller Upsell Banner ── */}
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
    </div>
  );
}
