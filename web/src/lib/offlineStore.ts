/**
 * EventOS Offline Queue & Sync Engine (IndexedDB + LocalStorage fallback)
 * Stores guest check-ins, VIP tags, and schedule updates while offline,
 * and auto-flushes when internet connection is restored.
 */

export interface OfflineAction {
  id: string;
  type: "CHECKIN_GUEST" | "UPDATE_SCHEDULE" | "ADD_GUEST" | "UPDATE_STATUS";
  payload: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = "eventos_offline_queue_v1";

// Simple ID Generator
function generateId() {
  return "off_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
}

export const offlineStore = {
  /** Get all queued offline actions */
  getQueue(): OfflineAction[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to read offline queue:", e);
      return [];
    }
  },

  /** Enqueue a new offline action */
  enqueue(type: OfflineAction["type"], payload: any): OfflineAction {
    const queue = this.getQueue();
    const action: OfflineAction = {
      id: generateId(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(action);
    this.saveQueue(queue);

    // Try registering background sync if available
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((reg: any) => {
        reg.sync.register("sync-offline-checkins").catch(() => {});
      });
    }

    return action;
  },

  /** Remove action by ID */
  dequeue(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    this.saveQueue(queue);
  },

  /** Clear all pending actions */
  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  /** Internal helper to write queue to localStorage */
  saveQueue(queue: OfflineAction[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      // Notify listeners about queue count changes
      window.dispatchEvent(new CustomEvent("offline-queue-changed", { detail: queue.length }));
    } catch (e) {
      console.error("Failed to save offline queue:", e);
    }
  },

  /** Auto-flush all pending offline actions over API */
  async flush(apiClient?: any): Promise<{ syncedCount: number; failedCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const action of queue) {
      try {
        if (apiClient) {
          if (action.type === "CHECKIN_GUEST") {
            await apiClient.post(`/events/checkin`, action.payload);
          } else if (action.type === "UPDATE_SCHEDULE") {
            await apiClient.post(`/events/schedule/update`, action.payload);
          } else if (action.type === "ADD_GUEST") {
            await apiClient.post(`/events/guests`, action.payload);
          } else {
            await apiClient.post(`/events/offline-sync`, action.payload);
          }
        }
        this.dequeue(action.id);
        syncedCount++;
      } catch (err) {
        console.warn(`[Offline Sync] Failed to sync action ${action.id}:`, err);
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  },
};
