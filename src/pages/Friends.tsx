import React from 'react';
import { motion } from 'motion/react';
import { Friend } from '../types';
import FriendCard from '../components/ui/FriendCard';

const mockFriends: Friend[] = [
  { username: "VOID_WALKER", status: "playing", game: "NEON STRIKE" },
  { username: "GLITCH_GHOST", status: "online" },
  { username: "CYBER_PUNK_88", status: "offline" },
  { username: "NULL_POINTER", status: "online" }
];

export default function Friends() {
  return (
    <motion.div 
      key="friends"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter">GRID_CONTACTS</h2>
        <button className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono hover:bg-neon-cyan/20 transition-colors">
          + ADD_ENTITY
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockFriends.map((friend, index) => (
          <FriendCard key={index} friend={friend} />
        ))}
      </div>
    </motion.div>
  );
}