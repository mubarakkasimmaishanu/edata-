import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { useToast } from './Toast';

interface EditProfileScreenProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  onBack: () => void;
}

export default function EditProfileScreen({ currentUser, setCurrentUser, onBack }: EditProfileScreenProps) {
  const toast = useToast();
  const [firstname, setFirstname] = useState(currentUser.firstname || currentUser.name?.split(' ')[0] || '');
  const [lastname, setLastname] = useState(currentUser.lastname || currentUser.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(currentUser.phone || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstname.trim() || !lastname.trim()) {
      setErrorMsg('First name and last name are required.');
      toast.warning('First name and last name are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateProfile({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        phone: phone.trim(),
      });
      const fullName = `${firstname.trim()} ${lastname.trim()}`;
      setCurrentUser((prev) => ({
        ...prev,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        name: fullName || prev.name,
        phone: phone.trim(),
      }));
      toast.success(res.message || 'Profile details updated successfully!');
      onBack();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
      toast.error(err.message || 'Failed to update profile.');
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
            Edit Profile
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
            Personal Information
          </p>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Badge */}
          <div className="text-center space-y-2 py-2">
            <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 mx-auto flex items-center justify-center mb-2">
              <User className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-xl font-black text-white">Update Personal Details</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Keep your contact details up-to-date for transaction receipts and notifications.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 shadow-2xl">
            {/* First Name Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="Enter first name"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-sky-500 transition-all"
                required
              />
            </div>

            {/* Last Name Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Enter last name"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-sky-500 transition-all"
                required
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 08142233864"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white font-mono font-medium focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            {/* Read-only Email Field */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Registered Email (Primary Key)
              </label>
              <div className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl px-4 py-3 text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>{currentUser.email}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Locked</span>
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
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
