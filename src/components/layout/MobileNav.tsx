import React from 'react';
import { Gamepad2, Users, ShoppingBag, User } from 'lucide-react';
import { TabType } from '../../types';

interface MobileNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
      <button
        onClick={() => onTabChange('store')}
        className={activeTab === 'store' ? 'text-neon-cyan' : 'text-white/40'}
        aria-label="Open store"
        title="Store"
      >
        <ShoppingBag className="w-6 h-6" />
      </button>
      <button
        onClick={() => onTabChange('library')}
        className={activeTab === 'library' ? 'text-neon-cyan' : 'text-white/40'}
        aria-label="Open library"
        title="Library"
      >
        <Gamepad2 className="w-6 h-6" />
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={activeTab === 'friends' ? 'text-neon-cyan' : 'text-white/40'}
        aria-label="Open friends"
        title="Friends"
      >
        <Users className="w-6 h-6" />
      </button>
      <button className="text-white/40" aria-label="Open profile" title="Profile">
        <User className="w-6 h-6" />
      </button>
    </div>
  );
}