"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, FileText, Coins, Download, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuickActionsFAB() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // 1. Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if it matches shortcuts: Ctrl + Shift + key
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            router.push("/bookings");
            break;
          case "i":
            e.preventDefault();
            router.push("/invoices");
            break;
          case "p":
            e.preventDefault();
            router.push("/payments");
            break;
          case "e":
            e.preventDefault();
            router.push("/events");
            break;
          case "c":
            e.preventDefault();
            router.push("/crm");
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="fixed bottom-6 right-24 z-50 print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.18 }}
            className="mb-3 flex flex-col items-end gap-2"
          >
            {/* Quick Link 1: Bookings */}
            <div className="flex items-center gap-2 group">
              <span className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                Bookings (Ctrl+Shift+B)
              </span>
              <button
                onClick={() => { router.push("/bookings"); setIsOpen(false); }}
                className="h-9 w-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <BookOpen size={14} />
              </button>
            </div>

            {/* Quick Link 2: Invoices */}
            <div className="flex items-center gap-2 group">
              <span className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                Invoices (Ctrl+Shift+I)
              </span>
              <button
                onClick={() => { router.push("/invoices"); setIsOpen(false); }}
                className="h-9 w-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-blue-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <FileText size={14} />
              </button>
            </div>

            {/* Quick Link 3: Payments */}
            <div className="flex items-center gap-2 group">
              <span className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                Payments (Ctrl+Shift+P)
              </span>
              <button
                onClick={() => { router.push("/payments"); setIsOpen(false); }}
                className="h-9 w-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <Coins size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center shadow-xl shadow-purple-650/15 transition-transform active:scale-95 focus:outline-none"
        aria-label="Toggle quick actions menu"
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.18 }}
        >
          {isOpen ? <X size={20} /> : <Plus size={20} />}
        </motion.div>
      </button>
    </div>
  );
}
