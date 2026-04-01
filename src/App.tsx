import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Game, TabType } from './types';
import { fetchGames } from './services/api';
import { useGlitchEffect } from './hooks/useGlitchEffect';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Toast from './components/ui/Toast';
import QuickSwitchPalette from './components/ui/QuickSwitchPalette';
import Store from './pages/Store';
import Library from './pages/Library';
import Friends from './pages/Friends';
import Bucket from './pages/Bucket';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';

type AppView = 'welcome' | 'login' | 'signup' | 'app';

const LS_KEYS = {
  isLoggedIn: 'neon-grid:is-logged-in',
  username: 'neon-grid:username',
  activeTab: 'neon-grid:active-tab',
  library: 'neon-grid:library',
  bucket: 'neon-grid:bucket',
} as const;

type ToastVariant = 'success' | 'info' | 'error';
type ToastState = {
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => readStorage<boolean>(LS_KEYS.isLoggedIn, false) ? 'app' : 'welcome');
  const [username, setUsername] = useState<string>(() => readStorage<string>(LS_KEYS.username, ''));
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => readStorage<boolean>(LS_KEYS.isLoggedIn, false));
  const [showDashboardOnce, setShowDashboardOnce] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const stored = readStorage<TabType>(LS_KEYS.activeTab, 'store');
    return stored === 'game-detail' ? 'store' : stored;
  });
  const [games, setGames] = useState<Game[]>([]);
  const [library, setLibrary] = useState<number[]>(() => readStorage<number[]>(LS_KEYS.library, []));
  const [bucket, setBucket] = useState<number[]>(() => readStorage<number[]>(LS_KEYS.bucket, []));
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isGlitching = useGlitchEffect();

  useEffect(() => {
    // Only load games if user is already logged in (in app view)
    if (currentView === 'app') {
      loadGames();
    } else {
      // Still need to set loading to false for welcome/signup/login pages
      setLoading(false);
    }
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.isLoggedIn, JSON.stringify(isLoggedIn));
    localStorage.setItem(LS_KEYS.username, JSON.stringify(username));
  }, [isLoggedIn, username]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.activeTab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.library, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.bucket, JSON.stringify(bucket));
  }, [bucket]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isCmdK) {
        event.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const inEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable;

      if (isPaletteOpen) {
        return;
      }

      if (inEditable) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 's') setActiveTab('store');
      if (key === 'l') setActiveTab('library');
      if (key === 'f') setActiveTab('friends');
      if (key === 'b') setActiveTab('bucket');
      if (key === 'n') setActiveTab('notifications');
      if (key === '/') {
        event.preventDefault();
        const search = document.querySelector('input[placeholder="SEARCH THE GRID..."]') as HTMLInputElement | null;
        search?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaletteOpen]);

  const notify = (
    message: string,
    variant: ToastVariant = 'info',
    action?: { label: string; onAction: () => void },
  ) => {
    setToast({
      message,
      variant,
      actionLabel: action?.label,
      onAction: action?.onAction,
    });
  };

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

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setActiveTab('game-detail');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setCurrentView('welcome');
    setActiveTab('store');
    setSelectedGame(null);
    setSearchTerm('');
    setShowDashboardOnce(false);
    notify('Disconnected from NEON-GRID.', 'info');
  };

  const addToLibrary = (gameId: number) => {
    const gameName = games.find((g) => g.id === gameId)?.title ?? 'Game';
    if (!library.includes(gameId)) {
      setLibrary((prev) => [...prev, gameId]);
      notify(`${gameName} added to your library.`, 'success');
    } else {
      notify(`${gameName} is already in your library.`, 'info');
    }
    setBucket((prev) => prev.filter((id) => id !== gameId));
  };

  const addToBucket = (gameId: number) => {
    const gameName = games.find((g) => g.id === gameId)?.title ?? 'Game';
    if (library.includes(gameId)) {
      notify(`${gameName} is already owned.`, 'info');
      return;
    }

    if (bucket.includes(gameId)) {
      notify(`${gameName} is already in your bucket.`, 'info');
      return;
    }

    if (!bucket.includes(gameId) && !library.includes(gameId)) {
      setBucket((prev) => [...prev, gameId]);
      notify(`${gameName} queued in acquisition bucket.`, 'success');
    }
  };

  const removeFromBucket = (gameId: number) => {
    const gameName = games.find((g) => g.id === gameId)?.title ?? 'Game';

    setBucket((prev) => {
      const next = prev.filter((id) => id !== gameId);
      return next;
    });

    notify(`${gameName} removed from bucket.`, 'info', {
      label: 'UNDO',
      onAction: () => {
        setBucket((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]));
        setToast(null);
      },
    });
  };

  const acquireAll = () => {
    if (bucket.length === 0) {
      notify('Your bucket is empty.', 'info');
      return;
    }

    const newIds = bucket.filter((id) => !library.includes(id));
    setLibrary((prev) => [...prev, ...newIds]);
    setBucket([]);
    notify(`${newIds.length} game(s) acquired successfully.`, 'success');
  };

  const filteredGames = Array.isArray(games)
    ? games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  // Welcome Page
  if (currentView === 'welcome') {
    return (
      <>
        <Welcome
          onGetStarted={() => setCurrentView('signup')}
          onLogin={() => setCurrentView('login')}
          games={games}
        />
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Signup Page
  if (currentView === 'signup') {
    return (
      <>
        <Signup
          onSignup={(newUsername) => {
            setUsername(newUsername);
            setIsLoggedIn(true);
            setCurrentView('app');
            setShowDashboardOnce(true);
            notify(`Welcome to NEON-GRID, ${newUsername}!`, 'success');
            loadGames();
          }}
          onBackToWelcome={() => setCurrentView('welcome')}
        />
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Login Page
  if (currentView === 'login') {
    return (
      <>
        <Login
          onLogin={() => {
            setUsername('player_one');
            setIsLoggedIn(true);
            setCurrentView('app');
            notify('Connected to NEON-GRID.', 'success');
            loadGames();
          }}
        />
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Main App View
  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center space-y-3">
            <p className="text-neon-cyan text-sm font-mono tracking-widest animate-pulse">BOOTING_NEON_GRID...</p>
            <p className="text-white/40 text-xs font-mono">Synchronizing catalog protocols</p>
          </div>
        </div>
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
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
          onLogout={handleLogout}
        />

        <div className="flex-1 py-8 px-6 min-w-0">
          <AnimatePresence mode="wait">
            {showDashboardOnce && activeTab === 'store' && (
              <Dashboard
                username={username}
                libraryCount={library.length}
                bucketCount={bucket.length}
                games={games}
                library={library}
                onTabChange={(tab) => {
                  setShowDashboardOnce(false);
                  setActiveTab(tab);
                }}
              />
            )}

            {!showDashboardOnce && activeTab === 'store' && (
              <Store
                games={games}
                library={library}
                filteredGames={filteredGames}
                dbError={dbError}
                onAddToLibrary={addToLibrary}
                onSelectGame={handleSelectGame}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'game-detail' && (
              <GameDetail
                game={selectedGame}
                owned={selectedGame ? library.includes(selectedGame.id) : false}
                inBucket={selectedGame ? bucket.includes(selectedGame.id) : false}
                onBack={() => setActiveTab('store')}
                onAcquire={addToLibrary}
                onAddToBucket={addToBucket}
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

            {activeTab === 'profile' && (
              <Profile
                libraryCount={library.length}
                friendsCount={4}
                onLogout={() => setIsLoggedIn(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} bucketCount={bucket.length} />

      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
          © 2026 NEON-GRID_SYSTEMS // ALL RIGHTS RESERVED // STABILITY: 98.4%
        </p>
        <p className="text-[10px] font-mono text-white/35 mt-3 tracking-wider">
          SHORTCUTS: CTRL/CMD+K PALETTE, S STORE, L LIBRARY, F FRIENDS, B BUCKET, N NOTIFICATIONS, / SEARCH
        </p>
      </footer>

      <QuickSwitchPalette
        open={isPaletteOpen}
        activeTab={activeTab}
        onClose={() => setIsPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
