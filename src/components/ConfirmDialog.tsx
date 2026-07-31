import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: React.ElementType;
  loading?: boolean;
}

const VARIANT_ICONS: Record<DialogVariant, { icon: React.ElementType; bg: string; iconColor: string }> = {
  danger: { icon: XCircle, bg: 'bg-rose-500/15 border-rose-500/30', iconColor: 'text-rose-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/15 border-amber-500/30', iconColor: 'text-amber-400' },
  info: { icon: Info, bg: 'bg-sky-500/15 border-sky-500/30', iconColor: 'text-sky-400' },
  success: { icon: CheckCircle, bg: 'bg-emerald-500/15 border-emerald-500/30', iconColor: 'text-emerald-400' },
};

const CONFIRM_STYLES: Record<DialogVariant, string> = {
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
  info: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  icon: CustomIcon,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const config = VARIANT_ICONS[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-backdrop-in"
        onClick={() => { if (!loading) onClose(); }}
      />

      {/* Dialog Card */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl shadow-black/80 animate-modal-in font-display">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl ${config.bg} border flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-white text-center leading-tight">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-400 text-center mt-2 leading-relaxed font-medium">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-xs font-extrabold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider ${CONFIRM_STYLES[variant]}`}
          >
            {loading ? (
              <span className="dot-loading">
                <span></span><span></span><span></span>
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
