"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Users,
  Calendar,
  Building,
  DollarSign,
  Plus,
  Trash2,
  Printer,
  X,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Check,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/lib/toastStore";
import { useAuthModalStore } from "@/store/authModalStore";

interface LineItem {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
  perGuest: boolean;
  quantity: number;
  selected: boolean;
}

const DEFAULT_LINE_ITEMS: LineItem[] = [
  { id: "1", category: "Stage & Decor", name: "3D Architectural Stage & Floral Backdrop", unitPrice: 85000, perGuest: false, quantity: 1, selected: true },
  { id: "2", category: "Stage & Decor", name: "Custom Entrance Archway & Lighting", unitPrice: 25000, perGuest: false, quantity: 1, selected: true },
  { id: "3", category: "Sound & AV", name: "Concert Line-Array Speakers & Subwoofers", unitPrice: 45000, perGuest: false, quantity: 1, selected: true },
  { id: "4", category: "Sound & AV", name: "P2.5 Curved Ultra-HD LED Wall (20x10 ft)", unitPrice: 60000, perGuest: false, quantity: 1, selected: true },
  { id: "5", category: "Intelligent Lighting", name: "Beam & Spot Moving Heads + Haze System", unitPrice: 35000, perGuest: false, quantity: 1, selected: false },
  { id: "6", category: "Catering & F&B", name: "Gourmet Live Counter & 5-Course Buffet", unitPrice: 1200, perGuest: true, quantity: 1, selected: true },
  { id: "7", category: "Catering & F&B", name: "Artisanal Mocktail & Beverage Bar", unitPrice: 350, perGuest: true, quantity: 1, selected: true },
  { id: "8", category: "Photography & Media", name: "Cinematic 4K Multi-Cam + Drone Coverage", unitPrice: 75000, perGuest: false, quantity: 1, selected: true },
  { id: "9", category: "Photography & Media", name: "Live AI Photo Booth & Same-Day Reel Edit", unitPrice: 30000, perGuest: false, quantity: 1, selected: false },
  { id: "10", category: "Event Management", name: "On-site Event Director & Hospitality Crew", unitPrice: 40000, perGuest: false, quantity: 1, selected: true }
];

const EVENT_TYPES = [
  "Grand Wedding & Reception",
  "Corporate Gala & Awards",
  "Live Concert & Music Fest",
  "Luxury Private Villa Party",
  "Product Launch & Exhibition"
];

const VENUE_TYPES = [
  "Indoor Palace Banquet Hall",
  "Outdoor Lawns & Golf Resort",
  "Beachfront Coastal Venue",
  "Luxury Heritage Fort"
];

