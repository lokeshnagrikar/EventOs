"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  ImageIcon,
  Video,
  Share2,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Check,
  Download,
  Upload,
  Clock,
  ArrowUpRight,
  Database,
  CloudLightning,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";

interface Album {
  id: string;
  name: string;
  itemCount: number;
  mediaCount?: number;
  createdAt: string;
  status?: string;
  visibility?: string;
}

interface MediaDashboardProps {
  albums: Album[];
  totalPhotos: number;
  totalVideos: number;
}

export default function MediaDashboard({ albums, totalPhotos, totalVideos }: MediaDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"storage" | "activity">("storage");

  // Storage Calculations (Realistic Mock Pool)
  const totalStorageCapacityBytes = 500 * 1024 * 1024 * 1024; // 500 GB
  const rawPhotosStorage = totalPhotos * 3.8 * 1024 * 1024; // Avg 3.8MB
  const rawVideosStorage = totalVideos * 45.2 * 1024 * 1024; // Avg 45.2MB
  const storageUsedBytes = rawPhotosStorage + rawVideosStorage;

  const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.round((storageUsedBytes / totalStorageCapacityBytes) * 100));
  const sharedAlbumsCount = albums.filter((a) => a.visibility === "PUBLIC").length;
  const currentUsageNum = Number(storageUsedGB) || 0;

  // Real Storage Trend Data
  const growthData = [
    { name: "Baseline", Usage: 0 },
    { name: "Current", Usage: currentUsageNum }
  ];

  // Dynamic Activities from real albums
  const recentActivities = albums.slice(0, 5).map((a, idx) => ({
    id: a.id || idx,
    action: a.mediaCount ? "Media Synced" : "Album Initialized",
    desc: `Album '${a.name}' contains ${a.mediaCount || 0} assets`,
    time: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Recently",
    icon: Upload,
    color: "text-purple-400 bg-purple-950/30"
  }));

  return (
    <div className="space-y-6">
      
      {/* ─── Bento KPIs ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <KpiDashboardCard
          title="Active Storage Pool"
          value={`${storageUsedGB} GB`}
          subtitle="Of 500 GB total pool"
          icon={HardDrive}
          trend={storageUsedBytes > 0 ? `${percentUsed}% capacity` : "0% capacity"}
          accent="from-purple-500 to-indigo-500"
          sparklineData={[0, currentUsageNum]}
        />
        <KpiDashboardCard
          title="Total Visual Photos"
          value={totalPhotos}
          subtitle="Auto WebP optimized"
          icon={ImageIcon}
          trend={totalPhotos > 0 ? `${totalPhotos} photo files` : "0 photos"}
          accent="from-emerald-500 to-teal-500"
          sparklineData={[0, totalPhotos]}
        />
        <KpiDashboardCard
          title="High Definition Videos"
          value={totalVideos}
          subtitle="H.265 CDN streaming"
          icon={Video}
          trend={totalVideos > 0 ? `${totalVideos} video files` : "0 videos"}
          accent="from-cyan-500 to-blue-500"
          sparklineData={[0, totalVideos]}
        />
        <KpiDashboardCard
          title="Shared Public Links"
          value={sharedAlbumsCount}
          subtitle="Active token links"
          icon={Share2}
          trend={sharedAlbumsCount > 0 ? `${sharedAlbumsCount} active portals` : "No public links"}
          accent="from-pink-500 to-rose-500"
          sparklineData={[0, sharedAlbumsCount]}
        />
      </div>

      {/* ─── STORAGE FORECAST & SUITE STATUS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage growth forecast */}
        <div className="lg:col-span-2 p-5 border border-zinc-850 bg-[#121214]/30 backdrop-blur rounded-2xl space-y-4">
          <div className="flex justify-between items-center select-none">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubTab("storage")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeSubTab === "storage"
                    ? "bg-purple-650/10 text-purple-400 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Storage Analytics
              </button>
              <button
                onClick={() => setActiveSubTab("activity")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeSubTab === "activity"
                    ? "bg-purple-650/10 text-purple-400 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Recent Activity
              </button>
            </div>
            <span className="text-[9.5px] text-zinc-550 font-bold uppercase tracking-wider">Cloud CDN Connected</span>
          </div>
          
          {activeSubTab === "storage" ? (
            <div className="h-44 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: 10 }} />
                  <Area type="monotone" dataKey="Usage" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#growthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-3.5 py-2">
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  No media activities logged yet. Upload photos or videos to start tracking.
                </div>
              ) : (
                recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex items-center justify-between p-3 bg-zinc-900/35 border border-zinc-850 rounded-xl hover:bg-zinc-900/50 transition">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", act.color)}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{act.action}</p>
                          <p className="text-[10px] text-zinc-450 mt-0.5">{act.desc}</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-550 font-mono shrink-0">{act.time}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* CDN Optimization & suggestions */}
        <div className="lg:col-span-1 p-5 border border-zinc-850 bg-[#121214]/30 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between select-none">
              <span className="text-[10px] text-zinc-550 uppercase font-black tracking-widest">Cloud Optimization</span>
              <span className="text-[8px] text-emerald-450 font-bold flex items-center gap-0.5 uppercase tracking-wide">
                <ShieldCheck size={11} /> Active
              </span>
            </div>

            <div className="space-y-3 text-[10.5px]">
              <div className="flex justify-between items-center p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-350">WebP / AVIF Transform</p>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Auto compressing on the fly</p>
                </div>
                <div className="h-5 w-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check size={10} />
                </div>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-350">Responsive Cropping</p>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Optimized mobile previews</p>
                </div>
                <div className="h-5 w-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check size={10} />
                </div>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-350">EXIF Meta Retention</p>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Preserving camera specifications</p>
                </div>
                <div className="h-5 w-5 bg-purple-550/10 text-purple-400 rounded-full flex items-center justify-center font-bold">
                  <Sparkles size={9} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-850/60 pt-3 mt-3 flex justify-between items-center text-[9px] text-zinc-500 font-bold select-none">
            <span>Compression: ~64.2% Saved</span>
            <span>Cloudinary CDN</span>
          </div>
        </div>

      </div>

    </div>
  );
}

