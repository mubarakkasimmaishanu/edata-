import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CreditCard,
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, NigeriaState, PhysicalProductSubmitResponse } from '../../types';
import PhysicalPinModal from './PhysicalPinModal';
import PhysicalSuccessModal from './PhysicalSuccessModal';

interface PosDeviceFlowProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
  onRefreshWallet?: () => void;
}

export default function PosDeviceFlow({
  currentUser,
  onBack,
  onNavigate,
  onRefreshWallet,
}: PosDeviceFlowProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Form State
  const [selectedBrand, setSelectedBrand] = useState('Moniepoint');
  const [buyingFor, setBuyingFor] = useState<'personal' | 'third_party'>('personal');
  const [posType, setPosType] = useState('Digital (Android)');

  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantNin, setApplicantNin] = useState('');
  const [applicantBvn, setApplicantBvn] = useState('');
  const [stateName, setStateName] = useState('');
  const [lgaName, setLgaName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // States & LGAs
  const [statesList, setStatesList] = useState<NigeriaState[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Config
  const [adminFee, setAdminFee] = useState(5000);
  const [brandsList, setBrandsList] = useState<string[]>(['Moniepoint', 'Kuda', 'Kolomoni', 'OPay', 'Palmpay']);

  // Checkout State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<PhysicalProductSubmitResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingLocations(true);
      try {
        const [servRes, statesRes, profRes] = await Promise.all([
          api.getPhysicalProductServices(),
          api.getPhysicalProductsStatesLgas(),
          api.getPhysicalProductsProfileData().catch(() => null),
        ]);

        if (isMounted) {
          if (servRes && servRes.services) {
            const posServ = servRes.services.find((s: any) => s.key === 'pos_device');
            if (posServ) {
              setAdminFee(posServ.admin_fee || 5000);
              if (posServ.brands && posServ.brands.length > 0) {
                setBrandsList(posServ.brands);
              }
            }
          }

          if (statesRes && statesRes.states) {
            setStatesList(statesRes.states);
            if (statesRes.states.length > 0) {
              setStateName(statesRes.states[0].name);
              if (statesRes.states[0].lgas && statesRes.states[0].lgas.length > 0) {
                setLgaName(statesRes.states[0].lgas[0].name);
              }
            }
          }

          if (profRes && profRes.data) {
            const p = profRes.data;
            if (buyingFor === 'personal') {
              setApplicantName(p.fullname || `${p.firstname} ${p.lastname}`.trim());
              setApplicantPhone(p.phone || '');
              setApplicantNin(p.nin || '');
              setApplicantBvn(p.bvn || '');
              if (p.state_name) setStateName(p.state_name);
              if (p.lga_name) setLgaName(p.lga_name);
              if (p.address) setDeliveryAddress(p.address);
            }
          } else {
            if (buyingFor === 'personal') {
              setApplicantName(currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
              setApplicantPhone(currentUser.phone || '');
              setApplicantNin(currentUser.nin || '');
              setApplicantBvn(currentUser.bvn || '');
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load POS configuration', err);
      } finally {
        if (isMounted) setIsLoadingLocations(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleBuyingFor = (type: 'personal' | 'third_party') => {
    setBuyingFor(type);
    if (type === 'personal') {
      setApplicantName(currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
      setApplicantPhone(currentUser.phone || '');
      setApplicantNin(currentUser.nin || '');
      setApplicantBvn(currentUser.bvn || '');
    } else {
      setApplicantName('');
      setApplicantPhone('');
      setApplicantNin('');
      setApplicantBvn('');
    }
  };

  const selectedStateObj = statesList.find(s => s.name === stateName);
  const currentLgas = selectedStateObj ? selectedStateObj.lgas : [];

  const handleStateChange = (newVal: string) => {
    setStateName(newVal);
    const found = statesList.find(s => s.name === newVal);
    if (found && found.lgas && found.lgas.length > 0) {
      setLgaName(found.lgas[0].name);
    } else {
      setLgaName('');
    }
  };

  const handleInitiatePayment = () => {
    if (!currentUser.has_kyc && !currentUser.hasKyc) {
      toast.error('KYC verification required. Please complete your identity verification in Profile settings.');
      return;
    }

    if (!applicantName.trim()) {
      toast.error('Please enter the merchant / applicant full name.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.length < 10) {
      toast.error('Please enter a valid applicant phone number.');
      return;
    }
    if (!applicantNin.trim() || applicantNin.length < 11) {
      toast.error('Applicant 11-digit NIN is required for POS merchant registration.');
      return;
    }
    if (!applicantBvn.trim() || applicantBvn.length < 11) {
      toast.error('Applicant 11-digit BVN is required for POS bank settlement account linking.');
      return;
    }
    if (!stateName || !lgaName) {
      toast.error('Please select State and LGA.');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Please enter business or delivery address.');
      return;
    }

    setPinErrorMessage('');
    setIsPinModalOpen(true);
  };

  const handleConfirmPin = async (enteredPin: string) => {
    setIsSubmitting(true);
    setPinErrorMessage('');

    try {
      const payload = {
        service_type: 'pos_device',
        buying_for: buyingFor,
        brand: selectedBrand,
        pos_type: posType,
        state: stateName,
        lga: lgaName,
        delivery_address: deliveryAddress.trim(),
        applicant_name: applicantName.trim(),
        applicant_phone: applicantPhone.trim(),
        applicant_nin: applicantNin.trim(),
        applicant_bvn: applicantBvn.trim(),
        transaction_pin: enteredPin,
      };

      const res = await api.submitPhysicalProductRequest(payload);

      if (res && res.success) {
        setIsPinModalOpen(false);
        setSuccessData(res);
        toast.success('POS device request submitted successfully!');
        if (onRefreshWallet) onRefreshWallet();
      } else {
        const errorMsg = res?.error || 'Failed to submit POS request.';
        setPinErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'A network error occurred. Please try again.';
      setPinErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary" />
            <span>POS Device Purchase</span>
          </h1>
          <span className="text-[10px] text-slate-500 font-medium">Agency Banking Terminals</span>
        </div>
        <div className="w-8" />
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* CRITICAL 60-DAY INACTIVITY RETRIEVAL WARNING CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">
              60-Day Terminal Inactivity &amp; Retrieval Policy
            </h3>
            <p className="text-[11px] text-rose-800 dark:text-rose-300/90 mt-0.5 leading-relaxed">
              If an assigned POS terminal remains inactive for <strong>60 consecutive days</strong>, it will automatically be blocked on the host switch and flagged for recovery/retrieval by company field agents.
            </p>
          </div>
        </div>

        {/* 1. Brand Selection */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Terminal Brand
          </label>
          <div className="grid grid-cols-3 gap-2">
            {brandsList.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBrand(b)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  selectedBrand === b
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Personal vs Another Person Toggle */}
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Who is this POS terminal for?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleToggleBuyingFor('personal')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                buyingFor === 'personal'
                  ? 'bg-primary text-white shadow-sm'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Business</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleBuyingFor('third_party')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                buyingFor === 'third_party'
                  ? 'bg-primary text-white shadow-sm'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Another Person</span>
            </button>
          </div>

          {buyingFor === 'third_party' && (
            <p className="text-[11px] text-primary dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Your account details will automatically be attached as Guarantor.
            </p>
          )}
        </div>

        {/* 3. POS Terminal Type */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Hardware Terminal Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Digital (Android)', 'MPOS (Traditional)'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setPosType(t)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  posType === t
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Merchant Identification Details */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Merchant &amp; Settlement Details</span>
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Applicant / Merchant Full Name *
            </label>
            <input
              type="text"
              value={applicantName}
              onChange={e => setApplicantName(e.target.value)}
              placeholder="Full legal name"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Applicant Contact Phone Number *
            </label>
            <input
              type="tel"
              value={applicantPhone}
              onChange={e => setApplicantPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Applicant NIN *
              </label>
              <input
                type="text"
                maxLength={11}
                value={applicantNin}
                onChange={e => setApplicantNin(e.target.value.replace(/\D/g, ''))}
                placeholder="11-digit NIN"
                className={`w-full py-2 px-3 rounded-xl text-xs border outline-none font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Applicant BVN *
              </label>
              <input
                type="text"
                maxLength={11}
                value={applicantBvn}
                onChange={e => setApplicantBvn(e.target.value.replace(/\D/g, ''))}
                placeholder="11-digit BVN"
                className={`w-full py-2 px-3 rounded-xl text-xs border outline-none font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                State *
              </label>
              <select
                value={stateName}
                onChange={e => handleStateChange(e.target.value)}
                className={`w-full py-2 px-2.5 rounded-xl text-xs border outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {statesList.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                LGA *
              </label>
              <select
                value={lgaName}
                onChange={e => setLgaName(e.target.value)}
                className={`w-full py-2 px-2.5 rounded-xl text-xs border outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {currentLgas.map(l => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Business / Delivery Address *
            </label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Shop or office address, street name and landmark"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none resize-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleInitiatePayment}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pay ₦{adminFee.toLocaleString()} Administrative Fee &amp; Submit</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Non-refundable administrative fee is debited directly from your eData wallet
          </p>
        </div>
      </main>

      {/* PIN Confirmation */}
      <PhysicalPinModal
        isOpen={isPinModalOpen}
        serviceTitle={`POS Terminal: ${selectedBrand} (${posType})`}
        adminFee={adminFee}
        walletBalance={currentUser.walletBalance || 0}
        isSubmitting={isSubmitting}
        errorMessage={pinErrorMessage}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmPin}
        onFundWallet={() => {
          setIsPinModalOpen(false);
          if (onNavigate) onNavigate('fund');
        }}
      />

      {/* Success Sheet */}
      {successData && (
        <PhysicalSuccessModal
          isOpen={true}
          reference={successData.reference || ''}
          serviceTitle="POS Device Request"
          productName={`${selectedBrand} - ${posType}`}
          adminFeePaid={successData.admin_fee_paid || adminFee}
          postPaymentNotice={successData.post_payment_notice || ''}
          liveChatUrl={successData.live_chat_url}
          onClose={() => {
            setSuccessData(null);
            onBack();
          }}
          onViewHistory={() => {
            setSuccessData(null);
            if (onNavigate) onNavigate('history');
          }}
        />
      )}
    </div>
  );
}
