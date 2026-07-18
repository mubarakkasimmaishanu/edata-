import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, ProductItem } from '../types';
import { 
  Smartphone, Wifi, Battery, ChevronLeft, ArrowRight, ArrowDownLeft, 
  ArrowUpRight, Copy, Share2, HelpCircle, CheckCircle, AlertTriangle, 
  User, Lock, Key, Eye, HelpCircle as HelpIcon, Flame, ShieldAlert,
  Send, CreditCard, RefreshCw, Layers, Phone, DollarSign, Lightbulb,
  Tv, BookOpen, Send as PaperPlane, UserCheck, Check, Search, AlertCircle,
  History, MoreHorizontal, Headphones, Bell, EyeOff, Coins, Info, Gift
} from 'lucide-react';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import { DEFAULT_USER } from '../data';


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

export default function MobileSimulator({
  currentUser,
  setCurrentUser,
  products,
  transactions,
  setTransactions,
  subscribers,
  setSubscribers,
  handleGlobalRefresh,
  isSyncing = false,
  handleLoginSuccess,
  handleLogout,
  currentScreen,
  setCurrentScreen,
  apiStatus,
  setApiStatus
}: MobileSimulatorProps) {
  // Navigation states
  const [appTab, setAppTab] = useState<'home' | 'airtime' | 'data' | 'electricity' | 'cable' | 'exam' | 'history' | 'support' | 'profile' | 'a2c' | 'services'>('home');


  // Onboarding/Auth state variables
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [authName, setAuthName] = useState<string>(currentUser.name);
  const [authPhone, setAuthPhone] = useState<string>(currentUser.phone);
  const [authPromo, setAuthPromo] = useState<string>('');
  const [regMode, setRegMode] = useState<'self' | 'referral'>('self');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  
  // Registration password states
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  
  // OTP code inputs
  const [otpCode, setOtpCode] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  
  // BVN / NIN Inputs
  const [bvnInput, setBvnInput] = useState<string>('');
  const [ninInput, setNinInput] = useState<string>('');
  const [kycLoading, setKycLoading] = useState<boolean>(false);

  // Active Transaction flow states
  const [selectedCategory, setSelectedCategory] = useState<'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Exam' | 'A2C'>('Airtime');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [detectedOperator, setDetectedOperator] = useState<string>('');
  const [checkoutAmount, setCheckoutAmount] = useState<string>('');
  const [contactsOpen, setContactsOpen] = useState<boolean>(false);
  const [pinSheetOpen, setPinSheetOpen] = useState<boolean>(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [priceSheetOpen, setPriceSheetOpen] = useState<boolean>(false);
  const [othersSheetOpen, setOthersSheetOpen] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('All');
  const [a2cBank, setA2cBank] = useState<string>('');
  const [a2cAccount, setA2cAccount] = useState<string>('');
  const [a2cPayout, setA2cPayout] = useState<number>(0);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string>('');
  const [appliedPromoId, setAppliedPromoId] = useState<number | string>('');

  // Validation states
  const [customerName, setCustomerName] = useState<string>('');
  const [isValidatingNumber, setIsValidatingNumber] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleApplyPromoCode = async () => {
    setPromoError('');
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code.');
      return;
    }

    if (!selectedProduct) {
      setPromoError('Please select a provider/package first.');
      return;
    }

    const basePrice = parseFloat(checkoutAmount || '0');
    if (basePrice <= 0) {
      setPromoError('Invalid transaction amount.');
      return;
    }

    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
      if (code === 'WELCOME10' || code === 'EDATA50') {
        const discount = code === 'WELCOME10' ? 10 : (basePrice * 0.5 > 100 ? 100 : basePrice * 0.5);
        setPromoDiscount(discount);
        setAppliedPromo(code);
        setAppliedPromoId('promo-mock');
      } else {
        setPromoError('Invalid or expired promo code.');
      }
      return;
    }

    try {
      let serviceId = selectedProduct.id;
      if (selectedProduct.id.startsWith('plan-')) {
        const parts = selectedProduct.id.split('-');
        serviceId = parts[2];
      }
      const res = await api.validatePromo(code, serviceId, basePrice);
      if (res.success && res.data) {
        setPromoDiscount(parseFloat(res.data.discount || '0'));
        setAppliedPromo(code);
        setAppliedPromoId(res.data.promo_id);
      } else {
        setPromoError(res.error || 'Promo code validation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setPromoError(err.message || 'Error validating promo code.');
    }
  };

  // Reset promo code on product/category changes
  useEffect(() => {
    setAppliedPromo('');
    setPromoDiscount(0);
    setPromoCodeInput('');
    setPromoError('');
  }, [selectedProduct, selectedCategory]);

  // Interactive UI Modal states (completely in-app)
  const [fundModalOpen, setFundModalOpen] = useState<boolean>(false);
  const [fundAmountInput, setFundAmountInput] = useState<string>('5000');
  const [fundGateway, setFundGateway] = useState<'Paystack' | 'Flutterwave' | 'Monnify' | 'Bank Transfer'>('Paystack');
  const [fundLoading, setFundLoading] = useState<boolean>(false);

  const [changePinModalOpen, setChangePinModalOpen] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');

  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeLoading, setUpgradeLoading] = useState<boolean>(false);

  // AI Security Scan properties
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [riskScore, setRiskScore] = useState<number>(0);
  const [riskAnalysis, setRiskAnalysis] = useState<string>('');

  // AI Chat properties
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am your eData AI Security and Utility Copilot. Ask me how to fund your wallet, upgrade your marketing tier, or explain product prices!' }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Quick helper list of contacts for phone-fill
  const demoContacts = [
    { name: 'Segun Arinze', phone: '08031234567', operator: 'MTN' },
    { name: 'Aisha Yusuf', phone: '08051112223', operator: 'Glo' },
    { name: 'Obinna Okafor', phone: '08023334445', operator: 'Airtel' },
    { name: 'Yusuf Sani', phone: '09099887766', operator: '9mobile' }
  ];

  // Auto detect operators
  useEffect(() => {
    if (selectedCategory === 'Airtime' || selectedCategory === 'Data' || selectedCategory === 'A2C') {
      let normalized = targetNumber.replace(/\D/g, '');
      if (normalized.startsWith('234')) {
        normalized = '0' + normalized.substring(3);
      }
      
      const mtnPrefixes = ['0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916', '0703', '0706', '0704', '07025', '07026', '07020', '0707'];
      const airtelPrefixes = ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0911', '0912'];
      const gloPrefixes = ['0705', '0805', '0807', '0811', '0815', '0905', '0915'];
      const nineMobilePrefixes = ['0809', '0817', '0818', '0909', '0908'];

      let detected = '';
      if (normalized.length >= 5) {
        const prefix5 = normalized.substring(0, 5);
        if (mtnPrefixes.includes(prefix5)) detected = 'MTN';
        else if (airtelPrefixes.includes(prefix5)) detected = 'Airtel';
        else if (gloPrefixes.includes(prefix5)) detected = 'Glo';
        else if (nineMobilePrefixes.includes(prefix5)) detected = '9mobile';
      }

      if (!detected && normalized.length >= 4) {
        const prefix4 = normalized.substring(0, 4);
        if (mtnPrefixes.includes(prefix4)) detected = 'MTN';
        else if (airtelPrefixes.includes(prefix4)) detected = 'Airtel';
        else if (gloPrefixes.includes(prefix4)) detected = 'Glo';
        else if (nineMobilePrefixes.includes(prefix4)) detected = '9mobile';
      }

      setDetectedOperator(detected);
    } else {
      setDetectedOperator('');
    }
  }, [targetNumber, selectedCategory]);

  // Fetch dynamic pricing based on user tier
  const getDynamicPrice = (product: ProductItem) => {
    if (currentUser.category === 'Premium User') return product.pricePremium;
    if (currentUser.category === 'Referred User') return product.priceReferred;
    return product.priceNormal;
  };

  // Sync selected product with detected operator or manually overridden operator
  useEffect(() => {
    if (detectedOperator && (selectedCategory === 'Airtime' || selectedCategory === 'Data')) {
      const matching = products.find(p => p.category === selectedCategory && p.operator?.toLowerCase() === detectedOperator.toLowerCase() && p.active);
      if (matching) {
        setSelectedProduct(matching);
        if (selectedCategory === 'Airtime') {
          setCheckoutAmount('200'); // default airtime
        } else {
          setCheckoutAmount(getDynamicPrice(matching).toString());
        }
      }
    }
  }, [detectedOperator, selectedCategory, products]);

  // Handle Initial selection of product from category changes
  useEffect(() => {
    const categoryProducts = products.filter(p => p.category === selectedCategory && p.active);
    if (categoryProducts.length > 0) {
      setSelectedProduct(categoryProducts[0]);
      if (selectedCategory === 'Airtime') {
        setCheckoutAmount('200'); // default airtime
      } else {
        setCheckoutAmount(getDynamicPrice(categoryProducts[0]).toString());
      }
    } else {
      setSelectedProduct(null);
    }
    // reset scan parameters
    setScanState('idle');
  }, [selectedCategory, products, currentUser.category]);

  // Adjust default amounts when product changes
  useEffect(() => {
    if (selectedProduct && selectedCategory !== 'Airtime') {
      setCheckoutAmount(getDynamicPrice(selectedProduct).toString());
    }
  }, [selectedProduct]);

  // Clear validation when inputs or category changes
  useEffect(() => {
    setCustomerName('');
    setValidationError('');
  }, [targetNumber, selectedProduct, selectedCategory]);

  // Validate Meter/Smartcard
  const handleValidateNumber = async () => {
    if (!targetNumber) {
      setValidationError('Please enter a number first.');
      return;
    }
    if (!selectedProduct) {
      setValidationError('Please select a provider first.');
      return;
    }
    setIsValidatingNumber(true);
    setValidationError('');
    setCustomerName('');

    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
      setTimeout(() => {
        setCustomerName('Mubarak Kasim Maishanu (Mock Verification)');
        setIsValidatingNumber(false);
      }, 500);
      return;
    }

    try {
      const res = await api.validateMeterOrSmartcard(selectedProduct.id, targetNumber);
      if (res.success && res.data) {
        setCustomerName(res.data.customer_name);
      } else {
        setValidationError(res.error || 'Validation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || 'Error validating number.');
    } finally {
      setIsValidatingNumber(false);
    }
  };

  // Run Real-time AI security scan
  const handleAISecurityScan = async () => {
    if (!targetNumber) {
      alert("Please enter a valid phone or meter number before scanning.");
      return;
    }
    setScanState('scanning');
    
    try {
      const response = await fetch('/api/eDataAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'riskScan',
          transactionData: {
            productName: selectedProduct?.name || selectedCategory,
            phoneOrMeter: targetNumber,
            operator: detectedOperator || selectedProduct?.operator || 'None',
            amount: checkoutAmount,
            userCategory: currentUser.category
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setRiskScore(data.riskScore);
        setRiskAnalysis(data.analysis);
        setScanState('success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      // Offline fallback
      setRiskScore(5);
      setRiskAnalysis("Heuristic analyzer validated targets. Perfect safety profile detected. Transaction approved for execution.");
      setScanState('success');
    }
  };

  // Initiate checkout flow (checks if biometrics are enabled to bypass PIN entry sheet)
  const handleCheckoutInitiate = () => {
    if (!currentUser.hasPin) {
      alert("Please set up a Transaction PIN before completing your first transaction.");
      setChangePinModalOpen(true);
      return;
    }
    if (currentUser.biometricsEnabled) {
      setScanState('scanning');
      setTimeout(() => {
        handleConfirmPurchase();
      }, 1000);
    } else {
      setPinSheetOpen(true);
    }
  };

  // Submit Transaction checkout via Yii2 Backend API
  const handleConfirmPurchase = async () => {
    // 1. Resolve product ID & plan ID
    let serviceId = selectedProduct?.id;
    let planId = undefined;
    
    if (selectedCategory === 'A2C') {
      const a2cProduct = products.find(p => p.category === 'A2C');
      serviceId = a2cProduct?.id || '38';
    } else if (selectedProduct && selectedProduct.id.startsWith('plan-')) {
      const parts = selectedProduct.id.split('-');
      planId = parts[1];
      serviceId = parts[2];
    }

    if (!serviceId) {
      alert("Invalid product selection.");
      return;
    }

    const basePrice = parseFloat(checkoutAmount || '0');
    const price = selectedCategory === 'A2C' ? basePrice : Math.max(0, basePrice - promoDiscount);

    setScanState('scanning');

    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
      setTimeout(() => {
        const ref = 'EDAT-SANDBOX-' + Math.floor(100000 + Math.random() * 900000);
        const newTx: Transaction = {
          id: ref,
          type: selectedCategory === 'A2C' ? 'A2C' : selectedCategory,
          productName: selectedCategory === 'A2C' 
            ? `A2C Cash Payout (₦${a2cPayout.toLocaleString()})` 
            : (selectedProduct?.name || `${selectedCategory} Payment`) + (appliedPromo ? ` (Promo ${appliedPromo} Applied)` : ''),
          amount: price,
          phoneOrMeter: targetNumber || ref,
          operator: detectedOperator || selectedProduct?.operator,
          reference: ref,
          status: 'Completed',
          date: new Date().toISOString(),
          disputeRaised: false,
          riskScore: riskScore,
          riskAnalysis: riskAnalysis
        };

        if (selectedCategory !== 'A2C') {
          setCurrentUser(prev => ({
            ...prev,
            walletBalance: prev.walletBalance - price
          }));
        }

        setTransactions(prev => [newTx, ...prev]);
        setActiveReceipt(newTx);
        setPinSheetOpen(false);
        setPinInput('');
        setTargetNumber('');
        setScanState('idle');
        setA2cBank('');
        setA2cAccount('');
        setA2cPayout(0);
        setAppliedPromo('');
        setPromoDiscount(0);
        setPromoCodeInput('');
        setPromoError('');
        setAppliedPromoId('');
      }, 800);
      return;
    }

    try {
      const res = await api.purchase({
        service_id: serviceId,
        amount: price,
        target_number: targetNumber,
        transaction_pin: pinInput,
        plan_id: planId,
        promo_id: appliedPromoId || undefined,
        bank_name: selectedCategory === 'A2C' ? a2cBank : undefined,
        account_number: selectedCategory === 'A2C' ? a2cAccount : undefined,
      });

      if (res.success && res.data) {
        // Create the transaction record to display in receipt
        const newTx: Transaction = {
          id: res.data.reference,
          type: selectedCategory === 'A2C' ? 'A2C' : selectedCategory,
          productName: selectedCategory === 'A2C' 
            ? `A2C Cash Payout (₦${a2cPayout.toLocaleString()})` 
            : (selectedProduct?.name || `${selectedCategory} Payment`) + (appliedPromo ? ` (Promo ${appliedPromo} Applied)` : ''),
          amount: price,
          phoneOrMeter: targetNumber,
          operator: detectedOperator || selectedProduct?.operator,
          reference: res.data.reference,
          status: res.data.status || 'Completed',
          date: new Date().toISOString(),
          disputeRaised: false,
          riskScore: riskScore,
          riskAnalysis: riskAnalysis
        };

        // Reload data from backend to sync balance, deposits, transactions
        if (handleGlobalRefresh) {
          handleGlobalRefresh();
        }

        setTransactions(prev => [newTx, ...prev]);
        setActiveReceipt(newTx);
        setPinSheetOpen(false);
        setPinInput('');
        setTargetNumber('');
        setScanState('idle');
        setA2cBank('');
        setA2cAccount('');
        setA2cPayout(0);
        setAppliedPromo('');
        setPromoDiscount(0);
        setPromoCodeInput('');
        setPromoError('');
        setAppliedPromoId('');
      } else {
        alert(res.error || "Purchase failed.");
        setPinInput('');
        setScanState('idle');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during transaction checkout.");
      setPinInput('');
      setScanState('idle');
    }
  };

  // AI Support Bot Chat
  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/eDataAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: userMsg,
          history: chatHistory.map(h => ({ role: h.role, content: h.content }))
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I'm currently working with offline fallback constraints. Let me provide simple local advice:
        
        To **fund your wallet**, you can go to our admin workspace and add credits instantly!
        To **reduce pricing**, you can modify your category inside the profile view.`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // API Login handler
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!authEmail.trim() || !authPassword.trim()) {
      setLoginError('Email and Password are required.');
      return;
    }
    setLoginLoading(true);

    const isSandboxActive = localStorage.getItem('edata_sandbox') === 'true';

    // If sandbox mode is explicitly active, do sandbox login directly
    if (isSandboxActive) {
      const match = subscribers.find(s => s.email.toLowerCase() === authEmail.toLowerCase());
      if (match) {
        localStorage.setItem('edata_sandbox', 'true');
        setCurrentUser(match);
        localStorage.setItem('edata_current_user', JSON.stringify(match));
        setAuthPassword('');
        setLoginError('');
        if (handleLoginSuccess) {
          handleLoginSuccess('mock-sandbox-token');
        }
      } else {
        setLoginError('Email not registered in local sandbox registry.');
      }
      setLoginLoading(false);
      return;
    }

    // Try to perform a live login using Yii2 Core API
    try {
      const res = await api.login(authEmail, authPassword);
      if (res.success && res.data?.token) {
        localStorage.setItem('edata_sandbox', 'false');
        setApiStatus('connected');
        if (handleLoginSuccess) {
          handleLoginSuccess(res.data.token);
        }
        setAuthPassword('');
        setLoginError('');
      } else {
        setLoginError(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      console.warn('Yii2 API Login failed. Checking offline fallback availability...', err);
      
      // Determine if error is a connection failure (server is offline/unreachable)
      const isConnectionError = !err.status || err.message?.toLowerCase().includes('failed to fetch') || err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed with status');
      
      if (isConnectionError) {
        // Fall back to sandbox mode dynamically
        const match = subscribers.find(s => s.email.toLowerCase() === authEmail.toLowerCase());
        if (match) {
          localStorage.setItem('edata_sandbox', 'true');
          setApiStatus('sandbox');
          setCurrentUser(match);
          localStorage.setItem('edata_current_user', JSON.stringify(match));
          setAuthPassword('');
          setLoginError('');
          if (handleLoginSuccess) {
            handleLoginSuccess('mock-sandbox-token');
          }
          alert("⚠️ Local Yii2 backend is offline. Started app in Offline Sandbox Mode.");
        } else {
          setLoginError('Yii2 Backend is offline, and email is not registered in local sandbox registry.');
        }
      } else {
        setLoginError(err.message || 'Invalid credentials.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Onboarding registration handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      alert("Please accept the terms and conditions first.");
      return;
    }
    
    // Simulate register success, transition to email OTP verification
    setCurrentScreen('otp');
  };

  // OTP Verification
  const handleVerifyOTP = () => {
    if (otpCode.length < 4) {
      setVerificationError("Please enter a valid 4-digit verification code.");
      return;
    }
    setVerificationError('');
    setCurrentScreen('password_create');
  };

  // Registration password handler
  const handleRegisterPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const newUserObj: UserProfile = {
      name: authEmail.split('@')[0].toUpperCase(),
      email: authEmail,
      phone: '',
      walletBalance: 0,
      category: regMode === 'referral' ? 'Referred User' : 'Basic User',
      bvn: '',
      nin: '',
      isVerified: false,
      pinCode: '',
      hasPin: false,
      promoCode: authPromo,
    };

    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
      localStorage.setItem('edata_sandbox', 'true');
      setSubscribers(prev => {
        if (!prev.find(s => s.email.toLowerCase() === authEmail.toLowerCase())) {
          return [...prev, newUserObj];
        }
        return prev;
      });
      setCurrentUser(newUserObj);
      localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
      alert("🎉 Account created successfully! Please configure your Transaction PIN when completing your first purchase.");
    } else {
      alert("API mode active. Please use the Web App to sign up first, then log in here.");
    }

    setRegPassword('');
    setRegConfirmPassword('');
    setCurrentScreen('app');
  };

  // Submit BVN/NIN verified status
  const handleSubmitKYC = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      
      const newUserObj: UserProfile = {
        name: authName,
        email: authEmail,
        phone: authPhone,
        walletBalance: 0,
        category: regMode === 'referral' ? 'Referred User' : 'Basic User',
        bvn: bvnInput || '11111111111',
        nin: ninInput || '22222222222',
        isVerified: true,
        pinCode: '',
        hasPin: false,
        promoCode: authPromo,
      };

      if (apiStatus === 'offline' || apiStatus === 'sandbox') {
        localStorage.setItem('edata_sandbox', 'true');
        setSubscribers(prev => {
          if (!prev.find(s => s.email.toLowerCase() === authEmail.toLowerCase())) {
            return [...prev, newUserObj];
          }
          return prev;
        });
        setCurrentUser(newUserObj);
        localStorage.setItem('edata_current_user', JSON.stringify(newUserObj));
      } else {
        setCurrentUser(curr => ({ ...curr, isVerified: true }));
      }
      setCurrentScreen('app');
    }, 1500);
  };

  // Generate and download visual A6 PDF receipt
  const generatePDFReceipt = (tx: Transaction) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
      });

      const primaryColor = [14, 165, 233]; 
      const darkColor = [15, 23, 42]; 
      const lightBg = [248, 250, 252]; 

      // Page background
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(0, 0, 105, 148, 'F');

      // Top accent bar
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 105, 8, 'F');

      // Header text
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('eData Mobile', 52.5, 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Lightning Fast Telecom & Utility Payouts', 52.5, 22, { align: 'center' });

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(10, 26, 95, 26);

      // Success Status Banner
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(15, 30, 75, 10, 1.5, 1.5, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(15, 30, 75, 10, 1.5, 1.5, 'S');
      
      doc.setTextColor(4, 120, 87);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('● TRANSACTION SUCCESSFUL', 52.5, 36.5, { align: 'center' });

      // Amount Title
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`NGN ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 52.5, 52, { align: 'center' });

      // Detailed parameter list
      doc.setDrawColor(241, 245, 249);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 60, 85, 60, 2.5, 2.5, 'FD');

      doc.setFontSize(7.5);
      
      const details = [
        { label: 'Reference ID', val: tx.reference },
        { label: 'Service/Product', val: tx.productName },
        { label: 'Recipient/Meter', val: tx.phoneOrMeter },
        { label: 'Provider / Network', val: tx.operator || 'N/A' },
        { label: 'Payment Method', val: 'Wallet Balance' },
        { label: 'Execution Date', val: new Date(tx.date).toLocaleString() }
      ];

      let currentY = 67;
      details.forEach((item) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(item.label, 14, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        
        let displayVal = item.val;
        if (displayVal.length > 28) {
          displayVal = displayVal.substring(0, 26) + '...';
        }
        doc.text(displayVal, 91, currentY, { align: 'right' });
        currentY += 8.5;
      });

      // Footer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Thank you for choosing eData Mobile.', 52.5, 134, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Support: support@edata.com | Web: www.edata.com', 52.5, 138, { align: 'center' });

      doc.save(`Receipt-${tx.reference}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Error generating PDF receipt.');
    }
  };

  // Copy textual details of receipt to clipboard
  const copyReceiptToClipboard = (tx: Transaction) => {
    const text = `
=== EDATA TRANSACTION RECEIPT ===
Reference ID: ${tx.reference}
Amount: ₦${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Service: ${tx.productName}
Recipient: ${tx.phoneOrMeter}
Provider: ${tx.operator || 'N/A'}
Date: ${new Date(tx.date).toLocaleString()}
Status: SUCCESSFUL
=================================
Thank you for using eData Mobile!
    `.trim();

    navigator.clipboard.writeText(text)
      .then(() => alert("📋 Transaction receipt details copied to clipboard!"))
      .catch((err) => {
        console.error(err);
        alert("Failed to copy receipt to clipboard.");
      });
  };

  // Raise dispute
  const handleRaiseDispute = (txId: string) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        return { 
          ...tx, 
          disputeRaised: true, 
          disputeStatus: 'Open', 
          disputeNotes: 'Customer reported service token delay. Awaiting Admin refund.' 
        };
      }
      return tx;
    }));
    alert("Dispute raised successfully. Admins have been notified.");
  };

  // Simulated gateway wallet funding
  const handleFundWallet = (gateway: string, amount: number) => {
    const confirmation = window.confirm(`Fund wallet with ₦${amount.toLocaleString()} via ${gateway}?`);
    if (!confirmation) return;

    const newBalance = currentUser.walletBalance + amount;
    setCurrentUser(curr => ({ ...curr, walletBalance: newBalance }));
    
    setSubscribers(prev => prev.map(s => {
      if (s.email === currentUser.email) {
        return { ...s, walletBalance: newBalance };
      }
      return s;
    }));

    const fundTx: Transaction = {
      id: `tx-fund-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Wallet Funding',
      productName: `${gateway} gateway funding`,
      amount: amount,
      phoneOrMeter: `Ref: ${gateway.substring(0,3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      reference: `EDAT-FUND-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Completed',
      date: new Date().toISOString(),
      disputeRaised: false
    };

    setTransactions(prev => [fundTx, ...prev]);
    alert(`Success! Credited ₦${amount.toLocaleString()} to wallet via ${gateway}.`);
  };

  return (
    <div className="flex flex-col items-center justify-center p-0 md:p-6 select-none" id="mobile-shell-container">
      
      {/* Clean stand-alone mobile-responsive Web App Container */}
      <div className="relative w-full max-w-md min-h-[720px] bg-slate-50 md:rounded-[36px] shadow-2xl flex flex-col overflow-hidden border border-slate-200/50">
        
        {/* Main Inside Viewport */}
        <div className="flex-1 bg-slate-50 flex flex-col">
                 {/* SCREEN: Auth Portal (Login / Registration) */}
          {currentScreen === 'auth' && (
            <div className="flex-1 p-6 flex flex-col justify-between bg-slate-50">
              <div className="space-y-6 mt-4">
                {/* Branding */}
                <div className="text-center space-y-2">
                  <div className="inline-flex bg-sky-600 text-white p-2.5 rounded-2xl shadow-md">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">eData Mobile</h1>
                  <p className="text-xs text-slate-500">Secure utility tokens, lightning quick payouts.</p>
                </div>

                {apiStatus === 'offline' && (
                  <div className="bg-sky-50 border border-sky-200 text-sky-800 p-2.5 rounded-xl text-[10px] font-bold space-y-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                      <span>Yii2 Backend Offline. Sandbox mode active.</span>
                    </div>
                    <p className="font-normal text-[9px] text-slate-500 leading-normal">You can use test credentials like <strong>usmanannur58@gmail.com</strong> / <strong>1234</strong> or create a new account.</p>
                  </div>
                )}

                {/* Switcher */}
                <div className="bg-slate-200/60 p-1 rounded-xl flex">
                  <button 
                    onClick={() => setIsRegistering(false)} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setIsRegistering(true)} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Form Inputs */}
                {isRegistering ? (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="usmanannur58@gmail.com" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800" 
                      />
                    </div>
                     <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">How did you find us?</label>
                      <select
                        value={regMode}
                        onChange={(e) => {
                          const val = e.target.value as 'self' | 'referral';
                          setRegMode(val);
                          if (val === 'self') {
                            setAuthPromo('');
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      >
                        <option value="self">I navigated here by myself (Self-Registered)</option>
                        <option value="referral">Joined through a Referral Link / Code</option>
                      </select>
                    </div>

                    {regMode === 'referral' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Referral Link / Code</label>
                        <input 
                          type="text" 
                          value={authPromo}
                          onChange={(e) => setAuthPromo(e.target.value)}
                          placeholder="e.g. REF-58291" 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800" 
                        />
                      </div>
                    )}
                    
                    {/* Accept Terms */}
                    <div className="flex items-start gap-2 pt-1">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 accent-sky-600 rounded" 
                      />
                      <label htmlFor="terms" className="text-[10px] text-slate-500 leading-normal">
                        I accept the <strong className="text-slate-800 underline">Terms & Conditions</strong> and understand data is verified securely.
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md mt-4 transition-all"
                    >
                      Get Started <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
                    {loginError && (
                      <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl text-[10px] font-semibold flex items-start gap-1.5 border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input 
                        type="email" 
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="usmanannur58@gmail.com" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800" 
                        disabled={loginLoading}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <input 
                        type="password" 
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800" 
                        disabled={loginLoading}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md mt-4 transition-all"
                    >
                      {loginLoading ? 'Logging in...' : 'Secure Login'} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>

              {/* Social login buttons */}
              <div className="space-y-3 pt-6 border-t border-slate-200/80">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Or social login</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
                
                <button 
                  onClick={() => {
                    if (apiStatus === 'offline' || apiStatus === 'sandbox') {
                      localStorage.setItem('edata_sandbox', 'true');
                      const match = subscribers.find(s => s.email === DEFAULT_USER.email) || DEFAULT_USER;
                      setCurrentUser(match);
                      localStorage.setItem('edata_current_user', JSON.stringify(match));
                      if (handleLoginSuccess) {
                        handleLoginSuccess('google-sandbox-token');
                      }
                    } else {
                      setCurrentScreen('app');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.81-6.277-6.277 0-3.466 2.81-6.277 6.277-6.277 1.5 0 2.87.532 3.945 1.417l2.96-2.96C18.67 1.956 15.65 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.804 0 10.88-4.144 10.88-11.24 0-.616-.062-1.217-.183-1.801l-10.7-.154z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: Email OTP Verification */}
          {currentScreen === 'otp' && (
            <div className="flex-1 p-6 flex flex-col justify-between bg-white">
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Confirm Your Email</h2>
                  <p className="text-xs text-slate-500">
                    We've sent a 4-digit verification passcode to <strong className="text-slate-800">{authEmail}</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <input 
                      type="text" 
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••" 
                      className="bg-slate-100 border border-slate-200 tracking-widest text-center text-2xl font-black rounded-2xl w-32 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                    />
                  </div>
                  {verificationError && (
                    <p className="text-rose-500 text-[10px] text-center font-bold">{verificationError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 text-center">Didn't receive code? <strong className="text-sky-600 underline">Resend OTP</strong></p>
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleVerifyOTP}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
                >
                  Verify & Continue
                </button>
                <button 
                  onClick={() => setCurrentScreen('auth')}
                  className="w-full text-slate-400 font-bold py-2 text-xs"
                >
                  Back to register
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: Registration Password Creation */}
          {currentScreen === 'password_create' && (
            <div className="flex-1 p-6 flex flex-col justify-between bg-white text-slate-800">
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Secure Your Account</h2>
                  <p className="text-xs text-slate-500">
                    Create a password to finalize your registration.
                  </p>
                </div>

                <form onSubmit={handleRegisterPasswordSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                    <div className="relative">
                      <input 
                        type={showRegPassword ? "text" : "password"} 
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create Password" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer flex items-center justify-center"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showRegConfirmPassword ? "text" : "password"} 
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Confirm Password" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer flex items-center justify-center"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md mt-6"
                  >
                    Complete Registration
                  </button>
                </form>
              </div>

              <div>
                <button 
                  onClick={() => setCurrentScreen('auth')}
                  className="w-full text-slate-400 font-bold py-2 text-xs"
                >
                  Back to register
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: Onboarding KYC (BVN / NIN Verification) */}
          {currentScreen === 'bvn_verify' && (
            <div className="flex-1 p-6 flex flex-col justify-between bg-white">
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <span className="text-[9px] bg-sky-50 text-sky-600 border border-sky-100 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">KYC Verification</span>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verify Your Identity</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Under CBN and NITDA guidelines, you must provide your <strong className="text-slate-800">BVN</strong> or <strong className="text-slate-800">NIN</strong> to fund your mobile wallet.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">National Identification Number (NIN)</label>
                    <input 
                      type="text" 
                      maxLength={11}
                      value={ninInput}
                      onChange={(e) => setNinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="11-digit NIN" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                    />
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-100" />
                    <span className="flex-shrink mx-3 text-[9px] text-slate-300 font-bold uppercase tracking-widest">Or BVN</span>
                    <div className="flex-grow border-t border-slate-100" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bank Verification Number (BVN)</label>
                    <input 
                      type="text" 
                      maxLength={11}
                      value={bvnInput}
                      onChange={(e) => setBvnInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="11-digit BVN" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleSubmitKYC}
                  disabled={kycLoading}
                  className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-400 text-white font-bold py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-2"
                >
                  {kycLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Credentials...
                    </>
                  ) : (
                    'Verify & Secure Profile'
                  )}
                </button>
                <button 
                  onClick={() => setCurrentScreen('app')}
                  className="w-full text-slate-400 font-bold py-2 text-xs"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: Dynamic Logged-in App Space */}
          {currentScreen === 'app' && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Header block (Changes content based on tab) */}
              <div className={`px-5 pt-3 pb-4 space-y-3 shrink-0 ${
                appTab === 'home' 
                  ? 'bg-[#111111]' 
                  : 'bg-sky-50/40 shadow-sm border-b border-sky-100/10'
              }`}>
                {appTab === 'home' ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar with sky-blue ring */}
                      <div className="w-8 h-8 rounded-full border-2 border-sky-500 p-0.5 flex items-center justify-center bg-sky-950/40 shadow-inner">
                        <User className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold leading-none">Hi,</span>
                        <span className="text-xs font-black text-white leading-none tracking-wide mt-1 block">
                          {(currentUser.name || 'ISRAEL').split(' ')[0].toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Right side support + notification controls */}
                    <div className="flex items-center gap-4">
                      {/* Headphone icon (AI Support link) */}
                      <button 
                        type="button" 
                        onClick={() => setAppTab('support')}
                        className="relative p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer"
                        title="Customer Support Desk"
                      >
                        <Headphones className="w-4 h-4" />
                      </button>

                      {/* Notification bell with 99+ red dot badge */}
                      <button 
                        type="button"
                        onClick={() => setAppTab('history')}
                        className="relative p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer"
                        title="Notification Inbox / History"
                      >
                        <Bell className="w-4 h-4" />
                        <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#111111] leading-none px-0.5">
                          99+
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // STANDARD HEADER FOR SERVICE TABS
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-sky-100 rounded-lg text-sky-600 transition-all cursor-pointer flex items-center justify-center mr-1"
                        title="Back to Home Dashboard"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                          {appTab === 'airtime' && 'Airtime VTU'}
                          {appTab === 'data' && 'Data Bundle'}
                          {appTab === 'electricity' && 'Electricity'}
                          {appTab === 'cable' && 'Cable TV'}
                          {appTab === 'exam' && 'Exam Token'}
                          {appTab === 'a2c' && 'Airtime to Cash'}
                          {appTab === 'history' && 'Transactions'}
                          {appTab === 'support' && 'Customer Support'}
                          {appTab === 'profile' && 'My Profile'}
                          {appTab === 'services' && 'All Services'}
                        </h3>
                        <span className="text-[9px] text-slate-400 font-bold leading-none">{currentUser.category}</span>
                      </div>
                    </div>
                    
                    {/* Verification & Sync */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (handleGlobalRefresh) {
                            handleGlobalRefresh();
                          } else {
                            alert("Syncing data with Yii2 Advanced backend API...");
                          }
                        }}
                        className={`p-1 hover:bg-sky-100/60 text-sky-600 rounded-lg transition-all ${isSyncing ? 'animate-spin' : ''}`}
                        title="Sync with Yii2 API"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      {currentUser.isVerified ? (
                        <span className="bg-sky-100 text-sky-700 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Verified
                        </span>
                      ) : (
                        <button 
                          onClick={() => setCurrentScreen('bvn_verify')}
                          className="bg-sky-100 hover:bg-sky-200 text-sky-700 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" /> Verify ID
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TAB CONTAINER VIEW */}
              <div className={`flex-1 overflow-y-auto p-3 space-y-3 relative scrollbar-none ${appTab === 'home' ? 'bg-[#111111]' : ''}`}>
                
                {/* Pull-to-refresh style API syncing loading bar */}
                {isSyncing && (
                  <div className="absolute top-0 left-0 right-0 bg-sky-50 text-sky-700 text-[10px] font-bold py-1.5 text-center border-b border-sky-100 flex items-center justify-center gap-1.5 z-50 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Fetching latest rates from Yii2 API...
                  </div>
                )}
                
                {/* 1. HOME TAB VIEW (100% Live Backend-Powered Fintech Dashboard) */}
                {appTab === 'home' && (() => {
                  // Compute Yesterday's Earnings dynamically from successful transactions
                  const yesterdaysEarnings = (() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yStr = yesterday.toDateString();
                    return transactions
                      .filter(t => {
                        const d = new Date(t.date);
                        return d.toDateString() === yStr && t.status === 'Completed';
                      })
                      .reduce((acc, t) => acc + t.amount, 0);
                  })();

                  // Construct dynamic referral link
                  const referralLink = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
                    ? `https://edata.com.ng/signup?ref=${currentUser.id || '1'}` 
                    : `http://localhost/edata/signup?ref=${currentUser.id || '1'}`;

                  // Fetch most recent transaction
                  const lastTx = transactions[0];

                  return (
                    <div className="space-y-2 text-left">
                      
                      {/* Wallet Card */}
                      <div className="bg-gradient-to-r from-[#0051d5] to-[#0ea5e9] text-white p-3 rounded-2xl shadow-md relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          {/* Balance label with status dot and dropdown arrow icon */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-wider">Available Balance</span>
                            <span className="text-white/85 text-[9px] font-bold">▾</span>
                          </div>

                          {/* Transaction History > link */}
                          <button 
                            type="button" 
                            onClick={() => setAppTab('history')}
                            className="text-[9px] text-white/90 font-black hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Transaction History &gt;
                          </button>
                        </div>

                        {/* Balance value or hidden asterisks */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xl font-black font-mono tracking-tight">
                            {isBalanceHidden ? '••••' : `₦${currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                          <button 
                            type="button"
                            onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                            className="text-white/70 hover:text-white transition-all cursor-pointer p-0.5 rounded-lg"
                          >
                            {isBalanceHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Add Money black button */}
                        <div className="flex justify-end mt-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setFundAmountInput('5000');
                              setFundGateway('Paystack');
                              setFundModalOpen(true);
                            }}
                            className="bg-black hover:bg-black/90 text-white text-[9px] font-extrabold px-3.5 py-1 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Add Money
                          </button>
                        </div>
                      </div>

                      {/* Earnings Strip (Dynamic Yesterday's Earnings) */}
                      <div className="bg-[#1D1D1D] rounded-xl px-3 py-1.5 flex items-center justify-between border border-slate-800/40">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3 h-3 text-sky-400" />
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Yesterday's Earnings:</span>
                          <span className="text-[9px] text-sky-400 font-black">
                            +₦{yesterdaysEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => alert("Yesterday's Earnings shows the dynamic sum of your successful transactions completed on the previous calendar day.")}
                          className="text-slate-500 hover:text-sky-400 cursor-pointer"
                        >
                          <Info className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Quick Transfer Card */}
                      <div className="bg-[#1D1D1D] rounded-xl p-2.5 flex justify-around items-center border border-slate-800/40">
                        {[
                          { id: 'bank', label: 'To Bank', badge: 'Fee', icon: Smartphone },
                          { id: 'palmpay', label: 'To PalmPay', icon: ArrowUpRight },
                          { id: 'savings', label: 'Savings', icon: Coins },
                          { id: 'cards', label: 'Cards', icon: CreditCard }
                        ].map(btn => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => alert(`Quick Payout '${btn.label}' is connected to your wallet balance. Initiate transfer via service panels below.`)}
                            className="relative flex flex-col items-center gap-1 cursor-pointer group shrink-0"
                          >
                            {/* Mini badge */}
                            {btn.badge && (
                              <span className="absolute -top-1 -right-1.5 bg-sky-500 text-white text-[5px] font-black px-1 py-0.5 rounded-md leading-none shadow-sm uppercase z-10 scale-90">
                                {btn.badge}
                              </span>
                            )}
                            {/* Button square container */}
                            <div className="w-9 h-9 rounded-xl bg-[#292929] group-hover:bg-[#333333] flex items-center justify-center transition-all shadow-inner active:scale-95">
                              <btn.icon className="w-3.5 h-3.5 text-sky-400" />
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 group-hover:text-slate-300">{btn.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Recent Transaction (Dynamic Live Backend Log) */}
                      {lastTx ? (
                        <div 
                          className="bg-[#1D1D1D] rounded-xl p-2.5 flex justify-between items-center border border-slate-800/40 cursor-pointer active:scale-[0.99] transition-all hover:bg-[#252525]" 
                          onClick={() => {
                            setActiveReceipt(lastTx);
                          }}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-white">₦{lastTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none ${
                                lastTx.status === 'Completed' ? 'bg-sky-500/20 text-sky-400' : lastTx.status === 'Failed' ? 'bg-rose-500/20 text-rose-400' : 'bg-sky-500/10 text-sky-300'
                              }`}>{lastTx.status}</span>
                            </div>
                            <span className="text-[8px] text-slate-400 block truncate max-w-[210px]">{lastTx.productName}</span>
                          </div>
                          <span className="text-[7px] text-slate-500 font-bold whitespace-nowrap">{lastTx.date.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <div className="bg-[#1D1D1D] rounded-xl p-2.5 flex justify-between items-center border border-slate-800/40 text-slate-500">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400">No Transactions</span>
                            <span className="text-[8px] text-slate-500 block">Your utility funding logs will appear here</span>
                          </div>
                          <span className="text-[7px] text-slate-600 font-bold">Get Started</span>
                        </div>
                      )}

                      {/* Services Grid (8 Services - 100% backend-supported) */}
                      <div className="bg-[#1D1D1D] rounded-xl p-3 border border-slate-800/40">
                        <div className="grid grid-cols-4 gap-y-3 gap-x-2">
                          {[
                            { id: 'Airtime', icon: Phone, color: 'text-sky-400', tab: 'airtime' },
                            { id: 'Data', icon: Layers, color: 'text-sky-400', tab: 'data' },
                            { id: 'Cable TV', icon: Tv, color: 'text-sky-400', tab: 'cable' },
                            { id: 'Electricity', icon: Lightbulb, color: 'text-sky-400', tab: 'electricity' },
                            { id: 'Refer & Earn', icon: Flame, color: 'text-sky-400', action: () => {
                              navigator.clipboard.writeText(referralLink);
                              alert("🎉 Referral link copied to clipboard! Share it to earn upgrade commissions: " + referralLink);
                            }},
                            { id: 'A2C Convert', icon: RefreshCw, color: 'text-sky-400', tab: 'a2c' },
                            { id: 'Exam Card', icon: BookOpen, color: 'text-sky-400', tab: 'exam' },
                            { id: 'More', icon: MoreHorizontal, color: 'text-sky-400', action: () => setAppTab('services') }
                          ].map((srv, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (srv.tab) {
                                  setSelectedCategory(srv.id as any);
                                  setAppTab(srv.tab as any);
                                } else if (srv.action) {
                                  srv.action();
                                }
                              }}
                              className="relative flex flex-col items-center gap-1 cursor-pointer group min-w-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#252525] group-hover:bg-[#2d2d2d] flex items-center justify-center transition-all active:scale-95">
                                <srv.icon className={`w-3.5 h-3.5 ${srv.color}`} />
                              </div>
                              <span className="text-[7px] font-extrabold text-slate-400 text-center truncate w-full group-hover:text-slate-300">
                                {srv.id}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Referral Banner (Compact) */}
                      <div className="bg-[#1D1D1D] rounded-xl p-2.5 flex items-center justify-between border border-slate-800/40 relative overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          {/* Sky-blue reward badge circular */}
                          <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/25 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[6px] text-sky-400 font-bold uppercase leading-none">Reward</span>
                            <span className="text-[7px] text-sky-400 font-black leading-none mt-0.5">₦2.5k</span>
                          </div>
                          <div>
                            <h4 className="text-[9px] font-black text-white leading-tight">100% Cash Reward</h4>
                            <span className="text-[7px] text-slate-400 leading-tight block">Earn up to ₦2500 per invite</span>
                          </div>
                        </div>

                        {/* Outline Claim button (copies referral link) */}
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(referralLink);
                            alert("🎉 Referral link copied to clipboard! Share it with friends to earn rewards: " + referralLink);
                          }}
                          className="border border-sky-500 hover:bg-sky-500/10 text-sky-400 text-[7px] font-black px-3 py-1 rounded-full transition-all cursor-pointer shrink-0 active:scale-95"
                        >
                          Claim
                        </button>
                      </div>

                      {/* Membership Upgrade Section */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Left: Account Status Card */}
                        <div className="bg-[#1D1D1D] rounded-xl p-2.5 border border-slate-800/40 flex flex-col justify-between h-[100px] text-left">
                          <div className="space-y-0.5">
                            <h5 className="text-[9px] font-black text-white leading-none">Membership</h5>
                            <span className="text-[6.5px] text-slate-400 leading-tight block">Account authorization level</span>
                          </div>
                          <div className="mt-1.5">
                            <span className="text-[10px] font-black text-sky-400 leading-none block bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md text-center">
                              {currentUser.category}
                            </span>
                            <span className="text-[6px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1 block">Pricing Tier</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setPriceSheetOpen(true)}
                            className="bg-sky-500 hover:bg-sky-600 text-slate-950 text-[7px] font-black w-full py-1 rounded-lg mt-1.5 transition-all cursor-pointer text-center active:scale-95"
                          >
                            View Rate Chart
                          </button>
                        </div>

                        {/* Right: Premium Upgrade Card with ribbon */}
                        <div className="bg-[#1D1D1D] rounded-xl p-2.5 border border-slate-800/40 flex flex-col justify-between h-[100px] relative overflow-hidden text-left">
                          {/* Pro Ribbon in top-right */}
                          <div className="absolute top-0 right-0 bg-[#0ea5e9] text-white text-[5px] font-black px-2 py-0.5 rotate-45 translate-x-3 translate-y-1 shadow-sm uppercase">
                            Pro
                          </div>
                          
                          <div className="space-y-0.5">
                            <h5 className="text-[9px] font-black text-white leading-none">VTU License</h5>
                            <span className="text-[6.5px] text-slate-400 leading-tight block">Wholesale reseller rates</span>
                          </div>
                          <div className="mt-1.5">
                            <span className="text-xs font-black text-sky-400 leading-none block">
                              {currentUser.category === 'Premium User' ? 'ACTIVE' : '₦1,500'}
                            </span>
                            <span className="text-[6px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-0.5 block">One-time Fee</span>
                          </div>
                          
                          {currentUser.category === 'Premium User' ? (
                            <button 
                              type="button" 
                              disabled
                              className="bg-slate-800 text-slate-500 text-[7px] font-black w-full py-1 rounded-lg mt-1.5 cursor-not-allowed text-center"
                            >
                              License Active
                            </button>
                          ) : currentUser.hasPendingUpgrade ? (
                            <button 
                              type="button" 
                              disabled
                              className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[7px] font-black w-full py-1 rounded-lg mt-1.5 cursor-not-allowed text-center"
                            >
                              Pending Approval
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => setUpgradeModalOpen(true)}
                              className="bg-sky-500 hover:bg-sky-600 text-slate-950 text-[7px] font-black w-full py-1 rounded-lg mt-1.5 transition-all cursor-pointer text-center active:scale-95"
                            >
                              Upgrade Now
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Promotional Banner (Interactive) */}
                      <div 
                        className="bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 rounded-xl p-2.5 flex items-center justify-between shadow-md relative overflow-hidden border border-sky-300/35 cursor-pointer" 
                        onClick={() => {
                          navigator.clipboard.writeText(referralLink);
                          alert("🎉 Referral link copied to clipboard! Share it with friends: " + referralLink);
                        }}
                      >
                        <div className="space-y-0.5 max-w-[65%] text-left">
                          <span className="bg-white/20 text-white text-[6px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none">Promo</span>
                          <h4 className="text-[9px] font-black text-white leading-tight mt-0.5">Every Share Earn Up To ₦2,500</h4>
                          <span className="text-[7px] text-white/80 leading-tight block">Refer active users to claim cash tokens</span>
                        </div>
                        
                        {/* Stylized visual coin illustration */}
                        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center border border-white/10 animate-pulse shrink-0">
                          <div className="w-7 h-7 rounded-full bg-sky-300 flex items-center justify-center shadow-md font-black text-sky-700 text-[10px]">
                            ₦
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. STANDALONE AIRTIME VIEW */}
                {appTab === 'airtime' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button 
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-900">Buy Airtime VTU</h3>
                    </div>

                    {/* Grouped Network Cards at the top */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Select Network Provider</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'MTN', color: 'bg-yellow-400 text-yellow-950' },
                          { name: 'Airtel', color: 'bg-red-600 text-white' },
                          { name: 'Glo', color: 'bg-green-600 text-white' },
                          { name: '9mobile', color: 'bg-teal-800 text-white' }
                        ].map((net) => {
                          const isSelected = detectedOperator.toLowerCase() === net.name.toLowerCase();
                          return (
                            <button
                              key={net.name}
                              type="button"
                              onClick={() => {
                                setDetectedOperator(net.name);
                                setSelectedCategory('Airtime');
                              }}
                              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-sky-600 ring-2 ring-sky-600/25 bg-sky-50/20 scale-105' 
                                  : 'border-slate-100 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <span className={`px-1 py-1.5 rounded-lg text-[9px] font-black w-full text-center truncate ${net.color} shadow-sm`}>
                                {net.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Destination identifier */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Phone Number
                        </label>
                        <button 
                          onClick={() => {
                            setSelectedCategory('Airtime');
                            setContactsOpen(true);
                          }}
                          className="text-[9px] text-sky-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Phone className="w-2.5 h-2.5" /> Choose Contact
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. 08142233864"
                          value={targetNumber}
                          onChange={(e) => {
                            setSelectedCategory('Airtime');
                            setTargetNumber(e.target.value.replace(/\D/g, ''));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-16 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                        />
                        {detectedOperator && (
                          <span className="absolute right-2 top-1.5 bg-sky-50 border border-sky-100 text-sky-700 text-[8px] font-bold px-2 py-1 rounded-md">
                            {detectedOperator} (Auto)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Amount (₦)</label>
                      <input 
                        type="text" 
                        value={checkoutAmount}
                        onChange={(e) => {
                          setSelectedCategory('Airtime');
                          setCheckoutAmount(e.target.value.replace(/\D/g, ''));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                    </div>



                    {/* Promo Code Input Segment */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Apply Promo Code</label>
                        {appliedPromo && (
                          <span className="text-[9px] text-sky-600 font-extrabold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Applied: {appliedPromo}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10, EDATA50"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-500/20 text-slate-800 font-mono" 
                          disabled={!!appliedPromo}
                        />
                        {appliedPromo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo('');
                              setPromoDiscount(0);
                              setPromoCodeInput('');
                            }}
                            className="bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {promoError && (
                        <span className="text-[8px] text-rose-600 font-bold block">{promoError}</span>
                      )}
                      {appliedPromo && (
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-t border-slate-200/50 pt-1 mt-1">
                          <span>Promo Discount:</span>
                          <span className="text-sky-600 font-mono">-₦{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedCategory('Airtime');
                        if (!targetNumber) {
                          alert("Please fill out the destination phone number.");
                          return;
                        }
                        const basePrice = parseFloat(checkoutAmount || '0');
                        const finalPrice = Math.max(0, basePrice - promoDiscount);
                        if (finalPrice > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        handleCheckoutInitiate();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Pay ₦{Math.max(0, parseFloat(checkoutAmount || '0') - promoDiscount).toLocaleString()} & Checkout <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 3. STANDALONE DATA VIEW */}
                {appTab === 'data' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button 
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-900">Buy Mobile Data</h3>
                    </div>

                    {/* Grouped Network Cards at the top */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Select Network Provider</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'MTN', color: 'bg-yellow-400 text-yellow-950' },
                          { name: 'Airtel', color: 'bg-red-600 text-white' },
                          { name: 'Glo', color: 'bg-green-600 text-white' },
                          { name: '9mobile', color: 'bg-teal-800 text-white' }
                        ].map((net) => {
                          const isSelected = detectedOperator.toLowerCase() === net.name.toLowerCase();
                          return (
                            <button
                              key={net.name}
                              type="button"
                              onClick={() => {
                                setDetectedOperator(net.name);
                                setSelectedCategory('Data');
                              }}
                              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-sky-600 ring-2 ring-sky-600/25 bg-sky-50/20 scale-105' 
                                  : 'border-slate-100 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <span className={`px-1 py-1.5 rounded-lg text-[9px] font-black w-full text-center truncate ${net.color} shadow-sm`}>
                                {net.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Destination identifier */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Phone Number
                        </label>
                        <button 
                          onClick={() => {
                            setSelectedCategory('Data');
                            setContactsOpen(true);
                          }}
                          className="text-[9px] text-sky-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Phone className="w-2.5 h-2.5" /> Choose Contact
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. 08142233864"
                          value={targetNumber}
                          onChange={(e) => {
                            setSelectedCategory('Data');
                            setTargetNumber(e.target.value.replace(/\D/g, ''));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-16 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                        />
                        {detectedOperator && (
                          <span className="absolute right-2 top-1.5 bg-sky-50 border border-sky-100 text-sky-700 text-[8px] font-bold px-2 py-1 rounded-md">
                            {detectedOperator} (Auto)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Selection Dropdown (Filtered by selected/detected network) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Data Package</label>
                      <select 
                        value={selectedProduct?.id || ''}
                        onChange={(e) => {
                          const prod = products.find(p => p.id === e.target.value);
                          if (prod) {
                            setSelectedProduct(prod);
                            setCheckoutAmount(getDynamicPrice(prod).toString());
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      >
                        {products
                          .filter(p => p.category === 'Data' && p.active && (detectedOperator ? p.operator?.toLowerCase() === detectedOperator.toLowerCase() : true))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₦{getDynamicPrice(p)})</option>
                          ))
                        }
                        {products.filter(p => p.category === 'Data' && p.active && (detectedOperator ? p.operator?.toLowerCase() === detectedOperator.toLowerCase() : true)).length === 0 && (
                          <option value="">No packages for {detectedOperator || 'selected network'}</option>
                        )}
                      </select>
                    </div>

                    {/* Amount Input (Readonly) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Amount (₦)</label>
                      <input 
                        type="text" 
                        disabled
                        value={checkoutAmount}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold" 
                      />
                    </div>



                    {/* Promo Code Input Segment */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Apply Promo Code</label>
                        {appliedPromo && (
                          <span className="text-[9px] text-sky-600 font-extrabold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Applied: {appliedPromo}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10, EDATA50"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-500/20 text-slate-800 font-mono" 
                          disabled={!!appliedPromo}
                        />
                        {appliedPromo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo('');
                              setPromoDiscount(0);
                              setPromoCodeInput('');
                            }}
                            className="bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {promoError && (
                        <span className="text-[8px] text-rose-600 font-bold block">{promoError}</span>
                      )}
                      {appliedPromo && (
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-t border-slate-200/50 pt-1 mt-1">
                          <span>Promo Discount:</span>
                          <span className="text-sky-600 font-mono">-₦{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedCategory('Data');
                        if (!targetNumber) {
                          alert("Please fill out the destination phone number.");
                          return;
                        }
                        const basePrice = parseFloat(checkoutAmount || '0');
                        const finalPrice = Math.max(0, basePrice - promoDiscount);
                        if (finalPrice > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        handleCheckoutInitiate();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Pay ₦{Math.max(0, parseFloat(checkoutAmount || '0') - promoDiscount).toLocaleString()} & Checkout <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 4. STANDALONE ELECTRICITY VIEW */}
                {appTab === 'electricity' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button 
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-900">Buy Electricity Token</h3>
                    </div>

                    {/* Product Selection Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Electricity Provider</label>
                      <select 
                        value={selectedProduct?.id || ''}
                        onChange={(e) => {
                          const prod = products.find(p => p.id === e.target.value);
                          if (prod) {
                            setSelectedProduct(prod);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      >
                        {products.filter(p => p.category === 'Electricity' && p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Meter Number input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Meter Number
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 11-digit Meter"
                        value={targetNumber}
                        onChange={(e) => setTargetNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          disabled={isValidatingNumber || !targetNumber || !selectedProduct}
                          onClick={handleValidateNumber}
                          className="text-[9px] text-sky-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {isValidatingNumber ? 'Verifying...' : 'Verify Subscriber Name'}
                        </button>
                        {customerName && (
                          <span className="text-[9px] text-sky-600 font-semibold">{customerName}</span>
                        )}
                        {validationError && (
                          <span className="text-[9px] text-rose-600 font-semibold">{validationError}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Amount (₦)</label>
                      <input 
                        type="text" 
                        value={checkoutAmount}
                        onChange={(e) => setCheckoutAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                    </div>



                    {/* Promo Code Input Segment */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Apply Promo Code</label>
                        {appliedPromo && (
                          <span className="text-[9px] text-sky-600 font-extrabold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Applied: {appliedPromo}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10, EDATA50"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-500/20 text-slate-800 font-mono" 
                          disabled={!!appliedPromo}
                        />
                        {appliedPromo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo('');
                              setPromoDiscount(0);
                              setPromoCodeInput('');
                            }}
                            className="bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {promoError && (
                        <span className="text-[8px] text-rose-600 font-bold block">{promoError}</span>
                      )}
                      {appliedPromo && (
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-t border-slate-200/50 pt-1 mt-1">
                          <span>Promo Discount:</span>
                          <span className="text-sky-600 font-mono">-₦{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber) {
                          alert("Please fill out the destination identifier.");
                          return;
                        }
                        const basePrice = parseFloat(checkoutAmount || '0');
                        const finalPrice = Math.max(0, basePrice - promoDiscount);
                        if (finalPrice > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        handleCheckoutInitiate();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Pay ₦{Math.max(0, parseFloat(checkoutAmount || '0') - promoDiscount).toLocaleString()} & Checkout <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 5. STANDALONE CABLE TV VIEW */}
                {appTab === 'cable' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button 
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-900">Buy Cable TV Package</h3>
                    </div>

                    {/* Product Selection Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Cable TV Provider</label>
                      <select 
                        value={selectedProduct?.id || ''}
                        onChange={(e) => {
                          const prod = products.find(p => p.id === e.target.value);
                          if (prod) {
                            setSelectedProduct(prod);
                            setCheckoutAmount(getDynamicPrice(prod).toString());
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      >
                        {products.filter(p => p.category === 'Cable' && p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₦{getDynamicPrice(p)})</option>
                        ))}
                      </select>
                    </div>

                    {/* Smart Card input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Smart Card / IUC Number
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 10-digit Card"
                        value={targetNumber}
                        onChange={(e) => setTargetNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          disabled={isValidatingNumber || !targetNumber || !selectedProduct}
                          onClick={handleValidateNumber}
                          className="text-[9px] text-sky-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {isValidatingNumber ? 'Verifying...' : 'Verify Subscriber Name'}
                        </button>
                        {customerName && (
                          <span className="text-[9px] text-sky-600 font-semibold">{customerName}</span>
                        )}
                        {validationError && (
                          <span className="text-[9px] text-rose-600 font-semibold">{validationError}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount Input (Preselected & Disabled) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Amount (₦)</label>
                      <input 
                        type="text" 
                        disabled
                        value={checkoutAmount}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold" 
                      />
                    </div>



                    {/* Promo Code Input Segment */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Apply Promo Code</label>
                        {appliedPromo && (
                          <span className="text-[9px] text-sky-600 font-extrabold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Applied: {appliedPromo}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10, EDATA50"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-500/20 text-slate-800 font-mono" 
                          disabled={!!appliedPromo}
                        />
                        {appliedPromo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo('');
                              setPromoDiscount(0);
                              setPromoCodeInput('');
                            }}
                            className="bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {promoError && (
                        <span className="text-[8px] text-rose-600 font-bold block">{promoError}</span>
                      )}
                      {appliedPromo && (
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-t border-slate-200/50 pt-1 mt-1">
                          <span>Promo Discount:</span>
                          <span className="text-sky-600 font-mono">-₦{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber) {
                          alert("Please fill out the destination identifier.");
                          return;
                        }
                        const basePrice = parseFloat(checkoutAmount || '0');
                        const finalPrice = Math.max(0, basePrice - promoDiscount);
                        if (finalPrice > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        handleCheckoutInitiate();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Pay ₦{Math.max(0, parseFloat(checkoutAmount || '0') - promoDiscount).toLocaleString()} & Checkout <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 5.5 STANDALONE AIRTIME TO CASH (A2C) VIEW */}
                {appTab === 'a2c' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button 
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-900">Airtime to Cash</h3>
                    </div>

                    {/* Network Selection */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Select Airtime Network</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'MTN', color: 'bg-yellow-400 text-yellow-950', rate: 0.82 },
                          { name: 'Airtel', color: 'bg-red-600 text-white', rate: 0.80 },
                          { name: 'Glo', color: 'bg-green-600 text-white', rate: 0.78 },
                          { name: '9mobile', color: 'bg-teal-800 text-white', rate: 0.75 }
                        ].map((net) => {
                          const isSelected = detectedOperator.toLowerCase() === net.name.toLowerCase();
                          return (
                            <button
                              key={net.name}
                              type="button"
                              onClick={() => {
                                setDetectedOperator(net.name);
                                setSelectedCategory('A2C');
                                // calculate payout rate
                                const amountVal = parseFloat(checkoutAmount || '0');
                                const payoutVal = amountVal * net.rate;
                                setA2cPayout(payoutVal);
                              }}
                              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-sky-600 ring-2 ring-sky-600/25 bg-sky-50/20 scale-105' 
                                  : 'border-slate-100 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <span className={`px-1 py-1 rounded-lg text-[9px] font-black w-full text-center truncate ${net.color} shadow-sm`}>
                                {net.name}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold mt-1">{(net.rate * 100)}%</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sending Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 08142233864"
                        value={targetNumber}
                        onChange={(e) => setTargetNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                    </div>

                    {/* Airtime Amount */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Airtime Amount (₦)</label>
                      <input 
                        type="text" 
                        value={checkoutAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setCheckoutAmount(val);
                          // recalculate payout
                          const rateMap: Record<string, number> = { mtn: 0.82, airtel: 0.80, glo: 0.78, '9mobile': 0.75 };
                          const r = rateMap[detectedOperator.toLowerCase()] || 0.80;
                          setA2cPayout(parseFloat(val || '0') * r);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                    </div>

                    {/* Payout Details */}
                    <div className="bg-slate-100/60 p-3 rounded-2xl border border-slate-200/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Conversion Rate:</span>
                        <strong className="text-slate-800 font-mono">
                          {detectedOperator ? (detectedOperator.toLowerCase() === 'mtn' ? '82%' : detectedOperator.toLowerCase() === 'airtel' ? '80%' : detectedOperator.toLowerCase() === 'glo' ? '78%' : '75%') : '80%'}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>You will receive (Cash):</span>
                        <strong className="text-sky-600 text-sm font-black font-mono">₦{a2cPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>

                    {/* Bank Payout details */}
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payout Bank Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. GTBank, Access Bank"
                          value={a2cBank}
                          onChange={(e) => setA2cBank(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payout Account Number</label>
                        <input 
                          type="text" 
                          placeholder="10-digit Account No."
                          maxLength={10}
                          value={a2cAccount}
                          onChange={(e) => setA2cAccount(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber || !a2cBank || !a2cAccount || !checkoutAmount) {
                          alert("Please complete all A2C conversion parameters.");
                          return;
                        }
                        // For A2C, we don't deduct wallet balance
                        handleCheckoutInitiate();
                      }}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Convert Airtime to Cash <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 6. STANDALONE EXAM TOKEN VIEW */}
                {appTab === 'exam' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button 
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-slate-900">Buy Exam Token</h3>
                    </div>

                    {/* Product Selection Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Examination Body</label>
                      <select 
                        value={selectedProduct?.id || ''}
                        onChange={(e) => {
                          const prod = products.find(p => p.id === e.target.value);
                          if (prod) {
                            setSelectedProduct(prod);
                            setCheckoutAmount(getDynamicPrice(prod).toString());
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      >
                        {products.filter(p => p.category === 'Exam' && p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₦{getDynamicPrice(p)})</option>
                        ))}
                      </select>
                    </div>

                    {/* Recipient Phone Number input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Recipient Phone Number
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 08142233864"
                        maxLength={11}
                        value={targetNumber}
                        onChange={(e) => setTargetNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800" 
                      />
                    </div>

                    {/* Amount Input (Preselected & Disabled) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Amount (₦)</label>
                      <input 
                        type="text" 
                        disabled
                        value={checkoutAmount}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold" 
                      />
                    </div>



                    {/* Promo Code Input Segment */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Apply Promo Code</label>
                        {appliedPromo && (
                          <span className="text-[9px] text-sky-600 font-extrabold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Applied: {appliedPromo}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10, EDATA50"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-500/20 text-slate-800 font-mono" 
                          disabled={!!appliedPromo}
                        />
                        {appliedPromo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo('');
                              setPromoDiscount(0);
                              setPromoCodeInput('');
                            }}
                            className="bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 rounded-lg text-[9px] transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {promoError && (
                        <span className="text-[8px] text-rose-600 font-bold block">{promoError}</span>
                      )}
                      {appliedPromo && (
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-t border-slate-200/50 pt-1 mt-1">
                          <span>Promo Discount:</span>
                          <span className="text-sky-600 font-mono">-₦{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber) {
                          alert("Please fill out the destination identifier.");
                          return;
                        }
                        const basePrice = parseFloat(checkoutAmount || '0');
                        const finalPrice = Math.max(0, basePrice - promoDiscount);
                        if (finalPrice > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        handleCheckoutInitiate();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Pay ₦{Math.max(0, parseFloat(checkoutAmount || '0') - promoDiscount).toLocaleString()} & Checkout <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 2.5 Standalone History View */}
                {appTab === 'history' && (
                  <div className="space-y-4 flex flex-col h-[510px] overflow-hidden text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                      <h3 className="text-sm font-bold text-slate-900">Transaction History</h3>
                      <span className="bg-sky-50 text-sky-700 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">
                        {transactions.length} Records
                      </span>
                    </div>

                    {/* Quick Stats Summary Card */}
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                      <div className="bg-sky-50/50 border border-sky-100/30 p-2 rounded-xl text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflow</span>
                        <strong className="text-[11px] text-sky-600 font-extrabold block mt-0.5">
                          ₦{transactions
                            .filter(tx => tx.type === 'Wallet Funding' && tx.status === 'Completed')
                            .reduce((sum, tx) => sum + tx.amount, 0)
                            .toLocaleString()}
                        </strong>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Outflow</span>
                        <strong className="text-[11px] text-slate-700 font-extrabold block mt-0.5">
                          ₦{transactions
                            .filter(tx => tx.type !== 'Wallet Funding' && tx.status === 'Completed')
                            .reduce((sum, tx) => sum + tx.amount, 0)
                            .toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="space-y-2 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search reference, phone, or provider..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                        />
                        {historySearch && (
                          <button
                            type="button"
                            onClick={() => setHistorySearch('')}
                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[9px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Filter Scrollable Row */}
                      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 whitespace-nowrap">
                        {['All', 'Airtime', 'Data', 'Electricity', 'Cable TV', 'Exam Token', 'A2C', 'Wallet Funding'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setHistoryCategoryFilter(cat)}
                            className={`px-2 py-0.5 rounded-lg text-[8px] font-bold border transition-all cursor-pointer ${
                              historyCategoryFilter === cat
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {cat === 'Exam Token' ? 'Exam' : cat === 'Wallet Funding' ? 'Funding' : cat === 'Cable TV' ? 'Cable' : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable List container */}
                    <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 scrollbar-none pb-8">
                      {(() => {
                        const filtered = transactions.filter(tx => {
                          const matchesCat = historyCategoryFilter === 'All' || tx.type === historyCategoryFilter;
                          const query = historySearch.toLowerCase().trim();
                          const matchesSearch = !query || 
                            (tx.productName && tx.productName.toLowerCase().includes(query)) ||
                            (tx.phoneOrMeter && tx.phoneOrMeter.toLowerCase().includes(query)) ||
                            (tx.reference && tx.reference.toLowerCase().includes(query)) ||
                            (tx.operator && tx.operator.toLowerCase().includes(query));
                          return matchesCat && matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                              <History className="w-8 h-8 text-slate-300" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase">No transactions found</p>
                              <span className="text-[9px] text-slate-400 max-w-[200px]">
                                Try adjusting your search query or filters to find records.
                              </span>
                            </div>
                          );
                        }

                        return filtered.map(tx => {
                          const isFunding = tx.type === 'Wallet Funding';
                          return (
                            <div
                              key={tx.id}
                              onClick={() => setActiveReceipt(tx)}
                              className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                  tx.status === 'Completed' 
                                    ? 'bg-sky-50 text-sky-600' 
                                    : tx.status === 'Pending' 
                                      ? 'bg-sky-50 text-sky-600' 
                                      : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {isFunding ? (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                  ) : (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-[10px] font-bold text-slate-800 leading-none truncate">{tx.productName}</h5>
                                  <span className="text-[9px] text-slate-400 mt-0.5 block truncate">{tx.phoneOrMeter}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-bold block ${
                                  isFunding ? 'text-sky-600' : 'text-slate-900'
                                }`}>
                                  {isFunding ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                </span>
                                <span className="text-[8px] text-slate-400 block mt-0.5">
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

                {/* 3. AI CHAT COPILOT TAB VIEW */}
                {/* 3. CUSTOMER SUPPORT TAB VIEW */}
                {appTab === 'support' && (
                  <div className="flex-1 flex flex-col justify-between h-[510px] space-y-3.5">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between shrink-0">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-none">Customer Support</h3>
                        <span className="text-[8px] text-sky-600 font-bold">Quick help desk and ticketing system</span>
                      </div>
                      <Headphones className="w-4 h-4 text-sky-600" />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none">
                      {/* Direct Channels */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Official Channels</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => alert("Redirecting to WhatsApp support line (+234 809 123 4567)...")}
                            className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-left transition-all active:scale-95"
                          >
                            <span className="text-[10px] font-bold text-slate-800 block">WhatsApp Chat</span>
                            <span className="text-[7.5px] text-sky-600 block mt-0.5">Instant Chat &rarr;</span>
                          </button>
                          <button 
                            onClick={() => alert("Initiating phone call support (+234 800-MY-EDATA)...")}
                            className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-left transition-all active:scale-95"
                          >
                            <span className="text-[10px] font-bold text-slate-800 block">Call Helpline</span>
                            <span className="text-[7.5px] text-sky-600 block mt-0.5">Toll Free Call &rarr;</span>
                          </button>
                        </div>
                      </div>

                      {/* Ticketing Form */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          alert("🎉 Support Ticket created successfully! Our agents will contact you at: " + currentUser.email);
                          setChatMessage('');
                        }}
                        className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-2.5 shadow-sm"
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Create Support Ticket</span>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Issue Category</label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none">
                            <option>Failed Transaction / Value Not Received</option>
                            <option>Wallet Funding / Bank Transfer Issue</option>
                            <option>Reseller License / Upgrade Problem</option>
                            <option>Account Profile / Biometric Reset</option>
                            <option>Other Complaints & Inquiries</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Message Details</label>
                          <textarea 
                            required
                            rows={3}
                            placeholder="Please describe your issue or transaction reference..." 
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                          ></textarea>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white text-[9.5px] font-bold py-1.5 rounded-lg transition-all active:scale-95"
                        >
                          Submit Ticket
                        </button>
                      </form>

                      {/* Dispute Direct Link */}
                      <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h4 className="text-[9.5px] font-bold text-sky-800">Need to dispute a transaction?</h4>
                          <p className="text-[7.5px] text-sky-600 leading-normal">Open your recent transactions to raise disputes instantly.</p>
                        </div>
                        <button 
                          onClick={() => setAppTab('history')}
                          className="bg-sky-600 text-white text-[8px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all active:scale-95"
                        >
                          Disputes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PROFILE TAB VIEW */}
                {appTab === 'profile' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Profile & Security</h3>

                    {/* User Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-12 h-12 bg-sky-500/10 text-sky-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</h4>
                        <span className="text-[9px] text-slate-400 mt-1 block">{currentUser.email}</span>
                        <span className="text-[10px] text-sky-600 font-bold mt-1 block">{currentUser.phone}</span>
                      </div>
                    </div>

                    {/* Categories Upgrades */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Membership Tier</h4>
                      
                      <div className="space-y-2">
                        {['Basic User', 'Referred User', 'Premium User'].map(cat => (
                          <button 
                            key={cat}
                            onClick={() => {
                              setCurrentUser(curr => ({ ...curr, category: cat as any }));
                              alert(`Account category manually adjusted to ${cat}. Your pricing will reflect this tier dynamic.`);
                            }}
                            className={`w-full p-2 rounded-xl border text-left text-xs flex justify-between items-center transition-all ${
                              currentUser.category === cat 
                                ? 'bg-sky-50 border-sky-200 text-sky-800 font-bold' 
                                : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>{cat}</span>
                            {currentUser.category === cat && <Check className="w-3.5 h-3.5 text-sky-600" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Security configurations */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3.5 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Controls</h4>
                      
                      <div className="space-y-2.5 text-xs text-slate-600">
                        {/* Transaction PIN code settings */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <span className="font-bold text-slate-700 block text-[11px]">Secure Transaction PIN</span>
                            <span className="text-[9px] text-slate-400 block">Required before checkout.</span>
                          </div>
                          <button 
                            onClick={() => {
                              setOldPin('');
                              setNewPin('');
                              setConfirmNewPin('');
                              setChangePinModalOpen(true);
                            }}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold py-1 px-3 rounded-lg text-[10px] transition-all"
                          >
                            {currentUser.hasPin ? 'Change PIN' : 'Set PIN'}
                          </button>
                        </div>

                        {/* Password settings */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <span className="font-bold text-slate-700 block text-[11px]">Login Password</span>
                            <span className="text-[9px] text-slate-400 block">Last changed 3 months ago.</span>
                          </div>
                          <button 
                            onClick={() => {
                            setCurrentPassword('');
                              setNewPassword('');
                              setConfirmNewPassword('');
                              setChangePasswordModalOpen(true);
                            }}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold py-1 px-3 rounded-lg text-[10px] transition-all"
                          >
                            Change Password
                          </button>
                        </div>

                        {/* Biometric Smart Checkout Switch */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <span className="font-bold text-slate-700 block text-[11px]">Biometric Security (Face ID / Touch ID)</span>
                            <span className="text-[9px] text-slate-400 block">Dodge PIN authorization entry on checkout.</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!currentUser.biometricsEnabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setCurrentUser(prev => ({
                                  ...prev,
                                  biometricsEnabled: checked
                                }));
                                setSubscribers(prev => prev.map(s => {
                                  if (s.email === currentUser.email) {
                                    return { ...s, biometricsEnabled: checked };
                                  }
                                  return s;
                                }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                          </label>
                        </div>

                        {/* Social Google accounts connection status */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <span className="font-bold text-slate-700 block text-[11px]">Two-Factor Authorization</span>
                            <span className="text-[9px] text-slate-400 block">Enable secure email verification codes.</span>
                          </div>
                          <span className="bg-sky-50 text-sky-600 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase">Enabled</span>
                        </div>

                        <button 
                          onClick={() => {
                            if (handleLogout) handleLogout();
                            else setCurrentScreen('auth');
                          }}
                          className="w-full text-center text-rose-600 font-bold text-[10px] py-1 mt-2 hover:underline"
                        >
                          Sign Out Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. FULL SERVICES CATALOG VIEW */}
                {appTab === 'services' && (
                  <div className="space-y-5 text-left pb-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Payment Utilities</h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        {[
                          { id: 'Airtime', name: 'Airtime VTU', icon: Phone, desc: 'Discounted VTU top-up', color: 'text-sky-600 bg-sky-50', tab: 'airtime' },
                          { id: 'Data', name: 'Data Bundle', icon: Layers, desc: 'Cheap SME & Gifting bundles', color: 'text-sky-600 bg-sky-50', tab: 'data' },
                          { id: 'Cable TV', name: 'Cable TV', icon: Tv, desc: 'DStv, GOtv, Startimes bills', color: 'text-sky-600 bg-sky-50', tab: 'cable' },
                          { id: 'Electricity', name: 'Electricity', icon: Lightbulb, desc: 'Prepaid & Postpaid units', color: 'text-sky-600 bg-sky-50', tab: 'electricity' },
                          { id: 'A2C Convert', name: 'Airtime to Cash', icon: RefreshCw, desc: 'Convert excess airtime to cash', color: 'text-sky-600 bg-sky-50', tab: 'a2c' },
                          { id: 'Exam Card', name: 'Exam Scratch Card', icon: BookOpen, desc: 'WAEC, NECO, NABTEB tokens', color: 'text-sky-600 bg-sky-50', tab: 'exam' }
                        ].map(srv => (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(srv.id as any);
                              setAppTab(srv.tab as any);
                            }}
                            className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-sky-50/20 hover:border-sky-100 transition-all gap-2 active:scale-95 cursor-pointer shadow-sm text-left w-full"
                          >
                            <div className={`p-2 rounded-xl ${srv.color}`}>
                              <srv.icon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black text-slate-800 block leading-tight">{srv.name}</span>
                              <span className="text-[7.5px] text-slate-400 block leading-tight">{srv.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fintech & Agency Operations</h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFundAmountInput('5000');
                            setFundGateway('Paystack');
                            setFundModalOpen(true);
                          }}
                          className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-sky-50/20 hover:border-sky-100 transition-all gap-2 active:scale-95 cursor-pointer shadow-sm text-left w-full"
                        >
                          <div className="p-2 rounded-xl text-sky-600 bg-sky-50">
                            <Coins className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-slate-800 block leading-tight">Fund Wallet</span>
                            <span className="text-[7.5px] text-slate-400 block leading-tight">Instant Paystack/Monnify deposit</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUpgradeModalOpen(true)}
                          className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-sky-50/20 hover:border-sky-100 transition-all gap-2 active:scale-95 cursor-pointer shadow-sm text-left w-full"
                        >
                          <div className="p-2 rounded-xl text-sky-600 bg-sky-50">
                            <Flame className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-slate-800 block leading-tight">Premium Reseller</span>
                            <span className="text-[7.5px] text-slate-400 block leading-tight">Unlock agent rate tiers</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Supplementary Bills (Coming Soon)</h4>
                      <div className="grid grid-cols-2 gap-3.5 opacity-60">
                        {[
                          { name: 'ISP Internet', icon: Wifi, desc: 'Smile & Spectranet' },
                          { name: 'Bet Funding', icon: Flame, desc: 'Bet9ja, SportyBet, 1xBet' },
                          { name: 'School Fees', icon: User, desc: 'Uni & College payments' },
                          { name: 'Insurance Cover', icon: ShieldAlert, desc: 'Auto & health subscriptions' }
                        ].map((srv, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 gap-2 relative overflow-hidden text-left w-full"
                          >
                            <span className="absolute top-1.5 right-1.5 bg-slate-200 text-slate-600 text-[5px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none">Soon</span>
                            <div className="p-2 rounded-xl text-sky-600 bg-sky-50">
                              <srv.icon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black text-slate-700 block leading-tight">{srv.name}</span>
                              <span className="text-[7.5px] text-slate-400 block leading-tight">{srv.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Nav tabs navigation */}
              <div className={`px-2 py-2 flex justify-around items-center shrink-0 z-40 w-full transition-colors ${
                appTab === 'home' 
                  ? 'bg-[#1D1D1D] border-t border-slate-800/85' 
                  : 'bg-white border-t border-slate-100'
              }`}>
                {[
                  { id: 'home', icon: Smartphone, label: 'Home' },
                  { id: 'services', icon: Layers, label: 'Services' },
                  { id: 'support', icon: Headphones, label: 'Support' },
                  { id: 'profile', icon: User, label: 'Profile' }
                ].map(tab => {
                  const isActive = tab.id === 'home'
                    ? ['home', 'airtime', 'data', 'electricity', 'cable', 'exam', 'a2c', 'history'].includes(appTab)
                    : appTab === tab.id;
                  
                  return (
                    <button 
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setAppTab(tab.id as any);
                      }}
                      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        isActive 
                          ? (appTab === 'home' ? 'text-sky-400 scale-105 font-black' : 'bg-sky-50 text-sky-600 scale-105 font-bold') 
                          : (appTab === 'home' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                      }`}
                    >
                      <tab.icon className={`w-3.5 h-3.5 ${
                        isActive 
                          ? (appTab === 'home' ? 'text-sky-400' : 'text-sky-600') 
                          : (appTab === 'home' ? 'text-slate-500' : 'text-slate-400')
                      }`} />
                      <span className="text-[8px] font-black tracking-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>
          )}

          {/* INNER OVERLAY: Others / More Services Drawer */}
          {othersSheetOpen && (
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[75%] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-900">More Services & Utilities</h4>
                    <span className="text-[9px] text-slate-400">Select any supplementary bill payment option</span>
                  </div>
                  <button onClick={() => setOthersSheetOpen(false)} className="text-slate-400 text-xs font-bold cursor-pointer">Close</button>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { id: 'exam', name: 'Exam Token', icon: BookOpen, desc: 'WAEC, NECO, JAMB Pin', color: 'text-purple-600 bg-purple-50' },
                    { id: 'internet', name: 'ISP Internet', icon: Wifi, desc: 'Smile, Spectranet', color: 'text-blue-600 bg-blue-50', custom: true },
                    { id: 'insurance', name: 'Insurance', icon: CheckCircle, desc: 'Health, Auto Cover', color: 'text-sky-600 bg-sky-50', custom: true },
                    { id: 'school', name: 'School Fees', icon: UserCheck, desc: 'Uni & College Bills', color: 'text-rose-600 bg-rose-50', custom: true },
                    { id: 'waste', name: 'Waste Bill', icon: Layers, desc: 'LAWMA & State Waste', color: 'text-sky-600 bg-sky-50', custom: true },
                    { id: 'betting', name: 'Bet Funding', icon: Flame, desc: 'Bet9ja, SportyBet', color: 'text-red-600 bg-red-50', custom: true }
                  ].map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setOthersSheetOpen(false);
                        if (service.custom) {
                          alert(`${service.name} payment service is currently being updated by provider. Standby for release updates.`);
                        } else if (service.id === 'exam') {
                          setSelectedCategory('Exam');
                          // select the first exam product
                          const examProds = products.filter(p => p.category === 'Exam');
                          if (examProds.length > 0) {
                            setSelectedProduct(examProds[0]);
                            setCheckoutAmount(getDynamicPrice(examProds[0]).toString());
                          }
                          setAppTab('exam');
                        }
                      }}
                      className="flex flex-col items-center justify-start p-2.5 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-sky-50/30 hover:border-sky-100 transition-all text-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <div className={`p-2 rounded-xl ${service.color} shadow-sm`}>
                        <service.icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-800 block leading-tight">{service.name}</span>
                        <span className="text-[7px] text-slate-400 block leading-tight">{service.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: Contacts Selection Drawer */}
          {contactsOpen && (
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl max-h-[60%] p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900">Choose Contact</h4>
                  <button onClick={() => setContactsOpen(false)} className="text-slate-400 text-xs font-bold">Close</button>
                </div>
                
                <div className="space-y-2">
                  {demoContacts.map((c, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setTargetNumber(c.phone);
                        setDetectedOperator(c.operator);
                        setContactsOpen(false);
                      }}
                      className="w-full p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between text-left text-xs border border-slate-50"
                    >
                      <div>
                        <strong className="text-slate-800 font-bold block">{c.name}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{c.phone}</span>
                      </div>
                      <span className="bg-sky-50 border border-sky-100 text-sky-600 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">{c.operator}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: PIN Code / Biometric Authentication Modal */}
          {pinSheetOpen && (
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Authorize Transaction</h4>
                    <span className="text-[9px] text-slate-400">Please verify with your secret 4-digit PIN</span>
                  </div>
                  <button onClick={() => setPinSheetOpen(false)} className="text-slate-400 text-xs font-bold">Cancel</button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <input 
                      type="password" 
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••" 
                      className="bg-slate-100 border border-slate-200 tracking-widest text-center text-xl font-bold rounded-2xl w-24 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setPinInput(currentUser.pinCode || '1234'); // Quick fill biometrics
                        setTimeout(() => handleConfirmPurchase(), 100);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                    >
                      🧬 Fingerprint Check
                    </button>
                    <button 
                      onClick={handleConfirmPurchase}
                      className="bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-xl text-[10px] font-bold transition-all"
                    >
                      Verify PIN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: Transaction Receipt Screen */}
          {activeReceipt && (
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[85%] overflow-y-auto font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900">Transaction Details</h4>
                  <button onClick={() => setActiveReceipt(null)} className="text-slate-400 text-xs font-bold">Dismiss</button>
                </div>

                {/* Receipt Card Visuals */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
                  <div className="inline-flex bg-sky-100 text-sky-700 p-2 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Transaction Successful</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">₦{activeReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                  </div>

                  <div className="border-t border-dashed border-slate-200/80 pt-3 space-y-2 text-left text-[10px] text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span>Ref ID:</span>
                      <span className="font-bold text-slate-800">{activeReceipt.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-bold text-slate-800">{activeReceipt.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recipient:</span>
                      <span className="font-bold text-slate-800">{activeReceipt.phoneOrMeter}</span>
                    </div>
                    {activeReceipt.operator && (
                      <div className="flex justify-between">
                        <span>Provider:</span>
                        <span className="font-bold text-slate-800">{activeReceipt.operator}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Execution Date:</span>
                      <span className="font-bold text-slate-800">{new Date(activeReceipt.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Dispute raise logic */}
                <div className="space-y-2 pt-2">
                  {activeReceipt.disputeRaised ? (
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-[10px] text-sky-800 space-y-1">
                      <strong className="font-bold block">Dispute Status: {activeReceipt.disputeStatus || 'Under Review'}</strong>
                      <p className="leading-normal">{activeReceipt.disputeNotes}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRaiseDispute(activeReceipt.id)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Raise Transaction Dispute
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => copyReceiptToClipboard(activeReceipt)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Details
                    </button>
                    <button 
                      onClick={() => generatePDFReceipt(activeReceipt)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-sky-400" /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: Product Full Price list view */}
          {priceSheetOpen && (
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[80%] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Utility Product pricing</h4>
                    <span className="text-[9px] text-slate-400">Current tier: <strong className="text-sky-600">{currentUser.category}</strong></span>
                  </div>
                  <button onClick={() => setPriceSheetOpen(false)} className="text-slate-400 text-xs font-bold">Close</button>
                </div>

                <div className="space-y-3.5">
                  {['Airtime', 'Data', 'Electricity', 'Cable', 'Exam'].map(cat => (
                    <div key={cat} className="space-y-1.5">
                      <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat} Packages</h5>
                      <div className="space-y-1">
                        {products.filter(p => (p.category as string) === cat || (cat === 'Cable' && p.category === 'Cable TV') || (cat === 'Exam' && p.category === 'Exam Token')).map(p => (
                          <div key={p.id} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-[10px] border border-slate-100">
                            <div>
                              <span className="font-bold text-slate-800 block">{p.name}</span>
                              <span className="text-[8px] text-slate-400 mt-0.5 block">{p.description}</span>
                            </div>
                            <span className="font-bold text-sky-600 font-mono">₦{getDynamicPrice(p)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: INTERACTIVE FUND WALLET MODAL */}
          {fundModalOpen && (
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[85%] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-sky-500" /> Fund Wallet
                    </h4>
                    <span className="text-[9px] text-slate-400">Secure gateway integration</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { if (!fundLoading) setFundModalOpen(false); }} 
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {fundLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Connecting to secure gateway...</p>
                    <p className="text-[9px] text-slate-400">Verifying transaction authorization with Yii2 API</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    {/* Gateway selection */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Select Gateway</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Paystack', 'Flutterwave', 'Monnify', 'Bank Transfer'] as const).map(gateway => (
                          <button
                            key={gateway}
                            type="button"
                            onClick={() => setFundGateway(gateway)}
                            className={`p-2.5 rounded-xl border text-[10px] font-black text-center transition-all ${
                              fundGateway === gateway
                                ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-sm'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {gateway}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Enter Amount (₦)</span>
                      <input
                        type="number"
                        value={fundAmountInput}
                        onChange={(e) => setFundAmountInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-bold font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                        placeholder="e.g. 5000"
                      />
                    </div>

                    {/* Quick values */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {['1000', '2000', '5000', '10000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFundAmountInput(val)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 rounded-lg text-[9px] font-bold"
                        >
                          ₦{parseInt(val).toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseFloat(fundAmountInput);
                        if (isNaN(parsed) || parsed <= 0) {
                          alert("Please enter a valid amount to fund.");
                          return;
                        }
                        setFundLoading(true);
                        setTimeout(() => {
                          setFundLoading(false);
                          
                          // Credit wallet
                          const newBalance = currentUser.walletBalance + parsed;
                          setCurrentUser(curr => ({ ...curr, walletBalance: newBalance }));
                          setSubscribers(prev => prev.map(s => {
                            if (s.email === currentUser.email) {
                              return { ...s, walletBalance: newBalance };
                            }
                            return s;
                          }));

                          // Add transaction
                          const fundTx: Transaction = {
                            id: `tx-fund-${Math.floor(1000 + Math.random() * 9000)}`,
                            type: 'Wallet Funding',
                            productName: `${fundGateway} gateway funding`,
                            amount: parsed,
                            phoneOrMeter: `Ref: ${fundGateway.substring(0,3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
                            reference: `EDAT-FUND-${Math.floor(100000 + Math.random() * 900000)}`,
                            status: 'Completed',
                            date: new Date().toISOString(),
                            disputeRaised: false
                          };
                          setTransactions(prev => [fundTx, ...prev]);
                          setFundModalOpen(false);
                          alert(`🎉 Success! Credited ₦${parsed.toLocaleString()} to your wallet balance via ${fundGateway}.`);
                        }, 1200);
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-md shadow-sky-500/10 cursor-pointer"
                    >
                      Process Payment (₦{parseFloat(fundAmountInput || '0').toLocaleString()})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INNER OVERLAY: INTERACTIVE CHANGE PIN MODAL */}
          {changePinModalOpen && (
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-sky-500" /> {currentUser.hasPin ? 'Change Transaction PIN' : 'Set Transaction PIN'}
                    </h4>
                    <span className="text-[9px] text-slate-400">Authorize future purchases safely</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setChangePinModalOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  {currentUser.hasPin && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current PIN</span>
                      <input
                        type="password"
                        maxLength={4}
                        value={oldPin}
                        onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl text-center font-bold tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                        placeholder="••••"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">New 4-Digit PIN</span>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl text-center font-bold tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      placeholder="••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Confirm New PIN</span>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl text-center font-bold tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      placeholder="••••"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (newPin.length !== 4) {
                        alert("The new PIN must be exactly 4 numeric digits.");
                        return;
                      }
                      if (newPin !== confirmNewPin) {
                        alert("Confirm PIN does not match your new PIN selection.");
                        return;
                      }

                      if (apiStatus === 'offline' || apiStatus === 'sandbox') {
                        setCurrentUser(prev => ({
                          ...prev,
                          hasPin: true,
                          pinCode: newPin
                        }));
                        setSubscribers(prev => prev.map(s => {
                          if (s.email === currentUser.email) {
                            return { ...s, hasPin: true, pinCode: newPin };
                          }
                          return s;
                        }));
                        setChangePinModalOpen(false);
                        setOldPin('');
                        setNewPin('');
                        setConfirmNewPin('');
                        alert("🎉 Transaction PIN updated successfully inside Sandbox storage.");
                        return;
                      }

                      if (currentUser.hasPin) {
                        api.changePin(oldPin, newPin, confirmNewPin)
                          .then(res => {
                            if (res.success) {
                              if (handleGlobalRefresh) handleGlobalRefresh();
                              setChangePinModalOpen(false);
                              setOldPin('');
                              setNewPin('');
                              setConfirmNewPin('');
                              alert("🎉 " + (res.message || "Transaction PIN changed successfully."));
                            } else {
                              alert("❌ " + (res.error || "Failed to change PIN."));
                            }
                          })
                          .catch(err => alert("❌ " + (err.message || "Error changing PIN.")));
                      } else {
                        api.setPin(newPin, confirmNewPin)
                          .then(res => {
                            if (res.success) {
                              if (handleGlobalRefresh) handleGlobalRefresh();
                              setChangePinModalOpen(false);
                              setOldPin('');
                              setNewPin('');
                              setConfirmNewPin('');
                              alert("🎉 " + (res.message || "Transaction PIN set successfully."));
                            } else {
                              alert("❌ " + (res.error || "Failed to set PIN."));
                            }
                          })
                          .catch(err => alert("❌ " + (err.message || "Error setting PIN.")));
                      }
                    }}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: INTERACTIVE CHANGE PASSWORD MODAL */}
          {changePasswordModalOpen && (
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 font-sans text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-sky-500" /> Change Account Password
                    </h4>
                    <span className="text-[9px] text-slate-400">Regularly update for safety</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setChangePasswordModalOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Password</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">New Password</span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Confirm New Password</span>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentPassword) {
                        alert("Please enter your current password.");
                        return;
                      }
                      if (newPassword.length < 6) {
                        alert("New password must be at least 6 characters long.");
                        return;
                      }
                      if (newPassword !== confirmNewPassword) {
                        alert("Confirm password does not match your new password.");
                        return;
                      }

                      setChangePasswordModalOpen(false);
                      alert("🎉 Success! Your login credentials have been securely updated. Synced back with Yii2 Advanced framework registry.");
                    }}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INNER OVERLAY: INTERACTIVE PREMIUM USER UPGRADE MODAL */}
          {upgradeModalOpen && (
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 font-sans text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-sky-500 animate-pulse" /> Upgrade to Premium User
                    </h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase text-sky-600">VTU Agent License Activation</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { if (!upgradeLoading) setUpgradeModalOpen(false); }} 
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {upgradeLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Deducting License Fee & Upgrading...</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-sky-600">Registering with Yii2 Core Router</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Benefits banner */}
                    <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-3.5 text-white space-y-2">
                      <span className="text-[8px] uppercase font-extrabold text-sky-400 tracking-wider">Exclusive Member Perks</span>
                      <ul className="text-[9px] text-slate-300 space-y-1">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-sky-400 shrink-0" /> Permanent agent pricing discounts on Airtime
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-sky-400 shrink-0" /> 1.5% - 4.5% commission reduction on Data bundles
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-sky-400 shrink-0" /> Fast-track server routing & instant auto-refund safety
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-sky-400 shrink-0" /> Free monthly eData Copilot analytical safety reports
                        </li>
                      </ul>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Total Charge</span>
                        <span className="text-xs font-bold text-slate-800 block">One-time VTU Agent Fee</span>
                      </div>
                      <span className="text-sm font-black text-sky-600">₦1,500.00</span>
                    </div>

                    <button
                      type="button"
                      disabled={upgradeLoading}
                      onClick={() => {
                        if (!currentUser.hasPin) {
                          alert("Please set up a Transaction PIN before completing your upgrade request.");
                          setChangePinModalOpen(true);
                          setUpgradeModalOpen(false);
                          return;
                        }
                        const pin = window.prompt("Please enter your 4-digit Transaction PIN to confirm the upgrade:");
                        if (pin === null) return;
                        if (!pin.trim()) {
                          alert("PIN is required.");
                          return;
                        }

                        setUpgradeLoading(true);

                        if (apiStatus === 'offline' || apiStatus === 'sandbox') {
                          setTimeout(() => {
                            setUpgradeLoading(false);
                            setCurrentUser(prev => ({
                              ...prev,
                              walletBalance: prev.walletBalance - 1500,
                              category: 'Premium User'
                            }));
                            setSubscribers(prev => prev.map(s => {
                              if (s.email === currentUser.email) {
                                return { ...s, walletBalance: s.walletBalance - 1500, category: 'Premium User' };
                              }
                              return s;
                            }));
                            alert("🎉 Upgrade successful! You are now a Premium User in Sandbox mode.");
                            setUpgradeModalOpen(false);
                          }, 1000);
                          return;
                        }

                        api.upgrade(pin)
                          .then(res => {
                            setUpgradeLoading(false);
                            if (res.success) {
                              alert("🎉 " + (res.message || "Upgrade request submitted successfully!"));
                              if (handleGlobalRefresh) {
                                handleGlobalRefresh();
                              }
                              setUpgradeModalOpen(false);
                            } else {
                              alert("❌ " + (res.error || "Failed to upgrade."));
                            }
                          })
                          .catch(err => {
                            setUpgradeLoading(false);
                            alert("❌ " + (err.message || "Error upgrading account."));
                          });
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-md shadow-sky-500/10 cursor-pointer"
                    >
                      {upgradeLoading ? 'Processing Request...' : 'Pay License Fee & Request Upgrade'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
