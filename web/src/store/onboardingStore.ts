import { create } from "zustand";
import { api } from "../lib/api";

export interface OnboardingState {
  isOpen: boolean;
  completedSteps: string[];
  skipped: boolean;
  isTourActive: boolean;
  tourStep: number;
  tourCompleted: boolean;
  tourPaused: boolean;
  tourPausedStep: number;
  loadedDemo: boolean;
  progress: number;
  currentWizardStep: number;
  wizardData: Record<string, any>;

  openOnboarding: () => void;
  closeOnboarding: () => void;
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  restartTour: () => void;
  loadDemoWorkspace: () => Promise<void>;
  resetDemoWorkspace: () => Promise<void>;
  setWizardStep: (step: number) => void;
  updateWizardData: (data: Record<string, any>) => void;
  resumeWizard: () => void;
}

const CHECKLIST_STEPS = [
  "company_profile",
  "logo",
  "brand_colors",
  "invite_member",
  "add_lead",
  "create_quote",
  "convert_booking",
  "schedule_event",
  "upload_gallery",
  "generate_invoice",
  "connect_stripe",
  "first_payment",
  "enable_notifications",
  "explore_ai"
];

const TOTAL_WIZARD_STEPS = 9;

// Safe client-side localstorage hydrate
const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      isOpen: false,
      completedSteps: [],
      skipped: false,
      isTourActive: false,
      tourStep: 0,
      tourCompleted: false,
      tourPaused: false,
      tourPausedStep: 0,
      loadedDemo: false,
      progress: 0,
      currentWizardStep: 1,
      wizardData: {}
    };
  }

  const storedStatus = localStorage.getItem("eventos_onboarding_status");
  const storedSteps = localStorage.getItem("eventos_onboarding_completed_steps");
  const storedWizardStep = localStorage.getItem("eventos_wizard_step");
  const storedWizardData = localStorage.getItem("eventos_wizard_data");
  const storedTourCompleted = localStorage.getItem("eventos_tour_completed");
  const completed = storedSteps ? JSON.parse(storedSteps) : [];

  return {
    isOpen: !storedStatus,
    completedSteps: completed,
    skipped: storedStatus === "SKIPPED",
    isTourActive: false,
    tourStep: 0,
    tourCompleted: storedTourCompleted === "true",
    tourPaused: false,
    tourPausedStep: 0,
    loadedDemo: localStorage.getItem("eventos_onboarding_demo_loaded") === "true",
    progress: Math.round((completed.length / CHECKLIST_STEPS.length) * 100),
    currentWizardStep: storedWizardStep ? parseInt(storedWizardStep, 10) : 1,
    wizardData: storedWizardData ? JSON.parse(storedWizardData) : {}
  };
};

