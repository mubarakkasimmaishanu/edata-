import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ProductItem, CableProvider, PlanTypeItem, AirtimeTypeItem, ElectricityDisco } from '../types';
import { ArrowRight, Phone, Check, ChevronDown, Zap, Tv, BookOpen, CreditCard, RefreshCw, Tag, Search, X } from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import { isValidRecipient, isValidPhoneNumber, normalizePhoneNumber } from '../utils/phoneValidation';
import { openContactPicker } from '../utils/contactPicker';
import { useBackHandler } from '../utils/backHandler';

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

  // Check 5-digit CDMA/legacy prefix allocations first
  if (clean.length >= 5) {
    const prefix5 = clean.slice(0, 5);
    const mtn5 = ['07025', '07026', '07020'];
    if (mtn5.includes(prefix5)) return 'MTN';
  }

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

// ─── Network Brand Theme (Airtime & Data only) ───────────────────────────
// Applied to the primary Pay button and the detected-operator chip so the
// action area visibly matches whichever network is currently selected or
// auto-detected. Uses full class-literal strings (not built at runtime) so
// Tailwind JIT picks them up at build time.
type NetworkTheme = {
  accentColor: string;       // Primary text accent
  accentBg: string;          // Primary bg accent
  accentBorder: string;      // Prominent 2px border accent
  accentLightBg: string;     // Soft bg accent
  accentLightBorder: string; // Prominent 2px light border accent
  btn: string;              // Pay button background + hover
  btnText: string;          // Pay button label colour
  btnShadow: string;        // Pay button glow shadow
  chipBg: string;           // Detected-operator chip background
  chipBorder: string;       // Detected-operator chip border
  chipText: string;         // Detected-operator chip text
  inputBorder: string;      // Prominent 2px phone-number input border
  inputFocusBorder: string; // Phone-number input border colour when focused
  inputRing: string;        // Phone-number input focus ring
  activeCardRing: string;   // Network selector card active ring
  activeCheckBadge: string; // Network selector card active checkmark badge
  modalActiveChip: string;  // Modal filter active chip styling
  modalActiveRow: string;   // Modal selected plan item row styling
  modalActiveBadge: string; // Modal selected plan Active pill badge
};

const NETWORK_THEMES: Record<string, NetworkTheme> = {
  MTN: {
    accentColor:       'text-amber-500 dark:text-amber-400',
    accentBg:          'bg-amber-400',
    accentBorder:      'border-2 border-amber-400',
    accentLightBg:     'bg-amber-500/15',
    accentLightBorder: 'border-2 border-amber-400/90',
    btn:               'bg-amber-400 hover:bg-amber-500',
    btnText:           'text-slate-950 font-black',
    btnShadow:         'shadow-amber-500/30',
    chipBg:            'bg-amber-500/20',
    chipBorder:        'border-2 border-amber-400',
    chipText:          'text-amber-700 dark:text-amber-300 font-extrabold',
    inputBorder:       'border-2 border-amber-400 shadow-sm shadow-amber-400/25',
    inputFocusBorder:  'focus:border-amber-500 focus:border-2',
    inputRing:         'focus:ring-2 focus:ring-amber-400/50',
    activeCardRing:    'ring-2 ring-amber-400 border-2 border-amber-400 bg-amber-500/15 shadow-md shadow-amber-400/30',
    activeCheckBadge:  'bg-amber-400 text-slate-950 font-black',
    modalActiveChip:   'bg-amber-400 text-slate-950 font-black shadow-md',
    modalActiveRow:    'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold border-l-4 border-amber-400',
    modalActiveBadge:  'text-amber-700 dark:text-amber-300 bg-amber-500/20 border border-amber-500/40',
  },
  AIRTEL: {
    accentColor:       'text-rose-500 dark:text-rose-400',
    accentBg:          'bg-rose-500',
    accentBorder:      'border-2 border-rose-500',
    accentLightBg:     'bg-rose-500/15',
    accentLightBorder: 'border-2 border-rose-500/90',
    btn:               'bg-rose-500 hover:bg-rose-600',
    btnText:           'text-white font-black',
    btnShadow:         'shadow-rose-500/30',
    chipBg:            'bg-rose-500/20',
    chipBorder:        'border-2 border-rose-500',
    chipText:          'text-rose-700 dark:text-rose-300 font-extrabold',
    inputBorder:       'border-2 border-rose-500 shadow-sm shadow-rose-500/25',
    inputFocusBorder:  'focus:border-rose-600 focus:border-2',
    inputRing:         'focus:ring-2 focus:ring-rose-500/50',
    activeCardRing:    'ring-2 ring-rose-500 border-2 border-rose-500 bg-rose-500/15 shadow-md shadow-rose-500/30',
    activeCheckBadge:  'bg-rose-500 text-white font-black',
    modalActiveChip:   'bg-rose-500 text-white font-black shadow-md',
    modalActiveRow:    'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold border-l-4 border-rose-500',
    modalActiveBadge:  'text-rose-700 dark:text-rose-300 bg-rose-500/20 border border-rose-500/40',
  },
  GLO: {
    accentColor:       'text-emerald-500 dark:text-emerald-400',
    accentBg:          'bg-emerald-500',
    accentBorder:      'border-2 border-emerald-500',
    accentLightBg:     'bg-emerald-500/15',
    accentLightBorder: 'border-2 border-emerald-500/90',
    btn:               'bg-emerald-500 hover:bg-emerald-600',
    btnText:           'text-white font-black',
    btnShadow:         'shadow-emerald-500/30',
    chipBg:            'bg-emerald-500/20',
    chipBorder:        'border-2 border-emerald-500',
    chipText:          'text-emerald-700 dark:text-emerald-300 font-extrabold',
    inputBorder:       'border-2 border-emerald-500 shadow-sm shadow-emerald-500/25',
    inputFocusBorder:  'focus:border-emerald-600 focus:border-2',
    inputRing:         'focus:ring-2 focus:ring-emerald-500/50',
    activeCardRing:    'ring-2 ring-emerald-500 border-2 border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/30',
    activeCheckBadge:  'bg-emerald-500 text-white font-black',
    modalActiveChip:   'bg-emerald-500 text-white font-black shadow-md',
    modalActiveRow:    'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold border-l-4 border-emerald-500',
    modalActiveBadge:  'text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/40',
  },
  '9MOBILE': {
    accentColor:       'text-teal-500 dark:text-teal-400',
    accentBg:          'bg-teal-500',
    accentBorder:      'border-2 border-teal-500',
    accentLightBg:     'bg-teal-500/15',
    accentLightBorder: 'border-2 border-teal-500/90',
    btn:               'bg-teal-500 hover:bg-teal-600',
    btnText:           'text-white font-black',
    btnShadow:         'shadow-teal-500/30',
    chipBg:            'bg-teal-500/20',
    chipBorder:        'border-2 border-teal-500',
    chipText:          'text-teal-700 dark:text-teal-300 font-extrabold',
    inputBorder:       'border-2 border-teal-500 shadow-sm shadow-teal-500/25',
    inputFocusBorder:  'focus:border-teal-600 focus:border-2',
    inputRing:         'focus:ring-2 focus:ring-teal-500/50',
    activeCardRing:    'ring-2 ring-teal-500 border-2 border-teal-500 bg-teal-500/15 shadow-md shadow-teal-500/30',
    activeCheckBadge:  'bg-teal-500 text-white font-black',
    modalActiveChip:   'bg-teal-500 text-white font-black shadow-md',
    modalActiveRow:    'bg-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold border-l-4 border-teal-500',
    modalActiveBadge:  'text-teal-700 dark:text-teal-300 bg-teal-500/20 border border-teal-500/40',
  },
};

