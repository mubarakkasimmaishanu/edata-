import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Zap,
  Tv,
  GraduationCap,
  Sparkles,
  KeyRound,
  Mail,
  Tag,
} from 'lucide-react';
import PinInput from './PinInput';
import { api } from '../services/api';
import { useToast } from './Toast';
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
import aedcIcon from '@/assets/icons/aedc.png';
import walletIcon from '@/assets/icons/airtimetocash.png';

export interface PurchaseSummary {
  title: string;
  subtitle?: string;
  amount: number | string;
  recipient?: string;
  provider?: string;
  badge?: string;
  icon?: string;
  iconType?: 'airtime' | 'data' | 'cable' | 'electricity' | 'exam' | 'a2c' | 'upgrade';
  details?: { label: string; value: string }[];
}

export interface PinScreenProps {
  mode: 'purchase' | 'set_pin' | 'change_pin' | 'forgot_pin' | 'upgrade_pin';
  summary?: PurchaseSummary;
  userEmail?: string;
  onBack: () => void;
  onSuccess: (data?: any) => void;
  onSubmitPurchase?: (pin: string, recipient?: string, promoCode?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PinScreen({
  mode,
  summary,
  userEmail = '',
  onBack,
  onSuccess,
  onSubmitPurchase,
  isLoading: externalLoading = false,
}: PinScreenProps) {
  const toast = useToast();
  const { theme } = useTheme();
  // Input state
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState<string>(summary?.recipient || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Multi-step states for setup, change, and forgot pin
  const [step, setStep] = useState<number>(1);
  const [tempPin, setTempPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // OTP sending state for forgot_pin
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const loading = externalLoading || isSubmitting;

  const serviceTypeLower = (summary?.iconType || '').toLowerCase();
  const requiresRecipient = serviceTypeLower !== 'exam' && serviceTypeLower !== 'exams' && serviceTypeLower !== 'upgrade';

  const getRecipientLabel = () => {
    switch (serviceTypeLower) {
      case 'airtime':
      case 'data':
        return 'Recipient Phone Number';
      case 'cable':
        return 'Smartcard / IUC Number';
      case 'electricity':
        return 'Meter Number';
      case 'a2c':
        return 'Sender Phone Number';
      default:
        return 'Recipient Phone Number';
    }
  };

  const getRecipientPlaceholder = () => {
    switch (serviceTypeLower) {
      case 'airtime':
      case 'data':
        return 'Enter 11-digit phone number';
      case 'cable':
        return 'Enter Smartcard or IUC number';
      case 'electricity':
        return 'Enter Meter number';
      case 'a2c':
        return 'Enter Sender phone number';
      default:
        return 'Enter account / phone number';
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    const code = promoCodeInput.trim().toUpperCase();
    setValidatingPromo(true);
    try {
      const origAmount = typeof summary?.amount === 'number' ? summary.amount : parseFloat(String(summary?.amount || 0));
      const res = await api.validatePromoCode(code, origAmount);
      const discount = parseFloat(res.discount || res.data?.discount || 0);
      const finalDiscount = discount > 0 ? discount : Math.min(origAmount * 0.05, 100);
      setAppliedPromoCode(code);
      setPromoDiscount(finalDiscount);
      toast.success(res.message || `Promo code ${code} applied successfully! Saved ₦${finalDiscount.toFixed(2)}`);
    } catch (err: any) {
      const origAmount = typeof summary?.amount === 'number' ? summary.amount : parseFloat(String(summary?.amount || 0));
      const finalDiscount = Math.min(origAmount * 0.05, 100);
      setAppliedPromoCode(code);
      setPromoDiscount(finalDiscount);
      toast.success(`Promo code ${code} applied successfully! Saved ₦${finalDiscount.toFixed(2)}`);
    } finally {
      setValidatingPromo(false);
    }
  };

  useEffect(() => {
    // Reset states when mode changes
    setPin('');
    setHasError(false);
    setErrorMessage('');
    setStep(1);
    setTempPin('');
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setOtpCode('');
    setPromoCodeInput('');
    setAppliedPromoCode('');
    setPromoDiscount(0);
    if (summary?.recipient) {
      setRecipientPhone(summary.recipient);
    }
  }, [mode, summary?.recipient]);

  // Handle auto submit / step completion
  const handleComplete = async (completedValue: string) => {
    if (loading) return;
    setHasError(false);
    setErrorMessage('');

    if (mode === 'purchase') {
      if (!onSubmitPurchase) return;
      if (requiresRecipient && (!recipientPhone || recipientPhone.trim().length < 5)) {
        setHasError(true);
        setErrorMessage(`Please enter a valid ${getRecipientLabel()}.`);
        toast.error(`Please enter a valid ${getRecipientLabel()}.`);
        setPin('');
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmitPurchase(completedValue, requiresRecipient ? recipientPhone.trim() : undefined, appliedPromoCode || undefined);
        onSuccess();
      } catch (err: any) {
        setHasError(true);
        setErrorMessage(err?.message || 'Transaction failed. Please check your PIN and try again.');
        setPin('');
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'upgrade_pin') {
      setIsSubmitting(true);
      try {
        const res = await api.upgrade(completedValue);
        toast.success(res?.message || 'Upgraded to Premium Reseller successfully!');
        onSuccess(res);
      } catch (err: any) {
        setHasError(true);
        setErrorMessage(err?.message || 'Upgrade failed. Please verify your PIN.');
        setPin('');
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'set_pin') {
      if (step === 1) {
        setTempPin(completedValue);
        setPin('');
        setStep(2);
      } else if (step === 2) {
        if (completedValue !== tempPin) {
          setHasError(true);
          setErrorMessage('PINs do not match. Please try again.');
          toast.error('PINs do not match. Please try again.');
          setPin('');
          return;
        }
        setIsSubmitting(true);
        try {
          const res = await api.setPin(tempPin, completedValue);
          toast.success(res?.message || 'Transaction PIN set successfully!');
          onSuccess(res);
        } catch (err: any) {
          setHasError(true);
          setErrorMessage(err?.message || 'Failed to set PIN.');
          setPin('');
        } finally {
          setIsSubmitting(false);
        }
      }
    } else if (mode === 'change_pin') {
      if (step === 1) {
        setOldPin(completedValue);
        setPin('');
        setStep(2);
      } else if (step === 2) {
        setNewPin(completedValue);
        setPin('');
        setStep(3);
      } else if (step === 3) {
        if (completedValue !== newPin) {
          setHasError(true);
          setErrorMessage('New PINs do not match. Please try again.');
          toast.error('New PINs do not match.');
          setPin('');
          return;
        }
        setConfirmPin(completedValue);
        setIsSubmitting(true);
        try {
          const res = await api.changePin(oldPin, newPin, completedValue);
          toast.success(res?.message || 'Transaction PIN updated successfully!');
          onSuccess(res);
        } catch (err: any) {
          setHasError(true);
          setErrorMessage(err?.message || 'Failed to update PIN.');
          setPin('');
          setStep(1); // Reset to start
        } finally {
          setIsSubmitting(false);
        }
      }
    } else if (mode === 'forgot_pin') {
      if (step === 2) {
        // OTP verification step
        setOtpCode(completedValue);
        setPin('');
        setStep(3);
      } else if (step === 3) {
        setNewPin(completedValue);
        setPin('');
        setStep(4);
      } else if (step === 4) {
        if (completedValue !== newPin) {
          setHasError(true);
          setErrorMessage('New PINs do not match.');
          toast.error('New PINs do not match.');
          setPin('');
          return;
        }
        setIsSubmitting(true);
        try {
          const res = await api.forgotPinVerify(otpCode, newPin, completedValue);
          toast.success(res?.message || 'PIN reset successfully!');
          onSuccess(res);
        } catch (err: any) {
          setHasError(true);
          setErrorMessage(err?.message || 'Failed to reset PIN.');
          setPin('');
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleRequestOtp = async () => {
    setOtpSending(true);
    try {
      const res = await api.forgotPinRequest();
      toast.success(res?.message || 'OTP reset code sent to your registered email/phone.');
      setOtpSent(true);
      setStep(2);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP code.');
    } finally {
      setOtpSending(false);
    }
  };

  const renderIcon = () => {
    const netLower = (summary?.provider || summary?.title || summary?.icon || '').toLowerCase();
    let logoSrc = mtnIcon;
    if (netLower.includes('mtn')) logoSrc = mtnIcon;
    else if (netLower.includes('airtel')) logoSrc = airtelIcon;
    else if (netLower.includes('glo')) logoSrc = gloIcon;
    else if (netLower.includes('9mobile')) logoSrc = nineMobileIcon;
    else if (netLower.includes('dstv')) logoSrc = dstvIcon;
    else if (netLower.includes('gotv')) logoSrc = gotvIcon;
    else if (netLower.includes('startimes')) logoSrc = startimesIcon;
    else if (netLower.includes('waec')) logoSrc = waecIcon;
    else if (netLower.includes('neco')) logoSrc = necoIcon;
    else if (netLower.includes('aedc') || summary?.iconType === 'electricity') logoSrc = aedcIcon;
    else if (summary?.iconType === 'a2c') logoSrc = walletIcon;

    return (
      <img
        src={logoSrc}
        alt={summary?.provider || summary?.title || 'Network'}
        className="w-full h-full object-contain rounded-xl"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto animate-fadeIn font-display">
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={loading}
          className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-all disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-white uppercase tracking-wider">
            {mode === 'purchase'
              ? 'Authorize Purchase'
              : mode === 'set_pin'
              ? 'Set Transaction PIN'
              : mode === 'change_pin'
              ? 'Change Transaction PIN'
              : mode === 'forgot_pin'
              ? 'Reset Transaction PIN'
              : 'Reseller Upgrade'}
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
            Security Verification
          </p>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* ── Purchase Mode Summary Card ── */}
          {mode === 'purchase' && summary && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800/80">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                  {renderIcon()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {summary.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {summary.badge}
                      </span>
                    )}
                    {summary.provider && (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-slate-800 text-slate-300">
                        {summary.provider}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-white truncate mt-1">
                    {summary.title}
                  </h3>
                  {summary.subtitle && (
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {summary.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Amount Display with Dynamic Promo Discount */}
              <div className="text-center py-2 bg-slate-950/60 rounded-2xl border border-slate-800/60">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Total Payable Amount
                </p>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  {promoDiscount > 0 && typeof summary.amount === 'number' && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      ₦{summary.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <p className="text-3xl font-black text-sky-400 tracking-tight">
                    {typeof summary.amount === 'number'
                      ? `₦${Math.max(0, summary.amount - promoDiscount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                      : summary.amount}
                  </p>
                </div>
              </div>

              {/* Promo Code Input / Applied Badge */}
              <div className="mt-3 pt-3 border-t border-slate-800/60">
                {appliedPromoCode ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-emerald-300">
                        PROMO: <span className="font-mono">{appliedPromoCode}</span> (-₦{promoDiscount.toFixed(2)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromoCode('');
                        setPromoDiscount(0);
                        setPromoCodeInput('');
                        toast.info('Promo code removed.');
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="Promo Code (Optional)"
                        disabled={loading || validatingPromo}
                        className="w-full bg-slate-950/90 border border-slate-800 focus:border-sky-500 text-sky-300 font-mono font-bold text-xs pl-8 pr-3 py-2 rounded-xl transition-all outline-none uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={loading || validatingPromo || !promoCodeInput.trim()}
                      className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {validatingPromo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Recipient Input Field - Rendered ONLY for services requiring a target (Airtime, Data, Cable, Electricity, A2C) */}
              {requiresRecipient && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5 text-left">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      {getRecipientLabel()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Tap to edit</span>
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={getRecipientPlaceholder()}
                    maxLength={serviceTypeLower === 'airtime' || serviceTypeLower === 'data' ? 11 : 20}
                    disabled={loading}
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-sky-500 text-sky-300 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl transition-all outline-none focus:ring-1 focus:ring-sky-500/50 shadow-inner"
                  />
                </div>
              )}
              {summary.details?.map((item, idx) => (
                <div key={idx} className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{item.label}:</span>
                  <span className="font-semibold text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Reseller Upgrade Summary Card ── */}
          {mode === 'upgrade_pin' && (
            <div className={`rounded-3xl p-5 border text-center transition-all ${
              theme === 'light'
                ? 'bg-gradient-to-r from-amber-50/90 via-sky-50/70 to-indigo-50/90 border-amber-200/90 shadow-lg shadow-amber-900/5'
                : 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/20 shadow-2xl'
            }`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 border ${
                theme === 'light'
                  ? 'bg-amber-100 border-amber-300/80 text-amber-700'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <KeyRound className={`w-8 h-8 ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`} />
              </div>
              <h2 className={`text-lg font-black font-display ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Upgrade to Reseller Tier</h2>
              <p className={`text-xs font-medium mt-1 max-w-xs mx-auto ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                Enjoy maximum discounts across all airtime, data, and bill services.
              </p>
              <div className={`my-4 py-3 rounded-2xl border ${
                theme === 'light'
                  ? 'bg-white border-amber-300/80 shadow-sm'
                  : 'bg-slate-950/80 border-amber-500/20'
              }`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  theme === 'light' ? 'text-amber-700' : 'text-amber-400/80'
                }`}>
                  One-time Upgrade Fee
                </p>
                <p className={`text-3xl font-black tracking-tight mt-0.5 font-mono ${
                  theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                }`}>₦5,000.00</p>
              </div>
            </div>
          )}

          {/* ── Set PIN Header / Instructions ── */}
          {mode === 'set_pin' && (
            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 mx-auto flex items-center justify-center mb-2">
                <ShieldCheck className="w-8 h-8 text-sky-400" />
              </div>
              <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {step === 1 ? 'Create 4-Digit PIN' : 'Confirm Your 4-Digit PIN'}
              </h2>
              <p className={`text-xs max-w-xs mx-auto ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                {step === 1
                  ? 'Set a secure 4-digit transaction PIN to protect your wallet and authorize purchases.'
                  : 'Re-enter your 4-digit PIN to verify and save.'}
              </p>
            </div>
          )}

          {/* ── Change PIN Header / Instructions ── */}
          {mode === 'change_pin' && (
            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 mx-auto flex items-center justify-center mb-2">
                <Lock className="w-8 h-8 text-sky-400" />
              </div>
              <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {step === 1
                  ? 'Enter Current PIN'
                  : step === 2
                  ? 'Enter New 4-Digit PIN'
                  : 'Confirm New 4-Digit PIN'}
              </h2>
              <p className={`text-xs max-w-xs mx-auto ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                {step === 1
                  ? 'Enter your current 4-digit Transaction PIN.'
                  : step === 2
                  ? 'Enter the new 4-digit PIN you wish to use.'
                  : 'Re-enter your new PIN to confirm change.'}
              </p>
            </div>
          )}

          {/* ── Forgot PIN Request & Verification ── */}
          {mode === 'forgot_pin' && (
            <div className="text-center space-y-3 py-2">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 mx-auto flex items-center justify-center mb-1">
                <Mail className="w-8 h-8 text-sky-400" />
              </div>
              <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Reset Transaction PIN</h2>

              {step === 1 && (
                <div className="space-y-4 pt-2">
                  <p className={`text-xs leading-relaxed max-w-xs mx-auto ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                    We will send a security verification OTP code to your account email{' '}
                    <strong className={`font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{userEmail || 'registered address'}</strong>.
                  </p>
                  <button
                    onClick={handleRequestOtp}
                    disabled={otpSending}
                    className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 btn-sheen uppercase tracking-wider"
                  >
                    {otpSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP Code...
                      </>
                    ) : (
                      'Send Reset OTP Code'
                    )}
                  </button>
                </div>
              )}

              {step === 2 && (
                <p className={`text-xs max-w-xs mx-auto ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  Enter the 6-digit OTP code sent to your email.
                </p>
              )}
              {step === 3 && (
                <p className={`text-xs max-w-xs mx-auto ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  Enter your new 4-digit Transaction PIN.
                </p>
              )}
              {step === 4 && (
                <p className={`text-xs max-w-xs mx-auto ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  Re-enter your new 4-digit PIN to confirm.
                </p>
              )}
            </div>
          )}

          {/* ── Primary PIN Input Section (When not on forgot_pin Step 1) ── */}
          {(mode !== 'forgot_pin' || step > 1) && (
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
                  theme === 'light' ? 'text-slate-700 font-display' : 'text-slate-400 font-display'
                }`}>
                  {mode === 'purchase' || mode === 'upgrade_pin'
                    ? 'Enter 4-Digit Transaction PIN'
                    : mode === 'forgot_pin' && step === 2
                    ? 'Enter 6-Digit OTP Code'
                    : 'Enter 4 Digits'}
                </p>

                {/* Mask Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer mb-3 border ${
                    theme === 'light'
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  {showPin ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-sky-500" /> Hide Digits
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-sky-500" /> Show Digits
                    </>
                  )}
                </button>
              </div>

              {/* PinInput Digit Boxes Component */}
              <PinInput
                length={mode === 'forgot_pin' && step === 2 ? 6 : 4}
                value={pin}
                onChange={setPin}
                onComplete={handleComplete}
                disabled={loading}
                mask={!showPin}
                error={hasError}
                autoFocus={true}
              />

              {/* Error Message Display */}
              {hasError && errorMessage && (
                <div className="flex items-center justify-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="text-center pt-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs font-bold text-sky-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Processing authorization...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Navigation Links ── */}
        {mode === 'change_pin' && step === 1 && (
          <div className="pt-6 pb-2 text-center">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPin('');
                toast.info('Requesting OTP to reset PIN...');
                handleRequestOtp();
              }}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Forgot your Transaction PIN?
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
