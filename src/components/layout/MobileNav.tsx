import React from 'react';
import { Gamepad2, Users, ShoppingBag, ShoppingCart, Bell } from 'lucide-react';
import { TabType } from '../../types';

interface MobileNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  bucketCount: number;
}

export default function MobileNav({ activeTab, onTabChange, bucketCount }: MobileNavProps) {
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
      <button
        onClick={() => onTabChange('bucket')}
        className={`relative ${activeTab === 'bucket' ? 'text-neon-cyan' : 'text-white/40'}`}
        aria-label="Open bucket"
        title="Bucket"
      >
        <ShoppingCart className="w-6 h-6" />
        {bucketCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-magenta rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_6px_rgba(255,0,255,0.8)]">
            {bucketCount > 9 ? '9+' : bucketCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('notifications')}
        className={`relative ${activeTab === 'notifications' ? 'text-neon-cyan' : 'text-white/40'}`}
        aria-label="Open notifications"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-neon-magenta rounded-full shadow-[0_0_6px_rgba(255,0,255,0.8)]" />
      </button>
    </div>
  );
}