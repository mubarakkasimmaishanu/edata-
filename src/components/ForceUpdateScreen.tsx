import React, { useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Download,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { App } from '@capacitor/app';
import { AppVersionData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { openStoreLink, openUpdateSupport } from '../services/appUpdateService';

interface ForceUpdateScreenProps {
  updateData: AppVersionData;
  onSnooze?: () => void;
}

export default function ForceUpdateScreen({ updateData, onSnooze }: ForceUpdateScreenProps) {
  const { theme } = useTheme();

  const isForce = updateData.update_type === 'FORCE' || updateData.is_expired || updateData.days_to_expire <= 0;
  const isFlexible = !isForce && updateData.update_type === 'FLEXIBLE';

  // Lock body scroll while screen is active
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Trap Android hardware back button via Capacitor
  useEffect(() => {
    let listenerHandle: any = null;

    const setupBackTrap = async () => {
      try {
        listenerHandle = await App.addListener('backButton', () => {
          if (isForce) {
            // Force lockout: Exit app rather than letting user bypass into dashboard
            App.exitApp();
          } else if (isFlexible && onSnooze) {
            onSnooze();
          }
        });
      } catch {
        // Dev web mode ignores Capacitor native listener
      }
    };

    setupBackTrap();

    return () => {
      if (listenerHandle && listenerHandle.remove) {
        listenerHandle.remove();
      }
    };
  }, [isForce, isFlexible, onSnooze]);

  const handleUpdate = () => {
    const targetUrl = updateData.market_url || updateData.play_store_url;
    openStoreLink(targetUrl);
  };

  const handleDirectApk = () => {
    if (updateData.direct_apk_url) {
      openStoreLink(updateData.direct_apk_url);
    }
  };

  const handleSupport = () => {
    openUpdateSupport(updateData.support_whatsapp || '2348030000000', updateData.installed_version);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto font-display ${
        theme === 'light' ? 'bg-[#f4f7fb] text-[#0f172a]' : 'bg-[#0f172a] text-[#f8fafc]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-screen-title"
    >
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md my-auto">
        {/* Main Card Container */}
        <div
          className={`rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-slate-900/10'
              : 'bg-slate-900 border-slate-800 shadow-black/80'
          }`}
        >
          {/* Header Visual: Security / Update Icon with Brand Ring */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-4">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-inner ${
                  isForce
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                }`}
              >
                {isForce ? (
                  <ShieldAlert className="w-10 h-10 stroke-[2.2]" />
                ) : (
                  <Clock className="w-10 h-10 stroke-[2.2]" />
                )}
              </div>

              {/* Status Indicator Pip */}
              <span
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  theme === 'light' ? 'border-white' : 'border-slate-900'
                } ${isForce ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}
              >
                {isForce ? (
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <Clock className="w-3 h-3 stroke-[2.5]" />
                )}
              </span>
            </div>

            {/* Version Migration Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 mb-2.5">
              <span>v{updateData.installed_version}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-sky-600 dark:text-sky-400">v{updateData.latest_version}</span>
            </div>

            {/* Days-to-Expire Countdown / Expiry Status Badge */}
            {isForce ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 mb-3">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Update Required to Continue</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {updateData.days_to_expire === 1
                    ? '1 Day Remaining'
                    : `${updateData.days_to_expire} Days Remaining`}
                </span>
              </div>
            )}

            {/* Title */}
            <h2
              id="update-screen-title"
              className="text-xl font-black tracking-tight leading-snug mb-2"
            >
              {updateData.title || (isForce ? 'Important Security Update' : 'New Version Available')}
            </h2>

            {/* Message */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {updateData.message}
            </p>
          </div>

          {/* Grace Deadline Notification (WhatsApp Style) */}
          {!isForce && updateData.deadline_formatted && (
            <div
              className={`mb-4 p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-medium ${
                theme === 'light'
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                  : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Support for this version ends on{' '}
                <strong className="font-bold">{updateData.deadline_formatted}</strong>. Please update soon.
              </span>
            </div>
          )}

          {/* Release Highlights Section */}
          {updateData.release_notes && updateData.release_notes.length > 0 && (
            <div className="mb-5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
                What's New in This Version:
              </span>
              <div
                className={`rounded-2xl border p-3.5 space-y-2 text-xs ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                {updateData.release_notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-500 mt-0.5" />
                    <span className="leading-snug">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Primary: Update on Google Play */}
            <button
              type="button"
              onClick={handleUpdate}
              className="w-full py-3.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Update on Google Play Store</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Secondary: Flexible Mode "Remind Me Tomorrow" OR Direct APK */}
            {isFlexible && onSnooze ? (
              <button
                type="button"
                onClick={onSnooze}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border active:scale-[0.98] cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                Remind Me Tomorrow
              </button>
            ) : (
              updateData.direct_apk_url && (
                <button
                  type="button"
                  onClick={handleDirectApk}
                  className={`w-full py-3 px-4 rounded-2xl font-semibold text-xs transition-all border active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span>Download APK Directly (Alternative)</span>
                </button>
              )
            )}

            {/* WhatsApp Support Assistance Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSupport}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Having trouble updating? Contact WhatsApp Support</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-4">
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            eData VTU &copy; {new Date().getFullYear()} &bull; Secure Financial Operations
          </p>
        </div>
      </div>
    </div>
  );
}
