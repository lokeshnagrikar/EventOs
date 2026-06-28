"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Sparkles, 
  Palette, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Globe, 
  Coins,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon,
  CreditCard
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToastStore } from "@/lib/toastStore";

const onboardingSchema = z.object({
  name: z.string().min(3, "Company name must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  gstNumber: z.string().optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color code (hex)"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color code (hex)"),
  logoUrl: z.string().optional().or(z.literal("")),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const PRESET_PRIMARY_COLORS = [
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#ec4899" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Orange", value: "#f97316" }
];

const PRESET_SECONDARY_COLORS = [
  { name: "Zinc", value: "#18181b" },
  { name: "Slate", value: "#0f172a" },
  { name: "Neutral", value: "#171717" },
  { name: "Stone", value: "#1c1917" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      gstNumber: "",
      timezone: "Asia/Kolkata",
      currency: "INR",
      primaryColor: "#9333ea",
      secondaryColor: "#18181b",
      logoUrl: ""
    }
  });

  const watchedPrimaryColor = watch("primaryColor");
  const watchedSecondaryColor = watch("secondaryColor");

  // Load existing company settings if any
  useEffect(() => {
    async function loadCompanySettings() {
      try {
        const res = await apiClient.get("/auth/settings/company");
        const company = res.data?.data;
        if (company) {
          if (company.name) setValue("name", company.name);
          if (company.email) setValue("email", company.email);
          if (company.phone) setValue("phone", company.phone);
          if (company.website) setValue("website", company.website);
          if (company.address) setValue("address", company.address);
          if (company.gstNumber) setValue("gstNumber", company.gstNumber);
          if (company.timezone) setValue("timezone", company.timezone);
          if (company.currency) setValue("currency", company.currency);
          if (company.primaryColor) setValue("primaryColor", company.primaryColor);
          if (company.secondaryColor) setValue("secondaryColor", company.secondaryColor);
          if (company.logoUrl) setValue("logoUrl", company.logoUrl);
        }
      } catch (err) {
        console.error("Failed to load company settings:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadCompanySettings();
  }, [setValue]);

  const onSubmit = async (data: OnboardingFormData) => {
    setLoading(true);
    try {
      await apiClient.put("/auth/settings/company", data);
      addToast("Workspace onboarding completed successfully!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.error?.message || "Failed to update onboarding settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Accessing Onboarding Wizard...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090B] text-white p-4 sm:p-6 relative overflow-hidden select-none selection:bg-purple-600/35 selection:text-white">
      {/* Radial grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-650/10 to-pink-500/10 blur-[130px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-3xl z-10 space-y-6">
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <div className="h-10 w-10 mx-auto rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-550/20 mb-3">
            E
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            Configure Your Workspace
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Let's setup your event operations agency details, localization standards, and visual identity.
          </p>
        </div>

        {/* Multi-step progress tracker */}
        <div className="flex justify-between items-center max-w-md mx-auto px-4">
          {[
            { stepNum: 1, label: "Agency Info", icon: Building2 },
            { stepNum: 2, label: "Standards", icon: Globe },
            { stepNum: 3, label: "Branding", icon: Palette },
          ].map((item, idx) => {
            const isCompleted = step > item.stepNum;
            const isActive = step === item.stepNum;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.stepNum}>
                {idx > 0 && (
                  <div className={`flex-1 h-[2px] mx-2 ${
                    isCompleted ? "bg-purple-600" : "bg-zinc-800"
                  }`} />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-purple-600 border-purple-600 text-white"
                      : isActive
                        ? "bg-purple-600/10 border-purple-500 text-purple-400 shadow-md shadow-purple-600/10"
                        : "bg-zinc-950/40 border-zinc-800 text-zinc-500"
                  }`}>
                    {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? "text-purple-400" : "text-zinc-500"
                  }`}>
                    {item.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Glass Form Container */}
        <div className="bg-[#111113]/70 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: AGENCY INFO */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="border-b border-zinc-800/60 pb-3 mb-4">
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <Building2 size={16} className="text-purple-400" />
                      Agency Credentials
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-1">Specify your corporate identification details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Agency Name */}
                    <div className="space-y-1">
                      <label htmlFor="companyName" className="text-xs font-semibold text-zinc-300">Agency Name *</label>
                      <input
                        id="companyName"
                        type="text"
                        {...register("name")}
                        placeholder="e.g. Dream Creators Group"
                        className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                      />
                      {errors.name && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label htmlFor="companyEmail" className="text-xs font-semibold text-zinc-300">Contact Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          id="companyEmail"
                          type="email"
                          {...register("email")}
                          placeholder="e.g. info@dreamcreators.com"
                          className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label htmlFor="companyPhone" className="text-xs font-semibold text-zinc-300">Contact Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          id="companyPhone"
                          type="text"
                          {...register("phone")}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div className="space-y-1">
                      <label htmlFor="companyWebsite" className="text-xs font-semibold text-zinc-300">Website URL</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          id="companyWebsite"
                          type="text"
                          {...register("website")}
                          placeholder="e.g. https://dreamcreators.com"
                          className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>
                      {errors.website && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{errors.website.message}</p>
                      )}
                    </div>

                    {/* GST Number */}
                    <div className="space-y-1">
                      <label htmlFor="companyGst" className="text-xs font-semibold text-zinc-300">GST / Tax Identification</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          id="companyGst"
                          type="text"
                          {...register("gstNumber")}
                          placeholder="e.g. 29GGGGG1314R9Z8"
                          className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label htmlFor="companyAddress" className="text-xs font-semibold text-zinc-300">Office Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          id="companyAddress"
                          type="text"
                          {...register("address")}
                          placeholder="e.g. MG Road, Bengaluru, Karnataka"
                          className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-650 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: STANDARDS (LOCALIZATION) */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="border-b border-zinc-800/60 pb-3 mb-4">
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <Globe size={16} className="text-purple-400" />
                      Standards & Localizations
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-1">Configure timezone and currency for billing outputs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone */}
                    <div className="space-y-2">
                      <label htmlFor="companyTimezone" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Globe size={14} className="text-zinc-500" />
                        Operation Timezone
                      </label>
                      <select
                        id="companyTimezone"
                        {...register("timezone")}
                        className="w-full bg-zinc-955 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Asia/Kolkata">India (IST) - Asia/Kolkata</option>
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="America/New_York">United States (EST) - New York</option>
                        <option value="Europe/London">United Kingdom (GMT) - London</option>
                        <option value="Asia/Dubai">United Arab Emirates (GST) - Dubai</option>
                        <option value="Asia/Singapore">Singapore (SGT) - Singapore</option>
                      </select>
                      <p className="text-[10px] text-zinc-500">Sets timeline and schedule calculations default zone.</p>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <label htmlFor="companyCurrency" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Coins size={14} className="text-zinc-500" />
                        Operation Currency
                      </label>
                      <select
                        id="companyCurrency"
                        {...register("currency")}
                        className="w-full bg-zinc-955 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="INR">Indian Rupee (INR) - ₹</option>
                        <option value="USD">United States Dollar (USD) - $</option>
                        <option value="EUR">Euro (EUR) - €</option>
                        <option value="GBP">British Pound (GBP) - £</option>
                        <option value="AED">UAE Dirham (AED) - د.إ</option>
                        <option value="SGD">Singapore Dollar (SGD) - S$</option>
                      </select>
                      <p className="text-[10px] text-zinc-500">Specifies currency symbols on invoices and billing logs.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: BRANDING IDENTITY */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="border-b border-zinc-800/60 pb-3 mb-4">
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <Palette size={16} className="text-purple-400" />
                      Brand Identity
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-1">Configure client portal themes and logo branding details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 block animate-none">Primary Color Accent</label>
                      <div className="flex gap-2 mb-3">
                        {PRESET_PRIMARY_COLORS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setValue("primaryColor", preset.value)}
                            style={{ backgroundColor: preset.value }}
                            className={`h-7 w-7 rounded-full transition-transform ${
                              watchedPrimaryColor === preset.value ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                            }`}
                            aria-label={`Select primary color ${preset.name}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={watchedPrimaryColor}
                          onChange={(e) => setValue("primaryColor", e.target.value)}
                          className="h-9 w-12 bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          {...register("primaryColor")}
                          placeholder="#9333ea"
                          className="flex-1 bg-zinc-950/40 border border-zinc-800 focus:border-purple-600 rounded-xl px-4 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 block animate-none">Secondary Color Background</label>
                      <div className="flex gap-2 mb-3">
                        {PRESET_SECONDARY_COLORS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setValue("secondaryColor", preset.value)}
                            style={{ backgroundColor: preset.value }}
                            className={`h-7 w-7 rounded-full border border-zinc-800 transition-transform ${
                              watchedSecondaryColor === preset.value ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                            }`}
                            aria-label={`Select secondary color ${preset.name}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={watchedSecondaryColor}
                          onChange={(e) => setValue("secondaryColor", e.target.value)}
                          className="h-9 w-12 bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          {...register("secondaryColor")}
                          placeholder="#18181b"
                          className="flex-1 bg-zinc-950/40 border border-zinc-800 focus:border-purple-600 rounded-xl px-4 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="logoUrl" className="text-xs font-semibold text-zinc-300">Agency Logo Image URL</label>
                      <input
                        id="logoUrl"
                        type="text"
                        {...register("logoUrl")}
                        placeholder="e.g. https://dreamcreators.com/logo.png"
                        className="w-full bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 focus:border-purple-600 rounded-xl px-4.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all"
                      />
                      <p className="text-[10px] text-zinc-500">Will be featured on client portal header outputs and invoice sheets.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Footer Action Buttons */}
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-6 mt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold transition-all text-zinc-300"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 1 && watch("name").length < 3}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold transition-all text-white shadow-md shadow-purple-600/20"
                >
                  Continue
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || watch("name").length < 3}
                  className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs font-bold transition-all text-white shadow-md shadow-purple-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
