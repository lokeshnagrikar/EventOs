"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
  Phone,
  Mail,
  User,
  FileText,
  CheckCircle2,
  Settings,
  ChevronUp,
  ChevronDown,
  Crown,
  Building2,
  PartyPopper,
  Hotel,
  Landmark,
  Palmtree,
  Waves,
  Palette,
  Flame,
  CloudFog,
  Zap,
  Calculator,
  TrendingUp,
  Printer,
  Compass,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toastStore";

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

interface CategoryOption {
  key: string;
  label: string;
  badge: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  desc: string;
  highlights: string[];
}

const CATEGORIES: CategoryOption[] = [
  {
    key: "WEDDING",
    label: "Wedding Ceremony & Reception",
    badge: "Most Popular",
    icon: Crown,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    desc: "Grand matrimonial celebration with multi-course banquet dining and luxury arrangements.",
    highlights: ["Multi-course Dining", "Ceremonial Stage", "Hospitality Management"]
  },
  {
    key: "CORPORATE",
    label: "Corporate Summit & Gala",
    badge: "Enterprise",
    icon: Building2,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/30",
    desc: "High-impact annual conferences, executive dinners, awards and product launches.",
    highlights: ["AV Keynote Audio", "Executive Buffet", "Branded Networking Lounge"]
  },
  {
    key: "ENGAGEMENT",
    label: "Engagement Gala & Sangeet",
    badge: "Celebratory",
    icon: Sparkles,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/30",
    desc: "High-energy musical night, ring ceremony, cocktail spread and family festivities.",
    highlights: ["Live Sound & DJ", "Cocktail Appetizers", "Dancefloor Lighting"]
  },
  {
    key: "BIRTHDAY",
    label: "Milestone Birthday / Social",
    badge: "Social Event",
    icon: PartyPopper,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
    desc: "Vibrant birthday parties, family anniversaries, and custom-themed gatherings.",
    highlights: ["Theme Mocktails", "Dessert Counter", "Photo Booth Setup"]
  }
];

interface VenueOption {
  key: string;
  label: string;
  badge: string;
  icon: React.ElementType;
  iconColor: string;
  desc: string;
  amenities: string[];
}

const VENUE_TYPES: VenueOption[] = [
  {
    key: "HOTEL",
    label: "5-Star Luxury Hotel",
    badge: "Luxury Indoor",
    icon: Hotel,
    iconColor: "text-purple-400",
    desc: "Grand acoustic ballroom with valet parking, guest rooms, and premium hotel catering crew.",
    amenities: ["Central HVAC", "Valet Parking", "In-house Hospitality"]
  },
  {
    key: "HALL",
    label: "Convention / Banquet Hall",
    badge: "Standard Indoor",
    icon: Landmark,
    iconColor: "text-indigo-400",
    desc: "Spacious column-free banqueting space with dedicated stage platform and dining pavilion.",
    amenities: ["Column-free Hall", "Stage Framework", "Separate Dining Area"]
  },
  {
    key: "GARDEN",
    label: "Open Garden / Royal Lawn",
    badge: "Outdoor Ambience",
    icon: Palmtree,
    iconColor: "text-emerald-400",
    desc: "Breathtaking manicured grass lawns under open skies with custom canopy structures.",
    amenities: ["Natural Greenery", "Drone Friendly", "Fairy Light Canopy"]
  },
  {
    key: "RESORT",
    label: "Destination Heritage Resort",
    badge: "Destination",
    icon: Compass,
    iconColor: "text-amber-400",
    desc: "Palatial weekend destination with cottages, poolside decks, and scenic banquet spaces.",
    amenities: ["Guest Stays Included", "Poolside Deck", "Private Lawns"]
  },
  {
    key: "BEACH",
    label: "Private Coastal Beachfront",
    badge: "Scenic Exclusive",
    icon: Waves,
    iconColor: "text-cyan-400",
    desc: "Idyllic sea-facing venue with coastal breeze, sunset canopy, and ocean view dinner.",
    amenities: ["Sunset View", "Coastal Breeze", "Open Air Concert Sound"]
  }
];

interface DecorTier {
  key: string;
  label: string;
  badge: string;
  icon: React.ElementType;
  desc: string;
  features: string[];
}

