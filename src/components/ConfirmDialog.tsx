import React, { useState } from 'react';
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
  loading?: boolean;
}

const VARIANT_ICONS: Record<DialogVariant, { icon: React.ElementType; bg: string; iconColor: string }> = {
  danger: { icon: XCircle, bg: 'bg-rose-50', iconColor: 'text-rose-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', iconColor: 'text-amber-500' },
  info: { icon: Info, bg: 'bg-sky-50', iconColor: 'text-sky-500' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
};

const CONFIRM_STYLES: Record<DialogVariant, string> = {
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  info: 'bg-sky-600 hover:bg-sky-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
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
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const config = VARIANT_ICONS[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sheet animate-backdrop-in"
        onClick={() => { if (!loading) onClose(); }}
      />

      {/* Dialog Card */}
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl shadow-black/10 animate-modal-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 text-center leading-tight">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${CONFIRM_STYLES[variant]}`}
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
