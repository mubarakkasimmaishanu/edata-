import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, Tv } from 'lucide-react';

interface CableTVProps {
  currentUser: UserProfile;
  products: ProductItem[];
  initialProvider?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function CableTV({ currentUser, products, initialProvider, onBack, onSuccess }: CableTVProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('');
  const [detectedOperator, setDetectedOperator] = useState(initialProvider || 'DSTV');

  React.useEffect(() => {
    if (initialProvider) {
      setDetectedOperator(initialProvider);
    }
  }, [initialProvider]);
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [isValidatingNumber, setIsValidatingNumber] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [validationError, setValidationError] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  const getDynamicPrice = (p: ProductItem) => p.priceNormal;

  const handleValidateNumber = async () => {
    if (!targetNumber || targetNumber.length < 8) return;
    setIsValidatingNumber(true);
    setValidationError('');
    try {
      const res = await api.validateMeterOrSmartcard(4, targetNumber);
      if (res.data?.name || res.name) {
        const name = res.data?.name || res.name;
        setCustomerName(name);
        toast.success(`Verified: ${name}`);
      } else {
        setValidationError('Invalid SmartCard / IUC Number.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'IUC Verification Failed');
    } finally {
      setIsValidatingNumber(false);
    }
  };

  const handleCheckoutInitiate = () => {
    if (!targetNumber || targetNumber.length < 8) {
      toast.warning('Please enter a valid IUC/Smartcard Number.');
      return;
    }
    if (!selectedProduct) {
      toast.warning('Please select a cable package.');
      return;
    }
    if (selectedProduct.priceNormal > currentUser.walletBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string) => {
    if (!selectedProduct) return;
    const res = await api.purchase({
      service_id: 4, // Cable TV
      amount: selectedProduct.priceNormal,
      target_number: targetNumber,
      plan_id: selectedProduct.id,
      transaction_pin: pinInput
    });
    toast.success(res.message || 'Cable TV subscription successful!');
    if (onSuccess) onSuccess();
    onBack();
  };

  if (showPinScreen && selectedProduct) {
    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: selectedProduct.name,
          subtitle: `${detectedOperator} Subscription`,
          amount: selectedProduct.priceNormal,
          recipient: targetNumber,
          provider: detectedOperator,
          iconType: 'cable',
          details: customerName ? [{ label: 'Customer Name', value: customerName }] : undefined,
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Tv className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Cable TV</h1>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <ServiceForm
          serviceType="cable"
          serviceLabel="Cable TV Subscription"
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
          handleApplyPromoCode={() => {}}
          handleCheckoutInitiate={handleCheckoutInitiate}
          onOpenContacts={() => {}}
          onBack={onBack}
          currentBalance={currentUser.walletBalance}
          isValidatingNumber={isValidatingNumber}
          handleValidateNumber={handleValidateNumber}
          customerName={customerName}
          validationError={validationError}
          toast={toast}
        />
      </div>
    </div>
  );
}
