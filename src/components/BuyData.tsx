import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile, PlanTypeItem } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, Wifi } from 'lucide-react';
import { openContactPicker } from '../utils/contactPicker';
import { isValidPhoneNumber } from '../utils/phoneValidation';
import { useBackHandler } from '../utils/backHandler';

interface BuyDataProps {
  currentUser: UserProfile;
  products: ProductItem[];
  planTypes?: PlanTypeItem[];
  initialNetwork?: string;
  initialPlanId?: number | null;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function BuyData({ currentUser, products, planTypes, initialNetwork, initialPlanId, onBack, onSuccess }: BuyDataProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState(currentUser.phone || '');
  const [detectedOperator, setDetectedOperator] = useState(initialNetwork || '');
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showPinScreen, setShowPinScreen] = useState(false);

  // Android back closes the PIN sheet before it can pop the whole page.
  useBackHandler(showPinScreen, () => setShowPinScreen(false));

  React.useEffect(() => {
    if (initialNetwork) {
      setDetectedOperator(initialNetwork);
    }
    if (initialPlanId && products && products.length > 0) {
      const found = products.find(p => 
        p.id === `plan-${initialPlanId}` || 
        p.id === String(initialPlanId) || 
        p.id.includes(`-${initialPlanId}-`) || 
        p.id.startsWith(`plan-${initialPlanId}-`)
      );
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [initialNetwork, initialPlanId, products]);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  const getDynamicPrice = (p: ProductItem) => {
    if (currentUser.category === 'Premium User') return p.pricePremium ?? p.priceNormal;
    if (currentUser.category === 'Referred User') return p.priceReferred ?? p.priceNormal;
    return p.priceNormal;
  };

  const handleApplyPromoCode = () => {
    if (!promoCodeInput.trim()) return;
    if (promoCodeInput.toUpperCase() === 'EDATA50') {
      setAppliedPromo('EDATA50');
      setPromoDiscount(50);
      setPromoError('');
      toast.success('Promo code applied: ₦50 off!');
    } else {
      setPromoError('Invalid promo code.');
    }
  };

  const handleCheckoutInitiate = () => {
    if (!targetNumber || !isValidPhoneNumber(targetNumber)) {
      toast.warning('Please enter a valid 11-digit phone number.');
      return;
    }
    if (!selectedProduct) {
      toast.warning('Please select a data plan.');
      return;
    }
    const finalPrice = getDynamicPrice(selectedProduct) - promoDiscount;
    if (finalPrice > currentUser.walletBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string) => {
    if (!selectedProduct) return;

    // The plan's admin-managed DB id and its parent service_type_id are
    // encoded in the product id as `plan-<planId>-<serviceTypeId>` (see
    // App.tsx fetchAllData mapping). Extract them so the purchase call
    // hits the exact ServiceType/DataPlan row the admin created — never
    // a hardcoded default.
    const idStr = String(selectedProduct.id);
    const idMatch = idStr.match(/^plan-(\d+)-(\d+)$/);

    let planId: number | undefined;
    let serviceId: number | undefined;
    if (idMatch) {
      planId = parseInt(idMatch[1], 10);
      serviceId = parseInt(idMatch[2], 10);
    } else {
      // Fallback for legacy id shapes (`plan-<id>` or bare numeric)
      const numOnly = parseInt(idStr.replace(/^[^\d]*/, ''), 10);
      planId = !isNaN(numOnly) ? numOnly : undefined;
    }

    if (!planId || !serviceId) {
      toast.error('Selected plan is missing backend identifiers. Please refresh and try again.');
      return;
    }

    const res = await api.purchase({
      service_id: serviceId,
      amount: getDynamicPrice(selectedProduct) - promoDiscount,
      target_number: targetNumber,
      plan_id: planId,
      transaction_pin: pinInput
    });
    toast.success(res.message || 'Data bundle purchase successful!');
    if (onSuccess) onSuccess();
    onBack();
  };

  if (showPinScreen && selectedProduct) {
    const finalPrice = getDynamicPrice(selectedProduct) - promoDiscount;
    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: selectedProduct.name,
          subtitle: `${selectedProduct.operator || detectedOperator} Data Bundle`,
          amount: finalPrice,
          recipient: targetNumber,
          provider: selectedProduct.operator || detectedOperator,
          iconType: 'data',
        }}
        onBack={() => setShowPinScreen(false)}
        onSuccess={() => setShowPinScreen(false)}
        onSubmitPurchase={handleConfirmPurchase}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-28">
      {/* ── Top Header ── */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Wifi className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Buy Data Bundle</h1>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <ServiceForm
          serviceType="data"
          serviceLabel="Buy Data Bundle"
          products={products}
          planTypes={planTypes}
          targetNumber={targetNumber}
          setTargetNumber={setTargetNumber}
          detectedOperator={detectedOperator}
          setDetectedOperator={setDetectedOperator}
          checkoutAmount={checkoutAmount}
          setCheckoutAmount={setCheckoutAmount}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          setSelectedCategory={() => {}}
          getDynamicPrice={getDynamicPrice}
          promoCodeInput={promoCodeInput}
          setPromoCodeInput={setPromoCodeInput}
          appliedPromo={appliedPromo}
          setAppliedPromo={setAppliedPromo}
          promoDiscount={promoDiscount}
          setPromoDiscount={setPromoDiscount}
          promoError={promoError}
          handleApplyPromoCode={handleApplyPromoCode}
          handleCheckoutInitiate={handleCheckoutInitiate}
          onOpenContacts={() => openContactPicker(setTargetNumber, currentUser.phone, toast)}
          userPhone={currentUser.phone}
          onBack={onBack}
          currentBalance={currentUser.walletBalance}
          toast={toast}
        />
      </div>
    </div>
  );
}
