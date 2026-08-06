"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Sparkles, Building2, Crown, Music } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [selectedPersona, setSelectedPersona] = useState<"agency" | "wedding" | "stage">("agency");

  useEffect(() => {
    // If user is already authenticated, redirect to workspace / dashboard
    if (token && user) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
  }, [token, user, router, searchParams]);

  const handleSwitchMode = (mode: "login" | "register") => {
    if (mode === "login") {
      router.push("/login");
    }
  };

  return (
    <div>
      {/* Persona Role Selection Header Pills */}
      <div className="mb-5">
        <label className="text-[11px] font-medium text-zinc-400 block mb-2">Select Your Business Role</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectedPersona("agency")}
            className={`p-2 rounded-xl border text-left transition-all ${
              selectedPersona === "agency"
                ? "bg-purple-500/15 border-purple-500/50 text-white shadow-sm shadow-purple-500/20"
                : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400 mb-1" />
            <div className="text-[11px] font-semibold">Event Agency</div>
            <div className="text-[9px] text-zinc-500 truncate">Full OS & CRM</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona("wedding")}
            className={`p-2 rounded-xl border text-left transition-all ${
              selectedPersona === "wedding"
                ? "bg-pink-500/15 border-pink-500/50 text-white shadow-sm shadow-pink-500/20"
                : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-pink-400 mb-1" />
            <div className="text-[11px] font-semibold">Wedding Planner</div>
            <div className="text-[9px] text-zinc-500 truncate">Quotes & Portals</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona("stage")}
            className={`p-2 rounded-xl border text-left transition-all ${
              selectedPersona === "stage"
                ? "bg-cyan-500/15 border-cyan-500/50 text-white shadow-sm shadow-cyan-500/20"
                : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Music className="w-3.5 h-3.5 text-cyan-400 mb-1" />
            <div className="text-[11px] font-semibold">Concert & Stage</div>
            <div className="text-[9px] text-zinc-500 truncate">Cue Sheets & AV</div>
          </button>
        </div>
      </div>

      {/* Main Register Form Component */}
      <RegisterForm isModal={false} onSwitchMode={handleSwitchMode} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-500 text-center py-8">Initializing EventOS Registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
