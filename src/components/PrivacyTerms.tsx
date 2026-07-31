import React from 'react';
import { ArrowLeft, Shield, FileText, Lock, Mail, ExternalLink } from 'lucide-react';

interface PrivacyTermsProps {
  mode: 'privacy' | 'terms';
  onBack: () => void;
}

export default function PrivacyTerms({ mode, onBack }: PrivacyTermsProps) {
  const isPrivacy = mode === 'privacy';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto animate-fadeIn font-display">
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-all cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-center">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            {isPrivacy ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </h1>
          </div>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* ── Main Scrollable Container ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 space-y-5 pb-12">
        {/* Last Updated Banner */}
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3.5 text-center">
          <p className="text-[11px] font-black uppercase tracking-wider text-sky-400">
            Last Updated: June 2026 • eData Mobile Application
          </p>
        </div>

        {/* Dynamic Content Sections */}
        <div className="space-y-4">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </div>

        <div className="pt-6 text-center border-t border-slate-900 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            eData Mobile v2.2.0 • Verified Security & Encrypted
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-2.5">
      <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider font-display">{title}</h3>
      <div className="text-xs text-slate-300 leading-relaxed space-y-2 font-medium">
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
        <p className="font-black text-white">Personal Identity:</p>
        <p>• Full name, email address, and phone number during account creation.</p>
        <p>• Profile photo (if uploaded).</p>
        <p className="font-black text-white pt-1">Financial & Transaction Data:</p>
        <p>• Wallet balance, virtual bank account details (Moniepoint/KatPay), and complete transaction logs across Airtime, Data, Cable TV, Electricity, Exam Cards, and A2C.</p>
        <p className="font-black text-white pt-1">Security Credentials:</p>
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
          All network communications between eData Mobile and our servers are encrypted via HTTPS/TLS 1.3. Passwords and transaction PINs are stored securely with salted bcrypt password hashing algorithms and are never stored in plain text.
        </p>
      </Section>

      <Section title="5. Data Retention & Account Deletion">
        <p>
          Your personal data is retained for as long as your account remains active. You can request complete deletion of your account and personal data at any time via <strong className="text-white">Profile Settings &rarr; Delete Account</strong> within this app, or on our web portal at <code className="bg-slate-950 text-sky-400 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800">https://edata.com.ng/delete-account</code>. Upon deletion confirmation, your account will be immediately deactivated and permanently purged within 30 days.
        </p>
      </Section>

      <Section title="6. Contact Support">
        <p>For any privacy inquiries or security issues, contact our team:</p>
        <p className="text-sky-400 font-bold font-mono">Email: info@edata.com.ng</p>
        <p className="text-sky-400 font-bold font-mono">Website: https://edata.com.ng</p>
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
        <p className="text-sky-400 font-bold font-mono">Email: info@edata.com.ng</p>
        <p className="text-sky-400 font-bold font-mono">Website: https://edata.com.ng</p>
      </Section>
    </>
  );
}
