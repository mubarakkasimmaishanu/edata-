import React from 'react';
import { ProductItem } from '../types';
import { ArrowRight, Phone, Check, ChevronDown, Zap, Tv, BookOpen, CreditCard, RefreshCw, Tag } from 'lucide-react';

import mtnIcon from '@/assets/icons/mtn.png';
import airtelIcon from '@/assets/icons/airtel.png';
import gloIcon from '@/assets/icons/glo.png';
import nineMobileIcon from '@/assets/icons/9mobile.png';
import dstvIcon from '@/assets/icons/dstv.png';
import gotvIcon from '@/assets/icons/gotv.png';
import startimesIcon from '@/assets/icons/startimes.png';

// ─── Network Provider Config ───
const NETWORK_PROVIDERS = [
  { name: 'MTN', icon: mtnIcon, activeRing: 'ring-amber-400/50 border-amber-400 bg-amber-50/40' },
  { name: 'Airtel', icon: airtelIcon, activeRing: 'ring-rose-500/50 border-rose-500 bg-rose-50/40' },
  { name: 'Glo', icon: gloIcon, activeRing: 'ring-emerald-500/50 border-emerald-500 bg-emerald-50/40' },
  { name: '9mobile', icon: nineMobileIcon, activeRing: 'ring-teal-600/50 border-teal-600 bg-teal-50/40' },
];

// ─── Cable TV Provider Config (Reference Layout) ───
const CABLE_PROVIDERS = [
  { name: 'DSTV', icon: dstvIcon, activeRing: 'ring-sky-500/50 border-sky-500 bg-sky-50/40' },
  { name: 'GOTV', icon: gotvIcon, activeRing: 'ring-emerald-500/50 border-emerald-500 bg-emerald-50/40' },
  { name: 'STARTIMES', icon: startimesIcon, activeRing: 'ring-amber-500/50 border-amber-500 bg-amber-50/40' },
];

const AIRTIME_SHORTCUTS = [100, 200, 300, 500, 1000, 2000];

// A2C rate config
const A2C_RATES: Record<string, number> = { mtn: 0.82, airtel: 0.80, glo: 0.78, '9mobile': 0.75 };

interface ServiceFormProps {
  serviceType: 'airtime' | 'data' | 'electricity' | 'cable' | 'exam' | 'a2c';
  serviceLabel: string;
  products: ProductItem[];
  targetNumber: string;
  setTargetNumber: (v: string) => void;
  detectedOperator: string;
  setDetectedOperator: (v: string) => void;
  checkoutAmount: string;
  setCheckoutAmount: (v: string) => void;
  selectedProduct: ProductItem | null;
  setSelectedProduct: (p: ProductItem | null) => void;
  setSelectedCategory: (c: any) => void;
  getDynamicPrice: (p: ProductItem) => number;
  promoCodeInput: string;
  setPromoCodeInput: (v: string) => void;
  appliedPromo: string;
  setAppliedPromo: (v: string) => void;
  promoDiscount: number;
  setPromoDiscount: (v: number) => void;
  promoError: string;
  handleApplyPromoCode: () => void;
  handleCheckoutInitiate: () => void;
  onOpenContacts: () => void;
  onBack: () => void;
  currentBalance: number;
  isValidatingNumber?: boolean;
  handleValidateNumber?: () => void;
  customerName?: string;
  validationError?: string;
  a2cBank?: string;
  setA2cBank?: (v: string) => void;
  a2cAccount?: string;
  setA2cAccount?: (v: string) => void;
  a2cPayout?: number;
  setA2cPayout?: (v: number) => void;
  toast: { success: (m: string) => void; error: (m: string) => void; warning: (m: string) => void; info: (m: string) => void };
}

