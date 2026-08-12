import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronLeft, Copy, Check, Share2, Gift, ArrowRight, Sparkles
} from 'lucide-react';

interface ReferralScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

// Referral screen — simplified layout with full light/dark theme
// support. Kept every existing piece of functionality: refCode/refLink
// derivation, copy handlers, Web Share API fallback to WhatsApp,
// Reseller-tier upsell (hidden for premium users). What changed is
// visual density and contrast — the previous version stacked a header
// "Earn Cash" pill, a hero "Unlimited Earnings" pill, an "eData
// Rewards" label, a wordy hero paragraph, and a verbose "How it Works"
// section that repeated information from the hero. On light theme the
// hero's `text-purple-100/200` on a light-tinted purple background
// washed out; now the hero uses solid white for headlines and a
// slightly higher-opacity purple for supporting text so it stays
// readable on both palettes.
export default function ReferralScreen({ currentUser, onBack, onNavigate }: ReferralScreenProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const refCode = currentUser.phone || currentUser.email?.split('@')[0] || String(currentUser.id || 'EDATA');
  const refLink = `https://edata.com.ng/register?ref=${encodeURIComponent(refCode)}`;

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

  // Theme tokens — kept as local consts so each usage site stays
  // readable. Same pattern used in ResellerUpgrade / ProfileSettings.
  const isLight = theme === 'light';
  const pageBg      = isLight ? 'bg-[#f4f7fb]'                       : 'bg-slate-900';
  const headerBg    = isLight ? 'bg-white/90 border-slate-200'       : 'bg-slate-900/90 border-slate-800';
  const cardBg      = isLight ? 'bg-white border-slate-200'          : 'bg-slate-800/90 border-slate-700/80';
  const inputBg     = isLight ? 'bg-slate-50 border-slate-200'       : 'bg-slate-900/90 border-slate-700/80';
  const headingText = isLight ? 'text-slate-900'                     : 'text-white';
  const bodyText    = isLight ? 'text-slate-600'                     : 'text-slate-300';
  const mutedText   = isLight ? 'text-slate-500'                     : 'text-slate-400';
  const backBtn     = isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100'
                              : 'text-slate-400 hover:text-white bg-slate-800';
  const linkText    = isLight ? 'text-slate-700'                     : 'text-slate-300';
  const codeText    = isLight ? 'text-sky-600'                       : 'text-sky-400';
  const secondaryCopyBtn = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
    : 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600';

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col max-w-lg mx-auto w-full pb-28 font-display`}>
      {/* ── Header — Removed the redundant "EARN CASH" chip; the
             subtitle already conveys the same message. ── */}
      <header className={`sticky top-0 z-30 backdrop-blur-2xl border-b px-4 py-3.5 flex items-center gap-3 safe-top ${headerBg}`}>
        <button
          onClick={onBack}
          className={`p-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${backBtn}`}
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center border border-purple-500/25 shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-base font-black truncate ${headingText}`}>Referral Program</h1>
            <p className={`text-[11px] font-semibold truncate ${mutedText}`}>Invite friends • Earn cash</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* ── Hero — one clear headline and the two payout amounts.
               Removed the "eData Rewards" label and the paragraph
               that repeated the headline. Hero keeps its purple
               gradient in both themes because it's a branded band;
               all text on it is pure white or high-opacity purple
               so contrast stays AA in light mode too. ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-slate-950 rounded-3xl p-5 border border-purple-400/30 shadow-2xl space-y-4">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-400/25 rounded-full blur-2xl pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-amber-300" /> Unlimited Earnings
          </span>

          <h2 className="text-xl font-black text-white leading-tight">
            Earn ₦200 – ₦1,000 per referral
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider block">Signup</span>
              <span className="text-lg font-black text-emerald-300 font-mono block">₦200</span>
              <span className="text-[10px] text-white/70 block">per active user</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider block">Reseller</span>
              <span className="text-lg font-black text-amber-300 font-mono block">₦1,000</span>
              <span className="text-[10px] text-white/70 block">per upgrade</span>
            </div>
          </div>
        </div>

        {/* ── Your Referral — code + link + one primary share CTA. ── */}
        <section className={`rounded-3xl p-5 space-y-4 shadow-xl border ${cardBg}`}>
          <h3 className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>Your Referral</h3>

          {/* Code row */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold block ${bodyText}`}>Referral Code</label>
            <div className="flex items-center gap-2">
              <div className={`flex-1 min-w-0 rounded-2xl px-4 py-3 text-sm font-black font-mono tracking-wider border ${inputBg} ${codeText} truncate`}>
                {refCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-2xl transition-transform active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0"
                title={copiedCode ? 'Copied' : 'Copy referral code'}
                aria-label={copiedCode ? 'Copied' : 'Copy referral code'}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Link row */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold block ${bodyText}`}>Referral Link</label>
            <div className="flex items-center gap-2">
              <div className={`flex-1 min-w-0 rounded-2xl px-3.5 py-3 text-xs font-mono truncate border ${inputBg} ${linkText}`}>
                {refLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-3 rounded-2xl font-black text-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0 border ${secondaryCopyBtn}`}
                title={copiedLink ? 'Copied' : 'Copy referral link'}
                aria-label={copiedLink ? 'Copied' : 'Copy referral link'}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary share CTA */}
          <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-3.5 rounded-2xl shadow-lg transition-spring active:scale-95 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Share2 className="w-4 h-4" /> Share via WhatsApp / Socials
          </button>
        </section>

        {/* ── How it works — collapsed from three verbose paragraphs
               into a single compact strip so the page feels lighter
               without dropping the explanation. ── */}
        <section className={`rounded-3xl p-4 shadow-xl border ${cardBg}`}>
          <div className="flex items-stretch gap-2 text-center">
            {[
              { n: '1', label: 'Share code' },
              { n: '2', label: 'They sign up' },
              { n: '3', label: 'You earn cash' },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.n}>
                <div className="flex-1 flex flex-col items-center gap-1.5 py-1">
                  <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-500 border border-sky-500/25 flex items-center justify-center font-black text-sm font-mono">
                    {item.n}
                  </div>
                  <span className={`text-[11px] font-bold ${bodyText}`}>{item.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className={`w-4 h-4 self-center shrink-0 ${mutedText}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── Reseller upsell — hidden for premium users. Kept the
               original ₦5,000 upgrade CTA and onNavigate('upgrade')
               behaviour so the existing checkout flow keeps working. ── */}
        {currentUser.category !== 'Premium User' && onNavigate && (
          <button
            onClick={() => onNavigate('upgrade')}
            className={`w-full rounded-3xl p-4 shadow-xl border flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer ${cardBg}`}
          >
            <div className="text-left min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 block">Boost earnings</span>
              <h4 className={`text-sm font-black ${headingText}`}>Upgrade to Reseller</h4>
              <p className={`text-[11px] mt-0.5 ${bodyText}`}>5× higher payouts on every upgrade</p>
            </div>
            <span className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md shrink-0 whitespace-nowrap flex items-center gap-1">
              ₦5,000 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </main>
    </div>
  );
}
