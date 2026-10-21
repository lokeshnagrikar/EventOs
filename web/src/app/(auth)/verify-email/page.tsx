"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Mail } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token was found in the URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        await apiClient.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
        addToast("Email verified successfully!", "success");
      } catch (err: any) {
        setStatus("error");
        const errMsg = err.response?.data?.error?.message || "Invalid or expired verification token.";
        setErrorMessage(errMsg);
        addToast(errMsg, "error");
      }
    };

    verifyToken();
  }, [token, addToast]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || emailInput.trim() === "") {
      addToast("Please enter your email address first.", "error");
      return;
    }

    setResending(true);
    try {
      await apiClient.post("/auth/resend-verification", { email: emailInput });
      setResendSuccess(true);
      addToast("Verification token resent!", "success");
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Failed to resend verification email.";
      addToast(errMsg, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto z-10 relative animate-in fade-in zoom-in-95 duration-300">
      <SpotlightCard className="bg-[#0B0F19]/95 border border-purple-500/25 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-2xl relative overflow-hidden transition-all duration-300 p-6 sm:p-7">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] z-20" />
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />

        <div className="flex flex-col items-center gap-2 mb-4 text-center select-none">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 p-[1.5px] shadow-[0_4px_16px_rgba(168,85,247,0.35)] shrink-0">
            <div className="w-full h-full bg-[#080c18] rounded-[14px] flex items-center justify-center">
              <EventOsLogo size={22} interactive={false} showGlow={false} />
            </div>
          </div>
        </div>

        {status === "loading" ? (
          <div className="text-center space-y-6 py-4 animate-pulse">
            <div className="relative mx-auto h-12 w-12 rounded-full border border-purple-500/30 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <div className="absolute inset-0 rounded-full border-2 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                Verifying Account
              </h2>
              <p className="text-xs text-zinc-400">
                Securely confirming your email address with the gateway. Please wait...
              </p>
            </div>
          </div>
        ) : status === "success" ? (
          <div className="text-center space-y-6 py-2 animate-slide-in">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/20">
              <CheckCircle2 size={32} className="animate-scale-in" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                Email Verified!
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your EventOS account is now activated and ready. You can sign in to access your dashboard workspace.
              </p>
            </div>
            <Button
              onClick={() => router.push("/?login=true")}
              className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-purple-600/20"
            >
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-2 animate-slide-in text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <AlertCircle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Verification Failed
              </h2>
              <p className="text-xs text-rose-300 bg-rose-950/20 border border-rose-500/10 p-2.5 rounded-xl text-left font-mono break-all">
                {errorMessage}
              </p>
            </div>

            {resendSuccess ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 text-left flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>Verification email resent! Please check your inbox or backend server logs.</span>
              </div>
            ) : (
              <div className="pt-2 border-t border-zinc-800 text-left space-y-3">
                <p className="text-[11px] text-zinc-400">
                  Need a new verification link? Enter your email below to request a new verification code.
                </p>
                <form onSubmit={handleResend} className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-550" />
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-550 transition-all focus:outline-none"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={resending}
                    className="w-full py-4.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    {resending ? "Resending..." : "Request New Code"}
                  </Button>
                </form>
              </div>
            )}
            
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="w-full text-xs text-zinc-500 hover:text-zinc-350"
            >
              Go back to Home
            </Button>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8 space-y-4">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500" />
        <span className="text-xs text-zinc-500 font-mono">Initializing verification tunnel...</span>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
