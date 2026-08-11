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
import { isValidRecipient } from '../utils/phoneValidation';

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
  const isRecipientValid = !requiresRecipient || isValidRecipient(serviceTypeLower, recipientPhone);

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
      if (requiresRecipient && !isRecipientValid) {
        setHasError(true);
        const errorMsg = (serviceTypeLower === 'airtime' || serviceTypeLower === 'data' || serviceTypeLower === 'a2c')
          ? 'Incomplete or invalid phone number (11 digits required).'
          : `Please enter a valid ${getRecipientLabel()}.`;
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
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

  const requiredLength = mode === 'forgot_pin' && step === 2 ? 6 : 4;
  const isPinComplete = pin.length === requiredLength;

  const getSubmitButtonText = () => {
    if (mode === 'purchase') {
      const origAmount = typeof summary?.amount === 'number' ? summary.amount : parseFloat(String(summary?.amount || 0));
      const finalAmount = Math.max(0, origAmount - promoDiscount);
      if (finalAmount > 0) {
        return `Confirm & Pay ₦${finalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
      }
      return 'Confirm & Pay';
    }
    if (mode === 'upgrade_pin') {
      return 'Confirm Upgrade (₦5,000.00)';
    }
    if (mode === 'set_pin') {
      return step === 1 ? 'Continue' : 'Confirm & Save PIN';
    }
    if (mode === 'change_pin') {
      return step === 1 ? 'Next' : step === 2 ? 'Continue' : 'Confirm & Update PIN';
    }
    if (mode === 'forgot_pin') {
      if (step === 2) return 'Verify OTP Code';
      if (step === 3) return 'Continue';
      return 'Confirm & Reset PIN';
    }
    return 'Confirm';
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
    <div className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col animate-fadeIn font-display ${mode === 'purchase' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {/* ── Top Header Navigation ── */}
      <header className={`sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 flex items-center justify-between safe-top ${mode === 'purchase' ? 'py-2' : 'py-3.5'}`}>
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
      <main className={`flex-1 min-h-0 max-w-md mx-auto w-full flex flex-col ${mode === 'purchase' ? 'px-4 py-2.5 gap-2.5 justify-start pb-[calc(env(safe-area-inset-bottom)+0.5rem)]' : 'px-5 py-6 justify-between'}`}>
        <div className={mode === 'purchase' ? 'space-y-2.5' : 'space-y-6'}>
          {/* ── Purchase Mode Summary Card (Compact — fits full phone height, no scroll) ── */}
          {mode === 'purchase' && summary && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header row: icon + natural-language summary sentence + inline amount */}
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                  {renderIcon()}
                </div>
                <div className="min-w-0 flex-1">
                  {/*
                    Natural-language purchase summary — reads as one sentence to
                    the user, e.g. "Purchase MTN 1GB (3-7 days) for 09068500544?".
                    Static prefix/suffix are muted so the meaningful parts
                    (provider + plan + recipient) pop.
                  */}
                  <p className="text-[13px] font-bold text-slate-300 leading-snug break-words">
                    <span className="text-slate-400 font-medium">Purchase </span>
                    <span className="text-white font-black">
                      {(() => {
                        const provider = (summary.provider || '').trim();
                        const title = (summary.title || '').trim();
                        return provider && !title.toLowerCase().startsWith(provider.toLowerCase())
                          ? `${provider} ${title}`
                          : title;
                      })()}
                    </span>
                    {requiresRecipient && recipientPhone.trim() && (
                      <>
                        <span className="text-slate-400 font-medium"> for </span>
                        <span className="text-sky-300 font-black font-mono">
                          {recipientPhone.trim()}
                        </span>
                      </>
                    )}
                    <span className="text-slate-400 font-medium">?</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Total</p>
                  {promoDiscount > 0 && typeof summary.amount === 'number' && (
                    <span className="block text-[10px] font-bold text-slate-500 line-through leading-tight">
                      ₦{summary.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <p className="text-lg font-black text-sky-400 tracking-tight leading-tight">
                    {typeof summary.amount === 'number'
                      ? `₦${Math.max(0, summary.amount - promoDiscount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                      : summary.amount}
                  </p>
                </div>
              </div>

              {/* Promo Code Row (compact) */}
              <div className="mt-2 pt-2 border-t border-slate-800/60">
                {appliedPromoCode ? (
                  <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-bold text-emerald-300 truncate">
                        {appliedPromoCode} <span className="text-emerald-400/80">(-₦{promoDiscount.toFixed(2)})</span>
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
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <Tag className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="Promo code (optional)"
                        disabled={loading || validatingPromo}
                        className="w-full bg-slate-950/90 border border-slate-800 focus:border-sky-500 text-sky-300 font-mono font-bold text-[11px] pl-7 pr-2 py-1.5 rounded-lg transition-all outline-none uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={loading || validatingPromo || !promoCodeInput.trim()}
                      className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold text-[11px] rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      {validatingPromo ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Recipient Row (compact) — Rendered ONLY for services requiring a target */}
              {requiresRecipient && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 text-left">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-sky-400" />
                      {getRecipientLabel()}
                    </span>
                    <span className="text-[9px] text-slate-500 font-normal">Tap to edit</span>
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => {
                      let clean = e.target.value.replace(/[^0-9]/g, '');
                      if (serviceTypeLower === 'airtime' || serviceTypeLower === 'data' || serviceTypeLower === 'a2c') {
                        if (clean.startsWith('234') && clean.length >= 13) {
                          clean = '0' + clean.slice(3);
                        }
                        if (clean.length > 11) {
                          clean = clean.slice(0, 11);
                        }
                      }
                      setRecipientPhone(clean);
                    }}
                    placeholder={getRecipientPlaceholder()}
                    maxLength={serviceTypeLower === 'airtime' || serviceTypeLower === 'data' || serviceTypeLower === 'a2c' ? 11 : 20}
                    disabled={loading}
                    className={`w-full bg-slate-950/90 border font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg transition-all outline-none focus:ring-1 focus:ring-sky-500/50 shadow-inner ${
                      requiresRecipient && !isRecipientValid
                        ? 'border-rose-500/80 text-rose-300 focus:border-rose-500'
                        : 'border-slate-800 focus:border-sky-500 text-sky-300'
                    }`}
                  />
                </div>
              )}
              {summary.details && summary.details.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-0.5">
                  {summary.details.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">{item.label}:</span>
                      <span className="font-semibold text-slate-200 truncate ml-2">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
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
            <div className={mode === 'purchase' ? 'space-y-2' : 'space-y-4 pt-2'}>
              {mode === 'purchase' ? (
                /* Compact single-row: label + Show/Hide toggle side-by-side */
                <div className="flex items-center justify-between px-1">
                  <p className={`text-[11px] font-black uppercase tracking-wider font-display ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Enter 4-Digit PIN
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                      theme === 'light'
                        ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {showPin ? (
                      <>
                        <EyeOff className="w-3 h-3 text-sky-500" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-sky-500" /> Show
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
                    theme === 'light' ? 'text-slate-700 font-display' : 'text-slate-400 font-display'
                  }`}>
                    {mode === 'upgrade_pin'
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
              )}

              {/* Recipient Validation Warning Banner */}
              {mode === 'purchase' && requiresRecipient && !isRecipientValid && (
                <div className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-400 font-semibold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Incomplete {getRecipientLabel().toLowerCase()} (11 digits required).</span>
                </div>
              )}

              {/* PinInput Digit Boxes Component */}
              <PinInput
                length={requiredLength}
                value={pin}
                onChange={setPin}
                onComplete={handleComplete}
                disabled={loading || (mode === 'purchase' && requiresRecipient && !isRecipientValid)}
                mask={!showPin}
                error={hasError || (mode === 'purchase' && requiresRecipient && !isRecipientValid)}
                autoFocus={true}
              />

              {/* Error Message Display */}
              {hasError && errorMessage && (
                <div className={`flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold animate-shake ${
                  mode === 'purchase' ? 'px-2.5 py-1.5 rounded-xl text-[11px]' : 'p-3 rounded-2xl text-xs'
                }`}>
                  <AlertCircle className={`shrink-0 ${mode === 'purchase' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Action / Confirm Button */}
              <div className={mode === 'purchase' ? 'pt-1' : 'pt-3'}>
                <button
                  type="button"
                  onClick={() => handleComplete(pin)}
                  disabled={!isPinComplete || (mode === 'purchase' && requiresRecipient && !isRecipientValid) || loading}
                  className={`w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] cursor-pointer btn-sheen uppercase tracking-wider ${
                    mode === 'purchase' ? 'py-2.5 rounded-xl text-[13px]' : 'py-4 rounded-2xl text-sm'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-sky-200" />
                      <span>{getSubmitButtonText()}</span>
                    </>
                  )}
                </button>
              </div>
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
