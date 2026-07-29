import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import BottomSheet from './BottomSheet';
import { ChevronLeft, BookOpen } from 'lucide-react';

interface ExamPinsProps {
  currentUser: UserProfile;
  products: ProductItem[];
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ExamPins({ currentUser, products, onBack, onSuccess }: ExamPinsProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('1'); // Quantity
  const [detectedOperator, setDetectedOperator] = useState('WAEC');
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const getDynamicPrice = (p: ProductItem) => p.priceNormal;

  const handleCheckoutInitiate = () => {
    if (!selectedProduct) {
      toast.warning('Please select an exam pin type.');
      return;
    }
    const quantity = parseInt(targetNumber, 10) || 1;
    const totalPrice = selectedProduct.priceNormal * quantity;
    if (totalPrice > currentUser.walletBalance) {
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
    if (!selectedProduct) return;
    setIsPurchasing(true);
    try {
      const quantity = parseInt(targetNumber, 10) || 1;
      const res = await api.purchase({
        service_id: selectedProduct?.serviceTypeId || 3, // Exam Token
        amount: (selectedProduct?.priceNormal || 0) * quantity,
        target_number: currentUser.phone || '08000000000',
        quantity: quantity,
        plan_id: selectedProduct?.id,
        transaction_pin: pinInput
      });
      toast.success(res.message || 'Exam token purchased successfully!');
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Exam Result Pins</h1>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <ServiceForm
          serviceType="exam"
          serviceLabel="Exam Result Pins"
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
            Confirm purchase of <strong className="text-white font-black">{targetNumber}x {detectedOperator} Pin</strong>
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
