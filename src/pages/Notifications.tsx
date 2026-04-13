import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, User, Zap, ShoppingBag, X, CheckCheck } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { clearNotifications, dismissNotification, fetchNotifications, markAllNotificationsRead } from '../services/api';
import { AppNotification } from '../types';

interface NotificationsProps {
  onUnreadCountChange?: (count: number) => void;
}

function TypeIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'friend') return <User className="w-4 h-4 text-neon-cyan" />;
  if (type === 'system') return <Zap className="w-4 h-4 text-neon-yellow" />;
  if (type === 'sale') return <ShoppingBag className="w-4 h-4 text-neon-magenta" />;
  return <Bell className="w-4 h-4 text-green-400" />;
}

export default function Notifications({ onUnreadCountChange }: NotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const data = await fetchNotifications();
        if (mounted) {
          setNotifications(data);
          onUnreadCountChange?.(data.filter((item) => !item.read).length);
        }
      } catch {
        if (mounted) {
          setNotifications([]);
          onUnreadCountChange?.(0);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onUnreadCountChange]);

  useEffect(() => {
    onUnreadCountChange?.(notifications.filter((item) => !item.read).length);
  }, [notifications, onUnreadCountChange]);

  const markAllRead = () => {
    void (async () => {
      try {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        // Keep UI unchanged when backend update fails.
      }
    })();
  };

  const dismiss = (id: string) => {
    void (async () => {
      try {
        await dismissNotification(id);
      } finally {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    })();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      key="notifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black italic tracking-tighter">SIGNAL_FEED</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-neon-magenta/20 border border-neon-magenta/40 text-neon-magenta text-[10px] font-mono rounded-full">
              {unreadCount} UNREAD
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-neon-cyan transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              MARK ALL READ
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs font-mono text-white/30 hover:text-red-300 transition-colors"
            >
              CLEAR FEED
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
          <Bell className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/40 font-mono">SCANNING SIGNAL FEED...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
          <Bell className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/40 font-mono">NO SIGNALS DETECTED</p>
          <p className="text-[11px] text-white/25 font-mono mt-1">You are all caught up. New events will appear in real time.</p>
          {undoSnapshot && (
            <button
              onClick={() => {
                setNotifications(undoSnapshot);
                setUndoSnapshot(null);
              }}
              className="mt-4 text-xs font-mono text-neon-cyan hover:underline"
            >
              UNDO CLEAR FEED
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-colors flex items-start gap-4 ${
                n.read
                  ? 'bg-white/5 border-white/10'
                  : 'bg-neon-cyan/5 border-neon-cyan/20'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  n.read ? 'bg-white/5' : 'bg-neon-cyan/10'
                }`}
              >
                <TypeIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-black italic tracking-tighter ${
                      n.read ? 'text-white/70' : 'text-white'
                    }`}
                  >
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-magenta shadow-[0_0_6px_rgba(255,0,255,0.8)] shrink-0" />
                  )}
                </div>
                <p className="text-xs font-mono text-white/40 mt-0.5">{n.message}</p>
                <p className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-widest">
                  {n.time}
                </p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="text-white/20 hover:text-white/60 transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="CLEAR NOTIFICATION FEED"
        description="This will remove all notifications from the current feed view."
        confirmLabel="CLEAR ALL"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await clearNotifications();
              setUndoSnapshot(notifications);
              setNotifications([]);
              setConfirmClear(false);
            } catch {
              setConfirmClear(false);
            }
          })();
        }}
      />
    </motion.div>
  );
}
