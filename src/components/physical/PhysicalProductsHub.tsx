import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Zap,
  Smartphone,
  CreditCard,
  Sun,
  Tv,
  ChevronRight,
  ShieldCheck,
  Package,
  Sparkles,
  Loader2,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, PhysicalProductServiceCard, PhysicalProductCategory } from '../../types';
import PrepaidMeterFlow from './PrepaidMeterFlow';
import InstallmentPhoneFlow from './InstallmentPhoneFlow';
import PosDeviceFlow from './PosDeviceFlow';
import SolarFlow from './SolarFlow';
import OtherProductsFlow from './OtherProductsFlow';

interface PhysicalProductsHubProps {
  currentUser: UserProfile;
  initialService?: PhysicalProductCategory | null;
  onBack: () => void;
  onNavigate?: (view: string) => void;
  onRefreshWallet?: () => void;
}

export default function PhysicalProductsHub({
  currentUser,
  initialService = null,
  onBack,
  onNavigate,
  onRefreshWallet,
}: PhysicalProductsHubProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeSubFlow, setActiveSubFlow] = useState<PhysicalProductCategory | null>(initialService);
  const [services, setServices] = useState<PhysicalProductServiceCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [liveChatUrl, setLiveChatUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function fetchServices() {
      setIsLoading(true);
      try {
        const res = await api.getPhysicalProductServices();
        if (res && res.services && isMounted) {
          setServices(res.services);
          if (res.live_chat_url) setLiveChatUrl(res.live_chat_url);
        }
      } catch (err: any) {
        console.error('Failed to load physical product services', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // If a subflow is open, render that flow
  if (activeSubFlow === 'prepaid_meter') {
    return (
      <PrepaidMeterFlow
        currentUser={currentUser}
        onBack={() => setActiveSubFlow(null)}
        onNavigate={onNavigate}
        onRefreshWallet={onRefreshWallet}
      />
    );
  }

  if (activeSubFlow === 'installment_phone') {
    return (
      <InstallmentPhoneFlow
        currentUser={currentUser}
        onBack={() => setActiveSubFlow(null)}
        onNavigate={onNavigate}
        onRefreshWallet={onRefreshWallet}
      />
    );
  }

  if (activeSubFlow === 'pos_device') {
    return (
      <PosDeviceFlow
        currentUser={currentUser}
        onBack={() => setActiveSubFlow(null)}
        onNavigate={onNavigate}
        onRefreshWallet={onRefreshWallet}
      />
    );
  }

  if (activeSubFlow === 'solar') {
    return (
      <SolarFlow
        currentUser={currentUser}
        onBack={() => setActiveSubFlow(null)}
        onNavigate={onNavigate}
        onRefreshWallet={onRefreshWallet}
      />
    );
  }

  if (activeSubFlow === 'others') {
    return (
      <OtherProductsFlow
        currentUser={currentUser}
        onBack={() => setActiveSubFlow(null)}
        onNavigate={onNavigate}
        onRefreshWallet={onRefreshWallet}
      />
    );
  }

  // Fallback default cards if loading or offline
  const defaultServices: PhysicalProductServiceCard[] = [
    {
      key: 'prepaid_meter',
      title: 'Prepaid Meter',
      description: 'DisCo-certified 1 Phase, 3 Phase & MD meters with fast premise inspection.',
      icon: 'zap',
      badge: 'Certified DisCo',
      admin_fee: 5000,
    },
    {
      key: 'installment_phone',
      title: 'Installment Phone',
      description: 'Original smartphones with weekly or monthly flexible installment plans.',
      icon: 'smartphone',
      badge: 'Zero Collateral',
      admin_fee: 5000,
    },
    {
      key: 'pos_device',
      title: 'POS Device Purchase',
      description: 'Android & MPOS devices with instant settlement and 60-day recovery protection.',
      icon: 'credit-card',
      badge: 'Agency Banking',
      admin_fee: 5000,
    },
    {
      key: 'solar',
      title: 'Solar & Inverter Systems',
      description: 'Hybrid solar inverters, lithium battery banks & clean energy power stations.',
      icon: 'sun',
      badge: 'Clean Energy',
      admin_fee: 5000,
    },
    {
      key: 'others',
      title: 'Others (Electronics & Utilities)',
      description: 'Smart TVs, inverters, solar generators, and verified home appliances.',
      icon: 'tv',
      badge: 'Utilities',
      admin_fee: 5000,
    },
  ];

  const displayList = services.length > 0 ? services : defaultServices;

  const getServiceIcon = (key: string) => {
    switch (key) {
      case 'prepaid_meter':
        return <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />;
      case 'installment_phone':
        return <Smartphone className="w-6 h-6 text-sky-500 dark:text-emerald-400" />;
      case 'pos_device':
        return <CreditCard className="w-6 h-6 text-blue-500" />;
      case 'solar':
        return <Sun className="w-6 h-6 text-amber-500 fill-amber-500" />;
      case 'others':
      default:
        return <Tv className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
            <Package className="w-4.5 h-4.5 text-sky-400" />
            <span>Physical Products &amp; Utilities</span>
          </h1>
          <span className="text-[10px] text-slate-500 font-medium">Hardware Marketplace</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const url = liveChatUrl || 'https://wa.me/2348000000000?text=Hello%20eData%20Support%2C%20I%20have%20an%20inquiry%20regarding%20Physical%20Products';
            window.open(url, '_blank');
          }}
          className="p-2 -mr-2 text-slate-500 hover:text-emerald-600"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Intro Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-600 via-emerald-800 to-teal-900 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white backdrop-blur-md mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Admin Managed Services</span>
            </div>
            <h2 className="text-lg font-black font-display tracking-tight leading-snug">
              Hardware &amp; Utility Requests
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
              Order DisCo prepaid meters, smartphones on installments, POS devices, solar setups, and home appliances directly to your location.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Services List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Available Physical Services
          </h3>

          {isLoading && services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
              <span className="text-xs">Loading services from admin...</span>
            </div>
          ) : (
            displayList.map(item => (
              <div
                key={item.key}
                onClick={() => setActiveSubFlow(item.key)}
                className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer flex items-center justify-between group ${
                  isLight
                    ? 'bg-white border-slate-100 hover:border-emerald-200'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {getServiceIcon(item.key)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-2 text-[11px] font-bold text-sky-500 dark:text-emerald-400">
                      Admin Fee: ₦{item.admin_fee.toLocaleString()} (Non-Refundable)
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Support Banner */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-bold text-slate-800 dark:text-white">Need Inquiry Assistance?</span>
              <p className="text-[11px] text-slate-500">Our physical product fulfillment desk is available 24/7</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const url = liveChatUrl || 'https://wa.me/2348000000000?text=Hello%20eData%20Support%2C%20I%20have%20an%20inquiry%20regarding%20Physical%20Products';
              window.open(url, '_blank');
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            Chat Now
          </button>
        </div>
      </main>
    </div>
  );
}
