"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Users,
  Utensils,
  Flower2,
  Tv,
  Save,
  Trash2,
  FolderOpen,
  AlertCircle,
  Building,
  Check,
  ArrowRight,
  Phone,
  Mail,
  User,
  FileText,
  CheckCircle2,
  Settings
} from "lucide-react";

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return "0";
  return val.toLocaleString("en-IN");
};

interface BudgetEstimate {
  id?: string;
  eventName: string;
  eventType: string;
  guestCount: number;
  decorStyle: string;
  venueType?: string;
  effectsList?: string;
  cateringTotal: number;
  decorTotal: number;
  venueTotal?: number;
  effectsTotal: number;
  grandTotal: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt?: string;
}

const CATEGORIES = [
  { key: "WEDDING", label: "Wedding Ceremony", icon: "💍", desc: "Premium wedding arrangements" },
  { key: "CORPORATE", label: "Corporate Summit", icon: "🏢", desc: "Professional summits and gala dinners" },
  { key: "ENGAGEMENT", label: "Engagement Gala", icon: "✨", desc: "Gala celebrations and family dinners" },
  { key: "BIRTHDAY", label: "Birthday Party", icon: "🎂", desc: "Private theme parties and birthdays" }
];

const VENUE_TYPES = [
  { key: "HOTEL", label: "5-Star Hotel", icon: "🏨", desc: "Luxury ballrooms & stellar services" },
  { key: "HALL", label: "Banquet Hall", icon: "🏛️", desc: "Standard indoor event halls" },
  { key: "GARDEN", label: "Open Garden / Lawn", icon: "🌳", desc: "Stunning outdoor natural setup" },
  { key: "RESORT", label: "Premium Resort", icon: "🏖️", desc: "Destination celebration & stays" },
  { key: "BEACH", label: "Beach Side", icon: "🌊", desc: "Scenic coastal setup & sea view" }
];

const DECOR_STYLES = [
  { key: "STANDARD", label: "Standard Simple", desc: "Classic floral backdrops & standard lighting" },
  { key: "PREMIUM", label: "Premium Theme", desc: "Custom theme styling, entry arch & ceiling decor" },
  { key: "ROYAL", label: "Royal Luxury", desc: "Exotic imported flowers, ambient LED & signature layouts" }
];

const EFFECTS = [
  { key: "COLD_PYRO", label: "Cold Pyro Sparklers", desc: "4 sparkler boxes for entry/stages" },
  { key: "DRY_ICE", label: "Dry Ice Low Fog", desc: "Clouds effect for stage/dances" },
  { key: "LASER_SHOW", label: "Concert Laser Lights", desc: "Dual RGB animation lasers" },
  { key: "LED_WALL", label: "LED Video Wall Display", desc: "12x8 ft high resolution panel" }
];

// Fallback lookup functions
const getPlateCostFallback = (type: string) => {
  switch (type.toUpperCase()) {
    case "WEDDING": return 1200;
    case "CORPORATE": return 850;
    case "ENGAGEMENT": return 900;
    case "BIRTHDAY": return 500;
    default: return 600;
  }
};

const getVenueCostFallback = (type: string) => {
  switch (type.toUpperCase()) {
    case "HOTEL": return 100000;
    case "HALL": return 60000;
    case "GARDEN": return 80000;
    case "RESORT": return 150000;
    case "BEACH": return 120000;
    default: return 60000;
  }
};

const getDecorCostFallback = (style: string) => {
  switch (style.toUpperCase()) {
    case "STANDARD": return 50000;
    case "PREMIUM": return 150000;
    case "ROYAL": return 350000;
    default: return 50000;
  }
};

const getEffectFeeFallback = (effect: string) => {
  switch (effect.toUpperCase()) {
    case "COLD_PYRO": return 15000;
    case "DRY_ICE": return 8000;
    case "LASER_SHOW": return 25000;
    case "LED_WALL": return 40000;
    default: return 0;
  }
};

