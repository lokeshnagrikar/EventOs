"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 Hour Inactivity Timeout

export function useIdleTimer() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const addToast = useToastStore((state) => state.addToast);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        // Clear session cookies & state on idle timeout
        logout();
        document.cookie = "hasSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        addToast("Logged out due to 15 minutes of inactivity for your security.", "info");
        router.push("/?login=true&expired=true");
      }, IDLE_TIMEOUT_MS);
    };

    // User activity listeners
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token, logout, router, addToast]);
}
