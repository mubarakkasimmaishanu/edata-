import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  Smartphone, Wifi, Tv, Lightbulb, BookOpen, Repeat, Plus, Headphones,
  Search, ChevronRight, Sparkles, Layers, ShieldCheck, Zap, Gift, ArrowLeft
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
  /**
   * Service categories currently marked ACTIVE by the admin. Tiles whose
   * `adminGated` flag matches an id NOT in this list are hidden. See
   * App.tsx `serviceCategories` for how it's populated.
   */
  serviceCategories?: string[];
  onNavigate: (view: string) => void;
}

export default function ServicesCatalog({ currentUser, serviceCategories = [], onNavigate }: ServicesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'telecom' | 'bills' | 'education'>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'telecom', label: 'Airtime & Data' },
    { id: 'bills', label: 'TV & Utilities' },
    { id: 'education', label: 'Exams & Pins' },
  ];

  // `adminGated: true` marks tiles whose visibility follows Manage
  // Services in the admin panel. Tiles without that flag (fund, support,
  // referral) are app-level nav items and always show.
  const allServices: {
    id: string;
    name: string;
    desc: string;
    category: string;
    icon: any;
    adminGated?: boolean;
  }[] = [
    // Telecom
    { id: 'airtime', name: 'Airtime', desc: 'Instant VTU top-up', category: 'telecom', icon: Smartphone, adminGated: true },
    { id: 'data', name: 'Data', desc: 'All network data bundles', category: 'telecom', icon: Layers, adminGated: true },
    { id: 'a2c', name: 'A2C', desc: 'Airtime to Cash', category: 'telecom', icon: Repeat, adminGated: true },
    { id: 'fund', name: 'Fund Wallet', desc: 'Bank transfer', category: 'telecom', icon: Plus },
    // Bills
    { id: 'cable', name: 'Cable TV', desc: 'DStv, GOtv, StarTimes', category: 'bills', icon: Tv, adminGated: true },
    { id: 'electricity', name: 'Electricity', desc: 'Prepaid & Postpaid', category: 'bills', icon: Lightbulb, adminGated: true },
    // Education
    { id: 'exams', name: 'Exam Card', desc: 'WAEC, NECO, NABTEB', category: 'education', icon: BookOpen, adminGated: true },
    // Other
    { id: 'referral', name: 'Referral', desc: 'Invite & earn', category: 'telecom', icon: Gift },
    { id: 'support', name: 'Support', desc: '24/7 help desk', category: 'telecom', icon: Headphones },
  ].filter(tile =>
    !tile.adminGated
    || serviceCategories.length === 0 // no sync yet — show everything so nothing looks broken
    || serviceCategories.includes(tile.id)
  );

  const filteredServices = allServices.filter(srv => {
    const matchesCategory = activeCategory === 'all' || srv.category === activeCategory;
    const matchesSearch = srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          srv.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-36">
      {/* ── Top Header ── */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-md safe-top">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700/60 active:scale-95 cursor-pointer transition-transform"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h1 className="text-base font-black text-white font-display">All Services</h1>
            <p className="text-[11px] text-slate-400 font-medium">VTU & payment utilities</p>
          </div>
        </div>

        <div className="wallet-chip bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="wallet-chip-label text-[9px] font-black uppercase text-sky-400 tracking-wider font-display">Wallet:</span>
          <span className="wallet-chip-amount text-xs font-black text-sky-200 font-mono">₦{(currentUser.mainWallet ?? currentUser.walletBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* ── Search Bar ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search services..."
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

        {/* ── Services Card Grid (same design as Dashboard) ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 shadow-xl">
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-4 gap-2.5">
              {filteredServices.map((srv) => {
                const Icon = srv.icon;
                return (
                  <button
                    key={srv.id}
                    onClick={() => onNavigate(srv.id)}
                    className="flex flex-col items-center gap-2 transition-all group cursor-pointer active:scale-[0.93]"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center shadow-md group-hover:border-sky-500/40 group-hover:bg-slate-800/90 group-active:bg-slate-700/70 transition-all duration-200">
                      <Icon className="w-7 h-7 text-sky-400 stroke-[1.8] drop-shadow-sm" />
                    </div>
                    <div className="text-center">
                      <span className="text-[10.5px] font-bold text-slate-300 font-display tracking-tight leading-tight group-hover:text-white transition-colors block">
                        {srv.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium leading-tight block mt-0.5">
                        {srv.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-xs font-bold text-slate-400">No services match "{searchQuery}"</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