export default function BudgetCalculatorPage() {
  const queryClient = useQueryClient();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0); // For sliding animations

  // Inputs State
  const [eventName, setEventName] = useState("Annual Gala");
  const [eventType, setEventType] = useState("WEDDING");
  const [guestCount, setGuestCount] = useState(150);
  const [venueType, setVenueType] = useState("HOTEL");
  const [decorStyle, setDecorStyle] = useState("PREMIUM");
  const [selectedEffects, setSelectedEffects] = useState<string[]>(["COLD_PYRO", "DRY_ICE"]);
  
  // Client Contact Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  
  // Promotional IDs
  const [lastSavedEstimate, setLastSavedEstimate] = useState<BudgetEstimate | null>(null);
  const [leadCreatedData, setLeadCreatedData] = useState<any>(null);
  const [quoteCreatedData, setQuoteCreatedData] = useState<any>(null);

  // Live Math State (Instant results)
  const [cateringSum, setCateringSum] = useState(0);
  const [venueSum, setVenueSum] = useState(0);
  const [decorSum, setDecorSum] = useState(0);
  const [effectsSum, setEffectsSum] = useState(0);
  const [totalSum, setTotalSum] = useState(0);

  // 1. Fetch Configurable Pricing Rules
  const { data: pricingRulesResponse } = useQuery<{ data: any[] }>({
    queryKey: ["pricingRules"],
    queryFn: async () => {
      const response = await api.get("/events/calculator/pricing-rules");
      return response.data;
    }
  });

  const pricingRules = pricingRulesResponse?.data || [];

  const getPrice = (category: string, ruleKey: string, fallback: number) => {
    const rule = pricingRules.find(
      (r) => r.category === category && r.ruleKey.toUpperCase() === ruleKey.toUpperCase()
    );
    return rule ? rule.basePrice : fallback;
  };

  // 2. Fetch Saved Estimates
  const { data: estimatesResponse, isLoading: listLoading } = useQuery<{ data: BudgetEstimate[] }>({
    queryKey: ["budgetEstimates"],
    queryFn: async () => {
      const response = await api.get("/events/calculator");
      return response.data;
    }
  });

  const estimates = estimatesResponse?.data || [];

  // Live calculation hook
  useEffect(() => {
    const plateCost = getPrice("EVENT_TYPE", eventType, getPlateCostFallback(eventType));
    const catTotal = plateCost * guestCount;

    const venCost = getPrice("VENUE_TYPE", venueType, getVenueCostFallback(venueType));
    const decTotal = getPrice("DECOR_STYLE", decorStyle, getDecorCostFallback(decorStyle));

    const effTotal = selectedEffects.reduce((sum, key) => {
      const cost = getPrice("ADD_ON", key, getEffectFeeFallback(key));
      return sum + cost;
    }, 0);

    setCateringSum(catTotal);
    setVenueSum(venCost);
    setDecorSum(decTotal);
    setEffectsSum(effTotal);
    setTotalSum(catTotal + venCost + decTotal + effTotal);
  }, [eventType, guestCount, venueType, decorStyle, selectedEffects, pricingRules]);

  // Mutations
  const saveEstimateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/events/calculator", payload);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["budgetEstimates"] });
      setLastSavedEstimate(res.data);
      setSuccessText("Budget plan successfully cataloged and locked!");
      setErrorText("");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to save estimate.");
    }
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/events/calculator/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetEstimates"] });
      if (lastSavedEstimate?.id) {
        setLastSavedEstimate(null);
        setLeadCreatedData(null);
        setQuoteCreatedData(null);
      }
    }
  });

  const convertToLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/events/calculator/${id}/convert-to-lead`);
      return response.data;
    },
    onSuccess: (res) => {
      setLeadCreatedData(res.data);
      setSuccessText("Estimate promoted to active CRM Lead successfully!");
      setErrorText("");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to promote to Lead.");
    }
  });

  const generateQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/events/calculator/${id}/generate-quote`);
      return response.data;
    },
    onSuccess: (res) => {
      setQuoteCreatedData(res.data);
      setSuccessText("High-fidelity proposal Quote provisioned from Estimate!");
      setErrorText("");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to generate Quote.");
    }
  });

  const handleNext = () => {
    if (currentStep < 6) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEffectToggle = (key: string) => {
    if (selectedEffects.includes(key)) {
      setSelectedEffects(selectedEffects.filter((e) => e !== key));
    } else {
      setSelectedEffects([...selectedEffects, key]);
    }
  };

  const handleSave = () => {
    setErrorText("");
    setSuccessText("");

    if (!eventName.trim()) {
      setErrorText("A unique budget estimate name is required.");
      return;
    }

    saveEstimateMutation.mutate({
      eventName,
      eventType,
      guestCount,
      decorStyle,
      venueType,
      effectsList: selectedEffects,
      clientName,
      clientEmail,
      clientPhone
    });
  };

  const handleLoadEstimate = (est: BudgetEstimate) => {
    setEventName(est.eventName);
    setEventType(est.eventType);
    setGuestCount(est.guestCount);
    setDecorStyle(est.decorStyle);
    setVenueType(est.venueType || "HOTEL");
    setClientName(est.clientName || "");
    setClientEmail(est.clientEmail || "");
    setClientPhone(est.clientPhone || "");
    
    if (est.effectsList) {
      setSelectedEffects(est.effectsList.split(",").filter((s) => s.length > 0));
    } else {
      setSelectedEffects([]);
    }

    setLastSavedEstimate(est);
    setLeadCreatedData(null);
    setQuoteCreatedData(null);
    setCurrentStep(6);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 80 : -80,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-850 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="h-8 w-8 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-750"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white">EventOS</span>
            <span className="text-xs px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold rounded">Budget Calculator</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/crm")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:bg-zinc-800/60 rounded-lg text-[11px] font-semibold transition-all text-zinc-400 hover:text-white"
          >
            <Settings size={13} />
            Back Office CRM
          </button>
        </div>
      </nav>

      {/* Progress Indicator */}
      <div className="w-full bg-zinc-900/40 h-1.5 relative border-b border-zinc-850">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Wizard Steps */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Step Header */}
          <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-850 pb-3">
            <span className="uppercase font-bold tracking-wider text-[10px]">
              Step {currentStep} of 6 : {
                currentStep === 1 ? "Select Event Type" :
                currentStep === 2 ? "Set Guest Count" :
                currentStep === 3 ? "Pick Venue Category" :
                currentStep === 4 ? "Select Decor Tier" :
                currentStep === 5 ? "Special Effects Add-ons" :
                "Estimated Proposal Summary"
              }
            </span>
            <span className="font-mono text-zinc-500 font-bold">
              {Math.round((currentStep / 6) * 100)}% Complete
            </span>
          </div>

          <div className="min-h-[360px] relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Step 1: Event Type */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        What category of event are we planning?
                      </h2>
                      <p className="text-zinc-500 text-xs">Different event profiles apply varying food & catering per-plate base multipliers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CATEGORIES.map((cat) => {
                        const active = eventType === cat.key;
                        const rate = getPrice("EVENT_TYPE", cat.key, getPlateCostFallback(cat.key));
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setEventType(cat.key)}
                            className={`p-5 border rounded-xl text-left flex items-start gap-4 transition-all ${
                              active
                                ? "border-purple-500 bg-purple-500/5 text-purple-400"
                                : "border-zinc-850 bg-[#161618]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]/50"
                            }`}
                          >
                            <span className="text-3xl p-2 bg-zinc-800/40 rounded-lg">{cat.icon}</span>
                            <div className="space-y-1">
                              <span className="font-bold text-xs text-zinc-250 block">{cat.label}</span>
                              <span className="text-[10px] text-zinc-500 block leading-normal">{cat.desc}</span>
                              <span className="text-[10px] font-mono font-bold text-zinc-300 block pt-1">
                                Est. INR {formatCurrency(rate)} / Guest Plate
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Guest Count */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white">How many guests are we expecting?</h2>
                      <p className="text-zinc-500 text-xs">Catering services scale linearly based on the exact size of the guest roster.</p>
                    </div>

                    <div className="p-6 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-6 flex flex-col items-center">
                      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2 font-mono font-extrabold text-lg text-purple-400 w-full max-w-[200px] justify-center">
                        <Users size={18} className="text-zinc-500" />
                        <input
                          type="number"
                          value={guestCount}
                          min="10"
                          max="2000"
                          onChange={(e) => setGuestCount(Math.max(10, parseInt(e.target.value) || 10))}
                          className="bg-transparent text-center focus:outline-none w-20"
                        />
                        <span className="text-xs text-zinc-500">Plates</span>
                      </div>

                      <div className="w-full space-y-2">
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={guestCount}
                          onChange={(e) => setGuestCount(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>10 Guests</span>
                          <span>500 Guests</span>
                          <span>1000+ Guests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Venue Type */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white">What type of venue do you envision?</h2>
                      <p className="text-zinc-500 text-xs">Venues configure a base flat lease rate including setup space preparation constraints.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {VENUE_TYPES.map((venue) => {
                        const active = venueType === venue.key;
                        const cost = getPrice("VENUE_TYPE", venue.key, getVenueCostFallback(venue.key));
                        return (
                          <button
                            key={venue.key}
                            type="button"
                            onClick={() => setVenueType(venue.key)}
                            className={`p-5 border rounded-xl text-left flex items-start gap-4 transition-all ${
                              active
                                ? "border-purple-500 bg-purple-500/5 text-purple-400"
                                : "border-zinc-850 bg-[#161618]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]/50"
                            }`}
                          >
                            <span className="text-3xl p-2 bg-zinc-800/40 rounded-lg">{venue.icon}</span>
                            <div className="space-y-1">
                              <span className="font-bold text-xs text-zinc-250 block">{venue.label}</span>
                              <span className="text-[10px] text-zinc-500 block leading-normal">{venue.desc}</span>
                              <span className="text-[10px] font-mono font-bold text-zinc-300 block pt-1">
                                Flat Rate: INR {formatCurrency(cost)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Decor Style */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white">Choose the level of decoration</h2>
                      <p className="text-zinc-500 text-xs">Setups span from minimalistic floral banners to full immersive luxury floral design packages.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {DECOR_STYLES.map((style) => {
                        const active = decorStyle === style.key;
                        const cost = getPrice("DECOR_STYLE", style.key, getDecorCostFallback(style.key));
                        return (
                          <button
                            key={style.key}
                            type="button"
                            onClick={() => setDecorStyle(style.key)}
                            className={`p-5 border rounded-xl text-left flex items-center justify-between transition-all ${
                              active
                                ? "border-purple-500 bg-purple-500/5 text-purple-400"
                                : "border-zinc-850 bg-[#161618]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]/50"
                            }`}
                          >
                            <div className="space-y-1 max-w-md">
                              <span className="font-bold text-xs text-zinc-250 block">{style.label}</span>
                              <span className="text-[10px] text-zinc-500 block leading-normal">{style.desc}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-extrabold text-zinc-200 block">
                                INR {formatCurrency(cost)}
                              </span>
                              {active && <span className="text-[9px] uppercase font-bold text-purple-400 block mt-1">Selected Style</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5: Special Effects */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white">Include operational special effects add-ons</h2>
                      <p className="text-zinc-500 text-xs">Elevate client engagement with premium stage setups, laser displays, and visual feeds.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {EFFECTS.map((eff) => {
                        const active = selectedEffects.includes(eff.key);
                        const cost = getPrice("ADD_ON", eff.key, getEffectFeeFallback(eff.key));
                        return (
                          <div
                            key={eff.key}
                            onClick={() => handleEffectToggle(eff.key)}
                            className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all select-none ${
                              active ? "border-purple-500 bg-purple-500/5 text-purple-400" : "border-zinc-850 bg-[#161618]/30 text-zinc-450 hover:bg-[#161618]/50"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="font-bold text-xs text-zinc-200 block">{eff.label}</span>
                              <span className="text-[10px] text-zinc-500 block leading-normal">{eff.desc}</span>
                              <span className="text-[10px] font-mono font-bold text-zinc-300 block pt-1">
                                +INR {formatCurrency(cost)}
                              </span>
                            </div>
                            <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                              active ? "bg-purple-600 border-purple-500 text-white" : "border-zinc-700 bg-zinc-900"
                            }`}>
                              {active && <Check size={12} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 6: Budget Estimate Summary */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="text-purple-400" size={18} />
                        Your Event Budget Estimate
                      </h2>
                      <p className="text-zinc-500 text-xs">Verify your metrics and enter contact details to catalog this plan or promote it to a CRM Lead/Proposal.</p>
                    </div>

                    {/* Banners */}
                    {errorText && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>{errorText}</span>
                      </div>
                    )}

                    {successText && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-450 rounded-lg flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        <span>{successText}</span>
                      </div>
                    )}

                    {/* Contact details capture */}
                    <div className="p-5 border border-zinc-850 bg-[#161618]/30 rounded-xl space-y-4 text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 border-b border-zinc-850 pb-2">Client Contact Information</h4>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-zinc-500 font-semibold flex items-center gap-1">
                              <User size={12} /> Client Name
                            </label>
                            <input
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="e.g. Alice Sethi"
                              className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-650 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-zinc-500 font-semibold flex items-center gap-1">
                              <FileText size={12} /> Estimate Title
                            </label>
                            <input
                              type="text"
                              value={eventName}
                              onChange={(e) => setEventName(e.target.value)}
                              placeholder="e.g. Sethi Wedding Budget Plan"
                              className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-650 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-zinc-500 font-semibold flex items-center gap-1">
                              <Mail size={12} /> Email Address
                            </label>
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="e.g. alice@sethi.com"
                              className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-650 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-zinc-500 font-semibold flex items-center gap-1">
                              <Phone size={12} /> Phone Number
                            </label>
                            <input
                              type="text"
                              value={clientPhone}
                              onChange={(e) => setClientPhone(e.target.value)}
                              placeholder="e.g. +91 99999 88888"
                              className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-650 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Promo integrations */}
                      <div className="pt-2 flex flex-wrap gap-3">
                        <button
                          onClick={handleSave}
                          disabled={saveEstimateMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                        >
                          <Save size={13} />
                          {lastSavedEstimate ? "Update Saved Estimate" : "Save Estimate Plan"}
                        </button>

                        {lastSavedEstimate && (
                          <>
                            {leadCreatedData ? (
                              <button
                                onClick={() => (window.location.href = "/crm")}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Check size={13} />
                                View CRM Lead
                              </button>
                            ) : (
                              <button
                                onClick={() => lastSavedEstimate.id && convertToLeadMutation.mutate(lastSavedEstimate.id)}
                                disabled={convertToLeadMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1B4B] hover:bg-[#312E81] text-indigo-300 border border-indigo-800 rounded-lg text-xs font-semibold transition-all"
                              >
                                {convertToLeadMutation.isPending ? "Converting..." : "Promote to CRM Lead"}
                              </button>
                            )}

                            {quoteCreatedData ? (
                              <button
                                onClick={() => (window.location.href = `/quotes/${quoteCreatedData.id}`)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-650/10 hover:bg-emerald-650/20 text-emerald-450 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Check size={13} />
                                Edit Quote proposal
                              </button>
                            ) : (
                              <button
                                onClick={() => lastSavedEstimate.id && generateQuoteMutation.mutate(lastSavedEstimate.id)}
                                disabled={generateQuoteMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#064E3B] hover:bg-[#065F46] text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold transition-all"
                              >
                                {generateQuoteMutation.isPending ? "Generating..." : "Generate Quote Proposal"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center border-t border-zinc-850 pt-5">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-1 px-4 py-2 border border-zinc-800 hover:bg-zinc-800/60 disabled:opacity-40 rounded-lg text-xs font-semibold transition-all text-zinc-400 hover:text-white"
            >
              Back
            </button>

            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
              >
                Next Step
                <ArrowRight size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Right Side: Live calculation breakdown card & saved lists */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Real-time Calculation Panel */}
          <div className="p-6 border border-zinc-850 bg-[#161618]/50 rounded-xl space-y-5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2 flex items-center gap-2">
              <Sparkles size={13} className="text-purple-400 animate-pulse" />
              Live Calculations
            </h3>

            <div className="space-y-4 text-xs">
              {/* Catering */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Utensils size={12} className="text-zinc-500" />
                    Catering ({guestCount} guests)
                  </span>
                  <span className="font-mono font-bold text-zinc-250">
                    INR {formatCurrency(cateringSum)}
                  </span>
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Building size={12} className="text-zinc-500" />
                    Venue ({venueType})
                  </span>
                  <span className="font-mono font-bold text-zinc-250">
                    INR {formatCurrency(venueSum)}
                  </span>
                </div>
              </div>

              {/* Decor */}
              <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Flower2 size={12} className="text-zinc-500" />
                    Decor ({decorStyle})
                  </span>
                  <span className="font-mono font-bold text-zinc-250">
                    INR {formatCurrency(decorSum)}
                  </span>
                </div>
              </div>

              {/* Special Effects */}
              <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Tv size={12} className="text-zinc-500" />
                    Effects ({selectedEffects.length} items)
                  </span>
                  <span className="font-mono font-bold text-zinc-250">
                    INR {formatCurrency(effectsSum)}
                  </span>
                </div>
              </div>

              {/* Estimated Budget */}
              <div className="flex justify-between items-center border-t border-zinc-800/80 pt-4 text-xs font-extrabold">
                <span className="text-zinc-300">Total Estimate</span>
                <span className="font-mono text-emerald-400 text-sm tracking-tight">
                  INR {formatCurrency(totalSum)}
                </span>
              </div>
            </div>
          </div>

          {/* Saved Plans List */}
          <div className="p-6 border border-zinc-850 bg-[#111113]/40 rounded-xl space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2 flex items-center gap-2">
              <FolderOpen size={13} className="text-purple-400" />
              Saved Plans
            </h3>

            {listLoading ? (
              <div className="text-center text-zinc-650 animate-pulse py-2 text-[11px] italic">
                Loading saved estimates...
              </div>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {estimates.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => handleLoadEstimate(est)}
                    className="p-3 rounded-lg border border-zinc-850 bg-[#161618]/40 flex justify-between items-center hover:border-purple-500/20 transition-all cursor-pointer group"
                  >
                    <div className="space-y-0.5 max-w-[160px]">
                      <h4 className="font-bold text-[11px] text-zinc-300 group-hover:text-purple-400 transition-colors truncate">
                        {est.eventName}
                      </h4>
                      <span className="text-[9px] text-zinc-500 block truncate">
                        {est.eventType} • {est.guestCount} guests
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-450 block pt-0.5">
                        INR {formatCurrency(est.grandTotal)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (est.id) deleteEstimateMutation.mutate(est.id);
                      }}
                      className="h-6 w-6 rounded bg-zinc-850 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-500 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Delete saved estimate"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {estimates.length === 0 && (
                  <p className="text-zinc-600 text-center py-4 text-[10px] italic">No saved plans found.</p>
                )}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
