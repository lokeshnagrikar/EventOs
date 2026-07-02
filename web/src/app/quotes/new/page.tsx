"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  GripVertical
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
}

const TEMPLATE_PACKS: Record<string, QuoteItemInput[]> = {
  ELEGANT: [
    { itemName: "Elegant Stage & Backdrop Floral Decor", description: "Fresh flowers premium stage background layout", unitPrice: 150000, quantity: 1 },
    { itemName: "Multi-Camera Professional Videography", description: "Full-day coverage, cinematic cut, raw files", unitPrice: 80000, quantity: 1 },
    { itemName: "Premium Buffet Catering", description: "Per-plate cost including starters and desserts", unitPrice: 1200, quantity: 150 },
    { itemName: "Grand Entrance Welcome Styling", description: "Lanterns, floral pillars, and carpet runners", unitPrice: 25000, quantity: 1 }
  ],
  MINIMALIST: [
    { itemName: "High-Fidelity AV Sound & Projector System", description: "JBL line arrays, cordless mics, dual screens", unitPrice: 45000, quantity: 1 },
    { itemName: "Executive Buffet Corporate Lunch", description: "Continental & Indian cuisine options", unitPrice: 850, quantity: 100 },
    { itemName: "Conference Badges & Delegate Kits", description: "Recycled folders, metal pens, NFC badges", unitPrice: 150, quantity: 100 },
    { itemName: "Professional Sound Engineer Support", description: "8-hour operational logistics control", unitPrice: 12000, quantity: 1 }
  ],
  PLAYFUL: [
    { itemName: "Custom Themed 3-Tier Birthday Cake", description: "Chocolate truffle flavor with fondant decor", unitPrice: 15000, quantity: 1 },
    { itemName: "Dynamic Balloon Arch & Venue Backdrop", description: "Pastel colors custom balloon cluster", unitPrice: 10000, quantity: 1 },
    { itemName: "Interactive Kids Magic Show & MC", description: "2-hour fun games hosting", unitPrice: 7000, quantity: 1 },
    { itemName: "Kids Special Buffet Catering", description: "French fries, sliders, shakes, and pasta", unitPrice: 500, quantity: 50 }
  ]
};

