"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, User, Key, Eye, EyeOff, Sparkles, Check, Info, RefreshCw } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES } from "../constants";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [email, setEmail] = useState("admin@eventos.com");
  const [password, setPassword] = useState("admin123");
  const [selectedRole, setSelectedRole] = useState("super_admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // CAPTCHA State
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
    setLoading(true);

    try {
      const { apiClient } = require("@/lib/api-client");

      // 1. Submit login credentials to the real auth microservice
      const response = await apiClient.post("/auth/login", {
        email,
        password,
        captchaId: showCaptcha ? captchaId : undefined,
        captchaValue: showCaptcha ? (realRecaptchaEnabled ? captchaToken : captchaInput) : undefined,
      });

      if (response.data?.success) {
        const { accessToken, firstName, lastName, role, userId, tenantId, memberships, permissions } = response.data.data;

        // 2. Access control: Only SUPER_ADMIN users should access the platform dashboard
        if (role !== "SUPER_ADMIN") {
          addToast("Access Denied: Only platform Super Administrators can access this console.", "error");
          setLoading(false);
          return;
        }

        // 3. Save standard session flags & cookies for Edge Middleware checks
        document.cookie = "hasSession=true; path=/; SameSite=Lax";
        document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
        document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
        localStorage.setItem("user_name", firstName);
        localStorage.setItem("user_role", role);

        // 4. Save authentication credentials in Zustand store
        // Map "all" permissions or select sub-role based on user selection
        const adminPermissions = permissions && permissions.length > 0 && permissions[0] !== "all" 
          ? permissions 
          : [selectedRole];

        setAuth(
          accessToken,
          { id: userId, email, firstName, lastName, role, permissions: adminPermissions },
          tenantId,
          memberships
        );

        addToast(`🔑 Authenticated as ${firstName} successfully!`, "success");
        router.push("/superadmin");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Invalid credentials. Authentication failed.";
      const errCode = err.response?.data?.error?.code;

      if (errCode === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
        setCaptchaToken(null);
        setCaptchaInput("");
        if (showCaptcha) {
          fetchCaptchaDetails();
        }
        addToast("Security verification is required. Please solve the CAPTCHA.", "warning");
      } else {
        addToast(errMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-purple-650/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-4xl bg-zinc-950/80 border border-zinc-850/60 rounded-3xl shadow-2xl p-6 md:p-10 backdrop-blur-xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        
        {/* Left pane: Brand info and Role details */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-500/20">
              E
            </div>
            <div>
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black tracking-widest font-mono uppercase">
                Internal Console
              </span>
              <h1 className="text-2xl font-black text-white mt-1.5 leading-tight tracking-tight">EventOS SuperAdmin</h1>
              <p className="text-xs text-zinc-500 font-semibold mt-1">Authorized corporate access only. All actions are actively audited.</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Info size={11} className="text-purple-400" /> Selective RBAC Switcher
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {ADMIN_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.id);
                    if (role.id === "super_admin") {
                      setEmail("admin@eventos.com");
                      setPassword("admin123");
                    } else {
                      setEmail(`${role.id}@eventos.co`);
                      setPassword("");
                    }
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    selectedRole === role.id 
                      ? "border-purple-500 bg-purple-500/5 text-purple-300"
                      : "border-zinc-900 hover:border-zinc-800 text-zinc-500"
                  )}
                >
                  <span className="text-[10px] font-black block">{role.name}</span>
                  <span className="text-[8px] leading-snug mt-0.5 block opacity-70 truncate">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-zinc-650 font-bold font-mono">
            EventOS Inc. © 2026. Security Protocol 413-A
          </p>
        </div>

        {/* Right pane: Auth Credentials Form */}
        <div className="flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Email Address</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-3 text-zinc-550" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eventos.co"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-3 text-zinc-550" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-550 hover:text-zinc-300 transition"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl flex gap-2.5">
              <Shield size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black uppercase text-zinc-400">Security Clearance</p>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal font-semibold">
                  Logging in gives you access with <strong>{ADMIN_ROLES.find(r => r.id === selectedRole)?.name}</strong> level permissions.
                </p>
              </div>
            </div>

            {/* CAPTCHA challenges */}
            {showCaptcha && (
              <div className="space-y-2 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                    Security Verification
                  </label>
                  {!realRecaptchaEnabled && (
                    <button
                      type="button"
                      onClick={fetchCaptchaDetails}
                      className="text-[9px] text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                  )}
                </div>
                {realRecaptchaEnabled ? (
                  <div className="flex justify-center py-1">
                    <ReCAPTCHA
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "your_site_key"}
                      onChange={(token) => setCaptchaToken(token)}
                      theme="dark"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {captchaImageUrl && (
                      <img
                        src={captchaImageUrl}
                        alt="Captcha Challenge"
                        className="h-8 rounded border border-zinc-800 bg-white shrink-0"
                        onError={() => fetchCaptchaDetails()}
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Enter CAPTCHA value"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl hover:opacity-95 active:scale-[0.99] transition text-xs shadow-lg shadow-purple-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <Key size={13} /> Authenticate Session
                </>
              )}
            </button>
          </form>
        </div>

      </motion.div>
    </div>
  );
}
