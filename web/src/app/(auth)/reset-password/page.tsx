"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

const resetSchema = z.object({
  token: z.string().min(1, { message: "Security token is required." }),
  password: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetInputs = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetInputs>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setValue("token", token);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ResetInputs) => {
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: data.token,
        password: data.password,
      });

      setSuccess(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Password reset failed. Invalid or expired token.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl p-8 z-10 text-center space-y-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Password Updated</h2>
          <p className="text-sm text-zinc-400">
            Your credentials have been updated. You can now log into your workspace.
          </p>
        </div>
        <button
          onClick={() => window.location.href = "/login"}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-all"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-xl p-8 z-10 space-y-6">
      
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold tracking-tight">Create New Password</h2>
        <p className="text-xs text-zinc-400">Enter your verification token and select your new password.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Token input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="token">Security Token</label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              id="token"
              type="text"
              placeholder="UUID token string"
              className={`w-full pl-10 pr-4 py-2.5 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                errors.token ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
              }`}
              {...register("token")}
            />
          </div>
          {errors.token && <p className="text-[10px] text-red-400 font-medium">{errors.token.message}</p>}
        </div>

        {/* Password input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="password">New Password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                errors.password ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
              }`}
              {...register("password")}
            />
          </div>
          {errors.password && <p className="text-[10px] text-red-400 font-medium">{errors.password.message}</p>}
        </div>

        {/* Confirm password input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
              errors.confirmPassword ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
            }`}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <p className="text-[10px] text-red-400 font-medium">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-all"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-screen flex items-center justify-center bg-[#09090B] text-white p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />
      <Suspense fallback={<div className="text-zinc-400">Loading reset panel...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
