import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Trash2, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface DeleteAccountProps {
  onBack: () => void;
  onDeleted: () => void;
}

export default function DeleteAccount({ onBack, onDeleted }: DeleteAccountProps) {
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm account deletion.' });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const res = await api.deleteAccount(password);
      if (res.success) {
        setMessage({ 
          type: 'success', 
          text: res.message || 'Account deletion request submitted. Your account is deactivated and will be permanently removed within 30 days.' 
        });
        setTimeout(() => {
          onDeleted();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: res.error || res.message || 'Failed to process deletion request. Please check your password.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while deleting account. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="max-w-md mx-auto relative px-4 sm:px-6">

        {/* Header */}
        <header className="py-6 flex items-center gap-4 bg-transparent border-b border-slate-800 mb-6">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Delete Account</h1>
              <p className="text-[10px] text-rose-400 font-medium">Permanently Remove Your User Account</p>
            </div>
          </div>
        </header>

        {step === 'warning' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Warning Banner */}
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex gap-3 items-start">
                <AlertTriangle size={22} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-rose-400">This action is permanent and irreversible</h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-1">Please read the consequences carefully before proceeding.</p>
                </div>
              </div>
            </div>

            {/* Consequences List */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">What happens when you delete your account:</h3>

              <div className="space-y-2.5">
                {[
                  'Your wallet balance will be inaccessible. Please utilize or withdraw remaining funds prior to deletion.',
                  'All profile information (name, email, phone number) will be permanently erased.',
                  'Your authentication tokens will be immediately invalidated across all devices.',
                  'You will no longer receive transaction updates or virtual bank transfer credits.',
                  'Account deactivation occurs immediately, followed by complete data purge within 30 days.'
                ].map((text, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => setStep('confirm')}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <span className="uppercase font-extrabold text-xs tracking-wider">I Understand, Continue to Delete</span>
            </button>

            <button
              onClick={onBack}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <span className="uppercase font-extrabold text-xs tracking-wider">Cancel — Keep My Account</span>
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleDelete} className="space-y-4 animate-in fade-in duration-300">
            {message && (
              <div className={`p-4 rounded-xl flex gap-3 items-center border ${
                message.type === 'success' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              } text-xs font-bold`}>
                {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                <p>{message.text}</p>
              </div>
            )}

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Confirm Password Identity</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Enter your current account password to confirm that you wish to permanently deactivate and delete your eData account.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1.5">Account Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isDeleting || !password}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={16} />
                  <span className="uppercase font-extrabold text-xs tracking-wider">Permanently Delete Account</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('warning')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <span className="uppercase font-extrabold text-xs tracking-wider">Go Back</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
