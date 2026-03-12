import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Terminal, Zap, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);
  const [buttonState, setButtonState] = useState<'idle' | 'hover' | 'arming'>('idle');

  const triggerGlitch = () => {
    setIsGlitching(false);
    // Force reflow so re-entering replays the animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsGlitching(true));
    });
    setTimeout(() => setIsGlitching(false), 520);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (buttonState === 'arming') {
      return;
    }

    setButtonState('arming');
    triggerGlitch();
    window.setTimeout(() => onLogin(), 380);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden ${isGlitching ? 'login-glitch' : ''}`}
      onMouseEnter={triggerGlitch}
    >
      <div className="scanline" />

      {/* Background grid */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(0,243,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.07)_1px,transparent_1px)] bg-size-[60px_60px]" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,243,255,0.08)_0%,transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-neon-cyan/10 rounded-xl border border-neon-cyan/30">
              <Cpu className="w-8 h-8 text-neon-cyan" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter glitch-text">
              NEON<span className="text-neon-magenta">GRID</span>
            </h1>
          </div>
          <p className="text-white/40 font-mono text-xs tracking-widest uppercase">
            Authentication_Protocol v2.4
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="neon-border rounded-2xl bg-black/70 backdrop-blur-md p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neon-cyan tracking-widest uppercase">
              USER_ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your identifier..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/50 transition-colors"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neon-cyan tracking-widest uppercase">
              PASS_KEY
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your key..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/50 transition-colors"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            onMouseEnter={() => {
              if (buttonState !== 'arming') {
                setButtonState('hover');
              }
            }}
            onMouseLeave={() => {
              if (buttonState !== 'arming') {
                setButtonState('idle');
              }
            }}
            className={`w-full py-3 font-black tracking-tighter italic active:scale-95 transition-all flex items-center justify-center gap-2 rounded-lg border ${
              buttonState === 'idle'
                ? 'bg-neon-cyan border-neon-cyan text-black hover:bg-neon-cyan/90 shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                : 'bg-black/90 border-neon-cyan/60 text-neon-cyan shadow-[0_0_28px_rgba(0,243,255,0.45)]'
            } ${buttonState !== 'idle' ? 'login-button-grid' : ''}`}
          >
            <Zap className={`w-5 h-5 transition-colors ${buttonState === 'idle' ? 'text-black' : 'text-neon-cyan'}`} />
            {buttonState === 'idle' ? (
              <span>CONNECT TO GRID</span>
            ) : buttonState === 'hover' ? (
              <span className="glitch-text">
                NEON<span className="text-neon-magenta">GRID</span>_LINK
              </span>
            ) : (
              <span className="glitch-text">
                NEON<span className="text-neon-magenta">GRID</span>_SYNC
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 justify-center pt-1">
            <Shield className="w-3 h-3 text-white/20" />
            <p className="text-[10px] font-mono text-white/20 tracking-wide">
              NO AUTH REQUIRED — CLICK TO PROCEED
            </p>
          </div>
        </form>

        <div className="mt-6 flex items-center gap-3 justify-center">
          <Terminal className="w-3 h-3 text-white/20" />
          <p className="text-[10px] font-mono text-white/20 tracking-widest">
            SYSTEM SECURE // ENCRYPTION ACTIVE // NODE: EU-WEST-9
          </p>
        </div>
      </motion.div>
    </div>
  );
}
