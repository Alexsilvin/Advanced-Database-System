import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Zap } from 'lucide-react';
import { Game } from '../types';
import GameCard from '../components/game/GameCard';

interface StoreProps {
  games: Game[];
  library: number[];
  filteredGames: Game[];
  dbError: string | null;
  onAddToLibrary: (gameId: number) => void;
}

export default function Store({ games, library, filteredGames, dbError, onAddToLibrary }: StoreProps) {
  return (
    <motion.div 
      key="store"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="relative h-64 rounded-2xl overflow-hidden border border-neon-cyan/30 group">
        <img 
          src="https://picsum.photos/seed/cyberpunk/1200/600" 
          alt="Featured game banner for Ultra-Glitch: Revenge"
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-8 left-8 space-y-2">
          <span className="px-2 py-1 bg-neon-cyan text-black text-[10px] font-black uppercase tracking-tighter">Featured Release</span>
          <h2 className="text-4xl font-black tracking-tighter italic">ULTRA-GLITCH: REVENGE</h2>
          <p className="text-white/60 max-w-md text-sm">Experience the ultimate digital warfare in a world where reality is a bug.</p>
          <button className="mt-4 px-6 py-2 bg-white text-black font-black text-sm hover:bg-neon-cyan transition-colors flex items-center gap-2">
            <Zap className="w-4 h-4" />
            ACCESS NOW
          </button>
        </div>
      </div>
      
      {dbError && (
        <div className="p-6 border border-neon-magenta/30 bg-neon-magenta/5 rounded-2xl flex flex-col items-center gap-4">
          <Terminal className="w-12 h-12 text-neon-magenta" />
          <div className="text-center">
            <p className="text-neon-magenta font-black italic tracking-tighter">CRITICAL_ERROR: DATABASE_NOT_CONFIGURED</p>
            <p className="text-white/60 text-xs font-mono mt-2">
              The Grid requires a PostgreSQL connection to load the game catalog.
              <br />
              Please add <span className="text-neon-cyan">DATABASE_URL</span> to your Secrets.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <div key={game.id}>
            <GameCard 
              game={game} 
              onBuy={() => onAddToLibrary(game.id)}
              owned={library.includes(game.id)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}