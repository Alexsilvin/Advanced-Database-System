import React, { useState } from 'react';
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
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [statusMessage, setStatusMessage] = useState('');

  const addEntity = () => {
    const id = friends.length + 1;
    const statuses: Friend['status'][] = ['online', 'offline', 'playing'];
    const nextStatus = statuses[id % statuses.length];
    const newFriend: Friend = {
      username: `NEW_ENTITY_${String(id).padStart(2, '0')}`,
      status: nextStatus,
      ...(nextStatus === 'playing' ? { game: 'VOID RUNNER' } : {}),
    };

    setFriends((prev) => [newFriend, ...prev]);
    setStatusMessage(`${newFriend.username} added to GRID_CONTACTS.`);
  };

  const openMessage = (username: string) => {
    setStatusMessage(`Chat channel opened with ${username}.`);
  };

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
        <button
          onClick={addEntity}
          className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono hover:bg-neon-cyan/20 transition-colors"
        >
          + ADD_ENTITY
        </button>
      </div>

      {statusMessage && (
        <p className="text-xs font-mono text-neon-cyan/80 border border-neon-cyan/20 bg-neon-cyan/5 rounded-lg px-3 py-2">
          {statusMessage}
        </p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <FriendCard key={friend.username} friend={friend} onMessage={openMessage} />
        ))}
      </div>
    </motion.div>
  );
}