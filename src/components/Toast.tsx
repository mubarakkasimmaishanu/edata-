import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// ─── Types ───
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ───
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback for when context is not available
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}

// ─── Visual Config ───
const VARIANT_CONFIG: Record<ToastVariant, { icon: React.ElementType; bg: string; border: string; text: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-50',
    border: 'border-rose-200/60',
    text: 'text-rose-800',
    iconColor: 'text-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    text: 'text-amber-800',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-sky-50',
    border: 'border-sky-200/60',
    text: 'text-sky-800',
    iconColor: 'text-sky-500',
  },
};

// ─── Single Toast Component ───
function ToastBubble({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void; key?: React.Key }) {
  const [exiting, setExiting] = useState(false);
  const config = VARIANT_CONFIG[item.variant];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(item.id), 250);
    }, item.duration || 3000);
    return () => clearTimeout(timer);
  }, [item, onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-2.5 px-4 py-3 rounded-2xl border shadow-lg shadow-black/5
        ${config.bg} ${config.border}
        ${exiting ? 'animate-toast-out' : 'animate-toast-in'}
        max-w-sm w-full pointer-events-auto
      `}
      role="alert"
    >
      <Icon className={`w-[18px] h-[18px] ${config.iconColor} shrink-0 mt-0.5`} />
      <p className={`text-[13px] font-semibold leading-snug flex-1 ${config.text}`}>
        {item.message}
      </p>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(item.id), 250); }}
        className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Toast Provider ───
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setTimeout(() => {
      setToasts(prev => {
        const updated = [...prev, { id, message, variant, duration }];
        // Max 3 visible toasts
        return updated.slice(-3);
      });
    }, 0);
  }, []);

  const value: ToastContextValue = {
    toast: addToast,
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error', 4000), [addToast]),
    warning: useCallback((msg: string) => addToast(msg, 'warning', 4000), [addToast]),
    info: useCallback((msg: string) => addToast(msg, 'info'), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container — fixed at top */}
      <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(t => (
          <ToastBubble key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
