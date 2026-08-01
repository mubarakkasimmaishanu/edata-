import React from 'react';
import { ProductItem } from '../types';
import { ArrowRight, Phone, Check, ChevronDown, Zap, Tv, BookOpen, CreditCard, RefreshCw, Tag, Search } from 'lucide-react';
import { api } from '../services/api';

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

// ─── Instant Nigerian Network Prefix Detector ───
export function detectNetworkFromPhone(phone: string): string | null {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return null;
  const prefix4 = clean.slice(0, 4);

  const mtn = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916', '0704', '0707'];
  const airtel = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912', '0911'];
  const glo = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const nineMobile = ['0809', '0818', '0817', '0909', '0908'];

  if (mtn.includes(prefix4)) return 'MTN';
  if (airtel.includes(prefix4)) return 'Airtel';
  if (glo.includes(prefix4)) return 'Glo';
  if (nineMobile.includes(prefix4)) return '9mobile';

  return null;
}

// ─── Network Provider Config ───
const NETWORK_PROVIDERS = [
  { name: 'MTN', icon: mtnIcon, activeRing: 'ring-amber-400/60 border-amber-400 bg-amber-500/10' },
  { name: 'Airtel', icon: airtelIcon, activeRing: 'ring-rose-500/60 border-rose-500 bg-rose-500/10' },
  { name: 'Glo', icon: gloIcon, activeRing: 'ring-emerald-500/60 border-emerald-500 bg-emerald-500/10' },
  { name: '9mobile', icon: nineMobileIcon, activeRing: 'ring-teal-500/60 border-teal-500 bg-teal-500/10' },
];

// ─── Cable TV Provider Config ───
const CABLE_PROVIDERS = [
  { name: 'DSTV', icon: dstvIcon, activeRing: 'ring-sky-400/60 border-sky-400 bg-sky-500/10' },
  { name: 'GOTV', icon: gotvIcon, activeRing: 'ring-emerald-400/60 border-emerald-400 bg-emerald-500/10' },
  { name: 'STARTIMES', icon: startimesIcon, activeRing: 'ring-amber-400/60 border-amber-400 bg-amber-500/10' },
];

// ─── Exam Scratch Card Provider Config ───
const EXAM_PROVIDERS = [
  { name: 'WAEC', icon: waecIcon, activeRing: 'ring-sky-400/60 border-sky-400 bg-sky-500/10', badgeBg: 'bg-emerald-600 text-white' },
  { name: 'NECO', icon: necoIcon, activeRing: 'ring-emerald-400/60 border-emerald-400 bg-emerald-500/10', badgeBg: 'bg-sky-600 text-white' },
  { name: 'NABTEB', icon: nabtebIcon, activeRing: 'ring-amber-400/60 border-amber-400 bg-amber-500/10', badgeBg: 'bg-amber-600 text-white' },
  { name: 'NBAIS', icon: nbaisIcon, activeRing: 'ring-purple-400/60 border-purple-400 bg-purple-500/10', badgeBg: 'bg-purple-600 text-white' },
];

// ─── Electricity DisCo Provider Config ───
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

