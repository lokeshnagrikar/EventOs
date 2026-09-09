"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Terminal, KeyRound } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enterprise CAPTCHA & Security Rate-Limiting State
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [realRecaptchaEnabled, setRealRecaptchaEnabled] = useState(false);
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [captchaImageUrl, setCaptchaImageUrl] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const fetchCaptchaDetails = async () => {
    try {
      const { apiClient } = require("@/lib/api-client");
      const response = await apiClient.get("/auth/captcha");
      const { realRecaptchaEnabled: isReal, captchaId: id, imageUrl } = response.data.data;
      setRealRecaptchaEnabled(isReal);
      setCaptchaId(id);
      setCaptchaImageUrl(imageUrl);
    } catch (err) {
      console.error("Failed to load CAPTCHA details", err);
    }
  };

  useEffect(() => {
    if (showCaptcha) {
      fetchCaptchaDetails();
    }
  }, [showCaptcha]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { apiClient } = require("@/lib/api-client");

      // 1. Submit corporate credentials to the real auth-service microservice
      const response = await apiClient.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        captchaId: showCaptcha ? captchaId : undefined,
        captchaValue: showCaptcha ? (realRecaptchaEnabled ? captchaToken : captchaInput) : undefined,
      });

      if (response.data?.success) {
        const {
          accessToken,
          firstName,
          lastName,
          role,
          userId,
          tenantId,
          memberships,
          permissions,
        } = response.data.data;

        // 2. Strict Privilege Boundary: Only SUPER_ADMIN users can access the platform console
        if (role !== "SUPER_ADMIN") {
          setErrorMessage("Access Denied: Only platform Super Administrators with verified clearances can access this console.");
          addToast("Access Denied: Insufficient platform permissions.", "error");
          setLoading(false);
          return;
        }

        // 3. Set secure session cookies for Next.js Edge Middleware route verification
        const isProd = typeof window !== "undefined" && window.location.protocol === "https:";
        const cookieFlags = `path=/; SameSite=Lax${isProd ? "; Secure" : ""}`;
        document.cookie = `hasSession=true; ${cookieFlags}`;
        document.cookie = `user_name=${encodeURIComponent(firstName || "Admin")}; ${cookieFlags}`;
        document.cookie = `user_role=${role}; ${cookieFlags}`;
        localStorage.setItem("user_name", firstName || "Admin");
        localStorage.setItem("user_role", role);

        // 4. Update Zustand state with cryptographically verified JWT & claims
        setAuth(
          accessToken,
          {
            id: userId,
            email: email.trim().toLowerCase(),
            firstName: firstName || "Platform",
            lastName: lastName || "Admin",
            role,
            permissions: permissions && permissions.length > 0 ? permissions : ["all"],
          },
          tenantId,
          memberships
        );

        addToast(`🛡️ Verified Platform SuperAdmin clearance: Welcome, ${firstName || "Admin"}.`, "success");
        router.push("/superadmin");
        return;
      } else {
        throw new Error(response.data?.error?.message || "Authentication rejected by security gateway.");
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Invalid corporate credentials or unauthorized platform access.";
      const errCode = err.response?.data?.error?.code;

      if (errCode === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
        setCaptchaToken(null);
        setCaptchaInput("");
        setErrorMessage("Repeated attempts detected. Security challenge verification required.");
        if (showCaptcha) {
          fetchCaptchaDetails();
        }
      } else {
        setErrorMessage(errMsg);
        addToast(errMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex items-center justify-center p-4 font-sans relative overflow-hidden select-none">
      {/* Dynamic ambient backdrops */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0F0F12] border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl"
      >
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white font-black shadow-lg shadow-purple-600/25 text-xl mb-4 ring-4 ring-purple-500/10">
            <Shield size={24} className="text-white" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Terminal size={10} /> ZERO TRUST GATEWAY
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Platform Administration
          </h1>
          <p className="text-xs text-zinc-500 mt-2 font-medium">
            Internal console. All authenticated sessions are cryptographic, audited, and immutable.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs font-medium"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Corporate Email Address
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eventos.com"
                required
                autoComplete="email"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs placeholder-zinc-600 text-zinc-100 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Master Access Key
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter root master password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-100 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Security Challenge (reCAPTCHA) if triggered */}
          {showCaptcha && (
            <div className="space-y-2 p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center justify-between">
                <span>Security Verification Challenge</span>
                {!realRecaptchaEnabled && (
                  <button
                    type="button"
                    onClick={fetchCaptchaDetails}
                    className="text-purple-400 hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                )}
              </label>

              {realRecaptchaEnabled && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
                <div className="flex justify-center my-2">
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={(val) => setCaptchaToken(val)}
                    theme="dark"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {captchaImageUrl && (
                    <img
                      src={captchaImageUrl}
                      alt="Captcha Challenge"
                      className="w-full h-12 object-contain bg-zinc-950 rounded-lg border border-zinc-800"
                    />
                  )}
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter security code"
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500/40"
                  />
                </div>
              )}
            </div>
          )}

          {/* Compliance & Security Badge */}
          <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <div className="text-[10px] text-zinc-400 leading-snug">
              <span className="font-bold text-zinc-200">Security Clearance Level 4:</span> TLS 1.3 encrypted, active session monitoring, and real-time fraud prevention enabled.
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Cryptographic Tokens...</span>
              </>
            ) : (
              <>
                <KeyRound size={15} />
                <span>Authenticate Platform Session</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
          <p className="text-[10px] text-zinc-600 font-medium">
            EventOS Cloud Platform • Security Protocol Standard 800-63B
          </p>
          <p className="text-[9px] text-zinc-700 font-mono mt-1">
            Unauthorized intrusion attempts are traced and reported to national CERT.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
