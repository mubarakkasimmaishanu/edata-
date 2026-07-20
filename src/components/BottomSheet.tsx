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
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sheet animate-backdrop-in"
        onClick={() => { if (!preventClose) onClose(); }}
      />

      {/* Sheet Content */}
      <div
        className="relative bg-white rounded-t-[28px] animate-sheet-up flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.08)]"
        style={{ maxHeight }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3.5 pb-1.5 shrink-0">
          <div className="w-9 h-[5px] rounded-full bg-slate-200/80" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-5 pb-3.5 border-b border-slate-100/80 shrink-0">
            <div>
              {title && (
                <h4 className="text-[15px] font-bold text-slate-900 leading-tight">{title}</h4>
              )}
              {subtitle && (
                <span className="text-xs text-slate-400 mt-0.5 block font-medium">{subtitle}</span>
              )}
            </div>
            {!preventClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-sky-600 hover:text-sky-700 text-xs font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-sky-50 active:scale-95"
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
