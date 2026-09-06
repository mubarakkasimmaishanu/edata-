import React, { useState, useCallback } from 'react';
import { Transaction } from '../types';
import {
  ChevronLeft,
  Search,
  Download,
  Clock,
  Copy,
  Check,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Share2,
  BookOpen,
  Zap,
  Tag,
  Hash,
  KeyRound,
} from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import { formatMoney } from '../utils/formatters';
import { fetchSupportInfo, readCachedSupportInfo } from '../utils/supportInfo';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

export interface ExtractedPinCard {
  pin?: string;
  serial?: string;
  label?: string;
}

/**
 * Intelligent helper to extract exam cards / PINs and Serial numbers
 * from structured fields, arrays, JSON payloads, or raw description strings.
 * Automatically deduplicates identical PINs and serials.
 */
export function extractExamCards(tx: Transaction): ExtractedPinCard[] {
  const cards: ExtractedPinCard[] = [];
  const seenPairs = new Set<string>();

  const addUnique = (pin?: string, serial?: string) => {
    const cleanPin = pin ? String(pin).trim() : undefined;
    const cleanSerial = serial ? String(serial).trim() : undefined;
    if (!cleanPin && !cleanSerial) return;
    const key = `${cleanPin || ''}:::${cleanSerial || ''}`;
    if (seenPairs.has(key)) return;
    seenPairs.add(key);
    cards.push({ pin: cleanPin, serial: cleanSerial });
  };

  // 1. If explicitly provided via pins array
  if (Array.isArray(tx.pins) && tx.pins.length > 0) {
    tx.pins.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        addUnique(
          item.pin || item.token || item.code,
          item.serial_number || item.serial || item.serial_no || item.serialNo
        );
      } else if (item) {
        addUnique(String(item), undefined);
      }
    });
    if (cards.length > 0) return cards;
  }

  // 2. Check direct transaction properties
  if (tx.serialNumber || tx.pin) {
    addUnique(tx.pin || undefined, tx.serialNumber || undefined);
  }

  // 3. Search in description text without duplicate string concatenation
  const text = (tx.rawDescription || tx.productName || '').trim();
  if (text) {
    // Try JSON parsing
    if (text.includes('{') || text.includes('[')) {
      try {
        const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              addUnique(
                item.pin || item.token || item.code,
                item.serial_number || item.serial || item.serial_no || item.serialNo
              );
            });
          } else if (typeof parsed === 'object' && parsed !== null) {
            addUnique(
              parsed.pin || parsed.token || parsed.code,
              parsed.serial_number || parsed.serial || parsed.serial_no || parsed.serialNo
            );
          }
        }
      } catch {}
    }

    if (cards.length === 0) {
      // Regex parsing for Serial Numbers and PINs
      const serialMatches = Array.from(
        text.matchAll(/(?:serial(?:\s*no|\s*number)?|s\/n|sn)[:\s\-]+([a-zA-Z0-9\-]+)/gi)
      ).map((m) => m[1]);
      const pinMatches = Array.from(
        text.matchAll(/(?:pin(?:\s*code|\s*token|\s*number)?|token(?:\s*pin)?|\bpin\b)[:\s\-]+([a-zA-Z0-9\-]+)/gi)
      ).map((m) => m[1]);

      const maxLen = Math.max(serialMatches.length, pinMatches.length);
      for (let i = 0; i < maxLen; i++) {
        addUnique(pinMatches[i], serialMatches[i]);
      }
    }
  }

  // 4. Fallback for Exam Token if phoneOrMeter is a pin
  if (cards.length === 0 && tx.type === 'Exam Token') {
    if (
      tx.phoneOrMeter &&
      tx.phoneOrMeter !== tx.reference &&
      !/^0[789][01]\d{8}$/.test(tx.phoneOrMeter)
    ) {
      addUnique(tx.phoneOrMeter, undefined);
    }
  }

  // Add labels only if multiple distinct cards exist
  if (cards.length > 1) {
    cards.forEach((c, idx) => {
      c.label = `Card ${idx + 1}`;
    });
  }

  return cards;
}

// Memoized row for smooth list scrolling
interface TransactionRowProps {
  tx: Transaction;
  onOpen: (tx: Transaction) => void;
}

