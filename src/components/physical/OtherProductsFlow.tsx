import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Tv,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Loader2,
  Share2,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../services/api';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, NigeriaState, PhysicalProductItem, PhysicalProductSubmitResponse } from '../../types';
import PhysicalPinModal from './PhysicalPinModal';
import PhysicalSuccessModal from './PhysicalSuccessModal';

interface OtherProductsFlowProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
  onRefreshWallet?: () => void;
}

export default function OtherProductsFlow({
  currentUser,
  onBack,
  onNavigate,
  onRefreshWallet,
}: OtherProductsFlowProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Navigation: 'catalog' | 'detail' | 'apply'
  const [viewState, setViewState] = useState<'catalog' | 'detail' | 'apply'>('catalog');

  // Products
  const [products, setProducts] = useState<PhysicalProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProductItem | null>(null);

  // AUTO-SLIDING CAROUSEL STATE (> 5 IMAGES REQUIREMENT)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoSlideTimerRef = useRef<any>(null);

  // Application Form
  const [buyingFor, setBuyingFor] = useState<'personal' | 'third_party'>('personal');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [stateName, setStateName] = useState('');
  const [lgaName, setLgaName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // States & LGAs
  const [statesList, setStatesList] = useState<NigeriaState[]>([]);

  // Checkout
  const [adminFee, setAdminFee] = useState(5000);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<PhysicalProductSubmitResponse | null>(null);

  // Load catalog on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [catRes, statesRes, profRes] = await Promise.all([
          api.getPhysicalProductsCatalog('others'),
          api.getPhysicalProductsStatesLgas(),
          api.getPhysicalProductsProfileData().catch(() => null),
        ]);

        if (isMounted) {
          if (catRes && catRes.products) {
            setProducts(catRes.products);
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
            setApplicantName(p.fullname || `${p.firstname} ${p.lastname}`.trim());
            setApplicantPhone(p.phone || '');
            if (p.state_name) setStateName(p.state_name);
            if (p.lga_name) setLgaName(p.lga_name);
            if (p.address) setDeliveryAddress(p.address);
          } else {
            setApplicantName(currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
            setApplicantPhone(currentUser.phone || '');
          }
        }
      } catch (err: any) {
        console.error('Failed to load other products catalog', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Carousel Auto-Slide (every 3.5 seconds)
  useEffect(() => {
    if (viewState !== 'detail' || !selectedProduct) return;

    const gallery = selectedProduct.gallery_images || [];
    if (gallery.length <= 1 || isPaused) return;

    autoSlideTimerRef.current = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % gallery.length);
    }, 3500);

    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [viewState, selectedProduct, isPaused]);

  const handleSelectProduct = (prod: PhysicalProductItem) => {
    setSelectedProduct(prod);
    setActiveSlideIndex(0);
    setAdminFee(prod.effective_admin_fee || 5000);
    setViewState('detail');
  };

  const handlePrevSlide = () => {
    if (!selectedProduct) return;
    const len = selectedProduct.gallery_images?.length || 1;
    setActiveSlideIndex(prev => (prev - 1 + len) % len);
  };

  const handleNextSlide = () => {
    if (!selectedProduct) return;
    const len = selectedProduct.gallery_images?.length || 1;
    setActiveSlideIndex(prev => (prev + 1) % len);
  };

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

  const handleInitiateApply = () => {
    if (!currentUser.has_kyc && !currentUser.hasKyc) {
      toast.error('KYC verification required. Please complete identity verification in Profile.');
      return;
    }
    if (!applicantName.trim()) {
      toast.error('Please enter the applicant full name.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.length < 10) {
      toast.error('Please enter a valid applicant phone number.');
      return;
    }
    if (!stateName || !lgaName) {
      toast.error('Please select delivery state and LGA.');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address.');
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
        service_type: 'others',
        product_id: selectedProduct?.id,
        buying_for: buyingFor,
        applicant_name: applicantName.trim(),
        applicant_phone: applicantPhone.trim(),
        state: stateName,
        lga: lgaName,
        delivery_address: deliveryAddress.trim(),
        notes: notes.trim(),
        transaction_pin: enteredPin,
      };

      const res = await api.submitPhysicalProductRequest(payload);

      if (res && res.success) {
        setIsPinModalOpen(false);
        setSuccessData(res);
        toast.success('Product request submitted successfully!');
        if (onRefreshWallet) onRefreshWallet();
      } else {
        const errorMsg = res?.error || 'Failed to submit request.';
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

  // -------------------------------------------------------------
  // VIEW 1: CATALOG
  // -------------------------------------------------------------
  if (viewState === 'catalog') {
    return (
      <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
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
              <Tv className="w-4 h-4 text-sky-500" />
              <span>Other Physical Products</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-medium">Smart TVs, Solar &amp; Utilities</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="max-w-md mx-auto px-4 pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
              <span className="text-xs">Loading available products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Tv className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-xs font-medium">No utility products currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => {
                const img = resolveImageUrl(p.featured_image) || 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500';
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`rounded-2xl p-3 border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden mb-2.5 flex items-center justify-center">
                        <img src={img} alt={p.name} className="w-full h-full object-contain p-2 hover:scale-105 transition-transform" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-600 text-white shadow-xs">
                          {p.gallery_images?.length || 1}+ Photos
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-black text-sky-500 dark:text-emerald-400">
                        ₦{p.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Admin Fee: ₦{p.effective_admin_fee?.toLocaleString() || '5,000'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: PRODUCT DETAIL (AUTO-SLIDING CAROUSEL > 5 IMAGES)
  // -------------------------------------------------------------
  if (viewState === 'detail' && selectedProduct) {
    const gallery = selectedProduct.gallery_images && selectedProduct.gallery_images.length > 0
      ? selectedProduct.gallery_images
      : [selectedProduct.featured_image || 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500'];

    return (
      <div className={`min-h-screen pb-28 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewState('catalog')}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold truncate max-w-[200px]">{selectedProduct.name}</span>
          <div className="w-8" />
        </header>

        <main className="max-w-md mx-auto space-y-4">
          {/* AUTO-SLIDING IMAGE CAROUSEL (> 5 IMAGES REQUIREMENT) */}
          <div
            className="relative aspect-video w-full bg-white dark:bg-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 overflow-hidden group select-none"
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <img
              src={resolveImageUrl(gallery[activeSlideIndex]) || gallery[activeSlideIndex]}
              alt={`${selectedProduct.name} image ${activeSlideIndex + 1}`}
              className="w-full h-full object-contain p-4 transition-all duration-500 ease-in-out"
            />

            {/* Photo Counter Pill: e.g. 1/6 */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md flex items-center gap-1.5">
              <span>Photo</span>
              <span>{activeSlideIndex + 1}/{gallery.length}</span>
            </div>

            {/* Auto-Slide Indicator Pill */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white backdrop-blur-md">
              {isPaused ? 'Paused' : 'Auto-sliding'}
            </div>

            {/* Left & Right Nav Chevrons */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Thumbnail Navigation Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeSlideIndex === idx ? 'w-5 bg-sky-600 dark:bg-emerald-400' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-4 space-y-4">
            {/* Title & Price */}
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {selectedProduct.name}
              </h2>

              <div className="mt-2 text-2xl font-black font-display text-sky-500 dark:text-emerald-400">
                ₦{selectedProduct.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>

              <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                <span>Administrative Fee:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  ₦{adminFee.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description & Specifications */}
            {selectedProduct.description && (
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
                  Product Overview
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedProduct.description}
                </p>
              </div>
            )}

            {/* Delivery & Platform Role Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>eData Fulfillment Notice</span>
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                eData operates as a verified intermediary between customers and accredited wholesale merchants. Paying the Administrative Fee initiates background checks, warehouse dispatch, and delivery coordination.
              </p>
            </div>
          </div>
        </main>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-between max-w-md mx-auto z-30">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Processing Fee</span>
            <div className="text-base font-black text-sky-500 dark:text-emerald-400">
              ₦{adminFee.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setViewState('apply')}
            className="py-3 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Request This Product</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: APPLICATION FORM
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setViewState('detail')}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold font-display tracking-tight">Delivery Details</h1>
          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
            {selectedProduct?.name}
          </span>
        </div>
        <div className="w-8" />
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Toggle Personal vs Another Person */}
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Who are you ordering this item for?
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
        </div>

        {/* Form Fields */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            <span>Delivery Destination</span>
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={applicantName}
              onChange={e => setApplicantName(e.target.value)}
              placeholder="Full name"
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
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">State *</label>
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
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">LGA *</label>
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
              Delivery Address *
            </label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Street name, house number, area"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none resize-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Special Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Call before delivery"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleInitiateApply}
            className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pay ₦{adminFee.toLocaleString()} Administrative Fee &amp; Submit</span>
          </button>
        </div>
      </main>

      {/* PIN Confirmation */}
      <PhysicalPinModal
        isOpen={isPinModalOpen}
        serviceTitle={selectedProduct?.name || 'Utility Product'}
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

      {/* Success Modal */}
      {successData && (
        <PhysicalSuccessModal
          isOpen={true}
          reference={successData.reference || ''}
          serviceTitle="Physical Product Request"
          productName={selectedProduct?.name}
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
