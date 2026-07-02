"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, FileText, Calendar, Image, DollarSign, Command, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function QuickActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "l":
            e.preventDefault();
            router.push("/crm/new");
            break;
          case "q":
            e.preventDefault();
            router.push("/quotes/new");
            break;
          case "e":
            e.preventDefault();
            router.push("/events");
            break;
          case "p":
            e.preventDefault();
            router.push("/payments");
            break;
          case "h":
            e.preventDefault();
            setShowHelper((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const ACTIONS = [
    { label: "New Lead", icon: Users, href: "/crm/new", key: "Alt+L", color: "from-purple-500 to-pink-500" },
    { label: "New Quote", icon: FileText, href: "/quotes/new", key: "Alt+Q", color: "from-blue-500 to-cyan-500" },
    { label: "New Event", icon: Calendar, href: "/events", key: "Alt+E", color: "from-emerald-500 to-teal-500" },
    { label: "Record Payment", icon: DollarSign, href: "/payments", key: "Alt+P", color: "from-amber-500 to-orange-500" },
  ];

  return (
    <>
      {/* Floating Menu */}
      <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end gap-3 select-none">
        
        {/* Expanded Actions List */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="flex flex-col gap-2 mb-2"
            >
              {ACTIONS.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.label}
                    onClick={() => {
                      router.push(act.href);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2 bg-[#0c0c0e]/95 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl shadow-2xl transition-all group text-left cursor-pointer"
                  >
                    <div className={cn("h-7 w-7 rounded-lg bg-gradient-to-tr flex items-center justify-center text-white", act.color)}>
                      <Icon size={12} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">{act.label}</span>
                      <span className="text-[9px] text-zinc-500 font-bold block">{act.key}</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        <div className="flex gap-2">
          {/* Shortcut guide indicator */}
          <button
            onClick={() => setShowHelper(!showHelper)}
            className="h-10 px-3 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 rounded-full flex items-center justify-center text-zinc-450 hover:text-zinc-200 transition-all text-xs font-bold gap-1.5 cursor-pointer shadow-lg"
          >
            <Command size={12} />
            <span>Shortcuts</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "h-10 w-10 bg-gradient-to-tr from-purple-600 via-pink-600 to-purple-700 hover:scale-105 active:scale-95 text-white flex items-center justify-center rounded-full transition-all cursor-pointer shadow-xl shadow-purple-650/20"
            )}
            aria-label="Quick action menu"
          >
            <motion.div
              animate={{ rotate: isOpen ? 135 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Plus size={20} className="text-white" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcut Helper Overlay */}
      <AnimatePresence>
        {showHelper && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelper(false)}
              className="absolute inset-0 bg-black"
            />
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm border border-zinc-800 bg-[#0c0c0e] rounded-2xl shadow-2xl p-6 z-50 text-xs text-zinc-300"
            >
              <button
                onClick={() => setShowHelper(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                aria-label="Close"
              >
                <X size={14} />
              </button>
              <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2 mb-4">
                <Command size={14} className="text-purple-400" />
                Keyboard Command Shortcuts
              </h3>
              <div className="space-y-3 font-semibold">
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-zinc-450">Search Command Palette</span>
                  <kbd className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-zinc-450">Create New Lead</span>
                  <kbd className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">Alt+L</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-zinc-450">Create New Quote</span>
                  <kbd className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">Alt+Q</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-zinc-450">Log Event Scheduler</span>
                  <kbd className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">Alt+E</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-zinc-450">Log Payment Ledger</span>
                  <kbd className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">Alt+P</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-zinc-450">Toggle Shortcuts panel</span>
                  <kbd className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">Alt+H</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
