import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchGroups, createGroup, fetchGroupMessages, sendGroupMessage } from '../services/api';
import type { MessageGroup, GroupMessage } from '../types';

interface GroupsPageProps {
  userId: string;
}

export default function Groups({ userId }: GroupsPageProps) {
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchGroups();
        setGroups(data);
      } catch (error) {
        console.error('Failed to load groups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
    const interval = setInterval(loadGroups, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load group messages
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadMessages = async () => {
      try {
        const data = await fetchGroupMessages(selectedGroupId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to load group messages:', error);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedGroupId]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const newGroup = await createGroup(newGroupName, newGroupDesc);
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroupId) return;

    setSendingMessage(true);
    try {
      const newMessage = await sendGroupMessage(selectedGroupId, messageInput);
      setMessages([...messages, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Groups List */}
      <motion.div 
        className="w-80 bg-gray-900/50 rounded-lg p-4 border border-gray-700 overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Communities</h2>
          <motion.button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
            whileHover={{ scale: 1.05 }}
          >
            +
          </motion.button>
        </div>

        {showCreateForm && (
          <motion.div 
            className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <input
              type="text"
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white mb-2 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
            <textarea
              placeholder="Description (optional)..."
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white mb-2 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="text-gray-400">Loading communities...</div>
        ) : groups.length === 0 ? (
          <div className="text-gray-400 text-sm">No communities yet. Create one to discuss games and trends!</div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <motion.button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedGroupId === group.id
                    ? 'bg-green-600/30 border border-green-500'
                    : 'hover:bg-gray-800 border border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <p className="font-semibold text-white truncate">{group.name}</p>
                <p className="text-xs text-gray-400">
                  {group.member_count || 0} members
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Group Chat Area */}
      {selectedGroupId ? (
        <motion.div 
          className="flex-1 flex flex-col bg-gray-900/50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-4">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className="flex gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-400">{msg.sender_username}</p>
                    <div className="bg-gray-700 rounded-lg px-3 py-2 inline-block text-gray-100">
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              disabled={sendingMessage}
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageInput.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white font-semibold transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-700">
          <p className="text-gray-400">Select a community to chat</p>
        </div>
      )}
    </div>
  );
}
