import React from 'react';
import { User, Terminal } from 'lucide-react';
import { Friend } from '../../types';

interface FriendCardProps {
  friend: Friend;
}

export default function FriendCard({ friend }: FriendCardProps) {
  const { username, status, game } = friend;
  
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center">
          <User className="w-6 h-6 text-white/40" />
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
          status === 'online' ? 'bg-green-500' : 
          status === 'playing' ? 'bg-neon-cyan' : 'bg-white/20'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate">{username}</h4>
        <p className="text-[10px] font-mono text-white/40 uppercase">
          {status === 'playing' ? `Playing: ${game}` : status}
        </p>
      </div>
      <button
        className="p-2 text-white/20 hover:text-neon-cyan transition-colors"
        aria-label={`Open chat with ${username}`}
        title={`Message ${username}`}
      >
        <Terminal className="w-4 h-4" />
      </button>
    </div>
  );
}