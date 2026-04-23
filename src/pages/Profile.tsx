import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User, Cpu, Gamepad2, Clock, Users, Trophy,
  Edit3, Bell, BellOff, LogOut, Shield, Zap, Lock, ChevronRight
} from 'lucide-react';
import { UserAccount } from '../types';

interface ProfileProps {
  libraryCount: number;
  friendsCount: number;
  onLogout: () => void;
  role: 'admin' | 'player';
  currentUser: UserAccount | null;
  profile?: UserAccount | null;
  onOpenMessages?: (username: string) => void;
  onBackToSelf?: () => void;
  customerTier?: string;
}

type RecentActivityItem = {
  title: string;
  lastPlayed: string;
  hours: number;
  icon: string;
};

type AchievementItem = {
  id: number;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  unlocked: boolean;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
};

const recentActivity: RecentActivityItem[] = [];

const achievements: AchievementItem[] = [];

const rarityColor: Record<string, string> = {
  COMMON: 'text-white/60 border-white/20 bg-white/5',
  RARE: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10',
  EPIC: 'text-neon-magenta border-neon-magenta/30 bg-neon-magenta/10',
  LEGENDARY: 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10',
};

export default function Profile({ libraryCount, friendsCount, onLogout, role, currentUser, profile, onOpenMessages, onBackToSelf, customerTier = 'ROOKIE' }: ProfileProps) {
  const [notifications, setNotifications] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState((currentUser?.username || 'SYLVESTRE_01').toUpperCase());

  const totalHours = recentActivity.reduce((sum, g) => sum + g.hours, 0);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const viewedUser = profile ?? currentUser;
  const isViewingSelf = !profile || !currentUser || profile.id === currentUser.id;

  if (viewedUser && !isViewingSelf) {
    return (
      <motion.div
        key="profile-public"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6 pb-8"
      >
        <div className="rounded-2xl border border-neon-cyan/20 bg-linear-to-br from-neon-cyan/10 via-black to-neon-magenta/10 p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <User className="w-10 h-10 text-neon-cyan" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono tracking-[0.35em] text-neon-cyan uppercase">PUBLIC_PROFILE</p>
                <h2 className="text-3xl font-black italic tracking-tighter truncate">{viewedUser.username}</h2>
                <p className="text-xs font-mono text-white/40 mt-1">Only public account details are visible here.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenMessages && (
                <button
                  onClick={() => onOpenMessages(viewedUser.username)}
                  className="px-4 py-2 rounded-xl bg-neon-cyan text-black font-black italic tracking-widest text-xs"
                >
                  MESSAGE
                </button>
              )}
              {onBackToSelf && (
                <button
                  onClick={onBackToSelf}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-black italic tracking-widest text-xs"
                >
                  BACK_TO_ME
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-mono text-white/40 tracking-widest">USERNAME</p>
              <p className="mt-2 text-sm font-black italic">{viewedUser.username}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-mono text-white/40 tracking-widest">ROLE</p>
              <p className="mt-2 text-sm font-black italic uppercase text-neon-cyan">{viewedUser.role}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-mono text-white/40 tracking-widest">EMAIL</p>
              <p className="mt-2 text-sm font-black italic truncate">{viewedUser.email || 'HIDDEN'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-8"
    >
      {/* ── HERO CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-neon-magenta/30 bg-linear-to-br from-neon-magenta/10 via-black to-neon-cyan/10 p-8 shadow-[0_0_40px_rgba(255,0,255,0.15)]">
        {/* Background grid lines */}
        <div className="profile-grid-overlay absolute inset-0 opacity-10 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-neon-magenta/20 border-2 border-neon-magenta/60 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,255,0.4)]">
              <User className="w-12 h-12 text-neon-magenta" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-[9px] font-mono text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]">
              ● ONLINE
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            {editingName ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <input
                  autoFocus
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value.toUpperCase())}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                  aria-label="Edit display name"
                  title="Edit display name"
                  className="bg-white/10 border border-neon-cyan/40 rounded px-3 py-1 text-2xl font-black tracking-tighter outline-none text-white font-mono w-60"
                  maxLength={20}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <h2 className="text-3xl font-black italic tracking-tighter text-white">{displayName}</h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Edit display name"
                >
                  <Edit3 className="w-4 h-4 text-white/40 hover:text-neon-cyan transition-colors" />
                </button>
              </div>
            )}
            <p className="text-xs font-mono text-white/40 tracking-widest mb-3">MEMBER SINCE // JAN 2025</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[10px] font-mono rounded-full">
                GRID_TIER: {customerTier}
              </span>
              <span className={`px-3 py-1 text-[10px] font-mono rounded-full border ${role === 'admin' ? 'bg-neon-magenta/10 border-neon-magenta/30 text-neon-magenta' : 'bg-white/5 border-white/20 text-white/60'}`}>
                ROLE: {role.toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-neon-magenta/10 border border-neon-magenta/30 text-neon-magenta text-[10px] font-mono rounded-full">
                XP: 14,820
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono rounded-lg hover:bg-red-500/20 hover:border-red-500/60 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </button>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'GAMES OWNED', value: libraryCount, icon: Gamepad2, color: 'neon-cyan' },
          { label: 'HOURS PLAYED', value: `${totalHours}h`, icon: Clock, color: 'neon-magenta' },
          { label: 'GRID CONTACTS', value: friendsCount, icon: Users, color: 'neon-cyan' },
          { label: 'ACHIEVEMENTS', value: `${unlockedCount}/${achievements.length}`, icon: Trophy, color: 'neon-yellow' },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center gap-2 hover:border-neon-cyan/30 hover:bg-white/8 transition-all"
          >
            <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            <p className={`text-2xl font-black text-${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] font-mono text-white/40 tracking-widest text-center">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── RECENT ACTIVITY ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neon-cyan" />
            <h3 className="text-lg font-black italic tracking-tighter">RECENT_ACTIVITY</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-5 text-center">
              <p className="text-xs font-mono text-white/40">NO RECENT ACTIVITY</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((game, i) => (
                <motion.div
                  key={game.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all group"
                >
                  <span className="text-2xl">{game.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black italic tracking-tighter truncate">{game.title}</p>
                    <p className="text-[10px] font-mono text-white/40">{game.hours}h played</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-white/30">{game.lastPlayed}</p>
                    <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-neon-cyan transition-colors ml-auto mt-0.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── ACHIEVEMENTS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-neon-yellow" />
            <h3 className="text-lg font-black italic tracking-tighter">ACHIEVEMENTS</h3>
            <span className="ml-auto text-[10px] font-mono text-white/40">{unlockedCount}/{achievements.length} UNLOCKED</span>
          </div>
          {achievements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-5 text-center">
              <p className="text-xs font-mono text-white/40">NO ACHIEVEMENTS YET</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {achievements.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    ach.unlocked
                      ? 'border-white/10 bg-white/5 hover:border-neon-cyan/30'
                      : 'border-white/5 bg-white/5 opacity-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg border ${rarityColor[ach.rarity]}`}>
                    <ach.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black italic tracking-tighter">{ach.name}</p>
                    <p className="text-[10px] font-mono text-white/40">{ach.desc}</p>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${rarityColor[ach.rarity]}`}>
                    {ach.rarity}
                  </span>
                  {!ach.unlocked && <Lock className="w-3 h-3 text-white/20 shrink-0" />}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SETTINGS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon-magenta" />
          <h3 className="text-lg font-black italic tracking-tighter">NODE_SETTINGS</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden divide-y divide-white/10">
          {/* Notifications toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {notifications
                ? <Bell className="w-4 h-4 text-neon-cyan" />
                : <BellOff className="w-4 h-4 text-white/40" />}
              <div>
                <p className="text-sm font-mono font-bold">SIGNAL_ALERTS</p>
                <p className="text-[10px] font-mono text-white/40">Receive grid notifications</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(v => !v)}
              className={`relative w-12 h-6 rounded-full border transition-all duration-300 ${
                notifications
                  ? 'bg-neon-cyan/30 border-neon-cyan/60 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                  : 'bg-white/10 border-white/20'
              }`}
              aria-label="Toggle notifications"
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
                  notifications ? 'left-6 bg-neon-cyan' : 'left-0.5 bg-white/40'
                }`}
              />
            </button>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-neon-magenta" />
              <div>
                <p className="text-sm font-mono font-bold">PRIVACY_MODE</p>
                <p className="text-[10px] font-mono text-white/40">Hide online status from grid</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/30 tracking-widest">DISABLED</span>
          </div>

          {/* Clear data */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-sm font-mono font-bold text-red-400">PURGE_CACHE</p>
                <p className="text-[10px] font-mono text-white/40">Clear local grid data</p>
              </div>
            </div>
            <button className="text-[10px] font-mono text-red-400/60 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-3 py-1 rounded transition-colors">
              EXECUTE
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
