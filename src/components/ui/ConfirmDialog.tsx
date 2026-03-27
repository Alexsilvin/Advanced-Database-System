import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-90 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b0b0b] p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-neon-magenta/10 border border-neon-magenta/30 text-neon-magenta">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black tracking-widest">{title}</h3>
                <p className="text-xs font-mono text-white/60 leading-relaxed">{description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-white/15 text-xs font-black text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-neon-magenta text-white text-xs font-black hover:bg-neon-magenta/80 transition-colors"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
