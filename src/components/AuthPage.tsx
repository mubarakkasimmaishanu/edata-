import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ArrowRight, AlertCircle, RefreshCw, Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react';
import edataLogo from '../assets/edata_logo.png';
import { api, setAuthToken } from '../services/api';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { UserProfile } from '../types';
import { DEFAULT_USER, INITIAL_SUBSCRIBERS } from '../data';

interface AuthPageProps {
  onLoginSuccess: (token: string) => void;
  setCurrentUser: (user: UserProfile) => void;
  apiStatus: 'connected' | 'offline';
  setApiStatus?: (status: 'connected' | 'offline') => void;
  subscribers?: UserProfile[];
}

export default function AuthPage({
  onLoginSuccess,
  setCurrentUser,
  apiStatus,
  setApiStatus,
  subscribers = INITIAL_SUBSCRIBERS,
}: AuthPageProps) {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [screenMode, setScreenMode] = useState<'auth' | 'otp' | 'password_create'>('auth');
  const [isRegistering, setIsRegistering] = useState(false);

  // Form Fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authPromo, setAuthPromo] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // OTP Fields
  const [otpCode, setOtpCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Register Password Fields
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password Fields
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Google Auth State
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // Google Client ID (Web Client ID from Firebase / Google Cloud Console)
  const GOOGLE_CLIENT_ID = '452311037053-nqv6g7b0jhn0iv703jed97fbuhf1n14v.apps.googleusercontent.com';

  // Initialize the correct SDK exactly once per platform
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Android reads server_client_id from strings.xml — do NOT pass clientId here
      import('@codetrix-studio/capacitor-google-auth')
        .then(({ GoogleAuth }) => GoogleAuth.initialize())
        .catch(() => {});
    } else {
      // Preload Google Identity Services script for the web popup
      if (!document.getElementById('gis-sdk')) {
        const s = document.createElement('script');
        s.id = 'gis-sdk';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
    }
  }, []);

  // GIS web popup — only used on the web build (not inside the Android WebView)
  const runGISWebOAuth = () =>
    new Promise<{ access_token?: string }>((resolve, reject) => {
      const trigger = () => {
        const g = (window as any).google;
        if (!g?.accounts?.oauth2) {
          reject(new Error('Google Sign-In SDK not ready. Please try again.'));
          return;
        }
        try {
          const client = g.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            callback: (r: any) =>
              r?.access_token
                ? resolve({ access_token: r.access_token })
                : reject(new Error('Google authentication was cancelled.')),
            error_callback: (e: any) =>
              reject(new Error(e?.message || 'Google Sign-In popup closed.')),
          });
          client.requestAccessToken();
        } catch (e) {
          reject(e);
        }
      };

      if ((window as any).google?.accounts?.oauth2) {
        trigger();
      } else {
        // Script was preloaded in useEffect but may not be ready yet
        const existing = document.getElementById('gis-sdk') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', trigger, { once: true });
          existing.addEventListener('error', () => reject(new Error('Unable to load Google Sign-In SDK.')), { once: true });
        } else {
          reject(new Error('Google Sign-In SDK not loaded.'));
        }
      }
    });

  // ─── Google Sign-In Handler ───
  const handleGoogleSignIn = async () => {
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.');
      return;
    }

    setGoogleAuthLoading(true);
    try {
      let tokenPayload: {
        id_token?: string;
        access_token?: string;
        email?: string;
        firstname?: string;
        lastname?: string;
        picture?: string;
      } = {};

      if (Capacitor.isNativePlatform()) {
        // Native: use the plugin. It reads server_client_id from strings.xml.
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication?.idToken;
        if (!idToken) {
          throw new Error('No ID token returned by Google. Check Android OAuth client SHA-1 configuration.');
        }
        tokenPayload = {
          id_token: idToken,
          ...(googleUser.email ? { email: googleUser.email } : {}),
          ...(googleUser.givenName ? { firstname: googleUser.givenName } : {}),
          ...(googleUser.familyName ? { lastname: googleUser.familyName } : {}),
          ...(googleUser.imageUrl ? { picture: googleUser.imageUrl } : {}),
        };
      } else {
        // Web: use GIS popup
        tokenPayload = await runGISWebOAuth();
      }

      // Send to Backend Google API
      const backendRes = await api.googleAuth(tokenPayload);

      if (backendRes.success && backendRes.data?.token) {
        setAuthToken(backendRes.data.token);
        const userObj: UserProfile = {
          id: backendRes.data.user.id,
          name: `${backendRes.data.user.firstname || ''} ${backendRes.data.user.lastname || ''}`.trim() || 'eData User',
          email: backendRes.data.user.email,
          phone: backendRes.data.user.phone || '',
          walletBalance: parseFloat(backendRes.data.user?.wallet_balance ?? backendRes.data.user?.balance ?? backendRes.data.wallet_balance ?? backendRes.data.balance ?? '0'),
          category: backendRes.data.user.level_label || 'Basic User',
          bvn: '',
          nin: '',
          isVerified: true,
          pinCode: '',
          hasPin: backendRes.data.user.has_pin || false,
          hasPendingUpgrade: backendRes.data.user.has_pending_upgrade || false,
          upgradeFee: backendRes.data.user.premium_upgrade_fee || 5000,
          photo: backendRes.data.user.photo || null,
        };

        setCurrentUser(userObj);
        localStorage.setItem('edata_current_user', JSON.stringify(userObj));
        onLoginSuccess(backendRes.data.token);
        toast.success(backendRes.message || 'Google Authentication successful! Welcome.');
      } else {
        toast.error(backendRes.error || 'Google Authentication failed on server.');
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      const msg = String(err?.message || err || '').toLowerCase();
      if (msg.includes('cancel') || err?.code === '12501' || err?.code === 12501) {
        toast.info('Google Sign-In was cancelled.');
      } else if (
        msg.includes('developer_error') ||
        msg.includes('something went wrong') ||
        msg.includes(' 10 ') ||
        msg.endsWith(' 10') ||
        msg.includes('sha-1')
      ) {
        toast.error(
          "Google Sign-In isn't configured for this build. Register this app's SHA-1 in Google Cloud Console."
        );
      } else {
        toast.error(err?.message || 'Google Sign-In failed.');
      }
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  // ─── Login Handler ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await api.login(authEmail, authPassword);
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        const userObj: UserProfile = {
          id: res.data.user.id,
          name: `${res.data.user.firstname || ''} ${res.data.user.lastname || ''}`.trim() || 'eData User',
          email: res.data.user.email,
          phone: res.data.user.phone || '',
          walletBalance: parseFloat(res.data.user?.wallet_balance ?? res.data.user?.balance ?? res.data.wallet_balance ?? res.data.balance ?? '0'),
          category: res.data.user.level_label || 'Basic User',
          bvn: '', nin: '', isVerified: true,
          pinCode: '', hasPin: res.data.user.has_pin || false,
          hasPendingUpgrade: res.data.user.has_pending_upgrade || false,
          upgradeFee: res.data.user.premium_upgrade_fee || 5000,
          photo: res.data.user.photo || null,
        };

        setCurrentUser(userObj);
        localStorage.setItem('edata_current_user', JSON.stringify(userObj));
        onLoginSuccess(res.data.token);
        toast.success(`Welcome back, ${userObj.name}!`);
      } else {
        const errorMsg = res.error || 'Invalid login credentials.';
        setLoginError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const msg = err.message || 'Network error occurred during login.';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Register Submit Handler (Step 1) ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.warning('Please accept the Terms & Conditions to proceed.');
      return;
    }

    try {
      const res = await api.signupRequest(authEmail, authPromo);
      if (res.success) {
        setScreenMode('otp');
        toast.success(res.message || 'Verification code sent to your registered email');
      } else {
        toast.error(res.error || 'Failed to send signup verification code.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending signup request.');
    }
  };

  // ─── Verify OTP Handler ───
  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length < 6) {
      toast.warning('Please enter the 6-digit verification code.');
      return;
    }
    setVerificationError('');

    try {
      const res = await api.signupVerify(authEmail, code);
      if (res.success) {
        setScreenMode('password_create');
        toast.success('Email verified! Now create your password.');
      } else {
        setVerificationError(res.error || 'Invalid verification code.');
        toast.error(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'OTP verification error.');
      toast.error(err.message || 'OTP verification error.');
    }
  };

  // ─── Resend OTP Handler ───
  const handleResendOTP = async () => {
    try {
      const res = await api.signupRequest(authEmail, authPromo);
      if (res.success) {
        toast.success(res.message || 'A new verification code has been sent to your email.');
      } else {
        toast.error(res.error || 'Failed to resend verification code.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error resending verification code.');
    }
  };

  // ─── Register Password Handler ───
  const handleRegisterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      const res = await api.signupComplete(authEmail, otpCode, regPassword, regConfirmPassword, '', authPromo);
      if (res.success && res.data) {
        const newUserObj: UserProfile = {
          id: res.data.user.id,
          name: authEmail.split('@')[0].toUpperCase(),
          email: res.data.user.email,
          phone: res.data.user.phone || '',
          walletBalance: 0,
          category: res.data.user.level_label || 'Basic User',
          bvn: '', nin: '', isVerified: false,
          pinCode: '', hasPin: res.data.user.has_pin || false,
          promoCode: authPromo,
        };
        setCurrentUser(newUserObj);
        localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
        onLoginSuccess(res.data.token);
        toast.success(res.message || 'Registration completed successfully! Welcome to eData.');
        setRegPassword(''); setRegConfirmPassword('');
      } else {
        toast.error(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration completion error.');
    }
  };
  // ────── Forgot Password Request Handler (Browser Link Flow) ──────
  const handleForgotPasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      toast.warning('Please enter a valid email address.');
      return;
    }
    setForgotPasswordLoading(true);
    try {
      const res = await api.forgotPassword(forgotPasswordEmail);
      if (res.success) {
        setForgotPasswordSent(true);
        toast.success(res.message || 'Password reset link sent to your registered email.');
      } else {
        toast.error(res.error || 'Failed to request password reset link.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Password reset request error.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between w-full font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#f4f7fb] text-slate-900' : 'bg-slate-900 text-slate-100'
    }`}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-5 py-8">
        {/* Top Quick Theme Toggle Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <><Moon className="w-4 h-4 text-slate-700" /> <span className="text-[11px]">Dark</span></>
            ) : (
              <><Sun className="w-4 h-4 text-amber-400" /> <span className="text-[11px]">Light</span></>
            )}
          </button>
        </div>

        {screenMode === 'auth' && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6 pt-2">
              {/* Header Title */}
              {/* App Brand Header */}
              <div className="text-center space-y-1 pt-4 pb-2 flex flex-col items-center">
                <div className="w-16 h-16 mb-2 rounded-2xl overflow-hidden shadow-lg shadow-sky-500/20 border border-sky-500/30 flex items-center justify-center bg-slate-900/50 backdrop-blur-md">
                  <img src={edataLogo} alt="eData Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-black tracking-tight flex items-center justify-center gap-0.5 font-display">
                  <span className="text-[#0284c7] font-extrabold">e</span>
                  <span className={`font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Data</span>
                </h1>
                <p className={`text-xs font-semibold tracking-wide ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Instant VTU & Utility Payment Platform
                </p>
              </div>

              {/* System Card */}
              <div className={`rounded-3xl p-5 backdrop-blur-xl space-y-5 transition-all ${
                theme === 'light'
                  ? 'bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60'
                  : 'bg-slate-800/90 border border-slate-700/80 shadow-2xl'
              }`}>
                {/* Tab Switcher */}
                <div className={`p-1.5 rounded-2xl flex relative border ${
                  theme === 'light' ? 'bg-[#f1f5f9] border-slate-200/80' : 'bg-slate-950/90 border-slate-800'
                }`}>
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out ${
                      theme === 'light'
                        ? 'bg-white shadow-sm border border-slate-200/60'
                        : 'bg-sky-500 shadow-md shadow-sky-500/20'
                    }`}
                    style={{ width: 'calc(50% - 6px)', left: isRegistering ? 'calc(50% + 3px)' : '3px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className={`flex-grow py-2.5 text-xs font-black rounded-xl transition-all relative z-10 cursor-pointer ${
                      !isRegistering
                        ? (theme === 'light' ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold')
                        : (theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200')
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className={`flex-grow py-2.5 text-xs font-black rounded-xl transition-all relative z-10 cursor-pointer ${
                      isRegistering
                        ? (theme === 'light' ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold')
                        : (theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200')
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Form */}
                {isRegistering ? (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form" method="post">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Email Address</label>
                      <input
                        type="email"
                        name="username"
                        id="register-email"
                        autoComplete="username email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@email.com"
                        className={`w-full border rounded-2xl px-4 py-3.5 text-sm transition-all font-medium focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-500/20 ${
                          theme === 'light'
                            ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                        Referral / Promo Code <span className={`${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} font-normal`}>(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="promo"
                        id="register-promo"
                        autoComplete="off"
                        value={authPromo}
                        onChange={(e) => setAuthPromo(e.target.value)}
                        placeholder="e.g. EDATA2026"
                        className={`w-full border rounded-2xl px-4 py-3.5 text-sm uppercase transition-all font-mono font-bold focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-500/20 ${
                          theme === 'light'
                            ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                        }`}
                      />
                    </div>
                    <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="rounded border-slate-300 bg-white text-[#0284c7] focus:ring-sky-500 w-4 h-4"
                      />
                      <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>I accept the Terms & Conditions</span>
                    </label>
                    <button
                      type="submit"
                      className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Send Verification Code
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form" method="post">
                    {loginError && (
                      <div className={`p-3 border rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                        theme === 'light'
                          ? 'bg-[#fff1f2] border-rose-200 text-rose-800'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{loginError}</span>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Email Address</label>
                      <input
                        type="email"
                        name="username"
                        id="login-email"
                        autoComplete="username email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@email.com"
                        className={`w-full border rounded-2xl px-4 py-3.5 text-sm transition-all font-medium focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-500/20 ${
                          theme === 'light'
                            ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Password</label>
                        <button
                          type="button"
                          onClick={() => { setForgotPasswordEmail(authEmail); setForgotPasswordModalOpen(true); }}
                          className="text-xs font-bold text-[#0284c7] hover:text-[#0369a1] transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type={showAuthPassword ? 'text' : 'password'}
                          name="password"
                          id="login-password"
                          autoComplete="current-password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full border rounded-2xl pl-4 pr-12 py-3.5 text-sm transition-all font-medium focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-500/20 ${
                            theme === 'light'
                              ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-xs'
                              : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAuthPassword(!showAuthPassword)}
                          className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title={showAuthPassword ? 'Hide password' : 'Show password'}
                        >
                          {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In ->'}
                    </button>
                  </form>
                )}

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`} />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className={`px-3 font-bold rounded-full border ${
                      theme === 'light'
                        ? 'bg-white text-slate-400 border-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}>
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleAuthLoading}
                  className={`w-full border font-bold py-3.5 rounded-2xl text-sm shadow-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-slate-950/90 hover:bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  {googleAuthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>

            <p className={`text-center text-[11px] font-medium py-3 ${
              theme === 'light' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Protected by 256-bit SSL Security & Verification Token Validation
            </p>
          </div>
        )}

        {screenMode === 'otp' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 mt-4">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-white">Enter Verification Code</h2>
                <p className="text-xs text-slate-400 font-medium">
                  We sent a 6-digit code to <span className="font-bold text-sky-400">your registered email</span>.
                </p>
              </div>

              {verificationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="space-y-4 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    if (val.length === 6) handleVerifyOTP(val);
                  }}
                  placeholder="123456"
                  className="w-full bg-slate-950 border-2 border-sky-500/80 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none shadow-lg shadow-sky-500/10 font-mono"
                />

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <button
                onClick={() => handleVerifyOTP()}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                Verify & Continue
              </button>
              <button
                onClick={() => setScreenMode('auth')}
                className="w-full text-slate-400 font-bold py-2 text-xs hover:text-slate-200 transition-colors cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {screenMode === 'password_create' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 mt-4">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-white">Create Password</h2>
                <p className="text-xs text-slate-400 font-medium">Secure your account with a strong password.</p>
              </div>

              <form onSubmit={handleRegisterPasswordSubmit} className="space-y-4 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl" id="create-password-form" method="post">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      name="new-password"
                      id="reg-new-password"
                      autoComplete="new-password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 pr-12 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      name="confirm-password"
                      id="reg-confirm-password"
                      autoComplete="new-password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 pr-12 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all mt-2 cursor-pointer"
                >
                  Complete Registration
                </button>
              </form>
            </div>

            <button
              onClick={() => setScreenMode('auth')}
              className="w-full text-slate-400 font-bold py-2 text-xs hover:text-slate-200 transition-colors cursor-pointer pt-4"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Forgot Password Modal (Browser Link Flow) */}
      {forgotPasswordModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => { setForgotPasswordModalOpen(false); setForgotPasswordSent(false); }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {!forgotPasswordSent ? (
              <>
                <div className="space-y-1 text-center">
                  <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-2xl mx-auto flex items-center justify-center mb-2">
                    <ShieldCheck className="w-6 h-6 text-sky-400" />
                  </div>
                  <h3 className="text-lg font-black text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">
                    Enter your registered email address. We'll send you a secure link to reset your password in your web browser.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                  />
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setForgotPasswordModalOpen(false); setForgotPasswordSent(false); }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                    >
                      {forgotPasswordLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">Reset Link Sent! ✉️</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    We've sent a secure password reset link to:
                  </p>
                  <p className="text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-800/40 rounded-xl py-2 px-3 break-all">
                    {forgotPasswordEmail}
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-left space-y-2 text-[11.5px] text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">1.</span>
                    <span>Check your email inbox or spam folder.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">2.</span>
                    <span>Tap the secure link to set your new password in your browser (expires in 20 minutes).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">3.</span>
                    <span>Return here and sign in with your new password.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordModalOpen(false);
                    setForgotPasswordSent(false);
                  }}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
