"use client";

export interface WorkspaceNotificationPayload {
  id?: string;
  title: string;
  desc: string;
  type?: "info" | "success" | "warning" | "error";
  href?: string;
  category?: "lead" | "quote" | "event" | "payment" | "system" | "security" | "superadmin";
  actorType?: "SUPER_ADMIN" | "TEAM" | "CLIENT" | "SYSTEM";
  actorName?: string;
  timestamp?: number;
}

const STORAGE_KEY = "eventos_realtime_notifications";
const BROADCAST_CHANNEL_NAME = "eventos_workspace_feed_channel";

// Gentle audio chime using Web Audio API (zero external assets needed)
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Play warm dual-tone chime (F5 -> A5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
    osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.1); // A5

    osc2.frequency.setValueAtTime(349.23, ctx.currentTime); // F4 sub-harmonic
    osc2.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.42);
    osc2.stop(ctx.currentTime + 0.42);
  } catch {
    // Audio context may be restricted by browser until user gesture
  }
}

// Get saved realtime notifications from localStorage
export function getStoredRealtimeNotifications(): WorkspaceNotificationPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save a realtime notification to persistent storage
export function persistRealtimeNotification(notif: WorkspaceNotificationPayload) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredRealtimeNotifications();
    // Prepend and keep latest 50
    const filtered = existing.filter((item) => item.id !== notif.id);
    const updated = [notif, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist notification:", err);
  }
}

// Master Emitter: Dispatches cross-tab, window event, audio chime & storage
export function emitWorkspaceNotification(data: WorkspaceNotificationPayload, options?: { silent?: boolean }) {
  if (typeof window === "undefined") return;

  const notifId = data.id || `rt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const notif: WorkspaceNotificationPayload = {
    ...data,
    id: notifId,
    timestamp: data.timestamp || Date.now(),
    type: data.type || "info",
    category: data.category || "system"
  };

  // 1. Persist to localStorage
  persistRealtimeNotification(notif);

  // 2. Play subtle chime sound
  if (!options?.silent) {
    playNotificationChime();
  }

  // 3. Dispatch in current window
  window.dispatchEvent(new CustomEvent("add-notification", { detail: notif }));

  // 4. Broadcast to all open tabs via BroadcastChannel
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: "WORKSPACE_NOTIFICATION", payload: notif });
      channel.close();
    }
  } catch {
    // BroadcastChannel unsupported or blocked
  }
}

// Subscribe to real-time events across all tabs
export function subscribeToRealtimeNotifications(onMessage: (notif: WorkspaceNotificationPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === "WORKSPACE_NOTIFICATION" && event.data?.payload) {
          onMessage(event.data.payload);
        }
      };
    }
  } catch {}

  const handleWindowCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<WorkspaceNotificationPayload>;
    if (custom.detail) {
      onMessage(custom.detail);
    }
  };

  window.addEventListener("add-notification", handleWindowCustomEvent);

  return () => {
    window.removeEventListener("add-notification", handleWindowCustomEvent);
    if (channel) {
      channel.close();
    }
  };
}
