"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { BlurFade } from "@/components/ui/blur-fade";
import { 
  Building2, 
  LogOut, 
  ArrowRight, 
  AlertCircle, 
  Shield, 
  User, 
  Loader2, 
  Plus, 
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Command,
  CornerDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { memberships, user, setAuth, clearAuth } = useAuthStore();

  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (memberships.length === 0 && !user) {
      router.push("/?login=true");
    }
  }, [memberships, user, router]);

  // Keyboard shortcut listener for fast switching (1-9 and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loadingTenantId !== null) return;
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= memberships.length) {
        handleSwitch(memberships[num - 1].tenantId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [memberships, loadingTenantId]);

  if (!mounted) {
    return null;
  }

  const handleSwitch = async (tenantId: string) => {
    setError(null);
    setLoadingTenantId(tenantId);
    try {
      const response = await apiClient.post("/auth/switch", { tenantId });
      
      const { accessToken, userId, role, firstName, lastName, memberships: newMemberships, permissions } = response.data.data;
      
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      
      setAuth(
        accessToken,
        { id: userId, email: user?.email || "", firstName, lastName, role, permissions: permissions || [] },
        tenantId,
        newMemberships
      );

      addToast("Workspace connected.", "success");

      if (role === "CLIENT") {
        router.push("/portal");
      } else if (role === "SUPER_ADMIN") {
        router.push("/superadmin");
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
      // Clear local auth even if network fails
    } finally {
      clearAuth();
      addToast("Signed out successfully.", "info");
      router.push("/?login=true");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 p-4 sm:p-6 relative select-none">
      {/* Refined subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <BlurFade spring delay={0.05} direction="down" offset={10}>
          <div className="flex justify-between items-center pb-5 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-purple-950/40">
                E
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Select Workspace
                  <span className="text-[10px] text-zinc-500 font-mono font-normal">({memberships.length} available)</span>
                </h1>
                <p className="text-xs text-zinc-400">Choose an agency workspace or event command center</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loadingTenantId !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Sign out of current account"
            >
              {loadingTenantId === "LOGOUT" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <LogOut size={13} />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        </BlurFade>

        {/* Global Error Notice */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Workspaces List (High Density Stacked Cards) */}
        <div className="space-y-3">
          {memberships.map((membership, idx) => {
            const isSwitchingThis = loadingTenantId === membership.tenantId;
            const initials = membership.companyName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "EV";

            const isOwner = membership.role === "OWNER" || membership.role === "SUPER_ADMIN";

            return (
              <BlurFade key={membership.tenantId} spring delay={0.08 + idx * 0.04} direction="up" offset={10}>
                <button
                  disabled={loadingTenantId !== null}
                  onClick={() => handleSwitch(membership.tenantId)}
                  className={cn(
                    "group w-full p-4 bg-[#121214] border border-zinc-800/80 hover:border-purple-500/40 rounded-2xl transition-all duration-200 flex items-center justify-between text-left cursor-pointer shadow-sm hover:shadow-md hover:bg-zinc-900/40 relative disabled:opacity-50",
                    isSwitchingThis && "border-purple-500 bg-purple-950/10"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    {/* Organization Avatar */}
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-purple-500/30 group-hover:bg-purple-950/30 flex items-center justify-center font-bold text-xs text-zinc-300 group-hover:text-purple-300 transition-colors shrink-0 shadow-inner">
                      {initials}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white truncate">
                          {membership.companyName}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0",
                          isOwner 
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          {membership.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                        Tenant ID: {membership.tenantId.substring(0, 13)}...
                      </p>
                    </div>
                  </div>

                  {/* Right side status / enter action */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Keyboard shortcut hint */}
                    <span className="hidden sm:inline-flex items-center justify-center h-5 w-5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300">
                      {idx + 1}
                    </span>

                    {isSwitchingThis ? (
                      <div className="flex items-center gap-1 text-xs text-purple-400 font-bold">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Opening...</span>
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 group-hover:bg-purple-600 text-zinc-400 group-hover:text-white border border-zinc-800 group-hover:border-purple-500 flex items-center justify-center transition-all">
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>
                </button>
              </BlurFade>
            );
          })}

          {/* New Workspace Creation Shortcut Card */}
          <BlurFade spring delay={0.08 + memberships.length * 0.04} direction="up" offset={10}>
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full p-3.5 bg-zinc-950/40 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Plus size={14} className="text-zinc-500" />
              <span>Create or Register New Agency Workspace</span>
            </button>
          </BlurFade>
        </div>

        {/* Empty State */}
        {memberships.length === 0 && (
          <div className="text-center py-10 bg-[#121214] border border-zinc-800 rounded-2xl space-y-3">
            <Building2 size={32} className="mx-auto text-zinc-600" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-200">No Active Workspaces Linked</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Your account is not linked to any agency profiles. Create a new agency workspace to start.
              </p>
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
            >
              Launch New Workspace
            </button>
          </div>
        )}

        {/* Footer info bar */}
        <BlurFade spring delay={0.2} direction="up" offset={10}>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 px-1 font-mono pt-1">
            <span>Session: <strong className="text-zinc-400 font-sans font-medium">{user?.email}</strong></span>
            <span className="text-[10px] text-zinc-600">Press 1-{Math.min(9, memberships.length)} to jump</span>
          </div>
        </BlurFade>
      </div>
    </main>
  );
}
