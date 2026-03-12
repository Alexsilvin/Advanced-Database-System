import React, { useState } from 'react';
import { Download, Play } from 'lucide-react';
import { Game } from '../../types';

interface LibraryItemProps {
  game: Game;
}

export default function LibraryItem({ game }: LibraryItemProps) {
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