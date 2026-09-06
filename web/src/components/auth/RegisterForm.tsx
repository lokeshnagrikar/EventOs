"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";
import { analytics } from "@/lib/analytics";
import { AuthLoader } from "./AuthLoader";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  User,
  KeyRound,
  Mail,
  Phone,
  Loader2,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Briefcase
} from "lucide-react";

const registerSchema = z
  .object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().optional(),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().regex(/^\+91 \d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
    companyName: z.string().min(3, { message: "Company name must be at least 3 characters." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInputs = z.infer<typeof registerSchema>;

const checkPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "", colorClass: "bg-transparent", barWidth: "0%" };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, label: "Weak", colorClass: "bg-rose-500 shadow-rose-500/30", barWidth: "25%" };
  } else if (score === 2) {
    return { score: 2, label: "Fair", colorClass: "bg-amber-500 shadow-amber-500/30", barWidth: "50%" };
  } else if (score === 3) {
    return { score: 3, label: "Good", colorClass: "bg-emerald-500 shadow-emerald-500/30", barWidth: "75%" };
  } else {
    return { score: 4, label: "Strong", colorClass: "bg-cyan-500 shadow-cyan-500/30", barWidth: "100%" };
  }
};

interface RegisterFormProps {
  isModal?: boolean;
  onSwitchMode?: (mode: "login" | "register") => void;
  prefilledEmail?: string;
}

