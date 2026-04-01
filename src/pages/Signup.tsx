import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Terminal, Zap, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface SignupProps {
  onSignup: (username: string) => void;
  onBackToWelcome: () => void;
}

export default function Signup({ onSignup, onBackToWelcome }: SignupProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!username.trim()) newErrors.username = 'User ID is required';
    else if (username.length < 3) newErrors.username = 'User ID must be at least 3 characters';

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';

    if (!password) newErrors.password = 'Pass-Key is required';
    else if (password.length < 8) newErrors.password = 'Pass-Key must be at least 8 characters';

    if (password !== confirmPassword) newErrors.confirmPassword = 'Pass-Keys do not match';

    if (!agreeTerms) newErrors.terms = 'You must agree to the terms and conditions';

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        onSignup(username);
      }, 1000);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
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
        {/* Back Button */}
        <button
          onClick={onBackToWelcome}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-mono tracking-widest">BACK TO HOME</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-neon-cyan/10 rounded-xl border border-neon-cyan/30">
              <Cpu className="w-8 h-8 text-neon-cyan" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter glitch-text">
              NEON<span className="text-neon-magenta">GRID</span>
            </h1>
          </div>
          <p className="text-white/40 font-mono text-xs tracking-widest uppercase">
            Create your profile
          </p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit}
          className="neon-border rounded-2xl bg-black/70 backdrop-blur-md p-8 space-y-5"
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neon-cyan tracking-widest uppercase">
              USER_ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
              placeholder="Choose your identifier..."
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 outline-none transition-colors ${
                errors.username ? 'border-red-500/50' : 'border-white/10 focus:border-neon-cyan/50'
              }`}
            />
            {errors.username && <p className="text-xs text-red-400 font-mono">{errors.username}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neon-cyan tracking-widest uppercase">
              EMAIL_ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="your@email.com..."
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 outline-none transition-colors ${
                errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-neon-cyan/50'
              }`}
            />
            {errors.email && <p className="text-xs text-red-400 font-mono">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neon-cyan tracking-widest uppercase">
              PASS_KEY
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="Enter at least 8 characters..."
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 pr-12 text-sm font-mono text-white placeholder:text-white/20 outline-none transition-colors ${
                  errors.password ? 'border-red-500/50' : 'border-white/10 focus:border-neon-cyan/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 font-mono">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-neon-cyan tracking-widest uppercase">
              CONFIRM PASS_KEY
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                placeholder="Re-enter your pass-key..."
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 pr-12 text-sm font-mono text-white placeholder:text-white/20 outline-none transition-colors ${
                  errors.confirmPassword ? 'border-red-500/50' : 'border-white/10 focus:border-neon-cyan/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-3 text-white/40 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 font-mono">{errors.confirmPassword}</p>}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.terms) setErrors({ ...errors, terms: '' });
              }}
              className="mt-1 w-4 h-4 rounded border-white/20 accent-neon-cyan"
            />
            <label htmlFor="terms" className="text-xs text-white/50 font-mono">
              I agree to the{' '}
              <span className="text-neon-cyan hover:underline cursor-pointer">Terms of Service</span> and{' '}
              <span className="text-neon-cyan hover:underline cursor-pointer">Privacy Policy</span>
            </label>
          </div>
          {errors.terms && <p className="text-xs text-red-400 font-mono">{errors.terms}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 font-black tracking-tighter italic active:scale-95 transition-all flex items-center justify-center gap-2 rounded-lg border bg-neon-magenta border-neon-magenta text-black hover:bg-neon-magenta/80 shadow-[0_0_20px_rgba(255,0,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Terminal className="w-5 h-5 animate-spin" />
                INITIALIZING_ACCOUNT
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                CREATE ACCOUNT
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-white/40 font-mono">
              Already part of the grid?{' '}
              <span
                onClick={onBackToWelcome}
                className="text-neon-cyan hover:underline cursor-pointer font-black"
              >
                LOG IN
              </span>
            </p>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 flex items-center gap-3 justify-center">
          <Terminal className="w-3 h-3 text-white/20" />
          <p className="text-[10px] font-mono text-white/20 tracking-widest">
            SECURE ACCOUNT CREATION // ENCRYPTION ACTIVE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