const DECOR_STYLES: DecorTier[] = [
  {
    key: "STANDARD",
    label: "Classic Contemporary",
    badge: "Essential Package",
    icon: Palette,
    desc: "Sophisticated minimalist styling focusing on clean lines, floral highlights, and soft ambient illumination.",
    features: [
      "Custom Fabric & Floral Backdrop",
      "Standard LED Warm Ambience Lighting",
      "Fresh Floral Table Runners",
      "Entryway Welcome Easel & Arch"
    ]
  },
  {
    key: "PREMIUM",
    label: "Immersive Thematic Design",
    badge: "Recommended",
    icon: Sparkles,
    desc: "Complete venue transformation with geometric tunnel entrance, crystal ceiling hangings, and designer truss styling.",
    features: [
      "Signature 3D Thematic Stage Structure",
      "Grand Illumination Tunnel Entrance",
      "Ceiling Fairy Lights & Crystal Drapes",
      "VIP Lounge Furniture & Themed Photobooth"
    ]
  },
  {
    key: "ROYAL",
    label: "Ultra-Luxury Royal Heritage",
    badge: "Couture Luxe",
    icon: Crown,
    desc: "Monumental architectural sets, exotic imported Dutch florals, intelligent moving lights, and royal bridal walkways.",
    features: [
      "Imported Exotic Orchid & Rose Installations",
      "Architectural Palace Facade & Hydraulic Stage",
      "Concert-Grade Moving Head Light Truss",
      "Full Mirror Runway Walkway & VIP Pods"
    ]
  }
];

interface EffectItem {
  key: string;
  label: string;
  tag: string;
  icon: React.ElementType;
  iconColor: string;
  desc: string;
}

const EFFECTS: EffectItem[] = [
  {
    key: "COLD_PYRO",
    label: "Cold Pyro Sparklers",
    tag: "Entry & Stage",
    icon: Flame,
    iconColor: "text-amber-400",
    desc: "4 sparkler firing stations with non-hazardous zero-smoke indoor fireworks."
  },
  {
    key: "DRY_ICE",
    label: "Dry Ice Low-Fog Cloud",
    tag: "Bridal & Dance",
    icon: CloudFog,
    iconColor: "text-cyan-400",
    desc: "Dense ground-hugging dry ice clouds for stage entrances and first dance moments."
  },
  {
    key: "LASER_SHOW",
    label: "Concert Laser Light Array",
    tag: "High Energy",
    icon: Zap,
    iconColor: "text-purple-400",
    desc: "Dual high-powered RGB concert animation lasers programmed to music beats."
  },
  {
    key: "LED_WALL",
    label: "High-Res LED Video Wall",
    tag: "Visual AV",
    icon: Tv,
    iconColor: "text-emerald-400",
    desc: "Seamless 12x8 ft P3 high-definition digital display for live feeds and visuals."
  }
];

// Fallback pricing functions
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

const WIZARD_STEPS = [
  { step: 1, label: "Event Type", subtitle: "Category & Scope" },
  { step: 2, label: "Guest Capacity", subtitle: "Catering Roster" },
  { step: 3, label: "Venue Selection", subtitle: "Space Architecture" },
  { step: 4, label: "Decor & Styling", subtitle: "Visual Ambience" },
  { step: 5, label: "Special Effects", subtitle: "AV & SFX Add-ons" },
  { step: 6, label: "Executive Summary", subtitle: "Proposal & Quotation" }
];

