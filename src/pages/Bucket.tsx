import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Trash2, Terminal, Zap } from 'lucide-react';
import { Game, TabType } from '../types';

interface BucketProps {
  games: Game[];
  bucket: number[];
  library: number[];
  onRemoveFromBucket: (gameId: number) => void;
  onAcquireAll: () => void;
  onTabChange: (tab: TabType) => void;
}

export default function Bucket({
  games,
  bucket,
  library,
  onRemoveFromBucket,
  onAcquireAll,
  onTabChange,
}: BucketProps) {
  const bucketGames = games.filter((g) => bucket.includes(g.id));
  const total = bucketGames.reduce((sum, g) => sum + g.price, 0);

  return (
    <motion.div
      key="bucket"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter">ACQUIRE_BUCKET</h2>
        <span className="text-xs font-mono text-white/40">{bucket.length} ITEMS QUEUED</span>
      </div>

      {bucket.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/40 font-mono">NO ITEMS IN ACQUISITION_QUEUE</p>
          <button
            onClick={() => onTabChange('store')}
            className="mt-4 text-neon-cyan hover:underline font-mono text-sm"
          >
            BROWSE STORE_PROTOCOL
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bucketGames.map((game) => (
              <div
                key={game.id}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-neon-cyan/30 transition-colors"
              >
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black italic tracking-tighter truncate">{game.title}</h3>
                  <p className="text-[10px] font-mono text-white/40 uppercase">{game.category}</p>
                </div>
                <span className="text-lg font-black text-neon-magenta italic shrink-0">
                  ${game.price}
                </span>
                <button
                  onClick={() => onRemoveFromBucket(game.id)}
                  className="p-2 text-white/20 hover:text-red-400 transition-colors shrink-0"
                  aria-label={`Remove ${game.title} from bucket`}
                  title="Remove from bucket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="neon-border rounded-2xl bg-black/40 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-white/60 uppercase tracking-widest">
                Total
              </span>
              <span className="text-3xl font-black italic text-neon-cyan">
                ${total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={onAcquireAll}
              className="w-full py-3 bg-neon-magenta text-white font-black italic tracking-tighter hover:bg-neon-magenta/80 active:scale-95 transition-all flex items-center justify-center gap-2 rounded-lg magenta-glow"
            >
              <Zap className="w-5 h-5" />
              ACQUIRE ALL
            </button>
            <button
              onClick={() => onTabChange('store')}
              className="w-full py-2 border border-white/10 text-white/40 hover:text-white hover:border-white/20 font-black italic text-sm tracking-tighter transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              CONTINUE BROWSING
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
