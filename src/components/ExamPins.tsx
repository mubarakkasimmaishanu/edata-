import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import { ProductItem, UserProfile } from '../types';
import { useToast } from './Toast';
import { api } from '../services/api';
import PinScreen from './PinScreen';
import { ChevronLeft, BookOpen, Check, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { useBackHandler } from '../utils/backHandler';

interface ExamPinsProps {
  currentUser: UserProfile;
  products: ProductItem[];
  initialProvider?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export interface PurchasedExamCard {
  pin: string;
  serial?: string;
}

export default function ExamPins({ currentUser, products, initialProvider, onBack, onSuccess }: ExamPinsProps) {
  const toast = useToast();
  const [targetNumber, setTargetNumber] = useState('1'); // Quantity
  
  // Dynamically filter active exam products from synced catalog
  const examProducts = React.useMemo(() => {
    return products.filter(p => 
      ((p.category as string) === 'Exam' || (p.category as string) === 'Exam Token' || (p.category as string) === 'Exam Card') &&
      p.active !== false
    );
  }, [products]);

  const [detectedOperator, setDetectedOperator] = useState(() => {
    if (initialProvider) return initialProvider;
    if (examProducts.length > 0) {
      return examProducts[0].operator || examProducts[0].code || examProducts[0].name.split(' ')[0] || 'WAEC';
    }
    return 'WAEC';
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(() => {
    if (initialProvider) {
      const match = examProducts.find(p => 
        (p.operator?.toLowerCase() === initialProvider.toLowerCase()) || 
        p.name.toLowerCase().includes(initialProvider.toLowerCase())
      );
      if (match) return match;
    }
    return examProducts[0] || null;
  });

  const [checkoutAmount, setCheckoutAmount] = useState(() => {
    const initProd = selectedProduct || examProducts[0];
    return initProd ? initProd.priceNormal.toString() : '';
  });

  React.useEffect(() => {
    if (initialProvider) {
      setDetectedOperator(initialProvider);
      const match = examProducts.find(p => 
        (p.operator?.toLowerCase() === initialProvider.toLowerCase()) || 
        p.name.toLowerCase().includes(initialProvider.toLowerCase())
      );
      if (match) {
        setSelectedProduct(match);
        setCheckoutAmount((match.priceNormal * (parseInt(targetNumber, 10) || 1)).toString());
      }
    } else if (!selectedProduct && examProducts.length > 0) {
      const first = examProducts[0];
      setSelectedProduct(first);
      setDetectedOperator(first.operator || first.code || first.name.split(' ')[0] || 'WAEC');
      setCheckoutAmount((first.priceNormal * (parseInt(targetNumber, 10) || 1)).toString());
    }
  }, [initialProvider, examProducts]);

  // Success Voucher Receipt Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedCards, setPurchasedCards] = useState<PurchasedExamCard[]>([]);
  const [purchaseReference, setPurchaseReference] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [showPinScreen, setShowPinScreen] = useState(false);

  // Android back closes the success modal or PIN sheet before it can pop the whole page.
  useBackHandler(showSuccessModal, () => {
    setShowSuccessModal(false);
    onBack();
  });
  useBackHandler(showPinScreen, () => setShowPinScreen(false));

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
    setShowPinScreen(true);
  };

  const handleConfirmPurchase = async (pinInput: string) => {
    // Robust exam service resolution
    let targetServiceId: any = selectedProduct?.serviceTypeId;
    if (!targetServiceId && selectedProduct?.id) {
      const match = String(selectedProduct.id).match(/^plan-\d+-(\d+)$/);
      if (match) {
        targetServiceId = parseInt(match[1], 10);
      } else if (!isNaN(Number(selectedProduct.id))) {
        targetServiceId = Number(selectedProduct.id);
      }
    }

    if (!targetServiceId || targetServiceId === '3' || targetServiceId === 3) {
      const opLower = (detectedOperator || selectedProduct?.operator || selectedProduct?.name || '').toLowerCase();
      if (opLower.includes('waec')) targetServiceId = 13;
      else if (opLower.includes('neco')) targetServiceId = 14;
      else if (opLower.includes('nabteb')) targetServiceId = 15;
      else if (opLower.includes('nbais')) targetServiceId = 16;
      else targetServiceId = 13;
    }

    if (!targetServiceId) {
      toast.error('Unable to resolve exam body service. Please select an exam card and retry.');
      return;
    }

    const quantity = parseInt(targetNumber, 10) || 1;
    const res = await api.purchase({
      service_id: targetServiceId,
      amount: (selectedProduct?.priceNormal || 0) * quantity,
      target_number: currentUser.phone || '08000000000',
      quantity: quantity,
      transaction_pin: pinInput
    });

    toast.success(res.message || 'Exam token purchased successfully!');

    // Extract cards from response
    const vData = res?.data || {};
    const extracted: PurchasedExamCard[] = [];

    if (Array.isArray(vData.pins) && vData.pins.length > 0) {
      vData.pins.forEach((c: any) => {
        extracted.push({
          pin: c.pin || c.token || '',
          serial: c.serial_no || c.serial_number || c.serial || 'N/A'
        });
      });
    } else if (vData.pin || vData.token) {
      extracted.push({
        pin: vData.pin || vData.token,
        serial: vData.serial_number || 'N/A'
      });
    }

    if (extracted.length > 0) {
      setPurchasedCards(extracted);
      setPurchaseReference(vData.reference || res?.reference || '');
      setShowPinScreen(false);
      setShowSuccessModal(true);
    } else {
      setShowPinScreen(false);
      onBack();
    }

    if (onSuccess) onSuccess();
  };

  const handleCopyCardPin = async (pinText: string, index: number) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pinText);
        setCopiedIndex(index);
        toast.success(`PIN copied to clipboard!`);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch {
      toast.info(`PIN: ${pinText}`);
    }
  };

  const handleCopyAll = async () => {
    if (purchasedCards.length === 0) return;
    const bodyName = selectedProduct?.name || detectedOperator || 'Exam';
    const textToCopy = purchasedCards.map((c, i) => 
      `${bodyName} Card ${i + 1}\nPIN: ${c.pin}${c.serial && c.serial !== 'N/A' ? `\nSerial: ${c.serial}` : ''}`
    ).join('\n\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedAll(true);
        toast.success('All scratch cards copied to clipboard!');
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch {
      toast.info('Cards copied.');
    }
  };

  if (showPinScreen && selectedProduct) {
    const quantity = parseInt(targetNumber, 10) || 1;
    const totalPrice = selectedProduct.priceNormal * quantity;

    return (
      <PinScreen
        mode="purchase"
        summary={{
          title: selectedProduct.name,
          subtitle: `Official Exam Scratch Card Pin`,
          amount: totalPrice,
          recipient: currentUser.phone || '08000000000',
          provider: detectedOperator,
          iconType: 'exam',
          details: [{ label: 'Quantity', value: `${quantity} Card(s)` }],
        }}
        onBack={() => setShowPinScreen(false)}
        onSuccess={() => {}}
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base font-black text-white font-display">Exam Result Pins</h1>
          </div>
        </div>

        <div className="wallet-chip bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="wallet-chip-label text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="wallet-chip-amount text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
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

      {/* ─── Instant Scratch Card Voucher Receipt Modal ─── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 animate-scale-in">
            {/* Header Badge */}
            <div className="text-center space-y-1.5 pt-1">
              <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-white font-display">
                Purchase Successful!
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {selectedProduct?.name || 'Official Exam Scratch Card'}
              </p>
            </div>

            {/* Generated PINs Card List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-700">
              {purchasedCards.map((card, idx) => {
                const isCopied = copiedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 space-y-2 shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-400 font-display flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Card {idx + 1} of {purchasedCards.length}
                      </span>
                      {card.serial && card.serial !== 'N/A' && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          SN: <strong className="text-slate-300">{card.serial}</strong>
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block font-display">
                          Voucher PIN
                        </span>
                        <span className="text-base font-black font-mono tracking-widest text-emerald-400 tabular-nums select-all">
                          {card.pin}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCardPin(card.pin, idx)}
                        className={`p-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reference & Info */}
            <div className="bg-slate-800/50 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono border border-slate-700/40">
              <span>Reference:</span>
              <span className="text-slate-200 font-bold">{purchaseReference || 'N/A'}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {purchasedCards.length > 1 && (
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer font-display"
                >
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                  <span>{copiedAll ? 'All Cards Copied!' : 'Copy All Cards'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-sky-500/25 active:scale-98 cursor-pointer font-display uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
