import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, Smartphone } from 'lucide-react';
import { openContactPicker } from '../utils/contactPicker';
import { isValidPhoneNumber } from '../utils/phoneValidation';

interface BuyAirtimeProps {
  currentUser: UserProfile;
  products: ProductItem[];
  initialNetwork?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function BuyAirtime({ currentUser, products, initialNetwork, onBack, onSuccess }: BuyAirtimeProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('');
  const [detectedOperator, setDetectedOperator] = useState(initialNetwork || '');
  const [checkoutAmount, setCheckoutAmount] = useState('100');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showPinScreen, setShowPinScreen] = useState(false);

  React.useEffect(() => {
    if (initialNetwork) {
      setDetectedOperator(initialNetwork);
    }
  }, [initialNetwork]);

  // Promo state
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
    const amountNum = parseFloat(checkoutAmount);
    if (!targetNumber || !isValidPhoneNumber(targetNumber)) {
      toast.warning('Please enter a valid 11-digit phone number.');
      return;
    }
    if (isNaN(amountNum) || amountNum < 50) {
      toast.warning('Minimum airtime purchase is ₦50.');
      return;
    }
    if (amountNum > currentUser.walletBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string) => {
    const networkMap: Record<string, number> = { MTN: 23, GLO: 25, AIRTEL: 24, '9MOBILE': 26 };
    const netId = networkMap[detectedOperator.toUpperCase()] || 23;
    const res = await api.purchase({
      service_id: netId,
      amount: parseFloat(checkoutAmount),
      target_number: targetNumber,
      transaction_pin: pinInput
    });
    toast.success(res.message || 'Airtime purchase successful!');
    if (onSuccess) onSuccess();
    onBack();
  };

  if (showPinScreen) {
    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: `${detectedOperator || 'Mobile'} Airtime Top-Up`,
          subtitle: 'Instant Airtime Purchase',
          amount: parseFloat(checkoutAmount) - promoDiscount,
          recipient: targetNumber,
          provider: detectedOperator,
          iconType: 'airtime',
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
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Buy Airtime</h1>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <ServiceForm
          serviceType="airtime"
          serviceLabel="Buy Airtime"
          products={products}
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
          onBack={onBack}
          currentBalance={currentUser.walletBalance}
          toast={toast}
        />
      </div>
    </div>
  );
}
