import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, RefreshCw, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface ChangePasswordScreenProps {
  userEmail: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordScreen({ userEmail, onBack, onSuccess }: ChangePasswordScreenProps) {
  const toast = useToast();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!oldPass) {
      setErrorMsg('Please enter your current password.');
      toast.warning('Please enter your current password.');
      return;
    }
    if (newPass.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      toast.warning('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('New passwords do not match. Please verify.');
      toast.error('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(userEmail, '', newPass, confirmPass);
      toast.success(res.message || 'Account password updated successfully!');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please check your current password.');
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto animate-fadeIn font-display">
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 flex items-center justify-between safe-top">
        <button
          onClick={onBack}
          disabled={loading}
          className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-all disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-white uppercase tracking-wider">
            Password Settings
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
            Update Login Credentials
          </p>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Badge */}
          <div className="text-center space-y-2 py-2">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center mb-2">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-black text-white">Change Account Password</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Update your account password to maintain security across mobile and web logins.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 shadow-2xl" id="change-password-form" method="post">
            {/* Current Password Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  name="current-password"
                  id="change-old-password"
                  autoComplete="current-password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-sky-500 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                New Password (8+ characters)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  name="new-password"
                  id="change-new-password"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-sky-500 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  name="confirm-password"
                  id="change-confirm-password"
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password to confirm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-sky-500 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] btn-sheen uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Updating Password...
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div className="pt-6 pb-2">
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-900/60 py-2.5 px-4 rounded-2xl border border-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit Encrypted & Salted Bcrypt Hashing</span>
          </div>
        </div>
      </main>
    </div>
  );
}
