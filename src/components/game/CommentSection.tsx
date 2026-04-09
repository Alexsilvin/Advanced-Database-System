import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { Comment, GameId } from '../../types';

interface CommentSectionProps {
    gameId: GameId;
    currentUsername: string;
}

const STORAGE_KEY_PREFIX = 'neon-grid:comments:';

export default function CommentSection({ gameId, currentUsername }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`);
        if (stored) {
            try {
                setComments(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse comments', e);
            }
        } else {
            // Seed some initial comments for atmospheric effect
            const seed: Comment[] = [
                {
                    id: 'INIT_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                    gameId,
                    username: 'SYSTEM_BOT',
                    content: 'TRANSMISSION_LINK_ESTABLISHED. BEWARE_OF_DATA_CORRUPTION.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                }
            ];
            setComments(seed);
        }
    }, [gameId]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, JSON.stringify(comments));
    }, [comments, gameId]);

    const handleTransmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        
        // Simulate a small delay for "transmission" feel
        setTimeout(() => {
            const comment: Comment = {
                id: 'TX_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                gameId,
                username: currentUsername || 'GUEST_USER',
                content: newComment.trim(),
                timestamp: new Date().toISOString(),
            };

            setComments(prev => [comment, ...prev]);
            setNewComment('');
            setIsSubmitting(false);
        }, 600);
    };

    const handleDelete = (id: string) => {
        setComments(prev => prev.filter(c => c.id !== id));
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <section className="space-y-6 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                    <span className="w-1 h-6 bg-neon-cyan inline-block skew-x-[-15deg]" />
                    NETWORK_TRANSMISSIONS
                </h3>
                <span className="text-[10px] font-mono text-white/20 tracking-[0.2em]">
                    STABILITY: NO_CORRUPTION_DETECTED
                </span>
            </div>

            {/* Post Transmission Form */}
            <form onSubmit={handleTransmit} className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-neon-cyan/20 to-neon-magenta/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="ENTER_DATA_FOR_TRANSMISSION..."
                        className="w-full bg-transparent px-5 py-4 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none min-h-[100px] resize-none"
                    />
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                            LINKED_AS: <span className="text-neon-cyan">{currentUsername?.toUpperCase() || 'ANONYMOUS_VOID'}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black text-[10px] font-black italic tracking-widest rounded-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                        >
                            {isSubmitting ? 'TRANSMITTING...' : (
                                <>
                                    <Send className="w-3 h-3" />
                                    TRANSMIT_DATA
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Transmissions List */}
            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {comments.map((comment, index) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-5 rounded-2xl bg-white/5 border border-white/10 group hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neon-magenta/10 flex items-center justify-center border border-neon-magenta/20">
                                        <User className="w-5 h-5 text-neon-magenta" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black italic text-white/90">{comment.username}</span>
                                            {comment.username === 'SYSTEM_BOT' && (
                                                <span className="px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan text-[8px] font-black tracking-widest border border-neon-cyan/20">ROOT</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[8px] font-mono text-white/40 mt-1">
                                            <Clock className="w-2 h-2" />
                                            {formatTime(comment.timestamp)}
                                            <span className="text-white/20">|</span>
                                            ID: {comment.id}
                                        </div>
                                    </div>
                                </div>
                                
                                {(comment.username === currentUsername || currentUsername === 'admin') && (
                                    <button 
                                        onClick={() => handleDelete(comment.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-white/10 hover:text-red-400 transition-all"
                                        title="SCRUB_DATA"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <p className="mt-4 text-sm font-mono text-white/60 leading-relaxed pl-1">
                                {comment.content}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {comments.length === 0 && (
                    <div className="py-12 text-center space-y-3 opacity-30">
                        <ShieldAlert className="w-8 h-8 mx-auto text-white/60" />
                        <p className="text-[10px] font-mono tracking-[0.3em]">NO_TRANSMISSIONS_RECORDED_ON_THIS_GRID</p>
                    </div>
                )}
            </div>
        </section>
    );
}
