"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { SparklesCore } from "@/components/ui/sparkles";
import { BlurFade } from "@/components/ui/blur-fade";
import { Building2, LogOut, ArrowRight, AlertCircle, Shield, User, Loader2 } from "lucide-react";

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { memberships, user, setAuth, clearAuth } = useAuthStore();

  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If no memberships or user, redirect to login
    if (memberships.length === 0 && !user) {
      router.push("/login");
    }
  }, [memberships, user, router]);

  if (!mounted) {
    return null;
  }

  const handleSwitch = async (tenantId: string) => {
    setError(null);
    setLoadingTenantId(tenantId);
    try {
      const response = await apiClient.post("/auth/switch", { tenantId });
      
      const { accessToken, userId, role, firstName, memberships: newMemberships, permissions } = response.data.data;
      
      // Update session flag cookie for middleware routing guards
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      
      // Save state in Zustand store
      setAuth(
        accessToken,
        { id: userId, email: user?.email || "", firstName, role, permissions: permissions || [] },
        tenantId,
        newMemberships
      );

      addToast("Switched workspace successfully!", "success");

      // Redirect based on the newly assumed role
      if (role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Failed to switch workspace. Please try again.";
      setError(errMsg);
      addToast(errMsg, "error");
      setLoadingTenantId(null);
    }
  };

  const handleLogout = async () => {
    setLoadingTenantId("LOGOUT");
    try {
      await apiClient.post("/auth/logout", { email: user?.email || "" });
    } catch (e) {
      // Ignore logout error and clear local state
    } finally {
      clearAuth();
      addToast("Signed out successfully.", "info");
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090B] text-white p-4 sm:p-6 relative overflow-hidden select-none selection:bg-purple-600/35 selection:text-white">
      {/* Decorative Radial Grid / Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />

      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-650/10 to-pink-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-12 right-[10%] w-[250px] h-[250px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Sparkles particles background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
        <SparklesCore
          id="tsparticlesselect"
          background="transparent"
          minSize={0.6}
          maxSize={1.8}
          particleDensity={25}
          particleColor="#EC4899"
          className="w-full h-full"
        />
      </div>

      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Header section card */}
        <BlurFade duration={0.4} delay={0.05} direction="down" offset={10}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-550/20 transform hover:rotate-6 transition-transform select-none">
                E
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                  EventOS Workspaces
                </h1>
                <p className="text-xs text-zinc-400">Switch between your active organization profiles</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loadingTenantId !== null}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-950/40 border border-zinc-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-semibold text-zinc-400 hover:text-rose-300 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loadingTenantId === "LOGOUT" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        </BlurFade>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 animate-slide-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberships.map((membership, idx) => {
            const isSwitchingThis = loadingTenantId === membership.tenantId;
            const initials = membership.companyName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <BlurFade key={membership.tenantId} duration={0.4} delay={0.1 + idx * 0.05} direction="up" offset={15}>
                <button
                  disabled={loadingTenantId !== null}
                  onClick={() => handleSwitch(membership.tenantId)}
                  className={`group text-left p-5 bg-[#111113]/70 border border-zinc-800/80 hover:border-purple-500/50 rounded-2xl transition-all duration-300 relative flex flex-col justify-between min-h-[160px] shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:shadow-purple-950/10 backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none w-full`}
                >
                  {/* Top card accent line */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] opacity-0 group-hover:opacity-90 rounded-t-2xl transition-opacity duration-300" />
                  
                  {/* Top card metadata */}
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800/60 group-hover:border-purple-500/30 group-hover:bg-purple-950/40 flex items-center justify-center font-extrabold text-sm text-zinc-300 group-hover:text-purple-400 transition-colors shadow-inner">
                        {initials || <Building2 size={16} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
                          {membership.companyName}
                        </h3>
                        <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider mt-0.5 font-mono">
                          ID: {membership.tenantId.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom card content */}
                  <div className="flex items-center justify-between w-full pt-4 border-t border-zinc-800/40 mt-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/60 border border-zinc-800/60 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                      <Shield size={10} className="text-purple-400" />
                      <span>{membership.role}</span>
                    </div>

                    <span className="text-xs font-bold text-zinc-400 group-hover:text-purple-400 flex items-center gap-1 transition-colors">
                      {isSwitchingThis ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter</span>
                          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                        </>
                      )}
                    </span>
                  </div>
                </button>
              </BlurFade>
            );
          })}
        </div>

        {/* Empty State */}
        {memberships.length === 0 && (
          <BlurFade duration={0.4} delay={0.1} direction="up" offset={15}>
            <div className="text-center py-12 bg-[#111113]/70 border border-zinc-800/80 rounded-2xl space-y-4 backdrop-blur-md">
              <Building2 size={36} className="mx-auto text-zinc-500 animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm">No Workspaces Found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto px-4 leading-relaxed">
                  Your account is not linked to any active organization profiles. Please contact your administrator.
                </p>
              </div>
            </div>
          </BlurFade>
        )}

        {/* Footer info */}
        <BlurFade duration={0.4} delay={0.2} direction="up" offset={10}>
          <div className="text-center pt-2 select-none">
            <p className="text-xs text-zinc-500">
              Logged in as <span className="text-zinc-400 font-semibold">{user?.email}</span>
            </p>
          </div>
        </BlurFade>
      </div>
    </main>
  );
}
