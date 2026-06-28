"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { KeyRound, Mail, AlertCircle, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuthModalStore } from "@/store/authModalStore";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().optional(),
});

type LoginInputs = z.infer<typeof loginSchema>;

interface LoginFormProps {
  isModal?: boolean;
  onSwitchMode?: (mode: "login" | "register") => void;
}

export function LoginForm({ isModal = false, onSwitchMode }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);
  const setAuth = useAuthStore((state) => state.setAuth);
  const closeModal = useAuthModalStore((state) => state.closeModal);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // CAPTCHA State
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [realRecaptchaEnabled, setRealRecaptchaEnabled] = useState(false);
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [captchaImageUrl, setCaptchaImageUrl] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const fetchCaptchaDetails = async () => {
    try {
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMeValue = watch("rememberMe");

  // Handle session expiration warning
  useEffect(() => {
    if (!isModal && searchParams && searchParams.get("expired") === "true") {
      setError("Your session has expired. Please sign in again.");
      addToast("Session expired. Please sign in again.", "info");
    }
  }, [searchParams, addToast, isModal]);

  const onSubmit = async (data: LoginInputs) => {
    setError(null);
    setLoading(true);

    if (showCaptcha) {
      const val = realRecaptchaEnabled ? captchaToken : captchaInput;
      if (!val || val.trim() === "") {
        const errorMsg = realRecaptchaEnabled ? "Please complete the reCAPTCHA challenge." : "Please enter the CAPTCHA value.";
        setError(errorMsg);
        addToast(errorMsg, "error");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await apiClient.post("/auth/login", {
        email: data.email,
        password: data.password,
        captchaId: captchaId,
        captchaValue: realRecaptchaEnabled ? captchaToken : captchaInput,
      });

      const { accessToken, firstName, role, userId, tenantId, memberships } = response.data.data;
      
      // Store lightweight session flag cookie for edge middleware redirection checks
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      
      // Save state in Zustand store
      setAuth(
        accessToken,
        { id: userId, email: data.email, firstName, role },
        tenantId,
        memberships
      );

      addToast("Successfully authenticated!", "success");

      if (isModal) {
        closeModal();
      }

      // Redirect based on role
      if (role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/workspace-select");
      }
    } catch (err: any) {
      const errCode = err.response?.data?.error?.code;
      const errMsg = err.response?.data?.error?.message || "Invalid email or password. Please try again.";
      if (errCode === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
        setCaptchaToken(null);
        setCaptchaInput("");
        if (showCaptcha) {
          fetchCaptchaDetails();
        }
      }
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header logo */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-purple-500/25 select-none transform hover:rotate-6 transition-transform">
          E
        </div>
        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
          Welcome back
        </h2>
        <p className="text-xs text-zinc-400">Enter your credentials to access your EventOS workspace.</p>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 animate-slide-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form elements */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <Mail className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-250 ${
              focusedField === "email" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
            }`} />
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
                errors.email 
                  ? "border-rose-500/50" 
                  : focusedField === "email"
                  ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              }`}
              {...register("email")}
              onFocus={() => setFocusedField("email")}
              onBlur={(e) => {
                register("email").onBlur(e);
                setFocusedField(null);
              }}
            />
          </div>
          {errors.email && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.email.message}</p>}
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-zinc-400" htmlFor="password">
              Password
            </label>
            <a href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <KeyRound className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-250 ${
              focusedField === "password" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
            }`} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border rounded-xl text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
                errors.password 
                  ? "border-rose-500/50" 
                  : focusedField === "password"
                  ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              }`}
              {...register("password")}
              onFocus={() => setFocusedField("password")}
              onBlur={(e) => {
                register("password").onBlur(e);
                setFocusedField(null);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.password.message}</p>}
        </div>

        {/* Remember me option */}
        <div className="flex items-center space-x-2 py-1 select-none">
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMeValue}
            onClick={() => setValue("rememberMe", !rememberMeValue)}
            className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
              rememberMeValue
                ? "bg-purple-650 border-purple-500 text-white"
                : "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] text-transparent"
            }`}
          >
            {rememberMeValue && <Check size={12} className="stroke-[3]" />}
          </button>
          <span className="text-xs text-zinc-400 font-medium cursor-pointer" onClick={() => setValue("rememberMe", !rememberMeValue)}>
            Remember me
          </span>
        </div>

        {/* CAPTCHA challenges */}
        {showCaptcha && (
          <div className="space-y-3 p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl animate-slide-in">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">
                Security Verification
              </label>
              {!realRecaptchaEnabled && (
                <button
                  type="button"
                  onClick={fetchCaptchaDetails}
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Refresh Captcha
                </button>
              )}
            </div>
            {realRecaptchaEnabled ? (
              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "your_site_key"}
                  onChange={(token) => setCaptchaToken(token)}
                  theme="dark"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {captchaImageUrl && (
                    <img
                      src={captchaImageUrl}
                      alt="Captcha Challenge"
                      className="h-10 rounded border border-zinc-800 bg-white"
                      onError={() => fetchCaptchaDetails()}
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Enter CAPTCHA value"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    onFocus={() => setFocusedField("captcha")}
                    onBlur={() => setFocusedField(null)}
                    className={`flex-grow px-3 py-2 bg-white/[0.03] border rounded-xl text-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
                      focusedField === "captcha"
                        ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Social login separator */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-zinc-850"></div>
        <span className="flex-shrink mx-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Or continue with</span>
        <div className="flex-grow border-t border-zinc-850"></div>
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs font-semibold text-zinc-300 transition-all active:scale-[0.98]"
        >
          {/* Google Icon SVG */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs font-semibold text-zinc-300 transition-all active:scale-[0.98]"
        >
          {/* Microsoft Icon SVG */}
          <svg className="h-4 w-4" viewBox="0 0 23 23">
            <path fill="#f35325" d="M0 0h11v11H0z" />
            <path fill="#81bc06" d="M12 0h11v11H12z" />
            <path fill="#05a6f0" d="M0 12h11v11H0z" />
            <path fill="#ffba08" d="M12 12h11v11H12z" />
          </svg>
          <span>Microsoft</span>
        </button>
      </div>

      {/* Footer sign up redirection */}
      <div className="text-center pt-4 border-t border-zinc-850">
        <p className="text-xs text-zinc-400">
          Don't have an account?{" "}
          {isModal ? (
            <button
              type="button"
              onClick={() => onSwitchMode?.("register")}
              className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors focus:outline-none"
            >
              Create a workspace
            </button>
          ) : (
            <a href="/register" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors">
              Create a workspace
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
