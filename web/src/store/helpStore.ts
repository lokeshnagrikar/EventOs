import { create } from "zustand";

export interface HelpState {
  bookmarks: string[]; // article slugs
  recentlyViewed: { slug: string; title: string; viewedAt: string }[];
  tutorialProgress: Record<string, boolean>; // tutorial ID -> completed
  faqVotes: Record<string, "helpful" | "not_helpful">; // faq ID -> vote

  addBookmark: (slug: string) => void;
  removeBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  addRecentlyViewed: (slug: string, title: string) => void;
  markTutorialComplete: (tutorialId: string) => void;
  isTutorialComplete: (tutorialId: string) => boolean;
  voteFaq: (faqId: string, vote: "helpful" | "not_helpful") => void;
  getFaqVote: (faqId: string) => "helpful" | "not_helpful" | null;
}

const getInitialState = () => {
  if (typeof window === "undefined") {
    return { bookmarks: [], recentlyViewed: [], tutorialProgress: {}, faqVotes: {} };
  }

  const stored = {
    bookmarks: localStorage.getItem("eventos_help_bookmarks"),
    recentlyViewed: localStorage.getItem("eventos_help_recently_viewed"),
    tutorialProgress: localStorage.getItem("eventos_tutorial_progress"),
    faqVotes: localStorage.getItem("eventos_faq_votes"),
  };

  return {
    bookmarks: stored.bookmarks ? JSON.parse(stored.bookmarks) : [],
    recentlyViewed: stored.recentlyViewed ? JSON.parse(stored.recentlyViewed) : [],
    tutorialProgress: stored.tutorialProgress ? JSON.parse(stored.tutorialProgress) : {},
    faqVotes: stored.faqVotes ? JSON.parse(stored.faqVotes) : {},
  };
};

const initial = getInitialState();

export const useHelpStore = create<HelpState>((set, get) => ({
  bookmarks: initial.bookmarks,
  recentlyViewed: initial.recentlyViewed,
  tutorialProgress: initial.tutorialProgress,
  faqVotes: initial.faqVotes,

  addBookmark: (slug: string) => {
    const current = get().bookmarks;
    if (current.includes(slug)) return;
    const updated = [...current, slug];
    set({ bookmarks: updated });
    if (typeof window !== "undefined") localStorage.setItem("eventos_help_bookmarks", JSON.stringify(updated));
  },

  removeBookmark: (slug: string) => {
    const updated = get().bookmarks.filter((s) => s !== slug);
    set({ bookmarks: updated });
    if (typeof window !== "undefined") localStorage.setItem("eventos_help_bookmarks", JSON.stringify(updated));
  },

  isBookmarked: (slug: string) => get().bookmarks.includes(slug),

  addRecentlyViewed: (slug: string, title: string) => {
    const current = get().recentlyViewed.filter((r) => r.slug !== slug);
    const updated = [{ slug, title, viewedAt: new Date().toISOString() }, ...current].slice(0, 10);
    set({ recentlyViewed: updated });
    if (typeof window !== "undefined") localStorage.setItem("eventos_help_recently_viewed", JSON.stringify(updated));
  },

  markTutorialComplete: (tutorialId: string) => {
    const updated = { ...get().tutorialProgress, [tutorialId]: true };
    set({ tutorialProgress: updated });
    if (typeof window !== "undefined") localStorage.setItem("eventos_tutorial_progress", JSON.stringify(updated));
  },

  isTutorialComplete: (tutorialId: string) => !!get().tutorialProgress[tutorialId],

  voteFaq: (faqId: string, vote: "helpful" | "not_helpful") => {
    const updated = { ...get().faqVotes, [faqId]: vote };
    set({ faqVotes: updated });
    if (typeof window !== "undefined") localStorage.setItem("eventos_faq_votes", JSON.stringify(updated));
  },

  getFaqVote: (faqId: string) => get().faqVotes[faqId] || null,
}));
