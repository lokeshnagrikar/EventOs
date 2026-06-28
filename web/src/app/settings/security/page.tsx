"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import {
  Settings,
  Building2,
  Palette,
  Users,
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  Lock
} from "lucide-react";

interface DeviceSession {
  id: string;
  deviceModel: string;
  osName: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Active Sessions
  const { data: sessionsRes, isLoading, error } = useQuery<{ data: DeviceSession[] }>({
    queryKey: ["activeSessions"],
    queryFn: async () => {
      const res = await apiClient.get("/auth/sessions");
      return res.data;
    },
    enabled: mounted
  });

  // 2. Revoke Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiClient.delete(`/auth/sessions/${sessionId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      addToast("Device session revoked successfully.", "success");
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error?.message || "Failed to revoke session.";
      addToast(errMsg, "error");
    }
  });

  if (!mounted) {
    return null;
  }

  const sessions = sessionsRes?.data || [];

  const handleRevoke = (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      addToast("You cannot revoke your active current session from here. Use Sign Out instead.", "error");
      return;
    }
    if (confirm("Are you sure you want to revoke this session? The device will be logged out immediately.")) {
      revokeSessionMutation.mutate(sessionId);
    }
  };

  const getDeviceIcon = (osName: string) => {
    const os = osName.toLowerCase();
    if (os.includes("windows") || os.includes("mac") || os.includes("linux")) {
      return <Laptop size={18} className="text-purple-400" />;
    }
    if (os.includes("ios") || os.includes("android") || os.includes("iphone") || os.includes("ipad")) {
      return <Smartphone size={18} className="text-purple-400" />;
    }
    return <Globe size={18} className="text-purple-400" />;
  };

  const formatLastActive = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Workspace Console</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-semibold uppercase font-mono">Control</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Hand Sub-tabs */}
        <aside className="w-full md:w-60 shrink-0 flex flex-col gap-1.5">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
            <Settings size={12} className="text-zinc-500" />
            Configurations
          </h2>
          <button
            onClick={() => router.push("/settings?tab=company")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent transition-all"
          >
            <Building2 size={14} />
            Company Profile
          </button>
          <button
            onClick={() => router.push("/settings?tab=branding")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent transition-all"
          >
            <Palette size={14} />
            Branding & Style
          </button>
          <button
            onClick={() => router.push("/settings?tab=team")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent transition-all"
          >
            <Users size={14} />
            Team Management
          </button>
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold bg-purple-600/10 text-purple-400 border border-purple-900/30 transition-all"
          >
            <Shield size={14} />
            Security & Sessions
          </button>
        </aside>

        {/* Content Pane */}
        <section className="flex-1 bg-[#111113]/35 border border-zinc-850 p-6 md:p-8 rounded-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Lock size={18} className="text-purple-500" />
              Security & Active Sessions
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your active login sessions. Revoke access from devices you do not recognize or no longer use.
            </p>
          </div>

          {/* Loader */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 text-xs">
              <Loader2 className="animate-spin text-purple-500" size={24} />
              Retrieving active sessions...
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to fetch session list</p>
                <p className="text-red-400/80 mt-1">Make sure you are authenticated in this workspace tenant context.</p>
              </div>
            </div>
          )}

          {/* Session List */}
          {!isLoading && !error && (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-5 bg-[#111113] border rounded-xl flex items-center justify-between transition-all ${
                    session.isCurrent
                      ? "border-purple-650/40 shadow-sm shadow-purple-950/5"
                      : "border-zinc-800/80"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center shrink-0">
                      {getDeviceIcon(session.osName)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-200">
                          {session.osName} • {session.deviceModel}
                        </h4>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-purple-600/15 border border-purple-500/20 rounded-full text-[9px] font-bold text-purple-400 tracking-wide uppercase">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        IP Address: <span className="font-mono text-zinc-300">{session.ipAddress}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500 font-medium">
                        Last Active: {formatLastActive(session.lastActiveAt)}
                      </p>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevoke(session.id, session.isCurrent)}
                      disabled={revokeSessionMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                      title="Revoke and force sign out"
                    >
                      <Trash2 size={13} />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-12 bg-[#111113] border border-zinc-800 rounded-xl space-y-2 text-zinc-450">
                  <Shield size={32} className="mx-auto text-zinc-550" />
                  <p className="text-xs font-bold">No active sessions found</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
