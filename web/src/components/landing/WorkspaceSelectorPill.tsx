"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, Check, Plus, ShieldCheck, Sparkles, LogOut } from "lucide-react";
import { useAuthStore, WorkspaceMembership } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";
import { useToastStore } from "@/lib/toastStore";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const DEMO_WORKSPACES: WorkspaceMembership[] = [
  { tenantId: "tenant_apex", companyId: "comp_1", companyName: "Apex Events & Production", role: "OWNER", status: "ACTIVE" },
  { tenantId: "tenant_royal", companyId: "comp_2", companyName: "Royal Decorators & Scenography", role: "ADMIN", status: "ACTIVE" },
  { tenantId: "tenant_subhub", companyId: "comp_3", companyName: "Subhub Beach Resorts & Venues", role: "DIRECTOR", status: "ACTIVE" }
];

export function WorkspaceSelectorPill() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const { activeTenantId, memberships, updateActiveTenant, isAuthenticated, user, clearAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Only show workspace switcher for logged-in users
  if (!isAuthenticated) {
    return null;
  }

  // Use user memberships if available, else fallback to DEMO_WORKSPACES for smooth interactive preview
  const availableWorkspaces = memberships.length > 0 ? memberships : DEMO_WORKSPACES;
  const currentWorkspace = availableWorkspaces.find((m) => m.tenantId === activeTenantId) || availableWorkspaces[0];

  const handleSwitchWorkspace = async (target: WorkspaceMembership) => {
    if (target.tenantId === currentWorkspace.tenantId) {
      setIsOpen(false);
      router.push("/dashboard");
      return;
    }

    setSwitchingId(target.tenantId);
    try {
      const storedRefreshToken = useAuthStore.getState().refreshToken 
        || (typeof window !== 'undefined' ? (sessionStorage.getItem('refreshToken') || localStorage.getItem('eventos_refresh_token')) : null);

      const res = await apiClient.post(`/auth/switch`, { 
        tenantId: target.tenantId,
        ...(storedRefreshToken ? { refreshToken: storedRefreshToken } : {})
      });
      const { accessToken, refreshToken: newRefreshToken, role, permissions, firstName } = res.data.data;
      
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      if (firstName) {
        document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
        localStorage.setItem("user_name", firstName);
      }
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_role", role);

      updateActiveTenant(target.tenantId, accessToken, role, permissions || [], newRefreshToken || storedRefreshToken);
      addToast(`Switched workspace to ${target.companyName}!`, "success");
      router.push("/dashboard");
    } catch (e: any) {
      const errMsg = e.response?.data?.error?.message || "Failed to switch workspace.";
      addToast(errMsg, "error");
    } finally {
      setSwitchingId(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 rounded-full text-xs font-bold text-white transition-all shadow-md cursor-pointer hover:border-purple-400/60"
      >
        <div className="h-5 w-5 rounded-md bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
          {currentWorkspace.companyName[0]}
        </div>
        <span className="max-w-[140px] truncate text-purple-200">
          {currentWorkspace.companyName}
        </span>
        <ChevronDown size={12} className={`text-purple-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#09090b] border border-purple-500/30 rounded-2xl p-2 shadow-2xl shadow-purple-950/50 backdrop-blur-xl z-50"
          >
            <div className="px-2.5 py-1.5 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 flex items-center justify-between">
              <span>Switch Workspace</span>
              <span className="text-purple-400 font-normal">Multi-Tenant</span>
            </div>

            <div className="space-y-1 pt-1.5">
              {availableWorkspaces.map((ws) => {
                const isActive = ws.tenantId === currentWorkspace.tenantId;
                const isSwitching = ws.tenantId === switchingId;

                return (
                  <button
                    key={ws.tenantId}
                    type="button"
                    onClick={() => handleSwitchWorkspace(ws)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-600/20 border border-purple-500/40 font-bold text-white"
                        : "hover:bg-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                        isActive ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {ws.companyName[0]}
                      </div>
                      <div className="text-left min-w-0">
                        <div className="truncate text-xs">{ws.companyName}</div>
                        <div className="text-[9px] text-zinc-500 uppercase">{ws.role}</div>
                      </div>
                    </div>

                    {isActive && <Check size={14} className="text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-zinc-800 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/workspace-select");
                }}
                className="w-full flex items-center gap-2 p-2 text-xs text-purple-300 hover:bg-purple-950/40 rounded-xl transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add / Manage Workspaces</span>
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    useAuthModalStore.getState().openLogoutModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 text-xs text-rose-400 hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out ({user?.firstName || "User"})</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
