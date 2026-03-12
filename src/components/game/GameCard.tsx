import React from 'react';
import { motion } from 'motion/react';
import { Game } from '../../types';
import { Zap } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onBuy: () => void;
  onSelect: () => void;
  owned: boolean;
}

export default function GameCard({ game, onBuy, onSelect, owned }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative flex flex-col bg-[#121212] rounded-xl overflow-hidden border border-white/5 hover:border-neon-cyan/50 transition-colors duration-300 h-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent opacity-60" />

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={owned}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${owned
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                : 'bg-neon-cyan text-black hover:scale-105 active:scale-95'
              }`}
            className={`p-4 rounded-full transition-transform active:scale-90 ${owned ? 'bg-green-500/20 text-green-400' : 'bg-white text-black hover:bg-neon-cyan'
              }`}
          >
            <Zap className={`w-6 h-6 ${owned ? 'opacity-50' : ''}`} />
          </button>
        </div>

        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-black tracking-widest text-white/70 uppercase">
          {game.category}
        </div>
      </div>

      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-sm tracking-tight line-clamp-1 group-hover:text-neon-cyan transition-colors">
          {game.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-white/40">Base Game</span>
          <div className="flex flex-col items-end">
            {owned ? (
              <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded">OWNED</span>
            ) : (
              <span className="text-sm font-black italic">
                ${game.price}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}