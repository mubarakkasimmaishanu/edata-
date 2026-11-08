import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Smartphone,
  Star,
  Truck,
  ShieldCheck,
  Check,
  ChevronRight,
  User,
  Phone,
  CreditCard,
  MessageSquare,
  Search,
  Filter,
  SlidersHorizontal,
  Info,
  Clock,
  Sparkles,
  Share2,
  Loader2,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../services/api';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import {
  UserProfile,
  NigeriaState,
  PhysicalProductItem,
  PhysicalProductPlan,
  PhysicalProductSubmitResponse,
} from '../../types';
import PhysicalPinModal from './PhysicalPinModal';
import PhysicalSuccessModal from './PhysicalSuccessModal';

interface InstallmentPhoneFlowProps {
  currentUser: UserProfile;
  onBack: () => void;
  onNavigate?: (view: string) => void;
  onRefreshWallet?: () => void;
}

export default function InstallmentPhoneFlow({
  currentUser,
  onBack,
  onNavigate,
  onRefreshWallet,
}: InstallmentPhoneFlowProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Navigation within flow: 'catalog' | 'detail' | 'apply'
  const [viewState, setViewState] = useState<'catalog' | 'detail' | 'apply'>('catalog');

  // Catalog State
  const [products, setProducts] = useState<PhysicalProductItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProductItem | null>(null);

  // Detail State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<PhysicalProductPlan | null>(null);
  const [selectedStorage, setSelectedStorage] = useState('128GB');
  const [selectedColor, setSelectedColor] = useState('Phantom Black');

  // Application Form State
  const [buyingFor, setBuyingFor] = useState<'personal' | 'third_party'>('personal');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantNin, setApplicantNin] = useState('');
  const [stateName, setStateName] = useState('');
  const [lgaName, setLgaName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // States & LGAs
  const [statesList, setStatesList] = useState<NigeriaState[]>([]);

  // Checkout State
  const [adminFee, setAdminFee] = useState(5000);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<PhysicalProductSubmitResponse | null>(null);

  // Load Catalog & Locations on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingCatalog(true);
      try {
        const [catRes, statesRes, profileRes] = await Promise.all([
          api.getPhysicalProductsCatalog('installment_phone'),
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

          if (profileRes && profileRes.data) {
            const p = profileRes.data;
            setApplicantName(p.fullname || `${p.firstname} ${p.lastname}`.trim());
            setApplicantPhone(p.phone || '');
            setApplicantNin(p.nin || '');
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
        console.error('Failed to load installment phone catalog', err);
      } finally {
        if (isMounted) setIsLoadingCatalog(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Set default plan when opening detail
  const handleSelectProduct = (product: PhysicalProductItem) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setAdminFee(product.effective_admin_fee || 5000);

    if (product.plans && product.plans.length > 0) {
      setSelectedPlan(product.plans[0]);
    } else {
      setSelectedPlan(null);
    }
    setViewState('detail');
  };

  // Toggle Personal vs Another Person
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

  // Filter products by search and brand
  const filteredProducts = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchBrand =
      selectedBrandFilter === 'All' || (p.brand && p.brand.toLowerCase() === selectedBrandFilter.toLowerCase());
    return matchSearch && matchBrand;
  });

  // State & LGA helper
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

  // Open Checkout
  const handleInitiateApply = () => {
    if (!currentUser.has_kyc && !currentUser.hasKyc) {
      toast.error('KYC verification required. Please complete your identity verification in Profile settings.');
      return;
    }

    if (!applicantName.trim()) {
      toast.error('Please enter applicant full name.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.length < 10) {
      toast.error('Please enter a valid applicant contact phone number.');
      return;
    }
    if (!applicantNin.trim() || applicantNin.length < 11) {
      toast.error('Please enter a valid 11-digit Applicant NIN.');
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

  // Confirm PIN & Submit
  const handleConfirmPin = async (enteredPin: string) => {
    setIsSubmitting(true);
    setPinErrorMessage('');

    try {
      const payload = {
        service_type: 'installment_phone',
        product_id: selectedProduct?.id,
        plan_id: selectedPlan?.id,
        buying_for: buyingFor,
        applicant_name: applicantName.trim(),
        applicant_phone: applicantPhone.trim(),
        applicant_nin: applicantNin.trim(),
        state: stateName,
        lga: lgaName,
        delivery_address: deliveryAddress.trim(),
        selected_specs: `${selectedStorage} | ${selectedColor}`,
        transaction_pin: enteredPin,
      };

      const res = await api.submitPhysicalProductRequest(payload);

      if (res && res.success) {
        setIsPinModalOpen(false);
        setSuccessData(res);
        toast.success('Installment request submitted successfully!');
        if (onRefreshWallet) onRefreshWallet();
      } else {
        const errorMsg = res?.error || 'Failed to submit installment request.';
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
  // RENDER VIEW 1: CATALOG GRID
  // -------------------------------------------------------------
  if (viewState === 'catalog') {
    return (
      <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
        {/* Top App Header */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary" />
              <span>Installment Phones</span>
            </h1>
            <div className="w-8" />
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Samsung, iPhone, Xiaomi..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border outline-none transition-all ${
                isLight ? 'bg-slate-100 border-transparent focus:bg-white focus:border-primary' : 'bg-slate-800 border-slate-700 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Brand & Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3 pt-1">
            {['All', 'Samsung', 'Xiaomi', 'Apple', 'Infinix'].map(brand => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrandFilter(brand)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBrandFilter === brand
                    ? 'bg-primary text-white shadow-sm'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </header>

        {/* 2-Column Catalog Grid (Reference Image 3) */}
        <main className="max-w-md mx-auto px-4 pt-3">
          {isLoadingCatalog ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-xs">Loading available devices...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Smartphone className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-xs font-medium">No devices found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => {
                const lowestPlan = product.plans && product.plans.length > 0 ? product.plans[product.plans.length - 1] : null;
                const imgUrl = resolveImageUrl(product.featured_image) || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500';

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`rounded-2xl p-3 border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden mb-2.5 flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                        />
                        {/* Ships Now Badge */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                          Ships now
                        </span>
                      </div>

                      {/* Product Title */}
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {lowestPlan && (
                        <div className="text-[11px] font-black text-primary dark:text-emerald-400">
                          ₦{lowestPlan.installment_amount.toLocaleString()}{lowestPlan.frequency_label}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-medium">
                        Outright: ₦{product.price.toLocaleString()}
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
  // RENDER VIEW 2: PRODUCT DETAIL PAGE
  // -------------------------------------------------------------
  if (viewState === 'detail' && selectedProduct) {
    const gallery =
      selectedProduct.gallery_images && selectedProduct.gallery_images.length > 0
        ? selectedProduct.gallery_images
        : [selectedProduct.featured_image || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500'];

    return (
      <div className={`min-h-screen pb-28 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewState('catalog')}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold truncate max-w-[200px]">{selectedProduct.name}</span>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: selectedProduct.name, text: `Check out ${selectedProduct.name} on eData Installments` }).catch(() => {});
              }
            }}
            className="p-2 -mr-2 text-slate-500 hover:text-slate-800"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </header>

        <main className="max-w-md mx-auto space-y-4">
          {/* Image Slider with Carousel Count Tag (e.g. 2/3) */}
          <div className="relative aspect-square w-full bg-white dark:bg-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 overflow-hidden">
            <img
              src={resolveImageUrl(gallery[selectedImageIndex]) || gallery[selectedImageIndex]}
              alt={selectedProduct.name}
              className="w-full h-full object-contain p-6"
            />

            {/* Counter pill: 1/6 */}
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md">
              {selectedImageIndex + 1}/{gallery.length}
            </div>

            {/* Thumbnail dots */}
            <div className="absolute bottom-3 flex items-center gap-1.5">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    selectedImageIndex === idx ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-4 space-y-4">
            {/* Title, Badges, Price */}
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  5.0 (2 ratings)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                  <Truck className="w-3 h-3" />
                  Delivery in 2 - 5 days
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {selectedProduct.name}
              </h2>

              <div className="mt-2 text-2xl font-black font-display text-primary dark:text-emerald-400">
                ₦{selectedProduct.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Installment Plan Selector Cards */}
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2.5">
                Choose Installment Plan
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {selectedProduct.plans && selectedProduct.plans.length > 0 ? (
                  selectedProduct.plans.map(plan => {
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-primary/5 border-primary ring-2 ring-primary/20 dark:bg-emerald-950/20 dark:border-emerald-500'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {plan.plan_name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-primary dark:text-emerald-400" />}
                          </div>
                          <div className="text-sm font-black text-primary dark:text-emerald-400 mt-1">
                            ₦{plan.installment_amount.toLocaleString()}{plan.frequency_label}
                          </div>
                        </div>

                        {plan.shipping_badge && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Clock className="w-3 h-3" />
                            <span>{plan.shipping_badge}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 col-span-2">No plans configured for this device.</p>
                )}
              </div>
            </div>

            {/* Storage & Color Pills (Reference Image 2) */}
            <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Storage Option</span>
                <div className="flex gap-2">
                  {['128GB', '256GB', '512GB'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStorage(st)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedStorage === st
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Color</span>
                <div className="flex gap-2">
                  {['Phantom Black', 'Marble Gray', 'Cobalt Violet'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedColor === col
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Guarantee / Disclaimer Box (Reference Image 4) */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>eData Certified Quality Guarantee</span>
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Battery health guaranteed strictly &gt; 70%</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>100% functional, SIM &amp; network unlocked across Nigerian networks</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Includes 12-month seller warranty and genuine accessories</span>
                </li>
              </ul>
            </div>
          </div>
        </main>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-between max-w-md mx-auto z-30">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Selected Installment</span>
            <div className="text-base font-black text-primary dark:text-emerald-400">
              {selectedPlan ? `₦${selectedPlan.installment_amount.toLocaleString()}${selectedPlan.frequency_label}` : 'Select a Plan'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setViewState('apply')}
            className="py-3 px-6 rounded-2xl bg-primary hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Order on Installment</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER VIEW 3: APPLICATION & CHECKOUT FORM (Step 2)
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
          <h1 className="text-base font-bold font-display tracking-tight">Applicant Verification</h1>
          <span className="text-[10px] text-slate-500 font-medium">
            {selectedProduct?.name} ({selectedPlan?.plan_name})
          </span>
        </div>
        <div className="w-8" />
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Plan Summary Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Selected Device & Plan</span>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedProduct?.name}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedStorage} | {selectedColor} | {selectedPlan?.plan_name} (₦{selectedPlan?.installment_amount.toLocaleString()}{selectedPlan?.frequency_label})
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400">Admin Fee</span>
            <div className="text-base font-black text-primary dark:text-emerald-400">₦{adminFee.toLocaleString()}</div>
          </div>
        </div>

        {/* Personal vs Another Person Toggle */}
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Who is this smartphone for?
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
              <span>Personal Use</span>
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
              <ShieldCheck className="w-3.5 h-3.5" />
              Your account details will automatically be attached as the Guarantor.
            </p>
          )}
        </div>

        {/* Applicant Information Fields */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Applicant Identification
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

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Applicant National Identification Number (NIN) *
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
              placeholder="Street address, nearest bus stop or landmark"
              className={`w-full py-2 px-3 rounded-xl text-xs border outline-none resize-none ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleInitiateApply}
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

      {/* PIN Confirmation Modal */}
      <PhysicalPinModal
        isOpen={isPinModalOpen}
        serviceTitle={`Installment Phone: ${selectedProduct?.name}`}
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
          serviceTitle="Installment Phone Request"
          productName={`${selectedProduct?.name} (${selectedPlan?.plan_name})`}
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
