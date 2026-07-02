"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Clock,
  MessageSquare,
  FileText,
  DollarSign,
  MapPin,
  Camera,
  Download,
  Users,
  Compass,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileCode,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  completed: boolean;
}

// Visual icons mapped based on title matches
const getTimelineIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("meeting")) return MessageSquare;
  if (t.includes("quote") || t.includes("contract")) return FileCheckIcon;
  if (t.includes("payment") || t.includes("deposit")) return DollarSign;
  if (t.includes("venue")) return MapPin;
  if (t.includes("photo") || t.includes("gallery") || t.includes("album")) return Camera;
  if (t.includes("vendor") || t.includes("crew")) return Users;
  return Compass;
};

function FileCheckIcon(props: any) {
  return <FileText {...props} />;
}

const getTimelineColor = (completed: boolean) => {
  return completed
    ? "bg-emerald-550/10 border-emerald-550/20 text-emerald-450"
    : "bg-purple-550/10 border-purple-550/20 text-purple-400";
};

export default function PortalTimelinePage() {
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  const { data: timelineResponse, isLoading } = useQuery<{ data: TimelineItem[] }>({
    queryKey: ["clientTimeline"],
    queryFn: async () => {
      const res = await api.get("/events/client/timeline");
      return res.data;
    }
  });

  const clientTimeline = timelineResponse?.data || [];

  // Sort timeline chronologically
  const sortedTimeline = useMemo(() => {
    return [...clientTimeline].sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }, [clientTimeline]);

  const completedCount = sortedTimeline.filter((t) => t.completed).length;
  const progressPercent = sortedTimeline.length > 0 ? Math.round((completedCount / sortedTimeline.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Loading Schedule...</span>
      </div>
    );
  }

  return (
    <div className="p-6 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-8 animate-slide-in text-zinc-300 select-none">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-5">
        <div>
          <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={18} className="text-purple-500" />
            Apple-style Journey Timeline
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-bold">
            Interactive scroll milestone timeline detailing contract execution, venue set up, and photo releases.
          </p>
        </div>

        {/* Progress status indicators */}
        <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 shrink-0">
          <div className="text-right">
            <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Timeline progress</span>
            <span className="text-sm font-bold text-zinc-300 mt-0.5 block">{progressPercent}% Completed</span>
          </div>
          <div className="h-6 w-px bg-zinc-850" />
          <div className="h-10 w-10 relative flex items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="20" cy="20" r="16" className="stroke-zinc-800 fill-none" strokeWidth="2.5" />
              <circle
                cx="20"
                cy="20"
                r="16"
                className="stroke-purple-500 fill-none transition-all duration-300"
                strokeWidth="2.5"
                strokeDasharray="100.5"
                strokeDashoffset={100.5 - (100.5 * progressPercent) / 100}
              />
            </svg>
          </div>
        </div>
      </div>

      {sortedTimeline.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-500 flex flex-col items-center justify-center gap-3">
          <Clock size={36} className="text-zinc-700" />
          <div>
            <p className="font-semibold text-zinc-400">Timeline not active</p>
            <p className="text-xs text-zinc-650 mt-1">Our coordinators will outline milestones shortly.</p>
          </div>
        </div>
      ) : (
        <div className="relative pl-8 ml-4 sm:ml-6 space-y-8 py-2">
          
          {/* Scroll-guided Vertical Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-[1.5px] bg-zinc-850">
            <div
              className="w-full bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500 transition-all duration-700"
              style={{ height: `${progressPercent}%` }}
            />
          </div>

          {sortedTimeline.map((item) => {
            const IconComponent = getTimelineIcon(item.title);
            const colorClass = getTimelineColor(item.completed);
            const isExpanded = expandedMilestoneId === item.id;

            // Simulated metadata categories
            const isScheduleItem = item.title.toLowerCase().includes("schedule") || item.title.toLowerCase().includes("meeting");
            const isVendorItem = item.title.toLowerCase().includes("venue") || item.title.toLowerCase().includes("crew") || item.title.toLowerCase().includes("photo");

            return (
              <div key={item.id} className="relative group text-xs">
                
                {/* Timeline dot custom icons */}
                <div className={cn(
                  "absolute -left-[24px] top-1.5 h-8 w-8 rounded-full border flex items-center justify-center ring-4 ring-[#09090B] transition-colors z-10 cursor-pointer",
                  colorClass
                )}
                onClick={() => setExpandedMilestoneId(isExpanded ? null : item.id)}
                >
                  <IconComponent size={14} />
                </div>
                
                <div className="space-y-3.5 max-w-3xl p-5 border border-zinc-850/60 bg-zinc-950/20 rounded-2xl transition-all hover:border-zinc-800">
                  <div className="flex justify-between items-center text-[10px] text-zinc-550 font-bold font-mono">
                    <span>Logged Milestone</span>
                    <span>{new Date(item.scheduledTime).toLocaleString()}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className={cn("text-xs font-black transition-colors cursor-pointer", item.completed ? "text-zinc-500 line-through" : "text-zinc-200 group-hover:text-purple-400")}
                          onClick={() => setExpandedMilestoneId(isExpanded ? null : item.id)}>
                        {item.title}
                      </h4>
                      <button onClick={() => setExpandedMilestoneId(isExpanded ? null : item.id)} className="text-zinc-500 hover:text-zinc-300">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-450 leading-relaxed font-medium">
                      {item.description || "Milestone description is being updated by our planning leads."}
                    </p>
                  </div>

                  {/* Expandable Specifications area */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-3 pt-3 border-t border-zinc-850/40 text-[10.5px] text-zinc-400"
                    >
                      <div className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl space-y-1">
                        <span className="text-[8px] text-zinc-550 uppercase font-black block">Coordinator Notes</span>
                        <p className="leading-relaxed">All setups are subject to final signature signoffs. Please check associated quote approvals and clear deposit clearances in the Payments Tab.</p>
                      </div>

                      {/* Attachment card widgets */}
                      {(isScheduleItem || isVendorItem) && (
                        <div className="p-3 border border-zinc-850 bg-zinc-950/40 rounded-xl flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-zinc-500" />
                            <div>
                              <span className="font-extrabold text-[10px] text-zinc-300 block">{isScheduleItem ? "Event_Schedule_v2.pdf" : "Decorator_Layouts.pdf"}</span>
                              <span className="text-[8.5px] text-zinc-550 block font-mono">1.2 MB &bull; PDF Document</span>
                            </div>
                          </div>
                          <button className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white" title="Download doc">
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className={cn("text-[8px] px-2 py-0.5 rounded font-black uppercase border",
                      item.completed 
                        ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                        : "bg-purple-550/10 text-purple-400 border-purple-500/20"
                    )}>
                      {item.completed ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