const initialState = getInitialState();

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isOpen: initialState.isOpen,
  completedSteps: initialState.completedSteps,
  skipped: initialState.skipped,
  isTourActive: false,
  tourStep: 0,
  tourCompleted: initialState.tourCompleted,
  tourPaused: false,
  tourPausedStep: 0,
  loadedDemo: initialState.loadedDemo,
  progress: initialState.progress,
  currentWizardStep: initialState.currentWizardStep,
  wizardData: initialState.wizardData,

  openOnboarding: () => set({ isOpen: true }),
  closeOnboarding: () => {
    set({ isOpen: false });
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_onboarding_status", "SKIPPED");
    }
  },

  completeStep: (stepId: string) => {
    const current = get().completedSteps;
    if (current.includes(stepId)) return;

    const nextSteps = [...current, stepId];
    const progress = Math.round((nextSteps.length / CHECKLIST_STEPS.length) * 100);

    set({ completedSteps: nextSteps, progress });
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_onboarding_completed_steps", JSON.stringify(nextSteps));
    }
  },

  skipOnboarding: () => {
    set({ isOpen: false, skipped: true });
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_onboarding_status", "SKIPPED");
    }
  },

  startTour: () => set({ isTourActive: true, tourStep: 0, tourPaused: false }),
  nextTourStep: () => set((state) => ({ tourStep: state.tourStep + 1 })),
  prevTourStep: () => set((state) => ({ tourStep: Math.max(0, state.tourStep - 1) })),
  endTour: () => {
    set({ isTourActive: false, tourStep: 0, tourCompleted: true, tourPaused: false });
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_tour_completed", "true");
    }
  },
  pauseTour: () => {
    const { tourStep } = get();
    set({ isTourActive: false, tourPaused: true, tourPausedStep: tourStep });
  },
  resumeTour: () => {
    const { tourPausedStep } = get();
    set({ isTourActive: true, tourPaused: false, tourStep: tourPausedStep });
  },
  restartTour: () => {
    set({ isTourActive: true, tourStep: 0, tourCompleted: false, tourPaused: false, tourPausedStep: 0 });
    if (typeof window !== "undefined") {
      localStorage.removeItem("eventos_tour_completed");
    }
  },

  setWizardStep: (step: number) => {
    set({ currentWizardStep: step });
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_wizard_step", String(step));
    }
  },

  updateWizardData: (data: Record<string, any>) => {
    const current = get().wizardData;
    const merged = { ...current, ...data };
    set({ wizardData: merged });
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_wizard_data", JSON.stringify(merged));
    }
  },

  resumeWizard: () => {
    const storedStep = typeof window !== "undefined" ? localStorage.getItem("eventos_wizard_step") : null;
    const step = storedStep ? parseInt(storedStep, 10) : 1;
    set({ isOpen: true, currentWizardStep: step });
  },

  loadDemoWorkspace: async () => {
    set({ loadedDemo: true, completedSteps: CHECKLIST_STEPS, progress: 100 });
    
    if (typeof window !== "undefined") {
      localStorage.setItem("eventos_onboarding_completed_steps", JSON.stringify(CHECKLIST_STEPS));
      localStorage.setItem("eventos_onboarding_demo_loaded", "true");
      localStorage.setItem("eventos_onboarding_status", "COMPLETED");
    }

    try {
      // 1. Update company branding to "Dream Weddings Studio"
      await api.put("/auth/settings/company", {
        name: "Dream Weddings Studio",
        email: "hello@dreamweddings.com",
        phone: "+1 555 987 6543",
        website: "https://dreamweddings.com",
        timezone: "America/New_York",
        currency: "USD",
        primaryColor: "#ec4899",
        secondaryColor: "#0f172a",
        logoUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=200&auto=format&fit=crop"
      });

      // 2. Create realistic leads
      await api.post("/crm/leads", {
        name: "Sophia & Liam's Autumn Ceremony",
        phone: "312-555-0143",
        email: "sophia.jones@gmail.com",
        eventType: "WEDDING",
        eventDate: "2026-10-12",
        budget: 45000,
        leadSource: "INSTAGRAM",
        notes: "Prefers rustic outdoor decor, autumn palette."
      });

      await api.post("/crm/leads", {
        name: "TechCorp Annual Gala 2026",
        phone: "415-555-9281",
        email: "events@techcorp.com",
        eventType: "CORPORATE",
        eventDate: "2026-11-20",
        budget: 120000,
        leadSource: "WEBSITE",
        notes: "Needs custom stage lighting, presentation screens, seating for 300."
      });

      // 3. Create realistic events
      await api.post("/events", {
        name: "Sarah & David's Summer Estate Wedding",
        type: "WEDDING",
        status: "PLANNING",
        startDate: "2026-08-15T15:00:00Z",
        endDate: "2026-08-15T23:00:00Z",
        location: "Hampton Manor",
        venueName: "The Manor Hall & Gardens",
        venueAddress: "123 Hampton Way, NY",
        guestCount: 180,
        budget: 75000,
        notes: "{}"
      });

      await api.post("/events", {
        name: "Innovate Summit Dinner",
        type: "CORPORATE",
        status: "CONFIRMED",
        startDate: "2026-09-10T18:00:00Z",
        endDate: "2026-09-10T22:00:00Z",
        location: "Metropolitan Pavilion",
        venueName: "Hall C",
        venueAddress: "18 W 18th St, NY",
        guestCount: 250,
        budget: 55000,
        notes: "{}"
      });
    } catch (err) {
      console.error("Demo seeding failed: ", err);
    }
  },

  resetDemoWorkspace: async () => {
    set({ loadedDemo: false, completedSteps: [], progress: 0 });
    if (typeof window !== "undefined") {
      localStorage.removeItem("eventos_onboarding_completed_steps");
      localStorage.removeItem("eventos_onboarding_demo_loaded");
      localStorage.removeItem("eventos_onboarding_status");
    }

    try {
      // Revert company branding
      await api.put("/auth/settings/company", {
        name: "My Event Agency",
        email: "",
        phone: "",
        website: "",
        timezone: "Asia/Kolkata",
        currency: "INR",
        primaryColor: "#9333ea",
        secondaryColor: "#18181b",
        logoUrl: ""
      });
    } catch (err) {
      console.error("Demo resetting failed: ", err);
    }
  }
}));
