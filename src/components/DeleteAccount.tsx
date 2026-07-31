import React, { useState } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

interface DeleteAccountProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function DeleteAccount({ onBack, onSuccess }: DeleteAccountProps) {
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [password, setPassword] = useState('');
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
        setMessage({ type: 'success', text: res.message || 'Account successfully scheduled for permanent deletion.' });
        setTimeout(() => {
          setAuthToken(null);
          localStorage.removeItem('edata_current_user');
          onSuccess();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: res.error || res.message || 'Failed to delete account. Please verify your password.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while deleting account. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-display pb-12 animate-fadeIn">
      <div className="max-w-md mx-auto relative px-4 sm:px-6">

        {/* Header */}
        <header className="py-6 flex items-center gap-4 border-b border-slate-900 mb-6">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors shadow-xs active:scale-95 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Trash2 size={20} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white font-display">Delete Account</h1>
              <p className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider">Permanently Remove Your User Account</p>
            </div>
          </div>
        </header>

        {step === 'warning' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Warning Banner */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-4.5 shadow-sm">
              <div className="flex gap-3 items-start">
                <AlertTriangle size={22} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-black text-rose-400 font-display">This action is permanent and irreversible</h3>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">Please read the consequences carefully before proceeding.</p>
                </div>
              </div>
            </div>

            {/* Consequences List */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
              <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-wider block font-display">What happens when you delete your account:</h3>

              <div className="space-y-3">
                {[
                  'Your wallet balance will be inaccessible. Please utilize or withdraw remaining funds prior to deletion.',
                  'All profile information (name, email, phone number) will be permanently erased.',
                  'Your authentication tokens will be immediately invalidated across all devices.',
                  'You will no longer receive transaction updates or virtual bank transfer credits.',
                  'Account deactivation occurs immediately, followed by complete data purge within 30 days.'
                ].map((text, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20 active:scale-[0.98] uppercase tracking-wider text-xs"
            >
              I Understand, Continue to Delete
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full bg-slate-900 hover:bg-slate-800 text-sky-400 font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-sky-500/30 transition-all cursor-pointer active:scale-[0.98] uppercase tracking-wider text-xs"
            >
              Cancel — Keep My Account
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleDelete} className="space-y-4 animate-fadeIn">
            {message && (
              <div className={`p-4 rounded-2xl flex gap-3 items-center border ${
                message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              } text-xs font-bold`}>
                {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                <p>{message.text}</p>
              </div>
            )}

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-wider block font-display">Confirm Password Identity</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Enter your current account password to confirm that you wish to permanently deactivate and delete your eData account.
              </p>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-display">Account Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isDeleting}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-wider text-xs"
            >
              {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
            </button>

            <button
              type="button"
              onClick={() => setStep('warning')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer uppercase tracking-wider text-xs"
            >
              Go Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
