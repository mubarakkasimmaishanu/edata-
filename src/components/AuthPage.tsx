import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ArrowRight, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import edataLogo from '../assets/edata_logo.png';
import { api, setAuthToken } from '../services/api';
import { useToast } from './Toast';
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
  const [screenMode, setScreenMode] = useState<'auth' | 'otp' | 'password_create' | 'forgot_otp' | 'forgot_reset'>('auth');
  const [isRegistering, setIsRegistering] = useState(false);

  // Form Fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
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
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Google Auth State
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // Pre-initialize native GoogleAuth on mount
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth')
        .then(({ GoogleAuth }) => {
          GoogleAuth.initialize({
            clientId: '518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          }).catch(() => {});
        })
        .catch(() => {});
    }
  }, []);

  // ─── Native & GIS Web Google Sign-In Handler ───
  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    const GOOGLE_CLIENT_ID = '518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com';

    try {
      let tokenPayload: { id_token?: string; access_token?: string } = {};

      if (Capacitor.isNativePlatform()) {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          const googleUser = await GoogleAuth.signIn();
          const rawIdToken = googleUser.authentication?.idToken || (googleUser as any).idToken || googleUser.authentication?.accessToken || '';
          if (rawIdToken) {
            tokenPayload = { id_token: rawIdToken };
          } else {
            toast.error('Google Sign-In did not return a valid token. Please try again.');
            return;
          }
        } catch (nativeErr: any) {
          console.error('Native Google Auth failed:', nativeErr);
          if (
            nativeErr?.message?.includes('canceled') ||
            nativeErr?.message?.includes('cancelled') ||
            nativeErr?.code === '12501' ||
            nativeErr?.code === 12501
          ) {
            toast.info('Google Sign-In was cancelled.');
          } else {
            toast.error(nativeErr?.message || 'Native Google Sign-In failed.');
          }
          return;
        }
      } else {
        // Web Platform: GIS OAuth Popup Client
        tokenPayload = await new Promise<{ id_token?: string; access_token?: string }>((resolve, reject) => {
          const loadAndInitGIS = () => {
            try {
              if (!(window as any).google?.accounts?.oauth2) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => runGISPopup();
                script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
                document.head.appendChild(script);
              } else {
                runGISPopup();
              }
            } catch (e) {
              reject(e);
            }
          };

          const runGISPopup = () => {
            try {
              const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'email profile openid',
                callback: (tokenRes: any) => {
                  if (tokenRes.access_token) {
                    resolve({ access_token: tokenRes.access_token });
                  } else if (tokenRes.id_token) {
                    resolve({ id_token: tokenRes.id_token });
                  } else {
                    reject(new Error('Google authentication was cancelled or closed.'));
                  }
                },
                error_callback: (err: any) => {
                  reject(new Error('Google Sign-In popup error: ' + (err.message || 'Popup closed')));
                }
              });
              client.requestAccessToken();
            } catch (err) {
              reject(err);
            }
          };

          loadAndInitGIS();
        });
      }

      if (!tokenPayload.id_token && !tokenPayload.access_token) {
        toast.error('Unable to retrieve Google Authentication Token. Please try again.');
        return;
      }

      const res = await api.googleAuth(tokenPayload);
      if (res.success && res.data) {
        const loggedUser: UserProfile = {
          ...DEFAULT_USER,
          id: res.data.user.id,
          email: res.data.user.email,
          firstname: res.data.user.firstname || 'Google',
          lastname: res.data.user.lastname || 'User',
          name: `${res.data.user.firstname || 'Google'} ${res.data.user.lastname || 'User'}`.trim(),
          photo: res.data.user.photo || '',
          phone: res.data.user.phone || '',
          walletBalance: res.data.user.walletBalance || 0,
          category: res.data.user.level_label || res.data.user.category || 'Basic User',
          isVerified: true,
          hasPin: res.data.user.hasPin || res.data.user.has_pin || false,
        };
        setCurrentUser(loggedUser);
        localStorage.setItem('edata_current_user', JSON.stringify(loggedUser));
        if (setApiStatus) setApiStatus('connected');
        onLoginSuccess(res.data.token || res.data.accessToken);
        toast.success(`Welcome back, ${loggedUser.firstname}!`);
      } else {
        toast.error(res.error || 'Google Authentication failed.');
      }
    } catch (err: any) {
      if (
        err?.message?.includes('canceled') ||
        err?.message?.includes('cancelled') ||
        err?.message?.includes('popup_closed_by_user') ||
        err?.code === '12501' ||
        err?.code === 12501
      ) {
        toast.info('Google Sign-In was cancelled.');
      } else {
        toast.error(err?.message || 'Google Auth service error.');
      }
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  // ─── Login Handler ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.login(authEmail, authPassword);
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        if (setApiStatus) setApiStatus('connected');
        onLoginSuccess(res.data.token);
        setAuthPassword('');
        setLoginError('');
      } else if (res.requires_verification) {
        toast.info(res.error || 'Account is inactive. A verification code has been sent to your email.');
        setScreenMode('otp');
      } else {
        setLoginError(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Register Handler ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.warning('Please accept the terms and conditions.');
      return;
    }
    if (!authEmail || !authEmail.includes('@')) {
      toast.warning('Please enter a valid email address.');
      return;
    }

    try {
      const res = await api.signupRequest(authEmail, authPromo);
      if (res.success) {
        toast.success(res.message || 'Verification code sent to your email!');
        setScreenMode('otp');
      } else {
        toast.error(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error requesting registration verification code.');
    }
  };

  // ─── OTP Handler ───
  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = typeof codeToVerify === 'string' ? codeToVerify : otpCode;
    if (code.length < 6) {
      setVerificationError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    try {
      const res = await api.signupVerify(authEmail, code);
      if (res.success) {
        setVerificationError('');
        if (res.data?.token) {
          setAuthToken(res.data.token);
          if (setApiStatus) setApiStatus('connected');
          onLoginSuccess(res.data.token);
          toast.success(res.message || 'Account activated and logged in!');
          setScreenMode('auth');
        } else {
          toast.success('Email verified successfully!');
          setScreenMode('password_create');
        }
      } else {
        setVerificationError(res.error || 'Incorrect verification code.');
        toast.error(res.error || 'Verification failed.');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'OTP verification error.');
    }
  };

  // ─── Resend OTP Handler ───
  const handleResendOTP = async () => {
    if (!authEmail) {
      toast.warning('Email address is missing.');
      return;
    }
    try {
      let res: any;
      if (screenMode === 'forgot_otp') {
        res = await api.forgotPassword(authEmail);
      } else {
        res = await api.signupRequest(authEmail, authPromo);
      }
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

  // ─── Forgot Password Request Handler ───
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
        setAuthEmail(forgotPasswordEmail);
        setForgotPasswordModalOpen(false);
        setScreenMode('forgot_otp');
        toast.success(res.message || `Password reset code sent to ${forgotPasswordEmail}`);
      } else {
        toast.error(res.error || 'Failed to request password reset code.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Password reset request error.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // ─── Complete Reset Password Handler ───
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtpCode.length < 6) {
      toast.warning('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setResetPasswordLoading(true);
    try {
      const res = await api.resetPassword(authEmail, forgotOtpCode, forgotNewPassword, forgotConfirmPassword);
      if (res.success) {
        toast.success(res.message || 'Password reset successfully! You can now log in.');
        setForgotOtpCode(''); setForgotNewPassword(''); setForgotConfirmPassword('');
        setAuthPassword('');
        setScreenMode('auth');
      } else {
        toast.error(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error resetting password.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30 flex flex-col justify-between w-full">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-6 py-8">
        {screenMode === 'auth' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-4 pb-6 space-y-6">
              {/* Header without Logo */}
              <div className="text-center space-y-1 pt-6 pb-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1 font-display">
                  <span className="text-sky-600 font-extrabold">e</span><span className="font-extrabold">Data</span>
                </h1>
                <p className="text-xs font-semibold text-slate-500 tracking-wide">Instant VTU & Utility Payment Platform</p>
              </div>

              {/* Tab Switcher */}
              <div className="bg-slate-100 p-1 rounded-2xl flex relative">
                <div
                  className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                  style={{ width: '50%', left: isRegistering ? '50%' : '0%' }}
                />
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className={`flex-grow py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${!isRegistering ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className={`flex-grow py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${isRegistering ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              {isRegistering ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                    <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Referral / Promo Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input type="text" value={authPromo} onChange={(e) => setAuthPromo(e.target.value)}
                      placeholder="e.g. EDATA2026"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                  </div>
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4" />
                    <span className="text-xs text-slate-500">I accept the Terms & Conditions</span>
                  </label>
                  <button type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3.5 rounded-xl text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all">
                    Send Verification Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                    <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-500 block">Password</label>
                      <button type="button" onClick={() => { setForgotPasswordEmail(authEmail); setForgotPasswordModalOpen(true); }}
                        className="text-xs font-semibold text-sky-600 hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                    <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                  </div>
                  <button type="submit" disabled={loginLoading}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3.5 rounded-xl text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50/50 px-2 text-slate-400 font-semibold">Or continue with</span></div>
              </div>

              {/* Google Sign-In */}
              <button type="button" onClick={handleGoogleSignIn} disabled={googleAuthLoading}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                {googleAuthLoading ? <RefreshCw className="w-4 h-4 animate-spin text-sky-600" /> : (
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

            <p className="text-center text-xs text-slate-400 font-medium py-2">
              Protected by 256-bit SSL Security & Verification Token Validation
            </p>
          </div>
        )}

        {screenMode === 'otp' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Enter Verification Code</h2>
                <p className="text-sm text-slate-500 font-medium">
                  We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{authEmail}</span>.
                </p>
              </div>

              {verificationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="space-y-4">
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
                  className="w-full bg-white border-2 border-sky-500 rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 focus:outline-none shadow-sm"
                />

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-xs font-semibold text-sky-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleVerifyOTP()}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98]">
                Verify & Continue
              </button>
              <button onClick={() => setScreenMode('auth')}
                className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
                Back
              </button>
            </div>
          </div>
        )}

        {screenMode === 'forgot_otp' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Enter Reset Code</h2>
                <p className="text-sm text-slate-500 font-medium">
                  We sent a 6-digit password reset code to <span className="font-semibold text-slate-800">{authEmail}</span>.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={forgotOtpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setForgotOtpCode(val);
                    if (val.length === 6) setScreenMode('forgot_reset');
                  }}
                  placeholder="123456"
                  className="w-full bg-white border-2 border-sky-500 rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 focus:outline-none shadow-sm"
                />

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-xs font-semibold text-sky-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => {
                if (forgotOtpCode.length < 6) {
                  toast.warning('Please enter the 6-digit verification code.');
                  return;
                }
                setScreenMode('forgot_reset');
              }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98]">
                Verify Code & Set Password
              </button>
              <button onClick={() => setScreenMode('auth')}
                className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
                Back to Login
              </button>
            </div>
          </div>
        )}

        {screenMode === 'forgot_reset' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Set New Password</h2>
                <p className="text-sm text-slate-500 font-medium">Create a new password for <span className="font-semibold text-slate-800">{authEmail}</span>.</p>
              </div>
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">New Password</label>
                  <div className="relative">
                    <input type={showForgotNewPassword ? 'text' : 'password'} required value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)} placeholder="Min. 6 characters"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500" />
                    <button type="button" onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Confirm New Password</label>
                  <div className="relative">
                    <input type={showForgotConfirmPassword ? 'text' : 'password'} required value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)} placeholder="Re-enter password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500" />
                    <button type="button" onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={resetPasswordLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                  {resetPasswordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            </div>
            <button onClick={() => setScreenMode('auth')}
              className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
              Back to Login
            </button>
          </div>
        )}

        {screenMode === 'password_create' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Create Password</h2>
                <p className="text-sm text-slate-500 font-medium">Secure your account with a strong password.</p>
              </div>
              <form onSubmit={handleRegisterPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Password</label>
                  <div className="relative">
                    <input type={showRegPassword ? 'text' : 'password'} required value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 characters"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500" />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Confirm Password</label>
                  <div className="relative">
                    <input type={showRegConfirmPassword ? 'text' : 'password'} required value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="Re-enter password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500" />
                    <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98] mt-4">
                  Complete Registration
                </button>
              </form>
            </div>
            <button onClick={() => setScreenMode('auth')}
              className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
              Back
            </button>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-500">Enter your email address to receive a 6-digit password reset code.</p>
            <input
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={forgotPasswordLoading}
                onClick={handleForgotPasswordSubmit}
                className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-sky-700 flex items-center justify-center gap-1.5"
              >
                {forgotPasswordLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Send Code'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
