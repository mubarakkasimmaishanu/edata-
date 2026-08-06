import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useToast } from './Toast';
import PinScreen from './PinScreen';
import { 
  ChevronLeft, Check, Sparkles, ShieldCheck, Zap, 
  TrendingUp, HelpCircle, ChevronDown, Award, Users, 
  Headphones, ArrowRight, Lock, Wallet, Percent, DollarSign, RefreshCw 
} from 'lucide-react';

interface ResellerUpgradeProps {
  currentUser: UserProfile;
  onBack: () => void;
  onSuccess?: () => void;
  onNavigate?: (view: string) => void;
}

export default function ResellerUpgrade({ currentUser, onBack, onSuccess, onNavigate }: ResellerUpgradeProps) {
  const toast = useToast();
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [dailyVolume, setDailyVolume] = useState<number>(15); // Default 15 txns/day

  const upgradeFee = 5000;
  const userBalance = currentUser.walletBalance || 0;
  const hasEnoughBalance = userBalance >= upgradeFee;

  // Monthly profit/savings calculation: ~₦40 savings per data/airtime txn * dailyVolume * 30 days
  const estimatedMonthlyProfit = dailyVolume * 40 * 30;
  const daysToBreakEven = Math.ceil(upgradeFee / (dailyVolume * 40));

  const comparisonData = [
    { feature: 'MTN SME 1GB Data', basic: '₦300', reseller: '₦260 (Save ₦40)', highlight: true },
    { feature: 'Airtime Discount', basic: '0% Cashback', reseller: 'Up to 3.5% Cashback', highlight: true },
    { feature: 'Electricity Bill Fee', basic: '₦100 Service Fee', reseller: '₦0 Fee + 1.5% Rebate', highlight: true },
    { feature: 'Cable TV Subscription', basic: '₦100 Service Fee', reseller: '₦0 Fee + Cashback', highlight: true },
    { feature: 'Exam Result Pins', basic: 'Retail Price', reseller: 'Wholesale Agent Price', highlight: false },
    { feature: 'Referral Earnings', basic: '₦200 per user', reseller: '₦1,000 per upgrade (5x)', highlight: true },
    { feature: 'Developer API Access', basic: 'Disabled', reseller: 'Full API Integration', highlight: false },
    { feature: 'Customer Support', basic: 'Standard Queue', reseller: '24/7 VIP Priority Line', highlight: true },
  ];

  const rateSheet = [
    { category: 'Data Bundles', items: [
      { name: 'MTN SME 1GB', basic: '₦300', reseller: '₦260', discount: '13.3% OFF' },
      { name: 'Airtel 1GB', basic: '₦310', reseller: '₦270', discount: '12.9% OFF' },
      { name: 'Glo 1GB', basic: '₦300', reseller: '₦265', discount: '11.6% OFF' },
      { name: '9mobile 1GB', basic: '₦290', reseller: '₦250', discount: '13.7% OFF' },
    ]},
    { category: 'Airtime Top-Up', items: [
      { name: 'Glo Airtime', basic: '0% Cashback', reseller: '3.5% Cashback', discount: '3.5% Bonus' },
      { name: 'Airtel Airtime', basic: '0% Cashback', reseller: '3.0% Cashback', discount: '3.0% Bonus' },
      { name: '9mobile Airtime', basic: '0% Cashback', reseller: '3.0% Cashback', discount: '3.0% Bonus' },
      { name: 'MTN Airtime', basic: '0% Cashback', reseller: '2.5% Cashback', discount: '2.5% Bonus' },
    ]},
    { category: 'Bills & Scratch Cards', items: [
      { name: 'Electricity Bills', basic: '₦100 Fee', reseller: '₦0 Fee + 1.5% Rebate', discount: 'Save ₦100+' },
      { name: 'Cable TV (DSTV/GOTV)', basic: '₦100 Fee', reseller: '₦0 Fee + Instant Cashback', discount: 'Save ₦100+' },
      { name: 'WAEC Scratch Card', basic: '₦4,200', reseller: '₦3,800', discount: 'Save ₦400' },
      { name: 'NECO Scratch Card', basic: '₦1,350', reseller: '₦1,150', discount: 'Save ₦200' },
    ]}
  ];

  const faqs = [
    {
      q: 'Is the ₦5,000 upgrade fee a one-time payment?',
      a: 'Yes! The ₦5,000 fee is a one-time permanent payment. Your Reseller License never expires, and there are zero monthly or annual renewal fees.'
    },
    {
      q: 'How are reseller discounts applied?',
      a: 'Discounts are automatically deducted from your total checkout amount whenever you purchase airtime, data bundles, or pay utility bills.'
    },
    {
      q: 'Can I resell VTU services to customers at my own prices?',
      a: 'Absolutely! As a licensed reseller, you purchase at wholesale rates and sell to your customers at whatever retail price you set, keeping 100% of your profit.'
    },
    {
      q: 'What happens after I tap Upgrade Now?',
      a: 'The ₦5,000 upgrade fee will be deducted from your eData wallet balance, and your account tier will immediately change to Premium Reseller with instant access to wholesale rates.'
    },
    {
      q: 'What if my wallet balance is below ₦5,000?',
      a: 'You can tap the "Fund Wallet to Upgrade" button at the bottom of the page to add funds to your wallet via Bank Transfer or Card, then return here to complete your upgrade.'
    }
  ];

  if (showPinScreen) {
    return (
      <PinScreen
        mode="upgrade_pin"
        summary={{
          title: 'Reseller License Upgrade',
          subtitle: 'Permanent Wholesale Agent Rates',
          amount: upgradeFee,
          provider: 'eData VTU Platform',
          iconType: 'upgrade',
        }}
        onBack={() => setShowPinScreen(false)}
        onSuccess={() => {
          setShowPinScreen(false);
          if (onSuccess) onSuccess();
          onBack();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-lg mx-auto w-full pb-32">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Reseller Upgrade Details</h1>
            <p className="text-xs text-slate-400">Unlock Wholesale Agent Rates & Benefits</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black rounded-full uppercase tracking-wider">
          {currentUser.category || 'Basic User'}
        </span>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6">
        {/* ── Hero Banner Card ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-indigo-700 to-slate-950 rounded-3xl p-6 border border-sky-400/30 shadow-2xl space-y-4">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-sky-200 text-[10px] font-black rounded-full uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-amber-300" /> PERMANENT LIFETIME LICENSE
            </span>
            <span className="text-xs font-bold text-slate-300">eData VTU</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white leading-tight font-display">
              Become a Licensed Reseller Agent
            </h2>
            <p className="text-xs text-sky-100 font-medium">
              Start your VTU business or maximize savings on every single data, airtime, and bill transaction.
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-sky-200 uppercase font-bold tracking-wider block">License Upgrade Fee</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-display">₦5,000.00</span>
                <span className="text-[11px] text-sky-200 font-semibold">(One-time payment)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">Validity</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
                Lifetime Active
              </span>
            </div>
          </div>
        </div>

        {/* ── Key Highlights Strip ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-center space-y-1">
            <Percent className="w-5 h-5 text-sky-400 mx-auto" />
            <span className="text-xs font-black text-white block">Up to 15% OFF</span>
            <span className="text-[10px] text-slate-400 block">Wholesale Rates</span>
          </div>
          <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-center space-y-1">
            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto" />
            <span className="text-xs font-black text-white block">High Profit</span>
            <span className="text-[10px] text-slate-400 block">Keep 100% Margin</span>
          </div>
          <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto" />
            <span className="text-xs font-black text-white block">₦0 Renewal Fee</span>
            <span className="text-[10px] text-slate-400 block">One-time Payment</span>
          </div>
        </div>

        {/* ── Side-by-Side Comparison Table ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-extrabold text-white">Basic vs. Reseller Comparison</h3>
              <p className="text-[11px] text-slate-400">See exactly how much more you gain as a Reseller</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 bg-slate-950/80 border-b border-slate-700/80 p-3 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <div className="col-span-5">Feature / Service</div>
              <div className="col-span-3 text-center text-slate-400">Basic</div>
              <div className="col-span-4 text-right text-sky-400">Reseller</div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {comparisonData.map((row, idx) => (
                <div key={idx} className={`grid grid-cols-12 p-3 text-xs items-center ${row.highlight ? 'bg-sky-500/5' : ''}`}>
                  <div className="col-span-5 font-semibold text-slate-200 flex items-center gap-1.5">
                    {row.highlight && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    <span>{row.feature}</span>
                  </div>
                  <div className="col-span-3 text-center text-slate-400 font-medium text-[11px]">{row.basic}</div>
                  <div className="col-span-4 text-right font-bold text-emerald-400 text-[11px]">{row.reseller}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Interactive Savings & Profit Calculator ── */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Estimated Profit & Savings Calculator</h3>
              <p className="text-[11px] text-slate-400">Calculate how fast your ₦5,000 license pays for itself</p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Daily Transactions Volume:</span>
              <span className="font-black text-sky-400 font-mono text-sm">{dailyVolume} txns / day</span>
            </div>

            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={dailyVolume}
              onChange={(e) => setDailyVolume(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>5 (Light)</span>
              <span>25 (Medium)</span>
              <span>50+ (Heavy Agent)</span>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Est. Monthly Profit/Savings</span>
                <span className="text-lg font-black text-emerald-400 font-display block mt-0.5">
                  ₦{estimatedMonthlyProfit.toLocaleString('en-NG')}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Fee Recovered In</span>
                <span className="text-lg font-black text-sky-400 font-display block mt-0.5">
                  ~{daysToBreakEven} Days
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Wholesale Rate Sheet Breakdown ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-white">Wholesale Rate Sheet Details</h3>
            <span className="text-[11px] font-bold text-sky-400">Live Agent Pricing</span>
          </div>

          <div className="space-y-3">
            {rateSheet.map((cat, idx) => (
              <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">{cat.category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {cat.items.map((item, i) => (
                    <div key={i} className="p-2.5 bg-slate-900/80 border border-slate-700/50 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-white block line-clamp-1">{item.name}</span>
                      <div className="flex justify-between items-baseline text-[11px]">
                        <span className="text-slate-400 line-through text-[10px]">{item.basic}</span>
                        <span className="text-emerald-400 font-black">{item.reseller}</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded inline-block">
                        {item.discount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reseller Privileges Grid ── */}
        <section className="space-y-3">
          <h3 className="text-sm font-extrabold text-white px-1">Additional Agent Privileges</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-2xl space-y-2">
              <Award className="w-6 h-6 text-amber-400" />
              <h4 className="text-xs font-bold text-white">5x Referral Earnings</h4>
              <p className="text-[11px] text-slate-400">Earn ₦1,000 for every user who upgrades using your referral link.</p>
            </div>
            <div className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-2xl space-y-2">
              <Headphones className="w-6 h-6 text-sky-400" />
              <h4 className="text-xs font-bold text-white">VIP Priority Support</h4>
              <p className="text-[11px] text-slate-400">Direct fast-track WhatsApp line for immediate dispute resolution.</p>
            </div>
            <div className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-2xl space-y-2">
              <Zap className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xs font-bold text-white">Instant API Key</h4>
              <p className="text-[11px] text-slate-400">Automate VTU purchases directly on your own website or mobile app.</p>
            </div>
            <div className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-2xl space-y-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">Zero Maintenance Fee</h4>
              <p className="text-[11px] text-slate-400">Your reseller status never expires. No hidden charges or monthly quota.</p>
            </div>
          </div>
        </section>

        {/* ── Frequently Asked Questions ── */}
        <section className="space-y-3">
          <h3 className="text-sm font-extrabold text-white px-1">Frequently Asked Questions</h3>

          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/80 border border-slate-700/70 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === index ? 'rotate-180 text-sky-400' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-700/50 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Sticky Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-4 max-w-lg mx-auto shadow-2xl safe-bottom">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Your Wallet Balance:</span>
          </div>
          <span className={`text-xs font-black font-mono ${hasEnoughBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₦{userBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {hasEnoughBalance ? (
          <button
            onClick={() => setShowPinScreen(true)}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
          >
            <span>Proceed to Upgrade for ₦5,000.00</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-300 font-semibold text-center">
              Insufficient wallet balance. Please add ₦{(upgradeFee - userBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })} to upgrade.
            </div>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('fund');
                else onBack();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              <Wallet className="w-4 h-4" />
              <span>Fund Wallet Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
