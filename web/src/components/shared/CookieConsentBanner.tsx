"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Shield, Check, X, Settings2 } from "lucide-react";

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem("eventos_cookie_consent");
    if (!savedConsent) {
      // Small delay so it smoothly slides in after initial page render
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      "eventos_cookie_consent",
      JSON.stringify({ essential: true, analytics: true, timestamp: new Date().toISOString() })
    );
    document.cookie = "eventos_consent=all; path=/; max-age=31536000; SameSite=Lax";
    setIsOpen(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(
      "eventos_cookie_consent",
      JSON.stringify({ essential: true, analytics: false, timestamp: new Date().toISOString() })
    );
    document.cookie = "eventos_consent=essential; path=/; max-age=31536000; SameSite=Lax";
    setIsOpen(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem(
      "eventos_cookie_consent",
      JSON.stringify({ essential: true, analytics: analyticsEnabled, timestamp: new Date().toISOString() })
    );
    document.cookie = `eventos_consent=${analyticsEnabled ? "all" : "essential"}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] max-w-lg w-full"
        >
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-zinc-950/90 p-5 sm:p-6 shadow-2xl shadow-purple-950/40 backdrop-blur-xl">
            {/* Ambient background glow */}
            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-purple-600/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-pink-600/10 blur-2xl pointer-events-none" />

            <div className="relative space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white tracking-tight">Cookie & Privacy Preferences</h4>
                    <button
                      onClick={handleAcceptEssential}
                      className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                      title="Decline optional cookies"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    We use cookies to maintain secure sessions, verify multi-tenant workspaces, and analyze platform performance. Learn more in our{" "}
                    <Link href="/cookies" className="text-purple-400 underline hover:text-purple-300 font-medium">
                      Cookie Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-purple-400 underline hover:text-purple-300 font-medium">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>
              </div>

              {/* Preferences Accordion */}
              {showPreferences && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        Strictly Necessary
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Required for authentication, live sync, and CSRF protection.</p>
                    </div>
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Always Active
                    </span>
                  </div>

                  <div className="h-px bg-zinc-800/80" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200">Analytics & Performance</span>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Helps us evaluate load times and system reliability.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        analyticsEnabled ? "bg-purple-600" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          analyticsEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {showPreferences ? "Hide Settings" : "Customize"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={showPreferences ? handleSaveCustom : handleAcceptEssential}
                    className="rounded-lg border border-zinc-750 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                  >
                    {showPreferences ? "Save Preferences" : "Essential Only"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:from-purple-500 hover:to-pink-500 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
