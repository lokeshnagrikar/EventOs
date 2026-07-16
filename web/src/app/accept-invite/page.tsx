"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Lock, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength check
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isStrong = hasMinLength && hasUppercase && hasNumber;

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invitation link. Please request a new invitation.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isStrong) {
      setError("Password must be at least 8 characters with an uppercase letter and a number.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/accept-invite", { token, password });
      setSuccess(true);
      setTimeout(() => {
        router.replace("/?login=true");
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        "Invalid or expired invitation link. Please ask your admin to resend the invite."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Invalid Invitation Link</h1>
          <p className="text-zinc-400 text-sm mb-6">
            This invitation link is missing a token. Please use the link from your invitation email.
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-black text-white mb-2">Account Activated! 🎉</h1>
          <p className="text-zinc-400 text-sm mb-2">
            Your password has been set and your account is now active.
          </p>
          <p className="text-zinc-500 text-xs">Redirecting you to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 py-8"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-black text-white mb-1">
            Event<span className="text-purple-400">OS</span>
          </div>
          <p className="text-zinc-500 text-xs">The Operating System for Event Businesses</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">Accept Invitation</h1>
              <p className="text-zinc-400 text-xs">Set your password to activate your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">
                New Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500 text-sm transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Strength Indicators */}
              {password.length > 0 && (
                <>
                  <div className="flex gap-1.5 pt-1">
                    <div className={`flex-1 h-1 rounded-full transition-colors ${hasMinLength ? "bg-emerald-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${hasUppercase ? "bg-emerald-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${hasNumber ? "bg-emerald-500" : "bg-zinc-800"}`} />
                  </div>
                  <p className="text-[10px] text-zinc-500 space-x-2">
                    <span className={hasMinLength ? "text-emerald-400" : ""}>✓ 8+ chars</span>
                    <span className={hasUppercase ? "text-emerald-400" : ""}>✓ Uppercase</span>
                    <span className={hasNumber ? "text-emerald-400" : ""}>✓ Number</span>
                  </p>
                </>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-zinc-900 border text-white rounded-xl outline-none focus:border-purple-500 text-sm transition-colors ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-emerald-500/50"
                        : "border-red-500/50"
                      : "border-zinc-800"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-[10px] ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                  {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isStrong || !passwordsMatch}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Activating Account...
                </>
              ) : (
                "Activate My Account →"
              )}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-[10px] mt-5">
            Already have access?{" "}
            <Link href="/?login=true" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        <p className="text-center text-zinc-700 text-[9px] mt-5">
          © EventOS · This invitation link expires in 48 hours
        </p>
      </motion.div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 size={24} className="animate-spin text-purple-400" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
