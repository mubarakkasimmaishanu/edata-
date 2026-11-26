import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import {
  X, Copy, Download, Share2, Sparkles, Check,
  Camera, Eye, Layers, Palette, Maximize2, ExternalLink
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import html2canvas from 'html2canvas';

export interface DailyPriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
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

export default function DailyPriceListModal({ isOpen, onClose, currentUser }: DailyPriceListModalProps) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [networks, setNetworks] = useState<NetworkMeta[]>([]);
  const [allGroups, setAllGroups] = useState<PlanGroup[]>([]);
  const [todayFormatted, setTodayFormatted] = useState('');
  const [referralLink, setReferralLink] = useState('https://edata.com.ng/join');
  const [roleLabel, setRoleLabel] = useState('Standard Partner');
  const [referralCode, setReferralCode] = useState('');

  // Filtering states
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<number[]>([27]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<number>>(new Set());
  const [activePreset, setActivePreset] = useState<string>('ceo-mtn');

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
    if (isOpen) {
      fetchPriceListData();
    }
  }, [isOpen]);

  const fetchPriceListData = async () => {
    setLoading(true);
    try {
      const res = await api.getPriceList();
      if (res && res.success && res.data) {
        setNetworks(res.data.networks || []);
        setAllGroups(res.data.groups || []);
        setTodayFormatted(res.data.today || '');
        if (res.data.referral) {
          setReferralLink(res.data.referral.referral_link || 'https://edata.com.ng/join');
          setRoleLabel(res.data.referral.role_label || 'Partner');
          setReferralCode(res.data.referral.referral_code || '');
        }

        // Apply CEO format default
        applyPreset('ceo-mtn', res.data.groups || []);
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
        const titleLower = grp.group_title.toLowerCase();
        if (grp.service_id === 27 && (titleLower.includes('7-day') || titleLower.includes('30-day'))) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
    } else if (presetKey === 'mtn-sme') {
      setSelectedNetworkIds([27]);
      groups.forEach((grp) => {
        if (grp.service_id === 27 && grp.group_title.toLowerCase().includes('sme')) {
          grp.plans.forEach((p) => newSelected.add(p.id));
        }
      });
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
    const anyUnchecked = grp.plans.some((p) => !selectedPlanIds.has(p.id));
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      grp.plans.forEach((p) => {
        if (anyUnchecked) next.add(p.id);
        else next.delete(p.id);
      });
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
          // Fallback to downloading
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
    let text = `🔥 *eData Current Price List* 🔥\n`;
    text += `📅 _Updated: ${todayFormatted}_\n\n`;

    let hasAny = false;
    allGroups.forEach((grp) => {
      if (!selectedNetworkIds.includes(grp.service_id)) return;
      const chosen = grp.plans.filter((p) => selectedPlanIds.has(p.id));
      if (chosen.length === 0) return;

      hasAny = true;
      text += `📶 *${grp.group_title}*\n`;
      chosen.forEach((p) => {
        const parts: string[] = [];
        if (showNormal) parts.push(`Normal: ₦${Math.round(p.selling_price)}`);
        if (showPremium) parts.push(`Premium: ₦${Math.round(p.premium_price)}`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                Daily Price List Generator
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Marketing
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official marketing rates &amp; screenshot graphic card for WhatsApp Status &amp; Groups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Two Columns: Controls & Live Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Controls Panel (5 cols) */}
          <div className="lg:col-span-5 p-5 space-y-5 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
            
            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                ⚡ Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                      activePreset === p.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Filter */}
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
                      className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: net.color }} />
                      {net.brand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing Tiers to Show */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                💰 Pricing Columns
              </label>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
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

            {/* Individual Plans Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  📦 Included Plans ({selectedPlanIds.size} Selected)
                </label>
              </div>
              <div className="max-h-48 overflow-y-auto p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                {allGroups
                  .filter((g) => selectedNetworkIds.includes(g.service_id))
                  .map((grp) => (
                    <div key={grp.group_key} className="space-y-1">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white">
                        <span>{grp.group_title}</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(grp)}
                          className="text-[10px] text-emerald-600 hover:underline"
                        >
                          Toggle
                        </button>
                      </div>
                      <div className="space-y-1 pl-1">
                        {grp.plans.map((p) => {
                          const isChecked = selectedPlanIds.has(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-750 px-1 rounded cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePlan(p.id)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{p.size_label}</span>
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                ₦{p.selling_price}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Referral Link & Attribution */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                🔗 Personalized Referral Link
              </label>
              <input
                type="text"
                value={referralLink}
                onChange={(e) => setReferralLink(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                👤 Auto-bound to: <strong>{roleLabel}</strong> {referralCode && `(${referralCode})`}
              </span>
            </div>

            {/* Visual Theme Style */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                🎨 Card Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'paper', label: '📄 Paper (CEO)' },
                  { key: 'brand', label: '🌿 Emerald' },
                  { key: 'dark', label: '🌙 Dark Mode' },
                ].map((th) => (
                  <button
                    key={th.key}
                    type="button"
                    onClick={() => setCardTheme(th.key as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      cardTheme === th.key
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Preview & Screenshot Panel (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col items-center justify-start bg-slate-100 dark:bg-slate-950 overflow-y-auto">
            
            {/* Top Export Toolbar */}
            <div className="w-full max-w-[460px] flex flex-wrap items-center justify-center gap-2 mb-4">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={copyingImage}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Copy className="w-4 h-4" />
                {copyingImage ? 'Generating...' : 'Copy Image (1-Click)'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Saving...' : 'PNG'}
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppText}
                className="px-3.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <FaWhatsapp className="w-4 h-4" />
                {copiedText ? 'Copied!' : 'WhatsApp Text'}
              </button>
            </div>

            {/* THE RENDERED GRAPHIC CARD (Screenshot Canvas) */}
            <div className="w-full flex justify-center py-2">
              <div
                ref={cardRef}
                style={{
                  width: '440px',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '24px 20px',
                  borderRadius: '14px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  ...(cardTheme === 'paper'
                    ? {
                        backgroundColor: '#ffffff',
                        backgroundImage: 'repeating-linear-gradient(#ffffff, #ffffff 31px, #e2e8f0 32px)',
                        border: '2px solid #0f172a',
                        color: '#0f172a',
                      }
                    : cardTheme === 'brand'
                    ? {
                        backgroundColor: '#ffffff',
                        border: '3px solid #00531a',
                        color: '#0f172a',
                      }
                    : {
                        backgroundColor: '#0f172a',
                        border: '2px solid #334155',
                        color: '#ffffff',
                      }),
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    textAlign: 'center',
                    paddingBottom: '10px',
                    borderBottom: cardTheme === 'paper' ? '2px solid #0f172a' : cardTheme === 'brand' ? '2px solid #00531a' : '1px solid #334155',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      letterSpacing: '-0.5px',
                      color: cardTheme === 'dark' ? '#38bdf8' : cardTheme === 'brand' ? '#00531a' : '#000000',
                    }}
                  >
                    eData Current Price
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: cardTheme === 'dark' ? '#94a3b8' : '#64748b',
                      marginTop: '3px',
                    }}
                  >
                    Updated: {todayFormatted || 'Today'}
                  </div>
                </div>

                {/* Card Tables */}
                <div>
                  {allGroups
                    .filter((g) => selectedNetworkIds.includes(g.service_id))
                    .map((grp) => {
                      const chosenPlans = grp.plans.filter((p) => selectedPlanIds.has(p.id));
                      if (chosenPlans.length === 0) return null;

                      return (
                        <div key={grp.group_key} style={{ marginBottom: '16px' }}>
                          <div
                            style={{
                              fontSize: '17px',
                              fontWeight: 800,
                              color: cardTheme === 'dark' ? '#38bdf8' : cardTheme === 'brand' ? '#00531a' : '#000000',
                              borderBottom: cardTheme === 'paper' ? '1.5px solid #0f172a' : cardTheme === 'brand' ? '2px solid #00531a' : '1px solid #334155',
                              paddingBottom: '4px',
                              marginBottom: '6px',
                            }}
                          >
                            {grp.group_title}
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', fontSize: '13px', fontWeight: 800, padding: '6px 4px', borderBottom: '1.5px solid #64748b', color: cardTheme === 'dark' ? '#94a3b8' : '#1e293b' }}>
                                  Plan
                                </th>
                                {showNormal && (
                                  <th style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800, padding: '6px 4px', borderBottom: '1.5px solid #64748b', color: cardTheme === 'dark' ? '#94a3b8' : '#1e293b' }}>
                                    Normal User
                                  </th>
                                )}
                                {showPremium && (
                                  <th style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800, padding: '6px 4px', borderBottom: '1.5px solid #64748b', color: cardTheme === 'dark' ? '#94a3b8' : '#1e293b' }}>
                                    Premium User
                                  </th>
                                )}
                                {showReferred && (
                                  <th style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800, padding: '6px 4px', borderBottom: '1.5px solid #64748b', color: cardTheme === 'dark' ? '#94a3b8' : '#1e293b' }}>
                                    Referred User
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {chosenPlans.map((p) => (
                                <tr key={p.id}>
                                  <td
                                    style={{
                                      textAlign: 'left',
                                      fontSize: '15px',
                                      fontWeight: 900,
                                      padding: '6px 4px',
                                      color: cardTheme === 'dark' ? '#38bdf8' : '#00531a',
                                      borderBottom: cardTheme === 'paper' ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                                    }}
                                  >
                                    {p.size_label}
                                  </td>
                                  {showNormal && (
                                    <td
                                      style={{
                                        textAlign: 'right',
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        padding: '6px 4px',
                                        color: cardTheme === 'dark' ? '#ffffff' : '#000000',
                                        borderBottom: cardTheme === 'paper' ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                                      }}
                                    >
                                      ₦{Math.round(p.selling_price).toLocaleString()}
                                    </td>
                                  )}
                                  {showPremium && (
                                    <td
                                      style={{
                                        textAlign: 'right',
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        padding: '6px 4px',
                                        color: cardTheme === 'dark' ? '#ffffff' : '#000000',
                                        borderBottom: cardTheme === 'paper' ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                                      }}
                                    >
                                      ₦{Math.round(p.premium_price).toLocaleString()}
                                    </td>
                                  )}
                                  {showReferred && (
                                    <td
                                      style={{
                                        textAlign: 'right',
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        padding: '6px 4px',
                                        color: cardTheme === 'dark' ? '#ffffff' : '#000000',
                                        borderBottom: cardTheme === 'paper' ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                                      }}
                                    >
                                      ₦{Math.round(p.referred_price).toLocaleString()}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                </div>

                {/* Card Footer CTA */}
                <div
                  style={{
                    marginTop: '18px',
                    paddingTop: '14px',
                    borderTop: cardTheme === 'paper' ? '2px solid #0f172a' : cardTheme === 'brand' ? '2px solid #00531a' : '1px solid #334155',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 900,
                      color: cardTheme === 'dark' ? '#facc15' : cardTheme === 'brand' ? '#00531a' : '#000000',
                    }}
                  >
                    Signup in 30 seconds
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: cardTheme === 'dark' ? '#38bdf8' : '#00531a',
                      marginTop: '4px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {referralLink}
                  </div>
                </div>

              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 max-w-sm">
              💡 Take a screenshot of the card above, or click <strong>Copy Image</strong> to paste directly into WhatsApp or Telegram.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
