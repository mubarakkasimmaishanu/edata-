import React, { useState } from 'react';
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
  const [screenMode, setScreenMode] = useState<'auth' | 'otp' | 'password_create'>('auth');
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

  // Google Auth State
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // ─── Native & GIS Web Google Sign-In Handler ───
  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    const GOOGLE_CLIENT_ID = '518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com';

    try {
      let idToken = '';

      if (Capacitor.isNativePlatform()) {
        // Native Android / iOS using Capacitor Plugin
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        try {
          await GoogleAuth.initialize({
            clientId: GOOGLE_CLIENT_ID,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          });
        } catch {
          // Ignored if already initialized
        }
        const googleUser = await GoogleAuth.signIn();
        idToken = googleUser.authentication?.idToken || (googleUser as any).idToken || '';
      } else {
        // Web Browser using official Google Identity Services (GIS)
        idToken = await new Promise<string>((resolve, reject) => {
          const loadAndInitGIS = () => {
            try {
              if (!(window as any).google?.accounts?.id) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => runGISPrompt();
                script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
                document.head.appendChild(script);
              } else {
                runGISPrompt();
              }
            } catch (e) {
              reject(e);
            }
          };

          const runGISPrompt = () => {
            try {
              (window as any).google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response: any) => {
                  if (response.credential) {
                    resolve(response.credential);
                  } else {
                    reject(new Error('No ID Token received from Google.'));
                  }
                },
                auto_select: false,
                cancel_on_tap_outside: true,
              });

              (window as any).google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  // Fallback to explicit Token Client popup if One-Tap prompt is skipped/suppressed
                  try {
                    const client = (window as any).google.accounts.oauth2.initTokenClient({
                      client_id: GOOGLE_CLIENT_ID,
                      scope: 'email profile openid',
                      callback: (tokenRes: any) => {
                        if (tokenRes.id_token) {
                          resolve(tokenRes.id_token);
                        } else if (tokenRes.access_token) {
                          resolve(tokenRes.access_token);
                        } else {
                          reject(new Error('Google authentication was cancelled or closed.'));
                        }
                      },
                    });
                    client.requestAccessToken();
                  } catch (err) {
                    reject(err);
                  }
                }
              });
            } catch (err) {
              reject(err);
            }
          };

          loadAndInitGIS();
        });
      }

      if (!idToken) {
        toast.error('Unable to retrieve Google ID Token. Please try again.');
        return;
      }

      const res = await api.googleAuth({ id_token: idToken });
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
        toast.success('Email verified successfully!');
        setScreenMode('password_create');
      } else {
        setVerificationError(res.error || 'Incorrect verification code.');
        toast.error(res.error || 'Verification failed.');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'OTP verification error.');
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
                    <label className="text-xs font-semibold text-slate-500 block">Referral Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input type="text" value={authPromo} onChange={(e) => setAuthPromo(e.target.value)}
                      placeholder="e.g. REF-58291 or referrer email"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                  </div>
                  <label className="flex items-start gap-2.5 pt-1">
                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 accent-sky-600 rounded w-4 h-4" />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I accept the <strong className="text-slate-700">Terms & Conditions</strong> and privacy policy.
                    </span>
                  </label>
                  <button type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-[0.98]">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border border-rose-100">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                    <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@email.com" disabled={loginLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-500 block">Password</label>
                      <button type="button" onClick={() => setForgotPasswordModalOpen(true)}
                        className="text-xs text-sky-600 font-bold hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                    <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••" disabled={loginLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-60" />
                  </div>
                  <button type="submit" disabled={loginLoading}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-[0.98]">
                    {loginLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Social Login */}
            <div className="px-6 pb-8 space-y-4">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="px-3 text-xs text-slate-400 font-medium">or continue with</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
              <button
                type="button"
                disabled={googleAuthLoading}
                onClick={handleGoogleSignIn}
                className="w-full bg-white border border-slate-250 text-slate-750 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
              >
                {googleAuthLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {screenMode === 'otp' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-8 mt-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
                <p className="text-sm text-slate-500 font-medium">
                  We sent a 6-digit verification code to <strong className="text-slate-800">{authEmail}</strong>
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newCode = otpCode.split('');
                        newCode[i] = val;
                        const fullCode = newCode.join('');
                        setOtpCode(fullCode);
                        if (val && i < 5) {
                          const next = e.target.nextElementSibling as HTMLInputElement;
                          if (next) next.focus();
                        }
                        if (fullCode.length === 6) {
                          setTimeout(() => {
                            handleVerifyOTP(fullCode);
                          }, 80);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                          const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                          if (prev) prev.focus();
                        }
                      }}
                      className="w-11 h-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-lg font-bold text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  ))}
                </div>
                {verificationError && (
                  <p className="text-rose-500 text-xs text-center font-semibold">{verificationError}</p>
                )}
                <p className="text-xs text-slate-400 text-center font-medium">
                  Didn't receive code?{' '}
                  <button type="button" onClick={async () => {
                    try {
                      const res = await api.signupRequest(authEmail, authPromo);
                      toast.success(res.message || 'Verification code resent!');
                      if (res.otp) toast.info(`Localhost OTP Code: ${res.otp}`);
                    } catch (err: any) {
                      toast.error(err.message || 'Error resending code.');
                    }
                  }} className="text-sky-600 font-bold hover:underline">
                    Resend Code
                  </button>
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleVerifyOTP}
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
            <p className="text-xs text-slate-500">Enter your email address to receive password reset instructions.</p>
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
                onClick={async () => {
                  if (!forgotPasswordEmail) {
                    toast.warning('Please enter your email.');
                    return;
                  }
                  setForgotPasswordLoading(true);
                  try {
                    toast.info(`Password reset link dispatched to ${forgotPasswordEmail}`);
                    setForgotPasswordModalOpen(false);
                  } catch (err: any) {
                    toast.error(err.message || 'Reset request failed.');
                  } finally {
                    setForgotPasswordLoading(false);
                  }
                }}
                className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-sky-700"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
