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
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";
import { AuthLoader } from "./AuthLoader";
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
  Sparkles
} from "lucide-react";

const registerSchema = z
  .object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().optional(),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(10, { message: "Please enter a valid phone number (min 10 digits)." }),
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

  const handleGoogleSuccess = async ({ idToken, accessToken }: { idToken?: string; accessToken?: string }) => {
    setError(null);
    setLoading(true);
    setGoogleAuthenticating(true);
    try {
      const response = await apiClient.post("/auth/login/google", {
        idToken,
        accessToken,
      });

      const { accessToken: jwtToken, firstName, role, userId, tenantId, memberships, permissions } = response.data.data;
      
      // Store session cookies
      document.cookie = "hasSession=true; path=/; SameSite=Lax";
      document.cookie = `user_name=${encodeURIComponent(firstName)}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
      localStorage.setItem("user_name", firstName);
      localStorage.setItem("user_role", role);
      
      // Save state in Zustand store
      setAuth(
        jwtToken,
        { id: userId, email: response.data.data.email || "", firstName, role, permissions: permissions || [] },
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
      const errMsg = err.response?.data?.error?.message || "Google registration failed. Please try again.";
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
      setError("Google Sign-Up was cancelled or failed.");
      addToast("Google Sign-Up failed.", "error");
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

  const onSubmit = async (data: RegisterInputs) => {
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

      addToast("Workspace created successfully!", "success");
      setSuccess(true);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message;
      const status = err.response?.status;
      const errMsg = serverMsg
        ? serverMsg
        : status === 500
        ? "Registration failed due to a server error. Please try again."
        : "Registration failed. Email might already be registered.";
      setError(errMsg);
      addToast(errMsg, "error");
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

  if (success) {
    return (
      <div className="text-center space-y-6 animate-slide-in">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-md">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            Workspace Created!
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your company tenant has been registered. You can now log into your EventOS admin workspace.
          </p>
        </div>
        <Button
          onClick={() => {
            if (isModal && onSwitchMode) {
              onSwitchMode("login");
            } else {
              router.push("/login");
            }
          }}
          className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="text-center space-y-1.5 select-none">
        <div className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-purple-500/10 select-none transform hover:rotate-12 hover:scale-105 transition-all duration-300">
          <Sparkles size={16} className="text-white animate-pulse" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
          Event<span className="text-purple-400">OS</span>
        </h2>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">The Operating System for Event Businesses</p>
        
        {/* Step Indicator Bubbles */}
        <div className="flex items-center justify-between w-full max-w-[280px] mx-auto pt-3 pb-1 select-none relative">
          {/* Connecting Line background */}
          <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-zinc-800 z-0 rounded-full" />
          {/* Active Line background */}
          <div 
            className="absolute top-[14px] left-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 z-0 rounded-full transition-all duration-500 ease-out" 
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
          
          {/* Step 1 Bubble */}
          <div className="z-10 flex flex-col items-center gap-1.5">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
              step === 1 
                ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]" 
                : "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            }`}>
              {step > 1 ? <Check className="h-3 w-3 stroke-[3]" /> : "1"}
            </div>
            <span className={`text-[8px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${
              step === 1 ? "text-purple-400" : "text-emerald-400"
            }`}>Owner Info</span>
          </div>

          {/* Step 2 Bubble */}
          <div className="z-10 flex flex-col items-center gap-1.5">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
              step === 2 
                ? "bg-pink-600 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]" 
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}>
              2
            </div>
            <span className={`text-[8px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${
              step === 2 ? "text-pink-400" : "text-zinc-500"
            }`}>Workspace</span>
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
              className="space-y-3"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-850">
                <User size={13} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Owner Profile</span>
              </div>

               {/* Google Sign-up */}
              <div className="w-full flex justify-center py-1">
                <button
                  type="button"
                  disabled={loading || googleAuthenticating}
                  onClick={() => loginWithGoogle()}
                  className="relative flex items-center justify-center w-full py-2.5 px-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white transition-all active:scale-[0.98] cursor-pointer overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-3.5 w-3.5 mr-2" viewBox="0 0 24 24">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Shubham"
                    className={`w-full px-2.5 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                      errors.firstName 
                        ? "border-rose-500/50" 
                        : focusedField === "firstName"
                        ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "border-white/[0.08] hover:border-white/[0.15]"
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
                    placeholder="Decor"
                    className={`w-full px-2.5 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                      focusedField === "lastName"
                        ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
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
                    placeholder="name@agency.com"
                    className={`w-full pl-9 pr-3 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
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
                    placeholder="9876543210"
                    className={`w-full pl-9 pr-3 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                      errors.phone 
                        ? "border-rose-500/50" 
                        : focusedField === "phone"
                        ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                    {...register("phone")}
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
                className="w-full py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
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
              className="space-y-3"
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
                    placeholder="Shubham Weddings & Events"
                    className={`w-full pl-9 pr-3 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                      errors.companyName 
                        ? "border-rose-500/50" 
                        : focusedField === "companyName"
                        ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "border-white/[0.08] hover:border-white/[0.15]"
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
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
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
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-1.5 bg-white/[0.03] border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-650/30 transition-all ${
                      errors.confirmPassword 
                        ? "border-rose-500/50" 
                        : focusedField === "confirmPassword"
                        ? "border-[#8B5CF6] bg-[#09090b]/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                    {...register("confirmPassword")}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={(e) => {
                      register("confirmPassword").onBlur(e);
                      setFocusedField(null);
                    }}
                  />
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-rose-400 font-medium pl-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={prevStep}
                  className="col-span-2 py-1.5 border border-white/[0.08] hover:bg-white/[0.04] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="col-span-3 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Build Workspace"
                  )}
                </Button>
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
            <a href="/login" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors">
              Sign In
            </a>
          )}
        </p>
      </div>
      <AuthLoader isOpen={googleAuthenticating} type="register" />
    </div>
  );
}
