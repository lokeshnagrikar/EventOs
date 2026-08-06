"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { User, LogIn, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [cachedUser, setCachedUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    // If user is already authenticated, redirect to workspace / dashboard
    if (token && user) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
      return;
    }

    // Check for returning user profile in localStorage
    try {
      const savedUser = localStorage.getItem("eventos_last_user");
      if (savedUser) {
        setCachedUser(JSON.parse(savedUser));
      }
    } catch {
      // Ignore parse error
    }
  }, [token, user, router, searchParams]);

  const handleSwitchMode = (mode: "login" | "register") => {
    if (mode === "register") {
      router.push("/register");
    }
  };

  return (
    <div>
      {/* Returning User Profile Banner if available */}
      {cachedUser && (
        <div className="mb-5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-xs uppercase">
              {cachedUser.name ? cachedUser.name.charAt(0) : cachedUser.email.charAt(0)}
            </div>
            <div>
              <div className="text-white font-medium">Welcome back, {cachedUser.name || "Planner"}!</div>
              <div className="text-zinc-400 text-[11px] truncate max-w-[160px]">{cachedUser.email}</div>
            </div>
          </div>
          <button
            onClick={() => setCachedUser(null)}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
          >
            Switch
          </button>
        </div>
      )}

      {/* Main Login Form Component */}
      <LoginForm isModal={false} onSwitchMode={handleSwitchMode} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-500 text-center py-8">Loading EventOS Command Center...</div>}>
      <LoginContent />
    </Suspense>
  );
}