const TransactionRow = React.memo(function TransactionRow({ tx, onOpen }: TransactionRowProps) {
  const statusChip =
    tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
    tx.status === 'Failed' ? 'bg-rose-500/10 text-rose-400' :
    'bg-amber-500/10 text-amber-400';
  const statusText =
    tx.status === 'Completed' ? 'text-emerald-400' :
    tx.status === 'Failed' ? 'text-rose-400' :
    'text-amber-400';
  const emoji =
    tx.type === 'Airtime' ? '📱' :
    tx.type === 'Data' ? '📶' :
    tx.type === 'Cable TV' ? '📺' :
    tx.type === 'Electricity' ? '⚡' :
    tx.type === 'Exam Token' ? '📝' :
    tx.type === 'Wallet Funding' ? '💰' :
    tx.type === 'A2C' ? '🔄' :
    '💳';

  return (
    <div
      onClick={() => onOpen(tx)}
      className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-98"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${statusChip}`}>
          {emoji}
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white line-clamp-1">{tx.productName || tx.type}</h4>
          <p className="text-[11px] text-slate-400">{tx.date || 'Recent'} • Ref: {tx.reference || tx.id}</p>
        </div>
      </div>

      <div className="text-right">
        <span className="text-xs font-bold text-slate-100">{formatMoney(tx.amount)}</span>
        <span className={`block text-[10px] font-medium ${statusText}`}>
          {tx.status}
        </span>
      </div>
    </div>
  );
});

