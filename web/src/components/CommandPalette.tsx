"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Compass, Plus, CreditCard, Layers, Calculator, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CommandItem {
  icon: React.ReactNode;
  label: string;
  category: string;
  action: () => void;
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    { icon: <Compass size={14} />, label: "Go to Dashboard", category: "Navigation", action: () => router.push("/dashboard") },
    { icon: <Plus size={14} />, label: "Go to CRM / Leads", category: "Navigation", action: () => router.push("/crm") },
    { icon: <Layers size={14} />, label: "Go to Bookings", category: "Navigation", action: () => router.push("/bookings") },
    { icon: <FileText size={14} />, label: "Go to Quotes", category: "Navigation", action: () => router.push("/quotes") },
    { icon: <CreditCard size={14} />, label: "Go to Payments Ledger", category: "Navigation", action: () => router.push("/payments") },
    { icon: <FileText size={14} />, label: "Go to Invoices Manager", category: "Navigation", action: () => router.push("/invoices") },
    { icon: <Calculator size={14} />, label: "Go to Budget Calculator", category: "Navigation", action: () => router.push("/calculator") },

    // Quick Actions
    { icon: <Plus size={14} className="text-purple-400" />, label: "Create New Lead", category: "Quick Actions", action: () => router.push("/crm") },
    { icon: <CreditCard size={14} className="text-emerald-450" />, label: "Log Payment Transaction", category: "Quick Actions", action: () => router.push("/payments") },
    { icon: <FileText size={14} className="text-blue-400" />, label: "Generate Billing Invoice", category: "Quick Actions", action: () => router.push("/invoices") },
    { icon: <Calculator size={14} className="text-amber-400" />, label: "Compute Event Estimation", category: "Quick Actions", action: () => router.push("/calculator") }
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/65 backdrop-blur-sm">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Palette Container */}
      <div className="relative w-full max-w-lg bg-[#111113] border border-zinc-850 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[450px] animate-in fade-in slide-in-from-top-4 duration-200">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-850 bg-zinc-900/10">
          <Search size={16} className="text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or navigate..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-550 focus:outline-none"
          />
          <kbd className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-450 px-1.5 py-0.5 rounded font-mono select-none">
            ESC
          </kbd>
          <button onClick={onClose} aria-label="Close panel" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 text-xs">
          {filteredCommands.length > 0 ? (
            <div className="space-y-3">
              {/* Group by category */}
              {Array.from(new Set(filteredCommands.map((c) => c.category))).map((cat) => (
                <div key={cat} className="space-y-1">
                  <span className="px-3 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                    {cat}
                  </span>
                  {filteredCommands
                    .filter((c) => c.category === cat)
                    .map((cmd) => (
                      <button
                        key={cmd.label}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-350 hover:text-zinc-100 hover:bg-zinc-850 transition-all text-left group"
                      >
                        <span className="text-zinc-500 group-hover:text-purple-400 transition-colors">
                          {cmd.icon}
                        </span>
                        <span className="font-semibold flex-1">{cmd.label}</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 italic">
              No matching commands or actions found.
            </div>
          )}
        </div>

        {/* Bottom Help instructions */}
        <div className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-850 text-[10px] text-zinc-500 flex justify-between select-none">
          <span>Use arrows to navigate, Enter to select</span>
          <span>EventOS Cmd Palette</span>
        </div>

      </div>
    </div>
  );
}
