"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api, setAccessToken } from "@/lib/api";
import { KeyRound, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInputs) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { accessToken, firstName, role } = response.data.data;
      setAccessToken(accessToken);
      
      // Store user details for UI states (Access Token remains in-memory only)
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);

      // Redirect based on role
      if (role === "CLIENT") {
        window.location.href = "/portal";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Invalid email or password. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-screen flex items-center justify-center bg-[#09090B] text-white p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-xl p-8 z-10 space-y-6">
        
        {/* Header logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-600/20">
            E
          </div>
          <h2 className="text-xl font-bold tracking-tight">Access EventOS</h2>
          <p className="text-xs text-zinc-400">Enter your credentials to manage your event business.</p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#18181B] border rounded-lg text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
                  errors.email ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                }`}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-400 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400" htmlFor="password">Password</label>
              <a href="/forgot-password" className="text-xs text-purple-400 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-[#18181B] border rounded-lg text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
                  errors.password ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-red-400 font-medium">{errors.password.message}</p>}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>

        </form>

        {/* Footer sign up redirection */}
        <div className="text-center pt-4 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-400">
            Don't have an workspace?{" "}
            <a href="/register" className="text-purple-400 hover:underline font-semibold">
              Create one now
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}
