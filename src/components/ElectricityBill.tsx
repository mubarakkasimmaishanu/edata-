import React, { useState, useEffect } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile, ElectricityDisco } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import { useBackHandler } from '../utils/backHandler';

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
  const [meterType, setMeterType] = useState<'PrePaid' | 'PostPaid'>('PrePaid');
  const [dynamicDiscos, setDynamicDiscos] = useState<ElectricityDisco[]>([]);
  const [isLoadingDiscos, setIsLoadingDiscos] = useState(false);

  // Fetch dynamic electricity discos from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadDiscos() {
      setIsLoadingDiscos(true);
      try {
        const res = await api.getElectricityDiscos(true);
        if (res && res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.electricity_discos || []);
          if (list && list.length > 0 && isMounted) {
            setDynamicDiscos(list);
            // If current operator is not set or not in list, select first active
            if (!initialDisco && list[0]) {
              setDetectedOperator(list[0].code || list[0].name || list[0].slug);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch dynamic discos:', e);
      } finally {
        if (isMounted) setIsLoadingDiscos(false);
      }
    }
    loadDiscos();
    return () => { isMounted = false; };
  }, [initialDisco]);

  useEffect(() => {
    if (initialDisco) {
      setDetectedOperator(initialDisco);
    }
  }, [initialDisco]);

  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showPinScreen, setShowPinScreen] = useState(false);

  // Android back closes the PIN sheet before it can pop the whole page.
  useBackHandler(showPinScreen, () => setShowPinScreen(false));

  const [isValidatingNumber, setIsValidatingNumber] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [validationError, setValidationError] = useState('');

  const getDynamicPrice = (p: ProductItem) => p.priceNormal;

  // Resolve selected disco dynamically
  const currentDiscoObj = dynamicDiscos.find(d => 
    (d.code && d.code.toLowerCase() === detectedOperator.toLowerCase()) ||
    (d.slug && d.slug.toLowerCase() === detectedOperator.toLowerCase()) ||
    (d.name && d.name.toLowerCase().includes(detectedOperator.toLowerCase()))
  ) || dynamicDiscos[0];

  const matchingElecProd = products.find(p =>
    (p.category as string) === 'Electricity' &&
    (p.operator?.toLowerCase() === detectedOperator.toLowerCase() ||
     p.name?.toLowerCase().includes(detectedOperator.toLowerCase()))
  );
  const currentServiceId = currentDiscoObj 
    ? currentDiscoObj.id 
    : (matchingElecProd ? parseInt(matchingElecProd.id, 10) : (selectedProduct ? parseInt(selectedProduct.id, 10) : 34));
  const minPurchaseAmount = (currentDiscoObj && currentDiscoObj.min_amount) ? currentDiscoObj.min_amount : 500;

  const handleValidateMeter = async () => {
    if (!targetNumber || targetNumber.length < 6) {
      toast.warning('Please enter a valid meter number to verify.');
      return;
    }
    setIsValidatingNumber(true);
    setValidationError('');
    setCustomerName('');
    try {
      const res = await api.validateMeterOrSmartcard(currentServiceId, targetNumber, meterType);
      const name = res.data?.customer_name || res.data?.name || res.customer_name || res.name;
      if (name) {
        setCustomerName(name);
        toast.success(`Meter Verified: ${name}`);
      } else {
        setValidationError('Meter verification returned no name. Please double-check the number.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Meter Verification Failed';
      setValidationError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsValidatingNumber(false);
    }
  };

  const handleCheckoutInitiate = () => {
    const amountNum = parseFloat(checkoutAmount);
    if (!targetNumber || targetNumber.length < 6) {
      toast.warning('Please enter a valid Meter Number.');
      return;
    }
    if (isNaN(amountNum) || amountNum < minPurchaseAmount) {
      toast.warning(`Minimum electricity payment is ₦${minPurchaseAmount.toLocaleString()}.`);
      return;
    }
    if (amountNum > currentUser.walletBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string, customRecipient?: string) => {
    const target = customRecipient || targetNumber;
    const res = await api.purchase({
      service_id: currentServiceId,
      amount: parseFloat(checkoutAmount),
      target_number: target,
      meter_type: meterType,
      transaction_pin: pinInput
    });
    return res;
  };

  const discoDisplayName = currentDiscoObj ? (currentDiscoObj.fullName || currentDiscoObj.name) : detectedOperator;

  if (showPinScreen) {
    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: `${discoDisplayName} Token`,
          subtitle: `${meterType} Meter Recharge`,
          amount: parseFloat(checkoutAmount),
          recipient: targetNumber,
          provider: discoDisplayName,
          iconType: 'electricity',
          bonusWallet: currentUser.bonusWallet,
          mainWallet: currentUser.mainWallet ?? currentUser.walletBalance,
          userCategory: currentUser.category,
          details: [
            ...(customerName ? [{ label: 'Meter Owner', value: customerName }] : []),
            { label: 'Meter Type', value: meterType },
            { label: 'Meter Number', value: targetNumber },
          ],
        }}
        onBack={() => setShowPinScreen(false)}
        onSuccess={() => {
          setShowPinScreen(false);
          if (onSuccess) onSuccess();
        }}
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

        <div className="wallet-chip bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="wallet-chip-label text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="wallet-chip-amount text-xs font-black text-sky-200 font-mono">₦{(currentUser.mainWallet ?? currentUser.walletBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
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
          dynamicDiscos={dynamicDiscos}
          currentMeterType={meterType}
          onMeterTypeChange={setMeterType}
        />
      </div>
    </div>
  );
}
