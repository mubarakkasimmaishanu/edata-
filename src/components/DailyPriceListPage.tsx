import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import {
  ArrowLeft, Copy, Download, Sparkles, Check,
  Camera, Eye, Layers, Palette, Maximize2, Plus, Trash2, RotateCcw, Search
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import html2canvas from 'html2canvas';

export interface DailyPriceListPageProps {
  currentUser?: any;
  onBack: () => void;
  onNavigate?: (view: string, params?: any) => void;
}

interface PlanItem {
  id: number;
  size_label: string;
  full_name: string;
  selling_price: number;
  premium_price: number;
  referred_price: number;
  size_mb: number;
  service_id: number;
  plan_type_id: number;
  is_custom?: boolean;
}

interface PlanGroup {
  group_key: string;
  group_title: string;
  service_id: number;
  service_name: string;
  plan_type_id: number | null;
  plan_type_name: string;
  plans: PlanItem[];
}

interface NetworkMeta {
  id: number;
  name: string;
  brand: string;
  color: string;
  text_color: string;
  badge: string;
}

export default function DailyPriceListPage({ currentUser, onBack, onNavigate }: DailyPriceListPageProps) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [networks, setNetworks] = useState<NetworkMeta[]>([]);
  const [rawBackendGroups, setRawBackendGroups] = useState<PlanGroup[]>([]);
  const [allGroups, setAllGroups] = useState<PlanGroup[]>([]);
  const [todayFormatted, setTodayFormatted] = useState('');
  const [referralLink, setReferralLink] = useState('https://edata.com.ng/join');
  const [roleLabel, setRoleLabel] = useState('Standard Partner');
  const [referralCode, setReferralCode] = useState('');

  // Customizable Card Texts
  const [cardTitle, setCardTitle] = useState('eData Current Price');
  const [cardDate, setCardDate] = useState('');
  const [cardCtaTitle, setCardCtaTitle] = useState('Signup in 30 seconds');

  // Filtering states
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<number[]>([27]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<number>>(new Set());
  const [activePreset, setActivePreset] = useState<string>('ceo-mtn');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Item Form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNetId, setCustomNetId] = useState(27);
  const [customGroup, setCustomGroup] = useState('MTN Special Deal');
  const [customSize, setCustomSize] = useState('');
  const [customNormal, setCustomNormal] = useState('');
  const [customPremium, setCustomPremium] = useState('');
  const [customItems, setCustomItems] = useState<PlanItem[]>([]);

  // Display toggles
  const [showNormal, setShowNormal] = useState(true);
  const [showPremium, setShowPremium] = useState(true);
  const [showReferred, setShowReferred] = useState(false);
  const [cardTheme, setCardTheme] = useState<'paper' | 'brand' | 'dark'>('paper');

  // Copying / Downloading state
  const [copyingImage, setCopyingImage] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    fetchPriceListData();
  }, []);

  const fetchPriceListData = async () => {
    setLoading(true);
    try {
      const res = await api.getPriceList();
      if (res && res.success && res.data) {
        setNetworks(res.data.networks || []);
        const groups: PlanGroup[] = JSON.parse(JSON.stringify(res.data.groups || []));
        setRawBackendGroups(JSON.parse(JSON.stringify(res.data.groups || [])));
        setAllGroups(groups);
        setTodayFormatted(res.data.today || '');
        setCardDate(`Updated: ${res.data.today || ''}`);
        if (res.data.referral) {
          setReferralLink(res.data.referral.referral_link || 'https://edata.com.ng/join');
          setRoleLabel(res.data.referral.role_label || 'Partner');
          setReferralCode(res.data.referral.referral_code || '');
        }

        // Apply CEO format default
        applyPreset('ceo-mtn', groups);
      }
    } catch (err: any) {
      console.error('Price list fetch error:', err);
      toast.error('Could not load live price rates.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetKey: string, groups: PlanGroup[] = allGroups) => {
    setActivePreset(presetKey);
    const newSelected = new Set<number>();

    if (presetKey === 'ceo-mtn') {
      setSelectedNetworkIds([27]);
      groups.forEach((grp) => {
        if (grp.service_id !== 27) return;
        const t = grp.group_title.toLowerCase();
        const is7Day = /7\s*-?\s*day|weekly/i.test(t);
        const is30Day = /30\s*-?\s*day|monthly/i.test(t);
        if (/data\s*share|sme/i.test(t) && (is7Day || is30Day)) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
      if (newSelected.size === 0) {
        groups.forEach((grp) => {
          if (grp.service_id !== 27) return;
          const t = grp.group_title.toLowerCase();
          if (/weekly|monthly|7\s*-?\s*day|30\s*-?\s*day/i.test(t)) {
            grp.plans.forEach((p) => newSelected.add(p.id));
          }
        });
      }
      if (newSelected.size === 0) {
        const mtn = groups.filter((g) => g.service_id === 27);
        mtn.slice(0, 2).forEach((g) => g.plans.forEach((p) => newSelected.add(p.id)));
      }
      if (newSelected.size === 0 && groups.length > 0) {
        groups[0].plans.forEach((p) => newSelected.add(p.id));
      }
    } else if (presetKey === 'mtn-sme') {
      setSelectedNetworkIds([27]);
      groups.forEach((grp) => {
        if (grp.service_id !== 27) return;
        const t = grp.group_title.toLowerCase();
        if (/sme|data\s*share|corporate|cg/i.test(t)) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
      if (newSelected.size === 0) {
        const mtn = groups.filter((g) => g.service_id === 27);
        if (mtn.length > 0) mtn[0].plans.forEach((p) => newSelected.add(p.id));
      }
    } else if (presetKey === 'mtn-all') {
      setSelectedNetworkIds([27]);
      groups.forEach((grp) => {
        if (grp.service_id === 27) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
    } else if (presetKey === 'airtel-all') {
      setSelectedNetworkIds([28]);
      groups.forEach((grp) => {
        if (grp.service_id === 28) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
    } else if (presetKey === 'glo-all') {
      setSelectedNetworkIds([29]);
      groups.forEach((grp) => {
        if (grp.service_id === 29) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
    } else if (presetKey === 'all-active') {
      setSelectedNetworkIds(networks.map((n) => n.id));
      groups.forEach((grp) => {
        grp.plans.forEach((p) => newSelected.add(p.id));
      });
    }

    setSelectedPlanIds(newSelected);
  };

  const toggleNetwork = (netId: number) => {
    setSelectedNetworkIds((prev) =>
      prev.includes(netId) ? prev.filter((id) => id !== netId) : [...prev, netId]
    );
  };

  const togglePlan = (planId: number) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const toggleGroup = (grp: PlanGroup) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      const anyUnchecked = grp.plans.some((p) => !next.has(p.id));
      grp.plans.forEach((p) => {
        if (anyUnchecked) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const toggleAll = (check: boolean) => {
    if (!check) {
      setSelectedPlanIds(new Set());
    } else {
      const next = new Set<number>();
      allGroups.forEach((grp) => {
        if (selectedNetworkIds.includes(grp.service_id)) {
          grp.plans.forEach((p) => next.add(p.id));
        }
      });
      customItems.forEach((ci) => next.add(ci.id));
      setSelectedPlanIds(next);
    }
  };

  // Inline Price Editing
  const handlePriceChange = (planId: number, field: 'selling_price' | 'premium_price', val: string) => {
    const num = parseFloat(val) || 0;
    setAllGroups((prev) =>
      prev.map((g) => ({
        ...g,
        plans: g.plans.map((p) => (p.id === planId ? { ...p, [field]: num } : p)),
      }))
    );
  };

  const handleCustomPriceChange = (planId: number, field: 'selling_price' | 'premium_price', val: string) => {
    const num = parseFloat(val) || 0;
    setCustomItems((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, [field]: num } : p))
    );
  };

  // Reset to live database rates
  const handleResetPrices = () => {
    if (window.confirm('Reset all prices back to live database rates?')) {
      setAllGroups(JSON.parse(JSON.stringify(rawBackendGroups)));
      toast.success('Prices restored to live rates.');
    }
  };

  // Add Custom Plan Row
  const handleAddCustomPlan = () => {
    if (!customSize.trim()) {
      toast.error('Please enter a plan size label (e.g. 2.5GB).');
      return;
    }
    const normal = parseFloat(customNormal) || 0;
    const premium = parseFloat(customPremium) || normal;
    const newId = 999000 + customItems.length + 1;

    const newItem: PlanItem = {
      id: newId,
      size_label: customSize.trim(),
      full_name: `${customSize.trim()} (${customGroup})`,
      selling_price: normal,
      premium_price: premium,
      referred_price: normal,
      size_mb: 0,
      service_id: customNetId,
      plan_type_id: 0,
      is_custom: true,
    };

    setCustomItems((prev) => [...prev, newItem]);
    setSelectedPlanIds((prev) => new Set(prev).add(newId));
    setCustomSize('');
    setCustomNormal('');
    setCustomPremium('');
    setShowCustomForm(false);
    toast.success(`Added "${newItem.size_label}" to price list!`);
  };

  const handleDeleteCustomItem = (id: number) => {
    setCustomItems((prev) => prev.filter((x) => x.id !== id));
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Copy Image directly to Clipboard
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setCopyingImage(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Could not create image blob');
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          toast.success('Image copied to clipboard! Paste directly into WhatsApp Web or Telegram (Ctrl+V).');
        } catch (clipErr) {
          const link = document.createElement('a');
          link.download = `eData_Price_List_${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast.success('Graphic downloaded! (Clipboard write not permitted by your browser).');
        } finally {
          setCopyingImage(false);
        }
      }, 'image/png');
    } catch (err: any) {
      console.error(err);
      toast.error('Could not generate image: ' + err.message);
      setCopyingImage(false);
    }
  };

  // Download high-resolution PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `eData_Price_List_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Graphic downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Copy WhatsApp Formatted Text
  const handleCopyWhatsAppText = () => {
    let text = `🔥 *${cardTitle}* 🔥\n`;
    text += `📅 _${cardDate || todayFormatted}_\n\n`;

    let hasAny = false;

    // Custom items
    const selectedCustom = customItems.filter((ci) => selectedPlanIds.has(ci.id));
    if (selectedCustom.length > 0) {
      hasAny = true;
      text += `⭐ *Special & Custom Deals*\n`;
      selectedCustom.forEach((p) => {
        const parts: string[] = [];
        if (showNormal) parts.push(`Normal: ₦${Math.round(p.selling_price).toLocaleString()}`);
        if (showPremium) parts.push(`Premium: ₦${Math.round(p.premium_price).toLocaleString()}`);
        text += `• *${p.size_label}* → ${parts.join(' | ')}\n`;
      });
      text += `\n`;
    }

    allGroups.forEach((grp) => {
      if (!selectedNetworkIds.includes(grp.service_id)) return;
      const chosen = grp.plans.filter((p) => selectedPlanIds.has(p.id));
      if (chosen.length === 0) return;

      hasAny = true;
      text += `📶 *${grp.group_title}*\n`;
      chosen.forEach((p) => {
        const parts: string[] = [];
        if (showNormal) parts.push(`Normal: ₦${Math.round(p.selling_price).toLocaleString()}`);
        if (showPremium) parts.push(`Premium: ₦${Math.round(p.premium_price).toLocaleString()}`);
        text += `• *${p.size_label}* → ${parts.join(' | ')}\n`;
      });
      text += `\n`;
    });

    if (!hasAny) {
      toast.error('No plans selected to copy.');
      return;
    }

    text += `⚡ *Signup in 30 seconds:*\n`;
    text += `👉 ${referralLink}\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      toast.success('WhatsApp formatted text copied!');
      setTimeout(() => setCopiedText(false), 2500);
    }).catch(() => {
      toast.error('Could not copy text.');
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 animate-fade-in">
      
      {/* Top Header Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Daily Price List Generator
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Marketing Hub
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official marketing rates &amp; graphic generator for WhatsApp, Telegram &amp; Status
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span>Logged in as: <strong>{roleLabel}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls & Product Catalog Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Quick Presets */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                ⚡ Quick Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'ceo-mtn', label: '⭐ CEO (MTN 7D & 30D)' },
                  { key: 'mtn-sme', label: '⚡ MTN SME' },
                  { key: 'mtn-all', label: '📶 All MTN' },
                  { key: 'airtel-all', label: '🔴 Airtel Plans' },
                  { key: 'glo-all', label: '🟢 Glo Plans' },
                  { key: 'all-active', label: '🔄 All Networks' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      activePreset === p.key
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Filters & Pricing Tiers */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Network Chips */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    📶 Filter Networks
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {networks.map((net) => {
                      const isChecked = selectedNetworkIds.includes(net.id);
                      return (
                        <button
                          key={net.id}
                          onClick={() => toggleNetwork(net.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: net.color }} />
                          {net.brand}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display Tiers */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    💰 Tiers to Display
                  </label>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNormal}
                        onChange={(e) => setShowNormal(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span><strong>Normal User</strong> (Retail Rate)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPremium}
                        onChange={(e) => setShowPremium(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span><strong>Premium User</strong> (Reseller Rate)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showReferred}
                        onChange={(e) => setShowReferred(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span><strong>Referred User</strong> (Affiliate Rate)</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Scrollable Product Catalog & Inline Price Editor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  📦 Select &amp; Edit Product Plans ({selectedPlanIds.size} Selected)
                </label>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <button type="button" onClick={() => toggleAll(true)} className="text-emerald-600 hover:underline">
                    Check All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => toggleAll(false)} className="text-emerald-600 hover:underline">
                    Uncheck All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={handleResetPrices} className="text-rose-600 hover:underline flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset Live Rates
                  </button>
                </div>
              </div>

              {/* Search & Custom Add Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search plans (e.g. 1GB, 7-day, SME)..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Custom Plan
                </button>
              </div>

              {/* Collapsible Custom Item Form */}
              {showCustomForm && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span>➕ Add Custom / Promotional Bonus Deal</span>
                    <button type="button" onClick={() => setShowCustomForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Network</label>
                      <select
                        value={customNetId}
                        onChange={(e) => setCustomNetId(parseInt(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {networks.map((n) => (
                          <option key={n.id} value={n.id}>{n.brand}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Plan Size Label</label>
                      <input
                        type="text"
                        placeholder="e.g. 2.5GB (Promo)"
                        value={customSize}
                        onChange={(e) => setCustomSize(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Normal (₦)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1100"
                        value={customNormal}
                        onChange={(e) => setCustomNormal(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Premium (₦)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={customPremium}
                        onChange={(e) => setCustomPremium(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleAddCustomPlan}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Add to Graphic Card
                    </button>
                  </div>
                </div>
              )}

              {/* Scrollable Groups & Plans Catalog */}
              <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                {/* Custom items */}
                {customItems.length > 0 && (
                  <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                    <div className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                      ⭐ Custom Promotional Deals
                    </div>
                    {customItems.map((ci) => (
                      <div key={ci.id} className="flex items-center justify-between text-xs py-1 border-t border-emerald-100 dark:border-emerald-800/30">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white">
                          <input
                            type="checkbox"
                            checked={selectedPlanIds.has(ci.id)}
                            onChange={() => togglePlan(ci.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{ci.size_label}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-500 flex items-center gap-1">
                            Norm: ₦
                            <input
                              type="number"
                              value={ci.selling_price}
                              onChange={(e) => handleCustomPriceChange(ci.id, 'selling_price', e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                            />
                          </label>
                          <label className="text-[11px] text-slate-500 flex items-center gap-1">
                            Prem: ₦
                            <input
                              type="number"
                              value={ci.premium_price}
                              onChange={(e) => handleCustomPriceChange(ci.id, 'premium_price', e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomItem(ci.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Standard Catalog */}
                {allGroups
                  .filter((g) => selectedNetworkIds.includes(g.service_id))
                  .map((grp) => {
                    const filteredPlans = grp.plans.filter((p) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        p.size_label.toLowerCase().includes(q) ||
                        p.full_name.toLowerCase().includes(q) ||
                        grp.group_title.toLowerCase().includes(q)
                      );
                    });

                    if (filteredPlans.length === 0) return null;

                    return (
                      <div key={grp.group_key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1.5">
                          <span>{grp.group_title}</span>
                          <button
                            type="button"
                            onClick={() => toggleGroup(grp)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            Toggle Group
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {filteredPlans.map((p) => {
                            const isChecked = selectedPlanIds.has(p.id);
                            return (
                              <div key={p.id} className="flex items-center justify-between text-xs py-1">
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePlan(p.id)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className={`font-bold ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {p.size_label}
                                  </span>
                                  <span className="text-[11px] text-slate-400">({p.full_name})</span>
                                </label>

                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] text-slate-500 flex items-center gap-1">
                                    Norm: ₦
                                    <input
                                      type="number"
                                      value={p.selling_price}
                                      onChange={(e) => handlePriceChange(p.id, 'selling_price', e.target.value)}
                                      className="w-16 px-1.5 py-0.5 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right text-slate-900 dark:text-white"
                                    />
                                  </label>
                                  <label className="text-[11px] text-slate-500 flex items-center gap-1">
                                    Prem: ₦
                                    <input
                                      type="number"
                                      value={p.premium_price}
                                      onChange={(e) => handlePriceChange(p.id, 'premium_price', e.target.value)}
                                      className="w-16 px-1.5 py-0.5 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right text-slate-900 dark:text-white"
                                    />
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                💡 <em>You can edit prices right in the input fields above before generating your graphic card!</em>
              </div>
            </div>

            {/* 4. Branding, Text & Visual Theme */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                🎨 Graphic Text &amp; Theme
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Main Title</label>
                  <input
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Date / Subtitle</label>
                  <input
                    type="text"
                    value={cardDate}
                    onChange={(e) => setCardDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Call to Action Heading</label>
                  <input
                    type="text"
                    value={cardCtaTitle}
                    onChange={(e) => setCardCtaTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Attribution Link / Contact</label>
                  <input
                    type="text"
                    value={referralLink}
                    onChange={(e) => setReferralLink(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-2">Visual Theme</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'paper', label: '📄 Minimalist Lined Paper (CEO Mockup)' },
                    { id: 'brand', label: '🌿 eData Emerald Brand' },
                    { id: 'dark', label: '🌙 Midnight Studio' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCardTheme(t.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        cardTheme === t.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Sticky Live Graphic Card & Export Actions (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            
            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleCopyImage}
                disabled={copyingImage}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                {copyingImage ? 'Generating...' : 'Copy Image (1-Click)'}
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                PNG
              </button>

              <button
                onClick={handleCopyWhatsAppText}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <FaWhatsapp className="w-4 h-4" />
                {copiedText ? 'Copied!' : 'WhatsApp Text'}
              </button>
            </div>

            {/* Live Generated Graphic Card */}
            <div className="flex justify-center">
              <div
                ref={cardRef}
                className={`w-full max-w-md rounded-2xl p-6 transition-all shadow-xl ${
                  cardTheme === 'paper'
                    ? 'bg-white text-slate-900 border-2 border-slate-900 font-sans'
                    : cardTheme === 'brand'
                    ? 'bg-white text-slate-900 border-4 border-emerald-800 font-sans'
                    : 'bg-slate-900 text-white border-2 border-slate-700 font-sans'
                }`}
                style={
                  cardTheme === 'paper'
                    ? {
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, transparent, transparent 27px, #cbd5e1 28px)',
                        lineHeight: '28px',
                      }
                    : undefined
                }
              >
                {/* Card Header */}
                <div
                  className={`text-center pb-2 mb-3 ${
                    cardTheme === 'paper'
                      ? 'border-b-2 border-slate-900'
                      : cardTheme === 'brand'
                      ? '-m-6 mb-4 p-4 bg-emerald-800 text-white rounded-t-xl'
                      : 'border-b border-slate-800'
                  }`}
                >
                  <span
                    className={`block font-black text-xl tracking-tight ${
                      cardTheme === 'brand'
                        ? 'text-white'
                        : cardTheme === 'dark'
                        ? 'text-sky-400'
                        : 'text-slate-900'
                    }`}
                  >
                    {cardTitle}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      cardTheme === 'brand'
                        ? 'text-emerald-200'
                        : cardTheme === 'dark'
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {cardDate || `UPDATED: ${todayFormatted}`}
                  </span>
                </div>

                {/* Custom Items */}
                {customItems.filter((ci) => selectedPlanIds.has(ci.id)).length > 0 && (
                  <div className="mb-4">
                    <div
                      className={`text-sm font-extrabold pb-1 mb-1 border-b ${
                        cardTheme === 'brand'
                          ? 'text-emerald-800 border-emerald-800 bg-emerald-50 px-2'
                          : cardTheme === 'dark'
                          ? 'text-sky-400 border-slate-800'
                          : 'text-black border-slate-900'
                      }`}
                    >
                      Special &amp; Custom Deals
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black">
                          <th className="text-left py-1 w-[35%]">Plan</th>
                          {showNormal && <th className="text-right py-1">Normal User</th>}
                          {showPremium && <th className="text-right py-1">Premium User</th>}
                          {showReferred && <th className="text-right py-1">Referred User</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {customItems
                          .filter((ci) => selectedPlanIds.has(ci.id))
                          .map((p) => (
                            <tr key={p.id} className="border-b border-dashed border-slate-200 dark:border-slate-800 font-bold">
                              <td className="py-1 text-left font-black text-emerald-800 dark:text-emerald-400">
                                {p.size_label}
                              </td>
                              {showNormal && (
                                <td className="py-1 text-right">₦{Math.round(p.selling_price).toLocaleString()}</td>
                              )}
                              {showPremium && (
                                <td className="py-1 text-right">₦{Math.round(p.premium_price).toLocaleString()}</td>
                              )}
                              {showReferred && (
                                <td className="py-1 text-right">₦{Math.round(p.referred_price).toLocaleString()}</td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Standard Catalog Groups */}
                {allGroups
                  .filter((g) => selectedNetworkIds.includes(g.service_id))
                  .map((grp) => {
                    const chosen = grp.plans.filter((p) => selectedPlanIds.has(p.id));
                    if (chosen.length === 0) return null;

                    return (
                      <div key={grp.group_key} className="mb-4">
                        <div
                          className={`text-sm font-extrabold pb-1 mb-1 border-b ${
                            cardTheme === 'brand'
                              ? 'text-emerald-800 border-emerald-800 bg-emerald-50 px-2'
                              : cardTheme === 'dark'
                              ? 'text-sky-400 border-slate-800'
                              : 'text-black border-slate-900'
                          }`}
                        >
                          {grp.group_title}
                        </div>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black">
                              <th className="text-left py-1 w-[35%]">Plan</th>
                              {showNormal && <th className="text-right py-1">Normal User</th>}
                              {showPremium && <th className="text-right py-1">Premium User</th>}
                              {showReferred && <th className="text-right py-1">Referred User</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {chosen.map((p) => (
                              <tr key={p.id} className="border-b border-dashed border-slate-200 dark:border-slate-800 font-bold">
                                <td className="py-1 text-left font-black text-emerald-800 dark:text-emerald-400">
                                  {p.size_label}
                                </td>
                                {showNormal && (
                                  <td className="py-1 text-right">₦{Math.round(p.selling_price).toLocaleString()}</td>
                                )}
                                {showPremium && (
                                  <td className="py-1 text-right">₦{Math.round(p.premium_price).toLocaleString()}</td>
                                )}
                                {showReferred && (
                                  <td className="py-1 text-right">₦{Math.round(p.referred_price).toLocaleString()}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}

                {/* Empty State */}
                {selectedPlanIds.size === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    No plans selected. Pick a preset on the left or select plans from the catalog!
                  </div>
                )}

                {/* Card Footer CTA */}
                <div
                  className={`mt-4 pt-3 text-center ${
                    cardTheme === 'paper'
                      ? 'border-t-2 border-slate-900'
                      : cardTheme === 'brand'
                      ? 'bg-emerald-800 text-white -mx-6 -mb-6 p-4 rounded-b-xl'
                      : 'border-t border-slate-800'
                  }`}
                >
                  <div
                    className={`font-black text-sm ${
                      cardTheme === 'brand'
                        ? 'text-amber-300'
                        : cardTheme === 'dark'
                        ? 'text-amber-400'
                        : 'text-slate-900'
                    }`}
                  >
                    {cardCtaTitle}
                  </div>
                  <div
                    className={`text-xs font-bold break-all mt-1 ${
                      cardTheme === 'brand'
                        ? 'text-white'
                        : cardTheme === 'dark'
                        ? 'text-sky-400'
                        : 'text-emerald-800'
                    }`}
                  >
                    {referralLink}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 px-4">
              💡 <em>Take a screenshot of the box above, or click <strong>Copy Image</strong> to paste directly into WhatsApp Web or Telegram!</em>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
