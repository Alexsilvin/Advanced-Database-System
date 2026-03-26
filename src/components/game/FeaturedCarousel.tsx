import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Game } from '../../types';

interface FeaturedCarouselProps {
    games: Game[];
    onBuy: (gameId: number) => void;
    onSelect: (game: Game) => void;
    library: number[];
}

export default function FeaturedCarousel({ games, onBuy, onSelect, library }: FeaturedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const featuredGames = games.slice(0, 5); // Use first 5 games as featured

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [featuredGames.length]);

    if (featuredGames.length === 0) return null;

    const next = () => setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);

    const currentGame = featuredGames[currentIndex];
    const isOwned = library.includes(currentGame.id);

    return (
        <div className="relative group overflow-hidden rounded-2xl border border-neon-cyan/20 bg-black/40">
            <div className="relative h-[400px] md:h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <img
                            src={currentGame.image}
                            alt={currentGame.title}
                            className="w-full h-full object-cover opacity-70"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

                        <div
                            className="absolute bottom-12 left-8 md:left-12 max-w-2xl space-y-4 cursor-pointer"
                            onClick={() => onSelect(currentGame)}
                        >
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-block px-3 py-1 bg-neon-magenta text-white text-[10px] font-black uppercase tracking-widest skew-x-[-12deg]"
                            >
                                Featured Protocol
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none hover:text-neon-cyan transition-colors"
                            >
                                {currentGame.title}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-white/70 text-sm md:text-lg font-mono line-clamp-2 max-w-xl"
                            >
                                {currentGame.description}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="pt-4 flex items-center gap-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => onBuy(currentGame.id)}
                                    disabled={isOwned}
                                    className={`px-8 py-3 font-black text-sm flex items-center gap-2 transition-all ${isOwned
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/40 cursor-default'
                                        : 'bg-white text-black hover:bg-neon-cyan hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    {isOwned ? 'OWNED_IN_GRID' : `ACQUIRE_FOR $${currentGame.price}`}
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-cyan hover:text-black"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-cyan hover:text-black"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 right-8 flex gap-2">
                {featuredGames.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-neon-cyan' : 'w-2 bg-white/20 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
