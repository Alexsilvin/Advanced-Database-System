import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Friend } from '../types';
import FriendCard from '../components/ui/FriendCard';

interface FriendsProps {
  friends: Friend[];
  onAddFriend: (username: string) => Promise<void>;
}

export default function Friends({ friends, onAddFriend }: FriendsProps) {
  const [friendUsername, setFriendUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const openMessage = (username: string) => {
    setStatusMessage(`Chat channel opened with ${username}.`);
  };

  const submitAddFriend = async () => {
    const target = friendUsername.trim();
    if (!target) {
      setStatusMessage('Enter a username to add to GRID_CONTACTS.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddFriend(target);
      setStatusMessage(`${target.toUpperCase()} linked to GRID_CONTACTS.`);
      setFriendUsername('');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to add friend.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center gap-2">
          <input
            value={friendUsername}
            onChange={(event) => setFriendUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void submitAddFriend();
              }
            }}
            placeholder="username"
            className="px-3 py-1.5 bg-black/40 border border-white/20 rounded-lg text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/50"
            aria-label="Add friend by username"
          />
          <button
            onClick={() => void submitAddFriend()}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono hover:bg-neon-cyan/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'ADDING...' : '+ ADD_FRIEND'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <p className="text-xs font-mono text-neon-cyan/80 border border-neon-cyan/20 bg-neon-cyan/5 rounded-lg px-3 py-2">
          {statusMessage}
        </p>
      )}
      
      {friends.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
          <p className="text-white/40 font-mono">NO GRID CONTACTS YET</p>
          <p className="text-[11px] text-white/25 font-mono mt-1">Send or accept a friend request to populate this list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <FriendCard key={friend.username} friend={friend} onMessage={openMessage} />
          ))}
        </div>
      )}
    </motion.div>
  );
}