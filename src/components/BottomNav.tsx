import React from 'react';
import { Home, Layers, Headphones, User } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 h-16 bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 shadow-2xl shadow-slate-950/80 rounded-[2rem] flex justify-around items-center px-3 z-50 max-w-lg mx-auto safe-bottom animate-slide-up">
      {navItems.map((item) => {
        const isActive = activeView === item.id || (item.id === 'services' && ['services', 'airtime', 'data', 'cable', 'electricity', 'exams', 'a2c', 'fund'].includes(activeView));
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-spring group cursor-pointer ${
              isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 bg-sky-500/15 border border-sky-500/30 rounded-2xl -z-10 animate-scale-in" />
            )}
            
            <Icon className={`w-5.5 h-5.5 transition-transform group-hover:-translate-y-0.5 ${isActive ? 'stroke-[2.5] text-sky-400' : 'stroke-[1.8]'}`} />
            <span className={`text-[10.5px] tracking-tight font-display ${isActive ? 'font-black uppercase text-sky-400' : 'font-semibold text-slate-400'}`}>
              {item.label}
            </span>

            {isActive && (
              <span className="absolute -bottom-0.5 w-1 h-1 bg-sky-400 rounded-full animate-pulse shadow-sm shadow-sky-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
