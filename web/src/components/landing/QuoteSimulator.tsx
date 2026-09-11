"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Calculator,
  FileText,
  CheckCircle2,
  Download,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  Building,
  Check,
  Printer,
  Copy,
  Clock,
  QrCode,
  Flame
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useAuthModalStore } from "@/store/authModalStore";
import { useToastStore } from "@/lib/toastStore";
import { NumberTicker } from "@/components/ui/number-ticker";

interface EventPreset {
  id: string;
  name: string;
  tag: string;
  icon: string;
  defaultGuests: number;
  location: string;
  duration: string;
  items: {
    category: string;
    description: string;
    cost: number;
  }[];
}

const EVENT_PRESETS: EventPreset[] = [
  {
    id: "royal-wedding",
    name: "3-Day Royal Wedding & Reception",
    tag: "Most Popular",
    icon: "solar:crown-star-bold-duotone",
    defaultGuests: 500,
    location: "Palace Banquets & Lawns, Udaipur",
    duration: "3 Days (Mehendi, Sangeet, Varmala & Reception)",
    items: [
      { category: "Stage & Decor", description: "3D Floral Mandap, Royal Varmala Stage & Canopy Decor", cost: 220000 },
      { category: "Audio & AV Rigging", description: "Concert Line-Array Speakers, Subwoofers & P2.5 Curved LED Wall", cost: 125000 },
      { category: "Cinematography", description: "4K Multi-Cam Team, Aerial Drone & Same-Day Sangeet Reel Edit", cost: 160000 },
      { category: "Gourmet Catering", description: "Royal 5-Course Multi-Cuisine Buffet (500 Guests @ ₹1,500/plate)", cost: 750000 },
      { category: "Hospitality & Crew", description: "Guest Escort Crew, QR Gate Check-in & Stage Cue Management", cost: 45000 },
    ],
  },
  {
    id: "sangeet-cocktail",
    name: "2-Day Sangeet & Cocktail Night",
    tag: "High Energy",
    icon: "solar:music-library-2-bold-duotone",
    defaultGuests: 350,
    location: "Grand Ballroom & Poolside, Mumbai",
    duration: "2 Days (Cocktail Mixer & High-Octane Sangeet)",
    items: [
      { category: "Stage & Decor", description: "Neon Glam Tunnel, Glass Stage & Holographic DJ Backdrop", cost: 150000 },
      { category: "Audio & Pyrotechnics", description: "Beam Moving Heads, Heavy Bass System & Cold-Pyro Stage Jets", cost: 110000 },
      { category: "Media & Reels", description: "Candid Party Photographers + Instant AI Guest Photo Kiosk", cost: 95000 },
      { category: "Catering & F&B", description: "Live Global Street Food Counters (350 Guests @ ₹1,300/plate)", cost: 455000 },
      { category: "Coordination", description: "Run-of-Show WhatsApp Automation for Emcee, DJ & Family Dances", cost: 35000 },
    ],
  },
  {
    id: "beach-destination",
    name: "Goa Destination Beach Wedding",
    tag: "Destination",
    icon: "solar:sun-fog-bold-duotone",
    defaultGuests: 250,
    location: "Sunset Beach Resort, North Goa",
    duration: "2 Days (Beach Sundowner & Coastal Wedding)",
    items: [
      { category: "Stage & Decor", description: "Bohemian Driftwood Mandap, Fairy Light Canopy & Beach Lounges", cost: 180000 },
      { category: "Sound & Lighting", description: "Weatherproof Acoustic Audio, Warm Filament Lighting & Fire Pit", cost: 85000 },
      { category: "Cinematography", description: "Drone Sunset Flythroughs, Candid Photo & Cinematic Wedding Film", cost: 140000 },
      { category: "Catering & Bar", description: "Coastal Seafood & International Live BBQ (250 Guests @ ₹1,600/plate)", cost: 400000 },
      { category: "Logistics", description: "Airport Transfers Fleet Tracking & Guest Welcome Hospitality Pod", cost: 50000 },
    ],
  },
  {
    id: "corporate-summit",
    name: "Corporate Annual Summit & Gala",
    tag: "B2B Enterprise",
    icon: "solar:buildings-bold-duotone",
    defaultGuests: 600,
    location: "International Convention Centre, Nagpur",
    duration: "1 Day (Keynotes, Expo & Evening Awards Gala)",
    items: [
      { category: "Stage & Branding", description: "Dual Stage Arch, 40ft Watchout LED Backdrop & Keynote Podiums", cost: 140000 },
      { category: "AV & Broadcast", description: "Digital Podium, Wireless Lapels & Multi-Cam YouTube 4K Live Stream", cost: 130000 },
      { category: "Media Coverage", description: "Executive Portraits, Event Documentary & Press Kit Photography", cost: 75000 },
      { category: "Deluxe Hospitality", description: "Executive High-Tea & Multi-Cuisine Gala (600 Guests @ ₹950/plate)", cost: 570000 },
      { category: "PWA Check-in", description: "Barcode Badge Scanning, Offline Attendee Check-In & Lead Scanners", cost: 40000 },
    ],
  },
];

