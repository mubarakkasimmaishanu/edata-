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
import waecIcon from '@/assets/icons/waec.png';
import necoIcon from '@/assets/icons/neco.png';
import nabtebIcon from '@/assets/icons/nabteb.png';
import nbaisIcon from '@/assets/icons/nbais.png';
import aedcIcon from '@/assets/icons/aedc.png';
import ekedcIcon from '@/assets/icons/ekedc.png';
import ibedcIcon from '@/assets/icons/ibedc.png';
import ikejaIcon from '@/assets/icons/ikeja.png';
import josIcon from '@/assets/icons/jos.png';
import kadunaIcon from '@/assets/icons/kaduna.png';
import kedcoIcon from '@/assets/icons/kedco.png';
import phedcIcon from '@/assets/icons/phedc.png';

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

// ─── Exam Scratch Card Provider Config (Matching Wireframe & Official Icons) ───
const EXAM_PROVIDERS = [
  { name: 'WAEC', icon: waecIcon, activeRing: 'ring-sky-500/50 border-sky-500 bg-sky-50/40', badgeBg: 'bg-emerald-600 text-white' },
  { name: 'NECO', icon: necoIcon, activeRing: 'ring-emerald-500/50 border-emerald-500 bg-emerald-50/40', badgeBg: 'bg-sky-600 text-white' },
  { name: 'NABTEB', icon: nabtebIcon, activeRing: 'ring-amber-500/50 border-amber-500 bg-amber-50/40', badgeBg: 'bg-amber-600 text-white' },
  { name: 'NBAIS', icon: nbaisIcon, activeRing: 'ring-purple-500/50 border-purple-500 bg-purple-50/40', badgeBg: 'bg-purple-600 text-white' },
];

