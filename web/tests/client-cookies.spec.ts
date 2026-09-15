import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { setClientCookie, clearClientCookie, isHttpsContext } from "@/lib/clientCookies";

describe("Phase 2L - Client Cookie Security Hardening", () => {
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("1. isHttpsContext returns true on https protocol and false on http", () => {
    // HTTPS
    (global as any).window = {
      location: { protocol: "https:" },
    };
    assert.strictEqual(isHttpsContext(), true);

    // HTTP
    (global as any).window = {
      location: { protocol: "http:" },
    };
    assert.strictEqual(isHttpsContext(), false);
  });

  it("2. setClientCookie includes Secure flag on HTTPS", () => {
    let capturedCookie = "";
    (global as any).window = {
      location: { protocol: "https:" },
    };
    Object.defineProperty(global, "document", {
      value: {
        set cookie(val: string) {
          capturedCookie = val;
        },
        get cookie() {
          return capturedCookie;
        },
      },
      configurable: true,
    });

    setClientCookie("accessToken", "mock_jwt_token_xyz", 3600);

    assert.strictEqual(capturedCookie.includes("accessToken=mock_jwt_token_xyz"), true);
    assert.strictEqual(capturedCookie.includes("path=/"), true);
    assert.strictEqual(capturedCookie.includes("SameSite=Lax"), true);
    assert.strictEqual(capturedCookie.includes("max-age=3600"), true);
    assert.strictEqual(capturedCookie.includes("; Secure"), true);
  });

  it("3. setClientCookie omits Secure flag on local HTTP development", () => {
    let capturedCookie = "";
    (global as any).window = {
      location: { protocol: "http:" },
    };
    Object.defineProperty(global, "document", {
      value: {
        set cookie(val: string) {
          capturedCookie = val;
        },
        get cookie() {
          return capturedCookie;
        },
      },
      configurable: true,
    });

    setClientCookie("accessToken", "mock_jwt_token_xyz", 3600);

    assert.strictEqual(capturedCookie.includes("accessToken=mock_jwt_token_xyz"), true);
    assert.strictEqual(capturedCookie.includes("path=/"), true);
    assert.strictEqual(capturedCookie.includes("SameSite=Lax"), true);
    assert.strictEqual(capturedCookie.includes("max-age=3600"), true);
    assert.strictEqual(capturedCookie.includes("; Secure"), false, "Secure flag must NOT be present on HTTP localhost");
  });

  it("4. clearClientCookie revokes cookie with Max-Age=0 and matching scope", () => {
    let capturedCookie = "";
    (global as any).window = {
      location: { protocol: "https:" },
    };
    Object.defineProperty(global, "document", {
      value: {
        set cookie(val: string) {
          capturedCookie = val;
        },
        get cookie() {
          return capturedCookie;
        },
      },
      configurable: true,
    });

    clearClientCookie("hasSession");

    assert.strictEqual(capturedCookie.includes("hasSession="), true);
    assert.strictEqual(capturedCookie.includes("max-age=0"), true);
    assert.strictEqual(capturedCookie.includes("path=/"), true);
    assert.strictEqual(capturedCookie.includes("SameSite=Lax"), true);
    assert.strictEqual(capturedCookie.includes("; Secure"), true);
  });
});
