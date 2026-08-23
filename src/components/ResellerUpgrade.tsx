import React, { useState } from 'react';
import { UserProfile } from '../types';
import PinScreen from './PinScreen';
import {
  ChevronLeft, Wallet, ArrowRight, Lock, Clock, CheckCircle2,
} from 'lucide-react';
import { useBackHandler } from '../utils/backHandler';
import { useTheme } from '../context/ThemeContext';

interface ResellerUpgradeProps {
  currentUser: UserProfile;
  onBack: () => void;
  onSuccess?: () => void;
  onNavigate?: (view: string) => void;
}

/**
 * Reseller Upgrade — Mobile
 *
 * Mirrors the Web upgrade card at [account/index.php] and shares the same
 * backend endpoint (`POST /api/upgrade`) and same status source
 * (`UpgradeRequest.STATUS_PENDING`, `has_pending_upgrade` on `/api/profile`).
 *
 * The dashboard "Upgrade" button routes here directly. The common (ready to
 * pay) path skips any information page and drops the user straight into the
 * PIN payment screen, matching how the web flow is a single form on the
 * membership card. All edge cases (already premium, pending admin review,
 * insufficient balance, no PIN set) are surfaced as compact single-card
 * branches with a clear next step.
 */
export default function ResellerUpgrade({ currentUser, onBack, onSuccess, onNavigate }: ResellerUpgradeProps) {
  const { theme } = useTheme();

  // The upgrade fee is admin-controlled through the Setting model and is
  // delivered on /api/profile as `premium_upgrade_fee`. When the profile
  // sync hasn't returned yet we render a neutral placeholder rather than
  // baking a naira value into the client.
  const upgradeFee = currentUser.upgradeFee && currentUser.upgradeFee > 0
    ? currentUser.upgradeFee
    : 0;
  const upgradeFeeLabel = upgradeFee > 0
    ? `₦${upgradeFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
    : '—';
  const walletBalance = currentUser.walletBalance || 0;
  const hasEnoughBalance = upgradeFee > 0 && walletBalance >= upgradeFee;
  const isAlreadyPremium = currentUser.category === 'Premium User';
  const isPending = Boolean(currentUser.hasPendingUpgrade);
  const hasPin = Boolean(currentUser.hasPin);

  // Only the fully-ready case renders the PIN screen. All other branches
  // land on a compact status card so the user always sees the correct
  // next step immediately.
  const readyToPay = !isAlreadyPremium && !isPending && hasPin && hasEnoughBalance;

  const [showPinScreen, setShowPinScreen] = useState<boolean>(readyToPay);

  // Android back closes the PIN sheet before it can pop the whole page.
  useBackHandler(showPinScreen, () => {
    setShowPinScreen(false);
    onBack();
  });

  if (showPinScreen && readyToPay) {
    return (
      <PinScreen
        mode="upgrade_pin"
        summary={{
          title: 'Reseller License Upgrade',
          subtitle: 'One-time payment • Instant activation',
          amount: upgradeFee,
          provider: 'eData VTU Platform',
          iconType: 'upgrade',
        }}
        onBack={() => {
          setShowPinScreen(false);
          onBack();
        }}
        onSuccess={() => {
          setShowPinScreen(false);
          if (onSuccess) onSuccess();
          onBack();
        }}
      />
    );
  }

  const cardBg = theme === 'light'
    ? 'bg-white border-slate-200'
    : 'bg-slate-900 border-slate-800';
  const pageBg = theme === 'light' ? 'bg-slate-50' : 'bg-slate-950';
  const headingText = theme === 'light' ? 'text-slate-900' : 'text-white';
  const bodyText = theme === 'light' ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col max-w-lg mx-auto w-full`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3.5 flex items-center gap-3 safe-top ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/90 border-slate-800'
      }`}>
        <button
          onClick={onBack}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            theme === 'light' ? 'text-slate-600 hover:text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-white bg-slate-800'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-base font-bold ${headingText}`}>Reseller Upgrade</h1>
          <p className={`text-xs ${bodyText}`}>Complete payment to unlock reseller pricing</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Premium already active — defensive branch */}
        {isAlreadyPremium && (
          <div className={`rounded-3xl p-6 border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className={`text-base font-black ${headingText}`}>Reseller Tier Active</h2>
                <p className={`text-xs ${bodyText}`}>You're already on the reseller pricing tier.</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Pending admin review — matches the Web pending card */}
        {!isAlreadyPremium && isPending && (
          <div className={`rounded-3xl p-6 border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className={`text-base font-black ${headingText}`}>Upgrade Pending Approval</h2>
                <p className={`text-xs ${bodyText} mt-0.5`}>
                  Your payment of {upgradeFeeLabel} has been received. Our admin team is verifying your request.
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* No transaction PIN yet — must set one before we can charge the wallet */}
        {!isAlreadyPremium && !isPending && !hasPin && (
          <div className={`rounded-3xl p-6 border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                <Lock className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <h2 className={`text-base font-black ${headingText}`}>Set your Transaction PIN</h2>
                <p className={`text-xs ${bodyText} mt-0.5`}>
                  A 4-digit PIN is required to authorise the {upgradeFeeLabel} upgrade payment.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('profile')}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Set Transaction PIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Insufficient wallet balance — invite user to fund wallet */}
        {!isAlreadyPremium && !isPending && hasPin && !hasEnoughBalance && (
          <div className={`rounded-3xl p-6 border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h2 className={`text-base font-black ${headingText}`}>Insufficient Wallet Balance</h2>
                <p className={`text-xs ${bodyText} mt-0.5`}>
                  {upgradeFee > 0
                    ? <>Add <strong>₦{(upgradeFee - walletBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong> to your wallet to complete the {upgradeFeeLabel} upgrade.</>
                    : 'Waiting for the current upgrade fee from server. Please try again in a moment.'}
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${bodyText}`}>Wallet Balance</span>
              <span className={`text-sm font-black font-mono ${headingText}`}>
                ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('fund')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Fund Wallet Now</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}