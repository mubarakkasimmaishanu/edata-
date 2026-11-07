import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Wallet, ArrowRight, Loader2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PhysicalPinModalProps {
  isOpen: boolean;
  serviceTitle: string;
  adminFee: number;
  walletBalance: number;
  isSubmitting: boolean;
  errorMessage?: string;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  onFundWallet?: () => void;
}

export default function PhysicalPinModal({
  isOpen,
  serviceTitle,
  adminFee,
  walletBalance,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
  onFundWallet,
}: PhysicalPinModalProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const isInsufficient = walletBalance < adminFee;
  const shortfall = Math.max(0, adminFee - walletBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && !isSubmitting && !isInsufficient) {
      onConfirm(pin);
    }
  };

  const handleKeyClick = (val: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl transition-all duration-300 ${
          isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white border border-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Confirm Administrative Fee</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{serviceTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fee & Wallet Balance Strip */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Wallet className="w-4 h-4 text-primary dark:text-emerald-400" />
            <span>Wallet Balance:</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Insufficient Balance State */}
        {isInsufficient ? (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">Insufficient Wallet Balance</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                  You need ₦{adminFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })} to pay this administrative fee. Your current balance is short by{' '}
                  <span className="font-bold">₦{shortfall.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>.
                </p>
                {onFundWallet && (
                  <button
                    type="button"
                    onClick={onFundWallet}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <span>Fund Wallet Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            {/* Fee summary card */}
            <div className="text-center py-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Non-Refundable Admin Processing Fee
              </span>
              <div className="text-2xl font-black font-display text-primary dark:text-emerald-400 mt-0.5">
                ₦{adminFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Will be debited from your eData wallet upon confirmation
              </p>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="my-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PIN Input Box */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 text-center mb-2">
                Enter 4-Digit Transaction PIN
              </label>

              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                      pin[idx]
                        ? 'border-primary bg-primary/5 text-primary dark:border-emerald-500 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    {pin[idx] ? (showPin ? pin[idx] : '•') : ''}
                  </div>
                ))}
              </div>

              {/* Show/Hide PIN Toggle */}
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                </button>
              </div>
            </div>

            {/* Numeric Keypad for fast mobile entry */}
            <div className="grid grid-cols-3 gap-2 mt-4 px-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                <button
                  key={btn}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (btn === 'C') setPin('');
                    else if (btn === '⌫') handleBackspace();
                    else handleKeyClick(btn);
                  }}
                  className={`py-3 rounded-xl text-base font-bold transition-all active:scale-95 ${
                    btn === 'C' || btn === '⌫'
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-sm'
                      : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-100'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/60'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-5">
              <button
                type="submit"
                disabled={pin.length !== 4 || isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize ₦{adminFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })} Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
