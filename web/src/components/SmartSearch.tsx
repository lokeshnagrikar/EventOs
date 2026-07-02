"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Compass, 
  Plus, 
  CreditCard, 
  Layers, 
  Calculator, 
  FileText, 
  X,
  Calendar,
  Image as ImageIcon,
  Settings,
  Users,
  Terminal,
  Activity,
  GitBranch,
  TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  category: "Events" | "Bookings" | "Invoices" | "Leads & Customers" | "Gallery" | "Payments" | "Settings" | "Commands";
  action: () => void;
}

export default function SmartSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Open with Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // Controlled outside, but safety first
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const searchItems: SearchItem[] = [
    // Navigation & Commands
    { id: "c1", icon: <Compass size={14} />, label: "Go to Dashboard", category: "Commands", action: () => router.push("/dashboard") },
    { id: "c2", icon: <Users size={14} />, label: "Go to CRM / Leads", category: "Commands", action: () => router.push("/crm") },
    { id: "c3", icon: <Calendar size={14} />, label: "Go to Events / Calendar", category: "Commands", action: () => router.push("/events") },
    { id: "c4", icon: <Layers size={14} />, label: "Go to Bookings", category: "Commands", action: () => router.push("/bookings") },
    { id: "c5", icon: <FileText size={14} />, label: "Go to Quotes", category: "Commands", action: () => router.push("/quotes") },
    { id: "c6", icon: <CreditCard size={14} />, label: "Go to Payments Ledger", category: "Commands", action: () => router.push("/payments") },
    { id: "c7", icon: <FileText size={14} />, label: "Go to Invoices Manager", category: "Commands", action: () => router.push("/invoices") },
    { id: "c8", icon: <Calculator size={14} />, label: "Go to Budget Calculator", category: "Commands", action: () => router.push("/calculator") },
    { id: "c9", icon: <GitBranch size={14} />, label: "Go to Smart Automation Builder", category: "Commands", action: () => router.push("/automation") },
    { id: "c10", icon: <TrendingUp size={14} />, label: "Go to Reports & Analytics", category: "Commands", action: () => router.push("/reports") },
    { id: "c11", icon: <Activity size={14} />, label: "Go to Activity Logs", category: "Commands", action: () => router.push("/activity") },
    { id: "c12", icon: <Settings size={14} />, label: "Go to Settings Manager", category: "Commands", action: () => router.push("/settings") },

    // Events
    { id: "e1", icon: <Calendar size={14} className="text-purple-400" />, label: "Meera & Rohan Wedding Gala", subtitle: "July 12, 2026 • Grand Ballroom", category: "Events", action: () => router.push("/events") },
    { id: "e2", icon: <Calendar size={14} className="text-blue-400" />, label: "TechCorp Annual Summit 2026", subtitle: "August 04, 2026 • Convention Hall", category: "Events", action: () => router.push("/events") },
    { id: "e3", icon: <Calendar size={14} className="text-pink-400" />, label: "Siddharth & Ananya Destination Wedding", subtitle: "July 22, 2026 • Udaipur Resort", category: "Events", action: () => router.push("/events") },

    // Bookings
    { id: "b1", icon: <Layers size={14} className="text-emerald-450" />, label: "Booking #EV-2026-902 (Meera & Rohan)", subtitle: "Confirmed • ₹12,50,000 Contract", category: "Bookings", action: () => router.push("/bookings") },
    { id: "b2", icon: <Layers size={14} className="text-purple-400" />, label: "Booking #EV-2026-905 (TechCorp)", subtitle: "Milestone Paid • ₹8,50,000 Contract", category: "Bookings", action: () => router.push("/bookings") },

    // Invoices
    { id: "i1", icon: <FileText size={14} className="text-red-400" />, label: "Invoice #INV-2026-042 (Amit Shah)", subtitle: "OVERDUE • ₹1,45,000 due June 24", category: "Invoices", action: () => router.push("/invoices") },
    { id: "i2", icon: <FileText size={14} className="text-amber-400" />, label: "Invoice #INV-2026-049 (Riya Sen)", subtitle: "PENDING • ₹2,20,000 due July 05", category: "Invoices", action: () => router.push("/invoices") },
    { id: "i3", icon: <FileText size={14} className="text-emerald-450" />, label: "Invoice #INV-2026-039 (Meera Rohan)", subtitle: "PAID • ₹5,00,000 cleared", category: "Invoices", action: () => router.push("/invoices") },

    // Leads & Customers
    { id: "l1", icon: <Users size={14} className="text-purple-400" />, label: "Varun Mehta", subtitle: "Corporate Gala enquiry • Lead status: NEW", category: "Leads & Customers", action: () => router.push("/crm") },
    { id: "l2", icon: <Users size={14} className="text-amber-450" />, label: "Amit Shah", subtitle: "Sangeet ceremony • Lead status: CONTACTED", category: "Leads & Customers", action: () => router.push("/crm") },
    { id: "l3", icon: <Users size={14} className="text-emerald-400" />, label: "Shreya Singhal", subtitle: "Destination Wedding • Lead status: BOOKED", category: "Leads & Customers", action: () => router.push("/crm") },

    // Gallery
    { id: "g1", icon: <ImageIcon size={14} className="text-cyan-400" />, label: "Wedding Photoshoot Album - Meera & Rohan", subtitle: "128 photos • High-res Link Active", category: "Gallery", action: () => router.push("/events") },
    { id: "g2", icon: <ImageIcon size={14} className="text-pink-400" />, label: "Corporate Highlights - TechCorp", subtitle: "45 photos • Client portal uploaded", category: "Gallery", action: () => router.push("/events") },

    // Payments
    { id: "p1", icon: <CreditCard size={14} className="text-emerald-450" />, label: "UPI Clearance Ledger", subtitle: "Real-time UPI instant routing setup", category: "Payments", action: () => router.push("/payments") },
    { id: "p2", icon: <CreditCard size={14} className="text-purple-400" />, label: "Bank Transfer Log", subtitle: "Manual reconciliation logs", category: "Payments", action: () => router.push("/payments") },

    // Settings
    { id: "s1", icon: <Settings size={14} className="text-zinc-400" />, label: "Branding & Styling Accent Config", subtitle: "Theme selection, fonts, and primary colors", category: "Settings", action: () => router.push("/settings") },
    { id: "s2", icon: <Settings size={14} className="text-zinc-400" />, label: "GST / Taxes Integration", subtitle: "Set service SGST/CGST rates", category: "Settings", action: () => router.push("/settings") },
    { id: "s3", icon: <Settings size={14} className="text-zinc-400" />, label: "API Keys Console", subtitle: "Manage microservices authentication headers", category: "Settings", action: () => router.push("/settings") },
  ];

  // Fuzzy match implementation
  const filteredItems = searchItems.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term)
    );
  });

  // Keyboard navigation inside search panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  // Group by category
  const categories = Array.from(new Set(filteredItems.map((item) => item.category)));

  // Flattened mapping to correctly match indices for keypress selection
  let currentFlatIdx = 0;
  const itemsWithFlatIdx = filteredItems.map((item) => {
    const flatIdx = currentFlatIdx;
    currentFlatIdx++;
    return { ...item, flatIdx };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/70 backdrop-blur-md">
      {/* Background overlay click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main panel container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-xl bg-[#09090b]/90 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-4 duration-200"
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-850 bg-zinc-900/10">
          <Search size={18} className="text-purple-400 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search bookings, invoices, leads, commands..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-550 focus:outline-none"
          />
          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono select-none">
            ESC
          </span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 text-xs scrollbar-none">
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat} className="space-y-1">
                  <span className="px-3 py-1 text-[9px] font-bold text-purple-400 uppercase tracking-widest block">
                    {cat}
                  </span>
                  {itemsWithFlatIdx
                    .filter((item) => item.category === cat)
                    .map((item) => {
                      const isSelected = selectedIndex === item.flatIdx;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                            isSelected
                              ? "bg-purple-600/15 border border-purple-500/25 text-purple-200"
                              : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                          }`}
                        >
                          <span className={`transition-colors shrink-0 ${
                            isSelected ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"
                          }`}>
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-extrabold block text-xs truncate leading-normal">{item.label}</span>
                            {item.subtitle && (
                              <span className="text-[10px] text-zinc-550 block mt-0.5 truncate font-medium">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                              Enter
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-550 italic font-medium">
              No matching records, leads, or actions found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-900/30 border-t border-zinc-850 text-[10px] text-zinc-550 flex justify-between select-none">
          <span>Navigate <kbd className="font-mono text-zinc-450">↑↓</kbd> • Open <kbd className="font-mono text-zinc-450">Enter</kbd></span>
          <span>EventOS Smart Search</span>
        </div>
      </div>
    </div>
  );
}
