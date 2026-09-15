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
function getDevHmacKey(): Uint8Array | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.trim().length === 0) {
    return null; // Fail closed
  }
  return new TextEncoder().encode(secret.trim());
}

/**
 * Cryptographically verifies an accessToken JWT for Next.js Edge Middleware.
 * 
 * SECURITY SPECIFICATIONS:
 * 1. Production (NODE_ENV === 'production'): Exclusively accepts RS256. HS256 and all other
 *    algorithms are strictly rejected regardless of signature.
 * 2. Development (NODE_ENV !== 'production'): RS256 verified against RSA public key.
 *    HS256 permitted ONLY if process.env.JWT_SECRET_KEY is configured. Fails closed if absent.
 * 3. Never falls back to a hardcoded HMAC secret.
 * 4. Algorithm pinning: Explicitly restricts verification algorithms per environment.
 */
export async function verifyAccessToken(token: string | null | undefined): Promise<VerifiedTokenPayload | null> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  try {
    const trimmedToken = token.trim();
    const header = decodeProtectedHeader(trimmedToken);
    const isProd = process.env.NODE_ENV === "production";

    // --- PRODUCTION PATH: STRICT RS256 ONLY ---
    if (isProd) {
      if (header.alg !== "RS256") {
        return null; // Reject HS256, none, and all non-RS256 algorithms
      }
      const rsaKey = await getRsaPublicKey();
      if (!rsaKey) return null;

      const { payload } = await jwtVerify(trimmedToken, rsaKey as Parameters<typeof jwtVerify>[1], {
        algorithms: ["RS256"],
        issuer: "eventos-auth-service",
        audience: "eventos-platform",
      });
      return payload as VerifiedTokenPayload;
    }

    // --- DEVELOPMENT / TEST PATH ---
    if (header.alg === "RS256") {
      const rsaKey = await getRsaPublicKey();
      if (!rsaKey) return null;

      const { payload } = await jwtVerify(trimmedToken, rsaKey as Parameters<typeof jwtVerify>[1], {
        algorithms: ["RS256"],
        issuer: "eventos-auth-service",
        audience: "eventos-platform",
      });
      return payload as VerifiedTokenPayload;
    } else if (header.alg === "HS256") {
      const hmacKey = getDevHmacKey();
      if (!hmacKey) {
        return null; // Fail closed: missing dev secret
      }
      const { payload } = await jwtVerify(trimmedToken, hmacKey, {
        algorithms: ["HS256"],
        issuer: "eventos-auth-service",
        audience: "eventos-platform",
      });
      return payload as VerifiedTokenPayload;
    }

    // Unsupported signing algorithm
    return null;
  } catch {
    // Signature invalid, expired, malformed, or failed verification
    return null;
  }
}
