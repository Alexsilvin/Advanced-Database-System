import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Gamepad2, Users, Star, ChevronRight, ShieldCheck, Gauge } from 'lucide-react';
import { Game } from '../types';

interface WelcomeProps {
  onGetStarted: () => void;
  onLogin: () => void;
  games: Game[];
}

export default function Welcome({ onGetStarted, onLogin, games }: WelcomeProps) {
  const features = [
    {
      icon: Gamepad2,
      title: 'RETRO GAMING VAULT',
      description: 'Curated collection of classic NES-style and retro titles.',
    },
    {
      icon: Users,
      title: 'SOCIAL GRID',
      description: 'Connect with friends, share games, and play together.',
    },
    {
      icon: Gauge,
      title: 'INSTANT ACCESS',
      description: 'Add to bucket and acquire games in seconds.',
    },
    {
      icon: ShieldCheck,
      title: 'SECURE & RELIABLE',
      description: 'Your library data persisted safely in the cloud.',
    },
  ];

  const featuredGames = games.slice(0, 6);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Scanlines */}
      <div className="scanline" />

      {/* Background grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,243,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.1)_1px,transparent_1px)] bg-size-[80px_80px]" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,243,255,0.05)_0%,transparent_70%)]" />

      {/* Header Navigation */}
      <header className="relative z-10 border-b border-white/5 bg-black/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
              <Cpu className="w-6 h-6 text-neon-cyan" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter glitch-text">
              NEON<span className="text-neon-magenta">GRID</span>
            </h1>
          </motion.div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-6 py-2 text-sm font-black tracking-widest italic border border-white/20 hover:border-neon-cyan/50 text-white/60 hover:text-neon-cyan transition-colors"
            >
              LOG IN
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 text-sm font-black tracking-widest italic bg-neon-magenta text-black hover:bg-neon-magenta/80 transition-all"
            >
              SIGN UP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-sm font-mono tracking-wider text-neon-cyan">WELCOME TO THE FUTURE OF RETRO GAMING</span>
            </div>

            <h2 className="text-6xl md:text-7xl font-black italic tracking-tighter leading-tight">
              Play Classic Games<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan">
                Without Limits
              </span>
            </h2>

            <p className="text-xl text-white/60 font-mono max-w-2xl mx-auto leading-relaxed">
              NEON-GRID is the ultimate platform for discovering, collecting, and playing retro classics. 
              Build your library of iconic titles and connect with the global retro gaming community.
            </p>

            <div className="flex items-center justify-center gap-4 pt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-black italic tracking-widest flex items-center gap-2 hover:shadow-[0_0_40px_rgba(0,243,255,0.6)] transition-all"
              >
                <Zap className="w-5 h-5" />
                START YOUR JOURNEY
              </motion.button>
              <button
                onClick={onLogin}
                className="px-8 py-3 border-2 border-neon-magenta text-neon-magenta font-black italic tracking-widest hover:bg-neon-magenta/10 transition-all"
              >
                Already Connected?
              </button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 py-12 border-y border-white/10"
          >
            <div className="text-center">
              <p className="text-4xl font-black text-neon-cyan">{games.length}+</p>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-2">GAMES AVAILABLE</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-neon-magenta">24/7</p>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-2">ONLINE SUPPORT</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-neon-cyan">99.9%</p>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-2">UPTIME GUARANTEED</p>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 space-y-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <h3 className="text-4xl font-black italic tracking-tighter">WHY CHOOSE NEON-GRID?</h3>
            <p className="text-white/50 font-mono max-w-2xl mx-auto">Experience the ultimate retro gaming platform with modern conveniences.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all group"
                >
                  <div className="p-3 bg-neon-cyan/10 rounded-lg w-fit mb-4 group-hover:bg-neon-magenta/10 transition-colors">
                    <Icon className="w-6 h-6 text-neon-cyan group-hover:text-neon-magenta transition-colors" />
                  </div>
                  <h4 className="text-sm font-black tracking-tight mb-2 italic">{feature.title}</h4>
                  <p className="text-xs text-white/50 leading-relaxed font-mono">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Featured Games Section */}
        {featuredGames.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-20 space-y-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-3"
            >
              <h3 className="text-4xl font-black italic tracking-tighter">FEATURED TITLES</h3>
              <p className="text-white/50 font-mono max-w-2xl mx-auto">Check out some of our most popular retro games.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGames.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group rounded-2xl overflow-hidden border border-white/10 hover:border-neon-cyan/50 transition-all"
                >
                  <div className="relative h-48 overflow-hidden bg-black">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-lg font-black italic tracking-tight">{game.title}</h4>
                      <p className="text-xs text-neon-cyan font-mono uppercase tracking-widest mt-1">{game.category}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-black/50 backdrop-blur">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-black text-neon-magenta italic">${game.price.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-black">{game.rating || '—'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2 font-mono mb-3">{game.description}</p>
                    <button
                      onClick={onGetStarted}
                      className="w-full py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-black italic hover:bg-neon-cyan/20 transition-all"
                    >
                      VIEW & ACQUIRE
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* About Us Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 space-y-12 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h3 className="text-4xl font-black italic tracking-tighter">ABOUT NEON-GRID</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <p className="text-white/70 leading-relaxed font-mono">
                  NEON-GRID was born from a passion for retro gaming and a mission to make classic titles accessible to the modern gamer. 
                  We believe that the golden age of gaming—NES, SNES, Sega, arcade classics—deserves a platform that honors their legacy 
                  while providing today's conveniences.
                </p>
                <p className="text-white/70 leading-relaxed font-mono">
                  Our platform is built with cutting-edge technology (React, PostgreSQL, Express) to ensure a seamless, performant, 
                  and secure experience. Every game in our vault has been carefully curated for quality and cultural significance.
                </p>
                <ul className="space-y-3 text-sm text-white/60 font-mono">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-neon-cyan" />
                    Lightning-fast game discovery and instant access
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neon-magenta" />
                    Social features to share your retro passion
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                    Bank-level security for your library
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="p-8 border-2 border-neon-cyan/30 rounded-2xl bg-neon-cyan/5 space-y-4"
              >
                <h4 className="text-lg font-black italic tracking-tight">OUR MISSION</h4>
                <p className="text-white/70 leading-relaxed font-mono text-sm">
                  "To preserve, celebrate, and share the magic of retro gaming with players worldwide, 
                  creating a vibrant community where classic games find new life and meaning."
                </p>
                <div className="pt-4 border-t border-neon-cyan/20">
                  <p className="text-xs text-neon-cyan font-mono uppercase tracking-widest">Founded 2026</p>
                  <p className="text-xs text-white/40 font-mono mt-2">Advanced Database Systems Initiative</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative p-12 border-2 border-neon-magenta/30 rounded-3xl bg-gradient-to-r from-neon-magenta/10 to-neon-cyan/10 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(0,243,255,0.1)_25%,rgba(0,243,255,0.1)_50%,transparent_50%,transparent_75%,rgba(0,243,255,0.1)_75%,rgba(0,243,255,0.1))] bg-size-[40px_40px] animate-pulse" />

            <div className="relative z-10 text-center space-y-6">
              <h3 className="text-4xl font-black italic tracking-tighter">Join the Grid Today</h3>
              <p className="text-white/60 font-mono max-w-2xl mx-auto">
                Sign up now and get instant access to our entire retro game catalog. No credit card required.
              </p>

              <div className="flex items-center justify-center gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="px-8 py-3 bg-neon-magenta text-black font-black italic tracking-widest flex items-center gap-2 hover:shadow-[0_0_40px_rgba(255,0,255,0.6)] transition-all"
                >
                  CREATE ACCOUNT <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-neon-cyan" />
                <span className="font-black italic">NEON-GRID</span>
              </div>
              <p className="text-xs text-white/40 font-mono">The platform for retro gaming enthusiasts.</p>
            </div>
            <div>
              <p className="text-xs font-black italic mb-3">PLATFORM</p>
              <ul className="space-y-2 text-xs text-white/50 font-mono">
                <li className="hover:text-neon-cyan cursor-pointer">Games</li>
                <li className="hover:text-neon-cyan cursor-pointer">Community</li>
                <li className="hover:text-neon-cyan cursor-pointer">Support</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black italic mb-3">LEGAL</p>
              <ul className="space-y-2 text-xs text-white/50 font-mono">
                <li className="hover:text-neon-cyan cursor-pointer">Terms</li>
                <li className="hover:text-neon-cyan cursor-pointer">Privacy</li>
                <li className="hover:text-neon-cyan cursor-pointer">Cookies</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black italic mb-3">CONNECT</p>
              <ul className="space-y-2 text-xs text-white/50 font-mono">
                <li className="hover:text-neon-cyan cursor-pointer">Twitter</li>
                <li className="hover:text-neon-cyan cursor-pointer">Discord</li>
                <li className="hover:text-neon-cyan cursor-pointer">Contact</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex items-center justify-between">
            <p className="text-[10px] font-mono text-white/20 tracking-[0.3em]">
              © 2026 NEON-GRID // ALL RIGHTS RESERVED // STABILITY: 99.9%
            </p>
            <p className="text-[10px] font-mono text-white/35">
              Built with React, Node.js & PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
