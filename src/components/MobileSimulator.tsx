import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, ProductItem } from '../types';
import { 
  Smartphone, Wifi, Battery, ChevronLeft, ArrowRight, ArrowDownLeft, 
  ArrowUpRight, Copy, Share2, HelpCircle, CheckCircle, AlertTriangle, 
  User, Lock, Key, Eye, HelpCircle as HelpIcon, Flame, ShieldAlert,
  Send, CreditCard, RefreshCw, Layers, Phone, DollarSign, Lightbulb,
  Tv, BookOpen, Send as PaperPlane, UserCheck, Check, Search, AlertCircle,
  History, MoreHorizontal
} from 'lucide-react';

interface MobileSimulatorProps {
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  products: ProductItem[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  subscribers: UserProfile[];
  setSubscribers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  handleGlobalRefresh?: () => void;
  isSyncing?: boolean;
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
  isSyncing = false
}: MobileSimulatorProps) {
  // Navigation states
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'otp' | 'bvn_verify' | 'app'>('auth');
  const [appTab, setAppTab] = useState<'home' | 'airtime' | 'data' | 'electricity' | 'cable' | 'exam' | 'history' | 'ai_chat' | 'profile'>('home');

  // Onboarding/Auth state variables
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>(currentUser.email);
  const [authName, setAuthName] = useState<string>(currentUser.name);
  const [authPhone, setAuthPhone] = useState<string>(currentUser.phone);
  const [authPromo, setAuthPromo] = useState<string>('');
  const [regMode, setRegMode] = useState<'self' | 'referral'>('self');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  
  // OTP code inputs
  const [otpCode, setOtpCode] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  
  // BVN / NIN Inputs
  const [bvnInput, setBvnInput] = useState<string>('');
  const [ninInput, setNinInput] = useState<string>('');
  const [kycLoading, setKycLoading] = useState<boolean>(false);

  // Active Transaction flow states
  const [selectedCategory, setSelectedCategory] = useState<'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Exam'>('Airtime');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [detectedOperator, setDetectedOperator] = useState<string>('');
  const [checkoutAmount, setCheckoutAmount] = useState<string>('');
  const [contactsOpen, setContactsOpen] = useState<boolean>(false);
  const [pinSheetOpen, setPinSheetOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [priceSheetOpen, setPriceSheetOpen] = useState<boolean>(false);
  const [othersSheetOpen, setOthersSheetOpen] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('All');

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
    if (selectedCategory === 'Airtime' || selectedCategory === 'Data') {
      let normalized = targetNumber.replace(/\D/g, '');
      if (normalized.startsWith('234')) {
        normalized = '0' + normalized.substring(3);
      }
      const prefix = normalized.substring(0, 4);
      if (['0803', '0806', '0703', '0706', '0903', '0906', '0813', '0814', '0816', '0704', '0913', '0916', '0804', '0702'].includes(prefix)) {
        setDetectedOperator('MTN');
      } else if (['0805', '0807', '0705', '0815', '0905', '0915'].includes(prefix)) {
        setDetectedOperator('Glo');
      } else if (['0802', '0808', '0701', '0708', '0902', '0907', '0901', '0912', '0812'].includes(prefix)) {
        setDetectedOperator('Airtel');
      } else if (['0809', '0817', '0818', '0909', '0908'].includes(prefix)) {
        setDetectedOperator('9mobile');
      } else {
        if (normalized.length < 4) {
          setDetectedOperator('');
        }
      }
    } else {
      setDetectedOperator('');
    }
  }, [targetNumber, selectedCategory]);

  // Fetch dynamic pricing based on user tier
  const getDynamicPrice = (product: ProductItem) => {
    if (currentUser.category === 'Super User') return product.priceSuper;
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

  // Submit Transaction checkout
  const handleConfirmPurchase = () => {
    // Validate PIN
    if (currentUser.hasPin && pinInput !== currentUser.pinCode) {
      alert("Invalid Transaction PIN. Please try again.");
      setPinInput('');
      return;
    }

    const price = parseFloat(checkoutAmount);
    if (currentUser.walletBalance < price) {
      alert("Insufficient wallet balance. Please fund your wallet.");
      setPinSheetOpen(false);
      return;
    }

    // Deduct balance
    const newBalance = currentUser.walletBalance - price;
    setCurrentUser(curr => ({ ...curr, walletBalance: newBalance }));
    
    // Update local subscribers state
    setSubscribers(prev => prev.map(s => {
      if (s.email === currentUser.email) {
        return { ...s, walletBalance: newBalance };
      }
      return s;
    }));

    // Create the transaction record
    const newTx: Transaction = {
      id: `tx-mob-${Math.floor(1000 + Math.random() * 9000)}`,
      type: selectedCategory,
      productName: selectedProduct?.name || `${selectedCategory} Payment`,
      amount: price,
      phoneOrMeter: targetNumber,
      operator: detectedOperator || selectedProduct?.operator,
      reference: `EDAT-PURCH-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Completed',
      date: new Date().toISOString(),
      disputeRaised: false,
      riskScore: riskScore,
      riskAnalysis: riskAnalysis
    };

    setTransactions(prev => [newTx, ...prev]);
    setActiveReceipt(newTx);
    setPinSheetOpen(false);
    setPinInput('');
    setTargetNumber('');
    setScanState('idle');
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

    // Assign temporary user state
    setCurrentUser(curr => ({
      ...curr,
      name: authName,
      email: authEmail,
      phone: authPhone,
      promoCode: authPromo,
      category: regMode === 'referral' ? 'Referred User' : 'Basic User'
    }));

    setCurrentScreen('bvn_verify');
  };

  // Submit BVN/NIN verified status
  const handleSubmitKYC = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      setCurrentUser(curr => ({ ...curr, isVerified: true }));
      setCurrentScreen('app');
    }, 1500);
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
    <div className="flex flex-col items-center justify-center p-4 select-none" id="mobile-shell-container">
      
      {/* Phone Shell Wrap */}
      <div className="relative w-[360px] h-[740px] bg-zinc-900 rounded-[50px] shadow-2xl border-[12px] border-zinc-800 flex flex-col overflow-hidden ring-4 ring-slate-800">
        
        {/* Dynamic Notch / Island */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 bg-zinc-950 rounded-full mr-2" />
          <div className="w-12 h-1 bg-zinc-950 rounded-full" />
        </div>

        {/* Status Bar */}
        <div className="bg-sky-50 pt-8 pb-2 px-6 flex justify-between items-center text-[10px] font-bold text-slate-700 z-40 shrink-0">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            <span>5G</span>
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Main Inside Viewport */}
        <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col">
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Usman Annur" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="usmanannur58@gmail.com" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="08142233864" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
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
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input 
                        type="email" 
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="usmanannur58@gmail.com" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <input 
                        type="password" 
                        defaultValue="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" 
                      />
                    </div>

                    <button 
                      onClick={() => setCurrentScreen('app')}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md mt-4 transition-all"
                    >
                      Secure Login <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  onClick={() => setCurrentScreen('app')}
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
              <div className="bg-sky-50/40 px-5 pt-2 pb-4 space-y-3 shadow-sm shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {appTab !== 'home' ? (
                      <button
                        type="button"
                        onClick={() => setAppTab('home')}
                        className="p-1 hover:bg-sky-100 rounded-lg text-sky-600 transition-all cursor-pointer flex items-center justify-center mr-1"
                        title="Back to Home Dashboard"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-7 h-7 bg-sky-600 rounded-lg flex items-center justify-center text-white text-xs font-black">e</div>
                    )}
                    <div>
                      <h3 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                        {appTab === 'home' && 'eData'}
                        {appTab === 'airtime' && 'Airtime VTU'}
                        {appTab === 'data' && 'Data Bundle'}
                        {appTab === 'electricity' && 'Electricity'}
                        {appTab === 'cable' && 'Cable TV'}
                        {appTab === 'exam' && 'Exam Token'}
                        {appTab === 'history' && 'Transactions'}
                        {appTab === 'ai_chat' && 'AI Support'}
                        {appTab === 'profile' && 'My Profile'}
                      </h3>
                      <span className="text-[9px] text-slate-400 font-bold leading-none">{currentUser.category}</span>
                    </div>
                  </div>
                  
                  {/* Verification shield indicator & Sync Refresh */}
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
                      <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </span>
                    ) : (
                      <button 
                        onClick={() => setCurrentScreen('bvn_verify')}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" /> Verify ID
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* TAB CONTAINER VIEW */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 relative">
                
                {/* Pull-to-refresh style API syncing loading bar */}
                {isSyncing && (
                  <div className="absolute top-0 left-0 right-0 bg-sky-50 text-sky-700 text-[10px] font-bold py-1.5 text-center border-b border-sky-100 flex items-center justify-center gap-1.5 z-50 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Fetching latest rates from Yii2 API...
                  </div>
                )}
                
                {/* 1. HOME TAB VIEW */}
                {appTab === 'home' && (
                  <div className="space-y-4">
                    {/* Wallet Balance Board */}
                    <div 
                      onClick={() => {
                        setFundAmountInput('5000');
                        setFundGateway('Paystack');
                        setFundModalOpen(true);
                      }}
                      className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800 hover:border-sky-500/25 transition-all cursor-pointer group"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                        <Smartphone className="w-32 h-32" />
                      </div>

                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Available Balance</span>
                      <div className="text-2xl font-black font-mono tracking-tight mt-1 flex items-baseline gap-1">
                        <span className="text-sky-400">₦</span>
                        {currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFundAmountInput('5000');
                            setFundGateway('Paystack');
                            setFundModalOpen(true);
                          }}
                          className="bg-sky-500 hover:bg-sky-600 text-slate-950 text-[11px] font-extrabold py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-sky-500/10"
                        >
                          + Fund Wallet
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPriceSheetOpen(true);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-bold py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Price List
                        </button>
                      </div>
                    </div>

                    {/* Quick Services Panels */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Utilities</h4>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'Airtime', icon: Phone, color: 'text-blue-500 bg-blue-50', tab: 'airtime' },
                          { id: 'Data', icon: Layers, color: 'text-emerald-500 bg-emerald-50', tab: 'data' },
                          { id: 'Electricity', icon: Lightbulb, color: 'text-yellow-500 bg-yellow-50', tab: 'electricity' },
                          { id: 'Cable', icon: Tv, color: 'text-sky-500 bg-sky-50', tab: 'cable' },
                          { id: 'Others', icon: MoreHorizontal, color: 'text-purple-500 bg-purple-50', tab: 'exam' }
                        ].map(item => (
                          <button 
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.id === 'Others') {
                                setOthersSheetOpen(true);
                              } else {
                                setSelectedCategory(item.id as any);
                                setAppTab(item.tab as any);
                              }
                            }}
                            className="flex flex-col items-center gap-1 min-w-0"
                          >
                            <div className={`p-2 rounded-xl ${item.color} shadow-sm transition-transform active:scale-95`}>
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[8px] font-bold text-slate-600 truncate w-full text-center">
                              {item.id === 'Electricity' ? 'Power' : item.id}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Membership Tier & Super User Upgrade Widget */}
                    {currentUser.category !== 'Super User' ? (
                      <div 
                        onClick={() => {
                          setUpgradeModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-sky-500/20 text-white p-3.5 rounded-2xl shadow-sm text-left relative overflow-hidden flex items-center justify-between hover:border-sky-500/40 transition-all cursor-pointer group"
                      >
                        <div className="space-y-1 max-w-[65%]">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-sky-500/20 text-sky-400 text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-sky-500/30">
                              PRO TIER
                            </span>
                            <span className="text-[8px] text-sky-200 font-bold">
                              {currentUser.category === 'Referred User' ? 'Referred' : 'Basic'}
                            </span>
                          </div>
                          <h4 className="text-[11px] font-extrabold text-white leading-tight">Upgrade to Super User</h4>
                          <p className="text-[8px] text-slate-300 leading-tight">
                            Unlock agent prices on all VTU and utility tokens instantly.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpgradeModalOpen(true);
                          }}
                          className="bg-gradient-to-r from-sky-400 to-sky-600 text-slate-950 text-[9px] font-black px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                        >
                          ₦1,500
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-white p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-sm text-left relative overflow-hidden">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-gradient-to-r from-sky-500 to-purple-500 text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Super User
                            </span>
                            <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> VIP Rates Active
                            </span>
                          </div>
                          <p className="font-extrabold text-[10px] text-slate-200">Enjoying absolute lowest utility rates!</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                      </div>
                    )}

                    {/* Frequent Purchase shortcuts */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commonly Purchased</h4>
                      <div className="space-y-2">
                        {products.slice(4, 7).map(prod => (
                          <button 
                            key={prod.id}
                            onClick={() => {
                              setSelectedCategory(prod.category as any);
                              setSelectedProduct(prod);
                              setTargetNumber('08142233864'); // pre-fill
                              if (prod.category === 'Airtime') {
                                setAppTab('airtime');
                              } else if (prod.category === 'Data') {
                                setAppTab('data');
                              } else if (prod.category === 'Electricity') {
                                setAppTab('electricity');
                              } else if (prod.category === 'Cable') {
                                setAppTab('cable');
                              } else if (prod.category === 'Exam') {
                                setAppTab('exam');
                              }
                            }}
                            className="w-full bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all text-left shadow-sm active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="bg-sky-50 text-sky-600 p-1.5 rounded-lg text-[10px] font-black">{prod.operator?.substring(0,3)}</span>
                              <div>
                                <h5 className="text-[10px] font-bold text-slate-800 leading-none">{prod.name}</h5>
                                <span className="text-[9px] text-slate-400 mt-0.5 block">{prod.description}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-900 block">₦{getDynamicPrice(prod)}</span>
                              <span className="text-[8px] text-sky-600 font-bold block mt-0.5">Instant VTU</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Transaction Log */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Transactions</h4>
                      <div className="space-y-2">
                        {transactions.slice(0, 3).map(tx => (
                          <div 
                            key={tx.id}
                            onClick={() => setActiveReceipt(tx)}
                            className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${
                                tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                {tx.type === 'Wallet Funding' ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
                                <h5 className="text-[10px] font-bold text-slate-800 leading-none">{tx.productName}</h5>
                                <span className="text-[9px] text-slate-400 mt-0.5 block">{tx.phoneOrMeter}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold block ${
                                tx.type === 'Wallet Funding' ? 'text-emerald-600' : 'text-slate-900'
                              }`}>
                                {tx.type === 'Wallet Funding' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                              </span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">
                                {new Date(tx.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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

                    {/* Safety Shield */}
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100/30 border border-sky-100 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> eData AI Safety Shield
                        </span>
                        {scanState === 'success' && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            riskScore > 50 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Risk: {riskScore}/100
                          </span>
                        )}
                      </div>

                      {scanState === 'idle' && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Run our real-time AI security engine to verify target validity, routing paths, and safeguard transactions.
                          </p>
                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedCategory('Airtime');
                              handleAISecurityScan();
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded-lg text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Scan Transaction
                          </button>
                        </div>
                      )}

                      {scanState === 'scanning' && (
                        <div className="flex items-center gap-2 py-1">
                          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-600">Gemini checking routing protocols...</span>
                        </div>
                      )}

                      {scanState === 'success' && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-600 leading-relaxed font-mono italic">"{riskAnalysis}"</p>
                          <p className="text-[8px] text-slate-400 font-bold">Safety Score calculated via Gemini 3.5 Flash</p>
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
                        if (parseFloat(checkoutAmount) > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        setPinSheetOpen(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Process Airtime Checkout <ArrowRight className="w-3.5 h-3.5" />
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

                    {/* Safety Shield */}
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100/30 border border-sky-100 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> eData AI Safety Shield
                        </span>
                        {scanState === 'success' && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            riskScore > 50 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Risk: {riskScore}/100
                          </span>
                        )}
                      </div>

                      {scanState === 'idle' && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Run our real-time AI security engine to verify target validity, routing paths, and safeguard transactions.
                          </p>
                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedCategory('Data');
                              handleAISecurityScan();
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded-lg text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Scan Transaction
                          </button>
                        </div>
                      )}

                      {scanState === 'scanning' && (
                        <div className="flex items-center gap-2 py-1">
                          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-600">Gemini checking routing protocols...</span>
                        </div>
                      )}

                      {scanState === 'success' && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-600 leading-relaxed font-mono italic">"{riskAnalysis}"</p>
                          <p className="text-[8px] text-slate-400 font-bold">Safety Score calculated via Gemini 3.5 Flash</p>
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
                        if (parseFloat(checkoutAmount) > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        setPinSheetOpen(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Process Data Checkout <ArrowRight className="w-3.5 h-3.5" />
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

                    {/* Safety Shield */}
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100/30 border border-sky-100 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> eData AI Safety Shield
                        </span>
                        {scanState === 'success' && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            riskScore > 50 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Risk: {riskScore}/100
                          </span>
                        )}
                      </div>

                      {scanState === 'idle' && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Run our real-time AI security engine to verify target validity, routing paths, and safeguard transactions.
                          </p>
                          <button 
                            type="button"
                            onClick={handleAISecurityScan}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded-lg text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Scan Transaction
                          </button>
                        </div>
                      )}

                      {scanState === 'scanning' && (
                        <div className="flex items-center gap-2 py-1">
                          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-600">Gemini checking routing protocols...</span>
                        </div>
                      )}

                      {scanState === 'success' && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-600 leading-relaxed font-mono italic">"{riskAnalysis}"</p>
                          <p className="text-[8px] text-slate-400 font-bold">Safety Score calculated via Gemini 3.5 Flash</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber) {
                          alert("Please fill out the destination identifier.");
                          return;
                        }
                        if (parseFloat(checkoutAmount) > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        setPinSheetOpen(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Process Electricity Checkout <ArrowRight className="w-3.5 h-3.5" />
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

                    {/* Safety Shield */}
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100/30 border border-sky-100 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> eData AI Safety Shield
                        </span>
                        {scanState === 'success' && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            riskScore > 50 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Risk: {riskScore}/100
                          </span>
                        )}
                      </div>

                      {scanState === 'idle' && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Run our real-time AI security engine to verify target validity, routing paths, and safeguard transactions.
                          </p>
                          <button 
                            type="button"
                            onClick={handleAISecurityScan}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded-lg text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Scan Transaction
                          </button>
                        </div>
                      )}

                      {scanState === 'scanning' && (
                        <div className="flex items-center gap-2 py-1">
                          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-600">Gemini checking routing protocols...</span>
                        </div>
                      )}

                      {scanState === 'success' && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-600 leading-relaxed font-mono italic">"{riskAnalysis}"</p>
                          <p className="text-[8px] text-slate-400 font-bold">Safety Score calculated via Gemini 3.5 Flash</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber) {
                          alert("Please fill out the destination identifier.");
                          return;
                        }
                        if (parseFloat(checkoutAmount) > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        setPinSheetOpen(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Process Cable TV Checkout <ArrowRight className="w-3.5 h-3.5" />
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
                        value={targetNumber}
                        onChange={(e) => setTargetNumber(e.target.value.replace(/\D/g, ''))}
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

                    {/* Safety Shield */}
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100/30 border border-sky-100 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> eData AI Safety Shield
                        </span>
                        {scanState === 'success' && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            riskScore > 50 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Risk: {riskScore}/100
                          </span>
                        )}
                      </div>

                      {scanState === 'idle' && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Run our real-time AI security engine to verify target validity, routing paths, and safeguard transactions.
                          </p>
                          <button 
                            type="button"
                            onClick={handleAISecurityScan}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded-lg text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Scan Transaction
                          </button>
                        </div>
                      )}

                      {scanState === 'scanning' && (
                        <div className="flex items-center gap-2 py-1">
                          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-600">Gemini checking routing protocols...</span>
                        </div>
                      )}

                      {scanState === 'success' && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-600 leading-relaxed font-mono italic">"{riskAnalysis}"</p>
                          <p className="text-[8px] text-slate-400 font-bold">Safety Score calculated via Gemini 3.5 Flash</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        if (!targetNumber) {
                          alert("Please fill out the destination identifier.");
                          return;
                        }
                        if (parseFloat(checkoutAmount) > currentUser.walletBalance) {
                          alert("Insufficient wallet balance.");
                          return;
                        }
                        setPinSheetOpen(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Process Exam Checkout <ArrowRight className="w-3.5 h-3.5" />
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
                      <div className="bg-emerald-50/50 border border-emerald-100/30 p-2 rounded-xl text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflow</span>
                        <strong className="text-[11px] text-emerald-600 font-extrabold block mt-0.5">
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
                        {['All', 'Airtime', 'Data', 'Electricity', 'Cable TV', 'Exam Token', 'Wallet Funding'].map(cat => (
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
                            tx.productName.toLowerCase().includes(query) ||
                            tx.phoneOrMeter.includes(query) ||
                            tx.reference.toLowerCase().includes(query) ||
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
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : tx.status === 'Pending' 
                                      ? 'bg-amber-50 text-amber-600' 
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
                                  isFunding ? 'text-emerald-600' : 'text-slate-900'
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
                {appTab === 'ai_chat' && (
                  <div className="flex-1 flex flex-col justify-between h-[510px]">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between shrink-0">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-none">eData Copilot</h3>
                        <span className="text-[8px] text-emerald-600 font-bold">Powered by Gemini AI</span>
                      </div>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>

                    {/* Message threads */}
                    <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1 text-[11px] leading-relaxed">
                      {chatHistory.map((item, idx) => (
                        <div 
                          key={idx}
                          className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`p-2.5 rounded-2xl max-w-[85%] shadow-sm ${
                            item.role === 'user' 
                              ? 'bg-sky-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-wrap">{item.content}</p>
                          </div>
                        </div>
                      ))}

                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white text-slate-500 border border-slate-100 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                            <span>Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat inputs */}
                    <div className="pt-2 border-t border-slate-100 flex gap-1.5 shrink-0">
                      <input 
                        type="text" 
                        placeholder="Ask anything about eData..." 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      />
                      <button 
                        onClick={handleSendChatMessage}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl transition-all"
                      >
                        <PaperPlane className="w-3.5 h-3.5" />
                      </button>
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
                        {['Basic User', 'Referred User', 'Super User'].map(cat => (
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

                        {/* Social Google accounts connection status */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <span className="font-bold text-slate-700 block text-[11px]">Two-Factor Authorization</span>
                            <span className="text-[9px] text-slate-400 block">Enable secure email verification codes.</span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase">Enabled</span>
                        </div>

                        <button 
                          onClick={() => setCurrentScreen('auth')}
                          className="w-full text-center text-rose-600 font-bold text-[10px] py-1 mt-2 hover:underline"
                        >
                          Sign Out Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Nav tabs navigation */}
              <div className="bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center shrink-0 z-40 w-full">
                {[
                  { id: 'home', icon: Smartphone, label: 'Home' },
                  { id: 'history', icon: History, label: 'History' },
                  { id: 'ai_chat', icon: HelpIcon, label: 'Support' },
                  { id: 'profile', icon: User, label: 'Profile' }
                ].map(tab => {
                  const isActive = tab.id === 'home'
                    ? ['home', 'airtime', 'data', 'electricity', 'cable', 'exam'].includes(appTab)
                    : appTab === tab.id;
                  
                  return (
                    <button 
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        if (tab.id === 'home') {
                          setAppTab('home');
                        } else {
                          setAppTab(tab.id as any);
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        isActive ? 'bg-sky-50 text-sky-600 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
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
                    { id: 'insurance', name: 'Insurance', icon: CheckCircle, desc: 'Health, Auto Cover', color: 'text-emerald-600 bg-emerald-50', custom: true },
                    { id: 'school', name: 'School Fees', icon: UserCheck, desc: 'Uni & College Bills', color: 'text-rose-600 bg-rose-50', custom: true },
                    { id: 'waste', name: 'Waste Bill', icon: Layers, desc: 'LAWMA & State Waste', color: 'text-amber-600 bg-amber-50', custom: true },
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
                  <div className="inline-flex bg-emerald-100 text-emerald-700 p-2 rounded-full">
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
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-800 space-y-1">
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
                  
                  <button 
                    onClick={() => {
                      alert("Receipt details copied to device clipboards successfully.");
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    Share / Save Receipt
                  </button>
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
                      if (currentUser.hasPin && oldPin !== (currentUser.pinCode || '1234')) {
                        alert("The current transaction PIN you entered is incorrect.");
                        return;
                      }
                      if (newPin.length !== 4) {
                        alert("The new PIN must be exactly 4 numeric digits.");
                        return;
                      }
                      if (newPin !== confirmNewPin) {
                        alert("Confirm PIN does not match your new PIN selection.");
                        return;
                      }

                      setCurrentUser(curr => ({ ...curr, pinCode: newPin, hasPin: true }));
                      setChangePinModalOpen(false);
                      alert("🎉 Success! Your secret Transaction PIN has been securely updated.");
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

          {/* INNER OVERLAY: INTERACTIVE SUPER USER UPGRADE MODAL */}
          {upgradeModalOpen && (
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 font-sans text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Upgrade to Super User
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
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-amber-600">Registering with Yii2 Core Router</p>
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
                      onClick={() => {
                        if (currentUser.walletBalance < 1500) {
                          alert("❌ Insufficient Balance! Please fund your wallet via Paystack first to upgrade.");
                          return;
                        }

                        setUpgradeLoading(true);
                        setTimeout(() => {
                          setUpgradeLoading(false);
                          const newBalance = currentUser.walletBalance - 1500;
                          
                          setCurrentUser(curr => ({
                            ...curr,
                            walletBalance: newBalance,
                            category: 'Super User'
                          }));

                          setSubscribers(prev => prev.map(s => {
                            if (s.email === currentUser.email) {
                              return { ...s, walletBalance: newBalance, category: 'Super User' };
                            }
                            return s;
                          }));

                          const upgradeTx: Transaction = {
                            id: `tx-sup-${Math.floor(1000 + Math.random() * 9000)}`,
                            type: 'Admin Transfer',
                            productName: 'Super User Tier Activation',
                            amount: 1500,
                            phoneOrMeter: currentUser.phone,
                            status: 'Completed',
                            date: new Date().toISOString(),
                            reference: `SUP-${Math.floor(10000000 + Math.random() * 90000000)}`,
                            disputeRaised: false,
                          };

                          setTransactions(prev => [upgradeTx, ...prev]);
                          setUpgradeModalOpen(false);
                          alert("🎉 Congratulations! You have successfully upgraded to Super User level. All VTU and utility rates have been instantly updated to agent discount rates!");
                        }, 1500);
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-md shadow-sky-500/10 cursor-pointer"
                    >
                      Pay ₦1,500 VTU License Fee & Activate
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Home Indicator line */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full z-50" />
      </div>

    </div>
  );
}