// ─── Electricity DisCo Provider Config (Matching Screenshot) ───
const ELECTRICITY_PROVIDERS = [
  { name: 'AEDC', fullName: 'ABUJA ELECTRIC AEDC', icon: aedcIcon },
  { name: 'EKEDC', fullName: 'EKO ELECTRIC EKEDC', icon: ekedcIcon },
  { name: 'IKEDC', fullName: 'IKEJA ELECTRIC IKEDC', icon: ikejaIcon },
  { name: 'IBEDC', fullName: 'IBADAN ELECTRIC IBEDC', icon: ibedcIcon },
  { name: 'JED', fullName: 'JOS ELECTRIC JED', icon: josIcon },
  { name: 'KAEDCO', fullName: 'KADUNA ELECTRIC KAEDCO', icon: kadunaIcon },
  { name: 'KEDCO', fullName: 'KANO ELECTRIC KEDCO', icon: kedcoIcon },
  { name: 'PHED', fullName: 'PORT HARCOURT ELECTRIC PHED', icon: phedcIcon },
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

  const [examQuantity, setExamQuantity] = React.useState<number>(1);
  const [meterType, setMeterType] = React.useState<'PrePaid' | 'PostPaid'>('PrePaid');
  const [discoOpen, setDiscoOpen] = React.useState<boolean>(false);
  const [dataTypeFilter, setDataTypeFilter] = React.useState<string>('ALL');

  const showNetworkSelector = ['airtime', 'data', 'a2c'].includes(serviceType);
  const showProductDropdown = ['data', 'cable'].includes(serviceType);
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
    if (!targetNumber && serviceType !== 'exam') {
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

      {/* ─── 1c. Exam Scratch Card Provider Selector (Matching Uploaded Wireframe) ─── */}
      {serviceType === 'exam' && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-display">
              Exams
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {EXAM_PROVIDERS.map((net) => {
                const currentOp = detectedOperator || 'WAEC';
                const isSelected = currentOp.toLowerCase() === net.name.toLowerCase();
                return (
                  <button
                    key={net.name}
                    type="button"
                    onClick={() => {
                      setDetectedOperator(net.name);
                      setSelectedCategory('Exam');
                      const matchProd = products.find(p =>
                        ((p.category as string) === 'Exam' || (p.category as string) === 'Exam Token' || (p.category as string) === 'Exam Card') &&
                        p.active &&
                        (p.operator?.toLowerCase() === net.name.toLowerCase() || p.name.toLowerCase().includes(net.name.toLowerCase()))
                      ) || products.find(p => (p.category as string) === 'Exam' || (p.category as string) === 'Exam Token');
                      
                      if (matchProd) {
                        setSelectedProduct(matchProd);
                        const unitPrice = getDynamicPrice(matchProd);
                        setCheckoutAmount((unitPrice * examQuantity).toString());
                      }
                    }}
                    className={`py-3.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative ${
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
                    
                    {net.icon ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-2xs p-1">
                        <img
                          src={net.icon}
                          alt={net.name}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl ${net.badgeBg} flex items-center justify-center shadow-sm font-black text-xs font-mono tracking-tight`}>
                        {net.name}
                      </div>
                    )}

                    <span className="text-[11.5px] font-black text-slate-800 tracking-wide font-display">
                      {net.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Quantity Selector (Matching Wireframe Quantity Box) ─── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
              Quantity
            </label>
            <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-between shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  const newQty = Math.max(1, examQuantity - 1);
                  setExamQuantity(newQty);
                  const unitPrice = selectedProduct ? getDynamicPrice(selectedProduct) : 3200;
                  setCheckoutAmount((unitPrice * newQty).toString());
                }}
                disabled={examQuantity <= 1}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 font-bold flex items-center justify-center transition-colors active:scale-95 text-lg"
              >
                -
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {examQuantity}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {examQuantity === 1 ? 'Pin' : 'Pins'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newQty = Math.min(10, examQuantity + 1);
                  setExamQuantity(newQty);
                  const unitPrice = selectedProduct ? getDynamicPrice(selectedProduct) : 3200;
                  setCheckoutAmount((unitPrice * newQty).toString());
                }}
                disabled={examQuantity >= 10}
                className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center justify-center transition-colors active:scale-95 text-lg shadow-sm shadow-sky-600/20"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 1d. Electricity Distribution Company Dropdown with Images ─── */}
      {serviceType === 'electricity' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
              Distribution Company
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDiscoOpen(!discoOpen)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm input-focus text-slate-800 flex items-center justify-between shadow-2xs font-semibold"
              >
                {(() => {
                  const currentName = detectedOperator || 'AEDC';
                  const disco = ELECTRICITY_PROVIDERS.find(d => 
                    d.name.toLowerCase() === currentName.toLowerCase() ||
                    d.fullName.toLowerCase().includes(currentName.toLowerCase())
                  ) || ELECTRICITY_PROVIDERS[0];
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 shrink-0">
                        <img src={disco.icon} alt={disco.name} className="w-full h-full object-contain rounded-lg" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs font-mono">{disco.fullName}</span>
                    </div>
                  );
                })()}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${discoOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options List with DisCo Images */}
              {discoOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 space-y-1 animate-scale-in">
                  {ELECTRICITY_PROVIDERS.map((disco) => {
                    const isSelected = (detectedOperator || 'AEDC').toLowerCase() === disco.name.toLowerCase();
                    return (
                      <button
                        key={disco.name}
                        type="button"
                        onClick={() => {
                          setDetectedOperator(disco.name);
                          setSelectedCategory('Electricity');
                          const matchProd = products.find(p =>
                            (p.category as string) === 'Electricity' &&
                            p.active &&
                            (p.operator?.toLowerCase().includes(disco.name.toLowerCase()) || p.name.toLowerCase().includes(disco.name.toLowerCase()))
                          );
                          if (matchProd) setSelectedProduct(matchProd);
                          setDiscoOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-sky-50 text-sky-600 font-bold border border-sky-100' : 'hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-0.5 shrink-0">
                            <img src={disco.icon} alt={disco.name} className="w-full h-full object-contain rounded-md" />
                          </div>
                          <span className="text-xs font-semibold">{disco.fullName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Meter Type Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
              Meter Type
            </label>
            <div className="relative">
              <select
                value={meterType}
                onChange={(e) => setMeterType(e.target.value as 'PrePaid' | 'PostPaid')}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm input-focus text-slate-800 font-semibold appearance-none pr-10"
              >
                <option value="PrePaid">PrePaid</option>
                <option value="PostPaid">PostPaid</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. Destination Input (Phone / Smartcard Number) ─── */}
      {serviceType !== 'exam' && (
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
      )}

      {/* ─── 3. Data / Cable Plan Dropdown ─── */}
      {showProductDropdown && (
        <div className="space-y-2">
          {/* Data Type Filter Tabs (SME, CG, Gifting, etc) */}
          {serviceType === 'data' && (
            <div className="space-y-1 mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-display">
                Filter Data Type
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['ALL', 'SME', 'CG', 'DIRECT-GIFTING', 'SME2', 'DATA-SHARE'].map((typeKey) => {
                  const isActive = dataTypeFilter === typeKey;
                  const labelText = typeKey === 'DIRECT-GIFTING' ? 'GIFTING' : typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setDataTypeFilter(typeKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {labelText}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-display">
            {serviceType === 'electricity' ? 'Electricity Provider'
              : serviceType === 'cable' ? 'Select Plan'
              : serviceType === 'exam' ? 'Examination Body'
              : 'Select Data Package'}
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
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold input-focus text-slate-800 appearance-none pr-10 shadow-2xs"
            >
              {products
                .filter(p => {
                  const matchCat = (p.category as string) === productCategoryFilter
                    || (productCategoryFilter === 'Cable' && p.category === 'Cable TV')
                    || (productCategoryFilter === 'Exam' && p.category === 'Exam Token');
                  const matchOp = (serviceType === 'data' || serviceType === 'cable') && detectedOperator
                    ? p.operator?.toLowerCase() === detectedOperator.toLowerCase()
                    : true;
                  const matchType = (serviceType === 'data' && dataTypeFilter !== 'ALL')
                    ? (p.planType?.toUpperCase() === dataTypeFilter || (dataTypeFilter === 'DIRECT-GIFTING' && p.planType?.toUpperCase() === 'DIRECT-GIFTING'))
                    : true;
                  return matchCat && p.active && matchOp && matchType;
                })
                .map(p => {
                  const tag = p.planType ? `[${p.planType}] ` : '';
                  const displayName = `${tag}${p.name} (₦${getDynamicPrice(p).toLocaleString()})`;
                  return (
                    <option key={p.id} value={p.id}>
                      {displayName}
                    </option>
                  );
                })
              }
              {products.filter(p => {
                const matchCat = (p.category as string) === productCategoryFilter
                  || (productCategoryFilter === 'Cable' && p.category === 'Cable TV');
                const matchOp = (serviceType === 'data' || serviceType === 'cable') && detectedOperator
                  ? p.operator?.toLowerCase() === detectedOperator.toLowerCase()
                  : true;
                const matchType = (serviceType === 'data' && dataTypeFilter !== 'ALL')
                  ? (p.planType?.toUpperCase() === dataTypeFilter || (dataTypeFilter === 'DIRECT-GIFTING' && p.planType?.toUpperCase() === 'DIRECT-GIFTING'))
                  : true;
                return matchCat && p.active && matchOp && matchType;
              }).length === 0 && (
                <option value="">No packages found for selected filter</option>
              )}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Selected Data Plan Detail Preview Card */}
          {serviceType === 'data' && selectedProduct && (
            <div className="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50/40 border border-sky-200/80 rounded-2xl flex items-center justify-between shadow-2xs mt-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-800 font-display">{selectedProduct.name}</span>
                  {selectedProduct.planType && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-600 text-white tracking-wider">
                      {selectedProduct.planType}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] font-semibold text-slate-500 block">
                  Full Duration & Type Included
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-base font-black text-sky-700 font-mono">
                  ₦{getDynamicPrice(selectedProduct).toLocaleString()}
                </span>
              </div>
            </div>
          )}
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

      {/* ─── Minimal Order Summary (Wallet Balance & Negative Total) ─── */}
      {!isA2C && basePrice > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
          {/* Current Wallet Balance */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Wallet Balance</span>
            <span className="font-semibold font-mono text-slate-700">
              ₦{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Amount (Negative sign for outflow) */}
          <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-base font-extrabold font-mono text-rose-600 tabular-nums">
              -₦{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* ─── Submit Button ─── */}
      <button
        onClick={handleSubmit}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.97] mt-1 btn-sheen"
      >
        {isA2C ? 'Convert Airtime to Cash' : `Pay ₦${basePrice.toLocaleString()}`}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
