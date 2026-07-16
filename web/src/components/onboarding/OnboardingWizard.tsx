"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  LayoutGrid,
  Wand2,
  X,
  Heart,
  Building2,
  Camera,
  Globe,
  Film,
  Palette,
  User,
  Users,
  UserPlus,
  FileText,
  Calendar,
  Image,
  PartyPopper,
  SkipForward,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

const BUSINESS_SEGMENTS = [
  { id: "wedding", name: "Wedding Planner", icon: Heart, desc: "Seeding wedding itineraries, reception checklists, and vendor contacts." },
  { id: "corporate", name: "Corporate Events", icon: Building2, desc: "Seeding staging schedules, speaker directories, and sponsor invoices." },
  { id: "photography", name: "Photography Studio", icon: Camera, desc: "Seeding high-res photo albums, proof locks, and contracts." },
  { id: "agency", name: "Event Agency", icon: Globe, desc: "Seeding multi-city planning boards, guest lists, and budgets." },
  { id: "production", name: "Production House", icon: Film, desc: "Seeding AV equipment manifests, rigger plans, and crew sheets." },
  { id: "decorator", name: "Decorator", icon: Palette, desc: "Seeding design proposals, floral counts, and set design briefs." },
  { id: "freelancer", name: "Freelancer", icon: User, desc: "Seeding single-coordinator timelines, invoices, and time cards." },
];

const WIZARD_STEPS = [
  { id: 1, label: "Welcome", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  { id: 2, label: "Workspace", icon: Building2, color: "from-blue-500 to-cyan-500" },
  { id: 3, label: "Team", icon: Users, color: "from-emerald-500 to-teal-500" },
  { id: 4, label: "Client", icon: UserPlus, color: "from-orange-500 to-amber-500" },
  { id: 5, label: "Lead", icon: Heart, color: "from-pink-500 to-rose-500" },
  { id: 6, label: "Quote", icon: FileText, color: "from-indigo-500 to-purple-500" },
  { id: 7, label: "Event", icon: Calendar, color: "from-cyan-500 to-blue-500" },
  { id: 8, label: "Gallery", icon: Image, color: "from-fuchsia-500 to-pink-500" },
  { id: 9, label: "Finish", icon: PartyPopper, color: "from-emerald-500 to-green-500" },
];

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Kolkata",
  "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney", "Pacific/Auckland",
];

const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
];

