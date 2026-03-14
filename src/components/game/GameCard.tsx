import React from 'react';
import { motion } from 'motion/react';
import { Game } from '../../types';

interface GameCardProps {
  game: Game;
  onBuy: () => void;
  onSelect: () => void;
  owned: boolean;
  onViewLibrary?: () => void;
  onSelectGame?: () => void;
}

export default function GameCard({ game, onBuy, onSelect, owned, onViewLibrary, onSelectGame }: GameCardProps) {
  const handleClick = () => {
    if (onSelectGame) {
      onSelectGame();
    } else {
      onSelect();
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={handleClick}
      className="group relative flex flex-col bg-[#121212] rounded-xl overflow-hidden border border-white/5 hover:border-neon-cyan/50 transition-colors duration-300 h-full cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent opacity-60" />

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
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLibrary?.();
                }}
                className={`text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded ${onViewLibrary ? 'cursor-pointer hover:bg-green-400/20' : ''}`}
              >
                OWNED
              </span>
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