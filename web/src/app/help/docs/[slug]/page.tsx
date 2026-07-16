"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Info,
  Lightbulb,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { ARTICLES, Article, ArticleSection } from "@/lib/helpData";
import { useHelpStore } from "@/store/helpStore";
import { Bookmark, BookmarkCheck } from "lucide-react";

const CALLOUT_STYLES: Record<string, { icon: React.ElementType; border: string; bg: string; text: string; iconColor: string }> = {
  note: { icon: Info, border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-300", iconColor: "text-blue-400" },
  warning: { icon: AlertTriangle, border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-300", iconColor: "text-amber-400" },
  tip: { icon: Lightbulb, border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-300", iconColor: "text-emerald-400" },
};

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [activeSection, setActiveSection] = useState("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { addBookmark, removeBookmark, isBookmarked, addRecentlyViewed } = useHelpStore();

  const article = useMemo(() => ARTICLES.find((a) => a.slug === slug), [slug]);
  const articleIndex = useMemo(() => ARTICLES.findIndex((a) => a.slug === slug), [slug]);
  const prevArticle = articleIndex > 0 ? ARTICLES[articleIndex - 1] : null;
  const nextArticle = articleIndex < ARTICLES.length - 1 ? ARTICLES[articleIndex + 1] : null;
  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return article.relatedSlugs.map((s) => ARTICLES.find((a) => a.slug === s)).filter(Boolean) as Article[];
  }, [article]);

  useEffect(() => {
    if (article) {
      addRecentlyViewed(article.slug, article.title);
    }
  }, [article, addRecentlyViewed]);

  const bookmarked = article ? isBookmarked(article.slug) : false;

  // Track active section via scroll
  useEffect(() => {
    if (!article) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [article]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!article) {
    return (
      <PageShell title="Article Not Found" breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Documentation", href: "/help/docs" }]}>
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <BookOpen size={48} className="text-zinc-700" />
          <h2 className="text-lg font-extrabold text-zinc-300">Article not found</h2>
          <p className="text-xs text-zinc-500 font-semibold">The article &quot;{slug}&quot; does not exist.</p>
          <button onClick={() => router.push("/help/docs")} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer">
            Browse Documentation
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={article.title}
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Documentation", href: "/help/docs" }, { label: article.category }, { label: article.title }]}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="select-none text-zinc-300"
      >
        <div className="flex gap-8">
          {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
          <div className="flex-1 max-w-3xl space-y-8">
            {/* Article Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                article.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400"
                  : article.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
              )}>
                {article.difficulty}
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                <Clock size={10} /> {article.readingTime} min read
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">Updated {article.lastUpdated}</span>
              <span className="text-[10px] text-purple-400/60 font-bold">{article.category}</span>
              
              <button
                onClick={() => bookmarked ? removeBookmark(article.slug) : addBookmark(article.slug)}
                className={cn(
                  "ml-auto flex items-center gap-1.5 px-3 py-1 border rounded-xl text-[10px] font-bold transition cursor-pointer",
                  bookmarked
                    ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                    : "border-zinc-850 bg-zinc-900/40 text-zinc-450 hover:text-zinc-200"
                )}
              >
                {bookmarked ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            </div>

            {/* Content Sections */}
            {article.content.map((section) => {
              const callout = section.type && CALLOUT_STYLES[section.type];
              return (
                <div
                  key={section.id}
                  id={section.id}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className="space-y-3"
                >
                  <h2 className="text-base font-extrabold text-zinc-100 tracking-tight">{section.heading}</h2>

                  {callout ? (
                    <div className={cn("flex items-start gap-3 p-4 rounded-xl border", callout.border, callout.bg)}>
                      <callout.icon size={16} className={cn("shrink-0 mt-0.5", callout.iconColor)} />
                      <p className={cn("text-xs font-semibold leading-relaxed", callout.text)}>{section.body}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{section.body}</p>
                  )}

                  {section.code && (
                    <div className="relative">
                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-t-xl">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase">{section.codeLanguage || "code"}</span>
                        <button
                          onClick={() => handleCopyCode(section.code!, section.id)}
                          className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white font-bold cursor-pointer"
                        >
                          {copiedCode === section.id ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                      <pre className="p-4 bg-zinc-950 border border-t-0 border-zinc-800 rounded-b-xl overflow-x-auto">
                        <code className="text-[11px] text-zinc-300 font-mono">{section.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Feedback */}
            <div className="border border-zinc-850 rounded-2xl p-6 bg-zinc-950/20 text-center space-y-3">
              <p className="text-xs font-bold text-zinc-400">Was this article helpful?</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setFeedback("up")}
                  className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer", feedback === "up" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400")}
                >
                  <ThumbsUp size={14} /> Yes
                </button>
                <button
                  onClick={() => setFeedback("down")}
                  className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer", feedback === "down" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400")}
                >
                  <ThumbsDown size={14} /> No
                </button>
              </div>
              {feedback && <p className="text-[10px] text-zinc-500 font-semibold">Thank you for your feedback!</p>}
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Related Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {relatedArticles.map((rel) => (
                    <button
                      key={rel.slug}
                      onClick={() => router.push(`/help/docs/${rel.slug}`)}
                      className="group text-left p-4 rounded-xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/15 transition-all space-y-1.5 cursor-pointer"
                    >
                      <p className="text-[11px] font-extrabold text-zinc-200 group-hover:text-white">{rel.title}</p>
                      <p className="text-[9px] text-zinc-550 font-semibold">{rel.category} • {rel.readingTime} min</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prev / Next */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
              {prevArticle ? (
                <button onClick={() => router.push(`/help/docs/${prevArticle.slug}`)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer">
                  <ArrowLeft size={14} /> {prevArticle.title}
                </button>
              ) : <div />}
              {nextArticle ? (
                <button onClick={() => router.push(`/help/docs/${nextArticle.slug}`)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer">
                  {nextArticle.title} <ArrowRight size={14} />
                </button>
              ) : <div />}
            </div>
          </div>

          {/* ── TABLE OF CONTENTS (STICKY) ──────────────────────────────── */}
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-24 space-y-3">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">On this page</h4>
              <nav className="space-y-1 border-l border-zinc-850 pl-3">
                {article.content.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      sectionRefs.current[section.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={cn(
                      "block w-full text-left text-[10px] font-semibold py-1 transition-colors cursor-pointer truncate",
                      activeSection === section.id ? "text-purple-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {section.heading}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </motion.div>
    </PageShell>
  );
}
