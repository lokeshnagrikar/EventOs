"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { HardDrive, ImageIcon, Video, Share2, Layers, ShieldCheck, Sparkles, TrendingUp, Check } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Album {
  id: string;
  name: string;
  itemCount: number;
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
  // Storage Calculations (Mock)
  const totalStorageCapacityBytes = 500 * 1024 * 1024 * 1024; // 500 GB
  const rawPhotosStorage = totalPhotos * 3.8 * 1024 * 1024; // Avg 3.8MB
  const rawVideosStorage = totalVideos * 45.2 * 1024 * 1024; // Avg 45.2MB
  const storageUsedBytes = rawPhotosStorage + rawVideosStorage;

  const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.round((storageUsedBytes / totalStorageCapacityBytes) * 100));

  const sharedAlbumsCount = albums.filter((a) => a.visibility === "PUBLIC").length;

  const popularAlbums = useMemo(() => {
    return [...albums].sort((a, b) => b.itemCount - a.itemCount).slice(0, 3);
  }, [albums]);

  // Mock Storage Growth Trend Data
  const growthData = [
    { name: "Jan", Usage: 32 },
    { name: "Feb", Usage: 45 },
    { name: "Mar", Usage: 58 },
    { name: "Apr", Usage: 88 },
    { name: "May", Usage: 122 },
    { name: "Jun", Usage: Number(storageUsedGB) || 145 }
  ];

  return (
    <div className="space-y-6">
      
      {/* ─── Bento KPIs ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Storage Pool"
          value={`${storageUsedGB} GB`}
          subtitle="Allocated capacity"
          icon={HardDrive}
          trend={{ value: 8, isPositive: true }}
          sparklineData={[30, 45, 55, 75, Number(storageUsedGB) || 120]}
          gradientAccent="from-purple-500 to-indigo-500"
        />
        <KpiCard
          title="Total Visual Photos"
          value={totalPhotos}
          subtitle="Auto WebP optimized"
          icon={ImageIcon}
          trend={{ value: 12, isPositive: true }}
          sparklineData={[10, 20, 25, 45, totalPhotos || 50]}
          gradientAccent="from-emerald-500 to-teal-500"
        />
        <KpiCard
          title="High Definition Videos"
          value={totalVideos}
          subtitle="H.265 CDN streaming"
          icon={Video}
          trend={{ value: 4, isPositive: true }}
          sparklineData={[2, 5, 4, 10, totalVideos || 15]}
          gradientAccent="from-cyan-500 to-blue-500"
        />
        <KpiCard
          title="Shared Public Albums"
          value={sharedAlbumsCount}
          subtitle="Active token links"
          icon={Share2}
          trend={{ value: 25, isPositive: true }}
          sparklineData={[0, 1, 2, 4, sharedAlbumsCount]}
          gradientAccent="from-pink-500 to-rose-500"
        />
      </div>

      {/* ─── STORAGE FORECAST & SUITE STATUS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage growth forecast */}
        <div className="lg:col-span-2 p-5 border border-zinc-850 bg-[#121214]/30 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-350 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-purple-400" />
              Storage Accumulation Trend (GB)
            </h3>
            <span className="text-[9.5px] text-zinc-550 font-bold uppercase">6-Month Trend</span>
          </div>
          
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
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                <Area type="monotone" dataKey="Usage" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CDN Optimization & suggestions */}
        <div className="lg:col-span-1 p-5 border border-zinc-850 bg-[#121214]/30 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-550 uppercase font-black tracking-widest">Optimization Audit</span>
              <span className="text-[8px] text-emerald-450 font-bold flex items-center gap-0.5">
                <ShieldCheck size={11} /> Cloud Active
              </span>
            </div>

            <div className="space-y-3 text-[10.5px]">
              <div className="flex justify-between items-center p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-350">Auto-WebP Formatting</p>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Saves up to 45% bandwidth</p>
                </div>
                <div className="h-5 w-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check size={10} />
                </div>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-350">Responsive AVIF Delivery</p>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Optimizes for dynamic displays</p>
                </div>
                <div className="h-5 w-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check size={10} />
                </div>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-350">Metadata EXIF Preserved</p>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Maintains photographer credentials</p>
                </div>
                <div className="h-5 w-5 bg-purple-550/10 text-purple-400 rounded-full flex items-center justify-center">
                  <Sparkles size={10} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-850/60 pt-3 mt-3 flex justify-between items-center text-[9px] text-zinc-500 font-bold">
            <span>Compression: ~64.2% Saved</span>
            <span>Cloudinary Node</span>
          </div>
        </div>

      </div>

    </div>
  );
}
