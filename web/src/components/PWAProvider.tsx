"use client";

import React, { useEffect } from "react";
import { offlineStore } from "@/lib/offlineStore";

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register PWA Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA Provider] Service Worker registered successfully with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA Provider] Service Worker registration failed:", error);
        });

      // Listen to messages from Service Worker (e.g. background sync triggers)
      const handleServiceWorkerMessage = async (event: MessageEvent) => {
        if (event.data && event.data.type === "TRIGGER_OFFLINE_SYNC") {
          console.log("[PWA Provider] Background sync message received from SW!");
          let apiClient;
          try {
            apiClient = require("@/lib/api-client").apiClient;
          } catch (e) {}
          await offlineStore.flush(apiClient);
        }
      };

      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      };
    }
  }, []);

  return <>{children}</>;
}
