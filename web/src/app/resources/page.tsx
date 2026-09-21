"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { 
  Download, 
  FileText, 
  CheckCircle2, 
  X, 
  FileSpreadsheet, 
  Calendar, 
  Sparkles, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";

interface ResourceItem {
  id: string;
  name: string;
  category: "checklists" | "spreadsheets" | "operations" | "financials";
  type: string;
  size: string;
  desc: string;
  filename: string;
  fileMime: string;
  content: string;
}

const RESOURCES: ResourceItem[] = [
  {
    id: "wedding_checklist",
    name: "Wedding Planning Master Checklist",
    category: "checklists",
    type: "Markdown / Guide",
    size: "1.4 MB",
    desc: "A comprehensive 12-month phase-by-phase master checklist for coordinators managing luxury weddings.",
    filename: "EventOS-Wedding-Planning-Master-Checklist.md",
    fileMime: "text/markdown",
    content: `# EventOS Wedding Planning Master Checklist
# Produced by EventOS (https://eventosapp.in)
# Designed for Luxury Wedding Coordinators & Event Agencies

=======================================================
PHASE 1: 9-12 MONTHS BEFORE THE WEDDING
=======================================================
[ ] 1. Initial Consultation & Vision Board Creation
    - Client budget bracket definition & flexibility margin
    - Color palette, mood board, aesthetic selection
    - Approximate guest headcount: Day 1 (Mehendi), Day 2 (Sangeet), Day 3 (Pheras / Reception)
[ ] 2. Venue Shortlisting & Site Inspections
    - Banquet hall, lawn capacity, rain contingency plan
    - Power backup (DG sets) load verification for AV & LED walls
    - Parking valet capacity & vendor unloading bays
[ ] 3. Key Vendor Lock-ins
    - Head photographer & cinematic videography team
    - Lead makeup artist (MUA) & bridal stylist
    - DJ, anchor/emcee, and live music performance artist

=======================================================
PHASE 2: 6-8 MONTHS BEFORE THE WEDDING
=======================================================
[ ] 4. Production, Decor & Floral Architecture
    - 3D stage renders approval with fabrication team
    - Floral sourcing schedule (exotic vs seasonal imports)
    - Sound clearance licenses (PPL, Novex, local commissioner permit)
[ ] 5. Catering & Tasting Sessions
    - Custom regional menu curation (Live counters, fusion cuisines)
    - Mocktail bar menu & mixologist scheduling
    - Dessert staging & midnight snack station plan

=======================================================
PHASE 3: 1-3 MONTHS BEFORE THE WEDDING
=======================================================
[ ] 6. Logistics & Hospitality Matrix
    - Airport & railway transfer charter schedule
    - Hotel room allotment mapping by family cluster
    - Welcome hampers placement checklist in guest suites
[ ] 7. Technical Run-Of-Show Draft
    - Sangeet sound-check slot timing
    - Entry pyrotechnics & dry-ice safety protocol
    - Anchor cue cards & family choreo running order

=======================================================
PHASE 4: 48 HOURS & EVENT DAY
=======================================================
[ ] 8. Coordinator Emergency Kit Checklist
    - Steamer, sewing kit, safety pins, fabric glue
    - Medical kit (antacids, band-aids, energy drinks, spray)
    - Walkie-talkie channel allotment (Ch 1: Core, Ch 2: Hospitality, Ch 3: Audio/Light)
    - Printed run-of-show copies for stage manager & couple assistants
`
  },
  {
    id: "budget_calculator",
    name: "Agency Operations Budget Calculator",
    category: "spreadsheets",
    type: "Excel / CSV",
    size: "3.2 MB",
    desc: "Track line items cost margins, agency management fees, and client milestone payment schedules.",
    filename: "EventOS-Operations-Budget-Calculator.csv",
    fileMime: "text/csv",
    content: `Item Category,Service Description,Vendor Name,Estimated Cost (INR),Actual Cost (INR),Agency Margin (%),Client Billed (INR),Payment Status
Decor & Production,Mandap Fabrication & Floral Architecture,Heritage Florals,450000,420000,20%,540000,50% Advance Paid
Audio Visual,40x20ft P3 LED Wall + Line Array Sound,Sonic Audio Staging,220000,210000,18%,259600,Advance Cleared
Hospitality,Airport Transfers (15 Innova Crysta),Rajdhani Travels,120000,115000,15%,138000,Draft
Artist & DJ,Celebrity Sangeet DJ + Live Dhol Troupes,DJ Rave & Crew,180000,180000,15%,207000,Fully Paid
Photography,3-Day Traditional + Candid + Drone Crew,Apex Studios,350000,340000,20%,420000,Milestone 2 Pending
Permits & Licenses,PPL + Novex Sound + Fire Safety NOC,Legal Compliance Desk,45000,42000,10%,49500,Cleared
Total Budget Summary,All Production Streams Combined,,1365000,1307000,18.5%,1614100,68% Collected
`
  },
  {
    id: "vendor_checklist",
    name: "Elite Vendor Audit Checklist",
    category: "checklists",
    type: "PDF / Markdown",
    size: "850 KB",
    desc: "Rigorous quality-control criteria to ask catering, florist, AV staging and sound companies before signing contracts.",
    filename: "EventOS-Vendor-Audit-Checklist.md",
    fileMime: "text/markdown",
    content: `# EventOS Elite Vendor Audit & Compliance Checklist
# Quality Assurance System for Wedding Planners

1. AUDIO & VISUAL PRODUCTION VENDORS:
   [ ] Generator Backup: Dual 125kVA soundless silent generators on standby?
   [ ] Audio Failover: Dual wireless microphone receivers with auto-frequency switching?
   [ ] Line Array Rigging: Certified safety cables (no frayed carabiners)?
   [ ] Rain Contingency: Waterproof covers for amplifiers, subwoofers, and mix console?

2. FLORAL & DECOR CONTRACTORS:
   [ ] Structural Stability: Metal truss stress testing for ceiling chandeliers exceeding 50kg?
   [ ] Freshness Assurance: Cold-storage transit verified for imported hydrangeas and orchids?
   [ ] Strike Timetable: Guaranteed cleanup and teardown completed within 4 hours post-event?

3. CATERING & BEVERAGE PARTNERS:
   [ ] Food Handlers Hygiene: FSSAI food licensing certificates verified?
   [ ] Water Source: RO purified water for all cooking and ice-cube machines?
   [ ] Live Counter Safety: Fire extinguishers (CO2 + Dry Chemical) at each tandoor station?
`
  },
  {
    id: "client_questionnaire",
    name: "New Client Onboarding Questionnaire",
    category: "operations",
    type: "DocX Template",
    size: "450 KB",
    desc: "Gather style preferences, guest counts estimates, and budget ranges in your initial client consultation.",
    filename: "EventOS-Client-Onboarding-Questionnaire.txt",
    fileMime: "text/plain",
    content: `=======================================================
EVENTOS CLIENT ONBOARDING & DISCOVERY QUESTIONNAIRE
=======================================================

1. CLIENT OVERVIEW:
   - Primary Contacts (Bride & Groom / Host Names): ________________________
   - WhatsApp / Phone Number: ________________________
   - Preferred Communication Channel: [ ] WhatsApp  [ ] Email  [ ] Phone Calls

2. EVENT PROFILE:
   - Event Occasion: [ ] Luxury Wedding  [ ] Corporate Summit  [ ] Milestone Gala
   - Expected Date(s): ________________________
   - Preferred Destination / City: ________________________
   - Total Anticipated Guest Count: ________________________

3. BUDGET & PRODUCTION SCALE:
   - Target Total Expenditure Bracket:
     [ ] ₹25L - ₹50L   [ ] ₹50L - ₹1 Crore   [ ] ₹1 Crore - ₹3 Crores   [ ] ₹3 Crores+
   - Priority Investment Allocation:
     (Rank 1 to 5: Decor, Artist/Entertainment, Catering, Hospitality/Gifting, Photography)

4. AESTHETIC & THEMATIC DIRECTION:
   - Desired Atmosphere: [ ] Royal Heritage  [ ] Modern Minimalist  [ ] Boho Rustic  [ ] Cyberpunk Sangeet
   - Strict "Do Not Do" preferences: _____________________________________________
`
  },
  {
    id: "event_timeline",
    name: "Run-of-Show Master Timetable",
    category: "operations",
    type: "Excel / CSV",
    size: "2.1 MB",
    desc: "Sample event coordinator master timetable mapped minute-by-minute with audio, video, and cue signals.",
    filename: "EventOS-Run-Of-Show-Timeline.csv",
    fileMime: "text/csv",
    content: `Time,Phase / Activity,Location,Lead Coordinator,Audio Cue,Visual / Lighting Cue,Notes
16:00,Vendor Sound Check & LED calibration,Main Stage,Arjun (Audio Lead),Instrumental Sound Check,P3 LED Loop Test,Sound pressure level limit: 85dB
17:30,Baraat Assembly & Refreshments,Resort Front Gate,Neha (Hospitality),Live Dhol & Brass Band,Warm Amber Wash,Cold water bottles distribution
18:15,Baraat Procession Begins,Driveway to Gate 2,Karan (Logistics),Traditional Punjabi Playlist,Mobile LED follow-spot,Electric golf cart ready for grandparents
19:00,Milni Ceremony & Jaimala Staging,Poolside Lawn,Pooja (Stage Lead),Theme Orchestral Strings,Haze + 4000K Front Spotlight,Jaimala garlands delivered by assistant
19:30,Stage Pheras Transition,Mandap Pavilion,Arjun (Audio Lead),Vedic Chants Flute Track,Golden Amber Mandala Wash,Pundit mic volume checked
21:00,Dinner Live Counters Opened,Banquet Garden,Food Coordinator,Ambient Jazz Fusion,Warm Fairy Lights + Uplighting,VIP family table service active
23:00,After-Party / Sangeet Floor Open,Indoor Club Hall,DJ & Tech Crew,High-Energy EDM / Bollywood,Strobe + Moving Heads + CO2 Jets,Bar service active until 03:00 AM
`
  },
  {
    id: "pricing_template",
    name: "Agency Pricing & Quotation Matrix",
    category: "financials",
    type: "Excel / CSV",
    size: "1.8 MB",
    desc: "Pre-formulated sheet to calculate labor rates, materials costs, markup percentages, and GST outlines.",
    filename: "EventOS-Pricing-Quotation-Matrix.csv",
    fileMime: "text/csv",
    content: `Module Code,Service Component,Cost Basis,Agency Cost (INR),Markup Multiplier,Quoted Price (INR),GST (18%),Final Client Rate (INR)
PLN-01,Full-Service Wedding Planning,Fixed Retainer,250000,1.40,350000,63000,413000
DEC-02,Bespoke Floral & Lighting Design,Pass-through + Margin,500000,1.25,625000,112500,737500
HSP-03,Airport & Hotel Hospitality Desk,Daily per coordinator,45000,1.30,58500,10530,69030
LOG-04,Fleet Logistics & Luggage Transit,Per Vehicle Tier,85000,1.20,102000,18360,120360
PRM-05,Licensing & Permissions Clearances,Lump sum,35000,1.15,40250,7245,47495
`
  },
  {
    id: "invoice_template",
    name: "Milestone E-Invoicing Template",
    category: "financials",
    type: "HTML / Printable",
    size: "1.1 MB",
    desc: "Professional milestone invoice structure with clear bank details, GST compliance, and milestone terms.",
    filename: "EventOS-Milestone-Invoice-Template.html",
    fileMime: "text/html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EventOS Professional Milestone Invoice</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px; margin: 0; }
    .invoice-box { max-width: 800px; margin: auto; background: #101524; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 25px; }
    .brand { font-size: 24px; font-weight: 900; color: #a855f7; letter-spacing: -0.5px; }
    .invoice-details { text-align: right; font-size: 13px; color: #94a3b8; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #a855f7; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .total { text-align: right; margin-top: 25px; font-size: 18px; font-weight: bold; color: #38bdf8; }
    .footer { margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="brand">EventOS Agency Workspace</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">Apex Luxury Wedding & Production Group</div>
      </div>
      <div class="invoice-details">
        <div><strong>Invoice #:</strong> EV-2026-0842</div>
        <div><strong>Date:</strong> 21 September 2026</div>
        <div><strong>Due Date:</strong> Immediate (Milestone 1)</div>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Milestone Scope</th><th>Scheduled Date</th><th>Percentage</th><th>Amount (INR)</th></tr>
      </thead>
      <tbody>
        <tr><td>Retainer & Initial Date Hold</td><td>Immediate</td><td>30%</td><td>₹4,50,000</td></tr>
        <tr><td>Vendor Lock-in & Production Advances</td><td>45 Days Before Event</td><td>40%</td><td>₹6,00,000</td></tr>
        <tr><td>Final Balance & Strike Teardown</td><td>7 Days Before Event</td><td>30%</td><td>₹4,50,000</td></tr>
      </tbody>
    </table>
    <div class="total">Total Due: ₹4,50,000 (Milestone 1)</div>
    <div class="footer">Thank you for choosing EventOS Enterprise. Bank Transfer & UPI payments verified automatically.</div>
  </div>
</body>
</html>
`
  },
  {
    id: "proposal_template",
    name: "Interactive Sangeet Proposal Pitch",
    category: "operations",
    type: "Presentation / Markdown",
    size: "5.4 MB",
    desc: "Pitch deck presentation styling designed to close high-ticket luxury event production deals.",
    filename: "EventOS-Interactive-Proposal-Pitch.md",
    fileMime: "text/markdown",
    content: `# EventOS Luxury Sangeet Experience Proposal
# Client: Singhania & Kapoor Wedding Celebrations
# Prepared by: EventOS Luxury Production Group

SLIDE 1: COVER
- Title: Celestial Nocturne - A Night of Starlit Beats & High Energy
- Venue: The Grand Ballroom & Lawn, Udaipur
- Date: 18 December 2026

SLIDE 2: THE EXPERIENCE ARCHITECTURE
- Concept: Fusion of Rajputana heritage with futuristic kinetic lighting.
- Stage Design: 360-degree tiered catwalk with 40-foot curved P3 LED Backdrop.
- Entry Tunnel: 50-foot infinity mirror archway with synced ambient soundscape.

SLIDE 3: ENTERTAINMENT & RUNNING ORDER
- 19:30 - Red Carpet Arrival & Molecular Cocktail Hour
- 20:30 - Family Performance Chapters (5 Themed Dances)
- 22:00 - Celebrity Artist Feature Set (90 Minutes)
- 23:30 - Silent Disco After-Party Transition

SLIDE 4: BUDGET & MILESTONES SUMMARY
- Complete Sound, Light, Trussing & Truss Rigging: ₹12,50,000
- Custom Catwalk Stage & Tunnel Fabrication: ₹8,00,000
- Artist Hospitality & Backline Rider: ₹4,50,000
- Coordinator Operations Fee: ₹3,00,000
- Total Production Proposal: ₹28,00,000 + GST
`
  }
];

export default function ResourcesPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeResource, setActiveResource] = useState<ResourceItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredResources = RESOURCES.filter((r) => {
    const matchesCat = selectedCategory === "all" || r.category === selectedCategory;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Real client-side file downloader function
  const triggerRealDownload = (resource: ResourceItem) => {
    try {
      setDownloadingId(resource.id);
      const blob = new Blob([resource.content], { type: resource.fileMime || "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resource.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(`Downloaded ${resource.filename} successfully! 📥`, "success");
    } catch (err) {
      console.error("Failed to download resource:", err);
      addToast("Failed to download template. Please try again.", "error");
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 700);
    }
  };

  const handleModalDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResource) return;

    triggerRealDownload(activeResource);
    setDownloadSuccess(true);

    setTimeout(() => {
      setActiveResource(null);
      setEmail("");
      setDownloadSuccess(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Liquid background glow effects */}
      <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[35%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.1)_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-10 w-full relative z-10">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-bold uppercase tracking-widest text-purple-400">
            <Sparkles size={13} className="text-purple-400 animate-pulse" />
            Free Lead Magnets & Toolkits
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Download SaaS Resource Pack.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium">
            Industry-standard master checklists, budget spreadsheets, vendor auditing matrices, and pitch decks engineered to optimize your event management agency.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto bg-[#101524]/80 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: "all", label: "All Templates" },
              { id: "checklists", label: "Checklists" },
              { id: "spreadsheets", label: "Spreadsheets & Budgets" },
              { id: "operations", label: "Operations" },
              { id: "financials", label: "Financials" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0B0F19] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto select-none">
          {filteredResources.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex"
            >
              <div className="p-5 border border-white/10 bg-[#101524] hover:bg-[#141B2D] hover:border-purple-500/40 rounded-2xl flex flex-col justify-between items-stretch w-full relative transition-all duration-300 shadow-md group">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2.5 py-0.5 rounded-lg font-bold uppercase font-mono tracking-wider">
                      {r.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">{r.size}</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {r.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal min-h-[48px]">
                      {r.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-5 space-y-2">
                  <button
                    onClick={() => triggerRealDownload(r)}
                    disabled={downloadingId === r.id}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/25 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {downloadingId === r.id ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-300 animate-scale-in" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download size={13} />
                        <span>Download File</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveResource(r)}
                    className="w-full py-1 text-[11px] text-slate-400 hover:text-purple-300 transition-colors font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Email me a copy</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Signup Panel */}
        <div className="max-w-4xl mx-auto p-8 border border-white/10 bg-[#101524] rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block font-mono">Operations Updates</span>
            <h4 className="text-base font-bold text-white">Join our Wedding Operations Newsletter</h4>
            <p className="text-xs text-slate-400 font-medium max-w-sm">Get new Excel spreadsheets, vendor SLA frameworks, and wedding timeline templates delivered to your inbox.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addToast("Thank you for joining the EventOS updates list! ✉", "success");
            }}
            className="flex w-full md:w-auto gap-2 text-xs"
          >
            <input
              required
              type="email"
              placeholder="name@agency.com"
              className="px-3.5 py-2.5 bg-[#0B0F19] border border-white/10 focus:border-purple-500 text-white rounded-xl focus:outline-none placeholder-slate-500 text-xs font-medium w-full sm:w-60"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-md shadow-purple-600/30 shrink-0 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </main>

      {/* Download Lead Capture Modal Overlay */}
      <AnimatePresence>
        {activeResource && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden select-none font-sans text-xs">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveResource(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-[#0B0F19] border border-purple-500/25 p-6 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-5 text-white"
            >
              {/* Close button */}
              <button
                onClick={() => setActiveResource(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-2">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileText size={22} />
                </div>
                <h3 className="text-sm font-bold text-white">Download {activeResource.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto font-medium">
                  Click below to trigger an instant download of <strong>{activeResource.filename}</strong>.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!downloadSuccess ? (
                  <form
                    onSubmit={handleModalDownload}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Your Work Email (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="planner@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#101524] border border-white/10 focus:border-purple-500 rounded-xl text-white focus:outline-none text-xs font-medium placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      <span>Download {activeResource.filename}</span>
                    </button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-3 space-y-2"
                  >
                    <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="text-xs text-emerald-400 font-bold block">Download Initiated!</span>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      Your browser has started downloading {activeResource.filename}.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
