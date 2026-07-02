'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const SessionTimeoutHandler: React.FC = () => {
  const { isAuthenticated, clearAuth } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningCountdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const INACTIVITY_LIMIT = 13 * 60 * 1000; // 13 minutes
  const WARNING_DURATION = 60; // 60 seconds

  const resetActivityTimer = () => {
    if (!isAuthenticated) return;
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    activityTimeoutRef.current = setTimeout(() => {
      // Inactivity limit reached, show warning dialog
      setShowWarning(true);
      setCountdown(WARNING_DURATION);
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
      return;
    }

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handleActivity = () => {
      resetActivityTimer();
    };
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetActivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (showWarning) {
      // Decrement countdown every second
      warningCountdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(warningCountdownRef.current!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningCountdownRef.current) {
        clearInterval(warningCountdownRef.current);
      }
    }

    return () => {
      if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
    };
  }, [showWarning]);

  const handleLogout = () => {
    clearAuth();
    setShowWarning(false);
    router.push('/login?expired=true');
  };

  const handleExtend = async () => {
    try {
      await apiClient.post('/auth/refresh', {});
      setShowWarning(false);
      resetActivityTimer();
    } catch (e) {
      handleLogout();
    }
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl text-white text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold tracking-wide mb-2">Session Expiring</h3>
            <p className="text-sm text-zinc-400 mb-6">
              You have been inactive for a while. For your security, your session will expire in <span className="font-mono text-amber-500 font-bold">{countdown}</span> seconds.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 active:bg-white/5 transition text-sm font-medium text-white"
              >
                Sign Out
              </button>
              <button
                onClick={handleExtend}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition text-sm font-medium text-white shadow-lg shadow-purple-600/20"
              >
                Keep Me Signed In
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
