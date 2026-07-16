import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowUpRight, X } from 'lucide-react';
import { useLimitStore } from '@/store/limitStore';

export default function LimitExceededModal() {
  const { isOpen, reason, limitName, limitValue, currentValue, closeLimitModal } = useLimitStore();

  const handleUpgradeClick = () => {
    closeLimitModal();
    // Redirect to settings billing tab
    if (typeof window !== 'undefined') {
      window.location.href = '/settings?tab=billing';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLimitModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/20 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Red Accent Glow */}
            <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Limit Reached
                  </h3>
                  <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest mt-0.5">
                    Upgrade required
                  </p>
                </div>
              </div>
              <button
                onClick={closeLimitModal}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="mt-4 space-y-4">
              <p className="text-[11px] leading-relaxed font-semibold text-zinc-300">
                {reason}
              </p>

              {/* Progress Visualization */}
              <div className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-450 uppercase">
                  <span>Metric: {limitName}</span>
                  <span className="text-zinc-300">{currentValue} / {limitValue}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                  />
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal font-medium">
                  Upgrading your workspace instantly raises limits and unlocks premium enterprise features.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={closeLimitModal}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-transparent text-xs font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
              >
                Close
              </button>
              <button
                onClick={handleUpgradeClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg hover:shadow-purple-500/20 transition-all active:scale-98"
              >
                Upgrade Plan
                <ArrowUpRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
