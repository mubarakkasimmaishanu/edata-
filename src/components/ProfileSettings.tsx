import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import {
  ChevronLeft, Key, KeyRound, Lock, LogOut, Camera, User, Mail, Phone, Copy, Check,
  Fingerprint, ShieldCheck, ShieldAlert, FileText, Trash2, Edit3, Sparkles, ChevronRight, Sun, Moon,
  Eye, EyeOff, Shield, Landmark, CreditCard, Building2
} from 'lucide-react';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { api, resolveImageUrl } from '../services/api';
import successIcon from '@/assets/icons/success.png';
import userIcon from '@/assets/icons/user.png';
import PinScreen from './PinScreen';
import PrivacyTerms from './PrivacyTerms';
import ChangePasswordScreen from './ChangePasswordScreen';
import EditProfileScreen from './EditProfileScreen';
import ResellerUpgrade from './ResellerUpgrade';
import DeleteAccount from './DeleteAccount';
import PinInput from './PinInput';
import { useBackHandler } from '../utils/backHandler';
import {
  checkBiometrics,
  isBiometricsEnabled,
  enableBiometrics,
  disableBiometrics,
  BiometricStatus,
} from '../services/biometric';

interface ProfileSettingsProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  onBack: () => void;
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function ProfileSettings({ currentUser, setCurrentUser, onBack, onLogout, onNavigate }: ProfileSettingsProps) {
  const toast = useToast();
  const { theme, toggleTheme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full-screen PIN screen state
  const [pinScreenMode, setPinScreenMode] = useState<'set_pin' | 'change_pin' | 'forgot_pin' | 'upgrade_pin' | null>(null);

  // Full-screen view states for Edit Profile, Change Password, Privacy Policy, Terms, Reseller Upgrade, Delete Account
  const [fullScreenView, setFullScreenView] = useState<'edit_profile' | 'change_password' | 'privacy' | 'terms' | 'reseller_upgrade' | 'delete_account' | null>(null);

  // Biometric toggle state & status
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [bioStatus, setBioStatus] = useState<BiometricStatus | null>(null);
  const [showPinPromptForBio, setShowPinPromptForBio] = useState(false);
  const [bioPinInput, setBioPinInput] = useState('');
  const [enrollingBio, setEnrollingBio] = useState(false);

  // Register Android back handlers for overlays and sub-screens
  useBackHandler(Boolean(pinScreenMode), () => setPinScreenMode(null));
  useBackHandler(Boolean(fullScreenView), () => setFullScreenView(null));
  useBackHandler(showPinPromptForBio, () => setShowPinPromptForBio(false));

  // Load biometric hardware status and refresh masked KYC status on mount
  React.useEffect(() => {
    checkBiometrics().then(status => {
      setBioStatus(status);
      setBiometricEnabled(status.isEnabled);
    });
    api.getProfile(true)
      .then((res) => {
        const d = res?.data?.user || res?.data || res;
        if (d && (d.bvn_masked !== undefined || d.nin_masked !== undefined || d.has_kyc !== undefined)) {
          setCurrentUser((prev) => {
            const next: UserProfile = {
              ...prev,
              bvn: d.bvn_masked || d.bvn || prev.bvn || '',
              nin: d.nin_masked || d.nin || prev.nin || '',
              bvn_masked: d.bvn_masked || d.bvn || prev.bvn_masked || '',
              nin_masked: d.nin_masked || d.nin || prev.nin_masked || '',
              bvnMasked: d.bvn_masked || d.bvn || prev.bvnMasked || '',
              ninMasked: d.nin_masked || d.nin || prev.ninMasked || '',
              hasKyc: Boolean(d.has_kyc ?? prev.hasKyc ?? (d.bvn_masked || d.nin_masked)),
              has_kyc: Boolean(d.has_kyc ?? prev.has_kyc ?? (d.bvn_masked || d.nin_masked)),
              hasPin: d.has_pin !== undefined ? Boolean(d.has_pin) : prev.hasPin,
            };
            try {
              localStorage.setItem('edata_current_user', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleBiometrics = async () => {
    if (biometricEnabled) {
      // Disable biometrics
      disableBiometrics();
      setBiometricEnabled(false);
      setBioStatus(prev => prev ? ({ ...prev, isEnabled: false }) : null);
      toast.info('Biometric payment authorization disabled.');
      return;
    }

    // User wants to enable biometrics
    const status = await checkBiometrics();
    setBioStatus(status);

    if (!status.isAvailable || !status.isEnrolled) {
      toast.warning('No biometrics enrolled on this device. Please set up a Fingerprint in your phone settings.');
      return;
    }

    if (!currentUser.hasPin) {
      toast.warning('Please set up a Transaction PIN before enabling biometrics.');
      setPinScreenMode('set_pin');
      return;
    }

    // Open PIN prompt modal to securely link PIN with biometric hardware
    setBioPinInput('');
    setShowPinPromptForBio(true);
  };

  const handleConfirmBioPin = async (enteredPin: string) => {
    if (enteredPin.length !== 4) {
      toast.warning('Please enter your 4-digit PIN.');
      return;
    }
    setEnrollingBio(true);
    try {
      // 1. Strictly verify that the entered PIN is correct on the server first
      const verifyRes = await api.validatePin(enteredPin);
      if (verifyRes && verifyRes.success === false) {
        toast.error(verifyRes.error || 'Incorrect Transaction PIN. Please enter your real 4-digit PIN.');
        setBioPinInput('');
        return;
      }

      // 2. Only after server verification succeeds, link with fingerprint sensor
      await enableBiometrics(enteredPin);
      setBiometricEnabled(true);
      setBioStatus(prev => prev ? ({ ...prev, isEnabled: true }) : null);
      setShowPinPromptForBio(false);
      toast.success(`${bioStatus?.typeName || 'Fingerprint'} authorization activated! 🚀`);
    } catch (err: any) {
      toast.error(err?.message || 'Incorrect PIN or biometric authorization cancelled.');
    } finally {
      setEnrollingBio(false);
    }
  };

  // Copy states, KYC PIN reveal states & loading states
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedNin, setCopiedNin] = useState(false);
  const [copiedBvn, setCopiedBvn] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const handleSaveBank = async () => {
    if (!editBankName.trim() || !editAccountNumber.trim() || !editAccountName.trim()) {
      toast.warning('Please enter bank name, 10-digit account number, and account name.');
      return;
    }
    const cleanNum = editAccountNumber.replace(/\D/g, '');
    if (cleanNum.length !== 10) {
      toast.warning('Account number must be exactly 10 digits (NUBAN).');
      return;
    }
    const isEditing = Boolean(currentUser.has_bank_account || currentUser.account_number_masked);
    if (isEditing && editPin.length !== 4) {
      toast.warning('Please enter your 4-digit Transaction PIN to change your bank account.');
      return;
    }
    setSavingBank(true);
    try {
      const res = await api.savePayoutAccount({
        bank_name: editBankName.trim(),
        account_number: cleanNum,
        account_name: editAccountName.trim(),
        transaction_pin: editPin || undefined,
      });
      if (res && res.success) {
        toast.success('Payout bank account saved successfully!');
        const updatedUser: UserProfile = {
          ...currentUser,
          bank_name: res.data?.bank_name || editBankName.trim(),
          account_number_masked: res.data?.account_number_masked || `******${cleanNum.slice(-4)}`,
          account_name: res.data?.account_name || editAccountName.trim(),
          has_bank_account: true,
        };
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('edata_current_user', JSON.stringify(updatedUser));
        } catch {}
        setShowEditBankModal(false);
        setEditPin('');
        setEditAccountNumber('');
      } else {
        toast.error(res?.error || 'Failed to save bank account details.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save bank account.');
    } finally {
      setSavingBank(false);
    }
  };


  const [ninVisible, setNinVisible] = useState(false);
  const [bvnVisible, setBvnVisible] = useState(false);
  const [revealedNin, setRevealedNin] = useState<string | null>(null);
  const [revealedBvn, setRevealedBvn] = useState<string | null>(null);
  const [bankVisible, setBankVisible] = useState(false);
  const [revealedBankName, setRevealedBankName] = useState<string | null>(null);
  const [revealedAccountNumber, setRevealedAccountNumber] = useState<string | null>(null);
  const [revealedAccountName, setRevealedAccountName] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editBankName, setEditBankName] = useState(currentUser.bank_name || '');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountName, setEditAccountName] = useState(currentUser.account_name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
  const [editPin, setEditPin] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const [kycPinTarget, setKycPinTarget] = useState<'nin' | 'bvn' | 'bank' | null>(null);
  const [kycPinInput, setKycPinInput] = useState('');
  const [verifyingKycPin, setVerifyingKycPin] = useState(false);

  // Hook back button to dismiss KYC PIN prompt if open
  useBackHandler(Boolean(kycPinTarget), () => {
    setKycPinTarget(null);
    setKycPinInput('');
  });

  useBackHandler(showEditBankModal, () => {
    setShowEditBankModal(false);
  });

  const maskedNinDisplay =
    currentUser.nin_masked ||
    currentUser.ninMasked ||
    (currentUser.nin && currentUser.nin.includes('*')
      ? currentUser.nin
      : currentUser.nin && currentUser.nin.length >= 4
      ? `*******${currentUser.nin.slice(-4)}`
      : '•••••••••••');

  const maskedBvnDisplay =
    currentUser.bvn_masked ||
    currentUser.bvnMasked ||
    (currentUser.bvn && currentUser.bvn.includes('*')
      ? currentUser.bvn
      : currentUser.bvn && currentUser.bvn.length >= 4
      ? `*******${currentUser.bvn.slice(-4)}`
      : '•••••••••••');

  const handleRequestRevealKyc = (field: 'nin' | 'bvn' | 'bank') => {
    if (!currentUser.hasPin) {
      toast.warning('Please set up a Transaction PIN to view your KYC details.');
      setPinScreenMode('set_pin');
      return;
    }
    setKycPinInput('');
    setKycPinTarget(field);
  };

  const handleVerifyKycPin = async (enteredPin: string) => {
    if (enteredPin.length !== 4) {
      toast.warning('Please enter your 4-digit Transaction PIN.');
      return;
    }
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    setVerifyingKycPin(true);
    try {
      const res = await api.revealKyc(enteredPin);
      if (res && res.success) {
        const rawNin = res.data?.nin || '';
        const rawBvn = res.data?.bvn || '';
        const rawBankName = res.data?.bank_name || '';
        const rawAccNum = res.data?.account_number || '';
        const rawAccName = res.data?.account_name || '';
        setRevealedNin(rawNin);
        setRevealedBvn(rawBvn);
        if (rawBankName) setRevealedBankName(rawBankName);
        if (rawAccNum) setRevealedAccountNumber(rawAccNum);
        if (rawAccName) setRevealedAccountName(rawAccName);

        const targetField = kycPinTarget;
        if (targetField === 'nin') {
          setNinVisible(true);
        } else if (targetField === 'bvn') {
          setBvnVisible(true);
        } else if (targetField === 'bank') {
          setBankVisible(true);
        }
        setKycPinTarget(null);
        setKycPinInput('');
        const label = targetField === 'bank' ? 'Bank Account' : (targetField || 'KYC').toUpperCase();
        toast.success(`${label} verified and unlocked!`);
      } else {
        toast.error(res?.error || 'Incorrect Transaction PIN. Access denied.');
        setKycPinInput('');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Incorrect Transaction PIN. Access denied.');
      setKycPinInput('');
    } finally {
      setVerifyingKycPin(false);
    }
  };

  const copyKycValue = (val: string, field: 'nin' | 'bvn' | 'bank') => {
    if (!val) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(val).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = val;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {}
    if (field === 'nin') {
      setCopiedNin(true);
      setTimeout(() => setCopiedNin(false), 2500);
      toast.success('NIN copied!');
    } else if (field === 'bvn') {
      setCopiedBvn(true);
      setTimeout(() => setCopiedBvn(false), 2500);
      toast.success('BVN copied!');
    } else if (field === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
      toast.success('Bank account number copied!');
    }
  };

  const avatarUrl = resolveImageUrl(currentUser.photo || currentUser.avatar || currentUser.picture);

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
      // API returns { data: { photo: 'url', photo_path: '/path' } }
      const newUrl = res.data?.photo || res.data?.avatar || res.photo || res.avatar || null;
      if (newUrl) {
        const resolved = resolveImageUrl(newUrl);
        setCurrentUser(prev => ({ ...prev, photo: resolved, avatar: resolved, picture: resolved }));
        toast.success('Profile picture updated!');
      } else {
        toast.error('Upload succeeded but no image URL returned.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image.');
    } finally {
      setUploadingPhoto(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-36">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md safe-top">
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

      <main className="px-4 py-5 space-y-5 flex-1 pb-10">
        {/* ── USER AVATAR & NAME CARD ── */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-sky-500/30 overflow-hidden shadow-2xl mx-auto flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <img src={userIcon} alt={currentUser.name} className="w-14 h-14 object-contain opacity-80" />
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

          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-2.5 text-left">
            {/* Main Wallet */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/40 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase font-display">Main Wallet</span>
              <span className="text-base font-bold text-white font-mono mt-1 tracking-tight">
                ₦{(currentUser.mainWallet ?? currentUser.walletBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Commission */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/40 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase font-display">Commission</span>
              <span className="text-base font-bold text-slate-200 font-mono mt-1 tracking-tight">
                ₦{(currentUser.commissionWallet ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Bonus Wallet */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/40 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase font-display">Bonus Wallet</span>
              <span className="text-base font-bold text-slate-200 font-mono mt-1 tracking-tight">
                ₦{(currentUser.bonusWallet ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Account Tier */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/40 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase font-display">Account Tier</span>
              <div className="mt-1">
                <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold font-display tracking-wide truncate max-w-full">
                  {currentUser.category || 'Basic User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Agent License Upgrade Card Banner ── */}
        {currentUser.category !== 'Premium User' && (
          <div className="hero-wallet-card bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-5 border border-sky-400/30 shadow-xl text-white space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-sky-300 uppercase tracking-widest block font-display">AGENT LICENSE UPGRADE</span>
                <h3 className="text-sm font-black text-white font-display mt-0.5">Unlock Permanent Reseller Rates</h3>
                <p className="text-[11px] text-sky-100 font-medium mt-0.5">Upgrade to Premium to get wholesale agent discounts on all VTU airtime & data packages.</p>
              </div>
            </div>

            <button
              onClick={() => setFullScreenView('reseller_upgrade')}
              className="w-full bg-white text-sky-950 font-black text-xs py-3 rounded-2xl shadow-lg transition-spring active:scale-95 cursor-pointer btn-sheen uppercase tracking-wider font-display"
            >
              Upgrade Now for ₦5,000
            </button>
          </div>
        )}

        {/* ── REFERRAL PROGRAM QUICK ACCESS BUTTON (OPay / PalmPay Style) ── */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('referral')}
            className="w-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/40 rounded-3xl p-4 shadow-xl transition-all active:scale-[0.99] flex items-center justify-between gap-3 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 p-2 group-hover:scale-105 transition-transform">
                <img src={successIcon} alt="Referral Rewards" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white font-display">Referral Program</h3>
                  <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Earn Cash
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  Invite friends & earn up to ₦2,500 bonus + instant commissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-sky-400 text-xs font-bold font-display group-hover:translate-x-0.5 transition-transform">
              <span className="hidden sm:inline">Invite</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400" />
            </div>
          </button>
        )}

        {/* ── PERSONAL INFORMATION Section ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 font-display">PERSONAL INFORMATION</span>
            <button
              onClick={() => setFullScreenView('edit_profile')}
              className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4.5 space-y-3 shadow-xl shadow-slate-950/20">
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

            {/* NIN Row */}
            <div
              onClick={() => !ninVisible && handleRequestRevealKyc('nin')}
              className={`flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 ${!ninVisible ? 'cursor-pointer hover:border-sky-500/40 transition-all' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">NIN</span>
                  <div className="flex items-center gap-1.5">
                    {!ninVisible && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                    <span className="text-xs font-bold text-white font-mono">
                      {ninVisible ? (revealedNin || 'Not provided') : maskedNinDisplay}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                {ninVisible && revealedNin && (
                  <button
                    type="button"
                    onClick={() => copyKycValue(revealedNin, 'nin')}
                    className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedNin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedNin ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => ninVisible ? setNinVisible(false) : handleRequestRevealKyc('nin')}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {ninVisible ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                  ) : (
                    <><Lock className="w-3.5 h-3.5" /> View</>
                  )}
                </button>
              </div>
            </div>

            {/* BVN Row */}
            <div
              onClick={() => !bvnVisible && handleRequestRevealKyc('bvn')}
              className={`flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 ${!bvnVisible ? 'cursor-pointer hover:border-sky-500/40 transition-all' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">BVN</span>
                  <div className="flex items-center gap-1.5">
                    {!bvnVisible && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                    <span className="text-xs font-bold text-white font-mono">
                      {bvnVisible ? (revealedBvn || 'Not provided') : maskedBvnDisplay}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                {bvnVisible && revealedBvn && (
                  <button
                    type="button"
                    onClick={() => copyKycValue(revealedBvn, 'bvn')}
                    className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBvn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedBvn ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => bvnVisible ? setBvnVisible(false) : handleRequestRevealKyc('bvn')}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {bvnVisible ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                  ) : (
                    <><Lock className="w-3.5 h-3.5" /> View</>
                  )}
                </button>
              </div>
            </div>

            {/* Bank Account Section: Separated Payout Bank, Account Number & Account Name Rows */}
            {currentUser.has_bank_account || currentUser.account_number_masked ? (
              <>
                {/* 1. Bank Name Row */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <Landmark className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">
                        PAYOUT BANK
                      </span>
                      <span className="text-xs font-black text-white font-display truncate block">
                        {revealedBankName || currentUser.bank_name || 'Not provided'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditBankModal(true)}
                    className="bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 2. Account Number Row */}
                <div
                  onClick={() => !bankVisible && handleRequestRevealKyc('bank')}
                  className={`flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 ${
                    !bankVisible ? 'cursor-pointer hover:border-sky-500/40 transition-all' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">
                        ACCOUNT NUMBER
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!bankVisible && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                        <span className="text-xs font-bold text-white font-mono tracking-wider">
                          {bankVisible ? (revealedAccountNumber || currentUser.account_number_masked) : (currentUser.account_number_masked || '••••••••••')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    {bankVisible && revealedAccountNumber && (
                      <button
                        type="button"
                        onClick={() => copyKycValue(revealedAccountNumber, 'bank')}
                        className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedBank ? 'Copied' : 'Copy'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => bankVisible ? setBankVisible(false) : handleRequestRevealKyc('bank')}
                      className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {bankVisible ? (
                        <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                      ) : (
                        <><Lock className="w-3.5 h-3.5" /> View</>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Account Name Row */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">
                        ACCOUNT NAME
                      </span>
                      <span className="text-xs font-bold text-white font-display truncate block uppercase">
                        {revealedAccountName || currentUser.account_name || currentUser.name || 'Not provided'}
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1 shrink-0 font-display">
                    <Check className="w-3 h-3 text-emerald-400" /> Verified
                  </span>
                </div>
              </>
            ) : (
              /* When not linked yet */
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                    <Landmark className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-display">
                      PAYOUT BANK ACCOUNT
                    </span>
                    <span className="text-xs font-bold text-amber-400 font-display">
                      Not Linked Yet
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                >
                  + Link Bank
                </button>
              </div>
            )}

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

            {/*
              Forgot Transaction PIN row — only shown when a PIN actually
              exists (users without a PIN see "Set Up" on the row above
              instead). Opens the same full-screen PinScreen overlay in
              `forgot_pin` mode; that component already implements the
              full 4-step flow: send OTP to registered email -> verify
              6-digit OTP -> enter new PIN -> confirm new PIN -> success.
              Backend endpoint: POST /forgot-pin (Bearer-auth, uses the
              user's own email — nothing to enter on the mobile side).
            */}
            {currentUser.hasPin && (
              <button
                onClick={() => setPinScreenMode('forgot_pin')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/50 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block font-display">Forgot Transaction PIN?</span>
                    <span className="text-[10.5px] text-slate-400 font-medium">Reset via secure link sent to your email</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-300 bg-rose-500/15 px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1 group-hover:bg-rose-500/25 transition-all">
                  Reset <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            )}

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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white block font-display">Biometric Payment Lock</span>
                    {biometricEnabled && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    Authorize checkouts with {bioStatus?.typeName || 'Fingerprint'}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={handleToggleBiometrics}
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

            {/* Delete Account */}
            <button
              onClick={() => setFullScreenView('delete_account')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-rose-300 block font-display">Delete Account</span>
                  <span className="text-[10.5px] text-rose-400/80 font-medium">Permanently remove user account & data</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
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

      {/* ── Full-Screen Reseller Upgrade Overlay ── */}
      {fullScreenView === 'reseller_upgrade' && (
        <ResellerUpgrade
          currentUser={currentUser}
          onBack={() => setFullScreenView(null)}
          onSuccess={() => {
            setCurrentUser(prev => ({ ...prev, category: 'Premium User', hasPendingUpgrade: false }));
            setFullScreenView(null);
          }}
          onNavigate={(v) => {
            setFullScreenView(null);
            if (onNavigate) onNavigate(v);
          }}
        />
      )}

      {/* ── Full-Screen Delete Account Overlay ── */}
      {fullScreenView === 'delete_account' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
          <DeleteAccount
            onBack={() => setFullScreenView(null)}
            onSuccess={() => {
              setFullScreenView(null);
              onLogout();
            }}
          />
        </div>
      )}

      {/* ── Biometric PIN Verification Modal ── */}
      {showPinPromptForBio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl animate-scale-up text-center ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10' : 'bg-slate-900 border-slate-800 text-white shadow-slate-950/50'
          }`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3.5 border ${
              theme === 'light'
                ? 'bg-sky-50 border-sky-200 text-sky-600 shadow-md shadow-sky-500/10'
                : 'bg-sky-500/15 border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/20'
            }`}>
              <Fingerprint className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-base font-black font-display mb-1">Link {bioStatus?.typeName || 'Fingerprint'}</h3>
            <p className={`text-xs mb-5 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Enter your 4-digit Transaction PIN, then scan your fingerprint to verify ownership.
            </p>

            <div className="mb-6 flex justify-center">
              <PinInput
                length={4}
                value={bioPinInput}
                onChange={setBioPinInput}
                onComplete={handleConfirmBioPin}
                disabled={enrollingBio}
                mask={true}
                autoFocus={true}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmBioPin(bioPinInput)}
                disabled={bioPinInput.length !== 4 || enrollingBio}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
              >
                {enrollingBio ? (
                  <span>Verifying Fingerprint...</span>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-sky-200" />
                    <span>Scan & Activate</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPinPromptForBio(false)}
                disabled={enrollingBio}
                className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                  theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KYC Transaction PIN Verification Modal ── */}
      {kycPinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl animate-scale-up text-center ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10' : 'bg-slate-900 border-slate-800 text-white shadow-slate-950/50'
          }`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3.5 border ${
              theme === 'light'
                ? 'bg-sky-50 border-sky-200 text-sky-600 shadow-md shadow-sky-500/10'
                : 'bg-sky-500/15 border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/20'
            }`}>
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black font-display mb-1">
              Verify Transaction PIN
            </h3>
            <p className={`text-xs mb-5 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Enter your 4-digit Transaction PIN to securely view your {kycPinTarget === 'bank' ? 'Payout Bank Account' : kycPinTarget.toUpperCase()}.
            </p>

            <div className="mb-6 flex justify-center">
              <PinInput
                length={4}
                value={kycPinInput}
                onChange={setKycPinInput}
                onComplete={handleVerifyKycPin}
                disabled={verifyingKycPin}
                mask={true}
                autoFocus={true}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleVerifyKycPin(kycPinInput)}
                disabled={kycPinInput.length !== 4 || verifyingKycPin}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
              >
                {verifyingKycPin ? (
                  <span>Verifying PIN...</span>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-sky-200" />
                    <span>Verify & Reveal {kycPinTarget === 'bank' ? 'Bank Account' : kycPinTarget.toUpperCase()}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setKycPinTarget(null);
                  setKycPinInput('');
                }}
                disabled={verifyingKycPin}
                className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                  theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 🏦 Edit / Setup Payout Bank Account Modal */}
      {showEditBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all max-h-[90vh] overflow-y-auto ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-slate-900 border-slate-700/80 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display text-white">
                    {currentUser.has_bank_account || currentUser.account_number_masked ? 'Update Payout Bank' : 'Link Payout Bank Account'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Used for referral withdrawals & cash payouts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Popular Bank Quick Select Chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-display mb-1.5">
                  Popular Banks
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['OPay', 'Moniepoint', 'PalmPay', 'Kuda', 'GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setEditBankName(b)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        editBankName === b
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block font-display">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. OPay, Moniepoint, Access Bank"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Account Number Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block font-display">Account Number (10 Digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0123456789"
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Account Name Input & Matching Warning */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 block font-display">Account Name</label>
                  <span className="text-[9.5px] text-amber-400 font-semibold font-display">Must match profile name</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. JOHN DOE"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
                />
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Registered Name: <strong className="text-white">{`${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() || currentUser.name}</strong>. Third-party accounts are rejected for security.
                </p>
              </div>

              {/* PIN input if updating existing account */}
              {(currentUser.has_bank_account || currentUser.account_number_masked) && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 block font-display">
                    Authorize with 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-[0.4em] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveBank}
                  disabled={savingBank}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display disabled:opacity-50"
                >
                  {savingBank ? <span>Saving Bank Details...</span> : <span>Save Bank Account</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  disabled={savingBank}
                  className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-bold text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
