import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sun,
  Zap,
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
  BatteryCharging,
  Cpu,
  Search,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../services/api';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, NigeriaState, PhysicalProductItem, PhysicalProductSubmitResponse } from '../../types';
import PhysicalPinModal from './PhysicalPinModal';
import PhysicalSuccessModal from './PhysicalSuccessModal';

interface SolarFlowProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
  onRefreshWallet?: () => void;
}

export default function SolarFlow({
  currentUser,
  onBack,
  onNavigate,
  onRefreshWallet,
}: SolarFlowProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Navigation: 'catalog' | 'detail' | 'apply'
  const [viewState, setViewState] = useState<'catalog' | 'detail' | 'apply'>('catalog');

  // Products
  const [products, setProducts] = useState<PhysicalProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProductItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'All' | 'Systems' | 'Inverters' | 'Batteries'>('All');

  // AUTO-SLIDING CAROUSEL STATE (> 5 IMAGES REQUIREMENT)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoSlideTimerRef = useRef<any>(null);

  // Application Form
  const [buyingFor, setBuyingFor] = useState<'personal' | 'third_party'>('personal');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantNin, setApplicantNin] = useState('');
  const [stateName, setStateName] = useState('');
  const [lgaName, setLgaName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loadRequirements, setLoadRequirements] = useState('');
  const [selectedBatteryTier, setSelectedBatteryTier] = useState('Standard Capacity (Included)');

  const BATTERY_TIERS: { label: string; multiplier: number }[] = [
    { label: 'Standard Capacity (Included)', multiplier: 1.0 },
    { label: 'Extended Storage (+30%)', multiplier: 1.30 },
    { label: 'Double Battery Bank (+60%)', multiplier: 1.60 },
  ];

  const getDynamicSolarPrice = (product: PhysicalProductItem | null, tierLabel: string): number => {
    if (!product) return 0;
    const base = Number(product.price) || 0;
    const found = BATTERY_TIERS.find(t => t.label === tierLabel);
    const mult = found ? found.multiplier : 1.0;
    return Math.round((base * mult) / 100) * 100;
  };

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
          api.getPhysicalProductsCatalog('solar'),
          api.getPhysicalProductsStatesLgas(),
          api.getPhysicalProductsProfileData().catch(() => null),
        ]);

        if (isMounted) {
          if (catRes && catRes.products && catRes.products.length > 0) {
            setProducts(catRes.products);
          } else {
            // Fallback to fetch others if solar returns empty, filtering for solar/energy
            const fallbackRes = await api.getPhysicalProductsCatalog('others').catch(() => null);
            if (fallbackRes && fallbackRes.products) {
              setProducts(fallbackRes.products);
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
            setApplicantName(p.fullname || `${p.firstname} ${p.lastname}`.trim());
            setApplicantPhone(p.phone || '');
            if (p.nin) setApplicantNin(p.nin);
            if (p.state_name) setStateName(p.state_name);
            if (p.lga_name) setLgaName(p.lga_name);
            if (p.address) setDeliveryAddress(p.address);
          } else {
            setApplicantName(currentUser.name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim());
            setApplicantPhone(currentUser.phone || '');
            setApplicantNin(currentUser.nin || '');
          }
        }
      } catch (err: any) {
        console.error('Failed to load solar catalog', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carousel auto-slide timer (4 seconds per slide when not paused)
  useEffect(() => {
    if (viewState !== 'detail' || !selectedProduct) return;
    const galleryCount = selectedProduct.gallery_images?.length || 1;
    if (galleryCount <= 1) return;

    if (!isPaused) {
      autoSlideTimerRef.current = setInterval(() => {
        setActiveSlideIndex(prev => (prev + 1) % galleryCount);
      }, 4000);
    }
    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [viewState, selectedProduct, isPaused]);

  const handleSelectProduct = (product: PhysicalProductItem) => {
    setSelectedProduct(product);
    setActiveSlideIndex(0);
    setAdminFee(product.effective_admin_fee || 5000);
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
      setApplicantNin(currentUser.nin || '');
    } else {
      setApplicantName('');
      setApplicantPhone('');
      setApplicantNin('');
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
      toast.error('Please enter installation & delivery address.');
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
        service_type: 'solar',
        product_id: selectedProduct?.id,
        buying_for: buyingFor,
        applicant_name: applicantName.trim(),
        applicant_phone: applicantPhone.trim(),
        applicant_nin: applicantNin.trim(),
        state: stateName,
        lga: lgaName,
        delivery_address: deliveryAddress.trim(),
        notes: `Battery Tier: ${selectedBatteryTier} (Valuation: ₦${getDynamicSolarPrice(selectedProduct, selectedBatteryTier).toLocaleString()})${loadRequirements.trim() ? ' | Loads: ' + loadRequirements.trim() : ''}`,
        transaction_pin: enteredPin,
      };

      const res = await api.submitPhysicalProductRequest(payload);

      if (res && res.success) {
        setIsPinModalOpen(false);
        setSuccessData(res);
        toast.success('Solar request submitted successfully!');
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

  // Filter products by search and tabs
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (selectedCategoryTab === 'Systems') {
      return p.name.toLowerCase().includes('system') || p.name.toLowerCase().includes('kva');
    }
    if (selectedCategoryTab === 'Inverters') {
      return p.name.toLowerCase().includes('inverter') && !p.name.toLowerCase().includes('system');
    }
    if (selectedCategoryTab === 'Batteries') {
      return p.name.toLowerCase().includes('battery') || p.name.toLowerCase().includes('lithium') || p.name.toLowerCase().includes('tubular');
    }
    return true;
  });

  // -------------------------------------------------------------
  // VIEW 1: CATALOG
  // -------------------------------------------------------------
  if (viewState === 'catalog') {
    return (
      <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
        <header className="sticky top-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <h1 className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Solar &amp; Inverter Systems</span>
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Clean Energy &amp; Off-Grid Power</span>
            </div>
            <div className="w-8" />
          </div>

          {/* Search bar */}
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 1KVA, 3.5KVA, 5KVA, Felicity, Luminous..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border outline-none transition-all ${
                isLight
                  ? 'bg-slate-100 border-transparent focus:border-amber-500 focus:bg-white text-slate-900'
                  : 'bg-slate-800/80 border-slate-700/60 focus:border-amber-500 focus:bg-slate-800 text-white'
              }`}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['All', 'Systems', 'Inverters', 'Batteries'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategoryTab === tab
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab === 'All' ? 'All Solar Equipment' : tab}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
              <span className="text-xs">Loading clean energy systems...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Sun className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50 text-amber-500" />
              <p className="text-xs font-medium">No solar equipment currently matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(p => {
                const img = resolveImageUrl(p.featured_image) || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500';
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`rounded-2xl p-3 border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group ${
                      isLight ? 'bg-white border-slate-100 hover:border-amber-200' : 'bg-slate-900 border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden mb-2.5 flex items-center justify-center">
                        <img src={img} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
                          <Sun className="w-2.5 h-2.5" />
                          <span>Solar</span>
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-500 transition-colors">
                        {p.name}
                      </h3>
                      {p.brand && (
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {p.brand}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-black text-amber-500 dark:text-amber-400">
                        ₦{p.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>Survey Fee: ₦{p.effective_admin_fee?.toLocaleString() || '5,000'}</span>
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
  // VIEW 2: PRODUCT DETAIL
  // -------------------------------------------------------------
  if (viewState === 'detail' && selectedProduct) {
    const gallery = selectedProduct.gallery_images && selectedProduct.gallery_images.length > 0
      ? selectedProduct.gallery_images
      : [selectedProduct.featured_image || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500'];

    return (
      <div className={`min-h-screen pb-28 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
        {/* Detail Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewState('catalog')}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 font-display">
            Solar Equipment Specs
          </span>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: selectedProduct.name,
                  text: `Check out ${selectedProduct.name} on eData Solar`,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                toast.success('Link copied to clipboard');
              }
            }}
            className="p-2 -mr-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </header>

        <main className="max-w-md mx-auto px-4 pt-3">
          {/* Gallery Carousel */}
          <div
            className="relative rounded-3xl overflow-hidden bg-slate-900 mb-4 aspect-4/3 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <img
              src={resolveImageUrl(gallery[activeSlideIndex])}
              alt={selectedProduct.name}
              className="w-full h-full object-contain p-4 transition-all duration-500"
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/90 backdrop-blur-xs transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/90 backdrop-blur-xs transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        activeSlideIndex === idx ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-xs">
              {activeSlideIndex + 1} / {gallery.length}
            </span>
          </div>

          {/* Pricing & Title */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
              {selectedProduct.brand || 'Clean Energy Equipment'}
            </span>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mt-0.5 leading-snug">
              {selectedProduct.name}
            </h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-black text-amber-500 dark:text-amber-400 font-display">
                ₦{getDynamicSolarPrice(selectedProduct, selectedBatteryTier).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">System Valuation ({selectedBatteryTier.split(' ')[0]})</span>
            </div>
          </div>

          {/* Battery Storage Tier with Dynamic Valuation */}
          <div className={`p-4 rounded-2xl border space-y-2.5 mb-4 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Battery Storage Configuration
              </span>
              <span className="text-[11px] font-bold text-amber-500">
                ₦{getDynamicSolarPrice(selectedProduct, selectedBatteryTier).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {BATTERY_TIERS.map(t => {
                const isSelected = selectedBatteryTier === t.label;
                const priceForTier = getDynamicSolarPrice(selectedProduct, t.label);
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setSelectedBatteryTier(t.label)}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="block text-[11px] font-bold">{t.label.split(' ')[0]}</span>
                    <span className={`block text-[10px] font-extrabold mt-0.5 ${isSelected ? 'text-amber-100' : 'text-amber-500'}`}>
                      ₦{priceForTier.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Solar Highlights */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-900 border-slate-800'}`}>
              <Sun className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <div className="text-[10px] text-slate-400 font-medium">Power Source</div>
              <div className="text-[11px] font-bold text-slate-800 dark:text-white">Solar &amp; Grid</div>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-900 border-slate-800'}`}>
              <BatteryCharging className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <div className="text-[10px] text-slate-400 font-medium">Backup Type</div>
              <div className="text-[11px] font-bold text-slate-800 dark:text-white">Pure Sine Wave</div>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-900 border-slate-800'}`}>
              <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <div className="text-[10px] text-slate-400 font-medium">Installation</div>
              <div className="text-[11px] font-bold text-slate-800 dark:text-white">Engineer Setup</div>
            </div>
          </div>

          {/* Specifications */}
          {selectedProduct.specifications && (
            <div className={`p-4 rounded-2xl border mb-4 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>Technical Specifications</span>
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {selectedProduct.specifications}
              </p>
            </div>
          )}

          {/* Description */}
          {selectedProduct.description && (
            <div className={`p-4 rounded-2xl border mb-4 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-500" />
                <span>Product Overview &amp; Warranty</span>
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {selectedProduct.description}
              </p>
            </div>
          )}
        </main>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-30">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Site Survey / Admin Fee</div>
              <div className="text-base font-black text-amber-500">
                ₦{adminFee.toLocaleString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewState('apply')}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/25 active:scale-95 flex items-center gap-1.5"
            >
              <span>Continue to Submit Solar Specs</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: APPLICATION FORM
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen pb-28 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setViewState('detail')}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-500 font-display">
          Solar System Application
        </span>
        <div className="w-8" />
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Selected Product Banner */}
        {selectedProduct && (
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
            <img
              src={resolveImageUrl(selectedProduct.featured_image)}
              alt={selectedProduct.name}
              className="w-14 h-14 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Selected System</span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedProduct.name}</h3>
              <div className="text-xs font-black text-amber-500 mt-0.5">
                ₦{getDynamicSolarPrice(selectedProduct, selectedBatteryTier).toLocaleString('en-NG', { minimumFractionDigits: 2 })} ({selectedBatteryTier})
              </div>
            </div>
          </div>
        )}

        {/* Buying For Tabs */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Installation Beneficiary
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleToggleBuyingFor('personal')}
              className={`p-2.5 rounded-2xl text-xs font-bold border transition-all ${
                buyingFor === 'personal'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs shadow-amber-500/20'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-600'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              For Myself (Personal)
            </button>
            <button
              type="button"
              onClick={() => handleToggleBuyingFor('third_party')}
              className={`p-2.5 rounded-2xl text-xs font-bold border transition-all ${
                buyingFor === 'third_party'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs shadow-amber-500/20'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-600'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              For Family / Client
            </button>
          </div>
        </div>

        {/* Applicant Details */}
        <div className={`p-4 rounded-2xl border space-y-3.5 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-4 h-4 text-amber-500" />
            <span>Applicant &amp; Contact Info</span>
          </h4>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Full Legal Name</label>
            <input
              type="text"
              value={applicantName}
              onChange={e => setApplicantName(e.target.value)}
              placeholder="e.g. John Doe"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number (Call &amp; WhatsApp)</label>
            <input
              type="tel"
              value={applicantPhone}
              onChange={e => setApplicantPhone(e.target.value)}
              placeholder="08012345678"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">National Identity Number (NIN)</label>
            <input
              type="text"
              maxLength={11}
              value={applicantNin}
              onChange={e => setApplicantNin(e.target.value)}
              placeholder="11-digit NIN"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        {/* Delivery & Site Address */}
        <div className={`p-4 rounded-2xl border space-y-3.5 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Installation Site &amp; Delivery Address</span>
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">State</label>
              <select
                value={stateName}
                onChange={e => handleStateChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs border outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {statesList.map(s => (
                  <option key={s.id || s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">LGA</label>
              <select
                value={lgaName}
                onChange={e => setLgaName(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs border outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {currentLgas.map(l => (
                  <option key={l.id || l.name} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Full Site / Doorstep Address</label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="House/Plot number, Street, Landmark, Estate..."
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Appliances / Load Requirements (Optional)</label>
            <input
              type="text"
              value={loadRequirements}
              onChange={e => setLoadRequirements(e.target.value)}
              placeholder="e.g. 1 Freezer, 3 TVs, 6 Fans, 10 LED Lights, 2 Laptops"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        {/* Fee Notice */}
        <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${isLight ? 'bg-amber-50/70 border-amber-200/60' : 'bg-amber-950/20 border-amber-900/40'}`}>
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            An administrative &amp; technical site survey fee of <strong className="text-amber-500">₦{adminFee.toLocaleString()}</strong> will be debited from your wallet to schedule the engineer inspection and process logistics.
          </p>
        </div>
      </main>

      {/* Bottom Sticky Submit */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fee to Debit</div>
            <div className="text-base font-black text-amber-500">
              ₦{adminFee.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={handleInitiateApply}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/25 active:scale-95 flex items-center gap-1.5"
          >
            <span>Submit Solar Application to Admin</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PhysicalPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsPinModalOpen(false);
        }}
        onConfirm={handleConfirmPin}
        isSubmitting={isSubmitting}
        errorMessage={pinErrorMessage}
        title="Authorize Solar Application"
        amount={adminFee}
      />

      {/* Success Modal */}
      <PhysicalSuccessModal
        isOpen={Boolean(successData)}
        onClose={() => {
          setSuccessData(null);
          setViewState('catalog');
          if (onBack) onBack();
        }}
        data={successData}
        serviceTitle="Solar & Inverter Setup"
      />
    </div>
  );
}
