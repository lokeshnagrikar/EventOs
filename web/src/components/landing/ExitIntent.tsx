"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, BookOpen, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toastStore";

export function ExitIntent() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Only show once per session
    const shown = sessionStorage.getItem("exit_intent_shown");
    if (shown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // y < 10 indicates moving mouse towards tab/address bar to exit
      if (e.clientY < 10) {
        setIsOpen(true);
        sessionStorage.setItem("exit_intent_shown", "true");
        // Clean up event listener after triggering
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    addToast("Resource packet and invoice template emailed! 🚀", "success");
    setTimeout(() => {
      setIsOpen(false);
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden select-none font-sans text-xs">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-zinc-950 border border-zinc-850 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-md space-y-6"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
          >
            <X size={15} />
          </button>

          {/* Heading */}
          <div className="text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Gift size={20} className="animate-bounce" />
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Wait! Before you leave...</h3>
            <p className="text-[10.5px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Get our comprehensive **SaaS Operations Resource Pack** (checklists, e-invoice templates, & vendor questionnaires) absolutely free.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!subscribed ? (
              <motion.form
                key="sub-form"
                onSubmit={handleSubscribe}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <input
                    required
                    type="email"
                    placeholder="Enter your agency email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-[#8B5CF6] focus:bg-zinc-950 rounded-xl text-white focus:outline-none font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-extrabold uppercase tracking-widest transition cursor-pointer"
                >
                  Send Free Templates
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="sub-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2 space-y-2"
              >
                <span className="text-[10px] text-emerald-450 font-black uppercase tracking-wider block">Templates Dispatched!</span>
                <p className="text-[9.5px] text-zinc-500 font-semibold leading-relaxed">
                  We've sent the PDF checklists and CSV pricing spreadsheets. Check your inbox.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alternative Funnel triggers */}
          <div className="border-t border-zinc-900 pt-4 space-y-2 select-none text-[10px] font-bold">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/tour");
              }}
              className="w-full py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={12} className="text-purple-400" />
              Take interactive Live Tour
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/book-demo");
              }}
              className="w-full py-2 border border-zinc-900 hover:bg-zinc-950/40 text-zinc-450 hover:text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen size={12} />
              Book custom architecture demo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
