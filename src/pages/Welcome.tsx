import React from 'react';
import { Cpu, Zap, Gamepad2, Users, ShieldCheck, Gauge, Star, ChevronRight } from 'lucide-react';
import { Game } from '../types';
import { formatPrice } from '../utils';

interface WelcomeProps {
  onGetStarted: () => void;
  onLogin: () => void;
  games: Game[];
}

export default function Welcome({ onGetStarted, onLogin, games }: WelcomeProps) {
  const featuredGames = (games.length > 0 ? games : [
    {
      id: 101,
      title: 'NEON STRIKE',
      price: 29.99,
      description: 'High-speed glitch combat in the digital void. Master the art of code-warfare.',
      image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200',
      category: 'Action',
      rating: '9.2/10',
    },
    {
      id: 102,
      title: 'VOID RUNNER',
      price: 19.99,
      description: 'Escape the collapsing simulation in this high-octane racing experience.',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
      category: 'Racing',
      rating: '8.5/10',
    },
    {
      id: 103,
      title: 'CYBER-SOUL',
      price: 39.99,
      description: 'A deep RPG set in a decaying megacity. Every choice alters the grid\'s fate.',
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200',
      category: 'RPG',
      rating: '9.5/10',
    },
    {
      id: 104,
      title: 'GLITCH-BIT',
      price: 14.99,
      description: 'Retro platforming with a broken twist. Navigate through fragmented data.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
      category: 'Platformer',
      rating: '7.8/10',
    },
    {
      id: 105,
      title: 'TERMINAL VELOCITY',
      price: 24.99,
      description: 'Tactical shooter in a low-poly digital landscape. Precision is everything.',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
      category: 'Shooter',
      rating: '8.9/10',
    },
    {
      id: 106,
      title: 'DATA DRIFTER',
      price: 9.99,
      description: 'Zen-like strategy game about navigating the streams of information.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
      category: 'Strategy',
      rating: '8.2/10',
    },
  ]).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#070b18] text-white relative overflow-hidden page-enter">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,243,255,0.16)_0%,transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,0,255,0.12)_0%,transparent_32%)]" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,243,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.12)_1px,transparent_1px)] bg-size-[72px_72px]" />

      <header className="relative z-10 border-b border-white/10 bg-black/70 backdrop-blur-md reveal-up">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
              <Cpu className="w-6 h-6 text-neon-cyan" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">
              NEON<span className="text-neon-magenta">GRID</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-5 py-2 text-sm font-black tracking-widest italic border border-white/20 text-white/80 hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
            >
              LOG IN
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2 text-sm font-black tracking-widest italic bg-neon-magenta text-black hover:bg-neon-magenta/90 transition-colors"
            >
              SIGN UP
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 rounded-3xl border border-white/10 bg-black/45 backdrop-blur-md p-8 md:p-12 shadow-[0_0_60px_rgba(0,0,0,0.35)] reveal-up reveal-delay-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mx-auto">
              <span className="w-2 h-2 rounded-full bg-neon-cyan" />
              <span className="text-sm font-mono tracking-wider text-neon-cyan uppercase">Retro gaming store</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight">
              Play Classic Games
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-cyan via-neon-magenta to-neon-cyan">
                Without Limits
              </span>
            </h2>

            <p className="text-lg md:text-xl text-white/70 font-mono max-w-2xl mx-auto leading-relaxed">
              Browse the featured games below. Create an account to unlock downloads and build your library.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta text-xs font-black tracking-widest uppercase">
              Downloads require signup
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-3 bg-linear-to-r from-neon-cyan to-neon-magenta text-black font-black italic tracking-widest flex items-center gap-2 hover:opacity-95 transition-opacity"
              >
                <Zap className="w-5 h-5" />
                START YOUR JOURNEY
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-3 border-2 border-neon-magenta text-neon-magenta font-black italic tracking-widest hover:bg-neon-magenta/10 transition-colors"
              >
                Already Connected?
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-16 reveal-up reveal-delay-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 py-10 border-y border-white/10">
            <div className="text-center">
              <p className="text-4xl font-black text-neon-cyan">{games.length || 6}+</p>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-2">GAMES AVAILABLE</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-neon-magenta">24/7</p>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-2">ONLINE SUPPORT</p>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <p className="text-4xl font-black text-neon-cyan">99.9%</p>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-2">UPTIME GUARANTEED</p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-20 reveal-up reveal-delay-3">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter">FEATURED TITLES</h3>
              <p className="text-white/50 font-mono mt-2">Sign up to download any title you see here.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-neon-cyan/80 font-black">
              <Gamepad2 className="w-4 h-4" />
              Featured
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGames.map((game) => (
              <article key={game.id} className="rounded-2xl overflow-hidden border border-white/10 bg-black/55 transition-transform duration-300 hover:-translate-y-1 card-breathe">
                <div className="relative h-56 overflow-hidden bg-black">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/70 border border-white/10 text-[10px] font-black tracking-widest uppercase text-white/70">
                    Signup required
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-lg font-black italic tracking-tight">{game.title}</h4>
                    <p className="text-xs text-neon-cyan font-mono uppercase tracking-widest mt-1">{game.category}</p>
                  </div>
                </div>
                <div className="p-4 bg-black/75">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-neon-magenta italic">{formatPrice(game.price)}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-black">{game.rating || '—'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/55 line-clamp-2 font-mono mb-3">{game.description}</p>
                  <button
                    onClick={onGetStarted}
                    className="w-full py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-black italic hover:bg-neon-cyan/20 transition-colors"
                  >
                    SIGN UP TO DOWNLOAD
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-20 reveal-up reveal-delay-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gamepad2 className="w-5 h-5 text-neon-cyan" />
                <h3 className="text-xl font-black italic tracking-tighter">WHY CHOOSE NEON-GRID?</h3>
              </div>
              <div className="space-y-3 text-sm text-white/65 font-mono">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-neon-magenta" />Retro gaming community</div>
                <div className="flex items-center gap-2"><Gauge className="w-4 h-4 text-neon-cyan" />Fast catalog browsing and downloads</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-neon-cyan" />Secure account-based access</div>
              </div>
            </div>

            <div className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-6">
              <h3 className="text-xl font-black italic tracking-tighter mb-3">JOIN THE GRID TODAY</h3>
              <p className="text-sm text-white/70 font-mono leading-relaxed mb-5">
                Create your account to unlock the download library and access the games you see on this page.
              </p>
              <button
                onClick={onGetStarted}
                className="px-6 py-3 bg-neon-magenta text-black font-black italic tracking-widest flex items-center gap-2 hover:bg-neon-magenta/90 transition-colors"
              >
                CREATE ACCOUNT <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
