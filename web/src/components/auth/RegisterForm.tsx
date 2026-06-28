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

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <div className="space-y-6">
      {/* Progress header */}
      <div className="text-center space-y-2 select-none">
        <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
          Create a Workspace
        </h2>
        <p className="text-xs text-zinc-400">Set up your EventOS organization profile.</p>
        <div className="flex flex-col items-center space-y-2 pt-2 select-none w-full max-w-[200px] mx-auto">
          {/* Progress Bar Track */}
          <div className="w-full bg-white/[0.04] border border-white/[0.08] h-1.5 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
          {/* Step Text */}
          <div className="flex justify-between w-full text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">
            <span className={step === 1 ? "text-purple-400 transition-colors duration-300" : "text-zinc-500 transition-colors duration-300"}>Owner Profile</span>
            <span className={step === 2 ? "text-[#06B6D4] transition-colors duration-300" : "text-zinc-500 transition-colors duration-300"}>Workspace Settings</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 animate-slide-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
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
              className="space-y-4"
            >
              <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-850">
                <User size={14} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Owner Profile</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Shubham"
                    className={`w-full px-3 py-2 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Decor"
                    className={`w-full px-3 py-2 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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
                    placeholder="name@agency.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-250 ${
                    focusedField === "phone" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="phone"
                    type="text"
                    placeholder="9876543210"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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
                className="w-full py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
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
              className="space-y-4"
            >
              <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-850">
                <Building2 size={14} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Workspace Settings</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="companyName">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-250 ${
                    focusedField === "companyName" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="companyName"
                    type="text"
                    placeholder="Shubham Weddings & Events"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="password">
                  Workspace Password
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-250 ${
                    focusedField === "password" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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
                  <div className="space-y-1.5 pt-1 animate-slide-in">
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-250 ${
                    focusedField === "confirmPassword" ? "text-purple-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "text-zinc-500"
                  }`} />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all ${
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

              <div className="grid grid-cols-5 gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="col-span-2 py-2.5 border border-white/[0.08] hover:bg-white/[0.04] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="col-span-3 py-5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
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
      <div className="text-center pt-4 border-t border-zinc-850">
        <p className="text-xs text-zinc-400">
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
    </div>
  );
}
