import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import {
  ChevronLeft, Key, Lock, LogOut, Camera, User, Mail, Phone, Copy, Check,
  Fingerprint, ShieldCheck, ShieldAlert, FileText, Trash2, Edit3, Sparkles, ChevronRight, Sun, Moon
} from 'lucide-react';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { api, resolveImageUrl } from '../services/api';
import PinScreen from './PinScreen';
import PrivacyTerms from './PrivacyTerms';
import ChangePasswordScreen from './ChangePasswordScreen';
import EditProfileScreen from './EditProfileScreen';

interface ProfileSettingsProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  onBack: () => void;
  onLogout: () => void;
}

export default function ProfileSettings({ currentUser, setCurrentUser, onBack, onLogout }: ProfileSettingsProps) {
  const toast = useToast();
  const { theme, toggleTheme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full-screen PIN screen state
  const [pinScreenMode, setPinScreenMode] = useState<'set_pin' | 'change_pin' | 'forgot_pin' | 'upgrade_pin' | null>(null);

  // Full-screen view states for Edit Profile, Change Password, Privacy Policy, Terms
  const [fullScreenView, setFullScreenView] = useState<'edit_profile' | 'change_password' | 'privacy' | 'terms' | null>(null);

  // Biometric toggle state
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Copy states & loading states
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const avatarUrl = resolveImageUrl(currentUser.avatar || currentUser.picture);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const res = await api.uploadAvatar(file);
      const newUrl = res.avatar || res.data?.avatar;
      setCurrentUser(prev => ({ ...prev, avatar: newUrl }));
      toast.success('Profile picture updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const copyEmail = () => {
    if (!currentUser.email) return;
    navigator.clipboard.writeText(currentUser.email);
    setCopiedEmail(true);
    toast.success('Email address copied!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-28">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-base font-black text-white font-display">Profile & Settings</h1>
            <p className="text-[10px] text-sky-400 font-semibold font-mono">Account Management</p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-full text-[10px] font-black uppercase tracking-wider font-display">
          {currentUser.category || 'Basic User'}
        </span>
      </header>

      {/* ── Hidden File Input for Avatar ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <main className="px-4 py-5 space-y-5 flex-1">
        {/* ── USER AVATAR & NAME CARD ── */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-sky-500/30 overflow-hidden shadow-2xl mx-auto flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <button
              onClick={handleAvatarClick}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer border-2 border-slate-800"
              title="Upload profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-black text-white font-display">{currentUser.name || 'eData User'}</h2>
          <p className="text-xs text-slate-400 font-mono font-medium">{currentUser.email}</p>

          <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-display">Wallet Balance</span>
              <span className="text-base font-black text-sky-400 font-mono">
                ₦{(currentUser.walletBalance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700/60" />
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-display">Account Tier</span>
              <span className="text-xs font-black text-amber-400 uppercase font-display">
                {currentUser.category || 'Basic User'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Agent License Upgrade Card Banner ── */}
        {currentUser.category !== 'Premium User' && (
          <div className="wallet-gradient rounded-3xl p-5 border border-sky-400/20 shadow-xl text-white space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-sky-300 uppercase tracking-widest block font-display">AGENT LICENSE UPGRADE</span>
                <h3 className="text-sm font-black text-white font-display mt-0.5">Unlock Permanent Reseller Rates</h3>
                <p className="text-[11px] text-sky-100 font-medium mt-0.5">Upgrade to Premium to get wholesale agent discounts on all VTU airtime & data packages.</p>
              </div>
            </div>

            <button
              onClick={() => setPinScreenMode('upgrade_pin')}
              className="w-full bg-white text-sky-950 font-black text-xs py-3 rounded-2xl shadow-lg transition-spring active:scale-95 cursor-pointer btn-sheen uppercase tracking-wider font-display"
            >
              Upgrade Now for ₦5,000
            </button>
          </div>
        )}

        {/* ── USER INFORMATION Section ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 font-display">USER INFORMATION</span>
            <button
              onClick={() => setFullScreenView('edit_profile')}
              className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4.5 space-y-3.5 shadow-xl shadow-slate-950/20">
            {/* Full Name Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">FULL NAME</span>
                  <span className="text-xs font-black text-white font-display">{currentUser.name || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Email Address Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">EMAIL ADDRESS</span>
                  <span className="text-xs font-semibold text-white truncate block font-mono">{currentUser.email}</span>
                </div>
              </div>
              <button
                onClick={copyEmail}
                className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEmail ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Phone Number Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">PHONE NUMBER</span>
                  <span className="text-xs font-bold text-white font-mono">{currentUser.phone || 'Not provided'}</span>
                </div>
              </div>
              <button
                onClick={() => setFullScreenView('edit_profile')}
                className="bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                {currentUser.phone ? 'Edit' : 'Add Phone'}
              </button>
            </div>
          </div>
        </section>

        {/* ── APPEARANCE & THEME Section ── */}
        <section className="space-y-3">
          <div className="px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 font-display">APPEARANCE & THEME</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4.5 space-y-3 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  {theme === 'dark' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">App Theme Mode</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Toggle system Dark / Light theme</span>
                </div>
              </div>

              {/* Theme Segmented Switcher */}
              <div className="bg-slate-950 p-1 rounded-xl flex items-center gap-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3 h-3" /> Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-500" /> Light
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECURITY & CONTROLS Section ── */}
        <section className="space-y-3">
          <div className="px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 font-display">SECURITY & CONTROLS</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4.5 space-y-3 shadow-xl shadow-slate-950/20">
            {/* Transaction PIN Row */}
            <button
              onClick={() => setPinScreenMode(currentUser.hasPin ? 'change_pin' : 'set_pin')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Key className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Transaction PIN</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Required before purchase checkout</span>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/15 px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1 group-hover:bg-sky-500/25 transition-all">
                {currentUser.hasPin ? 'Change' : 'Set Up'} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Password Settings Row */}
            <button
              onClick={() => setFullScreenView('change_password')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Password Settings</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Update account login password</span>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/15 px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1 group-hover:bg-sky-500/25 transition-all">
                Change <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Biometric Lock Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Biometric Lock</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Enable Touch ID / Face ID login</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={() => {
                    setBiometricEnabled(!biometricEnabled);
                    toast.info(`Biometric lock ${!biometricEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
              </label>
            </div>
          </div>
        </section>

        {/* ── LEGAL & APPLICATION Section ── */}
        <section className="space-y-3">
          <div className="px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 font-display">LEGAL & POLICIES</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4.5 space-y-3 shadow-xl shadow-slate-950/20">
            {/* Privacy Policy */}
            <button
              onClick={() => setFullScreenView('privacy')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Privacy Policy</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Read data encryption & safety guidelines</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
            </button>

            {/* Terms of Service */}
            <button
              onClick={() => setFullScreenView('terms')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Terms of Service</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Read user agreement & wallet policy</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            </button>
          </div>
        </section>

        {/* ── Sign Out Button ── */}
        <section className="pt-2">
          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-slate-750 text-sky-400 font-black text-xs py-4 rounded-2xl border border-sky-500/30 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer font-display uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </section>
      </main>

      {/* ── Full-Screen PIN Authorization Overlay ── */}
      {pinScreenMode && (
        <PinScreen
          mode={pinScreenMode}
          userEmail={currentUser.email}
          onBack={() => setPinScreenMode(null)}
          onSuccess={() => {
            if (pinScreenMode === 'set_pin' || pinScreenMode === 'change_pin' || pinScreenMode === 'forgot_pin') {
              setCurrentUser(prev => ({ ...prev, hasPin: true }));
            } else if (pinScreenMode === 'upgrade_pin') {
              setCurrentUser(prev => ({ ...prev, category: 'Premium User' }));
            }
            setPinScreenMode(null);
          }}
        />
      )}

      {/* ── Full-Screen Password Settings Overlay ── */}
      {fullScreenView === 'change_password' && (
        <ChangePasswordScreen
          userEmail={currentUser.email}
          onBack={() => setFullScreenView(null)}
          onSuccess={() => setFullScreenView(null)}
        />
      )}

      {/* ── Full-Screen Edit Profile Overlay ── */}
      {fullScreenView === 'edit_profile' && (
        <EditProfileScreen
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onBack={() => setFullScreenView(null)}
        />
      )}

      {/* ── Full-Screen Privacy Policy Overlay ── */}
      {fullScreenView === 'privacy' && (
        <PrivacyTerms
          mode="privacy"
          onBack={() => setFullScreenView(null)}
        />
      )}

      {/* ── Full-Screen Terms of Service Overlay ── */}
      {fullScreenView === 'terms' && (
        <PrivacyTerms
          mode="terms"
          onBack={() => setFullScreenView(null)}
        />
      )}
    </div>
  );
}
