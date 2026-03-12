import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Download, 
  Users, 
  ShoppingBag, 
  Play, 
  Search, 
  Bell, 
  User,
  Cpu,
  Zap,
  Terminal,
  LogOut
} from 'lucide-react';

interface Game {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'friends'>('store');
  const [games, setGames] = useState<Game[]>([]);
  const [library, setLibrary] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    fetchGames();
    // Random glitch effect
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGames(data);
        setDbError(null);
      } else {
        console.error('API returned non-array data:', data);
        setGames([]);
        if (data.error) setDbError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch games', err);
      setGames([]);
      setDbError('NETWORK_FAILURE: GRID_OFFLINE');
      setLoading(false);
    }
  };

  const addToLibrary = (gameId: number) => {
    if (!library.includes(gameId)) {
      setLibrary([...library, gameId]);
    }
  };

  const filteredGames = Array.isArray(games) 
    ? games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className={`min-h-screen flex flex-col relative ${isGlitching ? 'glitch-active' : ''}`}>
      <div className="scanline" />
      
      {/* Header */}
      <header className="border-b border-neon-cyan/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
              <Cpu className="w-6 h-6 text-neon-cyan" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter glitch-text">
              NEON<span className="text-neon-magenta">GRID</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-96">
            <Search className="w-4 h-4 text-white/40 mr-2" />
            <input 
              type="text" 
              placeholder="SEARCH THE GRID..." 
              className="bg-transparent border-none outline-none text-sm w-full font-mono text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-white/5 rounded-full relative"
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-white/60" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-magenta rounded-full shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-neon-magenta/20 border border-neon-magenta/40 flex items-center justify-center">
                <User className="w-4 h-4 text-neon-magenta" />
              </div>
              <span className="text-sm font-mono hidden sm:block">SYLVESTRE_01</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        {/* Sidebar Nav */}
        <nav className="hidden lg:flex flex-col gap-2 w-64">
          <NavButton 
            active={activeTab === 'store'} 
            onClick={() => setActiveTab('store')}
            icon={<ShoppingBag className="w-5 h-5" />}
            label="THE STORE"
          />
          <NavButton 
            active={activeTab === 'library'} 
            onClick={() => setActiveTab('library')}
            icon={<Gamepad2 className="w-5 h-5" />}
            label="MY LIBRARY"
          />
          <NavButton 
            active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')}
            icon={<Users className="w-5 h-5" />}
            label="GRID FRIENDS"
          />
          <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-linear-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/20">
              <p className="text-[10px] font-mono text-neon-cyan mb-1 uppercase tracking-widest">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono">ALL SYSTEMS NOMINAL</span>
              </div>
            </div>
            <button className="flex items-center gap-3 px-4 py-2 text-white/40 hover:text-red-400 transition-colors text-sm font-mono">
              <LogOut className="w-4 h-4" />
              DISCONNECT
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'store' && (
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
                        onBuy={() => addToLibrary(game.id)}
                        owned={library.includes(game.id)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'library' && (
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
                      onClick={() => setActiveTab('store')}
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
            )}

            {activeTab === 'friends' && (
              <motion.div 
                key="friends"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black italic tracking-tighter">GRID_CONTACTS</h2>
                  <button className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono hover:bg-neon-cyan/20 transition-colors">
                    + ADD_ENTITY
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FriendCard username="VOID_WALKER" status="playing" game="NEON STRIKE" />
                  <FriendCard username="GLITCH_GHOST" status="online" />
                  <FriendCard username="CYBER_PUNK_88" status="offline" />
                  <FriendCard username="NULL_POINTER" status="online" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
        <button
          onClick={() => setActiveTab('store')}
          className={activeTab === 'store' ? 'text-neon-cyan' : 'text-white/40'}
          aria-label="Open store"
          title="Store"
        >
          <ShoppingBag className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={activeTab === 'library' ? 'text-neon-cyan' : 'text-white/40'}
          aria-label="Open library"
          title="Library"
        >
          <Gamepad2 className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={activeTab === 'friends' ? 'text-neon-cyan' : 'text-white/40'}
          aria-label="Open friends"
          title="Friends"
        >
          <Users className="w-6 h-6" />
        </button>
        <button className="text-white/40" aria-label="Open profile" title="Profile">
          <User className="w-6 h-6" />
        </button>
      </div>

      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
          © 2026 NEON-GRID_SYSTEMS // ALL RIGHTS RESERVED // STABILITY: 98.4%
        </p>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
        active 
          ? 'bg-neon-cyan text-black font-black shadow-[0_0_20px_rgba(0,243,255,0.3)]' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`${active ? 'text-black' : 'text-neon-cyan group-hover:scale-110 transition-transform'}`}>
        {icon}
      </span>
      <span className="text-sm tracking-tighter italic">{label}</span>
    </button>
  );
}

function GameCard({ game, onBuy, owned }: { game: Game, onBuy: () => void, owned: boolean }) {
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

function LibraryItem({ game }: { game: Game }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);

  const startDownload = () => {
    setIsDownloading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setIsDownloading(false);
        setIsInstalled(true);
      }
      setProgress(p);
    }, 400);
  };

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-neon-cyan/30 transition-colors">
      <img 
        src={game.image} 
        alt={`${game.title} cover art`}
        className="w-20 h-20 rounded-lg object-cover border border-white/10"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-black italic tracking-tighter truncate">{game.title}</h3>
        <p className="text-[10px] font-mono text-white/40 uppercase">Last Played: Never</p>
        
        {isDownloading && (
          <progress
            className="download-progress mt-2 w-full h-1"
            value={progress}
            max={100}
            aria-label={`${game.title} download progress`}
          />
        )}
      </div>
      
      {!isInstalled && !isDownloading && (
        <button 
          onClick={startDownload}
          className="p-3 bg-white/5 hover:bg-neon-cyan hover:text-black rounded-xl transition-all"
          aria-label={`Download ${game.title}`}
          title={`Download ${game.title}`}
        >
          <Download className="w-5 h-5" />
        </button>
      )}

      {isDownloading && (
        <span className="text-[10px] font-mono text-neon-cyan animate-pulse">
          {Math.floor(progress)}%
        </span>
      )}

      {isInstalled && (
        <button className="px-6 py-2 bg-neon-magenta text-white font-black italic text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 magenta-glow">
          <Play className="w-4 h-4 fill-current" />
          EXECUTE
        </button>
      )}
    </div>
  );
}

function FriendCard({ username, status, game }: { username: string, status: 'online' | 'offline' | 'playing', game?: string }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center">
          <User className="w-6 h-6 text-white/40" />
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
          status === 'online' ? 'bg-green-500' : 
          status === 'playing' ? 'bg-neon-cyan' : 'bg-white/20'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate">{username}</h4>
        <p className="text-[10px] font-mono text-white/40 uppercase">
          {status === 'playing' ? `Playing: ${game}` : status}
        </p>
      </div>
      <button
        className="p-2 text-white/20 hover:text-neon-cyan transition-colors"
        aria-label={`Open chat with ${username}`}
        title={`Message ${username}`}
      >
        <Terminal className="w-4 h-4" />
      </button>
    </div>
  );
}
