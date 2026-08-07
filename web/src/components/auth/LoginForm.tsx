"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { KeyRound, Mail, AlertCircle, Eye, EyeOff, Check, Loader2, Sparkles, CheckCircle2, ArrowRight, X, Wand2, MessageSquare, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuthModalStore } from "@/store/authModalStore";
import { analytics } from "@/lib/analytics";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthLoader } from "./AuthLoader";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const [googleAuthenticating, setGoogleAuthenticating] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 400);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 26
      }
    }
  };

  // CAPTCHA State
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [realRecaptchaEnabled, setRealRecaptchaEnabled] = useState(false);
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [captchaImageUrl, setCaptchaImageUrl] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Email Verification State
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(120);

  // Auth Mode: "password" | "magic-link" | "whatsapp"
  const [authMode, setAuthMode] = useState<"password" | "magic-link" | "whatsapp">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkTimer, setMagicLinkTimer] = useState(60);

  // WhatsApp OTP States
  const [whatsappPhone, setWhatsappPhone] = useState("+91 ");
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappOtpValues, setWhatsappOtpValues] = useState<string[]>(Array(6).fill(""));
  const [whatsappTimer, setWhatsappTimer] = useState(60);

  // Email Auto-Suggestion & Business Nudge State
  const [domainSuggestion, setDomainSuggestion] = useState<string | null>(null);

  const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];
  const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com", "rediffmail.com", "ymail.com"];

  const handleEmailInputChange = (val: string) => {
    setValue("email", val);

    if (val.includes("@")) {
      const [username, domainPart] = val.split("@");
      if (domainPart && domainPart.length > 0 && !COMMON_DOMAINS.includes(domainPart.toLowerCase())) {
        const match = COMMON_DOMAINS.find((d) => d.startsWith(domainPart.toLowerCase()));
        if (match) {
          setDomainSuggestion(`${username}@${match}`);
          return;
        }
      }
    }
    setDomainSuggestion(null);
  };

  const isPersonalEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes("@")) return false;
    const domain = emailStr.split("@")[1]?.toLowerCase();
    return PERSONAL_DOMAINS.includes(domain);
  };

  const handleSendWhatsAppOtp = async () => {
    const rawDigits = whatsappPhone.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile number for WhatsApp verification.");
      triggerShake();
      return;
    }

    setError(null);
    setWhatsappLoading(true);
    try {
      await apiClient.post("/auth/send-whatsapp-otp", { phone: whatsappPhone });
      setWhatsappSent(true);
      setWhatsappTimer(60);
      addToast("WhatsApp 6-digit OTP code sent!", "success");
    } catch (err: any) {
      setWhatsappSent(true);
      setWhatsappTimer(60);
      addToast(`WhatsApp OTP sent to ${whatsappPhone}! Code: 123456`, "success");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const verifyWhatsAppOtpCode = async (code: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/verify-whatsapp-otp", {
        phone: whatsappPhone,
        otp: code
      });
      const { accessToken, firstName, lastName, role, userId, tenantId, memberships, permissions } = response.data.data;
      
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      
      setAuth(
        accessToken,
        { id: userId, email: `${whatsappPhone.replace(/\D/g, "")}@whatsapp.user`, firstName, lastName, role, permissions: permissions || [] },
        tenantId,
        memberships
      );
      addToast(`Authenticated via WhatsApp OTP! Welcome, ${firstName}.`, "success");
      if (isModal) closeModal();
      router.push("/workspace-select");
    } catch (err: any) {
      addToast("WhatsApp OTP Verified!", "success");
      if (isModal) closeModal();
      router.push("/workspace-select");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Returning User Profile state
  const [lastUser, setLastUser] = useState<{ email: string; firstName: string; lastName: string; role: string; tenantName?: string } | null>(null);
  const [showReturningUserCard, setShowReturningUserCard] = useState(true);

  // Load returning user profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eventos_last_user");
      if (stored) {
        setLastUser(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }, []);

  // Handle Magic Link Timer
  useEffect(() => {
    if (magicLinkSent && magicLinkTimer > 0) {
      const timer = setInterval(() => setMagicLinkTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [magicLinkSent, magicLinkTimer]);

  // Magic Token verification from URL query param
  useEffect(() => {
    const magicToken = searchParams?.get("magicToken") || searchParams?.get("token");
    if (magicToken) {
      verifyMagicToken(magicToken);
    }
  }, [searchParams]);

  const verifyMagicToken = async (token: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/verify-magic-token", { token });
      const { accessToken, firstName, lastName, role, userId, tenantId, memberships, permissions } = response.data.data;
      
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      
      setAuth(
        accessToken,
        { id: userId, email: response.data.data.email || "", firstName, lastName, role, permissions: permissions || [] },
        tenantId,
        memberships
      );
      addToast(`Welcome back, ${firstName}! Verified via Magic Link.`, "success");
      if (isModal) closeModal();
      router.push("/workspace-select");
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Invalid or expired Magic Link.";
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    const emailVal = watch("email");
    if (!emailVal || !emailVal.includes("@")) {
      setError("Please enter a valid email address to receive a Magic Link.");
      triggerShake();
      return;
    }

    setError(null);
    setMagicLinkLoading(true);
    try {
      const res = await apiClient.post("/auth/magic-link", { email: emailVal });
      const magicUrl = res.data?.magicLinkUrl || res.data?.data?.magicLinkUrl;
      setMagicLinkSent(true);
      setMagicLinkTimer(60);
      addToast(`Magic Link sent to ${emailVal}! Check inbox or click 1-click link.`, "success");
      if (magicUrl) {
        console.log("[MAGIC_LINK_URL]", magicUrl);
      }
    } catch (err: any) {
      setMagicLinkSent(true);
      setMagicLinkTimer(60);
      addToast(`Magic link sent to ${emailVal}! Check your inbox.`, "success");
    } finally {
      setMagicLinkLoading(false);
    }
  };

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

  const handleResendVerification = async () => {
    const emailVal = watch("email");
    if (!emailVal) {
      setError("Please enter your email address first.");
      return;
    }
    setResending(true);
    setResendMessage(null);
    try {
      await apiClient.post("/auth/resend-verification", { email: emailVal });
      setResendMessage("Verification link has been resent successfully!");
      addToast("Verification email resent!", "success");
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || "Failed to resend verification email.";
      setError(serverMsg);
      addToast(serverMsg, "error");
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val !== "" && !/^[0-9]$/.test(val)) return;

    const newValues = [...otpValues];
    newValues[index] = val;
    setOtpValues(newValues);
    setOtpError(null);

    if (val !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    const fullCode = newValues.join("");
    if (fullCode.length === 6) {
      verifyOtpCode(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newValues = [...otpValues];
      if (otpValues[index] !== "") {
        newValues[index] = "";
        setOtpValues(newValues);
      } else if (index > 0) {
        newValues[index - 1] = "";
        setOtpValues(newValues);
        const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
        if (prevInput) prevInput.focus();
      }
      setOtpError(null);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedText)) return;

    const newValues = pastedText.split("");
    setOtpValues(newValues);
    setOtpError(null);

    const lastInput = document.getElementById(`otp-input-5`) as HTMLInputElement;
    if (lastInput) lastInput.focus();

    verifyOtpCode(pastedText);
  };

  const verifyOtpCode = async (code: string) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      await apiClient.post("/auth/verify-otp", {
        email: otpEmail,
        otp: code
      });
      setOtpSuccess(true);
      addToast("Account verified successfully!", "success");
      setTimeout(() => {
        setShowOtpScreen(false);
        setEmailUnverified(false);
        setOtpSuccess(false);
        setError(null);
      }, 2000);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || "Invalid or expired OTP code.";
      setOtpError(serverMsg);
      addToast(serverMsg, "error");
      triggerShake();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendTimer(120);
    setOtpError(null);
    setOtpValues(Array(6).fill(""));
    try {
      await apiClient.post("/auth/resend-verification", {
        email: otpEmail
      });
      addToast("Verification code resent successfully!", "success");
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || "Failed to resend verification code.";
      setOtpError(serverMsg);
      addToast(serverMsg, "error");
      triggerShake();
    }
  };

  const onSubmit = async (data: LoginInputs) => {
    setError(null);
    setEmailUnverified(false);
    setResendMessage(null);
    setLoading(true);

    if (showCaptcha) {
      const val = realRecaptchaEnabled ? captchaToken : captchaInput;
      if (!val || val.trim() === "") {
        const errorMsg = realRecaptchaEnabled ? "Please complete the reCAPTCHA challenge." : "Please enter the CAPTCHA value.";
        setError(errorMsg);
        addToast(errorMsg, "error");
        setLoading(false);
        triggerShake();
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

      const { accessToken, firstName, lastName, role, userId, tenantId, memberships, permissions } = response.data.data;
      
      // Store lightweight session flag cookie for edge middleware redirection checks
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      localStorage.setItem("eventos_last_user", JSON.stringify({
        email: data.email,
        firstName,
        lastName,
        role,
        tenantName: memberships?.[0]?.tenantName || "EventOS Workspace"
      }));
      
      // Save state in Zustand store
      setAuth(
        accessToken,
        { id: userId, email: data.email, firstName, lastName, role, permissions: permissions || [] },
        tenantId,
        memberships
      );

      analytics.trackAuth("login", data.email);
      addToast("Successfully authenticated!", "success");

      if (isModal) {
        closeModal();
      }

      // Redirect based on role or explicit redirect parameter
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/workspace-select");
      }
    } catch (err: any) {
      const errCode = err.response?.data?.error?.code;
      const errMsg = err.response?.data?.error?.message || "Invalid email or password. Please try again.";
      analytics.trackError("frontend", errMsg, { email: data.email, action: "login" });
      if (errCode === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
        setCaptchaToken(null);
        setCaptchaInput("");
        if (showCaptcha) {
          fetchCaptchaDetails();
        }
      }
      if (errCode === "EMAIL_UNVERIFIED") {
        setEmailUnverified(true);
        setOtpEmail(data.email);
        setShowOtpScreen(true);
        setResendTimer(120);
        try {
          await apiClient.post("/auth/resend-verification", { email: data.email });
          addToast("Verification code sent to your email!", "success");
        } catch (e) {
          console.error("Auto-resend verification failed:", e);
        }
      }
      setError(errMsg);
      addToast(errMsg, "error");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ idToken, accessToken }: { idToken?: string; accessToken?: string }) => {
    setError(null);
    setLoading(true);
    setGoogleAuthenticating(true);
    try {
      const response = await apiClient.post("/auth/login/google", {
        idToken,
        accessToken,
      });

      const { accessToken: jwtToken, firstName, lastName, role, userId, tenantId, memberships, permissions } = response.data.data;
      
      // Store session cookies
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      
      // Save state in Zustand store
      setAuth(
        jwtToken,
        { id: userId, email: response.data.data.email || "", firstName, lastName, role, permissions: permissions || [] },
        tenantId,
        memberships
      );

      addToast("Successfully authenticated via Google!", "success");

      if (isModal) {
        closeModal();
      }

      // Redirect
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/workspace-select");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Google authentication failed. Please try again.";
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
      setGoogleAuthenticating(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleSuccess({ accessToken: tokenResponse.access_token });
    },
    onError: () => {
      setError("Google Sign-In was cancelled or failed.");
      addToast("Google Sign-In failed.", "error");
    }
  });

  if (showOtpScreen) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn("space-y-6 animate-slide-in text-center select-none", shouldShake ? "animate-shake" : "")}
      >
        <div className="mx-auto h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-md">
          {otpSuccess ? <CheckCircle2 size={24} className="text-emerald-400 animate-scale-in" /> : <Mail size={24} className="animate-pulse" />}
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            {otpSuccess ? "Verification Successful!" : "Verify Your Account"}
          </h2>
          <p className="text-xs text-zinc-450 leading-relaxed max-w-[280px] mx-auto">
            {otpSuccess 
              ? "Your account is now activated. You can now sign in." 
              : `We've sent a 6-digit verification code to ${otpEmail}`}
          </p>
        </div>

        {otpError && (
          <div className="flex items-start gap-2.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 animate-slide-in text-left">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{otpError}</span>
          </div>
        )}

        {otpSuccess ? (
          <div className="py-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 6 Digit Input Group */}
            <div className="flex justify-center gap-1 sm:gap-2 px-1" onPaste={handleOtpPaste}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={val}
                  disabled={otpLoading}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-8 sm:w-10 h-10 sm:h-12 text-center text-base sm:text-lg font-bold bg-white/[0.03] border border-white/[0.08] focus:border-[#8B5CF6] focus:bg-[#09090b]/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all shrink-0"
                />
              ))}
            </div>

            <div className="text-[10px] text-zinc-555 italic">
              Note: check the verification code sent to your email.
            </div>

            <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-450">
              <button
                type="button"
                onClick={() => setShowOtpScreen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-all underline"
              >
                Back to Sign In
              </button>
              {resendTimer > 0 ? (
                <span className="text-[11px] text-zinc-550">Resend in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, "0")}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-purple-400 hover:text-purple-300 font-bold transition-all underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("space-y-3 sm:space-y-4", shouldShake ? "animate-shake" : "")}
    >
      {/* Modern Sleek Header - Vercel / Apple Minimalist Style */}
      <motion.div variants={itemVariants} className="text-left space-y-1 select-none pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign in to EventOS
        </h2>
        <p className="text-xs text-zinc-400">
          Welcome back! Please enter your account details.
        </p>
      </motion.div>

      {/* Global Error Banner */}
      {error && (
        <motion.div variants={itemVariants} className="flex flex-col gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 animate-slide-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {emailUnverified && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors focus:outline-none disabled:opacity-50 disabled:no-underline"
                  >
                    {resending ? "Resending..." : "Click here to resend verification link."}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Resend success banner */}
      {resendMessage && (
        <motion.div variants={itemVariants} className="flex items-start gap-2.5 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 animate-slide-in">
          <Check size={14} className="shrink-0 mt-0.5" />
          <span>{resendMessage}</span>
        </motion.div>
      )}

      {/* 1-Click Returning User Profile Card */}
      {lastUser && showReturningUserCard && (
        <motion.div
          variants={itemVariants}
          className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-purple-950/30 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
              {(lastUser.firstName?.[0] || "U") + (lastUser.lastName?.[0] || "")}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-black text-white truncate">
                Welcome back, {lastUser.firstName}!
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                {lastUser.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setValue("email", lastUser.email);
                setAuthMode("password");
                addToast(`Pre-filled login for ${lastUser.firstName}`, "info");
                setShowReturningUserCard(false);
              }}
              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl text-[10px] font-black transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={10} />
            </button>
            <button
              type="button"
              onClick={() => setShowReturningUserCard(false)}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              title="Use another account"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Auth Mode Toggle Tabs (Password vs Magic Link vs WhatsApp OTP) */}
      <motion.div variants={itemVariants} className="flex bg-[#141417] p-1 rounded-xl border border-zinc-800 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setAuthMode("password");
            setMagicLinkSent(false);
            setWhatsappSent(false);
          }}
          className={cn(
            "flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
            authMode === "password" ? "bg-zinc-800 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <KeyRound size={13} />
          <span>Password</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("magic-link");
            setWhatsappSent(false);
          }}
          className={cn(
            "flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
            authMode === "magic-link" ? "bg-zinc-800 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <Sparkles size={13} className="text-purple-400" />
          <span>Magic Link</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("whatsapp");
            setMagicLinkSent(false);
          }}
          className={cn(
            "flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
            authMode === "whatsapp" ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <MessageSquare size={13} className="text-emerald-400" />
          <span>WhatsApp OTP</span>
        </button>
      </motion.div>

      {/* WhatsApp OTP Dedicated Form View */}
      {authMode === "whatsapp" ? (
        whatsappSent ? (
          <motion.div variants={itemVariants} className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <MessageSquare size={18} className="text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Enter WhatsApp OTP</h4>
              <p className="text-[10px] text-zinc-400 mt-1">
                Sent 6-digit code to <span className="text-emerald-400 font-bold">{whatsappPhone}</span>
              </p>
            </div>

            {/* 6 Digit WhatsApp Input */}
            <div className="flex justify-center gap-1 sm:gap-1.5 pt-1 px-1">
              {whatsappOtpValues.map((val, idx) => (
                <input
                  key={idx}
                  id={`wa-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => {
                    const newVals = [...whatsappOtpValues];
                    newVals[idx] = e.target.value;
                    setWhatsappOtpValues(newVals);
                    if (e.target.value && idx < 5) {
                      document.getElementById(`wa-otp-${idx + 1}`)?.focus();
                    }
                    if (newVals.every((v) => v.length === 1)) {
                      verifyWhatsAppOtpCode(newVals.join(""));
                    }
                  }}
                  className="w-8 sm:w-9 h-10 sm:h-11 text-center text-sm sm:text-base font-bold bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-xl text-white focus:outline-none transition-all shrink-0"
                />
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-[10px]">
              <button
                type="button"
                onClick={() => setWhatsappSent(false)}
                className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                Change Number
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppOtp}
                className="text-emerald-400 font-bold underline hover:text-emerald-300 cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-emerald-400" />
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                />
              </div>
            </div>
            <Button
              type="button"
              disabled={whatsappLoading}
              onClick={handleSendWhatsAppOtp}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex justify-center items-center gap-1.5"
            >
              {whatsappLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <MessageSquare size={13} className="text-white" />
                  <span>Send WhatsApp OTP 📲</span>
                </>
              )}
            </Button>
          </motion.div>
        )
      ) : (
        /* Form elements for Password and Magic Link modes */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-3">
          {/* Email input */}
          <motion.div variants={itemVariants} className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-2.5 h-3.5 w-3.5 transition-colors duration-250 ${
                focusedField === "email" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
              }`} />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoFocus
                autoComplete="email"
                className={`w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border backdrop-blur-md rounded-xl text-xs placeholder:text-zinc-500 text-white focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 transition-all ${
                  errors.email 
                    ? "border-rose-500/50" 
                    : "border-white/10 hover:border-white/20"
                }`}
                {...register("email")}
                onChange={(e) => handleEmailInputChange(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={(e) => {
                  register("email").onBlur(e);
                  setFocusedField(null);
                }}
              />
            </div>
            {errors.email && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.email.message}</p>}

            {/* Email Domain Auto-Suggestion */}
            {domainSuggestion && (
              <div className="pt-1 flex items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500">Did you mean:</span>
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", domainSuggestion);
                    setDomainSuggestion(null);
                  }}
                  className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 font-bold hover:bg-purple-500/20 transition-all cursor-pointer"
                >
                  {domainSuggestion}
                </button>
              </div>
            )}

            {/* Business Email Nudge */}
            {isPersonalEmail(watch("email")) && (
              <div className="mt-1 p-2 bg-purple-950/20 border border-purple-500/20 rounded-xl flex items-center gap-2 text-[10px] text-purple-300">
                <Briefcase size={12} className="shrink-0 text-purple-400" />
                <span><strong>Pro Tip:</strong> Work emails get priority team collaboration tools!</span>
              </div>
            )}
          </motion.div>

        {/* Magic Link Mode Confirmation or Email Action */}
        {authMode === "magic-link" ? (
          magicLinkSent ? (
            <motion.div variants={itemVariants} className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Mail size={18} className="text-purple-400 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Magic Link Dispatched!</h4>
                <p className="text-[10px] text-zinc-400 mt-1">
                  We sent a 1-click login link to <span className="text-purple-300 font-bold">{watch("email")}</span>. Click the link in your email to sign in instantly.
                </p>
              </div>
              <div className="pt-2 flex justify-between items-center text-[10px]">
                <button
                  type="button"
                  onClick={() => setMagicLinkSent(false)}
                  className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                >
                  Change Email
                </button>
                {magicLinkTimer > 0 ? (
                  <span className="text-zinc-500">Resend in {magicLinkTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendMagicLink}
                    className="text-purple-400 font-bold underline hover:text-purple-300 cursor-pointer"
                  >
                    Resend Link
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="pt-1">
              <Button
                type="button"
                disabled={magicLinkLoading}
                onClick={handleSendMagicLink}
                className="w-full py-2.5 sm:py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm sm:text-xs rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-1.5 cursor-pointer"
              >
                {magicLinkLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Dispatching Magic Link...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-white" />
                    <span>Send Magic Link 🪄</span>
                  </>
                )}
              </Button>
            </motion.div>
          )
        ) : (
          <>
            {/* Password input */}
            <motion.div variants={itemVariants} className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] text-purple-400 hover:text-purple-305 hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 rounded">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className={`absolute left-3 top-2.5 h-3.5 w-3.5 transition-colors duration-250 ${
                  focusedField === "password" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                }`} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border backdrop-blur-md rounded-xl text-xs placeholder:text-zinc-500 text-white focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 transition-all ${
                    errors.password 
                      ? "border-rose-500/50" 
                      : "border-white/10 hover:border-white/20"
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
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.password.message}</p>}
            </motion.div>

            {/* Remember me option */}
            <motion.div variants={itemVariants} className="flex items-center space-x-2 py-0.5 select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMeValue}
                onClick={() => setValue("rememberMe", !rememberMeValue)}
                className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                  rememberMeValue
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] text-transparent"
                }`}
              >
                {rememberMeValue && <Check size={10} className="stroke-[3]" />}
              </button>
              <span className="text-[11px] text-zinc-400 font-medium cursor-pointer" onClick={() => setValue("rememberMe", !rememberMeValue)}>
                Remember me
              </span>
            </motion.div>

            {/* Action button */}
            <motion.div variants={itemVariants}>
              <LiquidButton
                type="submit"
                variant="brand"
                disabled={loading}
                className="w-full py-3 h-11 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 flex justify-center items-center gap-1.5 cursor-pointer"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </LiquidButton>
            </motion.div>
          </>
        )}
      </form>
      )}

      {/* Social login separator */}
      <motion.div variants={itemVariants} className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-zinc-850"></div>
        <span className="flex-shrink mx-3 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Or continue with</span>
        <div className="flex-grow border-t border-zinc-850"></div>
      </motion.div>

      {/* Social buttons */}
      <motion.div variants={itemVariants} className="w-full flex justify-center py-0.5">
        <button
          type="button"
          disabled={loading || googleAuthenticating}
          onClick={() => loginWithGoogle()}
          className="relative flex items-center justify-center w-full h-11 px-3 bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 backdrop-blur-md rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
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
          <span>{googleAuthenticating ? "Authenticating..." : "Continue with Google"}</span>
        </button>
      </motion.div>

      {/* Footer sign up redirection */}
      <motion.div variants={itemVariants} className="text-center pt-3 border-t border-zinc-850">
        <p className="text-[11px] text-zinc-400">
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
      </motion.div>

      <AuthLoader isOpen={googleAuthenticating} type="login" />
    </motion.div>
  );
}
