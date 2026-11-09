import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Zap,
  MapPin,
  User,
  Phone,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building2,
  HelpCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, NigeriaState, PhysicalProductSubmitResponse } from '../../types';
import PhysicalPinModal from './PhysicalPinModal';
import PhysicalSuccessModal from './PhysicalSuccessModal';

interface PrepaidMeterFlowProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
  onRefreshWallet?: () => void;
}

export default function PrepaidMeterFlow({
  currentUser,
  onBack,
  onNavigate,
  onRefreshWallet,
}: PrepaidMeterFlowProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // State
  const [buyingFor, setBuyingFor] = useState<'personal' | 'third_party'>('personal');
  const [selectedDisco, setSelectedDisco] = useState<string>('yedc');
  const [meterType, setMeterType] = useState<string>('1 Phase');
  const [hasOldMeter, setHasOldMeter] = useState<boolean>(false);
  const [oldMeterNumber, setOldMeterNumber] = useState<string>('');
  const [nameOnBill, setNameOnBill] = useState<string>('');

  // Applicant fields
  const [applicantName, setApplicantName] = useState<string>('');
  const [applicantPhone, setApplicantPhone] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [lgaName, setLgaName] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  // States & LGAs from Backend
  const [statesList, setStatesList] = useState<NigeriaState[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);

  // Admin Fee & Services Config
  const [adminFee, setAdminFee] = useState<number>(5000);
  const [discosList, setDiscosList] = useState<{ id: string; name: string }[]>([]);

  // Checkout & PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');

  // Success Modal State
  const [successData, setSuccessData] = useState<PhysicalProductSubmitResponse | null>(null);

  // Load backend states, LGAs, and services config
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingLocations(true);
      try {
        const [servicesRes, statesRes, profileRes] = await Promise.all([
          api.getPhysicalProductServices(),
          api.getPhysicalProductsStatesLgas(),
          api.getPhysicalProductsProfileData().catch(() => null),
        ]);

        if (isMounted) {
          if (servicesRes && servicesRes.services) {
            const meterServ = servicesRes.services.find((s: any) => s.key === 'prepaid_meter');
            if (meterServ) {
              setAdminFee(meterServ.admin_fee || 5000);
              if (meterServ.discos && meterServ.discos.length > 0) {
                setDiscosList(meterServ.discos);
                setSelectedDisco(meterServ.discos[0].id);
              }
            }
          }

          if (statesRes && statesRes.states) {
            setStatesList(statesRes.states);
            if (statesRes.states.length > 0 && !stateName) {
              setStateName(statesRes.states[0].name);
              if (statesRes.states[0].lgas && statesRes.states[0].lgas.length > 0) {
                setLgaName(statesRes.states[0].lgas[0].name);
              }
            }
          }

          // Auto-fill personal details
          if (profileRes && profileRes.data) {
            const p = profileRes.data;
            if (buyingFor === 'personal') {
              setApplicantName(p.fullname || `${p.firstname} ${p.lastname}`.trim());
              setApplicantPhone(p.phone || '');
              if (p.state_name) setStateName(p.state_name);
              if (p.lga_name) setLgaName(p.lga_name);
              if (p.address) setDeliveryAddress(p.address);
            }
          } else {
            // Fallback from currentUser prop
            if (buyingFor === 'personal') {
              setApplicantName(currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
              setApplicantPhone(currentUser.phone || '');
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial prepaid meter data', err);
      } finally {
        if (isMounted) setIsLoadingLocations(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update fields when switching between personal and third_party
  const handleToggleBuyingFor = (type: 'personal' | 'third_party') => {
    setBuyingFor(type);
    if (type === 'personal') {
      setApplicantName(currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
      setApplicantPhone(currentUser.phone || '');
    } else {
      setApplicantName('');
      setApplicantPhone('');
    }
  };

  // Find LGAs for selected state
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

  // Pre-submission validation
  const handleInitiatePayment = () => {
    // 1. KYC Validation
    if (!currentUser.has_kyc && !currentUser.hasKyc) {
      toast.error('KYC verification required. Please complete your identity verification in Profile settings.');
      return;
    }

    // 2. Form validations
    if (!applicantName.trim()) {
      toast.error('Please enter the applicant full name.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.length < 10) {
      toast.error('Please enter a valid applicant contact phone number.');
      return;
    }
    if (!stateName || !lgaName) {
      toast.error('Please select both state and LGA.');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Please enter the physical property delivery address.');
      return;
    }
    if (hasOldMeter && !oldMeterNumber.trim()) {
      toast.error('Please enter your existing meter number or account number.');
      return;
    }

    // Open PIN confirmation sheet
    setPinErrorMessage('');
    setIsPinModalOpen(true);
  };

  // Confirm Payment & Submit Request via API
  const handleConfirmPin = async (enteredPin: string) => {
    setIsSubmitting(true);
    setPinErrorMessage('');

    try {
      const payload = {
        service_type: 'prepaid_meter',
        buying_for: buyingFor,
        disco: selectedDisco,
        meter_type: meterType,
        has_old_meter: hasOldMeter ? 1 : 0,
        old_meter_number: oldMeterNumber.trim(),
        name_on_bill: nameOnBill.trim(),
        state: stateName,
        lga: lgaName,
        delivery_address: deliveryAddress.trim(),
        applicant_name: applicantName.trim(),
        applicant_phone: applicantPhone.trim(),
        transaction_pin: enteredPin,
      };

      const res = await api.submitPhysicalProductRequest(payload);

      if (res && res.success) {
        setIsPinModalOpen(false);
        setSuccessData(res);
        toast.success('Prepaid meter request submitted successfully!');
        if (onRefreshWallet) onRefreshWallet();
      } else {
        const errorMsg = res?.error || 'Failed to submit prepaid meter request.';
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
    <div className={`min-h-screen pb-36 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Prepaid Meter Application</span>
          </h1>
          <span className="text-[10px] text-slate-500 font-medium">Certified DisCo Onboarding</span>
        </div>
        <div className="w-8" />
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Banner Notice */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
              DisCo Certified Metering Process
            </h3>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              Non-refundable administrative fee of ₦{adminFee.toLocaleString()} covers physical inspection, verification, and dispatch coordination.
            </p>
          </div>
        </div>

        {/* 1. Buying For Toggle */}
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Who are you requesting this meter for?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleToggleBuyingFor('personal')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                buyingFor === 'personal'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Use</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleBuyingFor('third_party')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                buyingFor === 'third_party'
                  ? 'bg-sky-600 text-white shadow-sm'
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
            <p className="text-[11px] text-sky-500 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Your logged-in profile will automatically be recorded as the Guarantor.
            </p>
          )}
        </div>

        {/* 2. DisCo & Meter Type */}
        <div className={`p-4 rounded-2xl border space-y-3.5 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Distribution Company (DisCo)
            </label>
            <select
              value={selectedDisco}
              onChange={e => setSelectedDisco(e.target.value)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {discosList.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Meter Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['1 Phase', '3 Phase', 'MD'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeterType(m)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    meterType === m
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Existing Meter / Old Bill Indicator */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Existing Bill or Old Meter?</span>
              <p className="text-[11px] text-slate-500">Do you have an existing account on this property?</p>
            </div>
            <button
              type="button"
              onClick={() => setHasOldMeter(!hasOldMeter)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                hasOldMeter ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  hasOldMeter ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {hasOldMeter && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Old Meter Number / Account Number *
                </label>
                <input
                  type="text"
                  value={oldMeterNumber}
                  onChange={e => setOldMeterNumber(e.target.value)}
                  placeholder="e.g. 04123456789"
                  className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Name on Bill (Optional)
                </label>
                <input
                  type="text"
                  value={nameOnBill}
                  onChange={e => setNameOnBill(e.target.value)}
                  placeholder="e.g. Alh. Musa Bello"
                  className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Applicant Details & Location */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            <span>Applicant & Installation Address</span>
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Applicant Full Name *
            </label>
            <input
              type="text"
              value={applicantName}
              onChange={e => setApplicantName(e.target.value)}
              placeholder="e.g. John Doe"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Contact Phone Number *
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
              Premises Installation Address *
            </label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="e.g. Plot 15, Airport Road, near Central Mosque"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none resize-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

      </main>

      {/* Sticky Bottom Submit Bar */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-40 max-w-md mx-auto shadow-2xl safe-bottom">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Fee</span>
            <div className="text-base font-black text-sky-500 dark:text-emerald-400 font-mono">
              ₦{adminFee.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={handleInitiatePayment}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Submit Meter Application to Admin</span>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-1.5">
          Admin fee is deducted from your wallet balance upon PIN confirmation
        </p>
      </div>

      {/* PIN Confirmation Modal */}
      <PhysicalPinModal
        isOpen={isPinModalOpen}
        serviceTitle="Prepaid Meter Application"
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

      {/* Success Sheet Modal */}
      {successData && (
        <PhysicalSuccessModal
          isOpen={true}
          reference={successData.reference || ''}
          serviceTitle="Prepaid Meter Request"
          productName={`${selectedDisco.toUpperCase()} - ${meterType}`}
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