export default function TransactionHistory({ transactions, onBack, onNavigate }: TransactionHistoryProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleOpenReceipt = useCallback((tx: Transaction) => setActiveReceipt(tx), []);

  const categories = ['All', 'Airtime', 'Data', 'Cable TV', 'Electricity', 'Exam Token', 'Funding', 'A2C'];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory =
      categoryFilter === 'All' ||
      tx.type === categoryFilter ||
      (categoryFilter === 'Funding' && tx.type === 'Wallet Funding');
    const matchesSearch =
      (tx.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.phoneOrMeter || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyText = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied!`);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handleReportIssue = async (tx: Transaction) => {
    const refCode = tx.reference || tx.id;
    const msg = `Hello eData Support, I need assistance with transaction Ref: ${refCode}\nService: ${tx.productName || tx.type}\nTarget Number: ${tx.phoneOrMeter || 'N/A'}\nAmount: ${formatMoney(tx.amount)}\nDate: ${tx.date || 'Recent'}\nStatus: ${tx.status}`;
    const info = await fetchSupportInfo();
    const whatsappNum = info.whatsapp || readCachedSupportInfo().whatsapp;
    if (!whatsappNum) {
      toast.error('Support contact is not configured yet. Please try again shortly.');
      return;
    }
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRetryTransaction = (tx: Transaction) => {
    setActiveReceipt(null);
    if (!onNavigate) return;
    const typeLower = (tx.type || '').toLowerCase();
    if (typeLower.includes('airtime')) {
      onNavigate('airtime');
    } else if (typeLower.includes('data')) {
      onNavigate('data');
    } else if (typeLower.includes('cable')) {
      onNavigate('cable');
    } else if (typeLower.includes('electricity')) {
      onNavigate('electricity');
    } else if (typeLower.includes('exam')) {
      onNavigate('exams');
    } else {
      onNavigate('dashboard');
    }
  };

  const downloadPDFReceipt = async (tx: Transaction) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: [80, 135] });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 80, 135, 'F');

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('eData Mobile', 40, 12, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('TRANSACTION RECEIPT', 40, 17, { align: 'center' });

    doc.setDrawColor(51, 65, 85);
    doc.line(8, 22, 72, 22);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(tx.amount, { useCode: true }), 40, 32, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(
      tx.status === 'Completed' ? 52 : tx.status === 'Failed' ? 244 : 245,
      tx.status === 'Completed' ? 211 : tx.status === 'Failed' ? 63 : 158,
      tx.status === 'Completed' ? 153 : tx.status === 'Failed' ? 94 : 11
    );
    doc.text(`Status: ${tx.status}`, 40, 38, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    let y = 48;
    const addRow = (label: string, value: string) => {
      doc.text(label, 10, y);
      doc.setTextColor(255, 255, 255);
      doc.text(value, 70, y, { align: 'right' });
      doc.setTextColor(148, 163, 184);
      y += 6;
    };

    addRow('Service:', tx.type || 'VTU');
    addRow('Product:', (tx.productName || 'Purchase').substring(0, 24));

    // Add serial number & pin if available in PDF
    const cards = extractExamCards(tx);
    if (cards.length > 0) {
      cards.forEach((c, idx) => {
        const prefix = cards.length > 1 ? `[${idx + 1}] ` : '';
        if (c.serial) addRow(`${prefix}Serial:`, c.serial);
        if (c.pin) addRow(`${prefix}PIN:`, c.pin);
      });
    }

    if (tx.elecToken) {
      addRow('Token:', tx.elecToken);
    }

    if (tx.phoneOrMeter && tx.phoneOrMeter !== tx.reference) {
      addRow('Target:', tx.phoneOrMeter);
    }

    addRow('Reference:', tx.reference || tx.id);
    addRow('Date:', tx.date || 'Today');

    doc.save(`eData_Receipt_${tx.reference || tx.id}.pdf`);
  };

  // Extracted cards for active receipt
  const activeCards = activeReceipt ? extractExamCards(activeReceipt) : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-36">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Transaction History</h1>
            <p className="text-xs text-slate-400">{transactions.length} total transactions</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Search & Category Filter */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, phone, or service..."
              className="w-full bg-slate-800 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 bg-slate-800/40 border border-slate-800 rounded-2xl text-center">
            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No matching transactions found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id || tx.reference}
                tx={tx}
                onOpen={handleOpenReceipt}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modern, Simple & Better Transaction Details Modal ── */}
      {activeReceipt && (
        <BottomSheet
          open={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title="Transaction Details"
        >
          <div className="space-y-4 py-1">
            {/* 1. Hero Amount & Status Card */}
            <div
              className={`p-4 rounded-2xl border text-center transition-colors ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200/90 text-slate-900'
                  : 'bg-slate-900/90 border-slate-800 text-white'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-500">
                Amount Paid
              </span>
              <h3 className="text-2xl font-black mt-0.5 tracking-tight">
                {formatMoney(activeReceipt.amount)}
              </h3>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full text-xs font-bold border">
                {activeReceipt.status === 'Completed' ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Completed</span>
                  </span>
                ) : activeReceipt.status === 'Failed' ? (
                  <span className="inline-flex items-center gap-1.5 text-rose-500">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Failed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-500">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Pending</span>
                  </span>
                )}
              </div>

              {/* Status Alert Explanations */}
              {activeReceipt.status === 'Pending' && (
                <div
                  className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 text-left ${
                    theme === 'light'
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0 text-amber-500" />
                  <span className="text-[11px] leading-tight">
                    Transaction is currently processing. If recipient hasn't received value, tap Report Issue below.
                  </span>
                </div>
              )}
              {activeReceipt.status === 'Failed' && (
                <div
                  className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 text-left ${
                    theme === 'light'
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="text-[11px] leading-tight">
                    Transaction could not be completed. Your wallet balance has not been deducted or was refunded.
                  </span>
                </div>
              )}
            </div>

            {/* 2. Highlight Card: Exam Cards / PINs & Serial Numbers */}
            {activeCards.length > 0 && (
              <div className="space-y-2.5">
                {activeCards.map((card, idx) => {
                  const pinKey = `card-pin-${idx}`;
                  const serialKey = `card-serial-${idx}`;
                  const isPinCopied = copiedKey === pinKey;
                  const isSerialCopied = copiedKey === serialKey;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                        theme === 'light'
                          ? 'bg-white border-slate-200 shadow-xs text-slate-900'
                          : 'bg-slate-800/70 border-slate-700/80 text-white'
                      }`}
                    >
                      {card.label && (
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700/60">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {card.label}
                          </span>
                        </div>
                      )}

                      {/* Serial Number Row with Rounded Border */}
                      {card.serial && (
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            theme === 'light'
                              ? 'bg-slate-50/80 border-slate-200'
                              : 'bg-slate-900/60 border-slate-700/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              Serial Number
                            </span>
                            <span className="font-mono font-bold text-sm tracking-wider text-sky-600 dark:text-sky-300 break-all select-all">
                              {card.serial}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(card.serial!, 'Serial Number', serialKey)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                              isSerialCopied
                                ? 'bg-emerald-500 text-white'
                                : theme === 'light'
                                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isSerialCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Serial
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* PIN Row with Rounded Border */}
                      {card.pin && (
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            theme === 'light'
                              ? 'bg-emerald-50/50 border-emerald-200/80'
                              : 'bg-emerald-950/20 border-emerald-500/30'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                              PIN Code
                            </span>
                            <span className="font-mono font-black text-base tracking-widest text-emerald-600 dark:text-emerald-400 break-all select-all">
                              {card.pin}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(card.pin!, 'PIN Code', pinKey)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
                              isPinCopied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                            }`}
                          >
                            {isPinCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy PIN
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Highlight Card: Electricity Token (if Electricity) */}
            {activeReceipt.elecToken && (
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                  theme === 'light'
                    ? 'bg-white border-amber-200/80 shadow-xs text-slate-900'
                    : 'bg-slate-800/70 border-amber-500/30 text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Electricity Token
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    theme === 'light'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-900/60 border-slate-700/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Token (Meter Token)
                    </span>
                    <span className="font-mono font-black text-sm md:text-base tracking-widest text-emerald-600 dark:text-emerald-400 break-all select-all">
                      {activeReceipt.elecToken}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeReceipt.elecToken!, 'Token', 'elec-token')}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      copiedKey === 'elec-token'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {copiedKey === 'elec-token' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Token
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 4. Key-Value Transaction Info Table */}
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-colors ${
                theme === 'light'
                  ? 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200'
              }`}
            >
              {/* Service */}
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium">Service</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeReceipt.type}</span>
              </div>

              {/* Description / Product Name */}
              <div className="flex justify-between items-start py-0.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium shrink-0">Description</span>
                <span className="font-semibold text-right max-w-[65%] text-slate-800 dark:text-slate-100">
                  {activeReceipt.productName}
                </span>
              </div>

              {/* Target / Recipient / Phone (if applicable) */}
              {activeReceipt.phoneOrMeter &&
                activeReceipt.phoneOrMeter !== activeReceipt.reference &&
                activeCards.length === 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-400 font-medium">
                      {activeReceipt.type === 'Electricity'
                        ? 'Meter No.'
                        : activeReceipt.type === 'Cable TV'
                        ? 'Smartcard'
                        : activeReceipt.type === 'Exam Token'
                        ? 'Recipient'
                        : 'Phone / Target'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {activeReceipt.phoneOrMeter}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(activeReceipt.phoneOrMeter, 'Target Number', 'target-num')
                        }
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          copiedKey === 'target-num'
                            ? 'text-emerald-500 bg-emerald-500/10'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                        }`}
                        title="Copy"
                      >
                        {copiedKey === 'target-num' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

              {/* Reference */}
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium">Reference</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {activeReceipt.reference || activeReceipt.id}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        activeReceipt.reference || activeReceipt.id,
                        'Reference',
                        'ref-code'
                      )
                    }
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      copiedKey === 'ref-code'
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                    }`}
                    title="Copy Reference"
                  >
                    {copiedKey === 'ref-code' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400 font-medium">Date & Time</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeReceipt.date || 'Recent'}
                </span>
              </div>
            </div>

            {/* 5. Clean Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleReportIssue(activeReceipt)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20 active:scale-98"
              >
                <MessageCircle className="w-4 h-4" /> Report Issue / Contact Support
              </button>

              {(activeReceipt.status === 'Failed' || activeReceipt.status === 'Pending') &&
                onNavigate && (
                  <button
                    type="button"
                    onClick={() => handleRetryTransaction(activeReceipt)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-900/20 active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4" /> Retry Transaction
                  </button>
                )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => downloadPDFReceipt(activeReceipt)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border active:scale-98 ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" /> PDF Receipt
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cardsInfo = activeCards
                      .map(
                        (c, i) =>
                          `${c.label || `Card ${i + 1}`}:${c.serial ? `\nSerial: ${c.serial}` : ''}${
                            c.pin ? `\nPIN: ${c.pin}` : ''
                          }`
                      )
                      .join('\n\n');
                    const text = `eData Transaction Receipt\nService: ${activeReceipt.type}\nAmount: ${formatMoney(
                      activeReceipt.amount
                    )}\nStatus: ${activeReceipt.status}\nRef: ${
                      activeReceipt.reference || activeReceipt.id
                    }\nDate: ${activeReceipt.date}${cardsInfo ? `\n\n${cardsInfo}` : ''}${
                      activeReceipt.elecToken ? `\nToken: ${activeReceipt.elecToken}` : ''
                    }`;
                    if (navigator.share) {
                      navigator.share({ title: 'Transaction Receipt', text }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success('Receipt details copied to clipboard!');
                    }
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border active:scale-98 ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Share Receipt
                </button>
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
