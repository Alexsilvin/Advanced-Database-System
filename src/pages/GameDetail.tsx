import React from 'react';
import { motion } from 'motion/react';
import { ChefHat as CPU, Monitor, HardDrive, Cpu, Download, ArrowLeft, Star, ShieldCheck, Zap, ShoppingCart } from 'lucide-react';
import { Game } from '../types';

interface GameDetailProps {
    game: Game | null;
    owned: boolean;
    inBucket: boolean;
    onBack: () => void;
    onAcquire: (gameId: number) => void;
    onAddToBucket: (gameId: number) => void;
}

const SpecItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan/80">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold text-white/90 mt-1">{value}</p>
        </div>
    </div>
);

export default function GameDetail({ game, owned, inBucket, onBack, onAcquire, onAddToBucket }: GameDetailProps) {
    if (!game) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-5xl mx-auto space-y-8 pb-12"
        >
            {/* Top Navigation */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black tracking-widest italic">BACK_TO_GRID</span>
            </button>

            {/* Hero Header */}
            <div className="relative h-[400px] rounded-3xl overflow-hidden border border-white/10 group">
                <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-neon-cyan text-black text-[10px] font-black italic rounded">
                                {game.category.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-black italic">{game.rating || 'RATED: EXEMPT'}</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter text-white">
                            {game.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-mono text-white/40 tracking-widest uppercase mb-1">Grid Access Fee</p>
                            <p className="text-4xl font-black italic text-neon-magenta">${game.price}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Main Content */}
                <div className="space-y-12">
                    {/* About */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                            <span className="w-1 h-6 bg-neon-cyan inline-block skew-x-[-15deg]" />
                            MISSION_BRIEFING
                        </h3>
                        <p className="text-white/70 leading-relaxed font-mono text-sm max-w-2xl">
                            {game.description}
                        </p>
                    </section>

                    {/* System Requirements */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                            <span className="w-1 h-6 bg-neon-magenta inline-block skew-x-[-15deg]" />
                            HARDWARE_SPECIFICATIONS
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Minimum */}
                            <div className="space-y-4">
                                <p className="text-xs font-black text-white/20 italic ml-2 tracking-widest">MINIMUM_PROTOCOLS</p>
                                <div className="space-y-3">
                                    <SpecItem icon={Monitor} label="OS" value={game.minSpecs?.os || 'TBD'} />
                                    <SpecItem icon={CPU} label="Processor" value={game.minSpecs?.processor || 'TBD'} />
                                    <SpecItem icon={Cpu} label="Memory" value={game.minSpecs?.memory || 'TBD'} />
                                    <SpecItem icon={Monitor} label="Graphics" value={game.minSpecs?.graphics || 'TBD'} />
                                    <SpecItem icon={HardDrive} label="Storage" value={game.minSpecs?.storage || 'TBD'} />
                                </div>
                            </div>

                            {/* Recommended */}
                            <div className="space-y-4">
                                <p className="text-xs font-black text-neon-cyan/40 italic ml-2 tracking-widest">OPTIMAL_PROTOCOLS</p>
                                <div className="space-y-3">
                                    <SpecItem icon={Monitor} label="OS" value={game.recSpecs?.os || 'TBD'} />
                                    <SpecItem icon={CPU} label="Processor" value={game.recSpecs?.processor || 'TBD'} />
                                    <SpecItem icon={Cpu} label="Memory" value={game.recSpecs?.memory || 'TBD'} />
                                    <SpecItem icon={Monitor} label="Graphics" value={game.recSpecs?.graphics || 'TBD'} />
                                    <SpecItem icon={HardDrive} label="Storage" value={game.recSpecs?.storage || 'TBD'} />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Actions */}
                <aside className="space-y-6">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6 sticky top-8">
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-white/40 italic">ACQUISITION_STATUS</h4>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${owned ? 'bg-green-400 animate-pulse' : 'bg-neon-magenta animate-pulse'}`} />
                                <span className={`text-sm font-black italic ${owned ? 'text-green-400' : 'text-neon-magenta'}`}>
                                    {owned ? 'GRID_CONNECTED' : 'ACCESS_RESTRICTED'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {!owned ? (
                                <>
                                    <button
                                        onClick={() => onAddToBucket(game.id)}
                                        disabled={inBucket}
                                        className={`w-full py-4 rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 border transition-all ${inBucket
                                                ? 'border-neon-cyan/20 text-neon-cyan/40 cursor-default'
                                                : 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 active:scale-95'
                                            }`}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {inBucket ? 'IN_BUCKET' : 'ADD_TO_BUCKET'}
                                    </button>
                                    <button
                                        onClick={() => onAcquire(game.id)}
                                        className="w-full py-4 bg-neon-cyan text-black rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                                    >
                                        <Zap className="w-4 h-4" />
                                        ACQUIRE_NOW
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="w-full py-4 bg-green-500 text-black rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                >
                                    <Download className="w-4 h-4" />
                                    INITIALIZE_DOWNLOAD
                                </button>
                            )}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-3 text-white/60">
                                <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                                <span className="text-[10px] font-mono uppercase tracking-wider">Verified Secure Protocol</span>
                            </div>
                            <p className="text-[10px] text-white/30 font-mono leading-relaxed">
                                By acquiring this data package, you agree to the Neural-Link Distribution License and the Grid Security Acta.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
}
