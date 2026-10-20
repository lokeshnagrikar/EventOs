export interface EventTypeDefinition {
  key: string;
  label: string;
  category: "Weddings & Ceremonies" | "Corporate & MICE" | "Social & Private" | "Entertainment & Mega" | "Other";
  badgeColor: string; // Tailwind color classes for badges
  accentColor: string;
}

export const EVENT_TYPES: EventTypeDefinition[] = [
  // ─── 💍 Weddings & Ceremonies ───
  { key: "WEDDING", label: "Wedding Ceremony (Shaadi)", category: "Weddings & Ceremonies", badgeColor: "border-pink-500/20 bg-pink-500/5 text-pink-400", accentColor: "#ec4899" },
  { key: "RECEPTION", label: "Grand Reception", category: "Weddings & Ceremonies", badgeColor: "border-rose-500/20 bg-rose-500/5 text-rose-400", accentColor: "#f43f5e" },
  { key: "SANGEET", label: "Sangeet, Mehendi & Haldi", category: "Weddings & Ceremonies", badgeColor: "border-amber-500/20 bg-amber-500/5 text-amber-400", accentColor: "#f59e0b" },
  { key: "ENGAGEMENT", label: "Engagement / Roka Decor", category: "Weddings & Ceremonies", badgeColor: "border-purple-500/20 bg-purple-500/5 text-purple-400", accentColor: "#a855f7" },
  { key: "DESTINATION_WEDDING", label: "Destination Wedding", category: "Weddings & Ceremonies", badgeColor: "border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-400", accentColor: "#d946ef" },
  { key: "ANNIVERSARY", label: "Anniversary Celebration", category: "Weddings & Ceremonies", badgeColor: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400", accentColor: "#6366f1" },

  // ─── 🏢 Corporate & MICE ───
  { key: "CORPORATE", label: "Corporate Summit & Conference", category: "Corporate & MICE", badgeColor: "border-blue-500/20 bg-blue-500/5 text-blue-400", accentColor: "#3b82f6" },
  { key: "PRODUCT_LAUNCH", label: "Product Launch & Activation", category: "Corporate & MICE", badgeColor: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400", accentColor: "#06b6d4" },
  { key: "GALA", label: "Annual Gala & Award Night", category: "Corporate & MICE", badgeColor: "border-teal-500/20 bg-teal-500/5 text-teal-400", accentColor: "#14b8a6" },
  { key: "EXHIBITION", label: "Exhibition & Trade Expo", category: "Corporate & MICE", badgeColor: "border-sky-500/20 bg-sky-500/5 text-sky-400", accentColor: "#0284c7" },
  { key: "RETREAT", label: "Team Offsite & Retreat", category: "Corporate & MICE", badgeColor: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400", accentColor: "#10b981" },

  // ─── 🎉 Social & Private Parties ───
  { key: "BIRTHDAY", label: "Birthday Celebration", category: "Social & Private", badgeColor: "border-emerald-500/20 bg-emerald-500/5 text-emerald-455", accentColor: "#10b981" },
  { key: "BABY_SHOWER", label: "Baby Shower / Naming Ceremony", category: "Social & Private", badgeColor: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400", accentColor: "#eab308" },
  { key: "COCKTAIL", label: "Cocktail & Bachelor Party", category: "Social & Private", badgeColor: "border-violet-500/20 bg-violet-500/5 text-violet-400", accentColor: "#8b5cf6" },
  { key: "HOUSEWARMING", label: "Housewarming (Griha Pravesh)", category: "Social & Private", badgeColor: "border-orange-500/20 bg-orange-500/5 text-orange-400", accentColor: "#f97316" },
  { key: "SOCIAL", label: "Private Social Gathering", category: "Social & Private", badgeColor: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400", accentColor: "#71717a" },

  // ─── 🎪 Live Entertainment & Mega Events ───
  { key: "CONCERT", label: "Music Concert & Live Gig / DJ", category: "Entertainment & Mega", badgeColor: "border-red-500/20 bg-red-500/5 text-red-400", accentColor: "#ef4444" },
  { key: "FASHION_SHOW", label: "Fashion Show & Runway", category: "Entertainment & Mega", badgeColor: "border-pink-600/20 bg-pink-600/5 text-pink-300", accentColor: "#db2777" },
  { key: "COLLEGE_FEST", label: "College / Cultural Festival", category: "Entertainment & Mega", badgeColor: "border-amber-600/20 bg-amber-600/5 text-amber-300", accentColor: "#d97706" },
  { key: "SPORTS", label: "Sports Tournament / Marathon", category: "Entertainment & Mega", badgeColor: "border-lime-500/20 bg-lime-500/5 text-lime-400", accentColor: "#84cc16" },

  // ─── 🌐 Other ───
  { key: "OTHER", label: "Custom / Bespoke Event", category: "Other", badgeColor: "border-slate-500/20 bg-slate-500/5 text-slate-400", accentColor: "#64748b" }
];

export const EVENT_CATEGORIES = [
  "Weddings & Ceremonies",
  "Corporate & MICE",
  "Social & Private",
  "Entertainment & Mega",
  "Other"
] as const;

export const EVENT_TYPES_GROUPED = EVENT_CATEGORIES.map(category => ({
  category,
  options: EVENT_TYPES.filter(t => t.category === category)
}));

export interface LeadSourceDefinition {
  key: string;
  label: string;
  category: string;
}

export const LEAD_SOURCES: LeadSourceDefinition[] = [
  { key: "WhatsApp", label: "WhatsApp Direct Inquiry", category: "Messaging & Direct" },
  { key: "Direct_Call", label: "Direct Phone Call / Walk-in", category: "Messaging & Direct" },
  { key: "Instagram", label: "Instagram DM / Profile", category: "Social Media" },
  { key: "Facebook", label: "Facebook / Meta", category: "Social Media" },
  { key: "WedMeGood", label: "WedMeGood Portal", category: "Marketplaces & Directories" },
  { key: "WeddingWire", label: "WeddingWire / JustDial", category: "Marketplaces & Directories" },
  { key: "Venue_Partner", label: "Banquet / Venue Partner Referral", category: "Referrals & Network" },
  { key: "Referral", label: "Client Word of Mouth Referral", category: "Referrals & Network" },
  { key: "Google_Search", label: "Google Organic Search", category: "Digital Marketing" },
  { key: "Meta_Ads", label: "Meta / Instagram Paid Ads", category: "Digital Marketing" },
  { key: "Website", label: "Agency Website Contact Form", category: "Digital Marketing" },
  { key: "Other", label: "Other Source", category: "Other" }
];

export function getEventTypeBadge(typeKey: string | undefined): { label: string; color: string } {
  if (!typeKey) return { label: "Custom Event", color: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400" };
  const upper = typeKey.toUpperCase();
  const found = EVENT_TYPES.find(t => t.key === upper || t.label.toUpperCase() === upper);
  if (found) {
    return { label: found.label, color: found.badgeColor };
  }
  // Title-cased fallback
  const fallbackLabel = typeKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return { label: fallbackLabel, color: "border-purple-500/20 bg-purple-500/5 text-purple-400" };
}
