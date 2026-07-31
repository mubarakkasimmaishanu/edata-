import React from 'react';

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-backdrop-in"
        onClick={() => { if (!preventClose) onClose(); }}
      />

      {/* Sheet Content */}
      <div
        className="relative bg-slate-950/95 border-t border-slate-800 backdrop-blur-2xl text-slate-100 rounded-t-[28px] animate-sheet-up flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.8)]"
        style={{ maxHeight }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3.5 pb-1.5 shrink-0">
          <div className="w-9 h-[5px] rounded-full bg-slate-700/80" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-5 pb-3.5 border-b border-slate-800/80 shrink-0">
            <div>
              {title && (
                <h4 className="text-[15px] font-black text-white font-display leading-tight">{title}</h4>
              )}
              {subtitle && (
                <span className="text-xs text-slate-400 mt-0.5 block font-medium">{subtitle}</span>
              )}
            </div>
            {!preventClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-sky-400 hover:text-sky-300 hover:bg-slate-900 text-xs font-bold transition-all px-3 py-1.5 rounded-xl border border-sky-500/30 active:scale-95 cursor-pointer font-display"
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
