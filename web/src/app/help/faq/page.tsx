"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Search, ChevronDown, MessageSquare, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { FAQS } from "@/lib/helpData";
import { useHelpStore } from "@/store/helpStore";

const CATEGORIES = ["All", "Account", "CRM", "Finance", "Events", "Gallery", "Technical"];

const RELATED_DOCS_MAP: Record<string, { label: string; slug: string }> = {
  "Account": { label: "Getting Started Guide", slug: "getting-started" },
  "CRM": { label: "CRM & Leads Guide", slug: "crm" },
  "Finance": { label: "Milestone Invoicing & Finance Guide", slug: "finance" },
  "Events": { label: "Events & Run-of-Show Guide", slug: "events" },
  "Gallery": { label: "Media Proofing Galleries Guide", slug: "gallery" },
  "Technical": { label: "Troubleshooting & Settings Guide", slug: "getting-started" }
};

export default function FaqPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const { voteFaq, getFaqVote } = useHelpStore();

  const filtered = useMemo(() => {
    let items = FAQS;
    if (activeCategory !== "All") {
      items = items.filter((f) => f.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }
    return items;
  }, [activeCategory, searchQuery]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <PageShell
      title="Frequently Asked Questions"
      subtitle="Quick answers to common questions"
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "FAQ" }]}
    >
      <div className="space-y-6 select-none text-zinc-300 max-w-3xl">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs placeholder-zinc-600 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                  activeCategory === cat
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {filtered.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No FAQs found"
                description={searchQuery ? `No results for "${searchQuery}". Try different keywords.` : "No FAQs in this category yet."}
              />
            ) : (
              filtered.map((faq) => {
                const isOpen = openIds.includes(faq.id);
                return (
                  <div
                    key={faq.id}
                    className={cn(
                      "border rounded-2xl transition-all overflow-hidden",
                      isOpen ? "border-purple-500/15 bg-zinc-900/20" : "border-zinc-850 bg-zinc-950/20"
                    )}
                  >
                    <button
                      onClick={() => toggleOpen(faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <HelpCircle size={14} className={cn("shrink-0", isOpen ? "text-purple-400" : "text-zinc-600")} />
                        <span className={cn("text-xs font-bold truncate", isOpen ? "text-purple-300" : "text-zinc-200 group-hover:text-white")}>
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown size={14} className={cn("shrink-0 text-zinc-600 transition-transform", isOpen && "rotate-180 text-purple-400")} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="px-5 pb-4 pl-12">
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{faq.answer}</p>
                            
                            {/* Related Article */}
                            {RELATED_DOCS_MAP[faq.category] && (
                              <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-purple-400">
                                <span>Related Article:</span>
                                <button
                                  onClick={() => router.push(`/help/docs/${RELATED_DOCS_MAP[faq.category].slug}`)}
                                  className="hover:underline flex items-center gap-0.5 cursor-pointer text-purple-350"
                                >
                                  {RELATED_DOCS_MAP[faq.category].label} <ArrowRight size={8} />
                                </button>
                              </div>
                            )}

                            <div className="mt-4 flex items-center justify-between border-t border-zinc-900/60 pt-3">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-500">{faq.category}</span>
                              
                              {/* Helpful Voting */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-500 font-bold">Was this helpful?</span>
                                <button
                                  onClick={() => voteFaq(faq.id, "helpful")}
                                  className={cn(
                                    "p-1 border rounded-lg transition cursor-pointer",
                                    getFaqVote(faq.id) === "helpful"
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                      : "border-zinc-850 bg-zinc-900/40 text-zinc-550 hover:text-zinc-350"
                                  )}
                                  aria-label="Mark helpful"
                                >
                                  <ThumbsUp size={10} />
                                </button>
                                <button
                                  onClick={() => voteFaq(faq.id, "not_helpful")}
                                  className={cn(
                                    "p-1 border rounded-lg transition cursor-pointer",
                                    getFaqVote(faq.id) === "not_helpful"
                                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                                      : "border-zinc-850 bg-zinc-900/40 text-zinc-550 hover:text-zinc-350"
                                  )}
                                  aria-label="Mark unhelpful"
                                >
                                  <ThumbsDown size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* Submit a Question CTA */}
        <div className="border border-zinc-850 rounded-2xl p-6 bg-zinc-950/20 text-center space-y-3">
          <MessageSquare size={24} className="mx-auto text-purple-400" />
          <h3 className="text-sm font-extrabold text-zinc-200">Can&apos;t find your answer?</h3>
          <p className="text-[10px] text-zinc-500 font-semibold">Submit a support ticket and our team will get back to you within 4-8 business hours.</p>
          <button
            onClick={() => router.push("/help/support")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </PageShell>
  );
}
