import React, { useState, useEffect } from 'react';
import { Phone, ShieldCheck, Check, X, Loader2, MessageCircle } from 'lucide-react';
import { useToast } from './Toast';
import { useBackHandler } from '../utils/backHandler';

interface ContactInfoModalProps {
  isOpen: boolean;
  isForced?: boolean;
  initialPhone?: string;
  initialWhatsapp?: string;
  onSave: (phone: string, whatsapp: string) => Promise<boolean | void>;
  onDismiss: () => void;
}

// Nigerian Telecom Carrier Prefix Detection
function detectCarrier(rawPhone: string) {
  const clean = rawPhone.replace(/\D/g, '');
  let prefix = '';
  if (clean.startsWith('234') && clean.length >= 6) {
    prefix = '0' + clean.slice(3, 6);
  } else if (clean.startsWith('0') && clean.length >= 4) {
    prefix = clean.slice(0, 4);
  } else if (clean.length >= 3) {
    prefix = '0' + clean.slice(0, 3);
  }

  const mtn = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  const airtel = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'];
  const glo = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const etisalat = ['0809', '0817', '0818', '0909', '0908'];

  if (mtn.includes(prefix)) {
    return { name: 'MTN 🟡', badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30' };
  }
  if (airtel.includes(prefix)) {
    return { name: 'Airtel 🔴', badgeClass: 'bg-rose-500/15 text-rose-500 border-rose-500/30' };
  }
  if (glo.includes(prefix)) {
    return { name: 'Glo 🟢', badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' };
  }
  if (etisalat.includes(prefix)) {
    return { name: '9mobile 🟢', badgeClass: 'bg-teal-500/15 text-teal-500 border-teal-500/30' };
  }
  return null;
}

export default function ContactInfoModal({
  isOpen,
  isForced = false,
  initialPhone = '',
  initialWhatsapp = '',
  onSave,
  onDismiss,
}: ContactInfoModalProps) {
  const toast = useToast();

  const [phone, setPhone] = useState(initialPhone);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp || initialPhone);
  const [syncSame, setSyncSame] = useState(!initialWhatsapp || initialWhatsapp === initialPhone);
  const [saving, setSaving] = useState(false);

  // Sync state if initial props change
  useEffect(() => {
    if (initialPhone) {
      setPhone(initialPhone);
      if (!initialWhatsapp || initialWhatsapp === initialPhone) {
        setWhatsapp(initialPhone);
        setSyncSame(true);
      }
    }
    if (initialWhatsapp && initialWhatsapp !== initialPhone) {
      setWhatsapp(initialWhatsapp);
      setSyncSame(false);
    }
  }, [initialPhone, initialWhatsapp]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Hardware Android back button handler
  useBackHandler(isOpen && !isForced, () => {
    onDismiss();
  });

  if (!isOpen) return null;

  const carrier = detectCarrier(phone);

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^\d+]/g, '');
    setPhone(clean);
    if (syncSame) {
      setWhatsapp(clean);
    }
  };

  const handleWhatsappChange = (val: string) => {
    const clean = val.replace(/[^\d+]/g, '');
    setWhatsapp(clean);
  };

  const handleToggleSync = (checked: boolean) => {
    setSyncSame(checked);
    if (checked) {
      setWhatsapp(phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.trim();
    const cleanWhatsapp = syncSame ? cleanPhone : whatsapp.trim();

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.warning('Please enter a valid 11-digit Nigerian phone number.');
      return;
    }

    if (!cleanWhatsapp || cleanWhatsapp.length < 10) {
      toast.warning('Please enter a valid WhatsApp number.');
      return;
    }

    setSaving(true);
    try {
      await onSave(cleanPhone, cleanWhatsapp);
      toast.success('Phone and WhatsApp contacts updated successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update contact info. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        onClick={() => {
          if (!isForced && !saving) onDismiss();
        }}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-white z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-sky-500/15 rounded-full filter blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-emerald-500 p-0.5 shadow-lg shadow-sky-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-slate-900 shadow">
                <MessageCircle className="w-2.5 h-2.5 fill-current" />
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 font-mono">
                ACCOUNT VERIFICATION
              </span>
              <h2 className="text-base font-black text-white leading-tight font-display">
                Complete Contact Info
              </h2>
            </div>
          </div>

          {/* Dismiss Button (Only if not forced) */}
          {!isForced && (
            <button
              type="button"
              onClick={onDismiss}
              disabled={saving}
              title="Remind Me Later"
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700/60 text-xs transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Provide your phone number and WhatsApp contact to receive instant SMS transaction receipts, token delivery, and dedicated customer support.
        </p>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* FIELD 1: Primary Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal_phone" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <span>Phone Number</span>
                <span className="text-rose-400">*</span>
              </label>
              {carrier && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${carrier.badgeClass}`}>
                  {carrier.name}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 pr-2 border-r border-slate-700 pointer-events-none">
                <span className="text-sm">🇳🇬</span>
                <span className="text-xs font-bold text-slate-300 font-mono">+234</span>
              </div>
              <input
                id="modal_phone"
                type="tel"
                placeholder="08012345678"
                maxLength={11}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-2xl py-2.5 pl-24 pr-4 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500/20 font-mono transition-all"
              />
            </div>
          </div>

          {/* CHECKBOX: Same as Phone Number */}
          <div className="flex items-center justify-between py-0.5 px-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncSame}
                onChange={(e) => handleToggleSync(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-300">
                WhatsApp is same as Phone Number
              </span>
            </label>
          </div>

          {/* FIELD 2: WhatsApp Number */}
          <div className={`transition-all ${syncSame ? 'opacity-65' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal_whatsapp" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>WhatsApp Number</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                {syncSame ? 'Synced with Phone' : 'Custom Number'}
              </span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 pr-2 border-r border-slate-700 pointer-events-none">
                <span className="text-sm">🇳🇬</span>
                <span className="text-xs font-bold text-slate-300 font-mono">+234</span>
              </div>
              <input
                id="modal_whatsapp"
                type="tel"
                placeholder="08012345678"
                maxLength={11}
                disabled={syncSame}
                value={syncSame ? phone : whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-2xl py-2.5 pl-24 pr-4 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Security Assurance */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your numbers are kept strictly confidential for eData account services only.</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-sky-500 via-sky-600 to-emerald-600 hover:from-sky-400 hover:to-emerald-500 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Continue</span>
                </>
              )}
            </button>

            {/* Remind Me Later */}
            {!isForced && (
              <button
                type="button"
                onClick={onDismiss}
                disabled={saving}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
