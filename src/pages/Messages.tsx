import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchConversations, fetchConversation, sendMessage, markMessagesAsRead } from '../services/api';
import type { Conversation, DirectMessage } from '../types';

interface MessagesPageProps {
  currentUserId: string;
  initialSelectedUserId?: string | null;
}

export default function Messages({ currentUserId, initialSelectedUserId = null }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch all conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await fetchConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    const interval = setInterval(loadConversations, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialSelectedUserId) {
      setSelectedUserId(initialSelectedUserId);
    }
  }, [initialSelectedUserId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedUserId) return;

    const loadMessages = async () => {
      try {
        const data = await fetchConversation(selectedUserId);
        setMessages(data);
        await markMessagesAsRead(selectedUserId);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [selectedUserId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return;

    setSendingMessage(true);
    try {
      const newMessage = await sendMessage(selectedUserId, messageInput);
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
      {/* Conversations List */}
      <motion.div 
        className="w-80 bg-gray-900/50 rounded-lg p-4 border border-gray-700 overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
        
        {loading ? (
          <div className="text-gray-400">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-gray-400 text-sm">No conversations yet. Add a friend to start messaging!</div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <motion.button
                key={conv.other_user_id}
                onClick={() => setSelectedUserId(conv.other_user_id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedUserId === conv.other_user_id
                    ? 'bg-blue-600/30 border border-blue-500'
                    : 'hover:bg-gray-800 border border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{conv.username}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-600 rounded-full text-xs text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Chat Area */}
      {selectedUserId ? (
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
                  className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id === currentUserId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
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
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              disabled={sendingMessage}
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-semibold transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-700">
          <p className="text-gray-400">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
