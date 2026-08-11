import React, { useEffect } from 'react';
import {
  X, Download, Star, Info, Gift, Megaphone, ExternalLink, ArrowRight,
} from 'lucide-react';
import { PopupBanner as PopupBannerType, PopupType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PopupBannerProps {
  popup: PopupBannerType;
  // Called when the user dismisses (X, backdrop, or secondary button).
  onDismiss: () => void;
  // Called when the user taps the primary CTA. Receives the resolved
  // URL so the parent (App.tsx) can decide whether to route in-app,
  // open the store, or launch the system browser.
  onAction: (url: string) => void;
  // Called when the user taps the secondary CTA (if it has a URL).
  onSecondary?: (url: string) => void;
}

// Small helper — resolves a popup type to an icon + accent colour tuple.
// Unknown types fall through to the neutral "info" style so an admin can
// invent new types on the backend without a mobile-app rebuild.
function resolveTypeStyle(type: PopupType | undefined) {
  switch (type) {
    case 'update':
      return {
        Icon: Download,
        accent: 'from-sky-500 to-blue-600',
        chip: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        chipLabel: 'App Update',
        buttonBg: 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/30',
      };
    case 'rate':
      return {
        Icon: Star,
        accent: 'from-amber-400 to-orange-500',
        chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        chipLabel: 'Rate Us',
        buttonBg: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
      };
    case 'promo':
      return {
        Icon: Gift,
        accent: 'from-fuchsia-500 to-pink-500',
        chip: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
        chipLabel: 'Promo',
        buttonBg: 'bg-fuchsia-500 hover:bg-fuchsia-600 shadow-fuchsia-500/30',
      };
    case 'announcement':
      return {
        Icon: Megaphone,
        accent: 'from-emerald-500 to-teal-500',
        chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        chipLabel: 'Announcement',
        buttonBg: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30',
      };
    case 'info':
    default:
      return {
        Icon: Info,
        accent: 'from-sky-500 to-indigo-500',
        chip: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        chipLabel: 'Notice',
        buttonBg: 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/30',
      };
  }
}

export default function PopupBanner({
  popup,
  onDismiss,
  onAction,
  onSecondary,
}: PopupBannerProps) {
  const { theme } = useTheme();
  const style = resolveTypeStyle(popup.type);

  const dismissible = popup.dismissible !== false;
  const hasPrimary = Boolean(popup.action_label && popup.action_url);
  const hasSecondary = Boolean(popup.secondary_label);

  // Body-scroll lock while the popup is visible so the screen behind
  // doesn't drift when the user drags on the modal.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handlePrimary = () => {
    if (popup.action_url) onAction(popup.action_url);
  };

  const handleSecondary = () => {
    if (popup.secondary_url && onSecondary) {
      onSecondary(popup.secondary_url);
    } else {
      // Secondary button with no URL is a plain "Dismiss".
      onDismiss();
    }
  };

  const isExternal = (url?: string | null) =>
    !!url && (url.startsWith('http://') || url.startsWith('https://'));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-display"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-banner-title"
    >
      {/* Backdrop — dismissible popups close on tap, forced ones ignore it */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-backdrop-in"
        onClick={() => { if (dismissible) onDismiss(); }}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-[380px] rounded-3xl overflow-hidden animate-modal-in border shadow-2xl ${
          theme === 'light'
            ? 'bg-white border-slate-200 shadow-slate-900/30'
            : 'bg-slate-950 border-slate-800 shadow-black/80'
        }`}
      >
        {/* Close button — only when dismissible */}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close popup"
            className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
              theme === 'light'
                ? 'bg-white/90 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Banner image OR gradient header w/ icon */}
        {popup.image ? (
          <div className={`w-full aspect-[16/9] relative overflow-hidden ${
            theme === 'light' ? 'bg-slate-100' : 'bg-slate-900'
          }`}>
            <img
              src={popup.image}
              alt={popup.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If the image fails, hide the wrapper cleanly — the
                // header falls back to solid card with just the icon.
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
            {/* Bottom gradient scrim so overlaid chip stays readable */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border backdrop-blur-md ${style.chip}`}>
                {style.chipLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className={`h-24 bg-gradient-to-br ${style.accent} relative flex items-center justify-center`}>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <style.Icon className="w-8 h-8 text-white" strokeWidth={2.25} />
            </div>
            <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-white border border-white/30">
              {style.chipLabel}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            {popup.image && (
              <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center border ${style.chip}`}>
                <style.Icon className="w-5 h-5" strokeWidth={2.25} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                id="popup-banner-title"
                className={`text-base font-black leading-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}
              >
                {popup.title}
              </h3>
            </div>
          </div>

          <p
            className={`text-[13px] leading-relaxed font-medium whitespace-pre-wrap ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {popup.message}
          </p>

          {/* Actions */}
          {(hasPrimary || hasSecondary || dismissible) && (
            <div className="pt-3 space-y-2">
              {hasPrimary && (
                <button
                  type="button"
                  onClick={handlePrimary}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${style.buttonBg}`}
                >
                  <span>{popup.action_label}</span>
                  {isExternal(popup.action_url) ? (
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </button>
              )}

              {/* Secondary button — either its own labelled action, or a
                  fallback "Dismiss" pill for dismissible popups without a
                  primary CTA. Forced popups with no primary have neither. */}
              {hasSecondary ? (
                <button
                  type="button"
                  onClick={handleSecondary}
                  className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer border ${
                    theme === 'light'
                      ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {popup.secondary_label}
                </button>
              ) : (
                dismissible && !hasPrimary && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer border ${
                      theme === 'light'
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Got it
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