const AIRTIME_SHORTCUTS = [100, 200, 300, 400, 500, 1000, 2000];
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
  isPurchasing?: boolean;
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
    toast, isPurchasing = false,
  } = props;

  const [examQuantity, setExamQuantity] = React.useState<number>(1);
  const [meterType, setMeterType] = React.useState<'PrePaid' | 'PostPaid'>('PrePaid');
  const [discoOpen, setDiscoOpen] = React.useState<boolean>(false);
  const [dataTypeFilter, setDataTypeFilter] = React.useState<string>('ALL');
  const [dataSearchQuery, setDataSearchQuery] = React.useState<string>('');
  const [isPackageModalOpen, setIsPackageModalOpen] = React.useState<boolean>(false);

  const showNetworkSelector = ['airtime', 'data', 'a2c'].includes(serviceType);
  const showProductDropdown = ['data', 'cable'].includes(serviceType);
  const showVerifyButton = ['electricity', 'cable'].includes(serviceType);
  const amountEditable = ['electricity'].includes(serviceType);
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
    <div className="space-y-4 animate-fade-in text-slate-100">
      {/* ─── 1. Network Selector (with Official Images) ─── */}
      {showNetworkSelector && (
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-display">
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
                  className={`py-2.5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all relative cursor-pointer ${
                    isSelected
                      ? `${net.activeRing} ring-2 scale-[1.02] shadow-md shadow-sky-500/20`
                      : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-2xs p-0.5">
                    <img
                      src={net.icon}
                      alt={net.name}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <span className="text-[11px] font-black text-white font-display">
                    {net.name}
                  </span>
                  {isA2C && (
                    <span className="text-[10px] text-sky-300 font-extrabold bg-sky-950 px-1.5 py-0.5 rounded-full border border-sky-800/60">
                      {((A2C_RATES[net.name.toLowerCase()] || 0.80) * 100).toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 1b. Cable TV Provider Selector ─── */}
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
                    className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative cursor-pointer ${
                      isSelected
                        ? `${net.activeRing} ring-2 scale-[1.02] shadow-md shadow-sky-500/20`
                        : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-2xs p-1">
                      <img
                        src={net.icon}
                        alt={net.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <span className="text-[11.5px] font-black text-white tracking-wide font-display">
                      {net.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── 1c. Exam Scratch Card Provider Selector ─── */}
      {serviceType === 'exam' && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-display">
              Exams Body
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
                    className={`py-3.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative cursor-pointer ${
                      isSelected
                        ? `${net.activeRing} ring-2 scale-[1.02] shadow-md shadow-sky-500/20`
                        : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                    
                    {net.icon ? (
                      <div className="w-13 h-13 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-2xs p-1">
                        <img
                          src={net.icon}
                          alt={net.name}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className={`w-13 h-13 rounded-2xl ${net.badgeBg} flex items-center justify-center shadow-sm font-black text-xs font-mono tracking-tight`}>
                        {net.name}
                      </div>
                    )}

                    <span className="text-[11.5px] font-black text-white tracking-wide font-display">
                      {net.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
              Quantity
            </label>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2.5 flex items-center justify-between shadow-md">
              <button
                type="button"
                onClick={() => {
                  const newQty = Math.max(1, examQuantity - 1);
                  setExamQuantity(newQty);
                  const unitPrice = selectedProduct ? getDynamicPrice(selectedProduct) : 3200;
                  setCheckoutAmount((unitPrice * newQty).toString());
                }}
                disabled={examQuantity <= 1}
                className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 font-black flex items-center justify-center transition-colors active:scale-95 text-lg cursor-pointer"
              >
                -
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white font-mono tabular-nums">
                  {examQuantity}
                </span>
                <span className="text-xs font-bold text-slate-400">
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
                className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black flex items-center justify-center transition-colors active:scale-95 text-lg shadow-sm shadow-sky-500/20 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 1d. Electricity DisCo Dropdown ─── */}
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
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white flex items-center justify-between shadow-md font-semibold cursor-pointer"
              >
                {(() => {
                  const currentName = detectedOperator || 'AEDC';
                  const disco = ELECTRICITY_PROVIDERS.find(d => 
                    d.name.toLowerCase() === currentName.toLowerCase() ||
                    d.fullName.toLowerCase().includes(currentName.toLowerCase())
                  ) || ELECTRICITY_PROVIDERS[0];
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
                        <img src={disco.icon} alt={disco.name} className="w-full h-full object-contain rounded-lg" />
                      </div>
                      <span className="font-black text-white text-xs font-mono tracking-tight">{disco.fullName}</span>
                    </div>
                  );
                })()}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${discoOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options List */}
              {discoOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto p-1.5 space-y-1 animate-scale-in">
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
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'hover:bg-slate-700/60 text-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
                            <img src={disco.icon} alt={disco.name} className="w-full h-full object-contain rounded-md" />
                          </div>
                          <span className="text-xs font-semibold">{disco.fullName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-400" />}
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
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white font-bold appearance-none pr-10 shadow-md cursor-pointer"
              >
                <option value="PrePaid" className="bg-slate-800 text-white">PrePaid Meter</option>
                <option value="PostPaid" className="bg-slate-800 text-white">PostPaid Meter</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. Destination Input ─── */}
      {serviceType !== 'exam' && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider font-display">
              {inputLabel}
            </label>
            {showContactPicker && (
              <button
                onClick={() => { setSelectedCategory(cat); onOpenContacts(); }}
                className="text-xs text-sky-400 font-bold hover:text-sky-300 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
              >
                <Phone className="w-3 h-3" /> Contacts
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {inputIcon}
            </div>
            <input
              type="text"
              placeholder={inputPlaceholder}
              value={targetNumber}
              onChange={(e) => {
                const cleanVal = e.target.value.replace(/\D/g, '');
                setSelectedCategory(cat);
                setTargetNumber(cleanVal);

                if (showNetworkSelector && cleanVal.length >= 4) {
                  const detected = detectNetworkFromPhone(cleanVal);
                  if (detected && detected.toLowerCase() !== (detectedOperator || '').toLowerCase()) {
                    setDetectedOperator(detected);

                    if (serviceType === 'data') {
                      const match = products.find(p =>
                        ((p.category as string) === 'Data' || (p.category as string) === 'Data Bundle') &&
                        p.active &&
                        p.operator?.toLowerCase() === detected.toLowerCase()
                      );
                      if (match) {
                        setSelectedProduct(match);
                        setCheckoutAmount(getDynamicPrice(match).toString());
                      }
                    }
                  }
                }

                if (showNetworkSelector && cleanVal.length === 11) {
                  api.detectNetwork(cleanVal).then(res => {
                    if (res && (res.network || res.operator)) {
                      const net = res.network || res.operator;
                      setDetectedOperator(net);
                      if (serviceType === 'data') {
                        const match = products.find(p =>
                          ((p.category as string) === 'Data' || (p.category as string) === 'Data Bundle') &&
                          p.active &&
                          p.operator?.toLowerCase() === net.toLowerCase()
                        );
                        if (match) {
                          setSelectedProduct(match);
                          setCheckoutAmount(getDynamicPrice(match).toString());
                        }
                      }
                    }
                  }).catch(() => {});
                }
              }}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-10 pr-20 py-3.5 text-sm text-white placeholder-slate-400 font-mono font-semibold focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20 shadow-md"
            />
            {showNetworkSelector && detectedOperator && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 text-sky-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
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
                className="text-xs text-sky-400 font-black hover:text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isValidatingNumber ? (
                  <><RefreshCw className="w-3 h-3 animate-spin" /> Verifying...</>
                ) : (
                  <><Check className="w-3 h-3" /> Verify Account</>
                )}
              </button>
              {customerName && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">{customerName}</span>
              )}
              {validationError && (
                <span className="text-xs font-semibold text-rose-400">{validationError}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── 3. Data / Cable Plan Selection ─── */}
      {showProductDropdown && (
        <div className="space-y-3">
          {serviceType === 'data' && (() => {
            const dataProds = products.filter(p =>
              ((p.category as string) === 'Data' || (p.category as string) === 'Data Bundle') &&
              p.active &&
              (detectedOperator ? p.operator?.toLowerCase() === detectedOperator.toLowerCase() : true)
            );

            return (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                  SELECT DATA PLAN
                </label>

                {/* Main Trigger Box matching Image 1 */}
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(true)}
                  className="w-full bg-[#161a20] border border-slate-700/80 hover:border-sky-500/50 rounded-2xl px-4 py-4 flex items-center justify-between text-xs font-bold text-white shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 font-mono text-left overflow-hidden">
                    <Zap className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className={`truncate ${selectedProduct ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}>
                      {selectedProduct
                        ? `${selectedProduct.operator || detectedOperator || 'MTN'} ${selectedProduct.name} (${selectedProduct.planType || 'SME'}) — ₦${getDynamicPrice(selectedProduct).toLocaleString('en-NG')}`
                        : 'Select package'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {/* Modal Popup Overlay matching Image 2 */}
                {isPackageModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#181d24] border border-slate-700/90 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
                      
                      {/* Modal Header */}
                      <div className="p-4 bg-[#202732] border-b border-slate-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-emerald-400 rounded-full"></div>
                          <h3 className="text-sm font-black text-white font-display m-0">Select package</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPackageModalOpen(false)}
                          className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Search Bar & Filter Chips Bar */}
                      <div className="p-3 bg-[#1a202a] border-b border-slate-700/80 space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search plan (e.g. 1GB, SME, 500MB)..."
                            value={dataSearchQuery}
                            onChange={(e) => setDataSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-7 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 font-medium"
                          />
                          {dataSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setDataSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white font-bold px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Category Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
                          {['ALL', 'SME', 'GIFTING', 'CORPORATE'].map((catKey) => (
                            <button
                              key={catKey}
                              type="button"
                              onClick={() => setDataTypeFilter(catKey)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                                dataTypeFilter === catKey
                                  ? 'bg-sky-500 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {catKey}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Modal Body List grouped by Plan Type */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-emerald-500 scrollbar-track-slate-800">
                        {(() => {
                          let filteredList = dataProds;

                          if (dataTypeFilter !== 'ALL') {
                            filteredList = filteredList.filter(p => {
                              const t = (p.planType || 'SME').toUpperCase();
                              if (dataTypeFilter === 'SME') return t.includes('SME');
                              if (dataTypeFilter === 'GIFTING') return t.includes('GIFT');
                              if (dataTypeFilter === 'CORPORATE') return t.includes('CG') || t.includes('CORP');
                              return true;
                            });
                          }

                          if (dataSearchQuery.trim()) {
                            const q = dataSearchQuery.toLowerCase();
                            filteredList = filteredList.filter(p =>
                              p.name.toLowerCase().includes(q) ||
                              (p.planType && p.planType.toLowerCase().includes(q)) ||
                              (p.operator && p.operator.toLowerCase().includes(q))
                            );
                          }

                          if (filteredList.length === 0) {
                            return (
                              <div className="p-6 text-center text-xs text-slate-400 font-bold">
                                No matching data packages found.
                              </div>
                            );
                          }

                          const groups: Record<string, ProductItem[]> = {};
                          const order = ['SME', 'GIFTING', 'CORPORATE', 'AWOOF', 'SME2', 'DATA-SHARE', 'OTHER'];
                          const labels: Record<string, { title: string; color: string }> = {
                            'SME': { title: 'SME Data Plans', color: 'text-amber-400' },
                            'GIFTING': { title: 'Gifting Data Plans', color: 'text-emerald-400' },
                            'CORPORATE': { title: 'Corporate Gifting (CG) Plans', color: 'text-sky-400' },
                            'AWOOF': { title: 'Awoof Data Plans', color: 'text-rose-400' },
                            'SME2': { title: 'SME2 Data Plans', color: 'text-amber-300' },
                            'DATA-SHARE': { title: 'Data Share Plans', color: 'text-purple-400' },
                            'OTHER': { title: 'Standard Data Plans', color: 'text-slate-300' }
                          };

                          filteredList.forEach(p => {
                            const rawType = (p.planType || 'SME').toUpperCase();
                            let key = 'OTHER';

                            if (rawType === 'SME') key = 'SME';
                            else if (rawType === 'SME2') key = 'SME2';
                            else if (rawType === 'GIFTING' || rawType === 'DIRECT-GIFTING') key = 'GIFTING';
                            else if (rawType === 'CG' || rawType === 'CORPORATE' || rawType.includes('CORP')) key = 'CORPORATE';
                            else if (rawType === 'AWOOF') key = 'AWOOF';
                            else if (rawType === 'DATA-SHARE' || rawType === 'DATASHARE') key = 'DATA-SHARE';
                            else key = 'OTHER';

                            if (!groups[key]) groups[key] = [];
                            groups[key].push(p);
                          });
                            else if (rawType === 'DATA-SHARE' || rawType === 'DATASHARE') key = 'DATA-SHARE';
                            else key = 'OTHER';

                            if (!groups[key]) groups[key] = [];
                            groups[key].push(p);
                          });

                          return order.map(key => {
                            const items = groups[key];
                            if (!items || items.length === 0) return null;
                            const meta = labels[key] || labels['OTHER'];

                            return (
                              <div key={key} className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
                                {/* Group Header inside modal */}
                                <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800">
                                  <span className={`text-xs font-black font-display uppercase tracking-wider flex items-center gap-1.5 ${meta.color}`}>
                                    <Zap className="w-3.5 h-3.5" />
                                    {meta.title}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                    {items.length} {items.length === 1 ? 'Plan' : 'Plans'}
                                  </span>
                                </div>

                                <div className="divide-y divide-slate-800/80">
                                  {items.map((p) => {
                                    const isSelected = selectedProduct?.id === p.id;
                                    const dynamicPrice = getDynamicPrice(p);
                                    const opName = p.operator || detectedOperator || 'MTN';
                                    const typeTag = p.planType ? `(${p.planType})` : '(SME)';
                                    const displayStr = `${opName} ${p.name} ${typeTag} — ₦${dynamicPrice.toLocaleString('en-NG')} ${typeTag}`;

                                    return (
                                      <div
                                        key={p.id}
                                        onClick={() => {
                                          setSelectedProduct(p);
                                          setCheckoutAmount(dynamicPrice.toString());
                                          setIsPackageModalOpen(false);
                                        }}
                                        className={`py-3 px-3 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-emerald-500/20 text-emerald-300 font-extrabold border-l-4 border-emerald-400'
                                            : 'hover:bg-slate-800/80 text-slate-200 hover:text-white font-medium'
                                        }`}
                                      >
                                        <span className="leading-snug pr-2">{displayStr}</span>
                                        {isSelected && (
                                          <span className="text-[10px] font-black uppercase text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/20 shrink-0">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Cable TV Dropdown */}
          {serviceType === 'cable' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                Select Plan
              </label>
              <div className="relative">
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) {
                      setSelectedProduct(prod);
                      setCheckoutAmount(getDynamicPrice(prod).toString());
                    }
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-xs font-black text-white appearance-none pr-10 shadow-md cursor-pointer focus:border-sky-400 focus:outline-none"
                >
                  {products
                    .filter(p => {
                      const matchCat = (p.category as string) === 'Cable' || p.category === 'Cable TV';
                      const matchOp = detectedOperator ? p.operator?.toLowerCase() === detectedOperator.toLowerCase() : true;
                      return matchCat && p.active && matchOp;
                    })
                    .map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                        {p.name} (₦{getDynamicPrice(p).toLocaleString()})
                      </option>
                    ))
                  }
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Selected Data Plan Detail Preview Card */}
          {serviceType === 'data' && selectedProduct && (
            <div className="p-3.5 bg-gradient-to-r from-sky-950/80 to-slate-800 border border-sky-500/40 rounded-2xl flex items-center justify-between shadow-md mt-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white font-display">{selectedProduct.name}</span>
                  {selectedProduct.planType && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500 text-white tracking-wider">
                      {selectedProduct.planType}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] font-medium text-slate-300 block">
                  Full Duration & Speed Included
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-base font-black text-sky-400 font-mono">
                  ₦{getDynamicPrice(selectedProduct).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Predefined Amount Selection for Airtime ─── */}
      {serviceType === 'airtime' && (
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
            Select Airtime Amount
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
                  className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'border-sky-400 bg-sky-500/15 text-white ring-2 ring-sky-500/40 shadow-lg shadow-sky-500/20 scale-[1.02]'
                      : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                  <span className="text-base font-black font-mono tracking-tight">
                    ₦{amt.toLocaleString('en-NG')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Amount Input (Electricity & A2C) ─── */}
      {(amountEditable || isA2C) && (
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
            {isA2C ? 'Airtime Amount (₦)' : 'Amount (₦)'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold font-mono">₦</span>
            <input
              type="text"
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
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-9 pr-4 py-3.5 text-sm text-white placeholder-slate-400 font-black font-mono tabular-nums focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20 shadow-md"
            />
          </div>
        </div>
      )}

      {/* ─── A2C Payout Details ─── */}
      {isA2C && (
        <>
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-md">
            <div className="flex justify-between items-center text-sm text-slate-300">
              <span className="font-semibold">Conversion Rate</span>
              <strong className="text-white font-mono tabular-nums font-black">
                {detectedOperator
                  ? `${((A2C_RATES[detectedOperator.toLowerCase()] || 0.80) * 100).toFixed(0)}%`
                  : '80%'}
              </strong>
            </div>
            <div className="border-t border-slate-700/60" />
            <div className="flex justify-between items-center text-sm text-slate-300">
              <span className="font-semibold">You will receive</span>
              <strong className="text-sky-400 text-lg font-black font-mono tabular-nums">
                ₦{(a2cPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">Payout Bank</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. GTBank, Access Bank"
                  value={a2cBank || ''}
                  onChange={(e) => setA2cBank?.(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-400 font-semibold focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">Account Number</label>
              <input
                type="text"
                placeholder="10-digit Account No."
                maxLength={10}
                value={a2cAccount || ''}
                onChange={(e) => setA2cAccount?.(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 font-mono font-semibold tracking-widest focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {/* ─── Minimal Order Summary ─── */}
      {!isA2C && basePrice > 0 && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-2.5 shadow-md">
          {/* Current Wallet Balance */}
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>Wallet Balance</span>
            <span className="font-black font-mono text-slate-200">
              ₦{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Amount */}
          <div className="border-t border-slate-700/80 pt-2.5 flex justify-between items-center">
            <span className="text-sm font-black text-white font-display">Total Outflow</span>
            <span className="text-base font-black font-mono text-rose-400 tabular-nums">
              -₦{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* ─── Submit Button ─── */}
      <button
        onClick={handleSubmit}
        disabled={isPurchasing}
        className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition-spring active:scale-[0.98] mt-1 btn-sheen cursor-pointer font-display uppercase tracking-wider"
      >
        {isPurchasing ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <>{isA2C ? 'Convert Airtime to Cash' : `Pay ₦${basePrice.toLocaleString()}`} <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}
