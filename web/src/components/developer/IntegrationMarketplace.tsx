"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Calendar,
  CreditCard,
  GitBranch,
  Image as ImageIcon,
  Users,
  TrendingUp,
  Search,
  Compass,
  ArrowRight,
  Settings,
  ShieldAlert,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { MARKETPLACE_APPS_INITIAL, MarketplaceApp } from "@/lib/developerData";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  Calendar,
  CreditCard,
  GitBranch,
  Image: ImageIcon,
  Users,
  TrendingUp,
};

const CATEGORIES = ["All", "Communication", "Automation", "CRM", "Accounting", "Payment", "Media", "Analytics"];

export default function IntegrationMarketplace() {
  const { addToast } = useToastStore();
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Install manual modal
  const [activeSetupApp, setActiveSetupApp] = useState<MarketplaceApp | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_developer_marketplace");
    if (stored) {
      try {
        setApps(JSON.parse(stored));
      } catch {
        setApps(MARKETPLACE_APPS_INITIAL);
      }
    } else {
      setApps(MARKETPLACE_APPS_INITIAL);
      localStorage.setItem("eventos_developer_marketplace", JSON.stringify(MARKETPLACE_APPS_INITIAL));
    }
  }, []);

  const saveApps = (updated: MarketplaceApp[]) => {
    setApps(updated);
    localStorage.setItem("eventos_developer_marketplace", JSON.stringify(updated));
  };

  const handleToggleApp = (app: MarketplaceApp, e: React.MouseEvent) => {
    e.stopPropagation();
    if (app.isInstalled) {
      // Uninstall directly
      const updated = apps.map((a) => {
        if (a.id === app.id) return { ...a, isInstalled: false };
        return a;
      });
      saveApps(updated);
      addToast(`App ${app.name} uninstalled.`, "info");
    } else {
      // Trigger setup guide modal to install
      setActiveSetupApp(app);
    }
  };

  const handleConfirmInstall = () => {
    if (!activeSetupApp) return;

    setIsInstalling(true);
    setTimeout(() => {
      const updated = apps.map((a) => {
        if (a.id === activeSetupApp.id) return { ...a, isInstalled: true };
        return a;
      });

      saveApps(updated);
      setIsInstalling(false);
      setActiveSetupApp(null);
      addToast(`App ${activeSetupApp.name} installed successfully!`, "success");
    }, 1200);
  };

  // Filter apps list
  const filtered = useMemo(() => {
    let items = apps;
    if (activeCategory !== "All") {
      items = items.filter((a) => a.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [apps, activeCategory, searchQuery]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integration app name..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-655 text-zinc-200 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                activeCategory === cat
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 border border-zinc-855 bg-zinc-950/20 rounded-2xl text-center space-y-2">
          <Compass size={32} className="mx-auto text-zinc-700" />
          <p className="text-xs text-zinc-500 font-bold">No integrations found matching category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          {filtered.map((app) => {
            const Icon = ICON_MAP[app.icon] || Settings;
            return (
              <div
                key={app.id}
                onClick={() => handleToggleApp(app, {} as any)}
                className="group flex flex-col justify-between p-5 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/15 hover:bg-zinc-900/10 transition-all space-y-4 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Icon size={16} />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-zinc-200 group-hover:text-white line-clamp-1">{app.name}</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">{app.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-850/50 pt-3">
                  <span className="text-[8px] text-purple-400/60 font-black uppercase tracking-wider">{app.category}</span>
                  
                  <button
                    onClick={(e) => handleToggleApp(app, e)}
                    className={cn(
                      "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                      app.isInstalled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-900 border-zinc-855 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    {app.isInstalled ? "Active Connection" : "Connect Tool"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* App Setup Guide Modal */}
      <AnimatePresence>
        {activeSetupApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Configure {activeSetupApp.name}</h3>
                  <p className="text-[9px] text-zinc-550 font-semibold mt-0.5">Setup integration guide manual connectors</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 text-[10px] text-zinc-450 leading-relaxed font-semibold">
                <p className="font-bold text-zinc-300">Quick Installation Steps:</p>
                <p>1. Copy the webhook secret client tokens generated in EventOS Settings.</p>
                <p>2. Paste endpoints parameters inside your {activeSetupApp.name} settings workspace panel.</p>
                <p>3. Map target triggers and click Active Connection below.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-850/50">
                <button
                  onClick={() => setActiveSetupApp(null)}
                  className="px-4 py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInstall}
                  disabled={isInstalling}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isInstalling ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                  Activate Connection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
