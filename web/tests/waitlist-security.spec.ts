import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/waitlist/route";

describe("Phase 2R-FIX-01 — Waitlist Secret Security & Founder Auth Hardening", () => {
  const ORIGINAL_ENV = process.env.FOUNDER_SECRET_KEY;
  const TEST_VALID_SECRET = "production_grade_waitlist_founder_secret_2026_xK9#vL2";

  beforeEach(() => {
    process.env.FOUNDER_SECRET_KEY = TEST_VALID_SECRET;
  });

  afterEach(() => {
    process.env.FOUNDER_SECRET_KEY = ORIGINAL_ENV;
  });

  it("A. Old hardcoded value 'eventos2026' is rejected when secret is configured", async () => {
    const req = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "GET",
      headers: { "x-founder-key": "eventos2026" },
    });
    const res = await GET(req);
    const data = await res.json();
    // Rejection means it does NOT return full lead details; returns public stats
    assert.strictEqual(data.active, true);
    assert.strictEqual(data.leads, undefined);
  });

  it("B. Correct FOUNDER_SECRET_KEY from environment succeeds via x-founder-key header", async () => {
    const req = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "GET",
      headers: { "x-founder-key": TEST_VALID_SECRET },
    });
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.leads));
  });

  it("B2. Correct FOUNDER_SECRET_KEY succeeds via Bearer authorization header", async () => {
    const req = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "GET",
      headers: { authorization: `Bearer ${TEST_VALID_SECRET}` },
    });
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.leads));
  });

  it("C. Wrong secret fails with unauthorized on mutating endpoints", async () => {
    const putReq = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "PUT",
      headers: { "x-founder-key": "wrong-secret-value-123" },
      body: JSON.stringify({ id: "nonexistent", updates: { status: "ARCHIVED" } }),
    });
    const putRes = await PUT(putReq);
    assert.strictEqual(putRes.status, 401);

    const delReq = new NextRequest("http://localhost:3000/api/waitlist?id=nonexistent", {
      method: "DELETE",
      headers: { "x-founder-key": "wrong-secret-value-123" },
    });
    const delRes = await DELETE(delReq);
    assert.strictEqual(delRes.status, 401);
  });

  it("D. Missing or empty FOUNDER_SECRET_KEY fails closed", async () => {
    delete process.env.FOUNDER_SECRET_KEY;

    // GET should not grant leads even if caller supplies what was previously valid
    const getReq = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "GET",
      headers: { "x-founder-key": TEST_VALID_SECRET },
    });
    const getRes = await GET(getReq);
    const getData = await getRes.json();
    assert.strictEqual(getData.leads, undefined);
    assert.strictEqual(getData.active, true);

    // PUT fails with 401
    const putReq = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "PUT",
      headers: { "x-founder-key": TEST_VALID_SECRET },
      body: JSON.stringify({ id: "dummy", updates: {} }),
    });
    const putRes = await PUT(putReq);
    assert.strictEqual(putRes.status, 401);

    // DELETE fails with 401
    const delReq = new NextRequest("http://localhost:3000/api/waitlist?id=dummy", {
      method: "DELETE",
      headers: { "x-founder-key": TEST_VALID_SECRET },
    });
    const delRes = await DELETE(delReq);
    assert.strictEqual(delRes.status, 401);
  });

  it("E. Secret and Authorization headers are not logged to stdout/stderr", async () => {
    const originalConsoleLog = console.log;
    let loggedOutput = "";
    console.log = (...args: any[]) => {
      loggedOutput += args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    };

    try {
      const req = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        body: JSON.stringify({
          name: "Security Audit Lead",
          agencyName: "Audit Agency",
          email: "audit-test@eventosapp.in",
          whatsapp: "+919999988888",
          eventType: "Weddings",
        }),
      });
      await POST(req);
      assert.ok(!loggedOutput.includes(TEST_VALID_SECRET), "Secret must not appear in logs");
      assert.ok(!loggedOutput.includes("eventos2026"), "eventos2026 must not appear in logs");
    } finally {
      console.log = originalConsoleLog;
    }
  });

  it("G. Public lead capture and unauthenticated public stats continue to work", async () => {
    // 1. Unauthenticated GET returns public stats without exposing PII
    const getReq = new NextRequest("http://localhost:3000/api/waitlist", { method: "GET" });
    const getRes = await GET(getReq);
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert.strictEqual(getData.active, true);
    assert.strictEqual(getData.leads, undefined);

    // 2. Public POST creates lead
    const postReq = new NextRequest("http://localhost:3000/api/waitlist", {
      method: "POST",
      body: JSON.stringify({
        name: "Legitimate Lead",
        agencyName: "Legit Events LLP",
        email: "legit@eventosapp.in",
        whatsapp: "+919876543210",
        eventType: "Corporate",
      }),
    });
    const postRes = await POST(postReq);
    assert.strictEqual(postRes.status, 200);
    const postData = await postRes.json();
    assert.strictEqual(postData.success, true);
    assert.strictEqual(postData.entry.name, "Legitimate Lead");
  });
});
