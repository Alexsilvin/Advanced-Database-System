import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, UserRoundPlus } from 'lucide-react';
import { Friend } from '../types';
import FriendCard from '../components/ui/FriendCard';
import { searchUsers } from '../services/api';
import { UserSearchResult } from '../types';

interface FriendsProps {
  friends: Friend[];
  onAddFriend: (username: string) => Promise<void>;
  onOpenProfile: (username: string) => void;
  onStartMessage: (target: { id: string; username: string }) => void;
}

export default function Friends({ friends, onAddFriend, onOpenProfile, onStartMessage }: FriendsProps) {
  const [friendUsername, setFriendUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const term = friendUsername.trim();
    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchUsers(term);
          if (isActive) {
            setSearchResults(results);
          }
        } catch {
          if (isActive) {
            setSearchResults([]);
          }
        } finally {
          if (isActive) {
            setIsSearching(false);
          }
        }
      })();
    }, 180);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [friendUsername]);

  const openMessage = (username: string) => {
    void (async () => {
      try {
        const matches = await searchUsers(username);
        const exact = matches.find((user) => user.username.toLowerCase() === username.toLowerCase());
        const target = exact ?? matches[0];

        if (!target) {
          setStatusMessage(`Could not locate ${username} in search results.`);
          return;
        }

        onStartMessage({ id: target.id, username: target.username });
      } catch {
        setStatusMessage(`Failed to open chat with ${username}.`);
      }
    })();
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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/20 rounded-lg text-white/40 text-xs font-mono">
            <Search className="w-3.5 h-3.5" />
            LIVE_USER_SEARCH
          </div>
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

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono tracking-[0.35em] text-neon-cyan uppercase">Search results</p>
            <p className="text-xs text-white/40 font-mono mt-1">Type a username to progressively discover users.</p>
          </div>
          <UserRoundPlus className="w-4 h-4 text-neon-magenta" />
        </div>

        {friendUsername.trim() ? (
          isSearching ? (
            <p className="text-xs font-mono text-white/40">Scanning the grid...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-xs font-mono text-white/40">No matching users found.</p>
          ) : (
            <div className="grid gap-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{user.username}</p>
                    <p className="text-[10px] font-mono text-white/40 uppercase">
                      {user.is_friend ? 'Already in GRID_CONTACTS' : user.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenProfile(user.username)}
                      className="text-[10px] font-mono px-2 py-1 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30"
                    >
                      PROFILE
                    </button>
                    {!user.is_friend && (
                      <button
                        onClick={() => void onAddFriend(user.username)}
                        className="text-[10px] font-mono px-2 py-1 rounded-full border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20"
                      >
                        ADD
                      </button>
                    )}
                    <button
                      onClick={() => onStartMessage({ id: user.id, username: user.username })}
                      className="text-[10px] font-mono px-2 py-1 rounded-full border border-neon-magenta/30 text-neon-magenta hover:bg-neon-magenta/20"
                    >
                      MESSAGE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-xs font-mono text-white/30">Search by username to reveal matching users here.</p>
        )}
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
            <FriendCard
              key={friend.username}
              friend={friend}
              onMessage={openMessage}
              onViewProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}