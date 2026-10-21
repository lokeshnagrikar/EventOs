"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { EventOsLogo } from "@/components/ui/EventOsLogo";
import {
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Check,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

const resetSchema = z
  .object({
    token: z.string().min(1, { message: "Security token is required." }),
    password: z.string().min(8, { message: "New password must be at least 8 characters." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetInputs = z.infer<typeof resetSchema>;

const checkPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "Empty", colorClass: "bg-transparent", barWidth: "0%" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, label: "Weak", colorClass: "bg-rose-500 shadow-rose-500/30", barWidth: "25%" };
  } else if (score === 2) {
    return { score: 2, label: "Fair", colorClass: "bg-amber-500 shadow-amber-500/30", barWidth: "50%" };
  } else if (score === 3) {
    return { score: 3, label: "Strong", colorClass: "bg-emerald-500 shadow-emerald-500/30", barWidth: "75%" };
  } else {
    return { score: 4, label: "Excellent", colorClass: "bg-cyan-500 shadow-cyan-500/30", barWidth: "100%" };
  }
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 450);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetInputs>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");
  const confirmPasswordValue = watch("confirmPassword", "");
  const strength = checkPasswordStrength(passwordValue);

  // Live checklist criteria
  const isLengthValid = passwordValue.length >= 8;
  const hasUpperLower = /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);
  const passwordsMatch = Boolean(passwordValue && confirmPasswordValue && passwordValue === confirmPasswordValue);

  useEffect(() => {
    setMounted(true);
    const rawToken = searchParams.get("token");
    if (rawToken && rawToken.trim() !== "") {
      let clean = rawToken.trim();
      if (clean.includes("token=")) {
        const match = clean.match(/token=([A-Za-z0-9_-]+)/);
        if (match && match[1]) clean = match[1];
      } else if (clean.includes("/")) {
        const parts = clean.split("/");
        clean = parts[parts.length - 1].split("?")[0];
      }
      setToken(clean);
      setValue("token", clean);
    } else {
      setToken(null);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ResetInputs) => {
    setError(null);
    setLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token: data.token.trim(),
        password: data.password,
      });

      addToast("Password reset successfully!", "success");
      setSuccess(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Password reset failed. Invalid or expired link.";
      setError(errMsg);
      addToast(errMsg, "error");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center text-xs text-zinc-500 font-mono flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-purple-400" />
        <span>Initializing security channel...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto z-10 relative animate-in fade-in zoom-in-95 duration-300">
      <SpotlightCard className="bg-[#0B0F19]/95 border border-purple-500/25 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(139,92,246,0.18)] backdrop-blur-2xl relative overflow-hidden transition-all duration-300">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] z-20" />
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />

        {/* 1. Missing Token State (Invalid or Direct Visit) */}
        {!token ? (
          <div className="p-8 sm:p-12 text-center space-y-6 max-w-md mx-auto animate-slide-in select-none">
            <div className="mx-auto h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <ShieldAlert size={34} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                Invalid or Expired Link
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This password recovery link is missing, incomplete, or has expired for security reasons. Please request a fresh reset link from your registered email.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/forgot-password"
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Request New Reset Link</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/?login=true"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors pt-1"
              >
                <ArrowLeft size={13} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : success ? (
          /* 2. Success State */
          <div className="p-8 sm:p-12 text-center space-y-6 max-w-md mx-auto animate-slide-in select-none">
            <div className="relative mx-auto h-20 w-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              <CheckCircle2 size={42} className="animate-scale-in" />
              <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Sparkles size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white font-sans">
                Password Updated!
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Your credentials have been securely updated with 256-bit encryption. You can now log into your EventOS workspace.
              </p>
            </div>

            <Button
              onClick={() => router.push("/?login=true")}
              className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          /* 3. Main Two-Column Layout (Token is 100% invisible) */
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Column: Brand & Security Trust Panel */}
            <div className="lg:col-span-5 bg-gradient-to-b from-purple-950/25 via-[#080c18] to-[#050811] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col justify-between select-none">
              <div className="space-y-6">
                {/* Brand Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 p-[1.5px] shadow-[0_4px_16px_rgba(168,85,247,0.35)] shrink-0">
                      <div className="w-full h-full bg-[#080c18] rounded-[14px] flex items-center justify-center">
                        <EventOsLogo size={22} interactive={false} showGlow={false} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black tracking-tight text-white font-sans">EventOS</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[9px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                          Vault
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Account Recovery</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-semibold text-emerald-400">
                    <Lock size={11} />
                    <span>TLS 256-Bit Encrypted Session</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">Set a Resilient Password</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Protect your clients, quotes, invoices, and event workspaces with strong credentials.
                  </p>
                </div>

                {/* Live Requirements Checklist */}
                <div className="space-y-2.5 bg-black/30 p-3.5 rounded-2xl border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Security Checklist
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center transition-all ${isLengthValid
                            ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </div>
                      <span className={isLengthValid ? "text-emerald-300 font-medium" : "text-zinc-500"}>
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center transition-all ${hasUpperLower
                            ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </div>
                      <span className={hasUpperLower ? "text-emerald-300 font-medium" : "text-zinc-500"}>
                        Upper & lowercase letters
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center transition-all ${hasNumber
                            ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </div>
                      <span className={hasNumber ? "text-emerald-300 font-medium" : "text-zinc-500"}>
                        At least one number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center transition-all ${hasSpecial
                            ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </div>
                      <span className={hasSpecial ? "text-emerald-300 font-medium" : "text-zinc-500"}>
                        Special character (!@#$%^&*)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center transition-all ${passwordsMatch
                            ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </div>
                      <span className={passwordsMatch ? "text-emerald-300 font-medium" : "text-zinc-500"}>
                        Both passwords match
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Assurance */}
              <div className="pt-4 mt-4 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center gap-2">
                <ShieldCheck size={14} className="text-purple-400 shrink-0" />
                <span>Zero-knowledge hashing & verified token session</span>
              </div>
            </div>

            {/* Right Column: Clean Professional Password Form */}
            <div className={`lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-[#080c18]/85 ${shouldShake ? "animate-shake" : ""}`}>
              <div className="space-y-5">
                {/* Form Header */}
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Create New Password</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Choose a strong, unique password to secure your EventOS workspace.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 animate-slide-in">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Hidden Token Input - transparent to the user */}
                  <input type="hidden" {...register("token")} />

                  {/* New Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300" htmlFor="password">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        autoFocus
                        className={`w-full pl-10 pr-10 py-2.5 bg-[#101524] border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:bg-[#141B2D] focus:ring-2 focus:ring-purple-500/20 transition-all ${errors.password ? "border-rose-500/50" : "border-white/10 hover:border-white/25"
                          }`}
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.password.message}</p>}

                    {/* Dynamic Password Strength Indicator */}
                    {passwordValue && (
                      <div className="space-y-1 pt-1 animate-slide-in">
                        <div className="flex justify-between items-center text-[10px] select-none">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Strength</span>
                          <span
                            className={`font-black uppercase tracking-wider transition-colors duration-300 ${strength.score === 1
                                ? "text-rose-400"
                                : strength.score === 2
                                  ? "text-amber-400"
                                  : strength.score === 3
                                    ? "text-emerald-400"
                                    : "text-cyan-400"
                              }`}
                          >
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full bg-[#101524] border border-white/10 h-1.5 rounded-full relative overflow-hidden">
                          <div
                            className={`absolute top-0 left-0 h-full transition-all duration-350 ease-out ${strength.colorClass}`}
                            style={{ width: strength.barWidth }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`w-full pl-10 pr-10 py-2.5 bg-[#101524] border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:bg-[#141B2D] focus:ring-2 focus:ring-purple-500/20 transition-all ${errors.confirmPassword
                            ? "border-rose-500/50"
                            : confirmPasswordValue && passwordsMatch
                              ? "border-emerald-500/50"
                              : "border-white/10 hover:border-white/25"
                          }`}
                        {...register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.confirmPassword.message}</p>
                    )}
                    {confirmPasswordValue && !errors.confirmPassword && (
                      <p
                        className={`text-[10px] font-medium pl-1 flex items-center gap-1 ${passwordsMatch ? "text-emerald-400" : "text-amber-400"
                          }`}
                      >
                        {passwordsMatch ? (
                          <>
                            <Check size={11} className="stroke-[3]" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={11} />
                            <span>Passwords must match exactly</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full h-11 rounded-xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 shadow-[0_8px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_12px_32px_rgba(236,72,153,0.55)] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 overflow-hidden"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Update Password</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Footer Return Link */}
              <div className="text-center pt-5 mt-5 border-t border-white/[0.08]">
                <Link
                  href="/?login=true"
                  className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-xs text-zinc-400 text-center py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-purple-400" />
          <span>Opening security vault...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