// Internal Sparkline KPI Card
function KpiDashboardCard({ title, value, subtitle, icon: Icon, trend, accent, sparklineData }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend: string;
  accent: string;
  sparklineData: number[];
}) {
  const [displayVal, setDisplayVal] = useState<string | number>(typeof value === "number" ? 0 : value);

  React.useEffect(() => {
    if (typeof value !== "number") {
      setDisplayVal(value);
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) return;
    const timer = setInterval(() => {
      start += Math.max(1, Math.ceil(end / 25));
      if (start >= end) {
        clearInterval(timer);
        setDisplayVal(end);
      } else {
        setDisplayVal(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const drawSparkline = () => {
    const width = 100;
    const height = 30;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");
    return { points, width, height };
  };

  const { points, width, height } = drawSparkline();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border border-zinc-800 bg-[#141416]/40 p-5 flex flex-col justify-between min-h-[140px] hover:shadow-[0_0_30px_rgba(168,85,247,0.02)] group overflow-hidden transition-colors"
    >
      <div className={cn("absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-5 blur-[40px] rounded-full group-hover:opacity-10 transition-opacity", accent)} />
      
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">{title}</span>
          <p className="text-xl font-extrabold tracking-tight text-zinc-200">
            {typeof displayVal === "number" ? displayVal.toLocaleString() : displayVal}
          </p>
        </div>
        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md shadow-black/40", accent)}>
          <Icon size={14} className="text-zinc-100" />
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-zinc-900/60 mt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-wider">
            {trend}
          </div>
          <span className="text-[9px] text-zinc-500 font-semibold block leading-none">{subtitle}</span>
        </div>

        <div className="h-8 w-20 opacity-60 group-hover:opacity-100 transition-opacity">
          <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
              fill="none; /* fallback */"
              stroke="#a855f7"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              style={{ fill: "none" }}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
