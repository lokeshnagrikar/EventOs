"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, User, Key, Eye, EyeOff, Sparkles, Check, Info } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES } from "../constants";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("super_admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const activeRole = ADMIN_ROLES.find(r => r.id === selectedRole);
      if (!activeRole) return;

      const userProfile = {
        id: `admin-${selectedRole}-${Date.now().toString(36)}`,
        email: email || `${selectedRole}@eventos.co`,
        firstName: activeRole.name,
        lastName: "Operator",
        role: "SUPER_ADMIN", // Flag to pass App Shell superadmin restriction
        permissions: [selectedRole] // Custom sub-role permission flag
      };

      setAuth(
        "admin-mock-jwt-token-xyz-123",
        userProfile,
        "superadmin-governed-tenant-system",
        [{ tenantId: "superadmin-governed-tenant-system", companyId: "eventos-corp", companyName: "EventOS Corporate", role: "GLOBAL_ADMIN", status: "ACTIVE" }]
      );

      addToast(`🔑 Logged in as ${activeRole.name} successfully!`, "success");
      router.push("/superadmin");
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-purple-650/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-4xl bg-zinc-950/80 border border-zinc-850/60 rounded-3xl shadow-2xl p-6 md:p-10 backdrop-blur-xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        
        {/* Left pane: Brand info and Role details */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-500/20">
              E
            </div>
            <div>
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black tracking-widest font-mono uppercase">
                Internal Console
              </span>
              <h1 className="text-2xl font-black text-white mt-1.5 leading-tight tracking-tight">EventOS SuperAdmin</h1>
              <p className="text-xs text-zinc-500 font-semibold mt-1">Authorized corporate access only. All actions are actively audited.</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Info size={11} className="text-purple-400" /> Selective RBAC Switcher
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {ADMIN_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.id);
                    setEmail(`${role.id}@eventos.co`);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    selectedRole === role.id 
                      ? "border-purple-500 bg-purple-500/5 text-purple-300"
                      : "border-zinc-900 hover:border-zinc-800 text-zinc-500"
                  )}
                >
                  <span className="text-[10px] font-black block">{role.name}</span>
                  <span className="text-[8px] leading-snug mt-0.5 block opacity-70 truncate">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-zinc-650 font-bold font-mono">
            EventOS Inc. © 2026. Security Protocol 413-A
          </p>
        </div>

        {/* Right pane: Auth Credentials Form */}
        <div className="flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Email Address</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-3 text-zinc-550" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eventos.co"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-3 text-zinc-550" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-550 hover:text-zinc-300 transition"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl flex gap-2.5">
              <Shield size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black uppercase text-zinc-400">Security Clearance</p>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal font-semibold">
                  Logging in gives you access with <strong>{ADMIN_ROLES.find(r => r.id === selectedRole)?.name}</strong> level permissions.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl hover:opacity-95 active:scale-[0.99] transition text-xs shadow-lg shadow-purple-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <Key size={13} /> Authenticate Session
                </>
              )}
            </button>
          </form>
        </div>

      </motion.div>
    </div>
  );
}
