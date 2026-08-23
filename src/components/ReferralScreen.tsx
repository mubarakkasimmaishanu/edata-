import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralConfig } from '../types';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  ChevronLeft, Copy, Check, Share2, Gift, ArrowRight, Sparkles,
  Users, Wallet, ShieldCheck, RefreshCw, Award
} from 'lucide-react';
import { formatMoney } from '../utils/formatters';

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

  // Derived fallbacks in case API is loading / offline
  const fallbackCode = currentUser.phone || currentUser.email?.split('@')[0] || String(currentUser.id || 'EDATA');
  const fallbackLink = `https://edata.com.ng/register?ref=${encodeURIComponent(fallbackCode)}`;

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

  const handleShare = async () => {
    const shareText = `Join eData Mobile to buy cheap data bundles, airtime, and pay electricity & TV bills at wholesale prices!\nUse my referral code: ${refCode}\nRegister here: ${refLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'eData Mobile - Instant VTU & Data',
          text: shareText,
          url: refLink,
        });
      } catch { /* user dismissed native share sheet */ }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  // eData Brand Unique Color Palette
  const isLight = theme === 'light';
  const pageBg      = isLight ? 'bg-[#f4f7fb]'                 : 'bg-slate-950';
  const headerBg    = isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800';
  const cardBg      = isLight ? 'bg-white border-slate-200'    : 'bg-slate-900/90 border-slate-800';
  const inputBg     = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800';
  const headingText = isLight ? 'text-slate-900'               : 'text-white';
  const bodyText    = isLight ? 'text-slate-600'               : 'text-slate-300';
  const mutedText   = isLight ? 'text-slate-500'               : 'text-slate-400';
  const backBtn     = isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100'
                                : 'text-slate-400 hover:text-white bg-slate-800';
  const codeText    = isLight ? 'text-sky-600'                 : 'text-sky-400';

  const case1Label = referralConfig?.case1_label || 'PRICE DIFFERENCE';
  const case1Desc  = referralConfig?.case1_desc  || 'First 5 downline transactions';
  const case2Label = referralConfig?.case2_label || '₦2,500 BONUS';
  const case2Desc  = referralConfig?.case2_desc  || 'Immediate Reseller upgrade';
  const case3Label = referralConfig?.case3_label || '₦2,000 BONUS';
  const case3Desc  = referralConfig?.case3_desc  || 'Standard Reseller upgrade';

  const howItWorksSteps = referralConfig?.how_it_works && referralConfig.how_it_works.length > 0
    ? referralConfig.how_it_works
    : [
        { step: 1, title: 'Share Code / Link', desc: 'Share your unique referral code or link with your contacts.' },
        { step: 2, title: 'Downline Orders or Upgrades', desc: 'Earn price diff on downline\'s first 5 orders + up to ₦2,500 on Reseller upgrade.' },
        { step: 3, title: 'Instant Commission Cash', desc: 'Commissions credit directly into your Commission Wallet to fund purchases!' }
      ];

  const downlines = referralConfig?.downlines || [];

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col max-w-lg mx-auto w-full pb-28 font-display`}>
      {/* ── App Header ── */}
      <header className={`sticky top-0 z-30 backdrop-blur-2xl border-b px-4 py-3.5 flex items-center justify-between safe-top ${headerBg}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${backBtn}`}
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center border border-sky-500/25 shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-base font-black truncate ${headingText}`}>Referral Program</h1>
              <p className={`text-[11px] font-semibold truncate ${mutedText}`}>Invite & Earn Commissions</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchConfig}
          disabled={loading}
          className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${backBtn}`}
          title="Refresh Config"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* ── Hero Banner (eData Unique Brand Palette: Sky to Indigo Gradient) ── */}
        <div className="hero-referral bg-gradient-to-br from-sky-700 via-sky-800 to-indigo-950 text-white rounded-3xl p-5 border border-sky-400/30 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-amber-300" /> UNLIMITED COMMISSIONS
            </span>

            {referralConfig && (
              <span className="text-[11px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                Wallet: {formatMoney(referralConfig.commission_wallet_balance || currentUser.commissionWallet || 0)}
              </span>
            )}
          </div>

          <h2 className="text-xl font-black text-white leading-tight drop-shadow-sm">
            {referralConfig?.banner_title || 'Earn Unlimited Referral Commissions'}
          </h2>
          <p className="text-xs text-sky-100/90 leading-relaxed font-medium">
            {referralConfig?.banner_subtitle || 'Get instant price difference commission on downline\'s first 5 orders + up to ₦2,500 on Reseller upgrades!'}
          </p>

          {/* Dynamic 3 Case Cards */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 text-center flex flex-col justify-center">
              <span className="text-[8.5px] text-sky-200 font-black uppercase tracking-wider block font-display">CASE 1</span>
              <span className="text-xs font-black text-emerald-300 font-mono block mt-0.5 truncate">{case1Label}</span>
              <span className="text-[8px] text-white/70 block font-medium leading-tight mt-0.5 truncate">{case1Desc}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 text-center flex flex-col justify-center">
              <span className="text-[8.5px] text-amber-200 font-black uppercase tracking-wider block font-display">CASE 2</span>
              <span className="text-xs font-black text-amber-300 font-mono block mt-0.5 truncate">{case2Label}</span>
              <span className="text-[8px] text-white/70 block font-medium leading-tight mt-0.5 truncate">{case2Desc}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 text-center flex flex-col justify-center">
              <span className="text-[8.5px] text-sky-200 font-black uppercase tracking-wider block font-display">CASE 3</span>
              <span className="text-xs font-black text-sky-200 font-mono block mt-0.5 truncate">{case3Label}</span>
              <span className="text-[8px] text-white/70 block font-medium leading-tight mt-0.5 truncate">{case3Desc}</span>
            </div>
          </div>
        </div>

        {/* ── Your Referral Links & Code ── */}
        <section className={`rounded-3xl p-5 space-y-4 shadow-xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>Your Referral Details</h3>
            {referralConfig && (
              <span className="text-[11px] font-bold text-sky-500 flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5" /> {referralConfig.total_referrals_count} Downline{referralConfig.total_referrals_count === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Code row */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold block ${bodyText}`}>Referral Code</label>
            <div className="flex items-center gap-2">
              <div className={`flex-1 min-w-0 rounded-2xl px-4 py-3 text-sm font-black font-mono tracking-wider border ${inputBg} ${codeText} truncate`}>
                {refCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-sky-600 hover:bg-sky-700 text-white p-3 rounded-2xl transition-transform active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0"
                title={copiedCode ? 'Copied' : 'Copy referral code'}
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Link row */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold block ${bodyText}`}>Referral Link</label>
            <div className="flex items-center gap-2">
              <div className={`flex-1 min-w-0 rounded-2xl px-3.5 py-3 text-xs font-mono truncate border ${inputBg} ${bodyText}`}>
                {refLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-3 rounded-2xl font-black text-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0 border ${isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800 text-slate-100 border-slate-700'}`}
                title={copiedLink ? 'Copied' : 'Copy referral link'}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Share CTA */}
          <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-3.5 rounded-2xl shadow-lg transition-spring active:scale-95 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Share2 className="w-4 h-4" /> Share via WhatsApp / Socials
          </button>
        </section>

        {/* ── Dynamic How It Works Steps ── */}
        <section className={`rounded-3xl p-4 space-y-3 shadow-xl border ${cardBg}`}>
          <h3 className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>How It Works</h3>
          <div className="space-y-2">
            {howItWorksSteps.map((step, idx) => (
              <div key={idx} className={`p-3 rounded-2xl border flex items-start gap-3 ${inputBg}`}>
                <div className="w-7 h-7 rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/25 flex items-center justify-center font-black text-xs font-mono shrink-0">
                  {step.step || (idx + 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-black ${headingText}`}>{step.title}</h4>
                  <p className={`text-[11px] mt-0.5 leading-snug ${mutedText}`}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Downlines List Table / Cards ── */}
        {downlines.length > 0 && (
          <section className={`rounded-3xl p-4 space-y-3 shadow-xl border ${cardBg}`}>
            <h3 className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>Your Downlines ({downlines.length})</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {downlines.map((dl) => (
                <div key={dl.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${inputBg}`}>
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block truncate ${headingText}`}>{dl.name}</span>
                    <span className={`text-[10px] block truncate ${mutedText}`}>{dl.email} • {dl.date}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider border shrink-0 ${dl.level === 'Reseller' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-sky-500/15 text-sky-400 border-sky-500/30'}`}>
                    {dl.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Reseller Upsell ── */}
        {currentUser.category !== 'Premium User' && onNavigate && (
          <button
            onClick={() => onNavigate('upgrade')}
            className={`w-full rounded-3xl p-4 shadow-xl border flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer ${cardBg}`}
          >
            <div className="text-left min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 block">Boost earnings</span>
              <h4 className={`text-sm font-black ${headingText}`}>Upgrade to Reseller</h4>
              <p className={`text-[11px] mt-0.5 ${bodyText}`}>Unlock wholesale prices & ₦2,500 referral bonuses</p>
            </div>
            <span className="bg-sky-600 hover:bg-sky-700 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md shrink-0 whitespace-nowrap flex items-center gap-1">
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </main>
    </div>
  );
}