export function QuoteSimulator() {
  const shouldReduceMotion = useReducedMotion();
  const openModal = useAuthModalStore((state) => state.openModal);
  const addToast = useToastStore((state) => state.addToast);

  const [selectedPresetId, setSelectedPresetId] = useState<string>("royal-wedding");
  const [guestCount, setGuestCount] = useState<number>(500);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [showProposal, setShowProposal] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const currentPreset = EVENT_PRESETS.find((p) => p.id === selectedPresetId) || EVENT_PRESETS[0];

  // Calculate pricing
  const subtotal = currentPreset.items.reduce((sum, item) => sum + item.cost, 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const totalGst = cgst + sgst;
  const grandTotal = subtotal + totalGst;

  // Milestone schedule: 30% Booking, 50% Pre-Event, 20% Deliverables
  const milestoneAdvance = grandTotal * 0.3;
  const milestoneStage = grandTotal * 0.5;
  const milestoneFinal = grandTotal * 0.2;

  const handleSelectPreset = (preset: EventPreset) => {
    setSelectedPresetId(preset.id);
    setGuestCount(preset.defaultGuests);
    triggerQuickRegen();
  };

  const triggerQuickRegen = () => {
    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => {
      setGenerationStep(2);
    }, 350);

    setTimeout(() => {
      setGenerationStep(3);
    }, 700);

    setTimeout(() => {
      setIsGenerating(false);
      setShowProposal(true);
    }, 1050);
  };

  const handleCopyWhatsApp = () => {
    const text = `*EventOS Client Proposal*\n*Event:* ${currentPreset.name}\n*Venue:* ${currentPreset.location}\n*Guests:* ${guestCount}\n*Subtotal:* ₹${subtotal.toLocaleString("en-IN")}\n*GST (18%):* ₹${totalGst.toLocaleString("en-IN")}\n*Grand Total:* ₹${grandTotal.toLocaleString("en-IN")}\n*Advance (30%):* ₹${milestoneAdvance.toLocaleString("en-IN")}\n\nGenerated via EventOS (The Operating System for Event Businesses)`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      addToast("Proposal copied to clipboard! Ready to paste into WhatsApp.", "success");
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#FAF9F6] via-white to-purple-50/30 text-slate-900 relative overflow-hidden border-t border-slate-200/80">
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-purple-200/25 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Zap size={14} className="text-purple-600 animate-pulse" />
            <span>Interactive Simulator • 45-Second Proposal Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight">
            See how Indian agencies create{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600">
              GST-ready quotes in seconds
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            No more 3-hour Canva drafting or Excel formula mistakes. Pick an event preset below and watch EventOS auto-generate line items, 18% GST, and instant UPI milestone advances.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Preset Controls & Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-purple-500/5 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Step 1 · Choose Event Type
                </span>
                <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
                  <Flame size={12} className="text-amber-500" />
                  Real Indian Scenarios
                </span>
              </div>

              {/* Event Preset Pills */}
              <div className="grid grid-cols-1 gap-2.5">
                {EVENT_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? "bg-purple-50/90 border-purple-400 shadow-md shadow-purple-500/10"
                          : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                            isSelected
                              ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          <Icon icon={preset.icon} className="text-lg" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {preset.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {preset.duration}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-slate-500 border-slate-200"
                        }`}
                      >
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Guest Count Slider & Location Details */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-purple-600" />
                    Guest Capacity:
                  </span>
                  <span className="text-purple-700 font-mono font-extrabold text-sm">
                    {guestCount} Attendees
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[200, 350, 500, 800].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setGuestCount(num);
                        triggerQuickRegen();
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        guestCount === num
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Building size={13} className="text-purple-600 shrink-0" />
                    <span className="truncate">{currentPreset.location}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Auto-configured with 18% Indian GST (9% CGST + 9% SGST) and milestone invoices.
                  </p>
                </div>
              </div>

              {/* Trigger Generation Action */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={triggerQuickRegen}
                disabled={isGenerating}
                className="relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden group transition-all disabled:opacity-80"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap size={16} className={isGenerating ? "animate-spin" : "group-hover:rotate-12 transition-transform"} />
                  <span>{isGenerating ? "Generating Proposal..." : "⚡ Re-calculate 45-Sec Proposal"}</span>
                </span>
              </motion.button>
            </div>

            {/* Micro Benefit Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-tight">
                <strong>Zero GST Math Errors:</strong> Automatic split of CGST/SGST with pre-filled SAC codes for event production.
              </p>
            </div>
          </div>

          {/* Right Column: Realistic Live Proposal Document Preview */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-purple-500/10 p-6 sm:p-9 overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />

              {/* Generating Overlay Animation */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4"
                  >
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 animate-bounce">
                        <FileText size={28} />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500" />
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-extrabold text-slate-900 font-heading">
                        EventOS Proposal Engine Active
                      </h4>
                      <p className="text-xs text-purple-600 font-bold font-mono">
                        {generationStep === 1 && "⚙️ Auto-assembling 5 decor & AV line items..."}
                        {generationStep === 2 && "📑 Calculating 18% GST (9% CGST + 9% SGST)..."}
                        {generationStep >= 3 && "✨ Generating client-ready PDF & milestone schedule..."}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500"
                        initial={{ width: "10%" }}
                        animate={{ width: generationStep === 1 ? "40%" : generationStep === 2 ? "80%" : "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Proposal Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs font-heading">
                      OS
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                      Sutra Events & Productions
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    Nagpur & Mumbai • GSTIN: 27AABCS1429B1Z8
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    Verified Client Proposal
                  </span>
                  <div className="text-xs font-bold text-slate-700 font-mono">
                    Ref: EOS-{Math.floor(10000 + (selectedPresetId.charCodeAt(0) * 123))}-2026
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Proposal Meta Strip */}
              <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Event Details
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">{currentPreset.name}</span>
                  <span className="text-[11px] text-slate-500">{currentPreset.location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Client & Scope
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">Kapoor & Sharma Family</span>
                  <span className="text-[11px] text-slate-500">{guestCount} Expected Guests • {currentPreset.duration}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="pb-2.5">Scope Item</th>
                      <th className="pb-2.5">Category</th>
                      <th className="pb-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPreset.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pr-2">
                          <span className="font-bold text-slate-900 block">{item.description}</span>
                        </td>
                        <td className="py-2.5 text-slate-500 font-medium whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{item.cost.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & GST Calculation Box */}
              <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Subtotal (Net Event Production):</span>
                  <span className="font-mono">
                    <NumberTicker value={subtotal} prefix="₹" duration={500} />
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium text-[11px]">
                  <span>CGST (9%) + SGST (9%) Tax:</span>
                  <span className="font-mono">
                    <NumberTicker value={totalGst} prefix="₹" duration={500} />
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900 font-extrabold text-sm sm:text-base">
                  <span className="font-heading">Grand Total (Incl. 18% GST):</span>
                  <span className="font-mono text-purple-700 text-lg sm:text-xl font-black">
                    <NumberTicker value={grandTotal} prefix="₹" duration={500} />
                  </span>
                </div>
              </div>

              {/* Milestone Payment Schedule */}
              <div className="mt-5 p-4 rounded-2xl bg-purple-50/70 border border-purple-100/90 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-purple-900 font-heading flex items-center gap-1.5">
                    <QrCode size={14} className="text-purple-600" />
                    Automated Milestone Advances (UPI Enabled):
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-extrabold">
                    Zero Follow-up
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-purple-200/70 space-y-0.5">
                    <span className="font-extrabold text-slate-500 text-[10px] block uppercase">
                      30% Booking Advance
                    </span>
                    <span className="font-mono font-black text-slate-900 block text-xs">
                      <NumberTicker value={Math.round(milestoneAdvance)} prefix="₹" duration={500} />
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold">Locks Dates Instantly</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-200/70 space-y-0.5">
                    <span className="font-extrabold text-slate-500 text-[10px] block uppercase">
                      50% 7 Days Before
                    </span>
                    <span className="font-mono font-black text-slate-900 block text-xs">
                      <NumberTicker value={Math.round(milestoneStage)} prefix="₹" duration={500} />
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">Vendor Payouts</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-200/70 space-y-0.5">
                    <span className="font-extrabold text-slate-500 text-[10px] block uppercase">
                      20% Final Handover
                    </span>
                    <span className="font-mono font-black text-slate-900 block text-xs">
                      <NumberTicker value={Math.round(milestoneFinal)} prefix="₹" duration={500} />
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">On RAW Photos Delivery</span>
                  </div>
                </div>
              </div>

              {/* Instant Output Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy WhatsApp Proposal"}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Print or Save PDF"
                  >
                    <Printer size={14} />
                    <span className="hidden sm:inline">Print PDF</span>
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openModal("waitlist")}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Build With EventOS (50% Off)</span>
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
