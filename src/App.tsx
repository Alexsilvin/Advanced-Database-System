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
import Bucket from './pages/Bucket';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import GameDetailModal from './components/game/GameDetailModal';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [games, setGames] = useState<Game[]>([]);
  const [library, setLibrary] = useState<number[]>([]);
  const [bucket, setBucket] = useState<number[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
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
      setLibrary((prev) => [...prev, gameId]);
    }
    setBucket((prev) => prev.filter((id) => id !== gameId));
  };

  const addToBucket = (gameId: number) => {
    if (!bucket.includes(gameId) && !library.includes(gameId)) {
      setBucket((prev) => [...prev, gameId]);
    }
  };

  const removeFromBucket = (gameId: number) => {
    setBucket((prev) => prev.filter((id) => id !== gameId));
  };

  const acquireAll = () => {
    const newIds = bucket.filter((id) => !library.includes(id));
    setLibrary((prev) => [...prev, ...newIds]);
    setBucket([]);
  };

  const filteredGames = Array.isArray(games)
    ? games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col relative ${isGlitching ? 'glitch-active' : ''}`}>
      <div className="scanline" />

      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onTabChange={setActiveTab}
        notificationsCount={2}
        bucketCount={bucket.length}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 py-8 px-6 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'store' && (
              <Store
                games={games}
                library={library}
                filteredGames={filteredGames}
                dbError={dbError}
                onAddToLibrary={addToLibrary}
                onSelectGame={setSelectedGame}
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

            {activeTab === 'bucket' && (
              <Bucket
                games={games}
                bucket={bucket}
                library={library}
                onRemoveFromBucket={removeFromBucket}
                onAcquireAll={acquireAll}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'notifications' && (
              <Notifications />
            )}
          </AnimatePresence>
        </div>
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} bucketCount={bucket.length} />

      <GameDetailModal
        game={selectedGame}
        owned={selectedGame ? library.includes(selectedGame.id) : false}
        inBucket={selectedGame ? bucket.includes(selectedGame.id) : false}
        onClose={() => setSelectedGame(null)}
        onAcquire={addToLibrary}
        onAddToBucket={addToBucket}
      />

      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
          © 2026 NEON-GRID_SYSTEMS // ALL RIGHTS RESERVED // STABILITY: 98.4%
        </p>
      </footer>
    </div>
  );
}
