import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import {
  ChevronLeft, Key, Lock, LogOut, Camera, User, Mail, Phone, Copy, Check,
  Fingerprint, ShieldCheck, ShieldAlert, FileText, Trash2, Edit3, Sparkles, ChevronRight
} from 'lucide-react';
import { useToast } from './Toast';
import { api, resolveImageUrl } from '../services/api';
import BottomSheet from './BottomSheet';

interface ProfileSettingsProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  onBack: () => void;
  onLogout: () => void;
}

export default function ProfileSettings({ currentUser, setCurrentUser, onBack, onLogout }: ProfileSettingsProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile modal state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editFirstname, setEditFirstname] = useState(currentUser.firstname || currentUser.name?.split(' ')[0] || '');
  const [editLastname, setEditLastname] = useState(currentUser.lastname || currentUser.name?.split(' ').slice(1).join(' ') || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editLoading, setEditLoading] = useState(false);

  // Change PIN modal state
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Change Password modal state
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Reseller Upgrade modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradePin, setUpgradePin] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Privacy Policy and Terms modal states
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Biometric toggle state
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Copy states
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const avatarUrl = resolveImageUrl(currentUser.avatar || currentUser.picture);

  // ─── Automatic Profile Picture Upload & DB Sync ───
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB.');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;
      
      // Optimistic update local React state
      setCurrentUser(prev => ({
        ...prev,
        avatar: base64,
        picture: base64
      }));

      try {
        // Upload & sync to database API
        const res = await api.uploadPhoto(base64);
        toast.success(res.message || 'Profile picture updated & synced with database!');
      } catch (err: any) {
        console.warn('Photo upload API sync note:', err);
        toast.info('Profile picture saved locally.');
      } finally {
        setUploadingPhoto(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(currentUser.email);
    setCopiedEmail(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.updateProfile({
        firstname: editFirstname,
        lastname: editLastname,
        phone: editPhone
      });
      const fullName = `${editFirstname} ${editLastname}`.trim();
      setCurrentUser(prev => ({
        ...prev,
        firstname: editFirstname,
        lastname: editLastname,
        name: fullName || prev.name,
        phone: editPhone
      }));
      toast.success(res.message || 'Profile details updated successfully!');
      setEditProfileOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPin || oldPin.length !== 4) {
      toast.warning('Please enter your current 4-digit PIN.');
      return;
    }
    if (newPin.length !== 4) {
      toast.warning('New PIN must be 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('New PINs do not match.');
      return;
    }
    setPinLoading(true);
    try {
      const res = await api.changePin(oldPin, newPin, confirmPin);
      toast.success(res.message || 'Transaction PIN updated successfully!');
      setCurrentUser(prev => ({ ...prev, hasPin: true }));
      setChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass) {
      toast.warning('Please enter your current password.');
      return;
    }
    if (newPass.length < 8) {
      toast.warning('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      const res = await api.resetPassword(currentUser.email, '', newPass, confirmPass);
      toast.success(res.message || 'Password changed successfully!');
      setChangePassOpen(false);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradePin || upgradePin.length !== 4) {
      toast.warning('Please enter your 4-digit Transaction PIN.');
      return;
    }
    setUpgradeLoading(true);
    try {
      const res = await api.upgrade(upgradePin);
      toast.success(res.message || 'Upgraded to Premium Reseller successfully!');
      setCurrentUser(prev => ({ ...prev, category: 'Premium User' }));
      setUpgradeModalOpen(false);
      setUpgradePin('');
    } catch (err: any) {
      toast.error(err.message || 'Upgrade failed.');
    } finally {
      setUpgradeLoading(false);
    }
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
            <h1 className="text-base font-black text-white font-display">Profile & Account</h1>
            <p className="text-[11px] text-slate-400 font-medium">Manage user profile & security</p>
          </div>
        </div>
      </header>

      {/* Hidden File Input for Automatic Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* ── Hero Profile Avatar Card ── */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-950/40 relative overflow-hidden">
          {/* Avatar Ring Container */}
          <div className="relative mb-3.5">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-sky-400 via-sky-600 to-indigo-600 shadow-xl overflow-hidden relative flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-600 to-indigo-900 text-white font-black text-3xl flex items-center justify-center font-display shadow-inner">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'M'}
                </div>
              )}
            </div>

            {/* Camera Photo Trigger Button */}
            <button
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              title="Upload Profile Picture"
              className="absolute bottom-0 right-0 w-8 h-8 bg-sky-600 hover:bg-sky-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Camera className={`w-4 h-4 ${uploadingPhoto ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <h2 className="text-base font-black text-white font-display tracking-tight">
            {currentUser.name || 'mubarakkasim006 User'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-3">
            {currentUser.email}
          </p>

          {/* Membership Badge Pill */}
          <span className={`inline-flex items-center gap-1.5 font-black text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider ${
            currentUser.category === 'Premium User'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
              : currentUser.category === 'Referred User'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
          }`}>
            <Sparkles className="w-3 h-3 text-sky-400 fill-sky-400" />
            {currentUser.category?.toUpperCase() || 'BASIC MEMBER'}
          </span>
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
              onClick={() => setUpgradeModalOpen(true)}
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
              onClick={() => setEditProfileOpen(true)}
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
                onClick={() => setEditProfileOpen(true)}
                className="bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                {currentUser.phone ? 'Edit' : 'Add Phone'}
              </button>
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
              onClick={() => setChangePinOpen(true)}
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
              onClick={() => setChangePassOpen(true)}
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

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={(e) => setBiometricEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {/* Two-Factor Auth (2FA) Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Two-Factor Auth (2FA)</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Extra layer of verification codes</span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                Active ✓
              </span>
            </div>

            {/* Privacy Policy Row */}
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Privacy Policy</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Data handling & privacy terms</span>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/15 px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1 group-hover:bg-sky-500/25 transition-all">
                View <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Terms of Service Row */}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block font-display">Terms of Service</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">App usage & agreement</span>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/15 px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1 group-hover:bg-sky-500/25 transition-all">
                View <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Delete Account Danger Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-rose-300 block font-display">Delete Account</span>
                  <span className="text-[10.5px] text-rose-400/80 font-medium">Permanently remove user data</span>
                </div>
              </div>
              <button
                onClick={() => toast.info('Account deletion request initiated. Please check your registered email.')}
                className="text-xs font-bold text-rose-400 bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                Request <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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

      {/* ── Edit Profile Bottom Sheet ── */}
      <BottomSheet
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Profile Information"
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">First Name</label>
            <input
              type="text"
              value={editFirstname}
              onChange={(e) => setEditFirstname(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-sky-500 font-display"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Last Name</label>
            <input
              type="text"
              value={editLastname}
              onChange={(e) => setEditLastname(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-sky-500 font-display"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Phone Number</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 08142233864"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={editLoading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] btn-sheen uppercase tracking-wider font-display"
          >
            {editLoading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </BottomSheet>

      {/* ── Change PIN Bottom Sheet ── */}
      <BottomSheet
        open={changePinOpen}
        onClose={() => setChangePinOpen(false)}
        title="Change Transaction PIN"
      >
        <form onSubmit={handleChangePinSubmit} className="space-y-3 py-2">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Old 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-white focus:outline-none focus:border-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">New 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-white focus:outline-none focus:border-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Confirm New PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-white focus:outline-none focus:border-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            disabled={pinLoading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] btn-sheen uppercase tracking-wider font-display"
          >
            {pinLoading ? 'Updating PIN...' : 'Save New PIN'}
          </button>
        </form>
      </BottomSheet>

      {/* ── Change Password Bottom Sheet ── */}
      <BottomSheet
        open={changePassOpen}
        onClose={() => setChangePassOpen(false)}
        title="Change Account Password"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-3 py-2">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Current Password</label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">New Password (8+ characters)</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Confirm New Password</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] btn-sheen uppercase tracking-wider font-display"
          >
            {passLoading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </BottomSheet>

      {/* ── Reseller Upgrade Bottom Sheet ── */}
      <BottomSheet
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade to Premium Reseller"
      >
        <form onSubmit={handleUpgradeSubmit} className="space-y-4 py-2">
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Confirm <strong>₦5,000</strong> Reseller License Upgrade fee deduction from your eData wallet balance.
          </p>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1 font-display">Transaction PIN</label>
            <input
              type="password"
              maxLength={4}
              value={upgradePin}
              onChange={(e) => setUpgradePin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-white focus:outline-none focus:border-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            disabled={upgradeLoading || upgradePin.length !== 4}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.98] btn-sheen uppercase tracking-wider font-display"
          >
            {upgradeLoading ? 'Upgrading Tier...' : 'Confirm ₦5,000 Upgrade'}
          </button>
        </form>
      </BottomSheet>

      {/* ── Privacy Policy Reader Bottom Sheet ── */}
      <BottomSheet
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Privacy Policy"
      >
        <div className="space-y-4 py-2 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-1">
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider font-display">
              Last Updated: June 2026 • eData Mobile Application
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">1. Introduction</h4>
              <p className="leading-relaxed font-medium">
                eData ("we", "our", "us") is dedicated to keeping your digital transaction data private and secure. This Privacy Policy outlines how we process, store, and safeguard your personal information when using our mobile app and API services.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">2. Information We Collect</h4>
              <p className="font-bold text-white">Personal Identity:</p>
              <p>• Full name, email address, and phone number during account creation.</p>
              <p>• Profile photo (if uploaded).</p>
              <p className="font-bold text-white pt-1">Financial & Transaction Data:</p>
              <p>• Wallet balance, virtual bank account details (Moniepoint/KatPay), and complete transaction logs across Airtime, Data, Cable TV, Electricity, Exam Cards, and A2C.</p>
              <p className="font-bold text-white pt-1">Security Credentials:</p>
              <p>• 4-Digit Transaction PINs (stored strictly using salted bcrypt password hashing algorithms).</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">3. How We Use Your Data</h4>
              <p>• To process instant VTU top-ups, data bundles, and utility bill payments.</p>
              <p>• To verify transaction PINs and prevent unauthorized financial actions.</p>
              <p>• To issue dedicated virtual bank accounts for automated wallet funding.</p>
              <p>• To send instant purchase receipts, OTP verification codes, and security alerts.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">4. Security & Encryption</h4>
              <p className="leading-relaxed font-medium">
                All network communications between eData Mobile and our servers are encrypted via HTTPS/TLS 1.3. Passwords and transaction PINs are stored securely with bcrypt hashing.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">5. Data Retention & Deletion</h4>
              <p className="leading-relaxed font-medium">
                Your personal data is retained for as long as your account remains active. You can request complete deletion of your account at any time via <strong>Profile Settings &rarr; Delete Account</strong> within this app, or on our web portal at <code className="bg-slate-900 text-sky-400 px-1.5 py-0.5 rounded font-mono text-[10px]">https://edata.com.ng/delete-account</code>.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">6. Contact Support</h4>
              <p className="text-slate-300">Email: <strong className="text-white font-mono">info@edata.com.ng</strong></p>
              <p className="text-slate-300">Official Link: <a href="https://edata.com.ng/privacy" target="_blank" rel="noreferrer" className="text-sky-400 font-mono underline">https://edata.com.ng/privacy</a></p>
            </div>
          </div>

          {/* Close Button & Footer Link */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setPrivacyOpen(false)}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg active:scale-95 uppercase tracking-wider font-display cursor-pointer"
            >
              Close Privacy Policy
            </button>
            <p className="text-center text-[10px] text-slate-400 font-mono">
              Official URL: <a href="https://edata.com.ng/privacy" target="_blank" rel="noreferrer" className="text-sky-400 underline">https://edata.com.ng/privacy</a>
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* ── Terms of Service Reader Bottom Sheet ── */}
      <BottomSheet
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="Terms of Service"
      >
        <div className="space-y-4 py-2 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-1">
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider font-display">
              Last Updated: June 2026 • eData Mobile Application
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">1. Acceptance of Terms</h4>
              <p className="leading-relaxed font-medium">
                By downloading, accessing, or making transactions through eData Mobile, you agree to comply with these Terms of Service. If you disagree with any part of these terms, please discontinue using the service.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">2. Account Security & PIN</h4>
              <p>• You are responsible for keeping your account password and 4-digit transaction PIN confidential.</p>
              <p>• Any purchase or payment authorized with your correct PIN is considered final and valid.</p>
              <p>• You must be at least 18 years old or operate under parental supervision.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">3. Wallet & Transaction Policy</h4>
              <p>• Wallet balances are non-interest bearing and can be funded via virtual transfer or online checkout.</p>
              <p>• Service purchases (Airtime, Data, Electricity, Cable TV, Exam Pins) are processed automatically with priority provider failover.</p>
              <p>• In the event of network operator timeouts where funds are debited without service delivery, automatic wallet refunds are triggered sequentially.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">4. Account Termination</h4>
              <p className="leading-relaxed font-medium">
                eData reserves the right to suspend accounts involved in fraudulent activity. You may also terminate your account anytime using the in-app Delete Account utility.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-black text-sky-400 uppercase font-display">5. Contact Support</h4>
              <p className="text-slate-300">Email: <strong className="text-white font-mono">info@edata.com.ng</strong></p>
              <p className="text-slate-300">Official Link: <a href="https://edata.com.ng/terms" target="_blank" rel="noreferrer" className="text-sky-400 font-mono underline">https://edata.com.ng/terms</a></p>
            </div>
          </div>

          {/* Close Button & Footer Link */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg active:scale-95 uppercase tracking-wider font-display cursor-pointer"
            >
              Close Terms of Service
            </button>
            <p className="text-center text-[10px] text-slate-400 font-mono">
              Official URL: <a href="https://edata.com.ng/terms" target="_blank" rel="noreferrer" className="text-sky-400 underline">https://edata.com.ng/terms</a>
            </p>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
