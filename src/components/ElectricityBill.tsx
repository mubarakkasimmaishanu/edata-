import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, Lightbulb } from 'lucide-react';

interface ElectricityBillProps {
  currentUser: UserProfile;
  products: ProductItem[];
  initialDisco?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ElectricityBill({ currentUser, products, initialDisco, onBack, onSuccess }: ElectricityBillProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('');
  const [detectedOperator, setDetectedOperator] = useState(initialDisco || 'AEDC');

  React.useEffect(() => {
    if (initialDisco) {
      setDetectedOperator(initialDisco);
    }
  }, [initialDisco]);
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [isValidatingNumber, setIsValidatingNumber] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [validationError, setValidationError] = useState('');

  const getDynamicPrice = (p: ProductItem) => p.priceNormal;

  const handleValidateMeter = async () => {
    if (!targetNumber || targetNumber.length < 8) return;
    setIsValidatingNumber(true);
    setValidationError('');
    try {
      const res = await api.validateMeterOrSmartcard(5, targetNumber);
      if (res.data?.name || res.name) {
        const name = res.data?.name || res.name;
        setCustomerName(name);
        toast.success(`Meter Owner: ${name}`);
      } else {
        setValidationError('Invalid Meter Number.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Meter Verification Failed');
    } finally {
      setIsValidatingNumber(false);
    }
  };

  const handleCheckoutInitiate = () => {
    const amountNum = parseFloat(checkoutAmount);
    if (!targetNumber || targetNumber.length < 8) {
      toast.warning('Please enter a valid Meter Number.');
      return;
    }
    if (isNaN(amountNum) || amountNum < 500) {
      toast.warning('Minimum electricity payment is ₦500.');
      return;
    }
    if (amountNum > currentUser.walletBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string) => {
    const res = await api.purchase({
      service_id: 5, // Electricity
      amount: parseFloat(checkoutAmount),
      target_number: targetNumber,
      transaction_pin: pinInput
    });
    toast.success(res.message || 'Electricity bill paid successfully!');
    if (onSuccess) onSuccess();
    onBack();
  };

  if (showPinScreen) {
    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: `${detectedOperator} Electricity Token`,
          subtitle: 'Electricity Bill Payment',
          amount: parseFloat(checkoutAmount),
          recipient: targetNumber,
          provider: detectedOperator,
          iconType: 'electricity',
          details: customerName ? [{ label: 'Meter Owner', value: customerName }] : undefined,
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
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lightbulb className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Electricity Bill</h1>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <ServiceForm
          serviceType="electricity"
          serviceLabel="Electricity Bill Payment"
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
          promoCodeInput=""
          setPromoCodeInput={() => {}}
          appliedPromo=""
          setAppliedPromo={() => {}}
          promoDiscount={0}
          setPromoDiscount={() => {}}
          promoError=""
          handleApplyPromoCode={() => {}}
          handleCheckoutInitiate={handleCheckoutInitiate}
          onOpenContacts={() => {}}
          onBack={onBack}
          currentBalance={currentUser.walletBalance}
          isValidatingNumber={isValidatingNumber}
          handleValidateNumber={handleValidateMeter}
          customerName={customerName}
          validationError={validationError}
          toast={toast}
        />
      </div>
    </div>
  );
}
