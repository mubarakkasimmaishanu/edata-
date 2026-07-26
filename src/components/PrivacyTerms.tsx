import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface PrivacyTermsProps {
  mode: 'privacy' | 'terms';
  onBack: () => void;
}

export default function PrivacyTerms({ mode, onBack }: PrivacyTermsProps) {
  const isPrivacy = mode === 'privacy';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="max-w-md mx-auto relative px-4 sm:px-6">

        {/* Header */}
        <header className="py-6 flex items-center gap-4 border-b border-slate-200/80 mb-6">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-200 flex items-center justify-center transition-colors shadow-xs active:scale-95"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isPrivacy ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}>
              {isPrivacy ? <Shield size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 font-display">
                {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
              </h1>
              <p className="text-[10px] text-sky-600 font-extrabold uppercase tracking-wider">eData Digital Solutions</p>
            </div>
          </div>
        </header>

        {/* Last Updated */}
        <div className="bg-sky-50/80 border border-sky-100/90 rounded-2xl p-3.5 flex items-center justify-between mb-6 shadow-xs">
          <p className="text-[10.5px] text-sky-800 leading-relaxed font-black uppercase tracking-wider font-display">
            Last Updated: June 2026 • eData Mobile Application
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </div>

        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-10 mb-4 font-display">
          eData Mobile v1.0.0 • Verified Digital Payments
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-2">
      <h3 className="text-[11px] font-black text-sky-600 uppercase tracking-wider mb-2 font-display">{title}</h3>
      <div className="text-xs text-slate-600 leading-relaxed space-y-2 font-medium">
        {children}
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <Section title="1. Introduction">
        <p>
          eData ("we", "our", "us") is dedicated to keeping your digital transaction data private and secure. This Privacy Policy outlines how we process, store, and safeguard your personal information when using our mobile app and API services.
        </p>
        <p>
          By creating an eData account or initiating transactions, you consent to the practices detailed in this document.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p className="font-extrabold text-slate-900">Personal Identity:</p>
        <p>• Full name, email address, and phone number during account creation.</p>
        <p>• Profile photo (if uploaded).</p>
        <p className="font-extrabold text-slate-900 pt-1">Financial & Transaction Data:</p>
        <p>• Wallet balance, virtual bank account details (Monnify/KatPay), and complete transaction logs across Airtime, Data, Cable TV, Electricity, Exam Cards, and A2C.</p>
        <p className="font-extrabold text-slate-900 pt-1">Security Credentials:</p>
        <p>• 4-Digit Transaction PINs (stored strictly using salted bcrypt password hashing algorithms).</p>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>• To process instant VTU top-ups, data bundles, and utility bill payments.</p>
        <p>• To verify transaction PINs and prevent unauthorized financial actions.</p>
        <p>• To issue dedicated virtual bank accounts for automated wallet funding.</p>
        <p>• To send instant purchase receipts, OTP verification codes, and security alerts.</p>
      </Section>

      <Section title="4. Security & Encryption">
        <p>
          All network communications between eData Mobile and our servers are encrypted via HTTPS/TLS 1.3. Passwords and transaction PINs are stored securely with bcrypt hashing and are never stored in plain text.
        </p>
      </Section>

      <Section title="5. Data Retention & Account Deletion">
        <p>
          Your personal data is retained for as long as your account remains active. You can request complete deletion of your account and personal data at any time via <strong>Profile Settings &rarr; Delete Account</strong> within this app, or on our web portal at <code className="bg-slate-100 text-sky-700 px-1.5 py-0.5 rounded font-mono text-[11px]">https://edata.com.ng/delete-account</code>. Upon deletion confirmation, your account will be immediately deactivated and permanently purged within 30 days.
        </p>
      </Section>

      <Section title="6. Contact Support">
        <p>For any privacy inquiries or security issues, contact our team:</p>
        <p className="text-sky-600 font-extrabold font-mono">Email: info@edata.com.ng</p>
        <p className="text-sky-600 font-extrabold font-mono">Website: https://edata.com.ng</p>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Section title="1. Acceptance of Terms">
        <p>
          By downloading, accessing, or making transactions through eData Mobile, you agree to comply with these Terms of Service. If you disagree with any part of these terms, please discontinue using the service.
        </p>
      </Section>

      <Section title="2. Account Security & PIN">
        <p>• You are responsible for keeping your account password and 4-digit transaction PIN confidential.</p>
        <p>• Any purchase or payment authorized with your correct PIN is considered final and valid.</p>
        <p>• You must be at least 18 years old or operate under parental supervision.</p>
      </Section>

      <Section title="3. Wallet & Transaction Policy">
        <p>• Wallet balances are non-interest bearing and can be funded via virtual transfer or online checkout.</p>
        <p>• Service purchases (Airtime, Data, Electricity, Cable TV, Exam Pins) are processed automatically with priority provider failover.</p>
        <p>• In the event of network operator timeouts where funds are debited without service delivery, automatic wallet refunds are triggered sequentially.</p>
      </Section>

      <Section title="4. Account Termination">
        <p>
          eData reserves the right to suspend accounts involved in fraudulent activity. You may also terminate your account anytime using the in-app Delete Account utility.
        </p>
      </Section>

      <Section title="5. Contact Info">
        <p className="text-sky-600 font-extrabold font-mono">Email: info@edata.com.ng</p>
        <p className="text-sky-600 font-extrabold font-mono">Website: https://edata.com.ng</p>
      </Section>
    </>
  );
}
