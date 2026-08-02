import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  closeLabel?: string;
  maxHeight?: string;
  preventClose?: boolean;
}

export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  subtitle,
  closeLabel = 'Close',
  maxHeight = '85%',
  preventClose = false,
}: BottomSheetProps) {
  const { theme } = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-backdrop-in"
        onClick={() => { if (!preventClose) onClose(); }}
      />

      {/* Sheet Content */}
      <div
        className={`relative border-t backdrop-blur-2xl rounded-t-[28px] animate-sheet-up flex flex-col transition-colors ${
          theme === 'light'
            ? 'bg-white border-slate-200/90 text-slate-900 shadow-[0_-8px_40px_rgba(0,0,0,0.15)]'
            : 'bg-[#0f172a] border-slate-800 text-slate-100 shadow-[0_-8px_40px_rgba(0,0,0,0.8)]'
        }`}
        style={{ maxHeight }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3.5 pb-1.5 shrink-0">
          <div className={`w-9 h-[5px] rounded-full ${
            theme === 'light' ? 'bg-slate-300' : 'bg-slate-700/80'
          }`} />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className={`flex items-center justify-between px-5 pb-3.5 border-b shrink-0 ${
            theme === 'light' ? 'border-slate-200/80' : 'border-slate-800/80'
          }`}>
            <div>
              {title && (
                <h4 className={`text-[15px] font-black font-display leading-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>{title}</h4>
              )}
              {subtitle && (
                <span className={`text-xs mt-0.5 block font-medium ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                }`}>{subtitle}</span>
              )}
            </div>
            {!preventClose && (
              <button
                type="button"
                onClick={onClose}
                className={`text-xs font-bold transition-all px-3 py-1.5 rounded-xl border active:scale-95 cursor-pointer font-display ${
                  theme === 'light'
                    ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                    : 'text-sky-400 hover:text-sky-300 hover:bg-slate-900 border-sky-500/30'
                }`}
              >
                {closeLabel}
              </button>
            )}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none">
          {children}
        </div>
      </div>
    </div>
  );
}
