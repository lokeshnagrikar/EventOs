/**
 * Standardized client-side cookie utilities for Next.js Edge Middleware route indicators.
 * 
 * Enforces:
 * - Secure=true when running over HTTPS (window.location.protocol === "https:")
 * - Secure omitted on local HTTP development (e.g. localhost:3000)
 * - SameSite=Lax
 * - Path=/
 * - SSR-safe window guard
 */

export function isHttpsContext(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.location.protocol === "https:";
}

export function setClientCookie(
  name: string,
  value: string,
  maxAgeSeconds?: number,
  sameSite: "Lax" | "Strict" = "Lax"
): void {
  if (typeof window === "undefined") {
    return;
  }

  const isHttps = isHttpsContext();
  let cookieString = `${name}=${encodeURIComponent(value)}; path=/; SameSite=${sameSite}`;

  if (maxAgeSeconds !== undefined) {
    cookieString += `; max-age=${maxAgeSeconds}`;
  }

  if (isHttps) {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
}

export function clearClientCookie(name: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const isHttps = isHttpsContext();
  let cookieString = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

  if (isHttps) {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
}
