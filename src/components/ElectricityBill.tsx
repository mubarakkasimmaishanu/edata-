import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import BottomSheet from './BottomSheet';
import { ChevronLeft, Lightbulb } from 'lucide-react';

interface ElectricityBillProps {
  currentUser: UserProfile;
  products: ProductItem[];
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ElectricityBill({ currentUser, products, onBack, onSuccess }: ElectricityBillProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('');
  const [detectedOperator, setDetectedOperator] = useState('AEDC');
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
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
    setPinSheetOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pinInput || pinInput.length !== 4) {
      toast.warning('Please enter your 4-digit Transaction PIN.');
      return;
    }
    setIsPurchasing(true);
    try {
      const res = await api.purchase({
        service_id: 5, // Electricity
        amount: parseFloat(checkoutAmount),
        target_number: targetNumber,
        transaction_pin: pinInput
      });
      toast.success(res.message || 'Electricity bill paid successfully!');
      setPinSheetOpen(false);
      setPinInput('');
      if (onSuccess) onSuccess();
      onBack();
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-28">
      {/* ── Top Header ── */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md">
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

      <BottomSheet
        open={pinSheetOpen}
        onClose={() => setPinSheetOpen(false)}
        title="Enter Transaction PIN"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-300 text-center font-medium">
            Confirm electricity payment of <strong className="text-white font-black">₦{checkoutAmount} ({detectedOperator})</strong> for <strong className="text-white font-mono font-bold">{customerName || targetNumber}</strong>
          </p>

          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full text-center text-2xl font-black tracking-widest bg-slate-800 border-2 border-slate-700 rounded-2xl py-3 text-white focus:outline-none focus:border-sky-500 font-mono"
          />

          <button
            onClick={handleConfirmPurchase}
            disabled={isPurchasing || pinInput.length !== 4}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl text-xs transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-600/20 active:scale-[0.98] btn-sheen font-display uppercase tracking-wider"
          >
            {isPurchasing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