const DEFAULT_THEME: NetworkTheme = {
  accentColor:       'text-sky-500 dark:text-sky-400',
  accentBg:          'bg-sky-500',
  accentBorder:      'border-2 border-sky-400',
  accentLightBg:     'bg-sky-500/15',
  accentLightBorder: 'border-2 border-sky-400/90',
  btn:               'bg-sky-500 hover:bg-sky-600',
  btnText:           'text-white font-black',
  btnShadow:         'shadow-sky-500/25',
  chipBg:            'bg-slate-900',
  chipBorder:        'border-2 border-slate-700',
  chipText:          'text-sky-300',
  inputBorder:       'border-2 border-slate-700/80',
  inputFocusBorder:  'focus:border-sky-400 focus:border-2',
  inputRing:         'focus:ring-2 focus:ring-sky-500/20',
  activeCardRing:    'ring-2 ring-sky-400 border-2 border-sky-400 bg-sky-500/10 shadow-md shadow-sky-500/20',
  activeCheckBadge:  'bg-sky-500 text-white font-black',
  modalActiveChip:   'bg-sky-500 text-white font-black shadow-md',
  modalActiveRow:    'bg-sky-500/20 text-sky-500 dark:text-sky-300 font-extrabold border-l-4 border-sky-400',
  modalActiveBadge:  'text-sky-700 dark:text-sky-300 bg-sky-500/20 border border-sky-500/40',
};

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

const AIRTIME_SHORTCUTS = [100, 200, 300, 400, 500, 1000];
const DEFAULT_AIRTIME_TYPES: AirtimeTypeItem[] = [
  { id: 1, name: 'VTU Direct', code: 'VTU', amounts: [100, 200, 300, 400, 500, 1000], description: 'Standard Instant VTU Airtime Top-Up' },
  { id: 2, name: 'VTU2WALLET', code: 'VTU2WALLET', amounts: [100, 200, 300, 400, 500, 1000], description: 'VTU to Wallet Airtime' },
  { id: 3, name: 'SNS', code: 'SNS', amounts: [100, 200, 300, 400, 500, 1000], description: 'Share and Sell (SNS) Airtime' },
  { id: 4, name: 'Airtime Bonus', code: 'BONUS', amounts: [100, 200, 300, 400, 500, 1000], description: 'Airtime Bonus / Awuf4U Offers' },
  { id: 5, name: 'VTU TopUp', code: 'VTU_TOPUP', amounts: [100, 200, 300, 400, 500, 1000], description: 'Direct TopUp Airtime Channel' },
];

const A2C_RATES: Record<string, number> = { mtn: 0.82, airtel: 0.80, glo: 0.78, '9mobile': 0.75 };

// ─── Clean Plan Display & Section Title Formatters ───
// `includeType` controls the trailing "(AWOOF)" style tag. Callers that
// render plan rows *under* a plan-type section header pass `false` so the
// tag doesn't repeat what the header already says; callers rendering a
// standalone summary (e.g. the closed-modal trigger button) leave it on.
export function formatPlanDisplayName(
  p: ProductItem,
  defaultOperator: string = 'MTN',
  includeType: boolean = true,
): string {
  let name = (p.name || '').trim();
  const op = (p.operator || defaultOperator || 'MTN').trim();
  const pType = (p.planTypeName || '').trim();

  // 1. Remove duplicate leading operator if name already starts with operator
  if (!name.toLowerCase().startsWith(op.toLowerCase())) {
    name = `${op} ${name}`;
  }

  // 2. Remove double closing parentheses if any
  name = name.replace(/\)\)+/g, ')');

  // 3. Append type tag only if requested AND not already present in name
  if (includeType && pType && pType !== 'OTHER') {
    const pTypeLower = pType.toLowerCase();
    const nameLower = name.toLowerCase();
    if (!nameLower.includes(`(${pTypeLower})`) && !nameLower.includes(` ${pTypeLower}`)) {
      name = `${name} (${pType})`;
    }
  }

  return name;
}