export default function QuoteBuilderPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

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
  const [templateName, setTemplateName] = useState("MINIMALIST");
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("18"); // Default 18% GST
  const [clientNotes, setClientNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState("Payment Terms: 50% advance to confirm booking, 50% post event completion.");
  const [items, setItems] = useState<QuoteItemInput[]>([
    { itemName: "", description: "", unitPrice: 0, quantity: 1 }
  ]);
  const [errorText, setErrorText] = useState("");
  
  // Custom Multi-Currency & Coupon Discount
  const [currency, setCurrency] = useState("INR");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  
  // Mobile UI States
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  // Mathematical computations
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const getCurrencySymbol = (cur: string) => {
    if (cur === "USD") return "$";
    if (cur === "EUR") return "€";
    if (cur === "GBP") return "£";
    return "₹";
  };

  useEffect(() => {
    // Recompute totals
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const calculatedDiscount = parseFloat(discount) || 0;
    
    let taxableAmount = calculatedSubtotal - calculatedDiscount;
    if (taxableAmount < 0) taxableAmount = 0;

    const rate = parseFloat(taxRate) || 0;
    const calculatedTax = taxableAmount * (rate / 100);

    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTax);
    setGrandTotal(taxableAmount + calculatedTax);
  }, [items, discount, taxRate]);

  // Load Template preset
  const handleTemplateApply = (tpl: string) => {
    setTemplateName(tpl);
    const presetItems = TEMPLATE_PACKS[tpl];
    if (presetItems) {
      setItems(JSON.parse(JSON.stringify(presetItems))); // Deep copy
      setExpandedIndex(0); // expand first item of preset
    }
  };

  const handleAddItemRow = () => {
    const newItems = [...items, { itemName: "", description: "", unitPrice: 0, quantity: 1 }];
    setItems(newItems);
    setExpandedIndex(newItems.length - 1); // Expand new row on mobile
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    if (expandedIndex === idx) {
      setExpandedIndex(updated.length - 1);
    }
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
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = [...items];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);
    setExpandedIndex(result.destination.index);
  };

  // 2. Mutation: Save Quote
  const createQuoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/crm/quotes", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      router.push("/quotes");
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.error?.message || "Failed to save quote. Verify inputs.");
    }
  });

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!selectedLeadId) {
      setErrorText("Please select an associated client lead.");
      return;
    }

    const invalidItem = items.some((item) => !item.itemName.trim() || item.unitPrice < 0 || item.quantity <= 0);
    if (invalidItem) {
      setErrorText("Verify all line items have a name, non-negative unit price, and positive quantity.");
      return;
    }

    createQuoteMutation.mutate({
      leadId: selectedLeadId,
      templateName,
      discount: parseFloat(discount) || 0,
      taxRate: parseFloat(taxRate) || 0,
      clientNotes,
      termsConditions,
      items
    });
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/quotes")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to quotes"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Quote Builder</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Proposal Scaffolder</span>
          </div>
        </div>

        <button
          onClick={handleSaveQuote}
          disabled={createQuoteMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
        >
          <Save size={16} />
          Save & Send Quote
        </button>
      </nav>

      {/* Main Builder Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-24 lg:pb-6">
        
        {/* Left Columns (Builder Forms) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveQuote} className="space-y-6 text-xs">
            {/* Error Banner */}
            {errorText && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            {/* Client Context Details */}
            <div className="p-5 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
                1. Select Client Lead
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-semibold">CRM Lead Profile</label>
                  {leadsLoading ? (
                    <div className="h-10 bg-zinc-900 border border-zinc-800 rounded animate-pulse w-full" />
                  ) : (
                    <select
                      value={selectedLeadId}
                      required
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-medium"
                    >
                      <option value="">-- Choose active lead --</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.eventType ? `(${l.eventType})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-semibold">Select Design Preset Template</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTemplateApply("ELEGANT")}
                      className={`flex-1 py-2 px-3 border rounded-lg font-bold transition-all text-[11px] md:text-xs ${
                        templateName === "ELEGANT"
                          ? "border-pink-500 bg-pink-500/5 text-pink-400"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Elegant Wedding
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTemplateApply("MINIMALIST")}
                      className={`flex-1 py-2 px-3 border rounded-lg font-bold transition-all text-[11px] md:text-xs ${
                        templateName === "MINIMALIST"
                          ? "border-blue-500 bg-blue-500/5 text-blue-400"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Minimalist Corp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTemplateApply("PLAYFUL")}
                      className={`flex-1 py-2 px-3 border rounded-lg font-bold transition-all text-[11px] md:text-xs ${
                        templateName === "PLAYFUL"
                          ? "border-emerald-500 bg-emerald-500/5 text-emerald-400"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Standard Birthday
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="p-5 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">
                  2. Price Quotation Line Items
                </h3>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-650/10 hover:bg-purple-650/20 text-purple-400 border border-purple-500/20 rounded font-semibold transition-all"
                >
                  <Plus size={12} />
                  Add Row
                </button>
              </div>

              {/* Accessible Touch-Supported Reordering List */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="quote-items-droppable">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {items.map((item, idx) => (
                        <Draggable key={idx} draggableId={`item-${idx}`} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={provided.draggableProps.style as React.CSSProperties}
                              className={`flex flex-col p-4 bg-[#141416] border rounded-xl relative transition-all duration-200 ${
                                snapshot.isDragging
                                  ? "border-purple-500 bg-purple-950/20 scale-[1.01] shadow-2xl z-50"
                                  : "border-zinc-850 hover:border-zinc-700/60"
                              }`}
                            >
                              {/* Mobile Header Accordion (Only visible below md) */}
                              <div className="flex md:hidden items-center justify-between w-full border-b border-zinc-800/80 pb-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Drag to reorder item ${idx + 1}`}
                                    className="text-zinc-500 hover:text-purple-400 p-1.5 rounded hover:bg-zinc-800/50 transition-colors"
                                  >
                                    <GripVertical size={14} />
                                  </div>
                                  <span className="font-bold text-xs text-zinc-300">
                                    {item.itemName.trim() ? item.itemName : `Item #${idx + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                    className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-350 hover:text-white rounded text-[10px] font-bold border border-zinc-700/50"
                                  >
                                    {expandedIndex === idx ? "Collapse" : "Edit Details"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemRow(idx)}
                                    disabled={items.length === 1}
                                    className="h-7 w-7 rounded bg-zinc-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Responsive Fields Layout */}
                              <div className={`w-full md:grid md:grid-cols-12 gap-3 items-start ${expandedIndex === idx ? "block" : "hidden md:grid"}`}>
                                <div className="md:col-span-4 space-y-1 mt-1 md:mt-0">
                                  <div className="flex items-center gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      tabIndex={0}
                                      role="button"
                                      aria-label={`Drag to reorder item ${idx + 1}`}
                                      className="hidden md:block text-zinc-500 hover:text-purple-400 p-1 rounded hover:bg-zinc-800/50 shrink-0 transition-colors"
                                    >
                                      <GripVertical size={14} />
                                    </div>
                                    <div className="w-full">
                                      <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-500 mb-1 font-bold">Item Name</label>
                                      <input
                                        type="text"
                                        required
                                        value={item.itemName}
                                        onChange={(e) => handleItemFieldChange(idx, "itemName", e.target.value)}
                                        placeholder="Item name (e.g. Venue Catering)..."
                                        className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-medium"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="md:col-span-4 space-y-1 mt-2.5 md:mt-0">
                                  <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-500 mb-1 font-bold">Description</label>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemFieldChange(idx, "description", e.target.value)}
                                    placeholder="Detail descriptions (optional)..."
                                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-1 mt-2.5 md:mt-0">
                                  <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-500 mb-1 font-bold">Unit Price</label>
                                  <input
                                    type="number"
                                    required
                                    value={item.unitPrice || ""}
                                    onChange={(e) => handleItemFieldChange(idx, "unitPrice", e.target.value)}
                                    placeholder="Unit price..."
                                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-mono"
                                  />
                                </div>
                                <div className="md:col-span-1 space-y-1 mt-2.5 md:mt-0">
                                  <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-500 mb-1 font-bold">Qty</label>
                                  <input
                                    type="number"
                                    required
                                    value={item.quantity || ""}
                                    onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                                    placeholder="Qty..."
                                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 font-mono"
                                  />
                                </div>
                                <div className="hidden md:flex md:col-span-1 justify-end mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemRow(idx)}
                                    disabled={items.length === 1}
                                    className="h-7 w-7 rounded bg-zinc-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-zinc-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* T&C + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-4">
                <label className="text-zinc-400 uppercase font-semibold">Client Notes</label>
                <textarea
                  rows={4}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="E.g., Pricing includes transportation charges to Delhi venue..."
                  className="w-full px-3 py-2.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 leading-normal"
                />
              </div>

              <div className="p-5 border border-zinc-800 bg-[#161618]/30 rounded-xl space-y-4">
                <label className="text-zinc-400 uppercase font-semibold">Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Terms and contract parameters..."
                  className="w-full px-3 py-2.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 leading-normal"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (Live Calculations Summary) */}
        <div className="space-y-6">
          {/* Sticky Bottom Summary on mobile, Sticky Top on desktop */}
          <div className="p-4 md:p-6 border border-zinc-850 bg-[#161618]/95 backdrop-blur-md rounded-xl space-y-4 sticky bottom-0 lg:bottom-auto lg:top-6 shadow-2xl lg:shadow-none z-30">
            <div className="flex items-center justify-between lg:border-b lg:border-zinc-800 lg:pb-2">
              <h3 className="font-bold text-xs md:text-sm uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                Live Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowSummaryDetails(!showSummaryDetails)}
                className="block lg:hidden text-zinc-400 hover:text-white text-[10px] font-bold px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700"
              >
                {showSummaryDetails ? "Hide Breakdowns" : "Show Breakdowns"}
              </button>
            </div>

            {/* Always visible grand total on mobile summary bar */}
            <div className="flex lg:hidden justify-between items-center text-xs">
              <span className="text-zinc-400 font-semibold">Grand Total</span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                INR {grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Collapsible pricing summary details */}
            <div className={`${showSummaryDetails ? "block" : "hidden lg:block"} space-y-4 text-xs pt-2 lg:pt-0 border-t border-zinc-800/50 lg:border-t-0`}>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Subtotal Items</span>
                <span className="font-mono font-bold text-zinc-200">
                  INR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Adjusters */}
              <div className="space-y-2 border-t border-b border-zinc-800/60 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-450">Apply Discount (INR)</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-2 py-1 bg-[#18181B] border border-zinc-800 rounded text-right text-white focus:outline-none focus:border-purple-600 font-mono font-bold"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <span className="text-zinc-450">Tax Rate Percentage (%)</span>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="18"
                    className="w-32 px-2 py-1 bg-[#18181B] border border-zinc-800 rounded text-right text-white focus:outline-none focus:border-purple-600 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-zinc-450 pt-1">
                <span>Calculated Tax</span>
                <span className="font-mono font-bold text-zinc-200">
                  INR {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Grand Total (Desktop Layout) */}
              <div className="hidden lg:flex justify-between items-center border-t border-zinc-800/60 pt-4 text-sm font-bold">
                <span className="text-zinc-200">Grand Total</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">
                  INR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
