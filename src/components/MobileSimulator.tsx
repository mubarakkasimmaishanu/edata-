import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, ProductItem, AppNotification, VirtualAccount, ManualBank } from '../types';
import {
  Smartphone, Wifi, Battery, ChevronLeft, ArrowRight, ArrowDownLeft, Home,
  ArrowUpRight, Copy, Share2, HelpCircle, CheckCircle, AlertTriangle,
  User, Lock, Key, Eye, Flame, ShieldAlert,
  Send, CreditCard, RefreshCw, Layers, Phone, DollarSign, Lightbulb,
  Tv, BookOpen, UserCheck, Check, Search, AlertCircle,
  History, MoreHorizontal, Headphones, Bell, EyeOff, Coins, Info, Gift, Mail,
  X, Zap, Shield, LogOut, ChevronRight, Fingerprint, Camera, ExternalLink
} from 'lucide-react';
import { api, setAuthToken, resolveImageUrl } from '../services/api';
import { jsPDF } from 'jspdf';
import { DEFAULT_USER } from '../data';
import { useToast } from './Toast';
import BottomSheet from './BottomSheet';
import ConfirmDialog from './ConfirmDialog';
import ServiceForm from './ServiceForm';
import edataLogo from '../assets/edata_logo.png';



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
  apiStatus: 'connected' | 'offline';
  setApiStatus?: (status: 'connected' | 'offline') => void;
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
  const [appTab, setAppTab] = useState<'home' | 'airtime' | 'data' | 'electricity' | 'cable' | 'exam' | 'history' | 'support' | 'profile' | 'a2c' | 'services' | 'notifications'>('home');

  // ─── Notifications System State ───
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 1,
      title: 'Welcome to eData!',
      message: 'Your account is active. Explore our lightning fast airtime, data bundles, and bill payment services.',
      image: null,
      target_group: 'all',
      created_at: 'Just now',
      is_read: false
    }
  ]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(1);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

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
  const [fundTab, setFundTab] = useState<'virtual' | 'katpay' | 'manual'>('virtual');
  const [fundLoading, setFundLoading] = useState(false);
  const [katpayAmountInput, setKatpayAmountInput] = useState('5000');
  const [manualAmountInput, setManualAmountInput] = useState('5000');
  const [manualRefInput, setManualRefInput] = useState('');
  const [manualSenderInput, setManualSenderInput] = useState('');
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([
    {
      bank_name: 'Moniepoint MFB',
      account_number: '6301234567',
      account_name: 'eData - ' + (currentUser.name || 'User')
    }
  ]);
  const [manualBank, setManualBank] = useState<ManualBank>({
    bank_name: 'Moniepoint Microfinance Bank',
    account_name: 'eData Enterprise',
    account_number: '6301234567'
  });
  const [katpayEnabled, setKatpayEnabled] = useState(true);
  const [activeKatpayCheckout, setActiveKatpayCheckout] = useState<{
    reference: string;
    checkout_url: string;
    payment_account?: {
      account_number: string;
      account_name: string;
      bank_name: string;
    };
    expires_at?: string;
    amount: number;
  } | null>(null);
  const [katpayVerifying, setKatpayVerifying] = useState(false);
  const [showIframeCheckout, setShowIframeCheckout] = useState(false);

  // ─── Mandatory Profile Onboarding Locking State ───
  const [completeProfileModalOpen, setCompleteProfileModalOpen] = useState(false);
  const [profileFirstname, setProfileFirstname] = useState(currentUser.firstname || '');
  const [profileLastname, setProfileLastname] = useState(currentUser.lastname || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profilePin, setProfilePin] = useState('');
  const [profileConfirmPin, setProfileConfirmPin] = useState('');
  const [completeProfileLoading, setCompleteProfileLoading] = useState(false);

  useEffect(() => {
    if (currentScreen === 'app') {
      const isIncomplete = !currentUser.phone || currentUser.phone.length < 11 || !currentUser.hasPin;
      if (isIncomplete) {
        setCompleteProfileModalOpen(true);
      }
    }
  }, [currentScreen, currentUser.phone, currentUser.hasPin]);

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

  // ─── Validate & Purchase State ───
  const [isValidatingNumber, setIsValidatingNumber] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [validationError, setValidationError] = useState('');

  // ─── Forgot Password / PIN State ───
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'request' | 'verify'>('request');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordCode, setForgotPasswordCode] = useState('');
  const [forgotPasswordNew, setForgotPasswordNew] = useState('');
  const [forgotPasswordConfirm, setForgotPasswordConfirm] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const [forgotPinModalOpen, setForgotPinModalOpen] = useState(false);
  const [forgotPinStep, setForgotPinStep] = useState<'request' | 'verify'>('request');
  const [forgotPinCode, setForgotPinCode] = useState('');
  const [forgotPinNew, setForgotPinNew] = useState('');
  const [forgotPinConfirm, setForgotPinConfirm] = useState('');
  const [forgotPinLoading, setForgotPinLoading] = useState(false);

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.warning('Please enter your email address.');
      return;
    }
    setForgotPasswordLoading(true);
    try {
      const res = await api.forgotPassword(forgotPasswordEmail);
      toast.success(res.message || 'Verification code sent to your email.');
      setForgotPasswordStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Error sending password reset request.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordCode || forgotPasswordCode.length < 6) {
      toast.warning('Please enter the 6-digit verification code.');
      return;
    }
    if (!forgotPasswordNew || forgotPasswordNew.length < 8) {
      toast.warning('New password must be at least 8 characters long.');
      return;
    }
    if (forgotPasswordNew !== forgotPasswordConfirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setForgotPasswordLoading(true);
    try {
      const res = await api.resetPassword(forgotPasswordEmail, forgotPasswordCode, forgotPasswordNew, forgotPasswordConfirm);
      if (res.success) {
        toast.success(res.message || 'Password reset successfully!');
        setForgotPasswordModalOpen(false);
        setForgotPasswordEmail('');
        setForgotPasswordCode('');
        setForgotPasswordNew('');
        setForgotPasswordConfirm('');
        setForgotPasswordStep('request');
      } else {
        toast.error(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPinRequest = async () => {
    setForgotPinLoading(true);
    try {
      const res = await api.forgotPinRequest();
      toast.success(res.message || 'Verification code sent to your email.');
      setForgotPinStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code.');
    } finally {
      setForgotPinLoading(false);
    }
  };

  const handleForgotPinVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPinCode || forgotPinCode.length < 4) {
      toast.warning('Please enter the verification code sent to your email.');
      return;
    }
    if (forgotPinNew.length !== 4) {
      toast.warning('New PIN must be exactly 4 digits.');
      return;
    }
    if (forgotPinNew !== forgotPinConfirm) {
      toast.error('New PINs do not match.');
      return;
    }
    setForgotPinLoading(true);
    try {
      const res = await api.forgotPinVerify(forgotPinCode, forgotPinNew, forgotPinConfirm);
      toast.success(res.message || 'Transaction PIN reset successfully!');
      setCurrentUser((curr: UserProfile) => ({ ...curr, hasPin: true, pinCode: forgotPinNew }));
      setForgotPinModalOpen(false);
      setForgotPinCode('');
      setForgotPinNew('');
      setForgotPinConfirm('');
      setForgotPinStep('request');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset PIN.');
    } finally {
      setForgotPinLoading(false);
    }
  };

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

  // ─── Fetch Notifications ───
  const fetchNotifications = async () => {
    if (apiStatus === 'connected') {
      try {
        const res = await api.getNotifications();
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadNotificationCount(res.data.unread_count || 0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }
  };

  useEffect(() => {
    if (currentScreen === 'app') {
      fetchNotifications();
    }
  }, [currentScreen, apiStatus, appTab]);

  // ─── Fetch Wallet Funding Details & Virtual Accounts ───
  const fetchWalletData = async () => {
    if (apiStatus === 'connected') {
      try {
        const res = await api.getWallet();
        if (res.success && res.data) {
          if (res.data.virtual_accounts && res.data.virtual_accounts.length > 0) {
            setVirtualAccounts(res.data.virtual_accounts);
          }
          if (res.data.manual_bank) {
            setManualBank(res.data.manual_bank);
          }
          if (res.data.katpay_enabled !== undefined) {
            setKatpayEnabled(res.data.katpay_enabled);
          }
        }
      } catch (err) {
        console.error('Error fetching wallet details:', err);
      }
    }
  };

  useEffect(() => {
    if (currentScreen === 'app') {
      fetchWalletData();
    }
  }, [currentScreen, apiStatus, fundModalOpen]);

  const handleMarkAsRead = async (id?: number | 'all') => {
    if (apiStatus === 'connected') {
      try {
        const res = await api.markNotificationRead(id);
        if (res.success) {
          if (id === 'all' || !id) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadNotificationCount(0);
            toast.success('All notifications marked as read.');
          } else {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadNotificationCount(res.unread_count ?? Math.max(0, unreadNotificationCount - 1));
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to mark as read.');
      }
    } else {
      if (id === 'all' || !id) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadNotificationCount(0);
        toast.success('All notifications marked as read.');
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      }
    }
  };

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
      toast.error(err.message || 'Verification failed. Please try again.');
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
  const handleConfirmPurchase = async () => {
    if (!pinInput || pinInput.length !== 4) {
      toast.warning('Please enter your 4-digit PIN.');
      return;
    }

    const basePrice = parseFloat(checkoutAmount || '0');
    const finalPrice = Math.max(0, basePrice - promoDiscount);

    if (apiStatus === 'connected') {
      setIsPurchasing(true);
      try {
        let serviceId = selectedProduct?.id;
        let planId: string | undefined = undefined;

        if (String(serviceId).startsWith('plan-')) {
          const parts = String(serviceId).split('-');
          planId = parts[1];
          serviceId = parts[2];
        }

        const res = await api.purchase({
          service_id: serviceId || '1',
          amount: finalPrice,
          target_number: targetNumber,
          transaction_pin: pinInput,
          plan_id: planId,
          promo_id: appliedPromo ? 1 : undefined,
          bank_name: a2cBank,
          account_number: a2cAccount,
        });

        setIsPurchasing(false);
        setPinSheetOpen(false);

        if (res.success && res.data) {
          toast.success(`₦${finalPrice.toLocaleString()} payment processed successfully!`);
          if (appliedPromo) { setAppliedPromo(''); setPromoDiscount(0); setPromoCodeInput(''); }
          if (handleGlobalRefresh) handleGlobalRefresh();

          const newTx: Transaction = {
            id: res.data.reference || `EDAT-${Date.now()}`,
            type: selectedCategory === 'A2C' ? 'A2C' : selectedCategory === 'Exam' ? 'Exam Token' : selectedCategory === 'Cable' ? 'Cable TV' : selectedCategory,
            productName: selectedProduct?.name || `${selectedCategory} purchase`,
            amount: finalPrice,
            phoneOrMeter: targetNumber,
            reference: res.data.reference,
            operator: detectedOperator || selectedProduct?.operator,
            status: res.data.status || 'Completed',
            date: new Date().toISOString(),
            disputeRaised: false,
          };
          setActiveReceipt(newTx);
        } else {
          toast.error(res.error || 'Payment failed.');
        }
      } catch (err: any) {
        setIsPurchasing(false);
        toast.error(err.message || 'Error processing payment request.');
      }
      return;
    }

    toast.error('API connection required to execute purchase.');
  };

  // ─── Login Handler ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.login(authEmail, authPassword);
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        if (setApiStatus) setApiStatus('connected');
        if (handleLoginSuccess) handleLoginSuccess(res.data.token);
        setAuthPassword('');
        setLoginError('');
      } else {
        setLoginError(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Register Handler ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.warning('Please accept the terms and conditions.');
      return;
    }
    if (!authEmail || !authEmail.includes('@')) {
      toast.warning('Please enter a valid email address.');
      return;
    }

    if (apiStatus === 'connected') {
      try {
        const res = await api.signupRequest(authEmail, authPromo);
        if (res.success) {
          toast.success(res.message || 'Verification code sent to your email!');
          if (res.otp) {
            toast.info(`Localhost OTP Code: ${res.otp}`);
          }
          setCurrentScreen('otp');
        } else {
          toast.error(res.error || 'Failed to send verification code.');
        }
      } catch (err: any) {
        toast.error(err.message || 'Error requesting registration verification code.');
      }
      return;
    }

    // Localhost Sandbox Fallback
    toast.success(`Verification code sent to ${authEmail}`);
    toast.info('Sandbox OTP Code: 123456');
    setCurrentScreen('otp');
  };

  // ─── OTP Handler ───
  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) {
      setVerificationError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    if (apiStatus === 'connected') {
      try {
        const res = await api.signupVerify(authEmail, otpCode);
        if (res.success) {
          setVerificationError('');
          toast.success('Email verified successfully!');
          setCurrentScreen('password_create');
        } else {
          setVerificationError(res.error || 'Incorrect verification code.');
          toast.error(res.error || 'Verification failed.');
        }
      } catch (err: any) {
        setVerificationError(err.message || 'OTP verification error.');
      }
      return;
    }

    // Localhost Sandbox Fallback
    setVerificationError('');
    setCurrentScreen('password_create');
  };

  // ─── Register Password Handler ───
  const handleRegisterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (apiStatus === 'connected') {
      try {
        const res = await api.signupComplete(authEmail, otpCode, regPassword, regConfirmPassword, '', authPromo);
        if (res.success && res.data) {
          const newUserObj: UserProfile = {
            id: res.data.user.id,
            name: authEmail.split('@')[0].toUpperCase(),
            email: res.data.user.email,
            phone: res.data.user.phone || '',
            walletBalance: 0,
            category: res.data.user.level_label || 'Basic User',
            bvn: '', nin: '', isVerified: false,
            pinCode: '', hasPin: res.data.user.has_pin || false,
            promoCode: authPromo,
          };
          setCurrentUser(newUserObj);
          localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
          if (handleLoginSuccess) handleLoginSuccess(res.data.token);
          toast.success(res.message || 'Registration completed successfully! Welcome to eData.');
          setRegPassword(''); setRegConfirmPassword('');
          setCurrentScreen('app');
        } else {
          toast.error(res.error || 'Registration failed.');
        }
      } catch (err: any) {
        toast.error(err.message || 'Registration completion error.');
      }
      return;
    }

    // Sandbox Fallback
    const newUserObj: UserProfile = {
      name: authEmail.split('@')[0].toUpperCase(),
      email: authEmail, phone: '', walletBalance: 0,
      category: authPromo ? 'Referred User' : 'Basic User',
      bvn: '', nin: '', isVerified: false, pinCode: '', hasPin: false, promoCode: authPromo,
    };
    setCurrentUser(newUserObj);
    localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
    toast.success('Registration setup completed! Welcome to eData.');
    setRegPassword(''); setRegConfirmPassword('');
    setCurrentScreen('app');
  };

  // ─── KYC Handler ───
  const handleSubmitKYC = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      setCurrentUser((curr: UserProfile) => ({ ...curr, isVerified: true }));
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

  // ─── Service Icon Colors (Unified Skyblue Palette) ───
  const serviceIcons = [
    { id: 'Airtime', icon: Phone, color: 'text-sky-600 bg-sky-50', tab: 'airtime' },
    { id: 'Data', icon: Layers, color: 'text-sky-600 bg-sky-50', tab: 'data' },
    { id: 'Cable TV', icon: Tv, color: 'text-sky-600 bg-sky-50', tab: 'cable' },
    { id: 'Electricity', icon: Zap, color: 'text-sky-600 bg-sky-50', tab: 'electricity' },
    { id: 'Refer & Earn', icon: Gift, color: 'text-sky-600 bg-sky-50', action: () => {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied! Share it to earn rewards.');
    }},
    { id: 'A2C Convert', icon: RefreshCw, color: 'text-sky-600 bg-sky-50', tab: 'a2c' },
    { id: 'Exam Card', icon: BookOpen, color: 'text-sky-600 bg-sky-50', tab: 'exam' },
    { id: 'More', icon: MoreHorizontal, color: 'text-sky-600 bg-sky-50', action: () => setAppTab('services') },
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
              {/* Logo Header */}
              <div className="text-center space-y-3 pt-2">
                <div className="inline-flex relative items-center justify-center">
                  <div className="absolute inset-0 bg-sky-500/25 blur-2xl rounded-full animate-pulse" />
                  <div className="relative bg-white border-2 border-sky-100/80 p-3 rounded-3xl shadow-xl shadow-sky-500/20 ring-4 ring-sky-500/10 transition-transform duration-300 hover:scale-105">
                    <img src={edataLogo} alt="eData Official Logo" className="w-16 h-16 object-contain rounded-2xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1 font-display">
                    <span className="text-sky-600 font-extrabold">e</span><span className="font-extrabold">Data</span>
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 tracking-wide mt-1">Instant VTU & Utility Payment Platform</p>
                </div>
              </div>



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
                    <label className="text-xs font-semibold text-slate-500 block">Referral Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input type="text" value={authPromo} onChange={(e) => setAuthPromo(e.target.value)}
                      placeholder="e.g. REF-58291 or referrer email"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm input-focus text-slate-800" />
                  </div>
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
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-500 block">Password</label>
                      <button type="button" onClick={() => { setForgotPasswordEmail(authEmail); setForgotPasswordModalOpen(true); }}
                        className="text-xs text-sky-600 font-bold hover:underline">
                        Forgot Password?
                      </button>
                    </div>
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
                onClick={async () => {
                  if (apiStatus === 'connected') {
                    try {
                      const res = await api.googleAuth({ email: authEmail || DEFAULT_USER.email });
                      if (res.success && res.data) {
                        const loggedUser = {
                          ...DEFAULT_USER,
                          id: res.data.user.id,
                          email: res.data.user.email,
                          firstname: res.data.user.firstname || 'Google',
                          lastname: res.data.user.lastname || 'User',
                          phone: res.data.user.phone || '',
                          walletBalance: res.data.user.walletBalance || 0,
                          category: res.data.user.category || 'Basic User',
                          isVerified: true,
                          hasPin: res.data.user.hasPin || false,
                        };
                        setCurrentUser(loggedUser);
                        localStorage.setItem('edata_current_user', JSON.stringify(loggedUser));
                        if (handleLoginSuccess) handleLoginSuccess(res.data.token || res.data.accessToken);
                        toast.success(`Welcome back, ${loggedUser.firstname}!`);
                      } else {
                        toast.error(res.error || 'Google Authentication failed.');
                      }
                    } catch (err: any) {
                      toast.error(err.message || 'Google Auth service error.');
                    }
                    return;
                  }
                  localStorage.setItem('edata_sandbox', 'true');
                  const match = subscribers.find(s => s.email === DEFAULT_USER.email) || DEFAULT_USER;
                  setCurrentUser(match);
                  localStorage.setItem('edata_current_user', JSON.stringify(match));
                  if (handleLoginSuccess) handleLoginSuccess('google-sandbox-token');
                }}
                className="w-full bg-white border border-slate-250 hover:border-slate-350 text-slate-750 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-3 hover:bg-slate-50/80 transition-spring shadow-sm active:scale-[0.98] btn-sheen"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
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
                  We sent a 6-digit verification code to <strong className="text-slate-800">{authEmail}</strong>
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map(i => (
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
                        if (val && i < 5) {
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
                      className="w-11 h-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-lg font-bold text-slate-900 input-focus font-mono"
                    />
                  ))}
                </div>
                {verificationError && (
                  <p className="text-rose-500 text-xs text-center font-semibold">{verificationError}</p>
                )}
                <p className="text-xs text-slate-400 text-center font-medium">
                  Didn't receive code?{' '}
                  <button type="button" onClick={async () => {
                    try {
                      const res = await api.signupRequest(authEmail, authPromo);
                      toast.success(res.message || 'Verification code resent!');
                      if (res.otp) toast.info(`Localhost OTP Code: ${res.otp}`);
                    } catch (err: any) {
                      toast.error(err.message || 'Error resending code.');
                    }
                  }} className="text-sky-600 font-bold hover:underline">
                    Resend Code
                  </button>
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
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/25 overflow-hidden border border-white shrink-0">
                        {currentUser.photo ? (
                          <img src={currentUser.photo} className="w-full h-full object-cover" alt="Profile Avatar" />
                        ) : (
                          (currentUser.name || 'U').charAt(0)
                        )}
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
                      <button type="button" onClick={() => setAppTab('notifications')}
                        className="relative p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-smooth">
                        <Bell className="w-[18px] h-[18px]" />
                        {unreadNotificationCount > 0 && (
                          <span className="absolute top-1 right-1 px-1 min-w-[15px] h-3.5 text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center border border-white">
                            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                          </span>
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
                          {appTab === 'notifications' && 'Notifications'}
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
                          <button type="button" onClick={() => setFundModalOpen(true)}
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
                    {/* Top Centered Profile Photo & Unique Membership Badge Header */}
                    <div className="bg-gradient-to-b from-sky-50/70 via-white to-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full p-1 bg-white ring-4 ring-sky-500/20 shadow-xl relative overflow-hidden flex items-center justify-center">
                          {currentUser.photo ? (
                            <img src={currentUser.photo} className="w-full h-full rounded-full object-cover" alt="Profile Avatar" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white font-black text-3xl flex items-center justify-center shadow-inner">
                              {currentUser.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <label htmlFor="mobile-profile-photo-input" className="absolute bottom-0 right-0 w-8 h-8 bg-sky-600 hover:bg-sky-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white transition-transform active:scale-95">
                          <Camera className="w-4 h-4" />
                        </label>
                        <input
                          id="mobile-profile-photo-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              toast.warning('Photo must be less than 5MB.');
                              e.target.value = '';
                              return;
                            }
                            toast.info('Uploading profile photo...');
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const base64 = event.target?.result as string;
                              if (!base64) return;

                              // Instant preview
                              setCurrentUser(prev => ({ ...prev, photo: base64 }));
                              setSubscribers(prev => prev.map(s => s.email === currentUser.email ? { ...s, photo: base64 } : s));

                              if (apiStatus === 'connected') {
                                try {
                                  const res = await api.uploadPhoto(base64);
                                  if (res.success && res.data?.photo) {
                                    setCurrentUser(prev => ({ ...prev, photo: res.data.photo }));
                                    setSubscribers(prev => prev.map(s => s.email === currentUser.email ? { ...s, photo: res.data.photo } : s));
                                    toast.success('Profile photo updated successfully!');
                                  } else {
                                    toast.error(res.error || 'Failed to sync photo to server.');
                                  }
                                } catch (err: any) {
                                  console.error('Photo upload error:', err);
                                  toast.error(err.message || 'Error syncing photo to server.');
                                }
                              } else {
                                toast.success('Profile photo updated!');
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                      </div>

                      {/* Unique Membership Badge Design */}
                      <div className="mt-3.5">
                        {currentUser.category === 'Premium User' ? (
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full shadow-md shadow-amber-500/25 border border-amber-300 tracking-wide uppercase">
                            <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-slate-950" />
                            <span>Premium Reseller</span>
                          </div>
                        ) : currentUser.category === 'Referred User' ? (
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-md shadow-sky-500/20 border border-sky-300/40 tracking-wide uppercase">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Referred Member</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 text-slate-700 font-bold text-xs px-4 py-1.5 rounded-full shadow-sm border border-slate-300/80 tracking-wide uppercase">
                            <Shield className="w-3.5 h-3.5 text-slate-500" />
                            <span>Basic Member</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separate Card for User Information */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">User Information</span>

                      <div className="flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                          <span className="text-xs font-extrabold text-slate-900 truncate block">{currentUser.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                          <span className="text-xs font-bold text-slate-800 break-all block">{currentUser.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                          <Phone className="w-4.5 h-4.5" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                          <span className="text-xs font-bold text-slate-800 block">{currentUser.phone || 'Not provided'}</span>
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
                          { id: 'Data', name: 'Data Bundle', icon: Layers, desc: 'SME & Gifting bundles', color: 'text-sky-600 bg-sky-50', tab: 'data' },
                          { id: 'Cable TV', name: 'Cable TV', icon: Tv, desc: 'DStv, GOtv, Startimes', color: 'text-sky-600 bg-sky-50', tab: 'cable' },
                          { id: 'Electricity', name: 'Electricity', icon: Zap, desc: 'Prepaid & postpaid', color: 'text-sky-600 bg-sky-50', tab: 'electricity' },
                          { id: 'A2C', name: 'Airtime to Cash', icon: RefreshCw, desc: 'Convert to cash', color: 'text-sky-600 bg-sky-50', tab: 'a2c' },
                          { id: 'Exam', name: 'Exam Card', icon: BookOpen, desc: 'WAEC, NECO, NABTEB', color: 'text-sky-600 bg-sky-50', tab: 'exam' },
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
                        <button type="button" onClick={() => setFundModalOpen(true)}
                          className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-smooth gap-2 active:scale-[0.98] shadow-sm text-left w-full">
                          <div className="p-2 rounded-xl text-sky-600 bg-sky-50"><Coins className="w-4 h-4" /></div>
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

                {/* ═══ NOTIFICATIONS TAB ═══ */}
                {appTab === 'notifications' && (
                  <div className="flex-1 flex flex-col space-y-4 animate-fade-in text-left">
                    {/* Filter Pills & Mark All Read Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('all')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            notificationFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          All ({notifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('unread')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            notificationFilter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Unread ({unreadNotificationCount})
                        </button>
                      </div>

                      {unreadNotificationCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead('all')}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 transition-smooth"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notifications Card List */}
                    <div className="space-y-2.5">
                      {(() => {
                        const filteredList = notificationFilter === 'unread'
                          ? notifications.filter(n => !n.is_read)
                          : notifications;

                        if (filteredList.length === 0) {
                          return (
                            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto text-sky-500">
                                <Bell className="w-6 h-6" />
                              </div>
                              <h4 className="text-sm font-bold text-slate-800">No Notifications</h4>
                              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                {notificationFilter === 'unread'
                                  ? 'You have read all your notifications!'
                                  : 'You do not have any notifications yet. Updates and announcements will appear here.'}
                              </p>
                            </div>
                          );
                        }

                        return filteredList.map((notify) => (
                          <div
                            key={notify.id}
                            onClick={() => {
                              setSelectedNotification(notify);
                              if (!notify.is_read) {
                                handleMarkAsRead(Number(notify.id));
                              }
                            }}
                            className={`bg-white border rounded-2xl p-4 transition-all shadow-sm cursor-pointer hover:border-sky-200 active:scale-[0.99] relative ${
                              !notify.is_read ? 'border-sky-300 ring-1 ring-sky-100 bg-sky-50/20' : 'border-slate-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {resolveImageUrl(notify.image) ? (
                                <img
                                  src={resolveImageUrl(notify.image)!}
                                  alt="Notification Image"
                                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  !notify.is_read ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <Bell className="w-5 h-5" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className={`text-xs font-bold truncate ${!notify.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {notify.title}
                                  </h4>
                                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                    {notify.created_at}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                                  {notify.message}
                                </p>
                              </div>

                              {!notify.is_read && (
                                <span className="w-2.5 h-2.5 bg-sky-500 rounded-full shrink-0 mt-1 shadow-sm shadow-sky-500/50" />
                              )}
                            </div>
                          </div>
                        ));
                      })()}
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
                className="bg-slate-50 border-2 border-slate-200 tracking-[0.5em] text-center text-xl font-bold rounded-2xl w-32 py-3.5 input-focus text-slate-800 font-mono" />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-400 font-medium">4-Digit Security PIN</span>
              <button type="button" onClick={() => { setPinSheetOpen(false); setForgotPinStep('request'); setForgotPinModalOpen(true); }}
                className="text-xs text-sky-600 font-bold hover:underline">
                Forgot PIN?
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setPinInput(currentUser.pinCode || '1234'); setTimeout(() => handleConfirmPurchase(), 100); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-smooth border border-slate-200/50">
                🧬 Biometric
              </button>
              <button onClick={handleConfirmPurchase}
                className="bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-2xl text-xs font-bold transition-smooth btn-sheen shadow-md shadow-sky-600/15">
                Verify PIN & Pay
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
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-smooth shadow-sm btn-sheen">
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
        <BottomSheet open={fundModalOpen} onClose={() => { if (!fundLoading) setFundModalOpen(false); }} title="Fund Wallet" subtitle="Instant auto-credit & online checkout" preventClose={fundLoading}>
          {fundLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 font-display font-medium">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm font-bold text-slate-700">Connecting to Payment Gateway...</p>
              <p className="text-xs text-slate-400">Please wait a moment</p>
            </div>
          ) : (
            <div className="space-y-4 text-left font-display">
              {/* Method Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFundTab('virtual')}
                  className={`py-2 px-1 text-center rounded-xl transition-all text-xs font-bold ${
                    fundTab === 'virtual' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ⚡ Auto Bank
                </button>
                <button
                  type="button"
                  onClick={() => setFundTab('katpay')}
                  className={`py-2 px-1 text-center rounded-xl transition-all text-xs font-bold ${
                    fundTab === 'katpay' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💳 KatPay Online
                </button>
                <button
                  type="button"
                  onClick={() => setFundTab('manual')}
                  className={`py-2 px-1 text-center rounded-xl transition-all text-xs font-bold ${
                    fundTab === 'manual' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏛️ Manual Bank
                </button>
              </div>

              {/* ═══ TAB 1: AUTOMATED VIRTUAL ACCOUNTS ═══ */}
              {fundTab === 'virtual' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <Zap className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-sky-900">Instant Auto-Credit Virtual Accounts</h4>
                      <p className="text-[11px] text-sky-700 mt-0.5 font-medium leading-relaxed">
                        Transfer money from any banking app (OPay, Kuda, GTB, etc.) to your account below. Your wallet balance is credited automatically within seconds!
                      </p>
                    </div>
                  </div>

                  {virtualAccounts.length > 0 ? (
                    virtualAccounts.map((acc, index) => (
                      <div key={index} className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-800 rounded-2xl p-4 text-white space-y-3 shadow-md relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/40">
                            {acc.bank_name || 'PalmPay (KatPay)'}
                          </span>
                          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Account Number</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xl font-black font-mono tracking-wider text-slate-100">
                              {acc.account_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(acc.account_number);
                                toast.success(`Account number (${acc.account_number}) copied!`);
                              }}
                              className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-smooth border border-sky-500/30 active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Account Name:</span>
                          <span className="font-bold text-slate-200">{acc.account_name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-3 shadow-sm">
                      <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mx-auto">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">No Virtual Bank Account Yet</h4>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                          Click below to generate your dedicated KatPay virtual account for instant wallet funding.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={fundLoading}
                        onClick={async () => {
                          setFundLoading(true);
                          try {
                            const res = await api.generateVirtualAccount();
                            if (res.success) {
                              toast.success(res.message || 'Virtual account generated!');
                              fetchWalletData();
                            } else {
                              toast.error(res.error || 'Failed to generate account.');
                            }
                          } catch (err: any) {
                            toast.error(err.message || 'Error generating virtual account.');
                          } finally {
                            setFundLoading(false);
                          }
                        }}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-smooth shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" /> Generate Dedicated Virtual Account
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      fetchWalletData();
                      toast.info('Refreshed virtual account list.');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-smooth flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Accounts
                  </button>
                </div>
              )}

              {/* ═══ TAB 2: KATPAY ONLINE CHECKOUT ═══ */}
              {fundTab === 'katpay' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <CreditCard className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-sky-900">KatPay Pay-With-Transfer & Checkout</h4>
                      <p className="text-[11px] text-sky-700 mt-0.5 font-medium leading-relaxed">
                        Instant pay-with-transfer or hosted checkout via KatPay.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Funding Amount (₦)</label>
                    <input
                      type="text"
                      value={katpayAmountInput}
                      onChange={(e) => setKatpayAmountInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-extrabold font-mono text-base input-focus text-slate-800"
                      placeholder="5000"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {['1000', '2000', '5000', '10000'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setKatpayAmountInput(val)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-smooth border ${
                          katpayAmountInput === val ? 'bg-sky-50 border-sky-400 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        ₦{parseInt(val).toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={fundLoading}
                    onClick={async () => {
                      const amount = parseFloat(katpayAmountInput);
                      if (isNaN(amount) || amount < 100) {
                        toast.warning('Minimum funding amount via KatPay is ₦100.');
                        return;
                      }
                      setFundLoading(true);
                      try {
                        const res = await api.initKatpay(amount);
                        if (res.success && res.data) {
                          toast.success('KatPay payment session initialized!');
                          setActiveKatpayCheckout(res.data);
                          setShowIframeCheckout(false);
                          setFundModalOpen(false);
                        } else {
                          toast.error(res.error || 'Failed to initialize KatPay checkout link.');
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Error connecting to KatPay payment gateway.');
                      } finally {
                        setFundLoading(false);
                      }
                    }}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Online with KatPay (₦{parseFloat(katpayAmountInput || '0').toLocaleString()})
                  </button>
                </div>
              )}

              {/* ═══ TAB 3: MANUAL BANK TRANSFER ═══ */}
              {fundTab === 'manual' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Bank Account</span>
                      <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">Synced from Web</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Bank Name:</span>
                        <span className="font-bold text-slate-800">{manualBank.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Account Name:</span>
                        <span className="font-bold text-slate-800">{manualBank.account_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Account Number:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold font-mono text-slate-900 text-sm">{manualBank.account_number}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(manualBank.account_number);
                              toast.success(`Account number (${manualBank.account_number}) copied!`);
                            }}
                            className="p-1 hover:bg-slate-200 rounded-lg text-sky-600 transition-smooth"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const amount = parseFloat(manualAmountInput);
                      if (isNaN(amount) || amount <= 0) {
                        toast.warning('Please enter a valid amount.');
                        return;
                      }
                      if (!manualRefInput.trim()) {
                        toast.warning('Please enter transaction reference or sender account name.');
                        return;
                      }

                      setFundLoading(true);
                      try {
                        const res = await api.submitManualDeposit(amount, manualRefInput, manualSenderInput);
                        if (res.success) {
                          toast.success(res.message || 'Deposit proof submitted! Pending admin review.');
                          setManualRefInput('');
                          setManualSenderInput('');
                          setFundModalOpen(false);
                        } else {
                          toast.error(res.error || 'Failed to submit payment proof.');
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Error submitting payment proof.');
                      } finally {
                        setFundLoading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Amount Transferred (₦)</label>
                      <input
                        type="text"
                        required
                        value={manualAmountInput}
                        onChange={(e) => setManualAmountInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold font-mono text-sm input-focus text-slate-800"
                        placeholder="5000"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sender Account Name / Reference</label>
                      <input
                        type="text"
                        required
                        value={manualRefInput}
                        onChange={(e) => setManualRefInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm input-focus text-slate-800 font-medium"
                        placeholder="e.g. John Doe / Moniepoint Transfer"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={fundLoading}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-md shadow-sky-600/15 active:scale-[0.98] flex items-center justify-center gap-2 btn-sheen"
                    >
                      <CheckCircle className="w-4 h-4" /> Submit Payment Proof for Review
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </BottomSheet>

        {/* KatPay In-App Payment Checkout Sheet */}
        <BottomSheet
          open={!!activeKatpayCheckout}
          onClose={() => setActiveKatpayCheckout(null)}
          title="KatPay Pay-With-Transfer"
          subtitle={activeKatpayCheckout ? `Ref: ${activeKatpayCheckout.reference} • Amount: ₦${activeKatpayCheckout.amount.toLocaleString()}` : ''}
          maxHeight="85%"
        >
          {activeKatpayCheckout && (
            <div className="space-y-4 text-left font-display">
              {/* Header Badge */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-sky-900">KatPay Instant Bank Transfer</h4>
                    <span className="text-[10px] text-sky-700 font-medium">Transfer the exact amount below to complete</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  Single Use
                </span>
              </div>

              {/* Dynamic Account Card */}
              {activeKatpayCheckout.payment_account && (
                <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-800 rounded-2xl p-4 text-white space-y-3.5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/40">
                      {activeKatpayCheckout.payment_account.bank_name || 'PalmPay'}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ₦{activeKatpayCheckout.amount.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Account Number</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-2xl font-black font-mono tracking-wider text-slate-100">
                        {activeKatpayCheckout.payment_account.account_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeKatpayCheckout.payment_account!.account_number);
                          toast.success(`Account number (${activeKatpayCheckout.payment_account!.account_number}) copied!`);
                        }}
                        className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-smooth border border-sky-500/30 active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Account Name:</span>
                    <span className="font-bold text-slate-200">{activeKatpayCheckout.payment_account.account_name}</span>
                  </div>
                </div>
              )}

              {/* In-App Hosted Checkout Iframe Toggle */}
              {showIframeCheckout ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">KatPay Hosted Page (In-App View)</span>
                    <button
                      type="button"
                      onClick={() => setShowIframeCheckout(false)}
                      className="text-xs text-sky-600 font-bold hover:underline"
                    >
                      Hide Web View
                    </button>
                  </div>
                  <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
                    <iframe
                      src={activeKatpayCheckout.checkout_url}
                      className="w-full h-full border-0"
                      title="KatPay Hosted Checkout"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={katpayVerifying}
                    onClick={async () => {
                      setKatpayVerifying(true);
                      try {
                        await fetchWalletData();
                        toast.success('Wallet refreshed! If transfer was received, your balance is updated.');
                        setActiveKatpayCheckout(null);
                      } catch (err: any) {
                        toast.error('Error verifying payment.');
                      } finally {
                        setKatpayVerifying(false);
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-emerald-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2"
                  >
                    {katpayVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    I Have Made The Transfer — Verify Now
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowIframeCheckout(true)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-smooth flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> View Hosted KatPay Countdown Page In-App
                  </button>
                </div>
              )}
            </div>
          )}
        </BottomSheet>

        {/* Mandatory Complete Profile Onboarding Modal */}
        <BottomSheet
          open={completeProfileModalOpen}
          onClose={() => {
            if (!currentUser.phone || currentUser.phone.length < 11 || !currentUser.hasPin) {
              toast.warning('Please complete your profile details to unlock eData services.');
            } else {
              setCompleteProfileModalOpen(false);
            }
          }}
          title="Complete Your Profile"
          subtitle="Required to activate your account & enable transactions"
          preventClose={!currentUser.phone || currentUser.phone.length < 11 || !currentUser.hasPin}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!profilePhone || profilePhone.length !== 11 || !profilePhone.startsWith('0')) {
                toast.warning('Please enter a valid 11-digit phone number starting with 0.');
                return;
              }
              if (!currentUser.hasPin) {
                if (!profilePin || profilePin.length !== 4) {
                  toast.warning('Please enter a secret 4-digit transaction PIN.');
                  return;
                }
                if (profilePin !== profileConfirmPin) {
                  toast.error('Transaction PINs do not match.');
                  return;
                }
              }

              setCompleteProfileLoading(true);
              try {
                // Update profile phone & names
                const fullName = `${profileFirstname || 'User'} ${profileLastname || 'Customer'}`.trim();
                const profRes = await api.updateProfile({
                  firstname: profileFirstname || 'User',
                  lastname: profileLastname || 'Customer',
                  phone: profilePhone
                });

                if (profRes && profRes.success === false) {
                  toast.error(profRes.error || 'Failed to save profile details.');
                  setCompleteProfileLoading(false);
                  return;
                }

                // Create PIN if missing
                if (!currentUser.hasPin && profilePin) {
                  const pinRes = await api.setPin(profilePin, profilePin);
                  if (pinRes && pinRes.success === false) {
                    toast.error(pinRes.error || 'Failed to save transaction PIN.');
                    setCompleteProfileLoading(false);
                    return;
                  }
                }

                const updatedUser: UserProfile = {
                  ...currentUser,
                  name: fullName || currentUser.name,
                  firstname: profileFirstname,
                  lastname: profileLastname,
                  phone: profilePhone,
                  hasPin: true
                };

                setCurrentUser(updatedUser);
                localStorage.setItem('edata_current_user', JSON.stringify(updatedUser));
                toast.success('Profile onboarding completed! eData services unlocked.');
                setCompleteProfileModalOpen(false);
              } catch (err: any) {
                toast.error(err.message || 'Error completing profile setup.');
              } finally {
                setCompleteProfileLoading(false);
              }
            }}
            className="space-y-4 text-left font-display"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Mandatory Profile Setup</h4>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-0.5">
                  To comply with regulatory standards and protect your wallet, please complete your phone number and secret 4-digit transaction PIN.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">First Name</label>
                <input
                  type="text"
                  required
                  value={profileFirstname}
                  onChange={(e) => setProfileFirstname(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 input-focus"
                  placeholder="John"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Last Name</label>
                <input
                  type="text"
                  required
                  value={profileLastname}
                  onChange={(e) => setProfileLastname(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 input-focus"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">11-Digit Phone Number</label>
              <input
                type="tel"
                maxLength={11}
                required
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-bold font-mono text-sm input-focus text-slate-800"
                placeholder="08012345678"
              />
            </div>

            {!currentUser.hasPin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Create 4-Digit Secret PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={profilePin}
                    onChange={(e) => setProfilePin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800 font-mono"
                    placeholder="••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirm 4-Digit PIN</label>
                    {profilePin && profileConfirmPin && (
                      <span className={`text-[10px] font-bold ${profilePin === profileConfirmPin ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {profilePin === profileConfirmPin ? '✓ PINs Match' : '✗ PINs Do Not Match'}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={profileConfirmPin}
                    onChange={(e) => setProfileConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800 font-mono"
                    placeholder="••••"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={completeProfileLoading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2 mt-2"
            >
              {completeProfileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Profile & Unlock eData Services
            </button>
          </form>
        </BottomSheet>

        {/* Change / Create PIN */}
        <BottomSheet open={changePinModalOpen} onClose={() => setChangePinModalOpen(false)}
          title={currentUser.hasPin ? 'Change Transaction PIN' : 'Create Transaction PIN'}
          subtitle={currentUser.hasPin ? 'Update your secret 4-digit PIN' : 'Create & confirm your secret 4-digit PIN'}>
          <div className="space-y-4 text-left">
            {currentUser.hasPin && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Current PIN</span>
                  <button type="button" onClick={() => { setChangePinModalOpen(false); setForgotPinStep('request'); setForgotPinModalOpen(true); }}
                    className="text-xs text-sky-600 font-bold hover:underline">
                    Forgot PIN?
                  </button>
                </div>
                <input type="password" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800 font-mono" placeholder="••••" />
              </div>
            )}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {currentUser.hasPin ? 'New 4-Digit PIN' : 'Create 4-Digit PIN'}
              </span>
              <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800 font-mono" placeholder="••••" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Confirm 4-Digit PIN</span>
                {newPin && confirmNewPin && (
                  <span className={`text-[10px] font-bold ${newPin === confirmNewPin ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {newPin === confirmNewPin ? '✓ PINs Match' : '✗ PINs Do Not Match'}
                  </span>
                )}
              </div>
              <input type="password" maxLength={4} value={confirmNewPin} onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center font-bold tracking-[0.5em] text-sm input-focus text-slate-800 font-mono" placeholder="••••" />
            </div>
            <button type="button" onClick={() => {
              if (newPin.length !== 4) { toast.warning('PIN must be exactly 4 digits.'); return; }
              if (newPin !== confirmNewPin) { toast.error('PINs do not match.'); return; }
              if (apiStatus === 'offline') {
                toast.error('API connection required to change PIN.');
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
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen">
              {currentUser.hasPin ? 'Save PIN Changes' : 'Create & Save PIN'}
            </button>
          </div>
        </BottomSheet>

        {/* Forgot Password BottomSheet */}
        <BottomSheet open={forgotPasswordModalOpen} onClose={() => setForgotPasswordModalOpen(false)}
          title="Reset Account Password" subtitle={forgotPasswordStep === 'request' ? 'Enter email to receive 6-digit reset code' : 'Enter verification code & create new password'}>
          {forgotPasswordStep === 'request' ? (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="you@email.com" disabled={forgotPasswordLoading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm input-focus text-slate-800 font-medium" />
                </div>
              </div>
              <button type="submit" disabled={forgotPasswordLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2">
                {forgotPasswordLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending Code...</> : 'Send Password Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPasswordVerify} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">6-Digit Verification Code</label>
                <input type="text" maxLength={6} required value={forgotPasswordCode}
                  onChange={(e) => setForgotPasswordCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit OTP code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold font-mono tracking-widest text-center input-focus text-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">New Password</label>
                <input type="password" required minLength={8} value={forgotPasswordNew}
                  onChange={(e) => setForgotPasswordNew(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm input-focus text-slate-800 font-medium" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                  {forgotPasswordNew && forgotPasswordConfirm && (
                    <span className={`text-[10px] font-bold ${forgotPasswordNew === forgotPasswordConfirm ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {forgotPasswordNew === forgotPasswordConfirm ? '✓ Passwords Match' : '✗ Passwords Do Not Match'}
                    </span>
                  )}
                </div>
                <input type="password" required value={forgotPasswordConfirm}
                  onChange={(e) => setForgotPasswordConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm input-focus text-slate-800 font-medium" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForgotPasswordStep('request')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-3.5 rounded-2xl text-xs transition-smooth">
                  Back
                </button>
                <button type="submit" disabled={forgotPasswordLoading}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2">
                  {forgotPasswordLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting Password...</> : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </BottomSheet>

        {/* Forgot PIN BottomSheet */}
        <BottomSheet open={forgotPinModalOpen} onClose={() => setForgotPinModalOpen(false)}
          title="Reset Transaction PIN" subtitle={forgotPinStep === 'request' ? 'Request 6-digit email verification code' : 'Enter code & create new 4-digit PIN'}>
          {forgotPinStep === 'request' ? (
            <div className="space-y-4 text-left">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
                  <Mail className="w-4 h-4 text-sky-500" />
                  <span>Email Verification Required</span>
                </div>
                <p className="text-xs text-sky-600/90 leading-relaxed font-medium">
                  We will send a 6-digit security verification code to your email address ({currentUser.email || 'your registered email'}).
                </p>
              </div>
              <button type="button" onClick={handleForgotPinRequest} disabled={forgotPinLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2">
                {forgotPinLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending Code...</> : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPinVerify} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Verification Code (from Email)</label>
                <input type="text" maxLength={6} required value={forgotPinCode}
                  onChange={(e) => setForgotPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit OTP code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold font-mono tracking-widest text-center input-focus text-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Create New 4-Digit PIN</label>
                <input type="password" maxLength={4} required value={forgotPinNew}
                  onChange={(e) => setForgotPinNew(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold font-mono tracking-[0.5em] text-center input-focus text-slate-800" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Confirm New 4-Digit PIN</label>
                  {forgotPinNew && forgotPinConfirm && (
                    <span className={`text-[10px] font-bold ${forgotPinNew === forgotPinConfirm ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {forgotPinNew === forgotPinConfirm ? '✓ PINs Match' : '✗ PINs Do Not Match'}
                    </span>
                  )}
                </div>
                <input type="password" maxLength={4} required value={forgotPinConfirm}
                  onChange={(e) => setForgotPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold font-mono tracking-[0.5em] text-center input-focus text-slate-800" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForgotPinStep('request')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-3.5 rounded-2xl text-xs transition-smooth">
                  Back
                </button>
                <button type="submit" disabled={forgotPinLoading}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen flex items-center justify-center gap-2">
                  {forgotPinLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting PIN...</> : 'Reset Transaction PIN'}
                </button>
              </div>
            </form>
          )}
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
                
                if (apiStatus === 'offline') {
                  setUpgradeLoading(false);
                  toast.error('API connection required for reseller upgrade.');
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
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-spring shadow-lg shadow-sky-600/15 active:scale-[0.98] btn-sheen">
                Pay ₦{(currentUser.upgradeFee || 5000).toLocaleString()} & Upgrade
              </button>
            </div>
          )}
        </BottomSheet>

        {/* Notification Detail Bottom Sheet */}
        {selectedNotification && (
          <BottomSheet open={!!selectedNotification} onClose={() => setSelectedNotification(null)} title="Notification Detail">
            <div className="space-y-4 text-left p-1">
              {resolveImageUrl(selectedNotification.image) && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-48 shadow-sm">
                  <img
                    src={resolveImageUrl(selectedNotification.image)!}
                    alt="Notification Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedNotification.target_group ? `Target: ${selectedNotification.target_group}` : 'Broadcast'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedNotification.title}</h3>
                <span className="text-xs text-slate-400 block mt-0.5">{selectedNotification.created_at}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                {selectedNotification.message}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-smooth btn-sheen shadow-md shadow-sky-600/15 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </BottomSheet>
        )}

      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm} title={confirmConfig.title}
        description={confirmConfig.description} confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant} />
    </div>
  );
}