export function formatPlanSectionTitle(rawTitle: string): string {
  let title = (rawTitle || 'Standard').trim();
  // Clean accidental double parens if present
  title = title.replace(/\)\)+/g, ')');
  return title;
}

interface ServiceFormProps {
  dynamicDiscos?: ElectricityDisco[];
  dynamicCableProviders?: CableProvider[];
  currentMeterType?: 'PrePaid' | 'PostPaid';
  onMeterTypeChange?: (val: 'PrePaid' | 'PostPaid') => void;
  serviceType: 'airtime' | 'data' | 'electricity' | 'cable' | 'exam' | 'a2c';
  serviceLabel: string;
  products: ProductItem[];
  planTypes?: PlanTypeItem[];
  airtimeTypes?: AirtimeTypeItem[];
  selectedAirtimeType?: string;
  setSelectedAirtimeType?: (v: string) => void;
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
  userPhone?: string;
}

export default function ServiceForm(props: ServiceFormProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const {
    serviceType, serviceLabel, products, planTypes = [], airtimeTypes = [], selectedAirtimeType = 'VTU Direct', setSelectedAirtimeType, targetNumber, setTargetNumber,
    detectedOperator, setDetectedOperator, checkoutAmount, setCheckoutAmount,
    selectedProduct, setSelectedProduct, setSelectedCategory, getDynamicPrice,
    promoCodeInput, setPromoCodeInput, appliedPromo, setAppliedPromo,
    promoDiscount, setPromoDiscount, promoError, handleApplyPromoCode,
    handleCheckoutInitiate, onOpenContacts, onBack, currentBalance,
    isValidatingNumber, handleValidateNumber, customerName, validationError,
    a2cBank, setA2cBank, a2cAccount, setA2cAccount, a2cPayout, setA2cPayout,
    toast,
  dynamicDiscos = [],
  dynamicCableProviders = [],
  currentMeterType,
  onMeterTypeChange, isPurchasing = false, userPhone = '',
  } = props;

  const [examQuantity, setExamQuantity] = React.useState<number>(1);
  const [meterType, setMeterType] = React.useState<'PrePaid' | 'PostPaid'>('PrePaid');
  const [discoOpen, setDiscoOpen] = React.useState<boolean>(false);
  const [dataTypeFilter, setDataTypeFilter] = React.useState<string>('ALL');
  const [dataSearchQuery, setDataSearchQuery] = React.useState<string>('');
  const [isPackageModalOpen, setIsPackageModalOpen] = React.useState<boolean>(false);
  const [isManuallySelected, setIsManuallySelected] = React.useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState<boolean>(false);
  const [manualContactInput, setManualContactInput] = React.useState<string>('');

  // Debounce guard for the network-detection API call. Without this, a
  // user correcting a wrong digit (backspace → type) fires the /detect-
  // network endpoint twice in ~200ms, and paste-then-edit patterns can
  // trigger it 3-4 times. 300ms is comfortably below human perception of
  // "delay" but easily covers rapid corrections. The ref survives across
  // renders without triggering them.
  const detectNetworkTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (detectNetworkTimerRef.current) clearTimeout(detectNetworkTimerRef.current);
  }, []);

  // Android back closes an open modal before letting the app-level
  // history handler pop the parent screen. Both modals register; the
  // LIFO order in the handler stack matches on-screen z-order, so if
  // both were somehow open the topmost would close first.
  useBackHandler(isPackageModalOpen, () => setIsPackageModalOpen(false));
  useBackHandler(isContactModalOpen, () => setIsContactModalOpen(false));

  const handleSelectContactNumber = (phone: string) => {
    let cleanVal = normalizePhoneNumber(phone);
    if (cleanVal.length > 11) cleanVal = cleanVal.slice(-11);
    setTargetNumber(cleanVal);
    setIsContactModalOpen(false);

    if (showNetworkSelector && cleanVal.length >= 4) {
      const detected = detectNetworkFromPhone(cleanVal);
      if (detected) {
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
  };

  const handleOpenContactsClick = async () => {
    setSelectedCategory(cat);
    const opened = await openContactPicker(
      (phone) => handleSelectContactNumber(phone),
      userPhone || targetNumber || '',
      toast,
      () => setIsContactModalOpen(true)
    );
    if (!opened) {
      setIsContactModalOpen(true);
    }
  };

  const showNetworkSelector = ['airtime', 'data', 'a2c'].includes(serviceType);
  const showProductDropdown = ['data', 'cable'].includes(serviceType);
  const showVerifyButton = ['electricity', 'cable'].includes(serviceType);
  const amountEditable = ['electricity'].includes(serviceType);
  const showContactPicker = ['airtime', 'data'].includes(serviceType);
  const isA2C = serviceType === 'a2c';

  // Live network brand theme — airtime & data only. Reacts to whichever
  // network is currently selected (via network cards) or auto-detected
  // (via `detectNetworkFromPhone` in the phone-number input handler),
  // so the same lookup covers both selection paths. Falls back to the
  // default sky theme when no network is known yet or the service isn't
  // a mobile-network purchase (A2C keeps the neutral sky styling).
  const isNetworkThemable = serviceType === 'airtime' || serviceType === 'data' || serviceType === 'a2c';
  const activeNetworkTheme: NetworkTheme =
    (isNetworkThemable && detectedOperator && NETWORK_THEMES[detectedOperator.toUpperCase()]) ||
    DEFAULT_THEME;

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
    : <Phone className={`w-4 h-4 transition-colors ${activeNetworkTheme.accentColor}`} />;

  const productCategoryFilter = serviceType === 'cable' ? 'Cable' : serviceType === 'exam' ? 'Exam' : cat;

  const basePrice = parseFloat(checkoutAmount || '0');
  const finalPrice = Math.max(0, basePrice - promoDiscount);

  const handleSubmit = () => {
    setSelectedCategory(cat);
    if (serviceType !== 'exam' && !isValidRecipient(serviceType, targetNumber)) {
      if (showNetworkSelector) {
        toast.warning('Please enter a valid 11-digit phone number.');
      } else {
        toast.warning(`Please enter a valid ${inputLabel.toLowerCase()}.`);
      }
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
    <div className={`space-y-4 animate-fade-in transition-all rounded-3xl ${
        isNetworkThemable && detectedOperator ? `border-t-4 ${activeNetworkTheme.accentBorder} pt-2` : ''
      }`}>
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
                    setIsManuallySelected(true);
                    setSelectedCategory(cat);
                    if (isA2C && setA2cPayout) {
                      const rate = A2C_RATES[net.name.toLowerCase()] || 0.80;
                      setA2cPayout(parseFloat(checkoutAmount || '0') * rate);
                    }
                  }}
                  className={`py-2.5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all relative cursor-pointer ${
                    isSelected
                      ? `${(NETWORK_THEMES[net.name.toUpperCase()] || DEFAULT_THEME).activeCardRing} ring-2 scale-[1.02]`
                      : (isLight ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs' : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700')
                  }`}
                >
                  {isSelected && (
                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 ${(NETWORK_THEMES[net.name.toUpperCase()] || DEFAULT_THEME).activeCheckBadge} rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-2xs p-0.5">
                    <img
                      src={net.icon}
                      alt={net.name}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <span className={`text-[11px] font-black font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
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

      {/* ─── 1c. Exam Scratch Card Provider Selector (100% Dynamic from Backend) ─── */}
      {serviceType === 'exam' && (() => {
        // Filter dynamic exam cards from backend products
        const dynamicExamProducts = products.filter(p => 
          ((p.category as string) === 'Exam' || (p.category as string) === 'Exam Token' || (p.category as string) === 'Exam Card') &&
          p.active !== false
        );

        // Build unified list of exam bodies
        const activeExamList = dynamicExamProducts.length > 0 ? dynamicExamProducts.map(p => {
          const fallback = EXAM_PROVIDERS.find(ep => 
            ep.name.toLowerCase() === (p.operator || '').toLowerCase() ||
            p.name.toLowerCase().includes(ep.name.toLowerCase())
          );
          const resolvedImg = p.image ? resolveImageUrl(p.image) : (fallback ? fallback.icon : null);
          const shortName = p.operator || p.code || p.name.split(' ')[0] || 'Exam';
          return {
            id: p.id,
            name: shortName,
            fullName: p.name,
            product: p,
            icon: resolvedImg,
            activeRing: fallback ? fallback.activeRing : 'ring-sky-400/60 border-sky-400 bg-sky-500/10',
            badgeBg: fallback ? fallback.badgeBg : 'bg-purple-600 text-white',
            price: getDynamicPrice(p),
          };
        }) : EXAM_PROVIDERS.map(ep => {
          const matchProd = products.find(p =>
            ((p.category as string) === 'Exam' || (p.category as string) === 'Exam Token' || (p.category as string) === 'Exam Card') &&
            (p.operator?.toLowerCase() === ep.name.toLowerCase() || p.name.toLowerCase().includes(ep.name.toLowerCase()))
          );
          return {
            id: matchProd ? matchProd.id : ep.name,
            name: ep.name,
            fullName: matchProd ? matchProd.name : `${ep.name} Scratch Card`,
            product: matchProd || null,
            icon: ep.icon,
            activeRing: ep.activeRing,
            badgeBg: ep.badgeBg,
            price: matchProd ? getDynamicPrice(matchProd) : 0,
          };
        });

        // Ensure auto-selection of first exam product if not selected
        if (!selectedProduct && activeExamList.length > 0 && activeExamList[0].product) {
          const firstExam = activeExamList[0];
          setTimeout(() => {
            if (firstExam.product) {
              setSelectedProduct(firstExam.product);
              setDetectedOperator(firstExam.name);
              setCheckoutAmount((getDynamicPrice(firstExam.product) * examQuantity).toString());
            }
          }, 0);
        }

        const currentOp = detectedOperator || (activeExamList[0]?.name || 'WAEC');

        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                  Select Examination Body
                </label>
                {selectedProduct && (
                  <span className="text-xs font-bold text-sky-400 font-mono">
                    ₦{getDynamicPrice(selectedProduct).toLocaleString('en-NG', { minimumFractionDigits: 2 })} / card
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {activeExamList.map((exam) => {
                  const isSelected = currentOp.toLowerCase() === exam.name.toLowerCase() || (selectedProduct && String(selectedProduct.id) === String(exam.id));
                  return (
                    <button
                      key={exam.name + '-' + exam.id}
                      type="button"
                      onClick={() => {
                        setDetectedOperator(exam.name);
                        setSelectedCategory('Exam');
                        if (exam.product) {
                          setSelectedProduct(exam.product);
                          const unitPrice = getDynamicPrice(exam.product);
                          setCheckoutAmount((unitPrice * examQuantity).toString());
                        }
                      }}
                      className={`py-3.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative cursor-pointer ${
                        isSelected
                          ? `${exam.activeRing} ring-2 scale-[1.02] shadow-md shadow-sky-500/20`
                          : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                      
                      {exam.icon ? (
                        <div className="w-13 h-13 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-2xs p-1">
                          <img
                            src={exam.icon}
                            alt={exam.name}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                      ) : (
                        <div className={`w-13 h-13 rounded-2xl ${exam.badgeBg} flex items-center justify-center shadow-sm font-black text-xs font-mono tracking-tight`}>
                          {exam.name}
                        </div>
                      )}

                      <span className="text-[11.5px] font-black text-white tracking-wide font-display text-center truncate w-full px-0.5">
                        {exam.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                  Quantity
                </label>
                {selectedProduct && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: <strong className="text-white">₦{(getDynamicPrice(selectedProduct) * examQuantity).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>
                  </span>
                )}
              </div>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2.5 flex items-center justify-between shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    const newQty = Math.max(1, examQuantity - 1);
                    setExamQuantity(newQty);
                    const unitPrice = selectedProduct ? getDynamicPrice(selectedProduct) : 0;
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
                    const unitPrice = selectedProduct ? getDynamicPrice(selectedProduct) : 0;
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
        );
      })()}

      {/* ─── 1d. Electricity DisCo Dropdown (100% Dynamic from Backend) ─── */}
      {serviceType === 'electricity' && (() => {
        // Build unified list combining dynamic API list with fallback icon mappings
        const activeList = (dynamicDiscos && dynamicDiscos.length > 0) ? dynamicDiscos.map(d => {
          const fallback = ELECTRICITY_PROVIDERS.find(p => 
            p.name.toLowerCase() === (d.slug || '').toLowerCase() ||
            p.name.toLowerCase() === (d.code || '').toLowerCase() ||
            d.name.toLowerCase().includes(p.name.toLowerCase())
          );
          const resolvedImg = d.image ? resolveImageUrl(d.image) : (fallback ? fallback.icon : aedcIcon);
          return {
            id: d.id,
            name: d.code || d.slug || d.name,
            fullName: d.name || (fallback ? fallback.fullName : d.slug),
            icon: resolvedImg || aedcIcon,
            meterTypes: (d.meter_types && d.meter_types.length > 0) ? d.meter_types : ['PrePaid', 'PostPaid'],
            minAmount: d.min_amount || 500,
          };
        }) : ELECTRICITY_PROVIDERS.map(p => ({
          id: p.name,
          name: p.name,
          fullName: p.fullName,
          icon: p.icon,
          meterTypes: ['PrePaid', 'PostPaid'],
          minAmount: 500,
        }));

        const currentName = detectedOperator || activeList[0]?.name || 'AEDC';
        const selectedDisco = activeList.find(d => 
          d.name.toLowerCase() === currentName.toLowerCase() ||
          d.fullName.toLowerCase().includes(currentName.toLowerCase())
        ) || activeList[0];

        const activeMeterType = currentMeterType || meterType;
        const availableMeterTypes = selectedDisco?.meterTypes || ['PrePaid', 'PostPaid'];

        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                  Distribution Company
                </label>
                {dynamicDiscos.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live DisCos ({activeList.length})
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDiscoOpen(!discoOpen)}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white flex items-center justify-between shadow-md font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
                      <img src={selectedDisco?.icon} alt={selectedDisco?.name} className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <span className="font-black text-white text-xs font-mono tracking-tight">{selectedDisco?.fullName}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${discoOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options List */}
                {discoOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto p-1.5 space-y-1 animate-scale-in">
                    {activeList.map((disco) => {
                      const isSelected = (detectedOperator || activeList[0]?.name).toLowerCase() === disco.name.toLowerCase();
                      return (
                        <button
                          key={disco.name + disco.id}
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
                              <img src={disco.icon} alt={disco.name} loading="lazy" decoding="async" className="w-full h-full object-contain rounded-md" />
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

            {/* Dynamic Meter Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                Meter Type
              </label>
              <div className="relative">
                <select
                  value={activeMeterType}
                  onChange={(e) => {
                    const val = e.target.value as 'PrePaid' | 'PostPaid';
                    setMeterType(val);
                    if (onMeterTypeChange) onMeterTypeChange(val);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white font-bold appearance-none pr-10 shadow-md cursor-pointer"
                >
                  {availableMeterTypes.map((mt) => {
                    const normalized = mt.toLowerCase().includes('post') ? 'PostPaid' : 'PrePaid';
                    const displayLabel = mt.toLowerCase().includes('post') ? 'PostPaid Meter' : 'PrePaid Meter';
                    return (
                      <option key={mt} value={normalized} className="bg-slate-800 text-white">
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── 2. Destination Input ─── */}
      {serviceType !== 'exam' && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider font-display">
              {inputLabel}
            </label>
            {showContactPicker && (
              <button
                type="button"
                onClick={handleOpenContactsClick}
                className={`text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer px-2.5 py-1 rounded-xl ${activeNetworkTheme.accentLightBg} border ${activeNetworkTheme.accentLightBorder} ${activeNetworkTheme.accentColor}`}
              >
                <Phone className="w-3.5 h-3.5" /> Contacts
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
                let cleanVal = e.target.value.replace(/\D/g, '');
                if (showNetworkSelector) {
                  if (cleanVal.startsWith('234') && cleanVal.length >= 13) {
                    cleanVal = '0' + cleanVal.slice(3);
                  }
                  if (cleanVal.length > 11) {
                    cleanVal = cleanVal.slice(0, 11);
                  }
                }
                setSelectedCategory(cat);
                setTargetNumber(cleanVal);

                if (cleanVal.length === 0) {
                  setIsManuallySelected(false);
                }
                if (showNetworkSelector && cleanVal.length >= 4 && !isManuallySelected) {
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
                  // Debounced: reset the timer on every keystroke so we
                  // only hit the backend once, 300ms after the user stops
                  // editing.
                  if (detectNetworkTimerRef.current) clearTimeout(detectNetworkTimerRef.current);
                  const numToDetect = cleanVal;
                  detectNetworkTimerRef.current = setTimeout(() => {
                  api.detectNetwork(numToDetect).then(res => {
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
                  }, 300);
                }
              }}
              className={`w-full bg-slate-800/90 border rounded-2xl pl-10 pr-20 py-3.5 text-sm text-white placeholder-slate-400 font-mono font-semibold focus:outline-none focus:ring-4 shadow-md transition-colors ${
                showNetworkSelector && targetNumber && targetNumber.length > 0 && targetNumber.length < 11 && !detectedOperator
                  ? 'border-amber-500/60 focus:border-amber-400 focus:ring-amber-500/20'
                  : `${activeNetworkTheme.inputBorder} ${activeNetworkTheme.inputFocusBorder} ${activeNetworkTheme.inputRing}`
              }`}
            />
            {showNetworkSelector && detectedOperator && (
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 border text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono transition-colors ${activeNetworkTheme.chipBg} ${activeNetworkTheme.chipBorder} ${activeNetworkTheme.chipText}`}
              >
                {detectedOperator}
              </span>
            )}
            {showContactPicker && !detectedOperator && (
              <button
                type="button"
                onClick={handleOpenContactsClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-400 font-bold hover:text-sky-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 rounded-xl"
              >
                <Phone className="w-3.5 h-3.5" /> Contacts
              </button>
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

      
      {/* ─── 2b. Airtime Plan Type Dropdown ─── */}
      {serviceType === 'airtime' && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
            Plan Type
          </label>
          <div className="relative">
            <select
              value={selectedAirtimeType || 'VTU Direct'}
              onChange={(e) => {
                const newTypeName = e.target.value;
                if (setSelectedAirtimeType) {
                  setSelectedAirtimeType(newTypeName);
                }
                const matched = (airtimeTypes && airtimeTypes.length > 0 ? airtimeTypes : DEFAULT_AIRTIME_TYPES).find(
                  (t) => t.name.toLowerCase() === newTypeName.toLowerCase()
                );
                const availAmounts = (matched?.amounts && matched.amounts.length > 0) ? matched.amounts : AIRTIME_SHORTCUTS;
                const curAmtNum = parseInt(checkoutAmount, 10);
                if (!availAmounts.includes(curAmtNum)) {
                  setCheckoutAmount(availAmounts[0].toString());
                }
              }}
              className={`w-full ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800/90 border-slate-700/80 text-white'} border rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none pr-10 shadow-md cursor-pointer focus:outline-none ${activeNetworkTheme.inputFocusBorder}`}
            >
              {(airtimeTypes && airtimeTypes.length > 0 ? airtimeTypes : DEFAULT_AIRTIME_TYPES).map((typeItem) => (
                <option key={typeItem.name} value={typeItem.name} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}>
                  {typeItem.name} {typeItem.code && typeItem.code !== typeItem.name ? `(${typeItem.code})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* ─── 3. Data / Cable Plan Selection ─── */}
      {showProductDropdown && (
        <div className="space-y-3">
          {serviceType === 'data' && (() => {
            const currentOp = (detectedOperator || 'MTN').toLowerCase();
            let dataProds = products.filter(p => {
              const catLower = String(p.category || '').toLowerCase();
              const isDataCat = catLower.includes('data');
              if (!isDataCat || !p.active) return false;

              if (!currentOp) return true;
              const pOpLower = String(p.operator || '').toLowerCase();
              return pOpLower.includes(currentOp) || currentOp.includes(pOpLower);
            });

            // Fallback: If operator filter returned 0 matching plans, show all active data products
            if (dataProds.length === 0) {
              dataProds = products.filter(p => String(p.category || '').toLowerCase().includes('data') && p.active);
            }

            return (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                  SELECT DATA PLAN
                </label>

                {/* Main Trigger Box matching Image 1 */}
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(true)}
                  className={`w-full ${isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#161a20] text-white shadow-md'} ${activeNetworkTheme.accentLightBorder} hover:${activeNetworkTheme.accentBorder} rounded-2xl px-4 py-4 flex items-center justify-between text-xs font-bold transition-all cursor-pointer active:scale-[0.99]`}
                >
                  <div className="flex items-center gap-2.5 font-mono text-left overflow-hidden">
                    <Zap className={`w-4 h-4 shrink-0 transition-colors ${activeNetworkTheme.accentColor}`} />
                    <span className={`truncate ${selectedProduct ? (isLight ? 'text-slate-900 font-black' : 'text-white font-bold') : (isLight ? 'text-slate-400 font-semibold' : 'text-slate-400 font-semibold')}`}>
                      {selectedProduct
                        ? `${formatPlanDisplayName(selectedProduct, detectedOperator)} — ₦${getDynamicPrice(selectedProduct).toLocaleString('en-NG')}`
                        : 'Select package'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 ml-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                </button>

                {/* Modal Popup Overlay matching Image 2 */}
                {isPackageModalOpen && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-pointer"
                    onClick={() => setIsPackageModalOpen(false)}
                  >
                    <div 
                      className={`border rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in cursor-default ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#181d24] border-slate-700/90 text-white'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      
                      {/* Modal Header */}
                      <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#202732] border-slate-700/80'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-4 ${activeNetworkTheme.accentBg} rounded-full`}></div>
                          <h3 className={`text-sm font-black font-display m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>Select package</h3>
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
                      <div className={`p-3 border-b space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1a202a] border-slate-700/80'}`}>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search plan (e.g. 1GB, SME, 500MB)..."
                            value={dataSearchQuery}
                            onChange={(e) => setDataSearchQuery(e.target.value)}
                            className={`w-full ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-700/80 text-white placeholder:text-slate-400'} border rounded-xl pl-9 pr-7 py-2 text-xs focus:outline-none ${activeNetworkTheme.inputFocusBorder} font-medium`}
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

                        {/* Dynamic Category Filter Chips — pure mirror of
                            admin-defined `plan_types`. We do NOT auto-invent
                            chips from codes that only appear on plans; if
                            the admin didn't register a plan type, it does
                            not render here. */}
                        {/* Dynamic Category Filter Chips — pure mirror of admin-defined `plan_types`. */}
                        {(() => {
                          const chipList: Array<{ id: string; label: string }> = [{ id: 'ALL', label: 'ALL' }];
                          if (planTypes && planTypes.length > 0) {
                            planTypes.forEach(pt => {
                              const cleanName = pt.name.replace(/\s*(data|plan|plans)/gi, '').trim().toUpperCase() || pt.name;
                              chipList.push({ id: String(pt.id), label: cleanName });
                            });
                          }

                          return (
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
                              {chipList.map((chip) => (
                                <button
                                  key={chip.id}
                                  type="button"
                                  onClick={() => setDataTypeFilter(chip.id)}
                                  className={`filter-chip px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                                    dataTypeFilter === chip.id
                                      ? activeNetworkTheme.modalActiveChip
                                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Modal Body List grouped dynamically by Plan Type */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-emerald-500 scrollbar-track-slate-800">
                        {(() => {
                          let filteredList = dataProds;

                          if (dataTypeFilter !== 'ALL') {
                            const activeId = Number(dataTypeFilter);
                            filteredList = filteredList.filter(p => Number(p.planTypeId) === activeId);
                          }

                          if (dataSearchQuery.trim()) {
                            const q = dataSearchQuery.toLowerCase();
                            filteredList = filteredList.filter(p =>
                              p.name.toLowerCase().includes(q) ||
                              (p.planTypeName && p.planTypeName.toLowerCase().includes(q)) ||
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

                          const colorPalette = [
                            'text-amber-400', 'text-emerald-400', 'text-sky-400',
                            'text-rose-400', 'text-purple-400', 'text-amber-300',
                            'text-teal-400', 'text-indigo-400', 'text-cyan-400'
                          ];
                          const dynamicLabels: Record<number, { title: string; color: string }> = {};

                          if (planTypes && planTypes.length > 0) {
                            planTypes.forEach((pt, idx) => {
                              dynamicLabels[pt.id] = {
                                title: formatPlanSectionTitle(pt.name),
                                color: colorPalette[idx % colorPalette.length],
                              };
                            });
                          }

                          const groups: Record<number, ProductItem[]> = {};
                          filteredList.forEach(p => {
                            const key = p.planTypeId ? Number(p.planTypeId) : 0;
                            if (!groups[key]) groups[key] = [];
                            groups[key].push(p);
                          });

                          const groupIds: number[] = [];
                          if (planTypes && planTypes.length > 0) {
                            planTypes.forEach(pt => groupIds.push(pt.id));
                          }
                          if (groups[0] && !groupIds.includes(0)) {
                            groupIds.push(0);
                          }

                          return groupIds.map(key => {
                            const items = groups[key];
                            if (!items || items.length === 0) return null;
                            const meta = dynamicLabels[key] || {
                              title: key === 0 ? 'General' : `Plan Type #${key}`,
                              color: 'text-sky-400',
                            };

                            return (
                              <div key={key} className={`space-y-1.5 p-2.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
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
                                    // Rows live under a plan-type section
                                    // header — suppress the trailing
                                    // `(TYPE)` tag so it doesn't duplicate
                                    // the header text.
                                    const displayStr = `${formatPlanDisplayName(p, opName, false)} — ₦${dynamicPrice.toLocaleString('en-NG')}`;

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
                                            ? activeNetworkTheme.modalActiveRow
                                            : (isLight ? 'hover:bg-slate-200/60 text-slate-800 font-semibold' : 'hover:bg-slate-800/80 text-slate-200 hover:text-white font-medium')
                                        }`}
                                      >
                                        <span className="leading-snug pr-2">{displayStr}</span>
                                        {isSelected && (
                                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${activeNetworkTheme.modalActiveBadge}`}>
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

          {/* Cable TV Dropdown (100% Dynamic Admin Packages) */}
          {serviceType === 'cable' && (() => {
            const currentOp = detectedOperator || 'DSTV';
            const matchedProv = dynamicCableProviders.find(p => 
              p.name.toLowerCase() === currentOp.toLowerCase() || 
              (p.slug && p.slug.toLowerCase() === currentOp.toLowerCase())
            );

            // Extract packages either directly from provider's plans or from global products list
            let cablePackages: ProductItem[] = [];
            if (matchedProv && matchedProv.plans && matchedProv.plans.length > 0) {
              cablePackages = matchedProv.plans.map(pl => ({
                id: pl.id.toString(),
                serviceTypeId: pl.service_type_id,
                service_type_id: pl.service_type_id,
                name: pl.plan_name || pl.name,
                category: 'Cable TV' as const,
                operator: matchedProv.name,
                description: pl.plan_name || pl.name || 'Cable TV Package',
                priceNormal: Number(pl.price || pl.priceNormal || pl.selling_price),
                priceReferred: Number(pl.referred_price || pl.price || pl.selling_price),
                pricePremium: Number(pl.premium_price || pl.price || pl.selling_price),
                active: true,
                bundle_id: pl.bundle_id,
              }));
            } else {
              cablePackages = products.filter(p => {
                const matchCat = (p.category as string) === 'Cable' || p.category === 'Cable TV';
                const matchOp = currentOp ? (p.operator?.toLowerCase() === currentOp.toLowerCase() || (matchedProv && p.service_type_id == matchedProv.id)) : true;
                return matchCat && p.active && matchOp;
              });
            }

            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
                    Select Plan / Package
                  </label>
                  {cablePackages.length > 0 && (
                    <span className="text-[10px] font-bold text-sky-400 font-mono">
                      {cablePackages.length} Available
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const prod = cablePackages.find(p => p.id === e.target.value) || products.find(p => p.id === e.target.value);
                      if (prod) {
                        setSelectedProduct(prod);
                        setCheckoutAmount(getDynamicPrice(prod).toString());
                      }
                    }}
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-xs font-black text-white appearance-none pr-10 shadow-md cursor-pointer focus:border-sky-400 focus:outline-none"
                  >
                    {cablePackages.length === 0 ? (
                      <option value="" disabled className="bg-slate-800 text-slate-400">No active packages for {currentOp}</option>
                    ) : (
                      cablePackages.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                          {p.name} — ₦{getDynamicPrice(p).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            );
          })()}

          {/* Selected Data Plan Detail Preview Card */}
          {serviceType === 'data' && selectedProduct && (
            <div className="p-3.5 bg-gradient-to-r from-sky-950/80 to-slate-800 border border-sky-500/40 rounded-2xl flex items-center justify-between shadow-md mt-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white font-display">{selectedProduct.name}</span>
                  {selectedProduct.planTypeName && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500 text-white tracking-wider">
                      {selectedProduct.planTypeName}
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

      {/* ─── Written Amount Selection for Airtime (Controlled Dynamically by Admin) ─── */}
      {serviceType === 'airtime' && (() => {
        const matchedType = (airtimeTypes && airtimeTypes.length > 0 ? airtimeTypes : DEFAULT_AIRTIME_TYPES).find(
          (t) => t.name.toLowerCase() === (selectedAirtimeType || '').toLowerCase()
        ) || (airtimeTypes && airtimeTypes[0]) || DEFAULT_AIRTIME_TYPES[0];
        const dynamicAirtimeAmounts = (matchedType?.amounts && matchedType.amounts.length > 0)
          ? matchedType.amounts
          : AIRTIME_SHORTCUTS;

        return (
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-display">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {dynamicAirtimeAmounts.map((amt) => {
                const isSelected = checkoutAmount === amt.toString();
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCheckoutAmount(amt.toString());
                    }}
                    className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all relative cursor-pointer active:scale-95 ${
                      isSelected
                        ? `${activeNetworkTheme.accentBorder} ${activeNetworkTheme.accentLightBg} text-white ring-2 ${activeNetworkTheme.inputRing} shadow-md scale-[1.02]`
                        : (isLight ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-xs' : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200')
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 ${activeNetworkTheme.activeCheckBadge} rounded-full flex items-center justify-center shadow-md z-10 border-2 border-slate-900`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={`text-sm font-black font-mono tracking-tight ${isSelected ? (isLight ? 'text-slate-950 font-black' : 'text-white font-black') : (isLight ? 'text-slate-800 font-bold' : 'text-slate-200 font-bold')}`}>
                      ₦{amt.toLocaleString('en-NG')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

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
        <div className={`border rounded-2xl p-4 space-y-2.5 ${isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-slate-800/90 border-slate-700/80 shadow-md text-slate-300'}`}>
          {/* Current Wallet Balance */}
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>Wallet Balance</span>
            <span className="font-black font-mono text-slate-200">
              ₦{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Amount */}
          <div className={`border-t ${isLight ? 'border-slate-200' : 'border-slate-700/80'} pt-2.5 flex justify-between items-center`}>
            <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'} font-display`}>Total Amount</span>
            <span className="text-base font-black font-mono text-rose-400 tabular-nums">
              -₦{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* ─── Submit Button (network-brand themed for airtime & data) ─── */}
      <button
        onClick={handleSubmit}
        disabled={isPurchasing}
        className={`w-full font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl transition-spring active:scale-[0.98] mt-1 btn-sheen cursor-pointer font-display uppercase tracking-wider disabled:bg-slate-700 disabled:text-white disabled:shadow-none ${activeNetworkTheme.btn} ${activeNetworkTheme.btnText} ${activeNetworkTheme.btnShadow}`}
      >
        {isPurchasing ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <>{isA2C ? 'Convert Airtime to Cash' : `Pay ₦${basePrice.toLocaleString()}`} <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      {/* ── Contact Selector Fallback Modal ── */}
      {isContactModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2 font-display">
                <Phone className="w-4 h-4 text-sky-400" /> Select Recipient Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select or paste a recipient phone number for airtime/data top-up:
            </p>

            <div className="space-y-3 pt-1">
              {/* Quick Fill User Phone if available */}
              {userPhone && userPhone.length >= 10 && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectContactNumber(userPhone);
                    toast.success(`Selected my phone number: ${normalizePhoneNumber(userPhone)}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-base">
                    👤
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Use My Phone Number</div>
                    <div className="text-[10px] text-slate-400 font-mono">{normalizePhoneNumber(userPhone)}</div>
                  </div>
                </button>
              )}

              {/* Paste from Clipboard Option */}
              <button
                type="button"
                onClick={async () => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
                    try {
                      const text = await navigator.clipboard.readText();
                      const clean = normalizePhoneNumber(text);
                      if (clean && isValidPhoneNumber(clean)) {
                        handleSelectContactNumber(clean);
                        toast.success(`Pasted phone number: ${clean}`);
                        return;
                      }
                    } catch {}
                  }
                  toast.warning('Clipboard does not contain a valid 11-digit phone number.');
                }}
                className="w-full flex items-center gap-3 p-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-base">
                  📋
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Paste from Clipboard</div>
                  <div className="text-[10px] text-slate-400">Auto-fill copied 11-digit phone number</div>
                </div>
              </button>

              {/* Enter Phone Number Input */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold text-slate-300">Or Type Recipient Number:</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. 08142233864"
                    value={manualContactInput}
                    onChange={(e) => setManualContactInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono font-semibold focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    disabled={!isValidPhoneNumber(manualContactInput)}
                    onClick={() => {
                      handleSelectContactNumber(manualContactInput);
                      toast.success(`Phone number set: ${manualContactInput}`);
                    }}
                    className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black px-4 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
