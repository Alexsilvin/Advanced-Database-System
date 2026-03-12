import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Zap, Tag } from 'lucide-react';
import { Game } from '../../types';

interface GameDetailModalProps {
  game: Game | null;
  owned: boolean;
  inBucket: boolean;
  onClose: () => void;
  onAcquire: (gameId: number) => void;
  onAddToBucket: (gameId: number) => void;
}

export default function GameDetailModal({
  game,
  owned,
  inBucket,
  onClose,
  onAcquire,
  onAddToBucket,
}: GameDetailModalProps) {
  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="neon-border rounded-2xl bg-black/95 overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header image */}
            <div className="relative h-56 shrink-0">
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/60 border border-white/20 rounded-full text-white/60 hover:text-white transition-colors"
                aria-label="Close game details"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                {game.category}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-3xl font-black tracking-tighter italic">{game.title}</h2>
                <p className="text-white/60 text-sm font-mono mt-3 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CATEGORY', value: game.category },
                  { label: 'GRID_ID', value: `#${String(game.id).padStart(4, '0')}` },
                  { label: 'STATUS', value: owned ? 'OWNED' : 'AVAILABLE' },
                  { label: 'RATING', value: 'GR-18' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      {label}
                    </p>
                    <p
                      className={`text-sm font-black italic mt-0.5 ${
                        label === 'STATUS' && owned ? 'text-green-400' : 'text-white'
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price + Actions */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-3xl font-black italic text-neon-magenta">
                  ${game.price}
                </span>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {!owned ? (
                    <>
                      <button
                        onClick={() => onAddToBucket(game.id)}
                        disabled={inBucket}
                        className={`px-4 py-2 text-xs font-black flex items-center gap-2 rounded-lg border transition-all ${
                          inBucket
                            ? 'border-neon-cyan/30 text-neon-cyan/50 cursor-default'
                            : 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 active:scale-95'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {inBucket ? 'IN BUCKET' : 'ADD TO BUCKET'}
                      </button>
                      <button
                        onClick={() => {
                          onAcquire(game.id);
                          onClose();
                        }}
                        className="px-4 py-2 bg-neon-cyan text-black text-xs font-black flex items-center gap-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                      >
                        <Zap className="w-4 h-4" />
                        ACQUIRE
                      </button>
                    </>
                  ) : (
                    <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-black rounded-lg">
                      OWNED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
