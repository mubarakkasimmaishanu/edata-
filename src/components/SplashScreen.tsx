import React from 'react';
import edataLogo from '../assets/edata_logo.png';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0b1b2f] via-[#0e243d] to-[#07111e] text-white selection:bg-sky-500 overflow-hidden font-sans">

      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Spacer */}
      <div className="w-full pt-12" />

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center text-center px-6 z-10 space-y-6 max-w-sm">
        {/* Glowing Logo Frame */}
        <div className="relative group">
          {/* Animated Glow Backing */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-blue-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

          <div className="relative bg-[#0d2138]/90 border border-sky-400/30 p-5 rounded-3xl shadow-2xl shadow-sky-500/30 backdrop-blur-md">
            <img 
              src={edataLogo} 
              alt="eData Logo" 
              className="w-20 h-20 object-contain rounded-2xl drop-shadow-md transition-transform duration-500 hover:scale-105" 
            />
          </div>
        </div>

        {/* Brand Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight font-display flex items-center justify-center gap-0.5">
            <span className="text-sky-400 font-extrabold">e</span>
            <span className="text-white font-extrabold">Data</span>
          </h1>
          <p className="text-sky-200/90 text-sm font-medium tracking-wide">
            Instant VTU & Utility Payments
          </p>
        </div>

        {/* Short Quote / Tagline */}
        <div className="bg-sky-950/40 border border-sky-400/20 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-inner">
          <p className="text-xs font-medium text-sky-100 italic leading-relaxed">
            “Fast, reliable & effortless digital payments right at your fingertips.”
          </p>
        </div>
      </div>

      {/* Bottom Loader & Footer */}
      <div className="pb-14 z-10 flex flex-col items-center space-y-4">
        {/* Beautiful Custom Spinner */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Ring */}
          <div className="w-10 h-10 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin" />
          {/* Inner Glowing Center */}
          <div className="absolute w-3 h-3 bg-sky-400 rounded-full shadow-lg shadow-sky-400/80 animate-ping" />
        </div>

        {/* Loading Text */}
        <p className="text-[11px] font-semibold text-sky-300/70 uppercase tracking-widest animate-pulse">
          Securing Connection...
        </p>
      </div>

    </div>
  );
}
