import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  Smartphone, Wifi, Tv, Lightbulb, BookOpen, Repeat, Plus, Headphones,
  Search, ChevronRight, Sparkles, Layers, ShieldCheck, Zap
} from 'lucide-react';
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
import ikejaIcon from '@/assets/icons/ikeja.png';
import supportIcon from '@/assets/icons/support.png';
import walletIcon from '@/assets/icons/airtimetocash.png';

interface ServicesCatalogProps {
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
}

export default function ServicesCatalog({ currentUser, onNavigate }: ServicesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'telecom' | 'bills' | 'education'>('all');

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'telecom', label: 'Airtime & Data' },
    { id: 'bills', label: 'TV & Utilities' },
    { id: 'education', label: 'Exams & Pins' },
  ];

  const allServices = [
    {
      id: 'airtime',
      name: 'Buy Airtime',
      desc: 'Instant VTU airtime for MTN, Airtel, Glo & 9mobile',
      category: 'telecom',
      iconImg: mtnIcon,
      fallbackIcon: Smartphone,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badge: 'Instant 24/7'
    },
    {
      id: 'data',
      name: 'Buy Data Bundle',
      desc: 'Cheap SME, Corporate & Direct Gifting data plans',
      category: 'telecom',
      iconImg: airtelIcon,
      fallbackIcon: Wifi,
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      badge: 'Best Rates'
    },
    {
      id: 'cable',
      name: 'Cable TV Subscription',
      desc: 'Pay DStv, GOtv & StarTimes subscriptions',
      category: 'bills',
      iconImg: dstvIcon,
      fallbackIcon: Tv,
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      badge: 'Instant Activation'
    },
    {
      id: 'electricity',
      name: 'Electricity Bill',
      desc: 'Buy PrePaid & PostPaid tokens for AEDC, EKEDC, IKEDC, etc.',
      category: 'bills',
      iconImg: aedcIcon,
      fallbackIcon: Lightbulb,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badge: 'Zero Charge'
    },
    {
      id: 'exams',
      name: 'Exam Result Pins',
      desc: 'WAEC, NECO, NABTEB & NBAIS result checker tokens',
      category: 'education',
      iconImg: waecIcon,
      fallbackIcon: BookOpen,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      badge: 'Official Pins'
    },
    {
      id: 'a2c',
      name: 'Airtime to Cash',
      desc: 'Convert excess airtime to instant bank money',
      category: 'telecom',
      iconImg: walletIcon,
      fallbackIcon: Repeat,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      badge: 'Fast Payout'
    },
    {
      id: 'fund',
      name: 'Fund Wallet',
      desc: 'Instant automated bank transfer & KatPay online',
      category: 'telecom',
      fallbackIcon: Plus,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badge: 'Automated'
    },
    {
      id: 'support',
      name: 'Help & Support',
      desc: '24/7 Live Customer Care & Whatsapp Helpdesk',
      category: 'telecom',
      iconImg: supportIcon,
      fallbackIcon: Headphones,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      badge: '24/7 Active'
    },
  ];

  const filteredServices = allServices.filter(srv => {
    const matchesCategory = activeCategory === 'all' || srv.category === activeCategory;
    const matchesSearch = srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          srv.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-28">
      {/* ── Top Header ── */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white font-display">Services Catalog</h1>
            <p className="text-[11px] text-slate-400 font-medium">Explore all VTU & payment utilities</p>
          </div>
        </div>

        <div className="bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="text-xs font-black text-sky-200 font-mono">₦{currentUser.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* ── Search Bar ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search services (e.g. Data, Airtime, DStv, WAEC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-400 font-medium focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20 shadow-md"
          />
        </div>

        {/* ── Filter Pills Row ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 font-black'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-750'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Service Cards Catalog List ── */}
        <div className="space-y-3 pt-1">
          {filteredServices.map((srv) => {
            const FallbackIcon = srv.fallbackIcon;
            return (
              <div
                key={srv.id}
                onClick={() => onNavigate(srv.id)}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 hover:bg-slate-800 text-white rounded-3xl p-4 flex items-center justify-between group transition-all duration-300 shadow-lg cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-slate-950/60 flex items-center justify-center shrink-0 border border-slate-700/80 p-2 group-hover:scale-105 transition-transform">
                    {srv.iconImg ? (
                      <img src={srv.iconImg} alt={srv.name} className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <FallbackIcon className="w-6 h-6 text-sky-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-black text-white font-display group-hover:text-sky-300 transition-colors">
                        {srv.name}
                      </h3>
                      {srv.badge && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 tracking-wider">
                          {srv.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {srv.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 shrink-0 group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="p-8 bg-slate-800/80 border border-slate-700/60 rounded-3xl text-center shadow-md">
              <p className="text-xs font-bold text-slate-400">No services match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
