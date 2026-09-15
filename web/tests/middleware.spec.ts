import { describe, it, before } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { SignJWT, importPKCS8, generateKeyPair } from "jose";
import { middleware } from "@/middleware";

describe("Phase 2D - SuperAdmin Next.js Middleware Route Protection Hardening (RS256 Production Only)", () => {
  let validSuperAdminToken: string;
  let expiredSuperAdminToken: string;
  let invalidSignedToken: string;
  let validNonAdminToken: string;
  let hs256SuperAdminTokenOldSecret: string;
  let hs256SuperAdminTokenCustomSecret: string;
  let sharedTestPrivateKey: any;

  const OLD_HARDCODED_DEV_SECRET = "9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";
  const TEST_ENV_HMAC_SECRET = "custom_env_provided_hmac_secret_for_tests_minimum_32_chars";

  let publicRsaKeyPem: string;

  before(async () => {
    // 1. Generate in-memory RS256 test keypair
    const { publicKey: genPublicPem, privateKey: genPrivatePem } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    publicRsaKeyPem = genPublicPem;
    process.env.JWT_PUBLIC_KEY = publicRsaKeyPem;
    const privateKey = await importPKCS8(genPrivatePem, "RS256");
    sharedTestPrivateKey = privateKey;

    // Valid RS256 SuperAdmin token (expires in 1 hour)
    validSuperAdminToken = await new SignJWT({
      roles: "SUPER_ADMIN",
      userId: "11111111-1111-1111-1111-111111111111",
      tenantId: "e5afcc88-5c4b-4df8-bb6d-6bb9bd380111",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("eventos-auth-service")
      .setAudience("eventos-platform")
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(privateKey);

    // Expired RS256 SuperAdmin token (expired 1 hour ago)
    expiredSuperAdminToken = await new SignJWT({
      roles: "SUPER_ADMIN",
      userId: "11111111-1111-1111-1111-111111111111",
      tenantId: "e5afcc88-5c4b-4df8-bb6d-6bb9bd380111",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("eventos-auth-service")
      .setAudience("eventos-platform")
      .setExpirationTime("-1h")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .sign(privateKey);

    // Valid Non-SuperAdmin token (role: OWNER)
    validNonAdminToken = await new SignJWT({
      roles: "OWNER",
      userId: "22222222-2222-2222-2222-222222222222",
      tenantId: "33333333-3333-3333-3333-333333333333",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("eventos-auth-service")
      .setAudience("eventos-platform")
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(privateKey);

    // Token signed with an untrusted, random RSA key pair
    const foreignKeyPair = await generateKeyPair("RS256");
    invalidSignedToken = await new SignJWT({
      roles: "SUPER_ADMIN",
      userId: "11111111-1111-1111-1111-111111111111",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("eventos-auth-service")
      .setAudience("eventos-platform")
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(foreignKeyPair.privateKey);

    // HS256 SuperAdmin token signed with the old hardcoded dev secret
    hs256SuperAdminTokenOldSecret = await new SignJWT({
      roles: "SUPER_ADMIN",
      userId: "11111111-1111-1111-1111-111111111111",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("eventos-auth-service")
      .setAudience("eventos-platform")
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(new TextEncoder().encode(OLD_HARDCODED_DEV_SECRET));

    // HS256 SuperAdmin token signed with custom env secret
    hs256SuperAdminTokenCustomSecret = await new SignJWT({
      roles: "SUPER_ADMIN",
      userId: "11111111-1111-1111-1111-111111111111",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("eventos-auth-service")
      .setAudience("eventos-platform")
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(new TextEncoder().encode(TEST_ENV_HMAC_SECRET));
  });

  it("beforeEach resets JWT_PUBLIC_KEY", () => {
    process.env.JWT_PUBLIC_KEY = publicRsaKeyPem;
  });

  // CASE A: Production + valid RS256 SUPER_ADMIN token -> ALLOW
  it("Case A: Production allows valid RS256 SUPER_ADMIN token", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${validSuperAdminToken}` },
    });
    const res = await middleware(req);
    assert.notStrictEqual(res.status, 307);
    assert.strictEqual(res.headers.get("location"), null);
  });

  // CASE B: Production + valid HS256 SUPER_ADMIN token -> REJECT / redirect to login
  it("Case B: Production rejects HS256 SUPER_ADMIN token unconditionally", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET_KEY = TEST_ENV_HMAC_SECRET;
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${hs256SuperAdminTokenCustomSecret}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE C: Production + HS256 token signed with old hardcoded secret -> REJECT
  it("Case C: Production rejects HS256 token signed with old hardcoded secret", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${hs256SuperAdminTokenOldSecret}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE D: Production + malformed token -> REJECT
  it("Case D: Production rejects malformed accessToken", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: "accessToken=malformed.garbage.token" },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE E: Production + expired RS256 token -> REJECT
  it("Case E: Production rejects expired RS256 token", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${expiredSuperAdminToken}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE F: Production + RS256 token signed by foreign RSA key -> REJECT
  it("Case F: Production rejects RS256 token signed by foreign key", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${invalidSignedToken}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE G: Development + valid HS256 token with environment-provided secret -> ALLOW
  it("Case G: Development allows valid HS256 token when JWT_SECRET_KEY is configured", async () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET_KEY = TEST_ENV_HMAC_SECRET;
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${hs256SuperAdminTokenCustomSecret}` },
    });
    const res = await middleware(req);
    assert.notStrictEqual(res.status, 307);
    assert.strictEqual(res.headers.get("location"), null);
  });

  // CASE H: Development + HS256 token with wrong secret -> REJECT
  it("Case H: Development rejects HS256 token with wrong secret", async () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET_KEY = TEST_ENV_HMAC_SECRET;
    // Sending token signed with old secret while env expects TEST_ENV_HMAC_SECRET
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${hs256SuperAdminTokenOldSecret}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE I: Development + no HMAC secret configured -> FAIL CLOSED (never use hardcoded secret)
  it("Case I: Development fails closed if JWT_SECRET_KEY is missing", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET_KEY;
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${hs256SuperAdminTokenOldSecret}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE J: Production + forged user_role cookie but valid RS256 token -> token remains authoritative
  it("Case J: Forged user_role cookie does NOT override verified token", async () => {
    process.env.NODE_ENV = "production";
    const nonAdminReq = new NextRequest("http://localhost:3000/superadmin", {
      headers: {
        cookie: `accessToken=${validNonAdminToken}; user_role=SUPER_ADMIN; hasSession=true`,
      },
    });
    const nonAdminRes = await middleware(nonAdminReq);
    assert.strictEqual(nonAdminRes.status, 307);
    assert.match(nonAdminRes.headers.get("location") || "", /\/superadmin\/login/);
  });

  // CASE K: Production + forged hasSession cookie but valid RS256 token -> token remains authoritative
  it("Case K: Valid token with forged hasSession=false is still authenticated", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: {
        cookie: `accessToken=${validSuperAdminToken}; hasSession=false`,
      },
    });
    const res = await middleware(req);
    assert.notStrictEqual(res.status, 307);
    assert.strictEqual(res.headers.get("location"), null);
  });

  // CASE L: No accessToken -> REJECT / redirect to login
  it("Case L: Rejects requests with no accessToken", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin");
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });

  // CASE M: Public /superadmin/login -> ALLOW
  it("Case M: Allows public /superadmin/login route without accessToken", async () => {
    process.env.NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/superadmin/login");
    const res = await middleware(req);
    assert.notStrictEqual(res.status, 307);
    assert.strictEqual(res.headers.get("location"), null);
  });

  // CASE N: Production allows all verified platform roles
  it("Case N: Production allows all verified granular platform roles to enter console", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_PUBLIC_KEY = publicRsaKeyPem;
    const privateKey = sharedTestPrivateKey;

    const platformRoles = [
      "OPERATIONS_LEAD",
      "SUPPORT_LEAD",
      "FINANCE_OFFICER",
      "DEVOPS_ENGINEER",
      "COMPLIANCE_AUDITOR",
    ];

    for (const role of platformRoles) {
      const token = await new SignJWT({
        roles: role,
        userId: "99999999-9999-9999-9999-999999999999",
        tenantId: "e5afcc88-5c4b-4df8-bb6d-6bb9bd380111",
      })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer("eventos-auth-service")
        .setAudience("eventos-platform")
        .setExpirationTime("1h")
        .setIssuedAt()
        .sign(privateKey);

      const req = new NextRequest("http://localhost:3000/superadmin", {
        headers: { cookie: `accessToken=${token}` },
      });
      const res = await middleware(req);
      assert.notStrictEqual(res.status, 307, `Expected ${role} to be allowed`);
      assert.strictEqual(res.headers.get("location"), null, `Expected ${role} not to redirect`);
    }
  });

  // CASE O: Production with missing or empty JWT_PUBLIC_KEY -> FAILS CLOSED
  it("Case O: Production with missing JWT_PUBLIC_KEY fails closed", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_PUBLIC_KEY;

    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${validSuperAdminToken}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);

    // Restore key for other tests
    process.env.JWT_PUBLIC_KEY = publicRsaKeyPem;
  });

  // CASE P: Production JWT with unsupported algorithm (e.g. none, ES256) -> REJECT
  it("Case P: Production rejects token with unsupported algorithm (e.g. none)", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_PUBLIC_KEY = publicRsaKeyPem;

    // Construct unsigned "none" token
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        roles: "SUPER_ADMIN",
        userId: "11111111-1111-1111-1111-111111111111",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64url");
    const noneToken = `${header}.${payload}.`;

    const req = new NextRequest("http://localhost:3000/superadmin", {
      headers: { cookie: `accessToken=${noneToken}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.match(location, /\/superadmin\/login/);
  });
});
