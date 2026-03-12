import React from 'react';
import { Gamepad2, Users, ShoppingBag, LogOut } from 'lucide-react';
import { TabType } from '../../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav className="hidden lg:flex flex-col gap-2 w-64">
      <NavButton 
        active={activeTab === 'store'} 
        onClick={() => onTabChange('store')}
        icon={<ShoppingBag className="w-5 h-5" />}
        label="THE STORE"
      />
      <NavButton 
        active={activeTab === 'library'} 
        onClick={() => onTabChange('library')}
        icon={<Gamepad2 className="w-5 h-5" />}
        label="MY LIBRARY"
      />
      <NavButton 
        active={activeTab === 'friends'} 
        onClick={() => onTabChange('friends')}
        icon={<Users className="w-5 h-5" />}
        label="GRID FRIENDS"
      />
      <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
        <div className="p-4 rounded-xl bg-linear-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/20">
          <p className="text-[10px] font-mono text-neon-cyan mb-1 uppercase tracking-widest">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
        <button className="flex items-center gap-3 px-4 py-2 text-white/40 hover:text-red-400 transition-colors text-sm font-mono">
          <LogOut className="w-4 h-4" />
          DISCONNECT
        </button>
      </div>
    </nav>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
        active 
          ? 'bg-neon-cyan text-black font-black shadow-[0_0_20px_rgba(0,243,255,0.3)]' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`${active ? 'text-black' : 'text-neon-cyan group-hover:scale-110 transition-transform'}`}>
        {icon}
      </span>
      <span className="text-sm tracking-tighter italic">{label}</span>
    </button>
  );
}