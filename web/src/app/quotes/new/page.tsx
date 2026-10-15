"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useOnboardingStore } from "@/store/onboardingStore";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  DollarSign,
  AlertCircle,
  Sparkles,
  GripVertical,
  Check,
  Percent,
  Receipt,
  Eye,
  Edit3,
  Copy,
  Printer,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Briefcase,
  Heart,
  Cake,
  Music,
  Utensils,
  Camera,
  Palette,
  Clock,
  Send,
  Building2,
  FileCheck2,
  Share2
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  eventType?: string;
  budget: number;
  phone?: string;
  email?: string;
  contact?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

interface QuoteItemInput {
  itemName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  category?: string;
}

const CATEGORY_TAGS = [
  { name: "Decor & Stage", icon: Palette, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { name: "Catering", icon: Utensils, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Audio & Lights", icon: Music, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "Photo & Cinema", icon: Camera, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { name: "Logistics & Crew", icon: Clock, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
];

const TEMPLATE_PACKS: Record<
  string,
  {
    name: string;
    subtitle: string;
    badge: string;
    icon: any;
    themeGradient: string;
    borderColor: string;
    items: QuoteItemInput[];
  }
> = {
  ELEGANT: {
    name: "Royal Wedding & Sangeet",
    subtitle: "High-end floral decor, cinematic coverage & royal catering",
    badge: "Most Popular",
    icon: Heart,
    themeGradient: "from-pink-500/15 via-purple-500/10 to-transparent",
    borderColor: "border-pink-500/40 hover:border-pink-500",
    items: [
      { itemName: "Grand Stage & Royal Floral Mandap", description: "Fresh exotic flowers, chandelier canopy & backdrop layout", unitPrice: 150000, quantity: 1, category: "Decor & Stage" },
      { itemName: "Cinematic 4K Multi-Cam Videography", description: "Full-day coverage, teaser trailer, drone aerials & raw edits", unitPrice: 80000, quantity: 1, category: "Photo & Cinema" },
      { itemName: "Royal Buffet Catering (Live Counters)", description: "5-Course gourmet banquet per-plate with live chaat & dessert bars", unitPrice: 1200, quantity: 150, category: "Catering" },
      { itemName: "Grand VVIP Welcome Tunnel & Pyros", description: "Brass lanterns, red carpet runners, cold pyro stage entry", unitPrice: 25000, quantity: 1, category: "Decor & Stage" }
    ]
  },
  MINIMALIST: {
    name: "Executive Corporate Gala",
    subtitle: "Modern AV line arrays, keynote stage & corporate buffet",
    badge: "B2B Pro",
    icon: Briefcase,
    themeGradient: "from-blue-500/15 via-indigo-500/10 to-transparent",
    borderColor: "border-blue-500/40 hover:border-blue-500",
    items: [
      { itemName: "High-Fidelity AV Sound & LED Video Wall", description: "P2.6 LED screen (16x9ft), JBL line array, wireless lapels", unitPrice: 55000, quantity: 1, category: "Audio & Lights" },
      { itemName: "Executive Continental & Indian High-Tea Buffet", description: "Premium coffee bar, finger foods, delegate luncheon menu", unitPrice: 850, quantity: 100, category: "Catering" },
      { itemName: "Custom RFID Delegate Kits & Metal Badges", description: "Custom lanyard, recycled notebook, matte pen & pass", unitPrice: 250, quantity: 100, category: "Logistics & Crew" },
      { itemName: "Dedicated Live Sound & Stage Director", description: "8-hour continuous technical crew & stage cue monitoring", unitPrice: 12000, quantity: 1, category: "Logistics & Crew" }
    ]
  },
  PLAYFUL: {
    name: "Luxury Celebration & Birthday",
    subtitle: "Themed cakes, pastel balloons, interactive MC & special buffet",
    badge: "Social Hit",
    icon: Cake,
    themeGradient: "from-emerald-500/15 via-teal-500/10 to-transparent",
    borderColor: "border-emerald-500/40 hover:border-emerald-500",
    items: [
      { itemName: "Custom 3-Tier Designer Fondant Cake", description: "Belgian chocolate truffle flavor with theme sugarcraft", unitPrice: 15000, quantity: 1, category: "Catering" },
      { itemName: "Pastel Organic Balloon Arch & Neon Backdrop", description: "Custom organic balloon garland with 3D acrylic name sign", unitPrice: 12000, quantity: 1, category: "Decor & Stage" },
      { itemName: "Celebrity Emcee & Magic/Game Show Host", description: "2.5-hour high-energy crowd engagement & kids activities", unitPrice: 9000, quantity: 1, category: "Logistics & Crew" },
      { itemName: "Kids & Family Special Finger Buffet", description: "Sliders, artisanal pizza slices, live mocktail bar & sundae station", unitPrice: 650, quantity: 50, category: "Catering" }
    ]
  }
};

export default function QuoteBuilderPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Active Tab: "editor" vs "preview"
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // 1. Fetch Active Leads
  const { data: leadsResponse, isLoading: leadsLoading } = useQuery<{ data: Lead[] }>({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await api.get("/crm/leads");
      return response.data;
    }
  });

  const leads = leadsResponse?.data || [];

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [templateName, setTemplateName] = useState("PLAYFUL");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("18"); // Default 18% GST
  const [currency, setCurrency] = useState("INR");
  const [clientNotes, setClientNotes] = useState(
    "Quotation includes setup, equipment delivery, technical crew, and post-event teardown."
  );
  const [termsConditions, setTermsConditions] = useState(
    "1. 50% advance to confirm event dates.\n2. 40% before event day call-time.\n3. 10% on event wrap-up inspection."
  );
  const [items, setItems] = useState<QuoteItemInput[]>(TEMPLATE_PACKS.PLAYFUL.items);
  const [errorText, setErrorText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Lead Object
  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId);
  }, [leads, selectedLeadId]);

  // Financial Computations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const rawDiscount = parseFloat(discount) || 0;
    if (discountType === "percent") {
      return (subtotal * rawDiscount) / 100;
    }
    return Math.min(rawDiscount, subtotal);
  }, [subtotal, discount, discountType]);

  const taxableAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const calculatedTax = useMemo(() => {
    const rate = parseFloat(taxRate) || 0;
    return (taxableAmount * rate) / 100;
  }, [taxableAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return taxableAmount + calculatedTax;
  }, [taxableAmount, calculatedTax]);

  // Estimated Planner Margin (approx 32% margin benchmark)
  const estimatedVendorCost = useMemo(() => {
    return grandTotal * 0.65;
  }, [grandTotal]);

  const estimatedProfitMargin = useMemo(() => {
    return grandTotal - estimatedVendorCost;
  }, [grandTotal, estimatedVendorCost]);

  // Payment Milestones
  const advance50 = useMemo(() => grandTotal * 0.5, [grandTotal]);
  const mid40 = useMemo(() => grandTotal * 0.4, [grandTotal]);
  const final10 = useMemo(() => grandTotal * 0.1, [grandTotal]);

  // Currency Formatter helper
  const formatCurrency = (amount: number) => {
    return `${currency === "INR" ? "₹" : "$"} ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Load Template preset
  const handleTemplateApply = (tpl: string) => {
    setTemplateName(tpl);
    const preset = TEMPLATE_PACKS[tpl];
    if (preset) {
      setItems(JSON.parse(JSON.stringify(preset.items)));
    }
  };

  const handleAddItemRow = (categoryName?: string) => {
    const newItems = [
      ...items,
      {
        itemName: "",
        description: "",
        unitPrice: 0,
        quantity: 1,
        category: categoryName || "Decor & Stage"
      }
    ];
    setItems(newItems);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
  };

  const handleItemFieldChange = (idx: number, field: keyof QuoteItemInput, val: any) => {
    const updated = [...items];
    if (field === "unitPrice") {
      updated[idx][field] = parseFloat(val) || 0;
    } else if (field === "quantity") {
      updated[idx][field] = parseInt(val) || 0;
    } else {
      updated[idx][field] = val;
    }
    setItems(updated);
  };

  // Drag and Drop reordering handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = [...items];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);
  };

  // 2. Mutation: Save Quote
  const createQuoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/crm/quotes", payload);
      return response.data;
    },
    onSuccess: (data: any) => {
      const created = data?.data;
      if (created) {
        try {
          const existing = JSON.parse(localStorage.getItem("eventos_created_quotes") || "[]");
          localStorage.setItem("eventos_created_quotes", JSON.stringify([created, ...existing]));
        } catch (e) {}
      }
      const { completeStep } = useOnboardingStore.getState();
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      completeStep("create_quote");
      router.push("/quotes");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to save quote. Verify inputs.");
    }
  });

  const handleSaveQuote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorText("");

    if (!selectedLeadId) {
      setErrorText("Please select an active client lead first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const invalidItem = items.some((item) => !item.itemName.trim() || item.unitPrice < 0 || item.quantity <= 0);
    if (invalidItem) {
      setErrorText("Please verify all line items have a valid title, unit price, and quantity.");
      return;
    }

    createQuoteMutation.mutate({
      leadId: selectedLeadId,
      templateName,
      discount: discountAmount,
      taxRate: parseFloat(taxRate) || 0,
      clientNotes,
      termsConditions,
      items: items.map(({ itemName, description, unitPrice, quantity }) => ({
        itemName,
        description,
        unitPrice: Number(unitPrice) || 0,
        quantity: Number(quantity) || 1
      }))
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://eventosapp.in/portal/quote/${selectedLeadId || "preview"}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[550px] h-[550px] bg-cyan-600/10 blur-[130px] pointer-events-none z-0" />

      {/* Top Studio Navbar */}
      <nav className="h-16 border-b border-white/[0.08] bg-[#0c0d14]/90 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/quotes")}
            className="h-9 w-9 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shadow-inner"
            aria-label="Back to quotes"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm md:text-base text-zinc-100 tracking-tight">Quote Studio</span>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-md font-semibold tracking-wide">
                Live Dynamic Scaffolder
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Build high-converting event proposals with real-time financial margins
            </p>
          </div>
        </div>

        {/* Center Tabs: Editor Mode vs Live Proposal Preview */}
        <div className="hidden md:flex items-center p-1 bg-zinc-900/90 border border-white/[0.08] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "editor"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Edit3 size={13} />
            Editor Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Eye size={13} />
            Live Proposal Sheet
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
            title="Copy client share link"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copiedLink ? "Link Copied!" : "Portal Link"}
          </button>

          <button
            onClick={() => handleSaveQuote()}
            disabled={createQuoteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/25 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {createQuoteMutation.isPending ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Save & Send Quote
          </button>
        </div>
      </nav>

      {/* Main Studio Workspace */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full z-10 pb-28 lg:pb-12">
        {/* Error Alert */}
        {errorText && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl flex items-center gap-3 text-xs shadow-lg shadow-red-950/20"
          >
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span className="font-medium">{errorText}</span>
          </motion.div>
        )}

        {/* TAB 1: LINE ITEMS EDITOR */}
        {activeTab === "editor" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols (Builder Form) */}
            <div className="lg:col-span-8 space-y-7">
              {/* 1. Client Lead Context Card */}
              <div className="p-6 border border-white/[0.08] bg-[#10121a]/90 backdrop-blur-xl rounded-2xl space-y-5 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-black">
                      1
                    </span>
                    <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                      Client & Target Lead
                    </h2>
                  </div>
                  {selectedLead && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                      Budget: ₹{selectedLead.budget?.toLocaleString() || "Not set"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Select Lead from CRM Pipeline
                    </label>
                    {leadsLoading ? (
                      <div className="h-11 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                    ) : (
                      <select
                        value={selectedLeadId}
                        required
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#171924] border border-white/[0.08] rounded-xl text-zinc-100 font-medium text-xs focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                      >
                        <option value="">-- Choose active client lead --</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} {l.eventType ? `• ${l.eventType}` : ""} {l.phone ? `(${l.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Quote Currency
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrency("INR")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currency === "INR"
                            ? "border-purple-500 bg-purple-500/20 text-purple-200"
                            : "border-white/[0.08] bg-[#171924] text-zinc-400 hover:text-white"
                        }`}
                      >
                        ₹ INR
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currency === "USD"
                            ? "border-purple-500 bg-purple-500/20 text-purple-200"
                            : "border-white/[0.08] bg-[#171924] text-zinc-400 hover:text-white"
                        }`}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Visual Luxury Design Presets */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Quick Design Template Presets</span>
                    <span className="text-zinc-500 text-[10px] lowercase">Auto-loads curated line items</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(TEMPLATE_PACKS).map(([key, pack]) => {
                      const Icon = pack.icon;
                      const isSelected = templateName === key;
                      return (
                        <div
                          key={key}
                          onClick={() => handleTemplateApply(key)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? `${pack.borderColor} bg-gradient-to-b ${pack.themeGradient} shadow-lg ring-1 ring-purple-500/50`
                              : "border-white/[0.08] bg-[#131520] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="h-7 w-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-300 group-hover:scale-105 transition-transform">
                              <Icon size={14} />
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-semibold uppercase tracking-wider">
                              {pack.badge}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-zinc-100 tracking-tight">{pack.name}</h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{pack.subtitle}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Line Items Studio */}
              <div className="p-6 border border-white/[0.08] bg-[#10121a]/90 backdrop-blur-xl rounded-2xl space-y-5 relative shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-black">
                      2
                    </span>
                    <div>
                      <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                        Itemized Production Services
                      </h2>
                      <p className="text-[11px] text-zinc-500">
                        Drag to reorder • Quantities calculate line totals live
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddItemRow()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    <Plus size={13} />
                    Add Custom Row
                  </button>
                </div>

                {/* Quick Category Chips for Fast Inserting */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold mr-1">Quick Add:</span>
                  {CATEGORY_TAGS.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleAddItemRow(cat.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all hover:scale-105 cursor-pointer ${cat.color}`}
                      >
                        <Icon size={11} />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {/* Drag and Drop Container */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="quote-items-droppable">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {/* Table Header Labels */}
                        <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <div className="col-span-5">Service / Item & Description</div>
                          <div className="col-span-2 text-right">Unit Price ({currency})</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Line Total</div>
                          <div className="col-span-1 text-center">Del</div>
                        </div>

                        {items.map((item, idx) => {
                          const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
                          return (
                            <Draggable key={idx} draggableId={`item-${idx}`} index={idx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={provided.draggableProps.style as React.CSSProperties}
                                  className={`p-3.5 rounded-xl border transition-all duration-150 ${
                                    snapshot.isDragging
                                      ? "border-purple-500 bg-purple-950/40 shadow-2xl scale-[1.01] z-50 ring-1 ring-purple-500"
                                      : "border-white/[0.06] bg-[#141622] hover:border-white/20"
                                  }`}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                    {/* Drag Handle + Title & Description */}
                                    <div className="md:col-span-5 flex items-start gap-2.5">
                                      <div
                                        {...provided.dragHandleProps}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Drag item ${idx + 1}`}
                                        className="text-zinc-500 hover:text-purple-400 p-1 rounded hover:bg-white/[0.05] transition-colors cursor-grab shrink-0 mt-1"
                                      >
                                        <GripVertical size={15} />
                                      </div>

                                      <div className="w-full space-y-1.5">
                                        <input
                                          type="text"
                                          required
                                          value={item.itemName}
                                          onChange={(e) => handleItemFieldChange(idx, "itemName", e.target.value)}
                                          placeholder="Service name (e.g. Royal Stage Decor)..."
                                          className="w-full px-3 py-2 bg-[#1b1e2e] border border-white/[0.08] rounded-xl text-zinc-100 placeholder-zinc-500 font-semibold text-xs focus:outline-none focus:border-purple-500"
                                        />
                                        <input
                                          type="text"
                                          value={item.description}
                                          onChange={(e) => handleItemFieldChange(idx, "description", e.target.value)}
                                          placeholder="Specification notes for client..."
                                          className="w-full px-3 py-1.5 bg-[#171927] border border-white/[0.05] rounded-lg text-zinc-300 placeholder-zinc-600 text-[11px] focus:outline-none focus:border-purple-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Unit Price */}
                                    <div className="md:col-span-2">
                                      <label className="block md:hidden text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                                        Unit Price
                                      </label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs font-mono text-zinc-500">
                                          {currency === "INR" ? "₹" : "$"}
                                        </span>
                                        <input
                                          type="number"
                                          required
                                          value={item.unitPrice || ""}
                                          onChange={(e) => handleItemFieldChange(idx, "unitPrice", e.target.value)}
                                          placeholder="0.00"
                                          className="w-full pl-7 pr-3 py-2 bg-[#1b1e2e] border border-white/[0.08] rounded-xl text-right text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-purple-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Quantity Stepper */}
                                    <div className="md:col-span-2">
                                      <label className="block md:hidden text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                                        Quantity
                                      </label>
                                      <div className="flex items-center bg-[#1b1e2e] border border-white/[0.08] rounded-xl overflow-hidden">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleItemFieldChange(idx, "quantity", Math.max(1, (item.quantity || 1) - 1))
                                          }
                                          className="px-2.5 py-2 hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          required
                                          value={item.quantity || ""}
                                          onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                                          className="w-full text-center bg-transparent text-zinc-100 font-mono font-bold text-xs focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleItemFieldChange(idx, "quantity", (item.quantity || 1) + 1)
                                          }
                                          className="px-2.5 py-2 hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>

                                    {/* Line Total */}
                                    <div className="md:col-span-2 text-right">
                                      <div className="text-[10px] text-zinc-400 uppercase font-semibold md:hidden">
                                        Line Total
                                      </div>
                                      <span className="font-mono font-extrabold text-emerald-400 text-xs md:text-sm">
                                        {formatCurrency(lineTotal)}
                                      </span>
                                    </div>

                                    {/* Delete Row Button */}
                                    <div className="md:col-span-1 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItemRow(idx)}
                                        disabled={items.length === 1}
                                        className="h-8 w-8 rounded-lg bg-zinc-900/60 hover:bg-red-500/15 hover:text-red-400 border border-white/[0.05] flex items-center justify-center text-zinc-500 transition-all disabled:opacity-20 cursor-pointer"
                                        title="Delete row"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* 4. Notes & Contract Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 border border-white/[0.08] bg-[#10121a]/90 backdrop-blur-xl rounded-2xl space-y-2.5 shadow-md">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={13} className="text-purple-400" />
                    Special Inclusions & Client Notes
                  </label>
                  <textarea
                    rows={4}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="E.g., Pricing includes transportation charges to venue..."
                    className="w-full px-3.5 py-2.5 bg-[#171927] border border-white/[0.08] rounded-xl text-zinc-200 placeholder-zinc-600 text-xs leading-relaxed focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="p-5 border border-white/[0.08] bg-[#10121a]/90 backdrop-blur-xl rounded-2xl space-y-2.5 shadow-md">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Contract Terms & Payment Rules
                  </label>
                  <textarea
                    rows={4}
                    value={termsConditions}
                    onChange={(e) => setTermsConditions(e.target.value)}
                    placeholder="Milestones, cancellation parameters & booking deposits..."
                    className="w-full px-3.5 py-2.5 bg-[#171927] border border-white/[0.08] rounded-xl text-zinc-200 placeholder-zinc-600 text-xs leading-relaxed focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Executive Financial Intelligence Hub */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <div className="p-6 border border-white/[0.1] bg-[#11131f]/95 backdrop-blur-2xl rounded-2xl space-y-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500" />

                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    Live Financial Summary
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                    Real-time
                  </span>
                </div>

                {/* Subtotal */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Items Subtotal</span>
                    <span className="font-mono font-bold text-zinc-100 text-sm">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {/* Discount Section with Flat vs % Toggle */}
                  <div className="p-3 bg-zinc-900/70 border border-white/[0.06] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[11px] font-medium">Apply Discount</span>
                      <div className="flex items-center bg-[#171927] border border-white/[0.08] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setDiscountType("flat")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            discountType === "flat"
                              ? "bg-purple-600 text-white"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Flat {currency === "INR" ? "₹" : "$"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType("percent")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            discountType === "percent"
                              ? "bg-purple-600 text-white"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          % Off
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-zinc-500">
                        {discountType === "percent" ? "Percentage reduction" : "Amount deduction"}
                      </span>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        className="w-28 px-3 py-1.5 bg-[#171927] border border-white/[0.08] rounded-lg text-right font-mono font-bold text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Tax Rate (Quick GST Pills) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>GST / Tax Rate</span>
                      <span className="font-mono font-bold text-zinc-200">{taxRate}%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {["0", "5", "12", "18"].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setTaxRate(rate)}
                          className={`py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            taxRate === rate
                              ? "border-purple-500 bg-purple-500/20 text-purple-200"
                              : "border-white/[0.06] bg-zinc-900/50 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Tax Line */}
                  <div className="flex justify-between items-center text-zinc-400 pt-1">
                    <span>Tax Amount</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {formatCurrency(calculatedTax)}
                    </span>
                  </div>

                  {/* GRAND TOTAL BIG HERO */}
                  <div className="pt-4 pb-2 border-t border-white/[0.08] space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Grand Quotation Total
                    </div>
                    <div className="font-mono font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>

                  {/* Financial Cashflow Milestones */}
                  <div className="p-3.5 bg-zinc-900/60 border border-white/[0.06] rounded-xl space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={12} className="text-indigo-400" />
                        Milestone Payment Splits
                      </span>
                      <span className="text-zinc-500 font-mono">50 - 40 - 10</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Advance Booking (50%):</span>
                        <span className="font-bold text-zinc-100">{formatCurrency(advance50)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Call-Time Dispatch (40%):</span>
                        <span className="font-bold text-zinc-100">{formatCurrency(mid40)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Handover Wrap-up (10%):</span>
                        <span className="font-bold text-zinc-100">{formatCurrency(final10)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Planner Profit Margin Intelligence */}
                  <div className="p-3.5 bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-purple-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-purple-400" />
                        Estimated Profit Margin
                      </span>
                      <span className="font-mono font-black text-emerald-400">~35%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full w-[35%]" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Est. Margin: {formatCurrency(estimatedProfitMargin)}</span>
                      <span>Est. Cost: {formatCurrency(estimatedVendorCost)}</span>
                    </div>
                  </div>

                  {/* Primary Save Action */}
                  <button
                    type="button"
                    onClick={() => handleSaveQuote()}
                    disabled={createQuoteMutation.isPending}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-purple-600/30 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={15} />
                    Confirm & Dispatch Proposal
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: LIVE PROPOSAL PREVIEW (A4 LUXURY PROPOSAL SHEET) */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-zinc-100">Live Client Proposal Document</h3>
                <p className="text-xs text-zinc-400">
                  This is the exact digital proposal sheet the client sees when opening their portal link.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Printer size={14} />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("editor")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Edit3 size={14} />
                  Back to Editor
                </button>
              </div>
            </div>

            {/* A4 Paper Document Preview Container */}
            <div className="p-8 md:p-12 bg-white text-zinc-900 rounded-3xl shadow-2xl space-y-8 border border-zinc-200">
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-sm">
                      EO
                    </div>
                    <span className="font-black text-xl tracking-tight text-zinc-900">EventOS Studios</span>
                  </div>
                  <p className="text-xs text-zinc-500">Premium Event Management & Creative Production</p>
                  <p className="text-xs text-zinc-500">contact@eventosapp.in • +91 98765 43210</p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold uppercase tracking-wider">
                    Official Quotation
                  </span>
                  <p className="text-xs font-mono text-zinc-500">Ref: QT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</p>
                  <p className="text-xs text-zinc-500">Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
                </div>
              </div>

              {/* Client & Event Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Prepared For:</span>
                  <h4 className="font-bold text-base text-zinc-900">
                    {selectedLead?.name || "Client Name (Lead Unselected)"}
                  </h4>
                  <p className="text-xs text-zinc-600">{selectedLead?.email || "client@example.com"}</p>
                  <p className="text-xs text-zinc-600">{selectedLead?.phone || "+91 Contact Number"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Event Profile:</span>
                  <h4 className="font-bold text-base text-purple-700">
                    {selectedLead?.eventType || "Special Event & Gala"}
                  </h4>
                  <p className="text-xs text-zinc-600">Template Package: {TEMPLATE_PACKS[templateName]?.name || "Custom"}</p>
                  <p className="text-xs text-zinc-600">Status: Pending Client Confirmation</p>
                </div>
              </div>

              {/* Proposal Table */}
              <div className="space-y-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-zinc-900 text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 text-left">Service Item</th>
                      <th className="py-2.5 text-left">Specification</th>
                      <th className="py-2.5 text-right">Unit Price</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 font-bold text-zinc-900">{item.itemName || `Item #${i + 1}`}</td>
                        <td className="py-3 text-zinc-600 pr-2">{item.description || "As per agreed design specifications"}</td>
                        <td className="py-3 text-right font-mono text-zinc-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-center font-mono text-zinc-700">{item.quantity}</td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-900">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Grid */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-zinc-200">
                <div className="space-y-3 sm:max-w-xs text-xs">
                  <div>
                    <span className="font-bold text-zinc-900 block mb-1">Inclusions & Logistics:</span>
                    <p className="text-zinc-600 leading-relaxed text-[11px] whitespace-pre-line">{clientNotes}</p>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block mb-1">Booking Terms:</span>
                    <p className="text-zinc-600 leading-relaxed text-[11px] whitespace-pre-line">{termsConditions}</p>
                  </div>
                </div>

                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-zinc-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600">
                    <span>GST ({taxRate}%):</span>
                    <span className="font-mono font-bold text-zinc-900">{formatCurrency(calculatedTax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t-2 border-zinc-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-purple-700">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Milestone Box & Signature */}
              <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-zinc-500">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-800">Approved & Accepted By:</span>
                  <div className="h-12 w-48 border-b-2 border-dashed border-zinc-300 mt-2" />
                  <p className="text-[10px]">Client Signature / Digital Acceptance Date</p>
                </div>

                <div className="text-right text-[10px] space-y-0.5">
                  <p>Generated digitally via EventOS Platform</p>
                  <p>https://eventosapp.in • Valid for 14 Days from issuance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
