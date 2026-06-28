"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Calendar, CheckCircle2, Loader2, Clock } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  completed: boolean;
}

export default function PortalTimelinePage() {
  const { data: timelineResponse, isLoading } = useQuery<{ data: TimelineItem[] }>({
    queryKey: ["clientTimeline"],
    queryFn: async () => {
      const res = await api.get("/events/client/timeline");
      return res.data;
    }
  });

  const clientTimeline = timelineResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Loading Schedule...</span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-850 bg-[#111113]/40 space-y-8 animate-slide-in">
      <div>
        <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={18} className="text-purple-500" />
          Event Planning Timeline
        </h3>
        <p className="text-xs text-zinc-400 mt-1.5">
          Follow progress details, coordinates, and deadlines logged by our coordinators.
        </p>
      </div>

      {clientTimeline.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-500 flex flex-col items-center justify-center gap-3">
          <Clock size={36} className="text-zinc-700" />
          <div>
            <p className="font-semibold text-zinc-400">Timeline not active</p>
            <p className="text-xs text-zinc-650 mt-1">Our coordinators will outline milestones shortly.</p>
          </div>
        </div>
      ) : (
        <div className="relative border-l border-zinc-850 pl-8 ml-4 sm:ml-6 space-y-8 py-2">
          {clientTimeline.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline dot */}
              <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border border-zinc-800 flex items-center justify-center ring-4 ring-[#09090B] transition-colors ${
                item.completed ? "bg-emerald-500 text-white border-transparent" : "bg-zinc-900 text-zinc-500"
              }`}>
                {item.completed && <CheckCircle2 size={12} className="text-white" />}
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                  {new Date(item.scheduledTime).toLocaleString()}
                </span>
                <h4 className={`text-sm font-bold transition-colors ${item.completed ? "text-zinc-500 line-through" : "text-zinc-200 group-hover:text-purple-400"}`}>
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-450 leading-relaxed max-w-3xl font-medium">
                  {item.description || "No descriptions set for this milestone."}
                </p>
                
                <div className="pt-2 flex items-center gap-2">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border ${
                    item.completed 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-purple-600/10 text-purple-400 border-purple-600/20"
                  }`}>
                    {item.completed ? "Completed" : "Scheduled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
