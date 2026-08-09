import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, Phone, Mail, ChevronDown, MapPin } from 'lucide-react';
import { api } from '../services/api';

interface HelpSupportProps {
  onBack: () => void;
}

export default function HelpSupport({ onBack }: HelpSupportProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [support, setSupport] = useState({
    phone: '08104530781',
    email: 'info@edata.com.ng',
    address: 'No 24 Basawa Road Kaduna, Kaduna State',
    whatsapp: '2348104530781'
  });

  useEffect(() => {
    let mounted = true;
    api.getSupportInfo()
      .then(res => {
        if (mounted && res?.success && res?.data) {
          setSupport({
            phone: res.data.phone || '08104530781',
            email: res.data.email || 'info@edata.com.ng',
            address: res.data.address || 'No 24 Basawa Road Kaduna, Kaduna State',
            whatsapp: res.data.whatsapp || '2348104530781'
          });
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => { mounted = false; };
  }, []);

  const faqs = [
    {
      q: 'How long does a data or airtime topup take?',
      a: 'Topups are processed automatically in real-time. Delivery usually takes less than 10 seconds.'
    },
    {
      q: 'What should I do if my transaction fails but money is debited?',
      a: 'If a transaction fails due to network issues, your eData wallet is automatically refunded instantly.'
    },
    {
      q: 'How do I fund my wallet via Bank Transfer?',
      a: 'Navigate to Fund Wallet from your dashboard and copy your dedicated virtual account number.'
    },
    {
      q: 'How can I reset my 4-digit Transaction PIN?',
      a: 'Go to Profile > Security > Change Transaction PIN or use the Reset PIN link.'
    }
  ];

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
            <h1 className="text-base font-bold text-white">Help & Support</h1>
            <p className="text-xs text-slate-400">24/7 Customer Care Assistance</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Contact Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => window.open(`https://wa.me/${support.whatsapp}`, '_blank')}
            className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">WhatsApp Support</span>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5">{support.phone}</span>
          </button>

          <button
            onClick={() => window.open(`tel:${support.phone}`, '_self')}
            className="p-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Call Line</span>
            <span className="text-[11px] text-indigo-400 font-semibold mt-0.5">{support.phone}</span>
          </button>

          <button
            onClick={() => window.open(`mailto:${support.email}`, '_blank')}
            className="p-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Email Helpdesk</span>
            <span className="text-[10px] text-slate-300 mt-0.5 truncate max-w-full">{support.email}</span>
          </button>
        </div>

        {/* Office Address Card */}
        {support.address && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Head Office Address</h4>
              <p className="text-xs text-slate-300 mt-0.5">{support.address}</p>
            </div>
          </div>
        )}

        {/* FAQs Section */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-3.5 flex items-center justify-between text-left text-xs font-semibold text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-sky-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-3.5 pb-3.5 pt-0 text-xs text-slate-300 border-t border-slate-700/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
