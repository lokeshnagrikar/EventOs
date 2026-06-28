"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, ArrowLeft, CheckCircle2, Copy, Check, Loader2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotInputs = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInputs>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotInputs) => {
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email: data.email,
      });

      const token = response.data.debugResetToken || "TOKEN_GENERATED";
      setResetToken(token);
      addToast("Reset token issued successfully!", "success");
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Email address not found.";
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      setCopied(true);
      addToast("Security token copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (resetToken) {
    return (
      <div className="space-y-6 animate-slide-in text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            Recovery Token Issued
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            For development convenience and verification, we have generated your security reset token below:
          </p>
        </div>

        <div className="relative group p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
          <code className="text-xs font-mono text-purple-400 select-all font-bold overflow-x-auto block text-left w-full pr-8 py-1">
            {resetToken}
          </code>
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 text-zinc-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <Button
          onClick={() => router.push(`/reset-password?token=${resetToken}`)}
          className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all"
        >
          Proceed to Reset Password
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center select-none">
        <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
          Recover Password
        </h2>
        <p className="text-xs text-zinc-400">Enter your email and we'll supply a security verification token.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 animate-slide-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                errors.email ? "border-rose-500/50" : "border-zinc-800 focus:border-[#8B5CF6]"
              }`}
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating Token...</span>
            </>
          ) : (
            "Get Reset Token"
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