export default function BudgetCalculatorPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Inputs State (clean initial empty state)
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [venueType, setVenueType] = useState("");
  const [decorStyle, setDecorStyle] = useState("");
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);

  // Client Contact Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  // Promotional / Saved IDs
  const [lastSavedEstimate, setLastSavedEstimate] = useState<BudgetEstimate | null>(null);
  const [leadCreatedData, setLeadCreatedData] = useState<any>(null);
  const [quoteCreatedData, setQuoteCreatedData] = useState<any>(null);

  // Live Math State
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
    const plateCost = eventType ? getPrice("EVENT_TYPE", eventType, getPlateCostFallback(eventType)) : 0;
    const catTotal = plateCost * (guestCount || 0);

    const venCost = venueType ? getPrice("VENUE_TYPE", venueType, getVenueCostFallback(venueType)) : 0;
    const decTotal = decorStyle ? getPrice("DECOR_STYLE", decorStyle, getDecorCostFallback(decorStyle)) : 0;

    const effTotal = selectedEffects.reduce((sum, key) => {
      const cost = getPrice("ADD_ON", key, getEffectFeeFallback(key));
      return sum + cost;
    }, 0);

    setCateringSum(catTotal);
    setVenueSum(venCost);
    setDecorSum(decTotal);
    setEffectsSum(effTotal);
    const sub = catTotal + venCost + decTotal + effTotal;
    const gst = Math.round(sub * 0.18);
    setTotalSum(sub + gst);
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
      setSuccessText("Budget Estimate saved to workspace successfully!");
      addToast("Estimate saved to workspace ledger!", "success");
      setErrorText("");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to save estimate.");
    }
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/calculator/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetEstimates"] });
      addToast("Estimate plan deleted.", "info");
      if (lastSavedEstimate) setLastSavedEstimate(null);
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
      addToast("Promoted to CRM Lead!", "success");
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
      setSuccessText("Official Quote proposal provisioned from Estimate!");
      addToast("Quote proposal generated!", "success");
      setErrorText("");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to generate Quote.");
    }
  });

  const handleNext = () => {
    if (currentStep === 1 && !eventType) {
      setErrorText("Please select an event type to proceed.");
      return;
    }
    if (currentStep === 2 && guestCount <= 0) {
      setGuestCount(100);
    }
    setErrorText("");
    if (currentStep < 6) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setErrorText("");
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

  // Quick Preset Handlers
  const handleApplyPreset = (preset: "wedding" | "corporate" | "engagement") => {
    if (preset === "wedding") {
      setEventName("Royal Destination Wedding");
      setEventType("WEDDING");
      setGuestCount(250);
      setVenueType("HOTEL");
      setDecorStyle("ROYAL");
      setSelectedEffects(["COLD_PYRO", "DRY_ICE"]);
      addToast("Loaded 'Royal Destination Wedding' preset!", "success");
    } else if (preset === "corporate") {
      setEventName("Enterprise Tech Summit & Gala");
      setEventType("CORPORATE");
      setGuestCount(300);
      setVenueType("HALL");
      setDecorStyle("PREMIUM");
      setSelectedEffects(["LED_WALL", "LASER_SHOW"]);
      addToast("Loaded 'Enterprise Tech Summit' preset!", "success");
    } else if (preset === "engagement") {
      setEventName("Sunset Sangeet & Cocktail");
      setEventType("ENGAGEMENT");
      setGuestCount(120);
      setVenueType("BEACH");
      setDecorStyle("PREMIUM");
      setSelectedEffects(["COLD_PYRO"]);
      addToast("Loaded 'Sunset Sangeet' preset!", "success");
    }
    setErrorText("");
  };

  const handleSave = () => {
    setErrorText("");
    setSuccessText("");

    if (!eventName.trim()) {
      setErrorText("Please provide an event name or estimate title.");
      return;
    }

    const payload = {
      eventName,
      eventType: eventType || "WEDDING",
      guestCount: guestCount || 100,
      venueType: venueType || "HOTEL",
      decorStyle: decorStyle || "STANDARD",
      effectsList: selectedEffects.join(","),
      cateringTotal: cateringSum,
      venueTotal: venueSum,
      decorTotal: decorSum,
      effectsTotal: effectsSum,
      grandTotal: totalSum,
      clientName: clientName.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined
    };

    saveEstimateMutation.mutate(payload);
  };

  const handleLoadEstimate = (est: BudgetEstimate) => {
    setEventName(est.eventName || "");
    setEventType(est.eventType || "WEDDING");
    setGuestCount(est.guestCount || 100);
    setVenueType(est.venueType || "HOTEL");
    setDecorStyle(est.decorStyle || "STANDARD");
    setSelectedEffects(est.effectsList ? est.effectsList.split(",").map((s) => s.trim()) : []);
    setClientName(est.clientName || "");
    setClientEmail(est.clientEmail || "");
    setClientPhone(est.clientPhone || "");
    setLastSavedEstimate(est);
    setSuccessText(`Loaded plan: "${est.eventName}"`);
    setErrorText("");
    addToast(`Loaded estimate plan "${est.eventName}"`, "info");
  };

  const handleResetCalculator = () => {
    setEventName("");
    setEventType("");
    setGuestCount(0);
    setVenueType("");
    setDecorStyle("");
    setSelectedEffects([]);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setLastSavedEstimate(null);
    setCurrentStep(1);
    setErrorText("");
    setSuccessText("");
    addToast("Calculator reset to initial state.", "info");
  };

  const hasSelections = !!eventType || guestCount > 0 || !!venueType || !!decorStyle || selectedEffects.length > 0;
  const costPerGuest = guestCount > 0 && totalSum > 0 ? Math.round(totalSum / guestCount) : 0;

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 40 : -40,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-purple-500/30">
      
      {/* Top Professional Navigation Bar */}
      <nav className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-850 rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
              <Calculator size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">EventOS</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold rounded-full font-mono uppercase tracking-wider">
                  Estimation Engine
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:block">Automated Per-Plate & Production Budgeting</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {hasSelections && (
            <button
              onClick={handleResetCalculator}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            onClick={() => router.push("/crm")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-800 hover:border-purple-500/30 hover:bg-purple-500/10 rounded-xl text-xs font-semibold transition text-zinc-300 hover:text-purple-300 cursor-pointer"
          >
            <Settings size={13} />
            <span className="hidden sm:inline">CRM Workspace</span>
          </button>
        </div>
      </nav>

      {/* Step Breadcrumb Progress Strip */}
      <div className="bg-zinc-950/90 border-b border-zinc-850/80 px-6 py-3 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[720px] gap-2">
          {WIZARD_STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <button
                key={s.step}
                onClick={() => {
                  if (s.step < currentStep || (s.step === 2 && eventType)) {
                    setDirection(s.step > currentStep ? 1 : -1);
                    setCurrentStep(s.step);
                  }
                }}
                disabled={s.step > currentStep && !eventType}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition text-left cursor-pointer ${
                  isCurrent
                    ? "bg-purple-600/15 border border-purple-500/40 text-white shadow-sm"
                    : isCompleted
                    ? "text-zinc-300 hover:bg-zinc-900"
                    : "text-zinc-600 cursor-not-allowed opacity-60"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 transition ${
                    isCurrent
                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/50"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : s.step}
                </div>
                <div>
                  <div className={`text-xs font-bold leading-tight ${isCurrent ? "text-purple-300" : ""}`}>
                    {s.label}
                  </div>
                  <div className="text-[9px] text-zinc-500 leading-none mt-0.5 font-medium">{s.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-28 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Wizard Interactive Steps */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Step Indicator & Guidance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-400">
                Step {currentStep} of 6
              </span>
              <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
                {currentStep === 1 && "Select Event Classification"}
                {currentStep === 2 && "Guest Attendance & Catering Scale"}
                {currentStep === 3 && "Venue Infrastructure & Space Tier"}
                {currentStep === 4 && "Thematic Decor & Ambience Styling"}
                {currentStep === 5 && "Special Effects & Audio-Visual Add-ons"}
                {currentStep === 6 && "Executive Estimation & Client Proposal"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                {Math.round((currentStep / 6) * 100)}% Complete
              </span>
            </div>
          </div>

          {/* Step 1 Quick Presets Bar */}
          {currentStep === 1 && (
            <div className="p-4 bg-gradient-to-r from-purple-950/30 via-zinc-900/50 to-zinc-900/30 border border-purple-500/20 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <Sparkles size={14} className="text-purple-400" />
                <span>Quick Industry Templates (1-Click Presets)</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Instantly populate standard pricing parameters based on typical event blueprints:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("wedding")}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-purple-600/20 border border-zinc-800 hover:border-purple-500/40 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown size={12} className="text-amber-400" />
                  <span>Royal Wedding (250 pax)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("corporate")}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-blue-600/20 border border-zinc-800 hover:border-blue-500/40 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 size={12} className="text-blue-400" />
                  <span>Tech Summit (300 pax)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("engagement")}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-pink-600/20 border border-zinc-800 hover:border-pink-500/40 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Waves size={12} className="text-cyan-400" />
                  <span>Beach Sangeet (120 pax)</span>
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step Slides */}
          <div className="min-h-[380px] relative">
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
                {/* STEP 1: EVENT TYPE */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400">
                      Different event categories configure baseline catering menus, service ratios, and base plate multipliers.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CATEGORIES.map((cat) => {
                        const active = eventType === cat.key;
                        const rate = getPrice("EVENT_TYPE", cat.key, getPlateCostFallback(cat.key));
                        const Icon = cat.icon;

                        return (
                          <div
                            key={cat.key}
                            onClick={() => {
                              setEventType(cat.key);
                              setErrorText("");
                            }}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                              active
                                ? "bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50"
                                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90"
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${cat.iconBg}`}>
                                  <Icon size={22} className={cat.iconColor} />
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                                  active
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                                }`}>
                                  {cat.badge}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-white tracking-tight">{cat.label}</h3>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cat.desc}</p>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {cat.highlights.map((h) => (
                                  <span key={h} className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold">
                                    ✓ {h}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Standard Plate</span>
                              <span className="font-mono text-xs font-black text-emerald-400">
                                ₹{formatCurrency(rate)} / Guest
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: GUEST CAPACITY */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <p className="text-xs text-zinc-400">
                      Catering production, food preparation, dining tables, and service crew scale linearly with guest headcount.
                    </p>

                    <div className="p-6 border border-zinc-800 bg-zinc-900/60 rounded-2xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
                        <div>
                          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Total Expected Roster</span>
                          <span className="text-xs text-zinc-500">Includes primary attendees and hosts</span>
                        </div>

                        <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 font-mono font-black text-xl text-purple-300 w-full sm:w-auto justify-center">
                          <Users size={20} className="text-purple-400" />
                          <input
                            type="number"
                            value={guestCount || ""}
                            min="10"
                            max="5000"
                            placeholder="100"
                            onChange={(e) => setGuestCount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="bg-transparent text-center focus:outline-none w-24 font-mono font-black"
                          />
                          <span className="text-xs text-zinc-500 font-sans font-bold">Guests</span>
                        </div>
                      </div>

                      {/* Slider Control */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                          <span>Adjust Scale</span>
                          <span className="font-mono text-purple-400 font-bold">{guestCount} Guests</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={guestCount}
                          onChange={(e) => setGuestCount(parseInt(e.target.value))}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>10 Guests</span>
                          <span>250 Guests</span>
                          <span>500 Guests</span>
                          <span>1000+ Guests</span>
                        </div>
                      </div>

                      {/* Quick Capacity Pills */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Quick Presets
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[50, 100, 150, 200, 300, 500, 800].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setGuestCount(num)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                                guestCount === num
                                  ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                              }`}
                            >
                              {num} Pax
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Catering Estimation Summary Card */}
                      <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-zinc-300">
                          <Utensils size={16} className="text-purple-400" />
                          <div>
                            <div className="font-bold text-white">Estimated Catering Production</div>
                            <div className="text-[11px] text-zinc-400">
                              ~{Math.ceil(guestCount / 8)} round banquet tables required
                            </div>
                          </div>
                        </div>
                        <div className="font-mono text-base font-black text-emerald-400 text-right">
                          ₹{formatCurrency(cateringSum)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: VENUE TYPE */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400">
                      Venues configure base flat lease rates, logistics setup time constraints, and site preparation requirements.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {VENUE_TYPES.map((venue) => {
                        const active = venueType === venue.key;
                        const cost = getPrice("VENUE_TYPE", venue.key, getVenueCostFallback(venue.key));
                        const Icon = venue.icon;

                        return (
                          <div
                            key={venue.key}
                            onClick={() => setVenueType(venue.key)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                              active
                                ? "bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50"
                                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90"
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="h-11 w-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                  <Icon size={22} className={venue.iconColor} />
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                                  active
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                                }`}>
                                  {venue.badge}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-white tracking-tight">{venue.label}</h3>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{venue.desc}</p>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {venue.amenities.map((am) => (
                                  <span key={am} className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold">
                                    • {am}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Flat Space Lease</span>
                              <span className="font-mono text-xs font-black text-emerald-400">
                                ₹{formatCurrency(cost)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: DECOR STYLE */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400">
                      Choose your visual styling tier, spanning from understated floral backdrops to immersive couture environments.
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                      {DECOR_STYLES.map((style) => {
                        const active = decorStyle === style.key;
                        const cost = getPrice("DECOR_STYLE", style.key, getDecorCostFallback(style.key));
                        const Icon = style.icon;

                        return (
                          <div
                            key={style.key}
                            onClick={() => setDecorStyle(style.key)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              active
                                ? "bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50"
                                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90"
                            }`}
                          >
                            <div className="space-y-2 max-w-xl">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-purple-400">
                                  <Icon size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-white tracking-tight">{style.label}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                                  active
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                }`}>
                                  {style.badge}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed">{style.desc}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                {style.features.map((feat) => (
                                  <div key={feat} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                    <Check size={11} className="text-purple-400 shrink-0" />
                                    <span>{feat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="sm:text-right border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0 shrink-0">
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Theme Budget</span>
                              <span className="font-mono text-base font-black text-emerald-400 block mt-0.5">
                                ₹{formatCurrency(cost)}
                              </span>
                              {active && (
                                <span className="inline-block mt-1.5 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                  Selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5: SPECIAL EFFECTS & SFX */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400">
                      Elevate crowd engagement with stage special effects, laser synchronizations, and high-resolution video panels.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {EFFECTS.map((eff) => {
                        const active = selectedEffects.includes(eff.key);
                        const cost = getPrice("ADD_ON", eff.key, getEffectFeeFallback(eff.key));
                        const Icon = eff.icon;

                        return (
                          <div
                            key={eff.key}
                            onClick={() => handleEffectToggle(eff.key)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                              active
                                ? "bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50"
                                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90"
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between">
                                <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                  <Icon size={20} className={eff.iconColor} />
                                </div>
                                <div
                                  className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                                    active
                                      ? "bg-purple-600 border-purple-500 text-white"
                                      : "border-zinc-700 bg-zinc-950"
                                  }`}
                                >
                                  {active && <Check size={12} />}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-white tracking-tight">{eff.label}</h3>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{eff.desc}</p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">{eff.tag}</span>
                              <span className="font-mono text-xs font-black text-emerald-400">
                                ₹{formatCurrency(cost)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 6: EXECUTIVE SUMMARY & PROPOSAL */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <p className="text-xs text-zinc-400">
                      Review complete event estimation, verify tax parameters, and record client contact details to promote this plan.
                    </p>

                    {/* Banners */}
                    {errorText && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-400 shrink-0" />
                        <span>{errorText}</span>
                      </div>
                    )}

                    {successText && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span>{successText}</span>
                      </div>
                    )}

                    {/* Itemized Specification Grid */}
                    <div className="p-5 border border-zinc-800 bg-zinc-900/60 rounded-2xl space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                        <ShieldCheck size={14} />
                        <span>Configured Scope Blueprint</span>
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Event Type</span>
                          <span className="text-xs font-bold text-white mt-0.5 block">{eventType || "Not Selected"}</span>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Roster Size</span>
                          <span className="text-xs font-mono font-bold text-white mt-0.5 block">{guestCount} Guests</span>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Venue Tier</span>
                          <span className="text-xs font-bold text-white mt-0.5 block">{venueType || "Not Selected"}</span>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Decor Styling</span>
                          <span className="text-xs font-bold text-white mt-0.5 block">{decorStyle || "Not Selected"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Client Contact Capture */}
                    <div className="p-5 border border-zinc-800 bg-zinc-900/60 rounded-2xl space-y-4 text-xs">
                      <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2 border-b border-zinc-850 pb-2">
                        <User size={14} />
                        <span>Client Information & Quotation Metadata</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-zinc-400 font-bold flex items-center gap-1.5 text-[11px]">
                            <FileText size={12} className="text-purple-400" />
                            <span>Estimate Title *</span>
                          </label>
                          <input
                            type="text"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            placeholder="e.g. Mehta Wedding Grand Gala"
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-zinc-400 font-bold flex items-center gap-1.5 text-[11px]">
                            <User size={12} className="text-purple-400" />
                            <span>Client Full Name</span>
                          </label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="e.g. Siddharth Malhotra"
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-zinc-400 font-bold flex items-center gap-1.5 text-[11px]">
                            <Mail size={12} className="text-purple-400" />
                            <span>Email Address</span>
                          </label>
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="e.g. client@example.com"
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-zinc-400 font-bold flex items-center gap-1.5 text-[11px]">
                            <Phone size={12} className="text-purple-400" />
                            <span>Contact Phone</span>
                          </label>
                          <input
                            type="text"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 text-xs font-semibold"
                          />
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="pt-3 border-t border-zinc-800 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saveEstimateMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-950/50 cursor-pointer"
                        >
                          <Save size={14} />
                          <span>{lastSavedEstimate ? "Update Saved Estimate" : "Save Estimate Plan"}</span>
                        </button>

                        {lastSavedEstimate && (
                          <>
                            {leadCreatedData ? (
                              <button
                                type="button"
                                onClick={() => router.push("/crm")}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                <Check size={13} />
                                <span>View CRM Lead</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (lastSavedEstimate?.id) convertToLeadMutation.mutate(lastSavedEstimate.id);
                                }}
                                disabled={convertToLeadMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-950 border border-indigo-700 hover:bg-indigo-900 text-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                <span>{convertToLeadMutation.isPending ? "Converting..." : "Promote to CRM Lead"}</span>
                              </button>
                            )}

                            {quoteCreatedData ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/quotes/${quoteCreatedData.id}`)}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                <Check size={13} />
                                <span>View Quote Proposal</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (lastSavedEstimate?.id) generateQuoteMutation.mutate(lastSavedEstimate.id);
                                }}
                                disabled={generateQuoteMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                <span>{generateQuoteMutation.isPending ? "Generating..." : "Generate Official Proposal"}</span>
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
              className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-800 hover:bg-zinc-850 disabled:opacity-30 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Previous Step</span>
            </button>

            {currentStep < 6 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-950/40 active:scale-[0.98] cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Professional Live Estimation Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Executive Real-Time Calculation Card */}
          <div className="p-6 border border-purple-500/20 bg-zinc-950/80 backdrop-blur-xl rounded-2xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">
                  Live Quotation Engine
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono font-bold">18% GST Compliant</span>
            </div>

            {!hasSelections ? (
              <div className="py-10 px-4 border border-dashed border-zinc-850 rounded-2xl text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                  <Calculator size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Configure Event Parameters</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                    Select your event classification, guest capacity, venue, and decor on the left to activate real-time budget forecasting.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Grand Total Highlight Badge */}
                <div className="p-4 bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-zinc-950 border border-purple-500/30 rounded-2xl space-y-1 relative overflow-hidden">
                  <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                    Estimated Grand Total (Inc. 18% GST)
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                    ₹{formatCurrency(totalSum)}
                  </div>
                  {guestCount > 0 && (
                    <div className="text-[11px] text-zinc-400 font-mono pt-1 flex items-center justify-between">
                      <span>Per-Guest Cost:</span>
                      <span className="font-bold text-white">₹{formatCurrency(costPerGuest)} / pax</span>
                    </div>
                  )}
                </div>

                {/* Breakdown Progress Bars */}
                {totalSum > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Cost Distribution</span>
                      <span>{Math.round(((cateringSum + venueSum + decorSum) / (totalSum || 1)) * 100)}% Core Production</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                      <div
                        className="bg-purple-500 transition-all duration-300"
                        style={{ width: `${(cateringSum / (totalSum || 1)) * 100}%` }}
                        title="Catering"
                      />
                      <div
                        className="bg-indigo-500 transition-all duration-300"
                        style={{ width: `${(venueSum / (totalSum || 1)) * 100}%` }}
                        title="Venue"
                      />
                      <div
                        className="bg-pink-500 transition-all duration-300"
                        style={{ width: `${(decorSum / (totalSum || 1)) * 100}%` }}
                        title="Decor"
                      />
                      <div
                        className="bg-amber-500 transition-all duration-300"
                        style={{ width: `${(effectsSum / (totalSum || 1)) * 100}%` }}
                        title="SFX"
                      />
                    </div>
                  </div>
                )}

                {/* Itemized Lines */}
                <div className="space-y-2 pt-2 border-t border-zinc-850">
                  {/* Catering */}
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Utensils size={13} className="text-purple-400" />
                      <span>Catering ({guestCount} Guests)</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      ₹{formatCurrency(cateringSum)}
                    </span>
                  </div>

                  {/* Venue */}
                  <div className="flex justify-between items-center py-1 border-t border-zinc-900">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Building size={13} className="text-indigo-400" />
                      <span>Venue ({venueType || "Unselected"})</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      ₹{formatCurrency(venueSum)}
                    </span>
                  </div>

                  {/* Decor */}
                  <div className="flex justify-between items-center py-1 border-t border-zinc-900">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Flower2 size={13} className="text-pink-400" />
                      <span>Decor ({decorStyle || "Unselected"})</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      ₹{formatCurrency(decorSum)}
                    </span>
                  </div>

                  {/* SFX */}
                  <div className="flex justify-between items-center py-1 border-t border-zinc-900">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Tv size={13} className="text-amber-400" />
                      <span>Add-ons ({selectedEffects.length} items)</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      ₹{formatCurrency(effectsSum)}
                    </span>
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-zinc-800 font-bold text-zinc-300">
                    <span>Subtotal Before Taxes</span>
                    <span className="font-mono">
                      ₹{formatCurrency(cateringSum + venueSum + decorSum + effectsSum)}
                    </span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>GST (18%)</span>
                    <span className="font-mono text-zinc-300">
                      ₹{formatCurrency(Math.round((cateringSum + venueSum + decorSum + effectsSum) * 0.18))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Saved Workspace Plans */}
          <div className="p-6 border border-zinc-800 bg-zinc-950/60 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FolderOpen size={13} />
                <span>Saved Workspace Plans</span>
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono font-bold">
                {estimates.length} Saved
              </span>
            </div>

            {listLoading ? (
              <div className="text-center text-zinc-500 animate-pulse py-4 text-xs italic">
                Loading saved estimates...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {estimates.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => handleLoadEstimate(est)}
                    className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-900/40 flex justify-between items-center hover:border-purple-500/40 hover:bg-zinc-900/80 transition-all cursor-pointer group"
                  >
                    <div className="space-y-1 max-w-[170px]">
                      <h4 className="font-bold text-xs text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                        {est.eventName}
                      </h4>
                      <span className="text-[10px] text-zinc-400 block truncate font-medium">
                        {est.eventType} • {est.guestCount} guests
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400 block pt-0.5">
                        ₹{formatCurrency(est.grandTotal)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (est.id) deleteEstimateMutation.mutate(est.id);
                      }}
                      className="h-7 w-7 rounded-lg bg-zinc-900 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-zinc-500 transition cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Delete saved estimate"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {estimates.length === 0 && (
                  <p className="text-zinc-600 text-center py-6 text-xs italic">
                    No saved budget plans found. Create and save your first plan above.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Collapsible Grand Total Bottom Sheet */}
      {currentStep < 6 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-30 transition-all duration-300">
          <div
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="flex items-center justify-between p-4 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Est. Grand Total</span>
                <span className="font-mono text-emerald-400 font-black text-base">
                  ₹{formatCurrency(totalSum)}
                </span>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-xl transition">
              <span>{mobileDrawerOpen ? "Hide Details" : "View Breakdown"}</span>
              {mobileDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>

          <AnimatePresence>
            {mobileDrawerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-zinc-900 px-5 pb-5 pt-3 space-y-2.5 text-xs"
              >
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Catering ({guestCount} guests)</span>
                  <span className="font-mono font-bold text-white">₹{formatCurrency(cateringSum)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Venue ({venueType || "-"})</span>
                  <span className="font-mono font-bold text-white">₹{formatCurrency(venueSum)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Decor ({decorStyle || "-"})</span>
                  <span className="font-mono font-bold text-white">₹{formatCurrency(decorSum)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Special Effects ({selectedEffects.length})</span>
                  <span className="font-mono font-bold text-white">₹{formatCurrency(effectsSum)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-850 pt-2 text-zinc-300 font-bold">
                  <span>GST (18%)</span>
                  <span className="font-mono">₹{formatCurrency(Math.round((cateringSum + venueSum + decorSum + effectsSum) * 0.18))}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
