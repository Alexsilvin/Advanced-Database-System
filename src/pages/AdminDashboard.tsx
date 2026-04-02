import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, UploadCloud, Users, Gamepad2, DatabaseZap, ArrowRight, Lock } from 'lucide-react';
import { TabType } from '../types';

interface AdminDashboardProps {
  username: string;
  gamesCount: number;
  onTabChange: (tab: TabType) => void;
  onOpenUpload: () => void;
}

const adminSignals = [
  { label: 'CATALOG ITEMS', value: 'ACTIVE', icon: DatabaseZap, color: 'text-neon-cyan' },
  { label: 'ROLE', value: 'ADMIN', icon: ShieldCheck, color: 'text-neon-magenta' },
  { label: 'UPLOAD PIPELINE', value: 'READY', icon: UploadCloud, color: 'text-green-400' },
  { label: 'SESSION', value: 'SECURE', icon: Lock, color: 'text-neon-yellow' },
];

export default function AdminDashboard({ username, gamesCount, onTabChange, onOpenUpload }: AdminDashboardProps) {
  return (
    <motion.div
      key="admin-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12"
    >
      <div className="relative overflow-hidden rounded-3xl border border-neon-magenta/30 bg-linear-to-br from-neon-magenta/10 via-black to-neon-cyan/10 p-8 shadow-[0_0_40px_rgba(255,0,255,0.15)]">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(0,243,255,0.2)_25%,rgba(0,243,255,0.2)_50%,transparent_50%,transparent_75%,rgba(0,243,255,0.2)_75%,rgba(0,243,255,0.2))] bg-size-[40px_40px]" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta text-[10px] font-black tracking-[0.35em] uppercase">
              <ShieldCheck className="w-3 h-3" />
              Admin Control Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-tight">
              Welcome back, <span className="text-neon-cyan uppercase">{username}</span>
            </h1>
            <p className="text-sm md:text-base text-white/65 font-mono leading-relaxed max-w-xl">
              You are signed in as an administrator. Your first stop is the upload pipeline and catalog control surface, not the store.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenUpload}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-neon-cyan to-neon-magenta text-black font-black italic tracking-widest flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload ROM
            </button>
            <button
              onClick={() => onTabChange('store')}
              className="px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-neon-cyan/30 transition-colors flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              Open Catalog
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.label} className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-5 h-5 ${signal.color}`} />
                <span className="text-[10px] font-mono text-white/35 uppercase tracking-[0.3em]">Live</span>
              </div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2">{signal.label}</p>
              <p className={`text-2xl font-black italic ${signal.color}`}>{signal.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-3xl border border-white/10 bg-black/50 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono tracking-[0.35em] text-neon-cyan uppercase">Admin shortcuts</p>
              <h2 className="text-2xl font-black italic tracking-tighter mt-2">Operate the grid</h2>
            </div>
            <Users className="w-6 h-6 text-neon-magenta" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onOpenUpload}
              className="p-5 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 hover:border-neon-cyan/40 text-left transition-all group"
            >
              <UploadCloud className="w-6 h-6 text-neon-cyan mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-black italic tracking-tight mb-1">UPLOAD ROM</h3>
              <p className="text-xs text-white/50 font-mono leading-relaxed">
                Send a ROM to Filebase, then register the metadata in the database.
              </p>
            </button>

            <button
              onClick={() => onTabChange('store')}
              className="p-5 rounded-2xl border border-neon-magenta/20 bg-neon-magenta/5 hover:bg-neon-magenta/10 hover:border-neon-magenta/40 text-left transition-all group"
            >
              <Gamepad2 className="w-6 h-6 text-neon-magenta mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-black italic tracking-tight mb-1">REVIEW CATALOG</h3>
              <p className="text-xs text-white/50 font-mono leading-relaxed">
                Check featured titles, downloadable status, and poster coverage.
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-neon-cyan/20 bg-neon-cyan/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <DatabaseZap className="w-5 h-5 text-neon-cyan" />
            <h3 className="text-xl font-black italic tracking-tighter">Control Notes</h3>
          </div>
          <div className="space-y-3 text-sm text-white/70 font-mono leading-relaxed">
            <p>The admin session is database-backed. Role comes from the user record, not from typed text.</p>
            <p>Upload tools are locked to this account and can only be reached from the admin session.</p>
            <p>Use the upload page to push ROM files to Filebase and then register them against a game row.</p>
          </div>
          <button
            onClick={() => onTabChange('profile')}
            className="mt-2 inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase text-neon-cyan hover:text-white transition-colors"
          >
            Open profile <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.35em] text-white/40 uppercase">Catalog count</p>
          <p className="text-3xl font-black italic tracking-tighter text-neon-cyan mt-1">{gamesCount} games</p>
        </div>
        <div className="text-sm text-white/55 font-mono max-w-xl">
          You are landing on the admin control panel first. Players are routed to the standard player dashboard and store flow.
        </div>
      </div>
    </motion.div>
  );
}
