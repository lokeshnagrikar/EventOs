"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

// Shimmer gradient style helper
const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent";

export function LoadingScreen({ message = "Loading workspace..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#09090b]">
      {/* Decorative Radial Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      
      {/* Gradient Glow */}
      <div className="absolute w-[300px] h-[300px] bg-purple-550/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-4">
        {/* Glowing Brand Badge */}
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-purple-500/20 select-none animate-pulse">
          <Sparkles size={22} className="text-white animate-spin [animation-duration:8s]" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-zinc-200">EventOS</h2>
          <p className="text-xs text-zinc-500 font-medium tracking-wider uppercase mt-1">{message}</p>
        </div>
        {/* Shimmering Progress Bar */}
        <div className="w-48 bg-white/[0.04] border border-white/[0.08] h-1 rounded-full relative overflow-hidden mt-2">
          <div className="absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-purple-500 to-pink-500 animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className={cn("w-64 border-r border-border bg-card p-6 flex flex-col justify-between shrink-0 min-h-screen relative overflow-hidden", shimmer)}>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-zinc-800 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-zinc-800 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        
        {/* Search */}
        <div className="h-9 bg-zinc-900 border border-zinc-800/80 rounded-xl w-full animate-pulse" />

        {/* Menu Items */}
        <div className="space-y-2 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl">
              <div className="h-4.5 w-4.5 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4.5 bg-zinc-800 rounded flex-1 animate-pulse" style={{ width: `${((i * 7) % 30) + 50}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* User Session profile */}
      <div className="flex items-center gap-3 border-t border-zinc-800/80 pt-4">
        <div className="h-9 w-9 rounded-full bg-zinc-800 animate-pulse" />
        <div className="space-y-1 flex-1">
          <div className="h-3 bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-2.5 bg-zinc-800 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <div className={cn("border-b border-border bg-card/85 px-6 py-4 flex items-center justify-between shrink-0 relative overflow-hidden", shimmer)}>
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-zinc-800 animate-pulse" />
        <div className="h-4 bg-zinc-800 rounded w-24 animate-pulse" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-20 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-5 space-y-4 relative overflow-hidden", shimmer, className)}>
      <div className="space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
      </div>
      <div className="h-16 bg-zinc-900/60 border border-zinc-800/40 rounded-xl animate-pulse" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-zinc-850 rounded w-1/4 animate-pulse" />
        <div className="h-6 bg-zinc-800 rounded w-16 animate-pulse" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className={cn("border border-zinc-800/60 rounded-2xl bg-zinc-900/10 overflow-hidden relative", shimmer)}>
      {/* Table Header */}
      <div className="grid border-b border-zinc-800/60 bg-zinc-900/30 px-6 py-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-zinc-850 rounded w-1/2 animate-pulse" />
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-zinc-800/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid px-6 py-4 items-center" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3.5 bg-zinc-800 rounded w-2/3 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className={cn("rounded-2xl border border-zinc-800/60 bg-zinc-900/10 p-5 space-y-6 relative overflow-hidden", shimmer)}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-32 animate-pulse" />
          <div className="h-3 bg-zinc-800 rounded w-48 animate-pulse" />
        </div>
        <div className="h-7 w-20 bg-zinc-850 rounded-lg animate-pulse" />
      </div>
      
      {/* Visual Chart Bars */}
      <div className="h-48 flex items-end gap-3 pt-4 border-b border-l border-zinc-800/60 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-850 rounded-t animate-pulse"
            style={{
              height: `${((i * 13) % 60) + 30}%`,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className={cn("rounded-2xl border border-zinc-800/60 bg-zinc-900/10 p-5 space-y-4 relative overflow-hidden", shimmer)}>
      {/* Calendar Header Controls */}
      <div className="flex justify-between items-center mb-2">
        <div className="h-5 bg-zinc-800 rounded w-28 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
      
      {/* 7 Columns for Days of Week */}
      <div className="grid grid-cols-7 gap-2 border-b border-zinc-800/40 pb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="h-3 bg-zinc-850 rounded w-1/2 justify-self-center animate-pulse" />
        ))}
      </div>
      
      {/* 35 grid squares representing 5 weeks */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-900/40 border border-zinc-850/60 rounded-xl p-1 animate-pulse">
            <div className="h-3 bg-zinc-850 rounded w-1/4 m-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative overflow-hidden", shimmer)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 aspect-[4/5] animate-pulse relative overflow-hidden flex flex-col justify-end p-4"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="space-y-1.5">
            <div className="h-3 bg-zinc-850 rounded w-1/2" />
            <div className="h-2.5 bg-zinc-850 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className={cn("space-y-4 relative overflow-hidden p-2", shimmer)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-1/4 animate-pulse" />
          <div className="h-9 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
        </div>
      ))}
      <div className="pt-2">
        <div className="h-10 bg-zinc-800 rounded-xl w-full animate-pulse" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Placeholder */}
      <div className="hidden md:block">
        <SidebarSkeleton />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <NavbarSkeleton />
        
        <div className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="space-y-2 w-1/3">
              <div className="h-6 bg-zinc-800 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-zinc-850 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-9 w-24 bg-zinc-800 rounded-xl animate-pulse" />
          </div>

          {/* Grid Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton className="md:col-span-1" />
            <CardSkeleton className="md:col-span-2" />
          </div>

          {/* Data List */}
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}
