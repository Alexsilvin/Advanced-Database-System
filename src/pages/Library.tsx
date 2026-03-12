import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Terminal, LayoutGrid, List, ShieldCheck, Clock,
  Heart, Download, Server, Lock, User
} from 'lucide-react';
import { Game, TabType, Friend } from '../types';
import LibraryItem from '../components/game/LibraryItem';

interface LibraryProps {
  games: Game[];
  library: number[];
  onTabChange: (tab: TabType) => void;
}

type FilterType = 'all' | 'recent' | 'favorites' | 'installed' | 'collections';
type SortType = 'recent' | 'name' | 'hours';

const mockFriends: Friend[] = [
  { username: 'VOID_WALKER', status: 'playing', game: 'NEON STRIKE' },
  { username: 'GLITCH_GHOST', status: 'online' },
  { username: 'CYBER_PUNK_88', status: 'offline' },
  { username: 'NULL_POINTER', status: 'online' },
];

const categoryFilters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all',         label: 'All Games',       icon: <LayoutGrid className="w-4 h-4" /> },
  { key: 'recent',      label: 'Recently Played',  icon: <Clock className="w-4 h-4" /> },
  { key: 'favorites',   label: 'Favorites',        icon: <Heart className="w-4 h-4" /> },
  { key: 'installed',   label: 'Installed',        icon: <Download className="w-4 h-4" /> },
  { key: 'collections', label: 'Collections',      icon: <Server className="w-4 h-4" /> },
];

export default function Library({ games, library, onTabChange }: LibraryProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<SortType>('recent');
  const [installedGames, setInstalledGames] = useState<number[]>([]);

  const ownedGames = (Array.isArray(games) ? games : []).filter(g => library.includes(g.id));

  const filteredGames =
    activeFilter === 'installed'
      ? ownedGames.filter(g => installedGames.includes(g.id))
      : ownedGames;

  const sortedGames = [...filteredGames].sort((a, b) =>
    sortOrder === 'name' ? a.title.localeCompare(b.title) : 0
  );

  const handleInstalled = (id: number) =>
    setInstalledGames(prev => (prev.includes(id) ? prev : [...prev, id]));

  return (
    <motion.div
      key="library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-6"
    >
      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:flex flex-col gap-6 w-48 shrink-0">
        {/* Rank badge */}
        <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-neon-cyan/10 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-neon-cyan" />
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Rank</p>
              <p className="text-xs font-black text-neon-cyan tracking-tight">ELITE_OPS</p>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <nav className="flex flex-col gap-1">
          <p className="text-[9px] text-white/30 uppercase font-bold mb-2 px-2 tracking-widest">
            Categories
          </p>
          {categoryFilters.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2.5 py-2 rounded-lg text-left transition-all text-xs font-medium ${
                activeFilter === key
                  ? 'bg-neon-cyan/10 text-neon-cyan border-l-2 border-neon-cyan pl-2.5 pr-3'
                  : 'text-white/50 hover:bg-white/5 hover:text-white px-3'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* Promo */}
        <div className="mt-auto p-4 bg-black/40 border border-neon-magenta/20 rounded-2xl">
          <p className="text-[9px] text-neon-magenta font-black uppercase tracking-widest mb-1">
            Grid Pass
          </p>
          <p className="text-[10px] text-white/40 leading-relaxed mb-3">
            20% off new releases this cycle.
          </p>
          <button className="w-full py-1.5 bg-neon-magenta/10 border border-neon-magenta/30 text-neon-magenta text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-neon-magenta/20 transition-all">
            ACTIVATE
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header row */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tighter italic flex items-center gap-2">
              <span className="text-neon-cyan">//</span> MY_LIBRARY
            </h2>
            <p className="text-[11px] font-mono text-white/40 mt-0.5">
              {library.length} ITEM{library.length !== 1 ? 'S' : ''} DETECTED IN GRID_STORAGE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortType)}
              className="bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono px-2 py-1.5 focus:outline-none focus:border-neon-cyan/50 text-white/60 cursor-pointer"
            >
              <option value="recent">Sort: Recent</option>
              <option value="name">Sort: Name A-Z</option>
              <option value="hours">Sort: Hours</option>
            </select>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'grid' ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-white/30 hover:text-white'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'list' ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-white/30 hover:text-white'
                }`}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Games area */}
        {library.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
            <Terminal className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/40 font-mono text-sm">NO GAMES DETECTED IN GRID_STORAGE</p>
            <button
              onClick={() => onTabChange('store')}
              className="mt-4 text-neon-cyan hover:underline font-mono text-xs"
            >
              INITIALIZE STORE_PROTOCOL
            </button>
          </div>
        ) : sortedGames.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/30 font-mono text-xs uppercase">No items in this category</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sortedGames.map(game => (
              <LibraryItem
                key={game.id}
                game={game}
                viewMode="grid"
                onInstalled={handleInstalled}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedGames.map(game => (
              <LibraryItem
                key={game.id}
                game={game}
                viewMode="list"
                onInstalled={handleInstalled}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right Sidebar ── */}
      <aside className="hidden xl:flex flex-col gap-6 w-56 shrink-0">
        {/* Friends activity */}
        <div>
          <h4 className="text-[9px] text-white/30 uppercase font-bold mb-4 tracking-widest">
            GRID_CONTACTS
          </h4>
          <div className="flex flex-col gap-4">
            {mockFriends.map(friend => (
              <div
                key={friend.username}
                className={`flex items-center gap-3 ${friend.status === 'offline' ? 'opacity-50' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/40" />
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-void ${
                      friend.status === 'playing'
                        ? 'bg-neon-cyan shadow-[0_0_6px_rgba(0,243,255,0.8)]'
                        : friend.status === 'online'
                        ? 'bg-green-500'
                        : 'bg-white/20'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{friend.username}</p>
                  <p
                    className={`text-[10px] font-mono truncate ${
                      friend.status === 'playing'
                        ? 'text-neon-cyan'
                        : friend.status === 'online'
                        ? 'text-green-400'
                        : 'text-white/30'
                    }`}
                  >
                    {friend.status === 'playing' ? `Playing: ${friend.game}` : friend.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade card */}
        <div className="mt-auto p-5 bg-black/40 border border-neon-cyan/20 rounded-2xl flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-neon-cyan/10 rounded-xl flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-neon-cyan" />
          </div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-1">GRID_PASS</h5>
          <p className="text-[10px] text-white/40 leading-relaxed mb-4">
            Early access, exclusive skins &amp; double rewards on every acquisition.
          </p>
          <button className="w-full py-2.5 bg-neon-cyan text-black font-black text-[10px] uppercase tracking-tighter rounded-xl hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all">
            ACTIVATE_NODE
          </button>
        </div>
      </aside>
    </motion.div>
  );
}