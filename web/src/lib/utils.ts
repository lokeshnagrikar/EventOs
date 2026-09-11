import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves the public application base URL for sharing links (Galleries, Quotes, Portals).
 * 1. Uses NEXT_PUBLIC_APP_URL if defined (e.g., https://eventosapp.in)
 * 2. In browser on non-localhost domain, uses current window.location.origin
 * 3. Default fallback: https://eventosapp.in (ensures real domain even when testing locally)
 */
export function getAppBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    if (!window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
      return window.location.origin;
    }
  }
  return "https://eventosapp.in";
}
