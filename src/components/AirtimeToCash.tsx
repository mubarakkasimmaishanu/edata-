import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, Repeat } from 'lucide-react';

interface AirtimeToCashProps {
  currentUser: UserProfile;
  products: ProductItem[];
  onBack: () => void;
  onSuccess?: () => void;
}

export default function AirtimeToCash({ currentUser, products, onBack, onSuccess }: AirtimeToCashProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('');
  const [detectedOperator, setDetectedOperator] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [a2cBank, setA2cBank] = useState('');
  const [a2cAccount, setA2cAccount] = useState('');
  const [a2cPayout, setA2cPayout] = useState(0);

  const [showPinScreen, setShowPinScreen] = useState(false);

  const getDynamicPrice = (p: ProductItem) => p.priceNormal;

  const handleCheckoutInitiate = () => {
    const amountNum = parseFloat(checkoutAmount);
    if (!targetNumber || targetNumber.length < 10) {
      toast.warning('Please enter the sender phone number.');
      return;
    }
    if (isNaN(amountNum) || amountNum < 1000) {
      toast.warning('Minimum airtime-to-cash conversion is ₦1,000.');
      return;
    }
    if (!a2cBank || !a2cAccount) {
      toast.warning('Please provide payout bank details.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string) => {
    const res = await api.purchase({
      service_id: 6, // A2C
      amount: parseFloat(checkoutAmount),
      target_number: targetNumber,
      transaction_pin: pinInput,
      bank_name: a2cBank,
      account_number: a2cAccount
    });
    toast.success(res.message || 'Airtime to Cash request submitted successfully!');
    if (onSuccess) onSuccess();
    onBack();
  };

  if (showPinScreen) {
    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: `Airtime to Cash Conversion`,
          subtitle: `${detectedOperator || 'Airtime'} to Bank Transfer`,
          amount: parseFloat(checkoutAmount),
          recipient: targetNumber,
          provider: detectedOperator,
          iconType: 'a2c',
          details: [
            { label: 'Bank Name', value: a2cBank },
            { label: 'Account No', value: a2cAccount },
            { label: 'Expected Payout', value: `₦${a2cPayout.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
          ],
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
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Repeat className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Airtime to Cash</h1>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <ServiceForm
          serviceType="a2c"
          serviceLabel="Airtime to Cash"
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
          a2cBank={a2cBank}
          setA2cBank={setA2cBank}
          a2cAccount={a2cAccount}
          setA2cAccount={setA2cAccount}
          a2cPayout={a2cPayout}
          setA2cPayout={setA2cPayout}
          toast={toast}
        />
      </div>
    </div>
  );
}
