import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useToast } from './Toast';
import {
  ChevronLeft, Copy, Check, Share2, Gift, Users, Trophy, DollarSign,
  ArrowRight, Sparkles, ShieldCheck, Zap, HelpCircle
} from 'lucide-react';

interface ReferralScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

export default function ReferralScreen({ currentUser, onBack, onNavigate }: ReferralScreenProps) {
  const toast = useToast();
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
      } catch {}
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-28 font-display">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Gift className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white font-display">Referral Program</h1>
              <p className="text-[10px] text-purple-400 font-semibold font-mono">Invite Friends & Earn Cash</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider font-display">Earn Cash</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-5">
        {/* ── Hero Banner Card ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-slate-950 rounded-3xl p-5 border border-purple-400/30 shadow-2xl space-y-4">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-[10px] font-black rounded-full uppercase tracking-widest">
              <Trophy className="w-3 h-3 text-amber-300" /> UNLIMITED EARNINGS
            </span>
            <span className="text-xs font-bold text-slate-300">eData Rewards</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white leading-tight font-display">
              Earn Up To ₦1,000 Per Upgrade
            </h2>
            <p className="text-xs text-purple-100 font-medium">
              Share your unique referral code or link with friends, family, and social media followers.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-900/40 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">Standard Referral</span>
              <span className="text-base font-black text-emerald-400 font-mono">₦200</span>
              <span className="text-[9px] text-slate-300 block">per active registration</span>
            </div>
            <div className="bg-slate-900/40 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">Reseller Upgrade</span>
              <span className="text-base font-black text-amber-300 font-mono">₦1,000</span>
              <span className="text-[9px] text-slate-300 block">per license upgrade</span>
            </div>
          </div>
        </div>

        {/* ── REFERRAL CODE & LINK CARD ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">YOUR UNIQUE REFERRAL CREDENTIALS</h3>

          {/* Referral Code Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">Referral Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-black font-mono text-sky-400 tracking-wider">
                {refCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 rounded-2xl font-black text-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 font-display"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">Referral Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3.5 py-3 text-xs font-mono text-slate-300 truncate">
                {refLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-3 rounded-2xl font-black text-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 font-display border border-slate-600"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-3.5 rounded-2xl shadow-lg transition-spring active:scale-95 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider font-display"
          >
            <Share2 className="w-4 h-4" /> Share via WhatsApp / Socials
          </button>
        </section>

        {/* ── HOW IT WORKS SECTION ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">HOW REFERRALS WORK</h3>

          <div className="space-y-3.5">
            {[
              { step: '1', title: 'Share Your Link or Code', desc: 'Copy your referral link or code above and send it to friends, WhatsApp groups, or social media.' },
              { step: '2', title: 'Friends Register & Transact', desc: 'When your referred friends sign up with your code, they join your network.' },
              { step: '3', title: 'Earn Instant Cash Credits', desc: 'Receive automatic cash bonuses directly in your eData wallet when they upgrade or transact.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3.5 items-start p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-sm shrink-0 font-mono">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white font-display">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RESELLER UPGRADE CALLOUT ── */}
        {currentUser.category !== 'Premium User' && onNavigate && (
          <div className="bg-gradient-to-r from-sky-900 to-indigo-950 border border-sky-500/40 rounded-3xl p-4.5 shadow-xl flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-display">
                BOOST EARNINGS
              </span>
              <h4 className="text-xs font-black text-white font-display">Upgrade to Reseller Tier</h4>
              <p className="text-[11px] text-slate-300">Earn 5x higher referral payouts on every user upgrade.</p>
            </div>
            <button
              onClick={() => onNavigate('upgrade')}
              className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-spring active:scale-95 cursor-pointer font-display whitespace-nowrap"
            >
              Upgrade ₦5,000
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
