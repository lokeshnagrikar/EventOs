import { create } from "zustand";

export type CelebrationMilestone =
  | "workspace_created"
  | "first_lead"
  | "first_booking"
  | "first_invoice"
  | "first_gallery"
  | "first_payment"
  | "first_event"
  | "first_quote"
  | "trial_completed"
  | "onboarding_complete";

interface CelebrationState {
  activeCelebration: CelebrationMilestone | null;
  shownCelebrations: CelebrationMilestone[];

  triggerCelebration: (milestone: CelebrationMilestone) => void;
  dismissCelebration: () => void;
  hasCelebrated: (milestone: CelebrationMilestone) => boolean;
}

const CELEBRATION_MESSAGES: Record<CelebrationMilestone, { title: string; subtitle: string; emoji: string }> = {
  workspace_created: { title: "Workspace Created!", subtitle: "Your professional event management workspace is live.", emoji: "🏢" },
  first_lead: { title: "First Lead Added!", subtitle: "Your CRM pipeline has its first prospect.", emoji: "🎯" },
  first_booking: { title: "First Booking!", subtitle: "You've converted a quote into a confirmed booking.", emoji: "📋" },
  first_invoice: { title: "First Invoice Generated!", subtitle: "Your billing pipeline is now operational.", emoji: "💰" },
  first_gallery: { title: "First Gallery Created!", subtitle: "You can now share event media with clients.", emoji: "📸" },
  first_payment: { title: "First Payment Received!", subtitle: "Revenue is flowing through your platform.", emoji: "🎉" },
  first_event: { title: "First Event Scheduled!", subtitle: "Your event calendar is getting busy.", emoji: "📅" },
  first_quote: { title: "First Quote Sent!", subtitle: "Your client has a professional proposal to review.", emoji: "📝" },
  trial_completed: { title: "Trial Completed!", subtitle: "You've explored all the key features of EventOS.", emoji: "🏆" },
  onboarding_complete: { title: "Onboarding Complete!", subtitle: "You're now a power user. Let's build something great.", emoji: "🚀" },
};

const getShownCelebrations = (): CelebrationMilestone[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("eventos_celebrations_shown");
  return stored ? JSON.parse(stored) : [];
};

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  activeCelebration: null,
  shownCelebrations: getShownCelebrations(),

  triggerCelebration: (milestone: CelebrationMilestone) => {
    if (get().shownCelebrations.includes(milestone)) return;

    const updated = [...get().shownCelebrations, milestone];
    set({ activeCelebration: milestone, shownCelebrations: updated });

    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_celebrations_shown", JSON.stringify(updated));
    }

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => state.activeCelebration === milestone ? { activeCelebration: null } : state);
    }, 4000);
  },

  dismissCelebration: () => set({ activeCelebration: null }),

  hasCelebrated: (milestone: CelebrationMilestone) => get().shownCelebrations.includes(milestone),
}));

export { CELEBRATION_MESSAGES };
