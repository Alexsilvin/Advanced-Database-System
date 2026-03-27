import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Store, Library, Users, ShoppingCart, Bell } from 'lucide-react';
import { TabType } from '../../types';

interface QuickSwitchPaletteProps {
  open: boolean;
  activeTab: TabType;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
}

const ITEMS: Array<{ tab: Exclude<TabType, 'game-detail'>; label: string; hint: string; icon: React.ReactNode }> = [
  { tab: 'store', label: 'Store', hint: 'Browse and discover games', icon: <Store className="w-4 h-4" /> },
  { tab: 'library', label: 'Library', hint: 'View owned titles', icon: <Library className="w-4 h-4" /> },
  { tab: 'friends', label: 'Friends', hint: 'Open social contacts', icon: <Users className="w-4 h-4" /> },
  { tab: 'bucket', label: 'Bucket', hint: 'Review acquisition queue', icon: <ShoppingCart className="w-4 h-4" /> },
  { tab: 'notifications', label: 'Notifications', hint: 'Check signal feed', icon: <Bell className="w-4 h-4" /> },
];

export default function QuickSwitchPalette({ open, activeTab, onClose, onSelectTab }: QuickSwitchPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(
    () => ITEMS.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (filtered.length === 0 ? 0 : (prev + 1) % filtered.length));
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length));
      }

      if (event.key === 'Enter' && filtered[selectedIndex]) {
        event.preventDefault();
        onSelectTab(filtered[selectedIndex].tab);
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, selectedIndex, onClose, onSelectTab]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-80 bg-black/70 backdrop-blur-sm p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mx-auto mt-10 md:mt-20 w-full max-w-2xl border border-white/15 rounded-2xl bg-[#0a0a0a] shadow-[0_0_60px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Quick switch command palette"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-4 h-4 text-neon-cyan" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type to jump to a page..."
                className="w-full bg-transparent outline-none text-sm font-mono text-white placeholder:text-white/30"
              />
              <span className="text-[10px] font-mono text-white/30">ESC</span>
            </div>

            <div className="p-2 max-h-[55vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs font-mono text-white/35">No matching destinations found.</div>
              ) : (
                filtered.map((item, index) => {
                  const selected = index === selectedIndex;
                  const current = item.tab === activeTab;
                  return (
                    <button
                      key={item.tab}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => {
                        onSelectTab(item.tab);
                        onClose();
                      }}
                      className={`w-full text-left rounded-xl px-3 py-3 flex items-start gap-3 transition-colors ${selected ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'border border-transparent hover:bg-white/5'}`}
                    >
                      <div className={`mt-0.5 ${selected ? 'text-neon-cyan' : 'text-white/50'}`}>{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black tracking-tight ${selected ? 'text-neon-cyan' : 'text-white'}`}>
                          {item.label} {current ? <span className="text-[10px] font-mono text-white/35">(current)</span> : null}
                        </p>
                        <p className="text-[11px] font-mono text-white/40 mt-0.5">{item.hint}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
