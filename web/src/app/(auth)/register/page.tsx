"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Building2, User, KeyRound } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  companyName: z.string().min(3, { message: "Company name must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onChange"
  });

  const nextStep = async () => {
    // Validate current step fields before progressing
    let fieldsToValidate: Array<keyof RegisterInputs> = [];
    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName", "email", "phone"];
    } else if (step === 2) {
      fieldsToValidate = ["companyName", "password", "confirmPassword"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: RegisterInputs) => {
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName || "",
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        password: data.password,
      });

      setSuccess(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Registration failed. Email might already be registered.";
      setError(errMsg);
      setStep(1); // Go back to start
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen w-screen flex items-center justify-center bg-[#09090B] text-white p-4">
        <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl p-8 z-10 text-center space-y-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-md">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Workspace Created!</h2>
            <p className="text-sm text-zinc-400">
              Your company tenant has been registered. You can now log into your admin workspace.
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/login"}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen flex items-center justify-center bg-[#09090B] text-white p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-xl p-8 z-10 space-y-6">
        
        {/* Progress header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Register Workspace</h2>
          <div className="flex justify-center items-center gap-1">
            <span className={`h-1.5 w-10 rounded-full transition-all ${step >= 1 ? "bg-purple-600" : "bg-zinc-800"}`} />
            <span className={`h-1.5 w-10 rounded-full transition-all ${step >= 2 ? "bg-purple-600" : "bg-zinc-800"}`} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 animate-shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* STEP 1: Personal Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60 mb-2">
                <User size={16} className="text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Owner Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400" htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Shubham"
                    className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                      errors.firstName ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                    }`}
                    {...register("firstName")}
                  />
                  {errors.firstName && <p className="text-[10px] text-red-400 font-medium">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400" htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Decor"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 focus:border-purple-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                    {...register("lastName")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@agency.com"
                  className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                    errors.email ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                  }`}
                  {...register("email")}
                />
                {errors.email && <p className="text-[10px] text-red-400 font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  placeholder="9876543210"
                  className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                    errors.phone ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                  }`}
                  {...register("phone")}
                />
                {errors.phone && <p className="text-[10px] text-red-400 font-medium">{errors.phone.message}</p>}
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-2.5 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2: Company Setup & Password */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60 mb-2">
                <Building2 size={16} className="text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Workspace Settings</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Shubham Weddings & Events"
                  className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                    errors.companyName ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                  }`}
                  {...register("companyName")}
                />
                {errors.companyName && <p className="text-[10px] text-red-400 font-medium">{errors.companyName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="password">Workspace Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                      errors.password ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                    }`}
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="text-[10px] text-red-400 font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                    errors.confirmPassword ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                  }`}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="text-[10px] text-red-400 font-medium">{errors.confirmPassword.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="py-2.5 border border-zinc-800 hover:bg-zinc-800 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? "Creating..." : "Build Workspace"}
                </button>
              </div>
            </div>
          )}

        </form>

        {/* Footer sign in redirection */}
        <div className="text-center pt-4 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-400">
            Already have a workspace?{" "}
            <a href="/login" className="text-purple-400 hover:underline font-semibold">
              Sign In
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}
