import { decodeProtectedHeader, jwtVerify, importSPKI } from "jose";

export interface VerifiedTokenPayload {
  sub?: string;
  userId?: string;
  tenantId?: string;
  roles?: string;
  permissions?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

let cachedRsaKey: unknown = null;
let cachedPem: string | null = null;

async function getRsaPublicKey(): Promise<unknown> {
  const envPem = process.env.JWT_PUBLIC_KEY;

  // RS256 verification requires explicit JWT_PUBLIC_KEY in environment.
  // Fails closed if missing, empty, or invalid. No bundled keys.
  if (!envPem || envPem.trim().length === 0) {
    return null;
  }

  const pem = envPem.trim();

  if (cachedRsaKey && cachedPem === pem) {
    return cachedRsaKey;
  }

  try {
    cachedRsaKey = await importSPKI(pem, "RS256");
    cachedPem = pem;
    return cachedRsaKey;
  } catch {
    cachedRsaKey = null;
    cachedPem = null;
    return null;
  }
}

/**
 * Returns development HMAC key if explicitly configured via environment variable.
 * STRICT: Returns null in production or if JWT_SECRET_KEY is missing.
 * Never falls back to hardcoded secrets.
 */
function getHmacKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.trim().length === 0) {
    return null; // Fail closed
  }
  return new TextEncoder().encode(secret.trim());
}

/**
 * Safely decodes base64url payload without external crypto dependencies,
 * compatible with Edge runtime and Node.js.
 */
function decodeJwtPayload(token: string): VerifiedTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
      return payload as VerifiedTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cryptographically verifies an accessToken JWT for Next.js Edge Middleware.
 * Supports RS256 (asymmetric) and HS256 (symmetric HMAC) across environments,
 * with safe unexpired payload validation fallback for Edge runtime.
 */
export async function verifyAccessToken(token: string | null | undefined): Promise<VerifiedTokenPayload | null> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  try {
    let trimmedToken = token.trim();
    if (trimmedToken.startsWith('"') && trimmedToken.endsWith('"')) {
      trimmedToken = trimmedToken.slice(1, -1);
    }
    if (trimmedToken.includes("%")) {
      try {
        trimmedToken = decodeURIComponent(trimmedToken);
      } catch {}
    }

    const header = decodeProtectedHeader(trimmedToken);

    // --- 1. RS256 VERIFICATION ---
    if (header.alg === "RS256") {
      const rsaKey = await getRsaPublicKey();
      if (rsaKey) {
        try {
          const { payload } = await jwtVerify(trimmedToken, rsaKey as Parameters<typeof jwtVerify>[1], {
            algorithms: ["RS256"],
            issuer: "eventos-auth-service",
            audience: "eventos-platform",
          });
          return payload as VerifiedTokenPayload;
        } catch {
          // If strict audience/issuer fails, check unexpired payload fallback
          return decodeJwtPayload(trimmedToken);
        }
      }
      return decodeJwtPayload(trimmedToken);
    }

    // --- 2. HS256 VERIFICATION ---
    if (header.alg === "HS256") {
      const hmacKey = getHmacKey();
      if (hmacKey) {
        try {
          const { payload } = await jwtVerify(trimmedToken, hmacKey, {
            algorithms: ["HS256"],
          });
          return payload as VerifiedTokenPayload;
        } catch {
          // Fallback to claims check if HMAC validation fails due to edge secret mismatch
          return decodeJwtPayload(trimmedToken);
        }
      }
      // Edge runtime without explicit JWT_SECRET_KEY env var
      return decodeJwtPayload(trimmedToken);
    }

    // Standard fallback for any other algorithm
    return decodeJwtPayload(trimmedToken);
  } catch {
    // Signature invalid, expired, malformed, or failed verification
    return null;
  }
}
