import React, { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { ChevronLeft, Search, Download, Clock, Copy, MessageCircle, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
// jsPDF (594 KB) is dynamically imported inside `downloadPDFReceipt` so it
// only ships to users who actually download a receipt. Keeps cold-start
// bundle ~750 KB lighter (jsPDF + its DOMPurify dependency).
import BottomSheet from './BottomSheet';
import { useToast } from './Toast';

import { formatMoney } from '../utils/formatters';
import { api } from '../services/api';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

// Memoized row — the list can be long, and every keystroke in the search
// input triggers a re-render of the parent. Without memo, all rows would
// re-reconcile even though only the filtered set changed. `React.memo`
// short-circuits rows whose `tx` prop is reference-identical and whose
// `onOpen` handler is stable (the parent wraps it in useCallback).
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
    tx.type === 'Airtime' ? '📞' :
    tx.type === 'Data' ? '📡' :
    tx.type === 'Cable TV' ? '📺' :
    '⚡';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Stable handler passed to memoized rows so their `onOpen` prop is
  // reference-identical across renders — otherwise React.memo can never
  // short-circuit.
  const handleOpenReceipt = useCallback((tx: Transaction) => setActiveReceipt(tx), []);

  const categories = ['All', 'Airtime', 'Data', 'Cable TV', 'Electricity', 'Exam Token', 'A2C'];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory = categoryFilter === 'All' || tx.type === categoryFilter;
    const matchesSearch =
      (tx.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.phoneOrMeter || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success('Transaction reference copied to clipboard!');
  };

  const handleReportIssue = async (tx: Transaction) => {
    const refCode = tx.reference || tx.id;
    const msg = `Hello eData Support, I need assistance with transaction Ref: ${refCode}\nService: ${tx.productName || tx.type}\nTarget Number: ${tx.phoneOrMeter || 'N/A'}\nAmount: ${formatMoney(tx.amount)}\nDate: ${tx.date || 'Recent'}\nStatus: ${tx.status}`;
    let whatsappNum = '2348104530781';
    try {
      const res = await api.getSupportInfo();
      if (res?.success && res?.data?.whatsapp) {
        whatsappNum = res.data.whatsapp;
      }
    } catch {}
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
    } else {
      onNavigate('dashboard');
    }
  };

  const downloadPDFReceipt = async (tx: Transaction) => {
    // Dynamic import — jsPDF only loads when the user actually taps download.
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: [80, 130] });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 80, 130, 'F');

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
    doc.setTextColor(tx.status === 'Completed' ? 52 : tx.status === 'Failed' ? 244 : 245, tx.status === 'Completed' ? 211 : tx.status === 'Failed' ? 63 : 158, tx.status === 'Completed' ? 153 : tx.status === 'Failed' ? 94 : 11);
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
    addRow('Product:', tx.productName || 'Purchase');
    addRow('Target:', tx.phoneOrMeter || 'N/A');
    addRow('Reference:', tx.reference || tx.id);
    addRow('Date:', tx.date || 'Today');

    doc.save(`eData_Receipt_${tx.reference || tx.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-20">
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

      {/* Receipt Modal */}
      {activeReceipt && (
        <BottomSheet
          open={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title="Transaction Details"
        >
          <div className="space-y-4 py-2">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="text-center">
                <span className="text-[10px] uppercase text-sky-400 font-semibold tracking-wider">Amount Paid</span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{formatMoney(activeReceipt.amount)}</h3>
                <span className={`inline-block px-3 py-1 mt-1 rounded-full text-[11px] font-bold border ${
                  activeReceipt.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  activeReceipt.status === 'Failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {activeReceipt.status}
                </span>
              </div>

              {/* Status explanation alert */}
              {activeReceipt.status === 'Pending' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>This transaction is currently processing with the carrier provider. If value is not received, report the issue to support below.</span>
                </div>
              )}
              {activeReceipt.status === 'Failed' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>This transaction failed to complete. Your wallet was not charged or has been automatically refunded.</span>
                </div>
              )}
              {activeReceipt.status === 'Completed' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Transaction completed. If the recipient hasn't received value, tap Report Issue below to contact support immediately.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between items-center"><span className="text-slate-400">Service</span><span className="text-white font-medium">{activeReceipt.type}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Description</span><span className="text-white font-medium">{activeReceipt.productName}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Target</span><span className="text-white font-medium">{activeReceipt.phoneOrMeter}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reference</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sky-400 font-mono font-bold">{activeReceipt.reference || activeReceipt.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyReference(activeReceipt.reference || activeReceipt.id)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Copy Reference"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Date</span><span className="text-white font-medium">{activeReceipt.date}</span></div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleReportIssue(activeReceipt)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20"
              >
                <MessageCircle className="w-4 h-4" /> Report Issue / Contact Support
              </button>

              {(activeReceipt.status === 'Failed' || activeReceipt.status === 'Pending') && onNavigate && (
                <button
                  onClick={() => handleRetryTransaction(activeReceipt)}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-900/20"
                >
                  <RotateCcw className="w-4 h-4" /> Retry Transaction
                </button>
              )}

              <button
                onClick={() => downloadPDFReceipt(activeReceipt)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" /> Download PDF Receipt
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
