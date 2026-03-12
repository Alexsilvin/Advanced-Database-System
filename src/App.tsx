import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Game, TabType } from './types';
import { fetchGames } from './services/api';
import { useGlitchEffect } from './hooks/useGlitchEffect';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Store from './pages/Store';
import Library from './pages/Library';
import Friends from './pages/Friends';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [games, setGames] = useState<Game[]>([]);
  const [library, setLibrary] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isGlitching = useGlitchEffect();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const gamesData = await fetchGames();
      setGames(gamesData);
      setDbError(null);
    } catch (err) {
      setGames([]);
      setDbError(err instanceof Error ? err.message : 'NETWORK_FAILURE: GRID_OFFLINE');
    } finally {
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
      
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'store' && (
              <Store 
                games={games}
                library={library}
                filteredGames={filteredGames}
                dbError={dbError}
                onAddToLibrary={addToLibrary}
              />
            )}

            {activeTab === 'library' && (
              <Library 
                games={games}
                library={library}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'friends' && (
              <Friends />
            )}
          </AnimatePresence>
        </div>
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
          © 2026 NEON-GRID_SYSTEMS // ALL RIGHTS RESERVED // STABILITY: 98.4%
        </p>
      </footer>
    </div>
  );
}
