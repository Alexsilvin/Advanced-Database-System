import React from 'react';
import { Search, Bell, User, Cpu, ShoppingCart } from 'lucide-react';
import { TabType } from '../../types';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: TabType) => void;
  notificationsCount: number;
  bucketCount: number;
}

export default function Header({ searchTerm, onSearchChange, onTabChange, notificationsCount, bucketCount }: HeaderProps) {
  return (
    <header className="border-b border-neon-cyan/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
            <Cpu className="w-6 h-6 text-neon-cyan" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter glitch-text">
            NEON<span className="text-neon-magenta">GRID</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-96">
          <Search className="w-4 h-4 text-white/40 mr-2" />
          <input
            type="text"
            placeholder="SEARCH THE GRID..."
            className="bg-transparent border-none outline-none text-sm w-full font-mono text-white"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('notifications')}
            className="p-2 hover:bg-white/5 rounded-full relative"
            aria-label="Open notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-white/60" />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-magenta rounded-full shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
            )}
          </button>
          <button
            onClick={() => onTabChange('bucket')}
            className="p-2 hover:bg-white/5 rounded-full relative"
            aria-label="Open bucket"
            title="Bucket"
          >
            <ShoppingCart className="w-5 h-5 text-white/60" />
            {bucketCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-neon-magenta rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(255,0,255,0.8)]">
                {bucketCount > 9 ? '9+' : bucketCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-neon-magenta/20 border border-neon-magenta/40 flex items-center justify-center">
              <User className="w-4 h-4 text-neon-magenta" />
            </div>
            <span className="text-sm font-mono hidden sm:block">SYLVESTRE_01</span>
          </div>
        </div>
      </div>
    </header>
  );
}