export default function ServiceForm(props: ServiceFormProps) {
  const {
    serviceType, serviceLabel, products, targetNumber, setTargetNumber,
    detectedOperator, setDetectedOperator, checkoutAmount, setCheckoutAmount,
    selectedProduct, setSelectedProduct, setSelectedCategory, getDynamicPrice,
    promoCodeInput, setPromoCodeInput, appliedPromo, setAppliedPromo,
    promoDiscount, setPromoDiscount, promoError, handleApplyPromoCode,
    handleCheckoutInitiate, onOpenContacts, onBack, currentBalance,
    isValidatingNumber, handleValidateNumber, customerName, validationError,
    a2cBank, setA2cBank, a2cAccount, setA2cAccount, a2cPayout, setA2cPayout,
    toast,
  } = props;

  const showNetworkSelector = ['airtime', 'data', 'a2c'].includes(serviceType);
  const showProductDropdown = ['data', 'electricity', 'cable', 'exam'].includes(serviceType);
  const showVerifyButton = ['electricity', 'cable'].includes(serviceType);
  const amountEditable = ['airtime', 'electricity'].includes(serviceType);
  const showContactPicker = ['airtime', 'data'].includes(serviceType);
  const isA2C = serviceType === 'a2c';

  const categoryMap: Record<string, string> = {
    airtime: 'Airtime', data: 'Data', electricity: 'Electricity',
    cable: 'Cable', exam: 'Exam', a2c: 'A2C'
  };
  const cat = categoryMap[serviceType] || 'Airtime';

  const inputLabel = serviceType === 'electricity' ? 'Meter Number'
    : serviceType === 'cable' ? 'Smart Card / IUC Number'
    : isA2C ? 'Sending Phone Number'
    : 'Phone Number';

  const inputPlaceholder = serviceType === 'electricity' ? 'e.g. 11-digit Meter'
    : serviceType === 'cable' ? 'e.g. 10-digit Card'
    : 'e.g. 08142233864';

  const inputIcon = serviceType === 'electricity' ? <Zap className="w-4 h-4 text-slate-400" />
    : serviceType === 'cable' ? <Tv className="w-4 h-4 text-slate-400" />
    : serviceType === 'exam' ? <BookOpen className="w-4 h-4 text-slate-400" />
    : <Phone className="w-4 h-4 text-slate-400" />;

  const productCategoryFilter = serviceType === 'cable' ? 'Cable' : serviceType === 'exam' ? 'Exam' : cat;

  const basePrice = parseFloat(checkoutAmount || '0');
  const finalPrice = Math.max(0, basePrice - promoDiscount);

  const handleSubmit = () => {
    setSelectedCategory(cat);
    if (!targetNumber) {
      toast.warning(`Please enter the ${inputLabel.toLowerCase()}.`);
      return;
    }
    if (!isA2C && finalPrice > currentBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    if (isA2C && (!a2cBank || !a2cAccount || !checkoutAmount)) {
      toast.warning('Please complete all conversion details.');
      return;
    }
    handleCheckoutInitiate();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ─── 1. Network Selector (with Official Images) ─── */}
      {showNetworkSelector && (
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Select Network
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {NETWORK_PROVIDERS.map((net) => {
              const isSelected = detectedOperator.toLowerCase() === net.name.toLowerCase();
              return (
                <button
                  key={net.name}
                  type="button"
                  onClick={() => {
                    setDetectedOperator(net.name);
                    setSelectedCategory(cat);
                    if (isA2C && setA2cPayout) {
                      const rate = A2C_RATES[net.name.toLowerCase()] || 0.80;
                      setA2cPayout(parseFloat(checkoutAmount || '0') * rate);
                    }
                  }}
                  className={`py-2 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                    isSelected
                      ? `${net.activeRing} ring-2 scale-[1.02] shadow-sm`
                      : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-white">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-2xs p-0.5">
                    <img
                      src={net.icon}
                      alt={net.name}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">
                    {net.name}
                  </span>
                  {isA2C && (
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {((A2C_RATES[net.name.toLowerCase()] || 0.80) * 100).toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 1b. Cable TV Provider Selector (Reference Pattern) ─── */}
      {serviceType === 'cable' && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-display">
              Choose Provider
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {CABLE_PROVIDERS.map((net) => {
                const currentOp = detectedOperator || 'DSTV';
                const isSelected = currentOp.toLowerCase() === net.name.toLowerCase();
                return (
                  <button
                    key={net.name}
                    type="button"
                    onClick={() => {
                      setDetectedOperator(net.name);
                      setSelectedCategory(cat);
                      const matchingPlans = products.filter(p => 
                        ((p.category as string) === 'Cable' || p.category === 'Cable TV') &&
                        p.active &&
                        p.operator?.toLowerCase() === net.name.toLowerCase()
                      );
                      if (matchingPlans.length > 0) {
                        setSelectedProduct(matchingPlans[0]);
                        setCheckoutAmount(getDynamicPrice(matchingPlans[0]).toString());
                      }
                    }}
                    className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative ${
                      isSelected
                        ? `${net.activeRing} ring-2 scale-[1.02] shadow-sm`
                        : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-white">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-2xs p-1">
                      <img
                        src={net.icon}
                        alt={net.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <span className="text-[11.5px] font-black text-slate-800 tracking-wide font-display">
                      {net.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Provider Card Banner */}
          {detectedOperator && (
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-3.5 flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/10">
                <img 
                  src={CABLE_PROVIDERS.find(p => p.name.toLowerCase() === detectedOperator.toLowerCase())?.icon || dstvIcon} 
                  alt={detectedOperator}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-sky-400 uppercase tracking-widest block">Selected Provider</span>
                <span className="text-sm font-black text-white tracking-wide font-display">{detectedOperator.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. Destination Input (Phone / Smartcard Number) ─── */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {inputLabel}
          </label>
          {showContactPicker && (
            <button
              onClick={() => { setSelectedCategory(cat); onOpenContacts(); }}
              className="text-xs text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1 transition-colors active:scale-95"
            >
              <Phone className="w-3 h-3" /> Contacts
            </button>
          )}
        </div>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            {inputIcon}
          </div>
          <input
            type="text"
            placeholder={inputPlaceholder}
            value={targetNumber}
            maxLength={serviceType === 'exam' ? 11 : undefined}
            onChange={(e) => {
              setSelectedCategory(cat);
              setTargetNumber(e.target.value.replace(/\D/g, ''));
            }}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-20 py-3 text-sm input-focus text-slate-800 font-medium font-mono"
          />
          {showNetworkSelector && detectedOperator && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
              {detectedOperator}
            </span>
          )}
        </div>

        {/* Verify Button (Electricity/Cable) */}
        {showVerifyButton && (
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              disabled={isValidatingNumber || !targetNumber || !selectedProduct}
              onClick={handleValidateNumber}
              className="text-xs text-sky-600 font-semibold hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isValidatingNumber ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Verifying...</>
              ) : (
                <><Check className="w-3 h-3" /> Verify Subscriber</>
              )}
            </button>
            {customerName && (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">{customerName}</span>
            )}
            {validationError && (
              <span className="text-xs text-rose-500 font-semibold">{validationError}</span>
            )}
          </div>
        )}
      </div>

      {/* ─── 3. Data / Cable Plan Dropdown ─── */}
      {showProductDropdown && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {serviceType === 'electricity' ? 'Electricity Provider'
              : serviceType === 'cable' ? 'Select Plan'
              : serviceType === 'exam' ? 'Examination Body'
              : 'Data Package'}
          </label>
          <div className="relative">
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const prod = products.find(p => p.id === e.target.value);
                if (prod) {
                  setSelectedProduct(prod);
                  if (serviceType !== 'electricity') {
                    setCheckoutAmount(getDynamicPrice(prod).toString());
                  }
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm input-focus text-slate-800 appearance-none pr-10 font-medium"
            >
              {products
                .filter(p => {
                  const matchCat = (p.category as string) === productCategoryFilter
                    || (productCategoryFilter === 'Cable' && p.category === 'Cable TV')
                    || (productCategoryFilter === 'Exam' && p.category === 'Exam Token');
                  const matchOp = (serviceType === 'data' || serviceType === 'cable') && detectedOperator
                    ? p.operator?.toLowerCase() === detectedOperator.toLowerCase()
                    : true;
                  return matchCat && p.active && matchOp;
                })
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {serviceType !== 'electricity' ? `(₦${getDynamicPrice(p).toLocaleString()})` : ''}
                  </option>
                ))
              }
              {products.filter(p => {
                const matchCat = (p.category as string) === productCategoryFilter
                  || (productCategoryFilter === 'Cable' && p.category === 'Cable TV');
                const matchOp = (serviceType === 'data' || serviceType === 'cable') && detectedOperator
                  ? p.operator?.toLowerCase() === detectedOperator.toLowerCase()
                  : true;
                return matchCat && p.active && matchOp;
              }).length === 0 && (
                <option value="">No packages available</option>
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* ─── Amount Input & Quick Shortcuts (for Airtime / Electricity / A2C) ─── */}
      {(amountEditable || isA2C) && (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {isA2C ? 'Airtime Amount (₦)' : 'Amount (₦)'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₦</span>
            <input
              type="text"
              disabled={!amountEditable && !isA2C}
              placeholder="Enter amount"
              value={checkoutAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setSelectedCategory(cat);
                setCheckoutAmount(val);
                if (isA2C && setA2cPayout) {
                  const rate = A2C_RATES[detectedOperator.toLowerCase()] || 0.80;
                  setA2cPayout(parseFloat(val || '0') * rate);
                }
              }}
              className={`w-full border border-slate-200 rounded-2xl pl-9 pr-4 py-3 text-sm input-focus text-slate-800 font-bold tabular-nums ${
                !amountEditable && !isA2C ? 'bg-slate-50 text-slate-600' : 'bg-white'
              }`}
            />
          </div>

          {/* Quick Amount Shortcuts for Airtime */}
          {serviceType === 'airtime' && (
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Amount Shortcuts
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {AIRTIME_SHORTCUTS.map((amt) => {
                  const isSelected = checkoutAmount === amt.toString();
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCheckoutAmount(amt.toString());
                      }}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-extrabold transition-all text-center border ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95'
                      }`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── A2C Payout Details ─── */}
      {isA2C && (
        <>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span className="font-medium">Conversion Rate</span>
              <strong className="text-slate-800 font-mono tabular-nums">
                {detectedOperator
                  ? `${((A2C_RATES[detectedOperator.toLowerCase()] || 0.80) * 100).toFixed(0)}%`
                  : '80%'}
              </strong>
            </div>
            <div className="border-t border-slate-200/60" />
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span className="font-medium">You will receive</span>
              <strong className="text-sky-600 text-lg font-extrabold font-mono tabular-nums">
                ₦{(a2cPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Payout Bank</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. GTBank, Access Bank"
                  value={a2cBank || ''}
                  onChange={(e) => setA2cBank?.(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm input-focus text-slate-800 font-medium"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Account Number</label>
              <input
                type="text"
                placeholder="10-digit Account No."
                maxLength={10}
                value={a2cAccount || ''}
                onChange={(e) => setA2cAccount?.(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm input-focus text-slate-800 font-medium tabular-nums tracking-wide"
              />
            </div>
          </div>
        </>
      )}

      {/* ─── Promo Code Section ─── */}
      {!isA2C && (
        <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Promo Code
            </label>
            {appliedPromo && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> {appliedPromo}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              disabled={!!appliedPromo}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs input-focus text-slate-800 font-mono disabled:opacity-50 tracking-wider"
            />
            {appliedPromo ? (
              <button
                type="button"
                onClick={() => { setAppliedPromo(''); setPromoDiscount(0); setPromoCodeInput(''); }}
                className="bg-rose-50 text-rose-600 border border-rose-100 font-semibold px-3.5 rounded-xl text-xs transition-smooth hover:bg-rose-100 active:scale-95"
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyPromoCode}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 rounded-xl text-xs transition-smooth btn-sheen active:scale-95"
              >
                Apply
              </button>
            )}
          </div>
          {promoError && (
            <span className="text-[11px] text-rose-500 font-semibold block">{promoError}</span>
          )}
          {appliedPromo && (
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-t border-slate-200/50 pt-2.5">
              <span>Discount</span>
              <span className="text-emerald-600 font-mono font-bold tabular-nums">-₦{promoDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Order Summary ─── */}
      {!isA2C && basePrice > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Subtotal</span>
            <span className="tabular-nums">₦{basePrice.toLocaleString()}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
              <span>Discount</span>
              <span className="tabular-nums">-₦{promoDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-base font-extrabold text-slate-900 tabular-nums">₦{finalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* ─── Submit Button ─── */}
      <button
        onClick={handleSubmit}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.97] mt-1 btn-sheen"
      >
        {isA2C ? 'Convert Airtime to Cash' : `Pay ₦${finalPrice.toLocaleString()}`}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
