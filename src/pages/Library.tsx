import React from 'react';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';
import { Game, TabType } from '../types';
import LibraryItem from '../components/game/LibraryItem';

interface LibraryProps {
  games: Game[];
  library: number[];
  onTabChange: (tab: TabType) => void;
}

export default function Library({ games, library, onTabChange }: LibraryProps) {
  return (
    <motion.div 
      key="library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter">LOCAL_STORAGE</h2>
        <span className="text-xs font-mono text-white/40">{library.length} ITEMS DETECTED</span>
      </div>
      
      {library.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
          <Terminal className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/40 font-mono">NO GAMES DETECTED IN GRID_STORAGE</p>
          <button 
            onClick={() => onTabChange('store')}
            className="mt-4 text-neon-cyan hover:underline font-mono text-sm"
          >
            INITIALIZE STORE_PROTOCOL
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(games) ? games : []).filter(g => library.includes(g.id)).map(game => (
            <div key={game.id}>
              <LibraryItem game={game} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}