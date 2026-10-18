"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventWorkspace from "@/components/events/EventWorkspace";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();

  // Eagerly prefetch the /events route bundle as soon as the detail view mounts
  useEffect(() => {
    router.prefetch("/events");
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col transition-all duration-200 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/85 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            prefetch={true}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-90 active:bg-purple-600/30 flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-150 border border-zinc-700/50 cursor-pointer shadow-sm group"
            aria-label="Back to events"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Event Operations</span>
            <span className="text-xs px-2.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold">Workspace</span>
          </div>
        </div>
      </nav>

      {/* Main Workspace details grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-auto z-10">
        <React.Suspense fallback={<div className="text-zinc-500 text-xs p-6">Loading workspace...</div>}>
          <EventWorkspace eventId={eventId} />
        </React.Suspense>
      </main>
    </div>
  );
}
