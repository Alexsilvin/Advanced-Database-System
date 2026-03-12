import React, { useState } from 'react';
import { Download, Play } from 'lucide-react';
import { Game } from '../../types';

interface LibraryItemProps {
  game: Game;
  viewMode?: 'grid' | 'list';
  onInstalled?: (id: number) => void;
}

export default function LibraryItem({ game, viewMode = 'grid', onInstalled }: LibraryItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);

  const mockHours = (game.id * 173 + 29) % 500;

  const startDownload = () => {
    setIsDownloading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setIsDownloading(false);
        setIsInstalled(true);
        onInstalled?.(game.id);
      }
      setProgress(p);
    }, 300);
  };

  const statusLabel = isInstalled ? 'READY' : isDownloading ? 'INSTALLING' : 'OFFLINE';
  const statusColor = isInstalled
    ? 'text-neon-cyan'
    : isDownloading
    ? 'text-neon-yellow animate-pulse'
    : 'text-white/30';

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-neon-cyan/30 transition-colors group">
        <img
          src={game.image}
          alt={`${game.title} cover art`}
          className={`w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0 ${
            !isInstalled ? 'grayscale opacity-60' : ''
          }`}
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-black italic tracking-tighter truncate">{game.title}</h3>
          <p className="text-[10px] font-mono text-white/40 uppercase">{mockHours} HRS PLAYED</p>
          {isDownloading && (
            <div className="mt-1.5 w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-neon-cyan rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-mono font-bold uppercase ${statusColor}`}>{statusLabel}</span>
          {!isInstalled && !isDownloading && (
            <button
              onClick={startDownload}
              className="p-2.5 bg-white/5 hover:bg-neon-cyan hover:text-black rounded-xl transition-all"
              aria-label={`Download ${game.title}`}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {isDownloading && (
            <span className="text-[10px] font-mono text-neon-cyan min-w-[3ch] text-right">
              {Math.floor(progress)}%
            </span>
          )}
          {isInstalled && (
            <button
              className="p-2.5 bg-neon-cyan/10 hover:bg-neon-cyan hover:text-black text-neon-cyan rounded-xl transition-all"
              aria-label={`Play ${game.title}`}
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div
      className={`group relative bg-black/40 rounded-2xl overflow-hidden border border-white/10 hover:border-neon-cyan/30 transition-all duration-300 ${
        !isInstalled && !isDownloading ? 'opacity-80' : ''
      }`}
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        <img
          src={game.image}
          alt={`${game.title} cover art`}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            !isInstalled ? 'grayscale' : ''
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
              isInstalled
                ? 'bg-neon-cyan text-black'
                : isDownloading
                ? 'bg-neon-yellow text-black'
                : 'bg-white/10 text-white/40'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Overlay */}
        {isDownloading ? (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 p-4">
            <p className="text-[11px] font-mono text-neon-cyan animate-pulse tracking-widest uppercase">
              INSTALLING_DATA...
            </p>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-neon-cyan rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-2xl font-black font-mono text-neon-cyan">{Math.floor(progress)}%</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isInstalled ? (
              <button
                className="w-14 h-14 bg-neon-cyan rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,243,255,0.5)]"
                aria-label={`Play ${game.title}`}
              >
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </button>
            ) : (
              <button
                onClick={startDownload}
                className="px-5 py-2 bg-neon-cyan text-black font-black text-xs uppercase rounded hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,243,255,0.4)]"
              >
                INSTALL
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-black text-sm tracking-tighter truncate">{game.title}</h3>
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-[10px] text-white/40 font-mono uppercase">{mockHours} HRS</span>
          <span className={`text-[10px] font-bold font-mono uppercase ${statusColor}`}>{statusLabel}</span>
        </div>
        <p className="text-[10px] text-white/20 font-mono mt-0.5">
          {isInstalled ? 'Last played: recently' : isDownloading ? 'Installing...' : 'Never played'}
        </p>
      </div>
    </div>
  );
}