import React from 'react';
import { CheckCircle2, Copy, Check, MessageSquare, ExternalLink, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';

interface PhysicalSuccessModalProps {
  isOpen: boolean;
  reference: string;
  serviceTitle: string;
  productName?: string;
  adminFeePaid: number;
  postPaymentNotice: string;
  liveChatUrl?: string;
  onClose: () => void;
  onViewHistory?: () => void;
}

export default function PhysicalSuccessModal({
  isOpen,
  reference,
  serviceTitle,
  productName,
  adminFeePaid,
  postPaymentNotice,
  liveChatUrl,
  onClose,
  onViewHistory,
}: PhysicalSuccessModalProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(reference).then(() => {
      setCopied(true);
      toast.success('Reference copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      toast.info(`Ref: ${reference}`);
    });
  };

  const handleLiveChat = () => {
    const url = liveChatUrl || `https://wa.me/2348000000000?text=${encodeURIComponent(`Hello eData Support, I just submitted request ${reference} for ${serviceTitle}.`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white border border-slate-800'
        }`}
      >
        {/* Success Header Icon */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <Clock className="w-3.5 h-3.5" />
            Request Submitted (Pending Review)
          </span>
          <h2 className="text-xl font-bold font-display tracking-tight">Request Received!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your {serviceTitle} request has been submitted to the Admin Dashboard.
          </p>
        </div>

        {/* Reference & Summary Card */}
        <div className={`mt-5 rounded-2xl p-4 border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/60 border-slate-700'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">Reference No:</span>
            <button
              type="button"
              onClick={handleCopyRef}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary dark:text-emerald-400 hover:underline"
            >
              <span>{reference}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Service:</span>
            <span className="font-semibold">{serviceTitle}</span>
          </div>

          {productName && (
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Product:</span>
              <span className="font-semibold text-right max-w-[200px] truncate">{productName}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Admin Processing Fee:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ₦{adminFeePaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Admin Controlled Post-Payment Guidance Notice */}
        {postPaymentNotice && (
          <div className="mt-4 rounded-2xl p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Important Notice
                </h4>
                <div className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 whitespace-pre-line leading-relaxed font-medium">
                  {postPaymentNotice}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          {/* Prominent Live Chat Support Button */}
          <button
            type="button"
            onClick={handleLiveChat}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Live Support Agent</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                isLight
                  ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <span>View in Transaction History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
