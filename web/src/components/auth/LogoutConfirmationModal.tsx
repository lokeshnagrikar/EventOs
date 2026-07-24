"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertTriangle, X, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { useRouter } from "next/navigation";

export function LogoutConfirmationModal() {
  const router = useRouter();
  const { isLogoutOpen, closeLogoutModal } = useAuthModalStore();
  const { clearAuth, user, activeTenantId, memberships } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeWorkspace = memberships.find((m) => m.tenantId === activeTenantId);
  const workspaceName = activeWorkspace?.companyName || "Active Workspace";

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear cookies
      document.cookie = "hasSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Clear local storage items
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");

      // Clear Zustand Auth state
      clearAuth();

      addToast("Successfully signed out. See you soon!", "info");
      closeLogoutModal();
      router.push("/");
    } catch (e) {
      addToast("Signed out of local session.", "info");
      closeLogoutModal();
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  if (!isLogoutOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-zinc-950 text-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-2xl shadow-rose-950/40 relative overflow-hidden select-none"
        >
          {/* Top Subtle Red Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent blur-sm" />

          {/* Close button */}
          <button
            onClick={closeLogoutModal}
            className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="space-y-5 text-center">
            {/* Warning Shield Badge Icon */}
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
              <LogOut size={28} className="translate-x-0.5" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold tracking-tight text-white">
                Sign Out of EventOS?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to end your active session? You will need to log back in to access your event dashboard and live bookings.
              </p>
            </div>

            {/* Active User Context Pill */}
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center justify-between text-left text-xs">
              <div className="space-y-0.5">
                <div className="text-white font-bold truncate">{user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Active User"}</div>
                <div className="text-[10px] text-purple-400 font-mono font-medium truncate">{workspaceName}</div>
              </div>
              <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold uppercase rounded-md">
                Active Session
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={loggingOut}
                onClick={closeLogoutModal}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleConfirmLogout}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    <span>Yes, Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
