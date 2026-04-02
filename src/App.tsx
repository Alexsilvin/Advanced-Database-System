import React, { useState, useEffect } from 'react';
import { Game, TabType } from './types';
import { fetchCurrentUser, fetchGames, loginUser, logoutUser, signupUser } from './services/api';
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
import AdminDashboard from './pages/AdminDashboard';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';
import AdminUpload from './pages/AdminUpload';

type AppView = 'welcome' | 'login' | 'signup' | 'app';

const LS_KEYS = {
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
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [username, setUsername] = useState<string>('');
  const [userRole, setUserRole] = useState<'admin' | 'player'>('player');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showDashboardOnce, setShowDashboardOnce] = useState(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const stored = readStorage<TabType>(LS_KEYS.activeTab, 'store');
    return stored === 'game-detail' ? 'store' : stored;
  });
  const [games, setGames] = useState<Game[]>([]);
  const [library, setLibrary] = useState<number[]>(() => readStorage<number[]>(LS_KEYS.library, []));
  const [bucket, setBucket] = useState<number[]>(() => readStorage<number[]>(LS_KEYS.bucket, []));
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isGlitching = useGlitchEffect();

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const sessionUser = await fetchCurrentUser();
        if (!isMounted) return;

        if (sessionUser) {
          setUsername(sessionUser.username);
          setUserRole(sessionUser.role);
          setIsLoggedIn(true);
          setCurrentView('app');
          setActiveTab('store');
          setShowDashboardOnce(sessionUser.role === 'admin');
        } else {
          setUsername('');
          setUserRole('player');
          setIsLoggedIn(false);
          setCurrentView('welcome');
        }
      } catch {
        if (!isMounted) return;
        setUsername('');
        setUserRole('player');
        setIsLoggedIn(false);
        setCurrentView('welcome');
      } finally {
        if (isMounted) {
          setIsSessionChecking(false);
        }
      }
    };

    syncSession();

    return () => {
      isMounted = false;
    };
  }, []);

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
      if (key === 'u') setActiveTab('upload');
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
    }
  };

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setActiveTab('game-detail');
  };

  const handleLogout = () => {
    void (async () => {
      await logoutUser();
      setIsLoggedIn(false);
      setUsername('');
      setUserRole('player');
      setCurrentView('welcome');
      setActiveTab('store');
      setSelectedGame(null);
      setSearchTerm('');
      setShowDashboardOnce(false);
      notify('Disconnected from NEON-GRID.', 'info');
    })();
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
      <div className="page-enter">
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
      </div>
    );
  }

  // Signup Page
  if (currentView === 'signup') {
    return (
      <div className="page-enter">
        <Signup
          onSignup={async (newUsername, email, password) => {
            const createdUser = await signupUser({ username: newUsername, email, password });
            setUsername(createdUser.username);
            setUserRole(createdUser.role);
            setIsLoggedIn(true);
            setCurrentView('app');
            setShowDashboardOnce(true);
            notify(`Welcome to NEON-GRID, ${createdUser.username}!`, 'success');
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
      </div>
    );
  }

  // Login Page
  if (currentView === 'login') {
    return (
      <div className="page-enter">
        <Login
          onLogin={async (loginUsername, password) => {
            const sessionUser = await loginUser({ username: loginUsername, password });

            setUsername(sessionUser.username);
            setUserRole(sessionUser.role);
            setIsLoggedIn(true);
            setCurrentView('app');
            setActiveTab('store');
            setShowDashboardOnce(sessionUser.role === 'admin');
            notify(sessionUser.role === 'admin' ? 'Admin access granted.' : 'Connected to NEON-GRID.', 'success');
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
      </div>
    );
  }

  if (isSessionChecking) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center bg-[#070b18] text-white">
        <div className="rounded-3xl border border-white/10 bg-black/60 px-8 py-6 text-center space-y-2">
          <p className="text-xs font-mono tracking-[0.35em] text-neon-cyan uppercase">Syncing session</p>
          <p className="text-sm text-white/60 font-mono">Checking your database login...</p>
        </div>
      </div>
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
          onOpenUpload={() => setActiveTab('upload')}
          canUpload={userRole === 'admin'}
        />

        <div className="flex-1 py-8 px-6 min-w-0">
          {showDashboardOnce && activeTab === 'store' && userRole === 'admin' && (
              <AdminDashboard
                username={username}
                gamesCount={games.length}
                onTabChange={(tab) => {
                  setShowDashboardOnce(false);
                  setActiveTab(tab);
                }}
                onOpenUpload={() => {
                  setShowDashboardOnce(false);
                  setActiveTab('upload');
                }}
              />
            )}

          {showDashboardOnce && activeTab === 'store' && userRole !== 'admin' && (
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
                onLogout={handleLogout}
                role={userRole}
              />
            )}

          {activeTab === 'upload' && userRole === 'admin' && (
              <AdminUpload
                games={games}
                onBack={() => setActiveTab('store')}
              />
            )}

          {activeTab === 'upload' && userRole !== 'admin' && (
            <div className="page-enter rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-3">
              <p className="text-xs font-mono tracking-[0.35em] text-neon-magenta uppercase">Access denied</p>
              <h3 className="text-2xl font-black italic tracking-tighter">Admin only</h3>
              <p className="text-sm text-white/60 font-mono">Upload tools are available only to admin accounts. Players can browse, buy, and manage their library.</p>
              <button onClick={() => setActiveTab('store')} className="px-5 py-2 rounded-xl bg-neon-cyan text-black font-black italic tracking-widest">Back to store</button>
            </div>
          )}
        </div>
      </main>

      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bucketCount={bucket.length}
        canUpload={userRole === 'admin'}
        onOpenUpload={() => setActiveTab('upload')}
      />

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
