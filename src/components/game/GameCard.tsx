import React from 'react';
import { Game } from '../../types';

interface GameCardProps {
  game: Game;
  onBuy: () => void;
  owned: boolean;
}

export default function GameCard({ game, onBuy, owned }: GameCardProps) {
  return (
    <div className="neon-border rounded-xl overflow-hidden bg-black/40 flex flex-col group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={game.image} 
          alt={game.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono">
          {game.category}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-black tracking-tighter italic mb-1">{game.title}</h3>
        <p className="text-xs text-white/60 line-clamp-2 mb-4 font-mono">{game.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-black text-neon-magenta italic">${game.price}</span>
          <button 
            onClick={onBuy}
            disabled={owned}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              owned 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default' 
                : 'bg-neon-cyan text-black hover:scale-105 active:scale-95'
            }`}
          >
            {owned ? 'OWNED' : 'ACQUIRE'}
          </button>
        </div>
      </div>
    </div>
  );
}