export function RegisterForm({ isModal = false, onSwitchMode, prefilledEmail }: RegisterFormProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const addToast = useToastStore((state) => state.addToast);
  const setAuth = useAuthStore((state) => state.setAuth);
  const closeModal = useAuthModalStore((state) => state.closeModal);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [googleAuthenticating, setGoogleAuthenticating] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 400);
  };

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

  // 6-digit OTP States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(120);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      addToast("Successfully registered workspace via Google!", "success");

      if (isModal) {
        closeModal();
      }

      // Redirect
      if (role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/workspace-select");
      }
    } catch (err: any) {
      console.error("[GOOGLE_AUTH] Full error:", err?.response?.status, err?.response?.data, err?.message);
      const errMsg = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || (err.response?.status ? `Google registration failed (${err.response.status}). Please try again.` : "Google registration failed. Backend may be offline.")
      setError(errMsg);
      addToast(errMsg, "error");
      triggerShake();
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
      setError("Google Sign-Up was cancelled or failed.");
      addToast("Google Sign-Up failed.", "error");
      triggerShake();
    }
  });

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");
  const strength = checkPasswordStrength(passwordValue);

  useEffect(() => {
    if (prefilledEmail) {
      setValue("email", prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  const nextStep = async () => {
    // Validate current step fields before progressing
    let fieldsToValidate: Array<keyof RegisterInputs> = [];
    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName", "email", "phone"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setError(null);
      setStep(2);
    } else {
      addToast("Please correct the validation errors in Step 1", "error");
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(1);
  };

  useEffect(() => {
    if (showOtpScreen && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showOtpScreen, resendTimer]);

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
        if (isModal && onSwitchMode) {
          onSwitchMode("login");
        } else {
          router.push("/?login=true");
        }
      }, 1500);
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

  const onSubmit = async (data: RegisterInputs) => {
    if (step === 1) {
      await nextStep();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName || "",
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        password: data.password,
      });

      analytics.trackAuth("register", data.email);
      analytics.trackWorkspace("created", data.companyName);
      addToast("Workspace created successfully!", "success");
      setOtpEmail(data.email);
      setShowOtpScreen(true);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message;
      const status = err.response?.status;
      const errMsg = serverMsg
        ? serverMsg
        : status === 500
        ? "Registration failed due to a server error. Please try again."
        : "Registration failed. Email might already be registered.";
      analytics.trackError("frontend", errMsg, { email: data.email, action: "register" });
      setError(errMsg);
      addToast(errMsg, "error");
      triggerShake();
      setStep(1); // Go back to start
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    hidden: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir * 50,
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" as any },
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir * -50,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" as any },
    }),
  };

  if (showOtpScreen) {
    return (
      <div className={cn("space-y-6 animate-slide-in text-center select-none", shouldShake ? "animate-shake" : "")}>
        <div className="mx-auto h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-md">
          {otpSuccess ? <CheckCircle2 size={24} className="text-emerald-400 animate-scale-in" /> : <Mail size={24} className="animate-pulse" />}
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            {otpSuccess ? "Verification Successful!" : "Verify Your Account"}
          </h2>
          <p className="text-xs text-zinc-450 leading-relaxed max-w-[280px] mx-auto">
            {otpSuccess 
              ? "Your account is now activated. Redirecting you to sign in..." 
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

            <div className="text-[10px] text-zinc-550 italic">
              Note: In development, check the backend console log for the 6-digit OTP code.
            </div>

            <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-450">
              <span>Didn't get the code?</span>
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
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 sm:space-y-4", shouldShake ? "animate-shake" : "")}>
      {/* Modern Sleek Header - Vercel / Apple Minimalist Style */}
      <div className="text-left space-y-1 select-none pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Create an account
        </h2>
        <p className="text-xs text-zinc-400">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      <div className="space-y-1 select-none">
        {/* Step Indicator */}
        <div className="w-full pt-1 pb-1 select-none">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mb-1.5 select-none">
            <span className={`transition-all duration-300 ${
              step === 1 ? "text-purple-400 font-extrabold" : "text-emerald-400 font-semibold"
            }`}>
              {step > 1 ? "✓ 1. Personal Info" : "1. Personal Info"}
            </span>
            <span className={`transition-all duration-300 ${
              step === 2 ? "text-pink-400 font-extrabold" : "text-zinc-500"
            }`}>
              2. Workspace Details
            </span>
          </div>
          {/* Progress bar track */}
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
            <div 
              className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#8B5CF6] transition-all duration-500 ease-out rounded-full" 
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 animate-slide-in">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="overflow-hidden">
        <AnimatePresence mode="wait" custom={step}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={1}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideVariants}
              className="space-y-2.5 sm:space-y-3"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-850">
                <User size={13} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Owner Profile</span>
              </div>

               {/* Google Sign-up */}
              <div className="w-full flex justify-center py-0.5">
                <button
                  type="button"
                  disabled={loading || googleAuthenticating}
                  onClick={() => loginWithGoogle()}
                  className="relative flex items-center justify-center w-full h-11 px-3 bg-[#141417] hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span>{googleAuthenticating ? "Authenticating..." : "Sign up with Google"}</span>
                </button>
              </div>

              {/* Separator */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-850"></div>
                <span className="flex-shrink mx-3 text-[8px] text-zinc-550 font-bold uppercase tracking-wider">Or register with email</span>
                <div className="flex-grow border-t border-zinc-850"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    autoFocus
                    autoComplete="given-name"
                    className={`w-full px-3 py-2 bg-[#141417] border rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all ${
                      errors.firstName 
                        ? "border-rose-500/50" 
                        : "border-zinc-800"
                    }`}
                    {...register("firstName")}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={(e) => {
                      register("firstName").onBlur(e);
                      setFocusedField(null);
                    }}
                  />
                  {errors.firstName && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    autoComplete="family-name"
                    className="w-full px-3 py-2 bg-[#141417] border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                    {...register("lastName")}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={(e) => {
                      register("lastName").onBlur(e);
                      setFocusedField(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
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
                    autoComplete="email"
                    className={`w-full pl-9 pr-3 py-2 bg-[#141417] border rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all ${
                      errors.email 
                        ? "border-rose-500/50" 
                        : "border-zinc-800"
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
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-2.5 h-3.5 w-3.5 transition-colors duration-250 ${
                    focusedField === "phone" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="phone"
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    autoComplete="tel"
                    className={`w-full pl-9 pr-3 py-2 bg-[#141417] border rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all ${
                      errors.phone 
                        ? "border-rose-500/50" 
                        : "border-zinc-800"
                    }`}
                    {...register("phone", {
                      onChange: (e) => {
                        let digits = e.target.value.replace(/\D/g, "");
                        if (digits.startsWith("91")) {
                          digits = digits.slice(2);
                        }
                        digits = digits.slice(0, 10);
                        const formatted = digits.length > 0 ? `+91 ${digits}` : "";
                        setValue("phone", formatted, { shouldValidate: true });
                      }
                    })}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={(e) => {
                      register("phone").onBlur(e);
                      setFocusedField(null);
                    }}
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.phone.message}</p>}
              </div>

              <Button
                type="button"
                onClick={nextStep}
                className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight size={13} />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              custom={-1}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideVariants}
              className="space-y-2.5 sm:space-y-3"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-850">
                <Building2 size={13} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Workspace Settings</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="companyName">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-2.5 h-3.5 w-3.5 transition-colors duration-250 ${
                    focusedField === "companyName" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="companyName"
                    type="text"
                    placeholder="Acme Events Ltd."
                    className={`w-full pl-9 pr-3 py-2 bg-white/[0.04] border backdrop-blur-md rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 transition-all ${
                      errors.companyName 
                        ? "border-rose-500/50" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                    {...register("companyName")}
                    onFocus={() => setFocusedField("companyName")}
                    onBlur={(e) => {
                      register("companyName").onBlur(e);
                      setFocusedField(null);
                    }}
                  />
                </div>
                {errors.companyName && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.companyName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="password">
                  Workspace Password
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-2.5 h-3.5 w-3.5 transition-colors duration-250 ${
                    focusedField === "password" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full pl-9 pr-10 py-2 bg-white/[0.04] border backdrop-blur-md rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 transition-all ${
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
                    className="absolute right-3 top-2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.password.message}</p>}
                
                {passwordValue && (
                  <div className="space-y-1 pt-0.5 animate-slide-in">
                    <div className="flex justify-between items-center text-[9px] select-none">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">Password Strength</span>
                      <span className={`font-black uppercase tracking-wider transition-colors duration-300 ${
                        strength.score === 1 ? "text-rose-400" :
                        strength.score === 2 ? "text-amber-400" :
                        strength.score === 3 ? "text-emerald-400" : "text-cyan-400"
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.04] border border-white/[0.08] h-1 rounded-full relative overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-350 ease-out shadow-[0_0_8px_rgba(139,92,246,0.3)] ${strength.colorClass}`}
                        style={{ width: strength.barWidth }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-2.5 h-3.5 w-3.5 transition-colors duration-250 ${
                    focusedField === "confirmPassword" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full pl-9 pr-10 py-2 bg-white/[0.04] border backdrop-blur-md rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 transition-all ${
                      errors.confirmPassword 
                        ? "border-rose-500/50" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                    {...register("confirmPassword")}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={(e) => {
                      register("confirmPassword").onBlur(e);
                      setFocusedField(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={prevStep}
                  className="col-span-2 h-11 border border-white/15 bg-white/[0.05] hover:bg-white/[0.09] text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.99] cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <LiquidButton
                  type="submit"
                  variant="brand"
                  disabled={loading}
                  className="col-span-3 h-11 rounded-xl font-bold text-xs shadow-lg shadow-purple-500/30 flex justify-center items-center gap-1.5 cursor-pointer"
                  size="default"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Build Workspace"
                  )}
                </LiquidButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Footer sign in redirection */}
      <div className="text-center pt-3 border-t border-zinc-850">
        <p className="text-[11px] text-zinc-400">
          Already have a workspace?{" "}
          {isModal ? (
            <button
              type="button"
              onClick={() => onSwitchMode?.("login")}
              className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors focus:outline-none"
            >
              Sign In
            </button>
          ) : (
            <a href="/?login=true" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors">
              Sign In
            </a>
          )}
        </p>
      </div>
      <AuthLoader isOpen={googleAuthenticating} type="register" />
    </div>
  );
}
