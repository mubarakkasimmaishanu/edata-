import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, ProductItem } from '../types';
import {
  Smartphone, Wifi, Battery, ChevronLeft, ArrowRight, ArrowDownLeft, Home,
  ArrowUpRight, Copy, Share2, HelpCircle, CheckCircle, AlertTriangle,
  User, Lock, Key, Eye, Flame, ShieldAlert,
  Send, CreditCard, RefreshCw, Layers, Phone, DollarSign, Lightbulb,
  Tv, BookOpen, UserCheck, Check, Search, AlertCircle,
  History, MoreHorizontal, Headphones, Bell, EyeOff, Coins, Info, Gift,
  X, Zap, Shield, LogOut, ChevronRight, Fingerprint
} from 'lucide-react';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import { DEFAULT_USER } from '../data';
import { useToast } from './Toast';
import BottomSheet from './BottomSheet';
import ConfirmDialog from './ConfirmDialog';
import ServiceForm from './ServiceForm';


interface MobileSimulatorProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  products: ProductItem[];
  transactions: Transaction[];
  setTransactions: (txs: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  subscribers: UserProfile[];
  setSubscribers: (subs: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => void;
  handleGlobalRefresh?: () => void;
  isSyncing?: boolean;
  handleLoginSuccess?: (token: string) => void;
  handleLogout?: () => void;
  currentScreen: 'auth' | 'otp' | 'password_create' | 'bvn_verify' | 'app';
  setCurrentScreen: (screen: 'auth' | 'otp' | 'password_create' | 'bvn_verify' | 'app') => void;
  apiStatus: 'connected' | 'offline' | 'sandbox';
  setApiStatus?: (status: 'connected' | 'offline' | 'sandbox') => void;
}

// ─── Demo Contacts ───
const demoContacts = [
  { name: 'Usman Annur', phone: '08142233864', operator: 'MTN' },
  { name: 'Fatima Ibrahim', phone: '09012345678', operator: 'Glo' },
  { name: 'Chinedu Okafor', phone: '07062345678', operator: 'Airtel' },
  { name: 'Aisha Mohammed', phone: '08182233445', operator: '9mobile' },
  { name: 'Emeka Nwankwo', phone: '08032345678', operator: 'MTN' },
];

export default function MobileSimulator({
  currentUser, setCurrentUser, products, transactions, setTransactions,
  subscribers, setSubscribers, handleGlobalRefresh, isSyncing = false,
  handleLoginSuccess, handleLogout, currentScreen, setCurrentScreen,
  apiStatus, setApiStatus
}: MobileSimulatorProps) {

  const toast = useToast();

  // ─── Navigation ───
  const [appTab, setAppTab] = useState<'home' | 'airtime' | 'data' | 'electricity' | 'cable' | 'exam' | 'history' | 'support' | 'profile' | 'a2c' | 'services'>('home');

  // ─── Auth State ───
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [authName, setAuthName] = useState(currentUser.name);
  const [authPhone, setAuthPhone] = useState(currentUser.phone);
  const [authPromo, setAuthPromo] = useState('');
  const [regMode, setRegMode] = useState<'self' | 'referral'>('self');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [bvnInput, setBvnInput] = useState('');
  const [ninInput, setNinInput] = useState('');
  const [kycLoading, setKycLoading] = useState(false);

  // ─── Transaction Flow State ───
  const [selectedCategory, setSelectedCategory] = useState<'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Exam' | 'A2C'>('Airtime');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [targetNumber, setTargetNumber] = useState('');
  const [detectedOperator, setDetectedOperator] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [contactsOpen, setContactsOpen] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [othersSheetOpen, setOthersSheetOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('All');
  const [a2cBank, setA2cBank] = useState('');
  const [a2cAccount, setA2cAccount] = useState('');
  const [a2cPayout, setA2cPayout] = useState(0);

  // ─── Promo System ───
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  // ─── Fund Wallet Modal ───
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmountInput, setFundAmountInput] = useState('5000');
  const [fundGateway, setFundGateway] = useState('Paystack');
  const [fundLoading, setFundLoading] = useState(false);

  // ─── Security Modals ───
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // ─── Confirm Dialog ───
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string; description?: string; confirmText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({ title: '', onConfirm: () => {} });

  // ─── Validate Number State ───
  const [isValidatingNumber, setIsValidatingNumber] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [validationError, setValidationError] = useState('');

  // ─── Helper: Show confirm dialog ───
  const showConfirm = (config: typeof confirmConfig) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  // ─── Dynamic Pricing ───
  const getDynamicPrice = (product: ProductItem): number => {
    if (currentUser.category === 'Premium User') return product.pricePremium ?? product.priceNormal;
    if (currentUser.category === 'Referred User') return product.priceReferred ?? product.priceNormal;
    return product.priceNormal;
  };

  // ─── Network Detection ───
  useEffect(() => {
    if (['airtime', 'data', 'a2c'].includes(appTab) && targetNumber.length >= 4) {
      const prefix = targetNumber.substring(0, 4);
      const mtnPrefixes = ['0803', '0806', '0703', '0706', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'];
      const airtelPrefixes = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0907', '0912'];
      const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
      const ninePrefixes = ['0809', '0818', '0817', '0909', '0908'];
      if (mtnPrefixes.includes(prefix)) setDetectedOperator('MTN');
      else if (airtelPrefixes.includes(prefix)) setDetectedOperator('Airtel');
      else if (gloPrefixes.includes(prefix)) setDetectedOperator('Glo');
      else if (ninePrefixes.includes(prefix)) setDetectedOperator('9mobile');
    }
  }, [targetNumber, appTab]);

  // ─── Tab Default Product Selection ───
  useEffect(() => {
    if (['data', 'electricity', 'cable', 'exam'].includes(appTab)) {
      const catMap: Record<string, string> = { data: 'Data', electricity: 'Electricity', cable: 'Cable', exam: 'Exam' };
      const filtered = products.filter(p => {
        const matchCat = (p.category as string) === catMap[appTab]
          || (catMap[appTab] === 'Cable' && p.category === 'Cable TV')
          || (catMap[appTab] === 'Exam' && p.category === 'Exam Token');
        return matchCat && p.active;
      });
      if (filtered.length > 0 && !selectedProduct) {
        setSelectedProduct(filtered[0]);
        if (appTab !== 'electricity') {
          setCheckoutAmount(getDynamicPrice(filtered[0]).toString());
        }
      }
    }
  }, [appTab, products]);

  // ─── Handle Promo Code Apply ───
  const handleApplyPromoCode = () => {
    const code = promoCodeInput.toUpperCase().trim();
    const promoCodes: Record<string, number> = {
      'WELCOME10': 10, 'EDATA50': 50, 'SAVE20': 20, 'FLASH100': 100, 'VIP500': 500,
    };
    if (promoCodes[code] !== undefined) {
      setAppliedPromo(code);
      setPromoDiscount(promoCodes[code]);
      setPromoError('');
      toast.success(`Promo code "${code}" applied! ₦${promoCodes[code]} discount.`);
    } else {
      setPromoError('Invalid promo code. Please try a different one.');
      toast.error('Invalid promo code.');
    }
  };

  // ─── Validate Number (Electricity/Cable) ───
  const handleValidateNumber = async () => {
    if (!targetNumber || !selectedProduct) return;
    setIsValidatingNumber(true);
    setCustomerName('');
    setValidationError('');

    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
      setTimeout(() => {
        setIsValidatingNumber(false);
        setCustomerName('USMAN ANNUR MUSTAPHA');
        toast.success('Subscriber verified successfully.');
      }, 1000);
      return;
    }

    try {
      const res = await api.validateMeterOrSmartcard(selectedProduct.id, targetNumber);
      setIsValidatingNumber(false);
      if (res.success && res.data?.customer_name) {
        setCustomerName(res.data.customer_name);
        toast.success(`Verified: ${res.data.customer_name}`);
      } else {
        setValidationError(res.error || 'Could not verify subscriber.');
        toast.error(res.error || 'Verification failed.');
      }
    } catch (err: any) {
      setIsValidatingNumber(false);
      setValidationError(err.message || 'Verification error.');
      toast.error('Verification failed. Please try again.');
    }
  };

  // ─── Checkout Initiation (PIN modal) ───
  const handleCheckoutInitiate = () => {
    if (!currentUser.hasPin) {
      toast.warning('Please set up a Transaction PIN first.');
      setChangePinModalOpen(true);
      return;
    }
    setPinInput('');
    setPinSheetOpen(true);
  };

  // ─── Confirm Purchase After PIN ───
  const handleConfirmPurchase = () => {
    const correctPin = currentUser.pinCode || '1234';
    if (pinInput !== correctPin) {
      toast.error('Incorrect PIN. Please try again.');
      return;
    }

    const basePrice = parseFloat(checkoutAmount || '0');
    const finalPrice = Math.max(0, basePrice - promoDiscount);

    if (selectedCategory !== 'A2C') {
      const newBalance = currentUser.walletBalance - finalPrice;
      setCurrentUser((curr: UserProfile) => ({ ...curr, walletBalance: newBalance }));
      setSubscribers((prev: UserProfile[]) => prev.map(s => {
        if (s.email === currentUser.email) return { ...s, walletBalance: newBalance };
        return s;
      }));
    }

    const newTx: Transaction = {
      id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
      type: selectedCategory === 'A2C' ? 'A2C' : selectedCategory === 'Exam' ? 'Exam Token' : selectedCategory === 'Cable' ? 'Cable TV' : selectedCategory,
      productName: selectedProduct?.name || `${selectedCategory} purchase`,
      amount: finalPrice,
      phoneOrMeter: targetNumber,
      reference: `EDAT-${Math.floor(100000 + Math.random() * 900000)}`,
      operator: detectedOperator || selectedProduct?.operator,
      status: 'Completed',
      date: new Date().toISOString(),
      disputeRaised: false,
    };

    setTransactions((prev: Transaction[]) => [newTx, ...prev]);
    setPinSheetOpen(false);
    setActiveReceipt(newTx);

    if (appliedPromo) { setAppliedPromo(''); setPromoDiscount(0); setPromoCodeInput(''); }

    toast.success(`₦${finalPrice.toLocaleString()} payment completed successfully!`);
  };

  // ─── Login Handler ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.login(authEmail, authPassword);
      if (res.success && res.data?.token) {
        localStorage.setItem('edata_sandbox', 'false');
        if (setApiStatus) setApiStatus('connected');
        if (handleLoginSuccess) handleLoginSuccess(res.data.token);
        setAuthPassword('');
        setLoginError('');
      } else {
        setLoginError(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      const isConnectionError = !err.status || err.message?.toLowerCase().includes('failed to fetch') || err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed with status');
      if (isConnectionError) {
        const match = subscribers.find(s => s.email.toLowerCase() === authEmail.toLowerCase());
        if (match) {
          localStorage.setItem('edata_sandbox', 'true');
          if (setApiStatus) setApiStatus('sandbox');
          setCurrentUser(match);
          localStorage.setItem('edata_current_user', JSON.stringify(match));
          setAuthPassword('');
          setLoginError('');
          if (handleLoginSuccess) handleLoginSuccess('mock-sandbox-token');
          toast.info('Backend offline. Running in Sandbox Mode.');
        } else {
          setLoginError('Backend offline. Email not found in sandbox registry.');
        }
      } else {
        setLoginError(err.message || 'Invalid credentials.');
      }
    } fill_in: {
      setLoginLoading(false);
    }
  };

  // ─── Register Handler ───
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.warning('Please accept the terms and conditions.');
      return;
    }
    setCurrentScreen('otp');
  };

  // ─── OTP Handler ───
  const handleVerifyOTP = () => {
    if (otpCode.length < 4) {
      setVerificationError('Please enter a valid 4-digit code.');
      return;
    }
    setVerificationError('');
    setCurrentScreen('password_create');
  };

  // ─── Register Password Handler ───
  const handleRegisterPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    const newUserObj: UserProfile = {
      name: authEmail.split('@')[0].toUpperCase(),
      email: authEmail, phone: '', walletBalance: 0,
      category: regMode === 'referral' ? 'Referred User' : 'Basic User',
      bvn: '', nin: '', isVerified: false, pinCode: '', hasPin: false, promoCode: authPromo,
    };
    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
      localStorage.setItem('edata_sandbox', 'true');
      setSubscribers((prev: UserProfile[]) => {
        if (!prev.find(s => s.email.toLowerCase() === authEmail.toLowerCase())) return [...prev, newUserObj];
        return prev;
      });
      setCurrentUser(newUserObj);
      localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
      toast.success('Account created! Set up your PIN when making your first purchase.');
    } else {
      toast.info('API mode active. Please sign up via the web app first.');
    }
    setRegPassword(''); setRegConfirmPassword('');
    setCurrentScreen('app');
  };

  // ─── KYC Handler ───
  const handleSubmitKYC = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      const newUserObj: UserProfile = {
        name: authName, email: authEmail, phone: authPhone, walletBalance: 0,
        category: regMode === 'referral' ? 'Referred User' : 'Basic User',
        bvn: bvnInput || '11111111111', nin: ninInput || '22222222222',
        isVerified: true, pinCode: '', hasPin: false, promoCode: authPromo,
      };
      if (apiStatus === 'offline' || apiStatus === 'sandbox') {
        localStorage.setItem('edata_sandbox', 'true');
        setSubscribers((prev: UserProfile[]) => {
          if (!prev.find(s => s.email.toLowerCase() === authEmail.toLowerCase())) return [...prev, newUserObj];
          return prev;
        });
        setCurrentUser(newUserObj);
        localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
      } else {
        setCurrentUser((curr: UserProfile) => ({ ...curr, isVerified: true }));
      }
      setCurrentScreen('app');
      toast.success('Identity verified successfully!');
    }, 1500);
  };

  // ─── PDF Receipt ───
  const generatePDFReceipt = (tx: Transaction) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' });
      const primaryColor = [14, 165, 233];
      const darkColor = [15, 23, 42];
      const lightBg = [248, 250, 252];
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(0, 0, 105, 148, 'F');
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 105, 8, 'F');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('eData Mobile', 52.5, 18, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Lightning Fast Telecom & Utility Payouts', 52.5, 22, { align: 'center' });
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
      doc.line(10, 26, 95, 26);
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(15, 30, 75, 10, 1.5, 1.5, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(15, 30, 75, 10, 1.5, 1.5, 'S');
      doc.setTextColor(4, 120, 87); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('● TRANSACTION SUCCESSFUL', 52.5, 36.5, { align: 'center' });
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text(`NGN ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 52.5, 52, { align: 'center' });
      doc.setDrawColor(241, 245, 249); doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 60, 85, 60, 2.5, 2.5, 'FD');
      doc.setFontSize(7.5);
      const details = [
        { label: 'Reference ID', val: tx.reference },
        { label: 'Service/Product', val: tx.productName },
        { label: 'Recipient/Meter', val: tx.phoneOrMeter },
        { label: 'Provider / Network', val: tx.operator || 'N/A' },
        { label: 'Payment Method', val: 'Wallet Balance' },
        { label: 'Execution Date', val: new Date(tx.date).toLocaleString() },
      ];
      let currentY = 67;
      details.forEach((item) => {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
        doc.text(item.label, 14, currentY);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 65, 85);
        let displayVal = item.val;
        if (displayVal.length > 28) displayVal = displayVal.substring(0, 26) + '...';
        doc.text(displayVal, 91, currentY, { align: 'right' });
        currentY += 8.5;
      });
      doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Thank you for choosing eData Mobile.', 52.5, 134, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Support: support@edata.com | Web: www.edata.com', 52.5, 138, { align: 'center' });
      doc.save(`Receipt-${tx.reference}.pdf`);
      toast.success('PDF receipt downloaded.');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Error generating PDF receipt.');
    }
  };

  // ─── Copy Receipt ───
  const copyReceiptToClipboard = (tx: Transaction) => {
    const text = `=== EDATA TRANSACTION RECEIPT ===\nReference ID: ${tx.reference}\nAmount: ₦${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\nService: ${tx.productName}\nRecipient: ${tx.phoneOrMeter}\nProvider: ${tx.operator || 'N/A'}\nDate: ${new Date(tx.date).toLocaleString()}\nStatus: SUCCESSFUL\n=================================\nThank you for using eData Mobile!`;
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Receipt copied to clipboard!'))
      .catch(() => toast.error('Failed to copy receipt.'));
  };

  // ─── Dispute ───
  const handleRaiseDispute = (txId: string) => {
    setTransactions((prev: Transaction[]) => prev.map(tx => {
      if (tx.id === txId) return { ...tx, disputeRaised: true, disputeStatus: 'Open', disputeNotes: 'Customer reported service token delay. Awaiting Admin refund.' };
      return tx;
    }));
    toast.success('Dispute raised. Admin has been notified.');
  };

  // ─── Fund Wallet ───
  const handleFundWallet = (gateway: string, amount: number) => {
    showConfirm({
      title: `Fund ₦${amount.toLocaleString()} via ${gateway}?`,
      description: 'This will credit your wallet balance immediately.',
      confirmText: 'Fund Now',
      variant: 'info',
      onConfirm: () => {
        setConfirmOpen(false);
        const newBalance = currentUser.walletBalance + amount;
        setCurrentUser((curr: UserProfile) => ({ ...curr, walletBalance: newBalance }));
        setSubscribers((prev: UserProfile[]) => prev.map(s => {
          if (s.email === currentUser.email) return { ...s, walletBalance: newBalance };
          return s;
        }));
        const fundTx: Transaction = {
          id: `tx-fund-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'Wallet Funding',
          productName: `${gateway} gateway funding`,
          amount: amount,
          phoneOrMeter: `Ref: ${gateway.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
          reference: `EDAT-FUND-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'Completed',
          date: new Date().toISOString(),
          disputeRaised: false,
        };
        setTransactions((prev: Transaction[]) => [fundTx, ...prev]);
        toast.success(`₦${amount.toLocaleString()} credited via ${gateway}!`);
      },
    });
  };

  // ─── Computed Values ───
  const yesterdaysEarnings = (() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toDateString();
    return transactions.filter(t => new Date(t.date).toDateString() === yStr && t.status === 'Completed').reduce((acc, t) => acc + t.amount, 0);
  })();

  const referralLink = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `https://edata.com.ng/signup?ref=${currentUser.id || '1'}`
    : `http://localhost/edata/signup?ref=${currentUser.id || '1'}`;

  const lastTx = transactions[0];

  // ─── Service Icon Colors (differentiated) ───
  const serviceIcons = [
    { id: 'Airtime', icon: Phone, color: 'text-sky-600 bg-sky-50', tab: 'airtime' },
    { id: 'Data', icon: Layers, color: 'text-violet-600 bg-violet-50', tab: 'data' },
    { id: 'Cable TV', icon: Tv, color: 'text-rose-600 bg-rose-50', tab: 'cable' },
    { id: 'Electricity', icon: Zap, color: 'text-amber-600 bg-amber-50', tab: 'electricity' },
    { id: 'Refer & Earn', icon: Gift, color: 'text-emerald-600 bg-emerald-50', action: () => {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied! Share it to earn rewards.');
    }},
    { id: 'A2C Convert', icon: RefreshCw, color: 'text-orange-600 bg-orange-50', tab: 'a2c' },
    { id: 'Exam Card', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50', tab: 'exam' },
    { id: 'More', icon: MoreHorizontal, color: 'text-slate-600 bg-slate-100', action: () => setAppTab('services') },
  ];

  // ════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════
  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50 select-none" id="web-app-container">
      <div className="flex-1 bg-slate-50 flex flex-col">

        {/* ═══════════════════════════════════════
            AUTH SCREEN
        ═══════════════════════════════════════ */}
        {currentScreen === 'auth' && (
          <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-sky-50/30 animate-fade-in">
            <div className="px-6 pt-10 pb-6 space-y-6">
              {/* Logo */}
              <div className="text-center space-y-3">
                <div className="inline-flex bg-gradient-to-br from-sky-500 to-sky-700 text-white p-3.5 rounded-2xl shadow-lg shadow-sky-500/25 animate-float">
                  <Zap className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">eData Mobile</h1>
                <p className="text-sm text-slate-500 font-medium">Instant utility payments, lightning fast.</p>
              </div>

              {/* Sandbox Notice */}
              {apiStatus === 'offline' && (
                <div className="bg-sky-50 border border-sky-100 text-sky-700 p-3.5 rounded-2xl text-xs space-y-1 animate-slide-down">
                  <div className="flex items-center gap-2 font-bold">
                    <Info className="w-4 h-4 shrink-0 text-sky-500" />
                    <span>Running in Sandbox Mode</span>
                  </div>
                  <p className="text-sky-600/80 ml-6">Try <strong>usmanannur58@gmail.com</strong> / <strong>1234</strong> or create a new account.</p>
                </div>
              )}

              {/* Tab Switcher */}
              <div className="bg-slate-100 p-1 rounded-2xl flex relative">
                <div
                  className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                  style={{ width: '50%', left: isRegistering ? '50%' : '0%' }}
                />
                <button
                  onClick={() => setIsRegistering(false)}
                  className={`flex-grow py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${!isRegistering ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsRegistering(true)}
                  className={`flex-grow py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${isRegistering ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              {isRegistering ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                    <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">How did you find us?</label>
                    <select value={regMode} onChange={(e) => { setRegMode(e.target.value as any); if (e.target.value === 'self') setAuthPromo(''); }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800 appearance-none">
                      <option value="self">I navigated here by myself (Self-Registered)</option>
                      <option value="referral">Joined through a Referral Link / Code</option>
                    </select>
                  </div>
                  {regMode === 'referral' && (
                    <div className="space-y-1.5 animate-slide-down">
                      <label className="text-xs font-semibold text-slate-500 block">Referral Code</label>
                      <input type="text" value={authPromo} onChange={(e) => setAuthPromo(e.target.value)}
                        placeholder="e.g. REF-58291"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800" />
                    </div>
                  )}
                  <label className="flex items-start gap-2.5 pt-1">
                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 accent-sky-600 rounded w-4 h-4" />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I accept the <strong className="text-slate-700">Terms & Conditions</strong> and privacy policy.
                    </span>
                  </label>
                  <button type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.98]">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                  {loginError && (
                    <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border border-rose-100 animate-slide-down">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                    <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@email.com" disabled={loginLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800 disabled:opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Password</label>
                    <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••" disabled={loginLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800 disabled:opacity-60" />
                  </div>
                  <button type="submit" disabled={loginLoading}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.98]">
                    {loginLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Social Login */}
            <div className="px-6 pb-8 space-y-4">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="px-3 text-xs text-slate-400 font-medium">or continue with</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
              <button
                onClick={() => {
                  if (apiStatus === 'offline' || apiStatus === 'sandbox') {
                    localStorage.setItem('edata_sandbox', 'true');
                    const match = subscribers.find(s => s.email === DEFAULT_USER.email) || DEFAULT_USER;
                    setCurrentUser(match);
                    localStorage.setItem('edata_current_user', JSON.stringify(match));
                    if (handleLoginSuccess) handleLoginSuccess('google-sandbox-token');
                  } else { setCurrentScreen('app'); }
                }}
                className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.81-6.277-6.277 0-3.466 2.81-6.277 6.277-6.277 1.5 0 2.87.532 3.945 1.417l2.96-2.96C18.67 1.956 15.65 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.804 0 10.88-4.144 10.88-11.24 0-.616-.062-1.217-.183-1.801l-10.7-.154z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            OTP SCREEN
        ═══════════════════════════════════════ */}
        {currentScreen === 'otp' && (
          <div className="flex-1 p-6 flex flex-col justify-between bg-white animate-fade-in">
            <div className="space-y-8 mt-8">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
                <p className="text-sm text-slate-500 font-medium">
                  We sent a 4-digit code to <strong className="text-slate-800">{authEmail}</strong>
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newCode = otpCode.split('');
                        newCode[i] = val;
                        setOtpCode(newCode.join(''));
                        if (val && i < 3) {
                          const next = e.target.nextElementSibling as HTMLInputElement;
                          if (next) next.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                          const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                          if (prev) prev.focus();
                        }
                      }}
                      className="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-xl font-bold text-slate-900 input-focus"
                    />
                  ))}
                </div>
                {verificationError && (
                  <p className="text-rose-500 text-xs text-center font-semibold">{verificationError}</p>
                )}
                <p className="text-xs text-slate-400 text-center font-medium font-semibold">
                  Didn't receive code? <button className="text-sky-600 font-semibold hover:underline">Resend</button>
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleVerifyOTP}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.98]">
                Verify & Continue
              </button>
              <button onClick={() => setCurrentScreen('auth')}
                className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
                Back
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PASSWORD CREATE SCREEN
        ═══════════════════════════════════════ */}
        {currentScreen === 'password_create' && (
          <div className="flex-1 p-6 flex flex-col justify-between bg-white animate-fade-in">
            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Create Password</h2>
                <p className="text-sm text-slate-500 font-medium">Secure your account with a strong password.</p>
              </div>
              <form onSubmit={handleRegisterPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Password</label>
                  <div className="relative">
                    <input type={showRegPassword ? 'text' : 'password'} required value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 characters"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 py-3 text-sm input-focus text-slate-800" />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Confirm Password</label>
                  <div className="relative">
                    <input type={showRegConfirmPassword ? 'text' : 'password'} required value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="Re-enter password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 py-3 text-sm input-focus text-slate-800" />
                    <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.98] mt-4">
                  Complete Registration
                </button>
              </form>
            </div>
            <button onClick={() => setCurrentScreen('auth')}
              className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
              Back
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════
            KYC / BVN SCREEN
        ═══════════════════════════════════════ */}
        {currentScreen === 'bvn_verify' && (
          <div className="flex-1 p-6 flex flex-col justify-between bg-white animate-fade-in">
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 font-bold px-2.5 py-1 rounded-full inline-block">Identity Check</span>
                <h2 className="text-xl font-bold text-slate-900 font-display">Verify Your Identity</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Provide your <strong className="text-slate-700">BVN</strong> or <strong className="text-slate-700">NIN</strong> to comply with central regulations.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">National ID Number (NIN)</label>
                  <input type="text" maxLength={11} value={ninInput}
                    onChange={(e) => setNinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="11-digit NIN"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800" />
                </div>
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-100" />
                  <span className="px-3 text-xs text-slate-300 font-medium">or</span>
                  <div className="flex-grow border-t border-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Bank Verification Number (BVN)</label>
                  <input type="text" maxLength={11} value={bvnInput}
                    onChange={(e) => setBvnInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="11-digit BVN"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleSubmitKYC} disabled={kycLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-sky-600/20 transition-spring active:scale-[0.98] flex items-center justify-center gap-2">
                {kycLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Continue'}
              </button>
              <button onClick={() => setCurrentScreen('app')}
                className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600 transition-colors">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            MAIN APP (Dashboard + Tabs)
        ═══════════════════════════════════════ */}
        {currentScreen === 'app' && (
          <div className="flex-1 flex flex-col justify-between">

            {/* ─── Header ─── */}
            <div className="px-5 pt-3 pb-3 shrink-0 bg-white border-b border-slate-100/80 w-full">
              <div className="max-w-md mx-auto w-full">
                {appTab === 'home' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/25">
                        {(currentUser.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold leading-none">Welcome back</span>
                        <span className="text-sm font-bold text-slate-900 leading-none mt-0.5 block">
                          {(currentUser.name || 'User').split(' ')[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setAppTab('support')}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-smooth">
                        <Headphones className="w-[18px] h-[18px]" />
                      </button>
                      <button type="button" onClick={() => setAppTab('history')}
                        className="relative p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-smooth">
                        <Bell className="w-[18px] h-[18px]" />
                        {transactions.length > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full border border-white" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setAppTab('home')}
                        className="p-1.5 hover:bg-sky-50 rounded-xl text-sky-600 transition-smooth">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-none font-display">
                          {appTab === 'airtime' && 'Airtime VTU'}
                          {appTab === 'data' && 'Data Bundle'}
                          {appTab === 'electricity' && 'Electricity'}
                          {appTab === 'cable' && 'Cable TV'}
                          {appTab === 'exam' && 'Exam Token'}
                          {appTab === 'a2c' && 'Airtime to Cash'}
                          {appTab === 'history' && 'Transactions'}
                          {appTab === 'support' && 'Support'}
                          {appTab === 'profile' && 'Profile'}
                          {appTab === 'services' && 'All Services'}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { if (handleGlobalRefresh) handleGlobalRefresh(); }}
                        className={`p-1.5 hover:bg-sky-50 text-sky-600 rounded-xl transition-smooth ${isSyncing ? 'animate-spin' : ''}`}>
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {currentUser.isVerified ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-100">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <button onClick={() => setCurrentScreen('bvn_verify')}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-600 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 transition-smooth border border-amber-100">
                          <AlertTriangle className="w-3 h-3" /> Verify
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Tab Content ─── */}
            <div className="flex-1 overflow-y-auto p-4 relative scrollbar-none bg-slate-50 flex flex-col w-full">
              <div className="max-w-md mx-auto w-full flex-1 flex flex-col space-y-3">

                {/* Sync indicator */}
                {isSyncing && (
                  <div className="bg-sky-50 text-sky-600 text-[10px] font-bold py-2 text-center rounded-xl flex items-center justify-center gap-2 animate-pulse border border-sky-100/50">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing with API...
                  </div>
                )}

                {/* ═══ HOME TAB ═══ */}
                {appTab === 'home' && (
                  <div className="space-y-3 text-left animate-fade-in">
                    {/* Wallet Card */}
                    <div className="wallet-gradient text-white p-4.5 rounded-2xl shadow-xl shadow-sky-950/15 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                      <div className="relative">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Available Balance</span>
                          </div>
                          <button type="button" onClick={() => setAppTab('history')}
                            className="text-[10px] text-white/60 font-bold uppercase tracking-wider hover:text-white/90 transition-colors">
                            History →
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-2.5">
                          <span className="text-2xl font-extrabold font-mono tracking-tight">
                            {isBalanceHidden ? '₦••••••' : `₦${currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          </span>
                          <button type="button" onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                            className="text-white/50 hover:text-white transition-colors p-1">
                            {isBalanceHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button type="button" onClick={() => { setFundAmountInput('5000'); setFundGateway('Paystack'); setFundModalOpen(true); }}
                            className="bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold py-1.5 px-4 rounded-full transition-all backdrop-blur-sm border border-white/15 active:scale-95">
                            + Add Money
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Strip */}
                    <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-sky-500" />
                        <span className="text-xs text-slate-500 font-semibold">Yesterday's Earnings</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold font-mono">
                        +₦{yesterdaysEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-3 flex justify-around items-center border border-slate-100 shadow-sm">
                      {[
                        { id: 'bank', label: 'To Bank', icon: Smartphone },
                        { id: 'palmpay', label: 'PalmPay', icon: ArrowUpRight },
                        { id: 'savings', label: 'Savings', icon: Coins },
                        { id: 'cards', label: 'Cards', icon: CreditCard },
                      ].map(btn => (
                        <button key={btn.id} type="button"
                          onClick={() => toast.info(`${btn.label} — connected to your wallet.`)}
                          className="flex flex-col items-center gap-1.5 group">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center transition-spring group-active:scale-90 border border-slate-100/50">
                            <btn.icon className="w-4.5 h-4.5 text-slate-500 group-hover:text-sky-600 transition-colors" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 group-hover:text-sky-600 transition-colors">{btn.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Last Transaction */}
                    {lastTx ? (
                      <div className="bg-white rounded-2xl p-3.5 flex justify-between items-center border border-slate-100 shadow-sm active:scale-[0.99] transition-spring cursor-pointer hover:border-slate-200"
                        onClick={() => setActiveReceipt(lastTx)}>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 font-mono">₦{lastTx.amount.toLocaleString()}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              lastTx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>{lastTx.status}</span>
                          </div>
                          <span className="text-xs text-slate-400 block truncate font-medium">{lastTx.productName}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-400 block font-semibold">No transactions yet</p>
                      </div>
                    )}

                    {/* Services Grid */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                        {serviceIcons.map((srv, idx) => (
                          <button key={idx} type="button"
                            onClick={() => {
                              if (srv.tab) { setSelectedCategory(srv.id as any); setAppTab(srv.tab as any); }
                              else if (srv.action) srv.action();
                            }}
                            className="flex flex-col items-center gap-1.5 group">
                            <div className={`w-10 h-10 rounded-xl ${srv.color} flex items-center justify-center transition-spring group-hover:scale-105 group-active:scale-90 border border-slate-100/10`}>
                              <srv.icon className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 text-center leading-tight group-hover:text-slate-700 transition-colors">{srv.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Membership + Upgrade Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm space-y-2.5">
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Membership</h5>
                          <span className="text-[10px] text-slate-400 font-medium">Current tier</span>
                        </div>
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-xl block text-center truncate">
                          {currentUser.category}
                        </span>
                        <button type="button" onClick={() => setPriceSheetOpen(true)}
                          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold py-1.5 rounded-xl transition-smooth font-display">
                          View Rates
                        </button>
                      </div>
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm space-y-2.5 relative overflow-hidden">
                        {currentUser.category !== 'Premium User' && (
                          <div className="absolute top-0 right-0 bg-sky-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-bl-lg tracking-wider">PRO</div>
                        )}
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">VTU License</h5>
                          <span className="text-[10px] text-slate-400 font-medium">Agent rates</span>
                        </div>
                        <span className="text-sm font-extrabold text-sky-600 block tabular-nums">
                          {currentUser.category === 'Premium User' ? 'ACTIVE' : `₦${(currentUser.upgradeFee || 5000).toLocaleString()}`}
                        </span>
                        {currentUser.category === 'Premium User' ? (
                          <button type="button" disabled className="w-full bg-emerald-50 text-emerald-600 text-[11px] font-bold py-1.5 rounded-xl cursor-not-allowed border border-emerald-100">
                            Active ✓
                          </button>
                        ) : currentUser.hasPendingUpgrade ? (
                          <button type="button" disabled className="w-full bg-sky-50 text-sky-500 text-[11px] font-bold py-1.5 rounded-xl cursor-not-allowed border border-sky-100">
                            Pending
                          </button>
                        ) : (
                          <button type="button" onClick={() => setUpgradeModalOpen(true)}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold py-1.5 rounded-xl transition-smooth active:scale-95 btn-sheen">
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Referral Banner */}
                    <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-sky-500/10 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-spring"
                      onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Referral link copied!'); }}>
                      <div className="space-y-1 max-w-[70%] text-white">
                        <h4 className="text-xs font-bold font-display">Earn up to ₦2,500</h4>
                        <p className="text-[10px] text-white/80 font-medium">Invite friends and earn dynamic cash payouts</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center border border-white/10 shrink-0">
                        <Gift className="w-4.5 h-4.5 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ SERVICE TABS (Unified via ServiceForm) ═══ */}
                {['airtime', 'data', 'electricity', 'cable', 'exam', 'a2c'].includes(appTab) && (
                  <ServiceForm
                    serviceType={appTab as any}
                    serviceLabel={appTab}
                    products={products}
                    targetNumber={targetNumber}
                    setTargetNumber={setTargetNumber}
                    detectedOperator={detectedOperator}
                    setDetectedOperator={setDetectedOperator}
                    checkoutAmount={checkoutAmount}
                    setCheckoutAmount={setCheckoutAmount}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    setSelectedCategory={setSelectedCategory}
                    getDynamicPrice={getDynamicPrice}
                    promoCodeInput={promoCodeInput}
                    setPromoCodeInput={setPromoCodeInput}
                    appliedPromo={appliedPromo}
                    setAppliedPromo={setAppliedPromo}
                    promoDiscount={promoDiscount}
                    setPromoDiscount={setPromoDiscount}
                    promoError={promoError}
                    handleApplyPromoCode={handleApplyPromoCode}
                    handleCheckoutInitiate={handleCheckoutInitiate}
                    onOpenContacts={() => setContactsOpen(true)}
                    onBack={() => setAppTab('home')}
                    currentBalance={currentUser.walletBalance}
                    isValidatingNumber={isValidatingNumber}
                    handleValidateNumber={handleValidateNumber}
                    customerName={customerName}
                    validationError={validationError}
                    a2cBank={a2cBank} setA2cBank={setA2cBank}
                    a2cAccount={a2cAccount} setA2cAccount={setA2cAccount}
                    a2cPayout={a2cPayout} setA2cPayout={setA2cPayout}
                    toast={toast}
                  />
                )}

                {/* ═══ HISTORY TAB ═══ */}
                {appTab === 'history' && (
                  <div className="space-y-3 flex flex-col flex-1 text-left animate-fade-in">
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                      <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflow</span>
                        <strong className="text-sm text-emerald-600 font-extrabold block mt-0.5 font-mono">
                          ₦{transactions.filter(tx => tx.type === 'Wallet Funding' && tx.status === 'Completed').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                        </strong>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outflow</span>
                        <strong className="text-sm text-slate-700 font-extrabold block mt-0.5 font-mono">
                          ₦{transactions.filter(tx => tx.type !== 'Wallet Funding' && tx.status === 'Completed').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search transactions..." value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm input-focus text-slate-800" />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 shrink-0">
                      {['All', 'Airtime', 'Data', 'Electricity', 'Cable TV', 'Exam Token', 'A2C', 'Wallet Funding'].map(cat => (
                        <button key={cat} type="button" onClick={() => setHistoryCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-smooth ${
                            historyCategoryFilter === cat
                              ? 'bg-sky-600 border-sky-600 text-white'
                              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                          }`}>
                          {cat === 'Wallet Funding' ? 'Funding' : cat === 'Exam Token' ? 'Exam' : cat === 'Cable TV' ? 'Cable' : cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none pb-8">
                      {(() => {
                        const filtered = transactions.filter(tx => {
                          const matchesCat = historyCategoryFilter === 'All' || tx.type === historyCategoryFilter;
                          const q = historySearch.toLowerCase().trim();
                          const matchesSearch = !q || [tx.productName, tx.phoneOrMeter, tx.reference, tx.operator].some(f => f?.toLowerCase().includes(q));
                          return matchesCat && matchesSearch;
                        });
                        if (filtered.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                              <History className="w-8 h-8 text-slate-200" />
                              <p className="text-xs font-bold text-slate-400">No transactions found</p>
                              <span className="text-[11px] text-slate-400 font-medium">Try adjusting your search or filters.</span>
                            </div>
                          );
                        }
                        return filtered.map(tx => {
                          const isFunding = tx.type === 'Wallet Funding';
                          return (
                            <div key={tx.id} onClick={() => setActiveReceipt(tx)}
                              className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between hover:border-slate-200 transition-smooth cursor-pointer shadow-sm active:scale-[0.99]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2 rounded-xl shrink-0 ${isFunding ? 'bg-emerald-50 text-emerald-500' : tx.status === 'Failed' ? 'bg-rose-50 text-rose-500 font-bold border border-rose-100' : 'bg-sky-50 text-sky-500'}`}>
                                  {isFunding ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-800 truncate">{tx.productName}</h5>
                                  <span className="text-[11px] text-slate-400 truncate block font-medium">{tx.phoneOrMeter}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className={`text-xs font-bold block font-mono ${isFunding ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {isFunding ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {new Date(tx.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* ═══ SUPPORT TAB ═══ */}
                {appTab === 'support' && (
                  <div className="flex-1 flex flex-col space-y-4 animate-fade-in text-left">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => toast.info('Redirecting to WhatsApp...')}
                        className="bg-white border border-slate-100 hover:border-slate-200 p-3.5 rounded-2xl text-left transition-smooth shadow-sm active:scale-[0.98]">
                        <span className="text-xs font-bold text-slate-800 block">WhatsApp</span>
                        <span className="text-[10px] text-sky-600 mt-1 block font-bold">Instant Chat →</span>
                      </button>
                      <button onClick={() => toast.info('Calling helpline...')}
                        className="bg-white border border-slate-100 hover:border-slate-200 p-3.5 rounded-2xl text-left transition-smooth shadow-sm active:scale-[0.98]">
                        <span className="text-xs font-bold text-slate-800 block">Call Support</span>
                        <span className="text-[10px] text-sky-600 mt-1 block font-bold">Toll Free →</span>
                      </button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); toast.success('Support ticket created! We\'ll contact you at: ' + currentUser.email); setChatMessage(''); }}
                      className="bg-white border border-slate-100 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Create Ticket</h4>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm input-focus text-slate-800 appearance-none">
                        <option>Failed Transaction / Value Not Received</option>
                        <option>Wallet Funding / Bank Transfer Issue</option>
                        <option>Reseller License / Upgrade Problem</option>
                        <option>Account Profile / Biometric Reset</option>
                        <option>Other Complaints & Inquiries</option>
                      </select>
                      <textarea required rows={3} placeholder="Describe your issue..."
                        value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm input-focus text-slate-800 resize-none font-medium" />
                      <button type="submit"
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3 rounded-xl transition-spring active:scale-[0.98]">
                        Submit Ticket
                      </button>
                    </form>
                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-sky-850">Need to dispute a transaction?</h4>
                        <p className="text-[10px] text-sky-650 mt-0.5 font-semibold">Open your history to raise disputes.</p>
                      </div>
                      <button onClick={() => setAppTab('history')}
                        className="bg-sky-600 text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition-smooth active:scale-95">
                        View
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══ PROFILE TAB ═══ */}
                {appTab === 'profile' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                      <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-sky-500/20">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{currentUser.name}</h4>
                        </div>
                        <span className="text-xs text-slate-400 block mt-0.5">{currentUser.email}</span>
                        {currentUser.phone && <span className="text-xs text-sky-600 font-medium block mt-0.5">{currentUser.phone}</span>}
                        <div className="mt-1.5">
                          {currentUser.category === 'Premium User' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/50 text-amber-700 text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-sm shadow-amber-500/5">
                              👑 Premium Reseller
                            </span>
                          ) : currentUser.category === 'Referred User' ? (
                            <span className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-700 text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                              👥 Referred Member
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/50 text-slate-600 text-[9.5px] font-medium px-2 py-0.5 rounded-full">
                              👤 Basic Member
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {currentUser.category !== 'Premium User' && (
                      <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3 relative overflow-hidden shadow-md">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-black text-sky-400 tracking-wider">Agent License Upgrade</span>
                          <h4 className="text-xs font-bold text-slate-100">Unlock Permanent Reseller Rates</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                            Upgrade to Premium to get dynamic discounts on all VTU airtime and data packages.
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setUpgradeModalOpen(true)}
                          className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-spring active:scale-[0.98] cursor-pointer text-center block btn-sheen"
                        >
                          Upgrade Now for ₦{(currentUser.upgradeFee || 5000).toLocaleString()}
                        </button>
                      </div>
                    )}

                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-1 shadow-sm">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">Security & Controls</h4>

                      <button onClick={() => { setOldPin(''); setNewPin(''); setConfirmNewPin(''); setChangePinModalOpen(true); }}
                        className="w-full flex items-center justify-between py-3 border-b border-slate-50 group text-left">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block font-display">Transaction PIN</span>
                          <span className="text-[11px] text-slate-400 font-medium">Required before purchase checkout</span>
                        </div>
                        <span className="text-xs text-sky-600 font-bold group-hover:text-sky-700 flex items-center gap-1">
                          {currentUser.hasPin ? 'Change' : 'Set Up'} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      <button onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setChangePasswordModalOpen(true); }}
                        className="w-full flex items-center justify-between py-3 border-b border-slate-50 group text-left">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Password Settings</span>
                          <span className="text-[11px] text-slate-400 font-medium">Update account login password</span>
                        </div>
                        <span className="text-xs text-sky-600 font-bold group-hover:text-sky-700 flex items-center gap-1">
                          Change <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      <div className="flex items-center justify-between py-3 border-b border-slate-50">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Biometric Lock</span>
                          <span className="text-[11px] text-slate-400 font-medium">Enable Touch ID / Face ID login</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!currentUser.biometricsEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCurrentUser((prev: UserProfile) => ({ ...prev, biometricsEnabled: checked }));
                              setSubscribers((prev: UserProfile[]) => prev.map(s => s.email === currentUser.email ? { ...s, biometricsEnabled: checked } : s));
                            }}
                            className="sr-only peer" />
                          <div className="w-10 h-[22px] bg-slate-200 rounded-full peer peer-checked:bg-sky-500 peer-checked:after:translate-x-[18px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-sm" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block font-display">Two-Factor Auth (2FA)</span>
                          <span className="text-[11px] text-slate-400 font-medium">Extra layer of verification codes</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-1 rounded-full border border-emerald-100">Active</span>
                      </div>
                    </div>

                    <button onClick={() => {
                      showConfirm({
                        title: 'Sign Out?',
                        description: 'You will need to log in again to access your account.',
                        confirmText: 'Sign Out',
                        variant: 'danger',
                        onConfirm: () => { setConfirmOpen(false); if (handleLogout) handleLogout(); else setCurrentScreen('auth'); },
                      });
                    }}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-3.5 rounded-2xl transition-smooth flex items-center justify-center gap-2 border border-rose-100">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}

                {/* ═══ SERVICES CATALOG TAB ═══ */}
                {appTab === 'services' && (
                  <div className="space-y-5 text-left pb-6 animate-fade-in">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Core Services</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'Airtime', name: 'Airtime VTU', icon: Phone, desc: 'Discounted VTU top-up', color: 'text-sky-600 bg-sky-50', tab: 'airtime' },
                          { id: 'Data', name: 'Data Bundle', icon: Layers, desc: 'SME & Gifting bundles', color: 'text-violet-600 bg-violet-50', tab: 'data' },
                          { id: 'Cable TV', name: 'Cable TV', icon: Tv, desc: 'DStv, GOtv, Startimes', color: 'text-rose-600 bg-rose-50', tab: 'cable' },
                          { id: 'Electricity', name: 'Electricity', icon: Zap, desc: 'Prepaid & postpaid', color: 'text-amber-600 bg-amber-50', tab: 'electricity' },
                          { id: 'A2C', name: 'Airtime to Cash', icon: RefreshCw, desc: 'Convert to cash', color: 'text-orange-600 bg-orange-50', tab: 'a2c' },
                          { id: 'Exam', name: 'Exam Card', icon: BookOpen, desc: 'WAEC, NECO, NABTEB', color: 'text-indigo-600 bg-indigo-50', tab: 'exam' },
                        ].map(srv => (
                          <button key={srv.id} type="button"
                            onClick={() => { setSelectedCategory(srv.id as any); setAppTab(srv.tab as any); }}
                            className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-smooth gap-2 active:scale-[0.98] shadow-sm text-left w-full">
                            <div className={`p-2 rounded-xl ${srv.color}`}><srv.icon className="w-4 h-4" /></div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block font-display">{srv.name}</span>
                              <span className="text-[10px] text-slate-400 block font-semibold">{srv.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">Wallet Operations</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => { setFundAmountInput('5000'); setFundGateway('Paystack'); setFundModalOpen(true); }}
                          className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-smooth gap-2 active:scale-[0.98] shadow-sm text-left w-full">
                          <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50"><Coins className="w-4 h-4" /></div>
                          <div><span className="text-xs font-bold text-slate-800 block">Fund Wallet</span><span className="text-[10px] text-slate-400 block font-semibold font-display">Instant deposits</span></div>
                        </button>
                        <button type="button" onClick={() => setUpgradeModalOpen(true)}
                          className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-smooth gap-2 active:scale-[0.98] shadow-sm text-left w-full">
                          <div className="p-2 rounded-xl text-sky-600 bg-sky-50"><Flame className="w-4 h-4" /></div>
                          <div><span className="text-xs font-bold text-slate-800 block">Agent License</span><span className="text-[10px] text-slate-400 block font-semibold font-display font-medium">Permanent discounts</span></div>
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">Utility Utilities</h4>
                      <div className="grid grid-cols-2 gap-3 opacity-55">
                        {[
                          { name: 'Broadband', icon: Wifi, desc: 'Smile, Spectranet' },
                          { name: 'Bet Funding', icon: Flame, desc: 'Bet9ja, SportyBet' },
                          { name: 'Education Fees', icon: User, desc: 'Institution bills' },
                          { name: 'Auto Cover', icon: ShieldAlert, desc: 'Road tax & insurance' },
                        ].map((srv, idx) => (
                          <div key={idx} className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50 gap-2 relative text-left w-full">
                            <span className="absolute top-2 right-2 bg-slate-200 text-slate-500 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">SOON</span>
                            <div className="p-2 rounded-xl text-slate-400 bg-slate-100"><srv.icon className="w-4 h-4" /></div>
                            <div><span className="text-xs font-bold text-slate-600 block">{srv.name}</span><span className="text-[10px] text-slate-400 block font-semibold">{srv.desc}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ─── Bottom Navigation ─── */}
            <div className="px-2 py-2 flex justify-around items-center shrink-0 z-40 w-full bg-white border-t border-slate-100 safe-bottom">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'services', icon: Layers, label: 'Services' },
                { id: 'support', icon: Headphones, label: 'Support' },
                { id: 'profile', icon: User, label: 'Profile' },
              ].map(tab => {
                const isActive = tab.id === 'home'
                  ? ['home', 'airtime', 'data', 'electricity', 'cable', 'exam', 'a2c', 'history'].includes(appTab)
                  : appTab === tab.id;
                return (
                  <button key={tab.id} type="button" onClick={() => setAppTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-spring relative ${
                      isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-500'
                    }`}>
                    {isActive && <div className="absolute -top-1 w-5 h-[3px] bg-sky-500 rounded-full" />}
                    <tab.icon className={`w-[18px] h-[18px] ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] tracking-tight ${isActive ? 'font-extrabold font-display' : 'font-semibold'}`}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            BOTTOM SHEET OVERLAYS
        ═══════════════════════════════════════ */}

        {/* Contacts */}
        <BottomSheet open={contactsOpen} onClose={() => setContactsOpen(false)} title="Choose Contact" maxHeight="60%">
          <div className="space-y-2">
            {demoContacts.map((c, idx) => (
              <button key={idx} onClick={() => { setTargetNumber(c.phone); setDetectedOperator(c.operator); setContactsOpen(false); }}
                className="w-full p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between text-left text-sm transition-smooth border border-transparent hover:border-slate-100">
                <div>
                  <strong className="text-slate-800 font-bold block">{c.name}</strong>
                  <span className="text-xs text-slate-400 block mt-0.5">{c.phone}</span>
                </div>
                <span className="bg-sky-50 border border-sky-100 text-sky-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold">{c.operator}</span>
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* PIN Auth */}
        <BottomSheet open={pinSheetOpen} onClose={() => setPinSheetOpen(false)} title="Authorize Transaction" subtitle="Enter your 4-digit PIN" closeLabel="Cancel">
          <div className="space-y-4">
            <div className="flex justify-center">
              <input type="password" maxLength={4} value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="bg-slate-50 border-2 border-slate-200 tracking-[0.5em] text-center text-xl font-bold rounded-2xl w-28 py-3 input-focus" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setPinInput(currentUser.pinCode || '1234'); setTimeout(() => handleConfirmPurchase(), 100); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-smooth border border-slate-200/50 font-display">
                🧬 Biometric
              </button>
              <button onClick={handleConfirmPurchase}
                className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition-smooth font-display">
                Verify PIN
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Receipt */}
        <BottomSheet open={!!activeReceipt} onClose={() => setActiveReceipt(null)} title="Transaction Details" closeLabel="Dismiss">
          {activeReceipt && (
            <div className="space-y-4 text-left">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-center space-y-3">
                <div className="inline-flex bg-emerald-50 text-emerald-500 p-2.5 rounded-full">
                  <CheckCircle className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Successful</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">₦{activeReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3 space-y-2.5 text-left text-xs text-slate-650 font-medium">
                  {[
                    { label: 'Reference', val: activeReceipt.reference },
                    { label: 'Service', val: activeReceipt.productName },
                    { label: 'Recipient', val: activeReceipt.phoneOrMeter },
                    ...(activeReceipt.operator ? [{ label: 'Provider', val: activeReceipt.operator }] : []),
                    { label: 'Date', val: new Date(activeReceipt.date).toLocaleString() },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between gap-4">
                      <span className="text-slate-400 font-semibold">{item.label}</span>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[60%] font-mono">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {activeReceipt.disputeRaised ? (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800 font-medium">
                    <strong className="block font-bold">Dispute: {activeReceipt.disputeStatus || 'Under Review'}</strong>
                    <p className="mt-1 leading-relaxed">{activeReceipt.disputeNotes}</p>
                  </div>
                ) : (
                  <button onClick={() => handleRaiseDispute(activeReceipt.id)}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-smooth border border-slate-100">
                    <ShieldAlert className="w-4 h-4 text-rose-450" /> Raise Dispute
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => copyReceiptToClipboard(activeReceipt)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-smooth border border-slate-100">
                    <Copy className="w-4 h-4" /> Copy Details
                  </button>
                  <button onClick={() => generatePDFReceipt(activeReceipt)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-smooth shadow-sm">
                    <ArrowDownLeft className="w-4 h-4" /> PDF Receipt
                  </button>
                </div>
              </div>
            </div>
          )}
        </BottomSheet>

        {/* Price Sheet */}
        <BottomSheet open={priceSheetOpen} onClose={() => setPriceSheetOpen(false)} title="Product Pricing" subtitle={`Tier: ${currentUser.category}`} maxHeight="80%">
          <div className="space-y-4 text-left font-display">
            {['Airtime', 'Data', 'Electricity', 'Cable', 'Exam'].map(cat => (
              <div key={cat} className="space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat}</h5>
                {products.filter(p => (p.category as string) === cat || (cat === 'Cable' && p.category === 'Cable TV') || (cat === 'Exam' && p.category === 'Exam Token')).map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs border border-slate-100 font-medium">
                    <div>
                      <span className="font-bold text-slate-800 block">{p.name}</span>
                      {p.description && <span className="text-[10px] text-slate-400 block mt-0.5">{p.description}</span>}
                    </div>
                    <span className="font-extrabold text-sky-600 font-mono">₦{getDynamicPrice(p).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </BottomSheet>

        {/* Fund Wallet */}
        <BottomSheet open={fundModalOpen} onClose={() => { if (!fundLoading) setFundModalOpen(false); }} title="Fund Wallet" subtitle="Secure payment checkout" preventClose={fundLoading}>
          {fundLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 font-display font-medium">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Processing payment...</p>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Paystack', 'Flutterwave', 'Monnify', 'Bank Transfer'] as const).map(gw => (
                    <button key={gw} type="button" onClick={() => setFundGateway(gw)}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-smooth ${
                        fundGateway === gw ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-sm font-bold font-display' : 'bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100'
                      }`}>{gw}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount (₦)</span>
                <input type="text" value={fundAmountInput} onChange={(e) => setFundAmountInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-extrabold font-mono text-base input-focus text-slate-800" placeholder="5000" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['1000', '2000', '5000', '10000'].map(val => (
                  <button key={val} type="button" onClick={() => setFundAmountInput(val)}
                    className="bg-slate-100 hover:bg-slate-250 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-smooth border border-slate-200/30">
                    ₦{parseInt(val).toLocaleString()}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => {
                const parsed = parseFloat(fundAmountInput);
                if (isNaN(parsed) || parsed <= 0) { toast.warning('Enter a valid amount.'); return; }
                setFundLoading(true);
                setTimeout(() => {
                  setFundLoading(false);
                  const newBalance = currentUser.walletBalance + parsed;
                  setCurrentUser((curr: UserProfile) => ({ ...curr, walletBalance: newBalance }));
                  setSubscribers((prev: UserProfile[]) => prev.map(s => s.email === currentUser.email ? { ...s, walletBalance: newBalance } : s));
                  const fundTx: Transaction = {
                    id: `tx-fund-${Math.floor(1000 + Math.random() * 9000)}`, type: 'Wallet Funding',
                    productName: `${fundGateway} gateway funding`, amount: parsed,
                    phoneOrMeter: `Ref: ${fundGateway.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
                    reference: `EDAT-FUND-${Math.floor(100000 + Math.random() * 900000)}`,
                    status: 'Completed', date: new Date().toISOString(), disputeRaised: false,
                  };
                  setTransactions((prev: Transaction[]) => [fundTx, ...prev]);
                  setFundModalOpen(false);
                  toast.success(`₦${parsed.toLocaleString()} credited via ${fundGateway}!`);
                }, 1200);
              }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen">
                Process Payment (₦{parseFloat(fundAmountInput || '0').toLocaleString()})
              </button>
            </div>
          )}
        </BottomSheet>

        {/* Change PIN */}
        <BottomSheet open={changePinModalOpen} onClose={() => setChangePinModalOpen(false)}
          title={currentUser.hasPin ? 'Change Transaction PIN' : 'Set Transaction PIN'} subtitle="Authorize purchases safely">
          <div className="space-y-4 text-left">
            {currentUser.hasPin && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Current PIN</span>
                <input type="password" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800" placeholder="••••" />
              </div>
            )}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">New PIN</span>
              <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800" placeholder="••••" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm PIN</span>
              <input type="password" maxLength={4} value={confirmNewPin} onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800" placeholder="••••" />
            </div>
            <button type="button" onClick={() => {
              if (newPin.length !== 4) { toast.warning('PIN must be exactly 4 digits.'); return; }
              if (newPin !== confirmNewPin) { toast.error('PINs do not match.'); return; }
              if (apiStatus === 'offline' || apiStatus === 'sandbox') {
                setCurrentUser((prev: UserProfile) => ({ ...prev, hasPin: true, pinCode: newPin }));
                setSubscribers((prev: UserProfile[]) => prev.map(s => s.email === currentUser.email ? { ...s, hasPin: true, pinCode: newPin } : s));
                setChangePinModalOpen(false); setOldPin(''); setNewPin(''); setConfirmNewPin('');
                toast.success('Transaction PIN updated!');
                return;
              }
              if (currentUser.hasPin) {
                api.changePin(oldPin, newPin, confirmNewPin).then(res => {
                  if (res.success) { if (handleGlobalRefresh) handleGlobalRefresh(); setChangePinModalOpen(false); setOldPin(''); setNewPin(''); setConfirmNewPin(''); toast.success(res.message || 'PIN changed!'); }
                  else toast.error(res.error || 'Failed to change PIN.');
                }).catch(err => toast.error(err.message || 'Error changing PIN.'));
              } else {
                api.setPin(newPin, confirmNewPin).then(res => {
                  if (res.success) { if (handleGlobalRefresh) handleGlobalRefresh(); setChangePinModalOpen(false); setOldPin(''); setNewPin(''); setConfirmNewPin(''); toast.success(res.message || 'PIN set!'); }
                  else toast.error(res.error || 'Failed to set PIN.');
                }).catch(err => toast.error(err.message || 'Error setting PIN.'));
              }
            }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-sm transition-spring active:scale-[0.98]">
              Save PIN Changes
            </button>
          </div>
        </BottomSheet>

        {/* Change Password */}
        <BottomSheet open={changePasswordModalOpen} onClose={() => setChangePasswordModalOpen(false)} title="Change Password" subtitle="Update account login credentials font-display">
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Password</span>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-semibold text-sm input-focus text-slate-800" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-semibold text-sm input-focus text-slate-800" placeholder="Min. 6 characters" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm Password</span>
              <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-semibold text-sm input-focus text-slate-800" placeholder="Confirm new password" />
            </div>
            <button type="button" onClick={() => {
              if (!currentPassword) { toast.warning('Enter your current password.'); return; }
              if (newPassword.length < 6) { toast.warning('New password must be at least 6 characters.'); return; }
              if (newPassword !== confirmNewPassword) { toast.error('Passwords do not match.'); return; }
              setChangePasswordModalOpen(false);
              toast.success('Password updated successfully!');
            }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring active:scale-[0.98] btn-sheen font-display">
              Update Password
            </button>
          </div>
        </BottomSheet>

        {/* Upgrade Modal */}
        <BottomSheet open={upgradeModalOpen} onClose={() => { if (!upgradeLoading) setUpgradeModalOpen(false); }}
          title="Upgrade to Premium" subtitle="VTU Agent License" preventClose={upgradeLoading}>
          {upgradeLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 font-display">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-xs font-bold text-slate-700">Deducting License Fee & Upgrading...</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-sky-600">Registering with Yii2 Core Router</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-4 text-white space-y-3 text-left">
                <span className="text-[9px] uppercase font-black text-sky-400 tracking-wider">Premium Perks</span>
                <ul className="text-xs text-slate-300 space-y-2 font-medium">
                  {['Agent pricing on Airtime', '1.5–4.5% data commission savings', 'Fast-track routing & auto-refund', 'Priority support queue'].map((perk, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" /> {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total Upgrade Fee</span>
                  <span className="text-xs font-bold text-slate-800">One-time Agent License</span>
                </div>
                <span className="text-base font-black text-sky-600 font-mono tabular-nums">₦{(currentUser.upgradeFee || 5000).toLocaleString()}</span>
              </div>
              <button type="button" disabled={upgradeLoading} onClick={() => {
                if (!currentUser.hasPin) {
                  toast.warning('Set up a Transaction PIN first.');
                  setChangePinModalOpen(true); setUpgradeModalOpen(false); return;
                }
                const pin = window.prompt('Enter your 4-digit PIN:');
                if (pin === null) return;
                if (!pin.trim()) { toast.warning('PIN is required.'); return; }
                
                const upgradeFee = currentUser.upgradeFee || 5000;
                setUpgradeLoading(true);
                
                if (apiStatus === 'offline' || apiStatus === 'sandbox') {
                  setTimeout(() => {
                    setUpgradeLoading(false);
                    if (currentUser.walletBalance < upgradeFee) {
                      toast.error(`Insufficient wallet balance. You need ₦${upgradeFee.toLocaleString()} to upgrade.`);
                      return;
                    }
                    setCurrentUser((prev: UserProfile) => ({ 
                      ...prev, 
                      walletBalance: prev.walletBalance - upgradeFee, 
                      category: 'Premium User' 
                    }));
                    setSubscribers((prev: UserProfile[]) => prev.map(s => s.email === currentUser.email ? { 
                      ...s, 
                      walletBalance: s.walletBalance - upgradeFee, 
                      category: 'Premium User' 
                    } : s));
                    toast.success('Congratulations! Upgrade successful. Sandbox premium reseller privileges are now active.');
                    setUpgradeModalOpen(false);
                  }, 1200);
                  return;
                }
                
                api.upgrade(pin).then(res => {
                  setUpgradeLoading(false);
                  if (res.success) {
                    toast.success(res.message || 'Upgrade successful!');
                    if (handleGlobalRefresh) handleGlobalRefresh();
                    setUpgradeModalOpen(false);
                  } else {
                    toast.error(res.error || 'Upgrade failed.');
                  }
                }).catch(err => {
                  setUpgradeLoading(false);
                  toast.error(err.message || 'Upgrade error.');
                });
              }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen font-display">
                Pay ₦{(currentUser.upgradeFee || 5000).toLocaleString()} & Upgrade
              </button>
            </div>
          )}
        </BottomSheet>

      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm} title={confirmConfig.title}
        description={confirmConfig.description} confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant} />
    </div>
  );
}