export function EventQuoteCalculator({ isModal = false, onClose }: { isModal?: boolean; onClose?: () => void }) {
  const addToast = useToastStore((state) => state.addToast);
  const openModal = useAuthModalStore((state) => state.openModal);

  // Quote Metadata States
  const [eventName, setEventName] = useState("Royal Gala & Reception 2026");
  const [clientName, setClientName] = useState("Lokesh Sharma");
  const [clientCompany, setClientCompany] = useState("Apex Events & Hospitality");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [venueType, setVenueType] = useState(VENUE_TYPES[0]);
  const [guestCount, setGuestCount] = useState(350);
  const [eventDate, setEventDate] = useState("2026-11-20");

  // Items and Pricing States
  const [items, setItems] = useState<LineItem[]>(DEFAULT_LINE_ITEMS);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [taxPercent, setTaxPercent] = useState(18); // GST 18%
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Custom Item Inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(10000);
  const [newItemCategory, setNewItemCategory] = useState("Custom Add-on");
  const [newItemPerGuest, setNewItemPerGuest] = useState(false);

  // Calculate totals
  const selectedItems = items.filter((item) => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => {
    const itemCost = item.perGuest ? item.unitPrice * guestCount : item.unitPrice * item.quantity;
    return sum + itemCost;
  }, 0);

  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent) / 100 : 0;
  const taxableTotal = subtotal - discountAmount;
  const taxAmount = (taxableTotal * taxPercent) / 100;
  const grandTotal = taxableTotal + taxAmount;

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) {
      addToast("Please enter an item description.", "error");
      return;
    }
    const newItem: LineItem = {
      id: Date.now().toString(),
      category: newItemCategory,
      name: newItemName.trim(),
      unitPrice: newItemPrice,
      perGuest: newItemPerGuest,
      quantity: 1,
      selected: true
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setNewItemPrice(10000);
    addToast(`Added "${newItem.name}" to proposal!`, "success");
  };

  const handleApplyDiscount = () => {
    const cleanCode = discountCode.trim().toUpperCase();
    if (cleanCode === "EVENTOS10") {
      setAppliedDiscount({ code: cleanCode, percent: 10 });
      addToast("Promo Code EVENTOS10 applied (10% OFF)!", "success");
    } else if (cleanCode === "WEDDINGVIP" || cleanCode === "VIP15") {
      setAppliedDiscount({ code: cleanCode, percent: 15 });
      addToast("VIP Promo Code applied (15% OFF)!", "success");
    } else {
      addToast("Invalid Promo Code. Try EVENTOS10 or VIP15", "error");
    }
  };

  const handlePrintPDF = () => {
    window.print();
    addToast("Generating printable PDF proposal...", "info");
  };

  const handleShareWhatsApp = () => {
    const quoteSummary = `*EventOS Proposal Quote*%0A*Event:* ${eventName}%0A*Client:* ${clientName}%0A*Guests:* ${guestCount}%0A*Total Amount:* ₹${grandTotal.toLocaleString("en-IN")}%0A%0AGenerated via EventOS (The Operating System for Event Businesses).`;
    window.open(`https://api.whatsapp.com/send?text=${quoteSummary}`, "_blank");
    addToast("Opened WhatsApp proposal summary!", "success");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 bg-zinc-950 text-white rounded-3xl border border-purple-500/20 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-purple-400 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">
            <Calculator size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Instant Event Quote Generator
              </h2>
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-[10px] rounded-full uppercase tracking-wider">
                PDF Export
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Calculate live itemized event estimates & export official client proposals in 1-click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-zinc-700"
          >
            <FileText size={14} className="text-purple-400" />
            <span>Preview Proposal</span>
          </Button>
          <Button
            type="button"
            onClick={handlePrintPDF}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </Button>
          {isModal && (
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left Column: Event Specs & Line Items (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Event Metadata */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Building size={14} />
              <span>1. Event & Client Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Event Title</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Event Category</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Venue Setting</label>
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                >
                  {VENUE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guest Count Slider */}
            <div className="pt-2 space-y-2 border-t border-zinc-800/80">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Users size={14} className="text-purple-400" />
                  Expected Guest Capacity:
                </span>
                <span className="font-mono font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 text-sm">
                  {guestCount.toLocaleString()} Guests
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={3000}
                step={25}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Section 2: Line Items Selector */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FileText size={14} />
                <span>2. Select Production & Service Line Items</span>
              </h3>
              <span className="text-[10px] text-zinc-400">
                {selectedItems.length} of {items.length} items included
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item) => {
                const itemTotal = item.perGuest
                  ? item.unitPrice * guestCount
                  : item.unitPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      item.selected
                        ? "bg-purple-950/20 border-purple-500/40 shadow-sm"
                        : "bg-zinc-950/50 border-zinc-800/80 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[9px] px-2 py-0.2 bg-zinc-800 text-zinc-400 rounded-md">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                          {item.perGuest
                            ? `₹${item.unitPrice.toLocaleString("en-IN")} / guest × ${guestCount} guests`
                            : `₹${item.unitPrice.toLocaleString("en-IN")} flat rate`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!item.perGuest && item.selected && (
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-400"
                          >
                            -
                          </button>
                          <span className="px-1 text-white font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-400"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <div className="text-right min-w-[90px]">
                        <div className="text-xs font-mono font-black text-white">
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Item Row */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Add custom item (e.g. VIP Pyros & Cold Pyrotechnics)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(Number(e.target.value))}
                className="w-28 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
              />
              <Button
                type="button"
                onClick={handleAddCustomItem}
                className="w-full sm:w-auto px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary Card & Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-purple-500/30 rounded-2xl space-y-5 shadow-xl sticky top-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center justify-between">
              <span>Proposal Summary</span>
              <ShieldCheck size={16} className="text-purple-400" />
            </h3>

            {/* Price Calculations Table */}
            <div className="space-y-3 text-xs font-mono border-b border-zinc-800 pb-4">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({selectedItems.length} items):</span>
                <span className="text-white font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({appliedDiscount.code}):</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-400">
                <span>GST Tax ({taxPercent}%):</span>
                <span className="text-white">₹{taxAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                <span className="text-xs font-sans font-black uppercase tracking-wider text-zinc-300">
                  Estimated Total:
                </span>
                <div className="text-right">
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-sans">Includes taxes & full execution</div>
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                <Tag size={10} className="text-purple-400" />
                Promo Discount Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Try EVENTOS10 or VIP15"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono uppercase text-white focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={handlePrintPDF}
                className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Download Official PDF Proposal</span>
              </Button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Share Summary on WhatsApp 📲</span>
              </button>

              <button
                type="button"
                onClick={() => openModal("register")}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Save Quote to EventOS Workspace</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official PDF Proposal Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white text-zinc-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-10 shadow-2xl relative"
            >
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-black transition"
              >
                <X size={20} />
              </button>

              {/* Printable Branded Document */}
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-zinc-200 pb-6">
                  <div>
                    <h1 className="text-2xl font-black text-zinc-900">EventOS Official Proposal</h1>
                    <p className="text-xs text-zinc-500 mt-1">The Operating System for Event Businesses</p>
                  </div>
                  <div className="text-right text-xs text-zinc-500 font-mono">
                    <div><strong>Quote Ref:</strong> EOS-{Math.floor(100000 + Math.random() * 900000)}</div>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px] font-bold">Event Details</span>
                    <div className="font-bold text-zinc-900 text-sm mt-0.5">{eventName}</div>
                    <div className="text-zinc-600">{eventType} • {venueType}</div>
                    <div className="text-zinc-600 mt-1">{guestCount} Expected Guests</div>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px] font-bold">Prepared For</span>
                    <div className="font-bold text-zinc-900 text-sm mt-0.5">{clientName}</div>
                    <div className="text-zinc-600">{clientCompany}</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-300 text-zinc-500 uppercase text-[9px] font-bold">
                      <th className="py-2">Item Description</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {selectedItems.map((item) => {
                      const itemTotal = item.perGuest
                        ? item.unitPrice * guestCount
                        : item.unitPrice * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="py-2.5 font-bold text-zinc-900">{item.name}</td>
                          <td className="py-2.5 text-zinc-500">{item.category}</td>
                          <td className="py-2.5 text-right font-mono">
                            {item.perGuest ? `₹${item.unitPrice}/guest` : `₹${item.unitPrice}`}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-zinc-900">
                            ₹{itemTotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Grand Total */}
                <div className="border-t-2 border-zinc-900 pt-4 flex justify-between items-center text-sm font-bold">
                  <span>Grand Total (Incl. GST 18%):</span>
                  <span className="text-xl font-black text-purple-700 font-mono">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-6 border-t border-zinc-200 flex justify-between items-end text-[10px] text-zinc-500">
                  <div>
                    <div className="font-bold text-zinc-800">Authorized Signature:</div>
                    <div className="h-10 w-32 border-b border-zinc-400 mt-2"></div>
                  </div>
                  <div>Generated via EventOS Platform</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
