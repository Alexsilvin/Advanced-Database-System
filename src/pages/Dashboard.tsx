import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Users, ShoppingCart, Zap, TrendingUp, Crown, Clock, Download } from 'lucide-react';
import { Game, GameId, TabType } from '../types';
import { formatPrice } from '../utils';

interface DashboardProps {
  username: string;
  libraryCount: number;
  bucketCount: number;
  games: Game[];
  library: GameId[];
  onTabChange: (tab: TabType) => void;
}

export default function Dashboard({ username, libraryCount, bucketCount, games, library, onTabChange }: DashboardProps) {
  const recentGames = games.filter((g) => library.includes(g.id)).slice(0, 3);
  const stats = [
    { icon: Gamepad2, label: 'GAMES OWNED', value: libraryCount, color: 'text-neon-cyan' },
    { icon: Users, label: 'FRIENDS ONLINE', value: 0, color: 'text-neon-magenta' },
    { icon: ShoppingCart, label: 'IN BUCKET', value: bucketCount, color: 'text-yellow-400' },
    { icon: TrendingUp, label: 'TOTAL PLAYTIME', value: '0H', color: 'text-green-400' },
  ];

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12"
    >
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative p-8 border-2 border-neon-cyan/30 rounded-2xl bg-linear-to-r from-neon-cyan/10 to-neon-magenta/10 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(45deg,transparent_25%,rgba(0,243,255,0.2)_25%,rgba(0,243,255,0.2)_50%,transparent_50%,transparent_75%,rgba(0,243,255,0.2)_75%,rgba(0,243,255,0.2))] bg-size-[40px_40px]" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-neon-magenta" />
              <h1 className="text-3xl font-black italic tracking-tighter">
                WELCOME BACK, <span className="text-neon-cyan uppercase">{username}</span>
              </h1>
            </div>
            <p className="text-sm text-white/60 font-mono">Your retro gaming headquarters awaits</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neon-cyan font-mono uppercase tracking-widest mb-1">STATUS</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-black text-green-400">ONLINE</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-3xl font-black italic ${stat.color}`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button
          onClick={() => onTabChange('store')}
          className="p-6 border-2 border-neon-cyan/30 rounded-2xl bg-neon-cyan/5 hover:border-neon-cyan/60 hover:bg-neon-cyan/10 transition-all text-left group"
        >
          <Zap className="w-6 h-6 text-neon-cyan mb-3 group-hover:animate-pulse" />
          <h3 className="text-sm font-black italic tracking-tight mb-1">BROWSE CATALOG</h3>
          <p className="text-xs text-white/50 font-mono">Discover new retro titles</p>
        </button>

        <button
          onClick={() => onTabChange('bucket')}
          className="p-6 border-2 border-neon-magenta/30 rounded-2xl bg-neon-magenta/5 hover:border-neon-magenta/60 hover:bg-neon-magenta/10 transition-all text-left group"
        >
          <ShoppingCart className="w-6 h-6 text-neon-magenta mb-3 group-hover:animate-pulse" />
          <h3 className="text-sm font-black italic tracking-tight mb-1">YOUR BUCKET</h3>
          <p className="text-xs text-white/50 font-mono">
            {bucketCount} item{bucketCount !== 1 ? 's' : ''} ready to acquire
          </p>
        </button>

        <button
          onClick={() => onTabChange('friends')}
          className="p-6 border-2 border-yellow-400/30 rounded-2xl bg-yellow-400/5 hover:border-yellow-400/60 hover:bg-yellow-400/10 transition-all text-left group"
        >
          <Users className="w-6 h-6 text-yellow-400 mb-3 group-hover:animate-pulse" />
          <h3 className="text-sm font-black italic tracking-tight mb-1">GRID CONTACTS</h3>
          <p className="text-xs text-white/50 font-mono">Connect with other players</p>
        </button>
      </motion.div>

      {/* Your Library Preview */}
      {recentGames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
              <span className="w-1 h-6 bg-neon-cyan inline-block skew-x-[-15deg]" />
              YOUR LIBRARY
            </h2>
            <button
              onClick={() => onTabChange('library')}
              className="text-xs font-mono text-white/40 hover:text-neon-cyan transition-colors"
            >
              VIEW ALL ({libraryCount})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentGames.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="group rounded-2xl overflow-hidden border border-white/10 hover:border-neon-cyan/50 transition-all"
              >
                <div className="relative h-32 overflow-hidden bg-black">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black to-transparent" />
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-green-400/20 text-green-400 text-[10px] font-black rounded border border-green-400/40">
                      OWNED
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-black italic tracking-tight line-clamp-1 mb-1">{game.title}</h3>
                  <p className="text-xs text-neon-cyan font-mono uppercase tracking-widest mb-3">{game.category}</p>
                  <button className="w-full py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-black italic hover:bg-neon-cyan/20 transition-all rounded">
                    <Download className="w-3 h-3 inline mr-1" /> PLAY NOW
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upcoming Releases */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
            <span className="w-1 h-6 bg-neon-magenta inline-block skew-x-[-15deg]" />
            TRENDING THIS WEEK
          </h2>
        </div>

        <div className="space-y-2">
          {games.slice(0, 3).map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.05 }}
              className="p-4 border border-white/10 rounded-xl bg-white/5 hover:border-neon-magenta/30 hover:bg-white/10 transition-all flex items-center gap-4 group cursor-pointer"
            >
              <img
                src={game.image}
                alt={game.title}
                className="w-12 h-12 rounded object-cover border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black italic tracking-tight line-clamp-1">{game.title}</h3>
                <p className="text-xs text-white/40 font-mono">{game.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-neon-magenta italic">{formatPrice(game.price)}</p>
                <p className="text-xs text-white/40 font-mono">
                  {game.rating} rating
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-4 border border-white/10 rounded-xl bg-white/5 flex items-start gap-3"
      >
        <Clock className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black italic mb-1">PLATFORM UPDATES</p>
          <p className="text-xs text-white/50 font-mono">New games added weekly and social features coming soon. Join our Discord for exclusive announcements.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
