import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

type ToastVariant = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export default function Toast({ message, variant = 'info', actionLabel, onAction, onClose }: ToastProps) {
  const palette =
    variant === 'success'
      ? 'border-green-400/40 bg-green-500/10 text-green-300'
      : variant === 'error'
      ? 'border-red-400/40 bg-red-500/10 text-red-300'
      : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan';

  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? AlertCircle : Info;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-100"
        >
          <div className={`max-w-sm w-[92vw] md:w-auto border rounded-xl px-4 py-3 backdrop-blur-md shadow-lg ${palette}`}>
            <div className="flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs font-mono leading-relaxed flex-1">{message}</p>
              {actionLabel && onAction ? (
                <button
                  onClick={onAction}
                  className="text-[10px] font-black tracking-wider px-2 py-1 rounded border border-current/40 hover:bg-white/10 transition-colors"
                >
                  {actionLabel}
                </button>
              ) : null}
              <button onClick={onClose} className="opacity-70 hover:opacity-100" aria-label="Close notification" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
