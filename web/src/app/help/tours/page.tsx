"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass,
  Play,
  LayoutDashboard,
  Users,
  Image,
  FileText,
  Settings,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useOnboardingStore } from "@/store/onboardingStore";

const TOURS = [
  {
    id: "dashboard",
    title: "Dashboard Tour",
    description: "Explore the Operations Dashboard containing calendar schedules, tasks, and high-level analytics graphs.",
    icon: LayoutDashboard,
    step: 0,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "crm",
    title: "CRM Tour",
    description: "Walk through the CRM pipeline to manage customer leads, check communication notes, and customize stages.",
    icon: Users,
    step: 2,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "quotes",
    title: "Quote Builder Tour",
    description: "Learn how to draft line-item quotes, configure default tax rates, and share proposals via client portals.",
    icon: FileText,
    step: 4,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "gallery",
    title: "Gallery Tour",
    description: "See how to organize visual folders, upload wedding photography delivery albums, and publish galleries.",
    icon: Image,
    step: 5,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "settings",
    title: "Settings Tour",
    description: "Review visual branding settings, upload logos, customize theme palette colors, and manage invitations.",
    icon: Settings,
    step: 7,
    color: "from-emerald-500 to-teal-500",
  },
];

export default function ToursPage() {
  const router = useRouter();

  const handleStartTour = (step: number) => {
    // Set tour state and redirect to first page of tour step
    useOnboardingStore.setState({
      isTourActive: true,
      tourStep: step,
    });
    
    // Determine target path
    const paths = [
      "/dashboard",
      "/ai",
      "/crm",
      "/events",
      "/quotes",
      "/gallery",
      "", // AI copilot button (does not route)
      "/settings"
    ];
    const targetPath = paths[step];
    if (targetPath) {
      router.push(targetPath);
    }
  };

  return (
    <PageShell
      title="Product Tours"
      subtitle="Interactive, step-by-step guided product tours"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Tours" }]}
    >
      <div className="space-y-6 select-none text-zinc-300 max-w-4xl">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 p-6 md:p-8 bg-zinc-950/40 backdrop-blur-md">
          <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Compass size={22} className="animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-zinc-200">Interactive Walkthroughs</h2>
                <p className="text-xs text-zinc-500 font-semibold">Tours use spotlight overlays to highlight interface controls and guide you through common workflows.</p>
              </div>
            </div>
            <button
              onClick={() => handleStartTour(0)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10"
            >
              Start Complete Tour
              <Play size={12} fill="white" className="ml-0.5" />
            </button>
          </div>
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOURS.map((tour) => {
            const Icon = tour.icon;
            return (
              <div
                key={tour.id}
                className="group flex flex-col justify-between p-5 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/20 hover:bg-zinc-900/10 transition-all space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-md", tour.color)}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-zinc-200 group-hover:text-white">{tour.title}</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">{tour.description}</p>
                  </div>
                </div>
                <div className="flex justify-end border-t border-zinc-850/50 pt-3">
                  <button
                    onClick={() => handleStartTour(tour.step)}
                    className="flex items-center gap-1 text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Launch Tour <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
