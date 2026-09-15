import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("Phase 2K - SuperAdmin Login Security Claim Cleanup Verification", () => {
  const loginPagePath = path.resolve(__dirname, "../src/app/superadmin/login/page.tsx");
  const loginSource = fs.readFileSync(loginPagePath, "utf-8");

  it("1. Verifies all unsubstantiated security and compliance claims are absent", () => {
    const unsubstantiatedClaims = [
      "ZERO TRUST GATEWAY",
      "cryptographic, audited, and immutable",
      "Security Clearance Level 4",
      "real-time fraud prevention",
      "Security Protocol Standard 800-63B",
      "national CERT",
      "Unauthorized intrusion attempts are traced",
      "Verifying Cryptographic Tokens",
      "Clearance Level",
    ];

    for (const claim of unsubstantiatedClaims) {
      assert.strictEqual(
        loginSource.includes(claim),
        false,
        `Unsubstantiated claim found in SuperAdmin login: "${claim}"`
      );
    }
  });

  it("2. Verifies truthful corporate title 'EventOS Platform Administration' exists", () => {
    assert.strictEqual(
      loginSource.includes("EventOS Platform Administration"),
      true,
      "Expected 'EventOS Platform Administration' to be present in page source"
    );
  });

  it("3. Verifies authorized administrator credential wording exists", () => {
    assert.strictEqual(
      loginSource.includes("Sign in with your authorized administrator credentials"),
      true,
      "Expected authorized administrator credential guidance to be present"
    );
    assert.strictEqual(
      loginSource.includes("Administrator Email"),
      true,
      "Expected 'Administrator Email' field label"
    );
  });

  it("4. Verifies legacy root terminology and admin123 are completely removed", () => {
    const legacyTerms = [
      "Master Access Key",
      "root master password",
      "admin123",
      "Clearance Role Presets",
      "One-Click Select",
      "Root SuperAdmin",
      "Compliance Auditor",
    ];

    for (const term of legacyTerms) {
      assert.strictEqual(
        loginSource.includes(term),
        false,
        `Legacy term or autofill found in SuperAdmin login: "${term}"`
      );
    }
  });

  it("5. Verifies no role preset UI or quick-fill buttons exist", () => {
    assert.strictEqual(loginSource.includes("preset.email"), false);
    assert.strictEqual(loginSource.includes("Clearance Role Presets"), false);
    assert.strictEqual(loginSource.includes("One-Click Select"), false);
  });

  it("6. Verifies login form structure and authentication logic remain functional", () => {
    // Form element and handler
    assert.strictEqual(loginSource.includes("onSubmit={handleLogin}"), true);
    // Email input
    assert.strictEqual(loginSource.includes('type="email"'), true);
    assert.strictEqual(loginSource.includes("autoComplete=\"email\""), true);
    // Password input
    assert.strictEqual(loginSource.includes('type={showPassword ? "text" : "password"}'), true);
    assert.strictEqual(loginSource.includes("placeholder=\"Enter your password\""), true);
    // Submit button
    assert.strictEqual(loginSource.includes('type="submit"'), true);
    assert.strictEqual(loginSource.includes("Sign In"), true);
    // API endpoint
    assert.strictEqual(loginSource.includes('apiClient.post("/auth/login"'), true);
    // Role boundary
    assert.strictEqual(loginSource.includes('role !== "SUPER_ADMIN"'), true);
  });
});