export default function OnboardingWizard() {
  const { isOpen, currentWizardStep, wizardData, loadDemoWorkspace, closeOnboarding, skipOnboarding, setWizardStep, updateWizardData, completeStep } = useOnboardingStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("wedding");

  // Local form states for quick inputs
  const [teamEmail, setTeamEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [quoteName, setQuoteName] = useState("");
  const [eventName, setEventName] = useState("");
  const [galleryName, setGalleryName] = useState("");

  const step = currentWizardStep;
  const totalSteps = WIZARD_STEPS.length;
  const progressPercent = Math.round(((step - 1) / (totalSteps - 1)) * 100);

  const handleNext = () => {
    if (step < totalSteps) {
      setWizardStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setWizardStep(step - 1);
    }
  };

  const handleSkipStep = () => {
    if (step < totalSteps) {
      setWizardStep(step + 1);
    } else {
      closeOnboarding();
    }
  };

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_onboarding_status", "COMPLETED");
    }
    addToast("🎉 Onboarding complete! Welcome to EventOS!", "success");
    closeOnboarding();
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await loadDemoWorkspace();
      setSeedingSuccess(true);
      addToast("Workspace seeded with demo data! 🎉", "success");
      setTimeout(() => {
        handleFinish();
      }, 1500);
    } catch (e) {
      addToast("Failed to load demo workspace.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = (stepId: string, label: string) => {
    completeStep(stepId);
    addToast(`✓ ${label}`, "success");
    handleNext();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Floating glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-gradient-to-tr from-purple-550/10 to-pink-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-gradient-to-tr from-purple-550/10 to-pink-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.96 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-2xl bg-zinc-950/85 border border-zinc-850 p-6 md:p-10 rounded-3xl shadow-2xl backdrop-blur-xl space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          {/* Close button */}
          <button onClick={skipOnboarding} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer" aria-label="Close onboarding">
            <X size={16} />
          </button>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
              <span>Step {step} of {totalSteps}</span>
              <span className="text-purple-400">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-650 to-pink-555 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            {/* Step dots */}
            <div className="flex justify-between px-1">
              {WIZARD_STEPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setWizardStep(s.id)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all cursor-pointer",
                    s.id === step ? "bg-purple-500 scale-125 ring-2 ring-purple-500/30" :
                    s.id < step ? "bg-purple-600/50" : "bg-zinc-800"
                  )}
                  aria-label={`Go to step ${s.id}: ${s.label}`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* ─── STEP 1: Welcome ─── */}
              {step === 1 && (
                <div className="text-center space-y-4 py-4">
                  <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-purple-550/20">
                    E
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Welcome to EventOS{user?.firstName ? `, ${user.firstName}` : ""}!
                  </h1>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Let&apos;s set up your workspace in a few quick steps. You can skip any step and come back later.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 max-w-sm mx-auto">
                    <button
                      onClick={handleNext}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      <LayoutGrid size={14} /> Start Setup <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={handleLoadDemo}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-5 py-3 border border-purple-500/20 hover:border-purple-500/30 bg-purple-950/10 text-purple-400 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      {loading ? "Seeding..." : seedingSuccess ? "Done! ✓" : "Load Demo"}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Workspace Setup ─── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white">Workspace Setup</h2>
                    <p className="text-[11px] text-zinc-450">Configure your business profile, brand, and preferences.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide block mb-1">Business Type</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {BUSINESS_SEGMENTS.map((segment) => {
                          const IconComponent = segment.icon;
                          return (
                            <button key={segment.id} onClick={() => setSelectedSegment(segment.id)}
                              className={cn(
                                "p-2.5 border rounded-xl flex items-center gap-2 text-left transition-all cursor-pointer text-[10px]",
                                selectedSegment === segment.id ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-zinc-850 hover:border-zinc-800 text-zinc-400"
                              )}>
                              <IconComponent size={14} />
                              <span className="font-bold">{segment.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide block mb-1">Timezone</label>
                        <select
                          value={wizardData.timezone || "Asia/Kolkata"}
                          onChange={(e) => updateWizardData({ timezone: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-[11px] text-zinc-200 focus:border-purple-500 outline-none transition"
                        >
                          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide block mb-1">Currency</label>
                        <select
                          value={wizardData.currency || "INR"}
                          onChange={(e) => updateWizardData({ currency: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-[11px] text-zinc-200 focus:border-purple-500 outline-none transition"
                        >
                          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Invite Team ─── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><Users size={18} className="text-emerald-400" /> Invite Team Members</h2>
                    <p className="text-[11px] text-zinc-450">Add colleagues to collaborate on events and projects.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="team@example.com"
                      value={teamEmail}
                      onChange={(e) => setTeamEmail(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition"
                    />
                    <button
                      onClick={() => { if (teamEmail) { handleStepAction("invite_member", "Team invitation sent"); setTeamEmail(""); } }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                    >
                      Invite
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-555">You can invite more members later from Settings → Team.</p>
                </div>
              )}

              {/* ─── STEP 4: Create First Client ─── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><UserPlus size={18} className="text-orange-400" /> Create Your First Client</h2>
                    <p className="text-[11px] text-zinc-450">Add a client to your CRM to start managing relationships.</p>
                  </div>
                  <div className="space-y-2">
                    <input type="text" placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition" />
                    <input type="email" placeholder="Client email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition" />
                  </div>
                  <button
                    onClick={() => { if (clientName) { handleStepAction("company_profile", "First client created"); setClientName(""); setClientEmail(""); } }}
                    className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                  >
                    Create Client
                  </button>
                </div>
              )}

              {/* ─── STEP 5: Create First Lead ─── */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><Heart size={18} className="text-pink-400" /> Create Your First Lead</h2>
                    <p className="text-[11px] text-zinc-450">Capture a potential customer as a lead in your pipeline.</p>
                  </div>
                  <input type="text" placeholder="Lead name (e.g. Emma & Daniel's Wedding)" value={leadName} onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition" />
                  <button
                    onClick={() => { if (leadName) { handleStepAction("add_lead", "First lead created"); setLeadName(""); } }}
                    className="w-full px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                  >
                    Add Lead
                  </button>
                </div>
              )}

              {/* ─── STEP 6: Generate First Quote ─── */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><FileText size={18} className="text-indigo-400" /> Generate Your First Quote</h2>
                    <p className="text-[11px] text-zinc-450">Create a quote to send to your client for approval.</p>
                  </div>
                  <input type="text" placeholder="Quote title (e.g. Wedding Planning Package)" value={quoteName} onChange={(e) => setQuoteName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition" />
                  <button
                    onClick={() => { if (quoteName) { handleStepAction("create_quote", "First quote created"); setQuoteName(""); } }}
                    className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                  >
                    Create Quote
                  </button>
                </div>
              )}

              {/* ─── STEP 7: Create First Event ─── */}
              {step === 7 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><Calendar size={18} className="text-cyan-400" /> Create Your First Event</h2>
                    <p className="text-[11px] text-zinc-450">Schedule an event on your planning calendar.</p>
                  </div>
                  <input type="text" placeholder="Event name (e.g. Summer Garden Wedding)" value={eventName} onChange={(e) => setEventName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition" />
                  <button
                    onClick={() => { if (eventName) { handleStepAction("schedule_event", "First event created"); setEventName(""); } }}
                    className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                  >
                    Create Event
                  </button>
                </div>
              )}

              {/* ─── STEP 8: Upload First Gallery ─── */}
              {step === 8 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><Image size={18} className="text-fuchsia-400" /> Upload Your First Gallery</h2>
                    <p className="text-[11px] text-zinc-450">Share event photos with your clients through a secure gallery.</p>
                  </div>
                  <input type="text" placeholder="Gallery name (e.g. Reception Highlights)" value={galleryName} onChange={(e) => setGalleryName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition" />
                  <button
                    onClick={() => { if (galleryName) { handleStepAction("upload_gallery", "First gallery created"); setGalleryName(""); } }}
                    className="w-full px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                  >
                    Create Gallery
                  </button>
                </div>
              )}

              {/* ─── STEP 9: Finish ─── */}
              {step === 9 && (
                <div className="text-center space-y-5 py-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white">You&apos;re All Set! 🎉</h2>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Your workspace is ready. You can always revisit any step from the Setup Checklist widget.
                  </p>
                  <button
                    onClick={handleFinish}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-550 hover:to-pink-450 text-white rounded-xl text-sm font-bold cursor-pointer transition shadow-lg shadow-purple-500/20"
                  >
                    Go to Dashboard <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer controls */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-900 text-[10px] font-bold select-none">
            <div className="flex items-center gap-2">
              {step > 1 && step < 9 && (
                <button onClick={handleBack} className="flex items-center gap-1 text-zinc-550 hover:text-zinc-400 transition uppercase cursor-pointer">
                  <ArrowLeft size={10} /> Back
                </button>
              )}
              {step === 1 && (
                <button onClick={skipOnboarding} className="text-zinc-555 hover:text-zinc-400 transition uppercase cursor-pointer">
                  Skip Setup
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step > 1 && step < 9 && (
                <button onClick={handleSkipStep} className="flex items-center gap-1 text-zinc-555 hover:text-zinc-400 transition cursor-pointer">
                  <SkipForward size={10} /> Skip this step
                </button>
              )}
              {step > 1 && step < 9 && (
                <button onClick={handleNext} className="flex items-center gap-1 px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl transition cursor-pointer">
                  Continue <ArrowRight size={10} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
