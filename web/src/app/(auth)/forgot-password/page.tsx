"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotInputs = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInputs>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotInputs) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", {
        email: data.email,
      });

      // Capturing debugResetToken (provided in MVP for verification convenience)
      setResetToken(response.data.debugResetToken || "TOKEN_GENERATED");
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Email address not found.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (resetToken) {
    return (
      <main className="min-h-screen w-screen flex items-center justify-center bg-[#09090B] text-white p-4">
        <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl p-8 z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Recovery Token Issued</h2>
            <p className="text-xs text-zinc-400">
              For this MVP demonstration, we have generated your security reset token below:
            </p>
          </div>

          <div className="p-4 bg-[#18181B] border border-zinc-850 rounded-lg text-center">
            <code className="text-sm font-mono text-purple-400 select-all font-bold">
              {resetToken}
            </code>
          </div>

          <button
            onClick={() => window.location.href = `/reset-password?token=${resetToken}`}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-all"
          >
            Proceed to Reset Password
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen flex items-center justify-center bg-[#09090B] text-white p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-xl p-8 z-10 space-y-6">
        
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold tracking-tight">Recover Password</h2>
          <p className="text-xs text-zinc-400">Enter your email and we'll supply a verification reset token.</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                  errors.email ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                }`}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-400 font-medium">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-all"
          >
            {loading ? "Generating Token..." : "Get Reset Token"}
          </button>

        </form>

        <div className="text-center pt-4 border-t border-zinc-800/60">
          <a href="/login" className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-all">
            <ArrowLeft size={14} />
            Back to Sign In
          </a>
        </div>

      </div>
    </main>
  );
}
