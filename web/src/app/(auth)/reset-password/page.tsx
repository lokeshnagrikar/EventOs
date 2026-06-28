"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";
import { Button } from "@/components/ui/button";
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

const resetSchema = z
  .object({
    token: z.string().min(1, { message: "Security token is required." }),
    password: z.string().min(6, { message: "New password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetInputs = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

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
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
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
      await apiClient.post("/auth/reset-password", {
        token: data.token,
        password: data.password,
      });

      addToast("Password reset successfully!", "success");
      setSuccess(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Password reset failed. Invalid or expired token.";
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 animate-slide-in">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            Password Updated
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your credentials have been updated successfully. You can now log into your EventOS workspace.
          </p>
        </div>
        <Button
          onClick={() => router.push("/login")}
          className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all"
        >
          Proceed to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center select-none">
        <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
          Create New Password
        </h2>
        <p className="text-xs text-zinc-400">Enter your security token and select a new secure password.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 animate-slide-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Token input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="token">
            Security Token
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              id="token"
              type="text"
              placeholder="UUID token string"
              className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                errors.token ? "border-rose-500/50" : "border-zinc-800 focus:border-[#8B5CF6]"
              }`}
              {...register("token")}
            />
          </div>
          {errors.token && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.token.message}</p>}
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                errors.password ? "border-rose-500/50" : "border-zinc-800 focus:border-[#8B5CF6]"
              }`}
              {...register("password")}
            />
          </div>
          {errors.password && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.password.message}</p>}
        </div>

        {/* Confirm password input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                errors.confirmPassword ? "border-rose-500/50" : "border-zinc-800 focus:border-[#8B5CF6]"
              }`}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-zinc-850">
        <a
          href="/login"
          className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </a>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-400 text-center py-8">Loading reset panel...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
