import React, { useState, useEffect } from 'react';
import { AuthSessionResponse, Game, GameId, TabType, UserAccount } from './types';
import { addBucketItem, addFriend, fetchBucketItems, fetchCurrentUser, fetchFriends, fetchGames, fetchNotifications, fetchWallet, loginUser, logoutUser, removeBucketItem, replaceBucketItems, requestGameDownloadUrl, searchUsers, signupUser } from './services/api';
import { useGlitchEffect } from './hooks/useGlitchEffect';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Toast from './components/ui/Toast';
import QuickSwitchPalette from './components/ui/QuickSwitchPalette';
import BalanceIcon from './components/ui/BalanceIcon';
import Store from './pages/Store';
import Library from './pages/Library';
import Friends from './pages/Friends';
import Bucket from './pages/Bucket';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import Wallet from './pages/Wallet';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';
import AdminUpload from './pages/AdminUpload';
import { UploadCloud } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState<AuthSessionResponse | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showDashboardOnce, setShowDashboardOnce] = useState(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const stored = readStorage<TabType>(LS_KEYS.activeTab, 'store');
    return stored === 'game-detail' ? 'store' : stored;
  });
  const [games, setGames] = useState<Game[]>([]);
  const [library, setLibrary] = useState<GameId[]>(() => readStorage<Array<string | number>>(LS_KEYS.library, []).map((id) => String(id)));
  const [bucket, setBucket] = useState<GameId[]>(() => readStorage<Array<string | number>>(LS_KEYS.bucket, []).map((id) => String(id)));
  const [friends, setFriends] = useState<Array<{ username: string; status: 'online' | 'offline' | 'playing'; game?: string }>>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<UserAccount | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isGlitching = useGlitchEffect();

  const applySessionUser = (sessionUser: AuthSessionResponse | null, preserveNavigation = false) => {
    if (sessionUser) {
      setCurrentUser(sessionUser);
      setUsername(sessionUser.username);
      setUserRole(sessionUser.role);
      setIsLoggedIn(true);
      setCurrentView('app');
      if (!preserveNavigation) {
        setActiveTab(sessionUser.role === 'admin' ? 'admin' : 'store');
        setShowDashboardOnce(sessionUser.role === 'admin');
      }
      return;
    }

  setCurrentUser(null);
    setUsername('');
    setUserRole('player');
    setIsLoggedIn(false);
    setCurrentView('welcome');
    setShowDashboardOnce(false);
    setBucket([]);
    setFriends([]);
    setNotificationsCount(0);
    setSelectedProfile(null);
  };

  const loadUserScopedData = async () => {
    try {
      const [bucketIds, friendsList, notifications, wallet] = await Promise.all([
        fetchBucketItems(),
        fetchFriends(),
        fetchNotifications(),
        fetchWallet(),
      ]);

      setBucket(bucketIds);
      setFriends(friendsList);
      setNotificationsCount(notifications.filter((item) => !item.read).length);
      setWalletBalance(wallet.balance);
    } catch {
      setBucket([]);
      setFriends([]);
      setNotificationsCount(0);
      setWalletBalance(0);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const sessionUser = await fetchCurrentUser();
        if (!isMounted) return;

        applySessionUser(sessionUser);
        if (sessionUser) {
          await loadUserScopedData();
        }
      } catch {
        if (!isMounted) return;
        applySessionUser(null);
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
    const resyncSession = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void (async () => {
        try {
          const sessionUser = await fetchCurrentUser();
          applySessionUser(sessionUser, true);
          if (sessionUser) {
            await loadUserScopedData();
          }
        } catch {
          // Ignore transient network errors during background resync.
        }
      })();
    };

    window.addEventListener('focus', resyncSession);
    document.addEventListener('visibilitychange', resyncSession);

    return () => {
      window.removeEventListener('focus', resyncSession);
      document.removeEventListener('visibilitychange', resyncSession);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const notifications = await fetchNotifications();
          setNotificationsCount(notifications.filter((item) => !item.read).length);
        } catch {
          // Ignore polling failures.
        }
      })();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [isLoggedIn]);

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
      if (key === 'a' && userRole === 'admin') setActiveTab('admin');
      if (key === 's') setActiveTab('store');
      if (key === 'l') setActiveTab('library');
      if (key === 'f') setActiveTab('friends');
      if (key === 'b') setActiveTab('bucket');
      if (key === 'n') setActiveTab('notifications');
      if (key === 'm') setActiveTab('messages');
      if (key === 'g') setActiveTab('groups');
      if (key === 'w') setActiveTab('wallet');
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
      setCurrentUser(null);
      setUsername('');
      setUserRole('player');
      setCurrentView('welcome');
      setActiveTab('store');
      setSelectedProfile(null);
      setSelectedGame(null);
      setSearchTerm('');
      setShowDashboardOnce(false);
      setBucket([]);
      setFriends([]);
      setNotificationsCount(0);
      setWalletBalance(0);
      notify('Disconnected from NEON-GRID.', 'info');
    })();
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === 'profile') {
      setSelectedProfile(null);
    }
    setActiveTab(tab);
  };

  const openProfile = async (targetUsername: string) => {
    try {
      const matches = await searchUsers(targetUsername);
      const exactMatch = matches.find((user) => user.username.toLowerCase() === targetUsername.toLowerCase());
      const selected = exactMatch ?? matches[0] ?? null;

      if (!selected) {
        notify(`Profile not found for ${targetUsername}.`, 'error');
        return;
      }

      setSelectedProfile(selected);
      setActiveTab('profile');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to load profile.', 'error');
    }
  };

  const addToLibrary = (gameId: GameId) => {
    const gameName = games.find((g) => g.id === gameId)?.title ?? 'Game';
    if (!library.includes(gameId)) {
      setLibrary((prev) => [...prev, gameId]);
      notify(`${gameName} added to your library.`, 'success');
    } else {
      notify(`${gameName} is already in your library.`, 'info');
    }
    setBucket((prev) => prev.filter((id) => id !== gameId));
    void removeBucketItem(gameId).catch(() => undefined);
  };

  const addToBucket = (gameId: GameId) => {
    void (async () => {
      const gameName = games.find((g) => g.id === gameId)?.title ?? 'Game';
      if (library.includes(gameId)) {
        notify(`${gameName} is already owned.`, 'info');
        return;
      }

      if (bucket.includes(gameId)) {
        notify(`${gameName} is already in your bucket.`, 'info');
        return;
      }

      try {
        await addBucketItem(gameId);
        setBucket((prev) => [...prev, gameId]);
        notify(`${gameName} queued in acquisition bucket.`, 'success');
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Failed to add game to bucket.', 'error');
      }
    })();
  };

  const removeFromBucket = (gameId: GameId) => {
    void (async () => {
      const gameName = games.find((g) => g.id === gameId)?.title ?? 'Game';

      try {
        await removeBucketItem(gameId);
        setBucket((prev) => prev.filter((id) => id !== gameId));

        notify(`${gameName} removed from bucket.`, 'info', {
          label: 'UNDO',
          onAction: () => {
            void (async () => {
              try {
                await addBucketItem(gameId);
                setBucket((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]));
                setToast(null);
              } catch {
                notify('Failed to undo bucket removal.', 'error');
              }
            })();
          },
        });
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Failed to remove game from bucket.', 'error');
      }
    })();
  };

  const acquireAll = () => {
    void (async () => {
      if (bucket.length === 0) {
        notify('Your bucket is empty.', 'info');
        return;
      }

      const newIds = bucket.filter((id) => !library.includes(id));
      setLibrary((prev) => [...prev, ...newIds]);

      try {
        await replaceBucketItems([]);
        setBucket([]);
      } catch {
        notify('Purchase completed locally, but bucket sync failed.', 'error');
      }

      notify(`${newIds.length} game(s) acquired successfully.`, 'success');
    })();
  };

  const handleAddFriend = async (friendUsername: string) => {
    await addFriend(friendUsername);
    const [friendsList, notifications] = await Promise.all([fetchFriends(), fetchNotifications()]);
    setFriends(friendsList);
    setNotificationsCount(notifications.filter((item) => !item.read).length);
  };

  const filteredGames = Array.isArray(games)
    ? games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleDownloadGame = async (gameId: GameId) => {
    const targetGame = games.find((game) => game.id === gameId);
    if (!targetGame) {
      notify('Selected game was not found.', 'error');
      return;
    }

    try {
      const download = await requestGameDownloadUrl({
        gameId,
        expiresInSeconds: 120,
      });

      window.open(download.signedUrl, '_blank', 'noopener,noreferrer');
      notify(`Download link ready for ${targetGame.title}.`, 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to create download link.', 'error');
      throw error;
    }
  };

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
            await loadUserScopedData();
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
            setActiveTab(sessionUser.role === 'admin' ? 'admin' : 'store');
            setShowDashboardOnce(sessionUser.role === 'admin');
            await loadUserScopedData();
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
        onTabChange={handleTabChange}
        notificationsCount={notificationsCount}
        bucketCount={bucket.length}
        walletBalance={walletBalance}
        username={username}
      />

      {userRole === 'admin' && currentView === 'app' && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="rounded-2xl border border-neon-magenta/25 bg-linear-to-r from-neon-magenta/10 to-neon-cyan/10 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono tracking-[0.35em] text-neon-magenta uppercase">Admin session live</p>
              <p className="text-sm text-white/70 font-mono mt-1">Database role: <span className="text-neon-cyan font-black uppercase">ADMIN</span> · upload and catalog tools are unlocked.</p>
            </div>
            <button
              onClick={() => handleTabChange('upload')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan text-black font-black italic tracking-widest"
            >
              <UploadCloud className="w-4 h-4" />
              Upload ROM
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          onOpenUpload={() => handleTabChange('upload')}
          canUpload={userRole === 'admin'}
        />

        <div className="flex-1 py-8 px-6 min-w-0">
          {activeTab === 'admin' && userRole === 'admin' && (
            <AdminDashboard
              username={username}
              onTabChange={(tab) => {
                handleTabChange(tab);
                if (tab !== 'admin') {
                  setShowDashboardOnce(false);
                }
              }}
              onOpenUpload={() => handleTabChange('upload')}
            />
          )}

          {activeTab === 'admin' && userRole !== 'admin' && (
            <div className="page-enter rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-3">
              <p className="text-xs font-mono tracking-[0.35em] text-neon-magenta uppercase">Access denied</p>
              <h3 className="text-2xl font-black italic tracking-tighter">Admin only</h3>
              <p className="text-sm text-white/60 font-mono">This tab is only visible to admin accounts.</p>
              <button onClick={() => handleTabChange('store')} className="px-5 py-2 rounded-xl bg-neon-cyan text-black font-black italic tracking-widest">Back to store</button>
            </div>
          )}

          {showDashboardOnce && activeTab === 'store' && userRole === 'admin' && (
              <AdminDashboard
                username={username}
                onTabChange={(tab) => {
                  setShowDashboardOnce(false);
                  handleTabChange(tab);
                }}
                onOpenUpload={() => {
                  setShowDashboardOnce(false);
                  handleTabChange('upload');
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
                  handleTabChange(tab);
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
                onTabChange={handleTabChange}
              />
            )}

          {activeTab === 'game-detail' && (
              <GameDetail
                game={selectedGame}
                owned={selectedGame ? library.includes(selectedGame.id) : false}
                inBucket={selectedGame ? bucket.includes(selectedGame.id) : false}
                onBack={() => handleTabChange('store')}
                onAcquire={addToLibrary}
                onAddToBucket={addToBucket}
                onDownload={handleDownloadGame}
              />
            )}

          {activeTab === 'library' && (
              <Library
                games={games}
                library={library}
                onTabChange={handleTabChange}
                onDownload={handleDownloadGame}
              />
            )}

          {activeTab === 'friends' && (
              <Friends friends={friends} onAddFriend={handleAddFriend} onOpenProfile={openProfile} />
            )}

          {activeTab === 'bucket' && (
              <Bucket
                games={games}
                bucket={bucket}
                library={library}
                onRemoveFromBucket={removeFromBucket}
                onAcquireAll={acquireAll}
                onTabChange={handleTabChange}
              />
            )}

          {activeTab === 'notifications' && (
              <Notifications onUnreadCountChange={setNotificationsCount} />
            )}

          {activeTab === 'messages' && (
              <Messages userId={username} />
            )}

          {activeTab === 'groups' && (
              <Groups userId={username} />
            )}

          {activeTab === 'wallet' && (
              <Wallet onBalanceUpdate={setWalletBalance} />
            )}

          {activeTab === 'profile' && (
              <Profile
                libraryCount={library.length}
                friendsCount={friends.length}
                onLogout={handleLogout}
                role={userRole}
                currentUser={currentUser}
                profile={selectedProfile}
                onOpenMessages={() => handleTabChange('messages')}
                onBackToSelf={() => setSelectedProfile(null)}
              />
            )}

          {activeTab === 'upload' && userRole === 'admin' && (
              <AdminUpload
                games={games}
                onBack={() => handleTabChange('store')}
              />
            )}

          {activeTab === 'upload' && userRole !== 'admin' && (
            <div className="page-enter rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-3">
              <p className="text-xs font-mono tracking-[0.35em] text-neon-magenta uppercase">Access denied</p>
              <h3 className="text-2xl font-black italic tracking-tighter">Admin only</h3>
              <p className="text-sm text-white/60 font-mono">Upload tools are available only to admin accounts. Players can browse, buy, and manage their library.</p>
              <button onClick={() => handleTabChange('store')} className="px-5 py-2 rounded-xl bg-neon-cyan text-black font-black italic tracking-widest">Back to store</button>
            </div>
          )}
        </div>
      </main>

      <MobileNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        bucketCount={bucket.length}
        canUpload={userRole === 'admin'}
        onOpenUpload={() => handleTabChange('upload')}
      />

      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
          © 2026 NEON-GRID_SYSTEMS // ALL RIGHTS RESERVED // STABILITY: 98.4%
        </p>
        <p className="text-[10px] font-mono text-white/35 mt-3 tracking-wider">
          SHORTCUTS: CTRL/CMD+K PALETTE · S STORE · L LIBRARY · F FRIENDS · B BUCKET · N NOTIFICATIONS · M MESSAGES · G GROUPS · W WALLET · / SEARCH
        </p>
      </footer>

      <QuickSwitchPalette
        open={isPaletteOpen}
        activeTab={activeTab}
        onClose={() => setIsPaletteOpen(false)}
        onSelectTab={(tab) => handleTabChange(tab)}
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
