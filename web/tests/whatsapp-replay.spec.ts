import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import * as crypto from "crypto";
import { setRedisClientForTesting } from "../src/lib/redis";
import { POST } from "../src/app/api/webhooks/whatsapp/meta/route";

const TEST_APP_SECRET = "test_whatsapp_secret_phase_2q_hardening";

function computeSignature(payload: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function createWebhookPayload(eventId: string, text: string = "Hello World"): string {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_123456",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: "10987654321",
              },
              messages: [
                {
                  from: "19876543210",
                  id: eventId,
                  timestamp: "1726370000",
                  text: {
                    body: text,
                  },
                  type: "text",
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  });
}

function createRequest(body: string, headers: Record<string, string>): any {
  return {
    url: "https://eventos.io/api/webhooks/whatsapp/meta",
    text: async () => body,
    headers: {
      get: (headerName: string) => {
        const lower = headerName.toLowerCase();
        for (const [k, v] of Object.entries(headers)) {
          if (k.toLowerCase() === lower) return v;
        }
        return null;
      },
    },
  };
}

describe("2Q-02 - Distributed WhatsApp Webhook Replay Protection", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockRedisStore: Map<string, string>;
  let mockRedisClient: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.WHATSAPP_APP_SECRET = TEST_APP_SECRET;
    mockRedisStore = new Map<string, string>();

    mockRedisClient = {
      set: async (key: string, value: string, ex: string, ttl: number, nx: string) => {
        if (mockRedisStore.has(key)) {
          return null; // Key already exists -> SET NX fails
        }
        mockRedisStore.set(key, value);
        return "OK";
      },
    };
    setRedisClientForTesting(mockRedisClient);
  });

  afterEach(() => {
    process.env = originalEnv;
    setRedisClientForTesting(null);
  });

  it("1. Valid first event is accepted and claimed in Redis", async () => {
    const eventId = "wamid.HBgLMTIzNDU2Nzg5MA==";
    const body = createWebhookPayload(eventId);
    const signature = computeSignature(body, TEST_APP_SECRET);

    const req = createRequest(body, { "x-hub-signature-256": signature });
    const res: any = await POST(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(mockRedisStore.has(`whatsapp:webhook:${eventId}`), true);
  });

  it("2. Duplicate event is detected and ignored without executing business logic", async () => {
    const eventId = "wamid.DUPLICATE_EVENT_001";
    const body = createWebhookPayload(eventId);
    const signature = computeSignature(body, TEST_APP_SECRET);

    // First request
    const req1 = createRequest(body, { "x-hub-signature-256": signature });
    const res1: any = await POST(req1);
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(json1.success, true);
    assert.strictEqual(json1.message, undefined);

    // Second request (duplicate)
    const req2 = createRequest(body, { "x-hub-signature-256": signature });
    const res2: any = await POST(req2);
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(json2.success, true);
    assert.strictEqual(json2.message, "Duplicate event ignored");
  });

  it("3. Simultaneous duplicate events allow only exactly one to claim execution", async () => {
    const eventId = "wamid.CONCURRENT_EVENT_002";
    const body = createWebhookPayload(eventId);
    const signature = computeSignature(body, TEST_APP_SECRET);

    const reqs = Array.from({ length: 5 }, () =>
      createRequest(body, { "x-hub-signature-256": signature })
    );

    const responses: any[] = await Promise.all(reqs.map((r) => POST(r)));
    const jsons = await Promise.all(responses.map((r) => r.json()));

    const claimed = jsons.filter((j) => j.success === true && !j.message);
    const duplicates = jsons.filter((j) => j.message === "Duplicate event ignored");

    assert.strictEqual(claimed.length, 1, "Exactly one concurrent request must claim execution");
    assert.strictEqual(duplicates.length, 4, "All other concurrent requests must receive duplicate ignored");
  });

  it("4. Invalid HMAC is rejected with 401 and does NOT claim the event ID in Redis", async () => {
    const eventId = "wamid.HMAC_ATTACK_003";
    const body = createWebhookPayload(eventId);
    const badSignature = "sha256=" + "a".repeat(64);

    const req = createRequest(body, { "x-hub-signature-256": badSignature });
    const res: any = await POST(req);
    assert.strictEqual(res.status, 401);

    // CRITICAL: Event ID must NOT be consumed by unauthenticated request
    assert.strictEqual(mockRedisStore.has(`whatsapp:webhook:${eventId}`), false);

    // Subsequent valid request for the same event ID must succeed!
    const goodSignature = computeSignature(body, TEST_APP_SECRET);
    const reqValid = createRequest(body, { "x-hub-signature-256": goodSignature });
    const resValid: any = await POST(reqValid);
    const jsonValid = await resValid.json();
    assert.strictEqual(resValid.status, 200);
    assert.strictEqual(jsonValid.success, true);
    assert.strictEqual(mockRedisStore.has(`whatsapp:webhook:${eventId}`), true);
  });

  it("5. Missing HMAC signature is rejected with 401 and does NOT consume event ID", async () => {
    const eventId = "wamid.MISSING_SIG_004";
    const body = createWebhookPayload(eventId);

    const req = createRequest(body, {});
    const res: any = await POST(req);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(mockRedisStore.has(`whatsapp:webhook:${eventId}`), false);
  });

  it("6. Malformed JSON payload is rejected with 400 and does NOT call Redis", async () => {
    const malformedBody = "{\"object\": \"whatsapp_business_account\", broken json...";
    const signature = computeSignature(malformedBody, TEST_APP_SECRET);

    const req = createRequest(malformedBody, { "x-hub-signature-256": signature });
    const res: any = await POST(req);
    const json = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(json.error.includes("Malformed JSON"), true);
    assert.strictEqual(mockRedisStore.size, 0);
  });

  it("7. Redis unavailable in production FAILS CLOSED with 500", async () => {
    process.env.NODE_ENV = "production";
    // Mock Redis error
    setRedisClientForTesting({
      set: async () => {
        throw new Error("Connection refused to Redis cluster");
      },
    });

    const eventId = "wamid.FAIL_CLOSED_005";
    const body = createWebhookPayload(eventId);
    const signature = computeSignature(body, TEST_APP_SECRET);

    const req = createRequest(body, { "x-hub-signature-256": signature });
    const res: any = await POST(req);
    const json = await res.json();

    assert.strictEqual(res.status, 500, "Production must fail closed (500) when Redis is unavailable");
    assert.strictEqual(json.error.includes("Replay protection service unavailable"), true);
  });

  it("8. Redis unavailable in development/test falls back to in-memory deduplication", async () => {
    process.env.NODE_ENV = "development";
    // Mock Redis error
    setRedisClientForTesting({
      set: async () => {
        throw new Error("ECONNREFUSED 127.0.0.1:6379");
      },
    });

    const eventId = "wamid.DEV_FALLBACK_006";
    const body = createWebhookPayload(eventId);
    const signature = computeSignature(body, TEST_APP_SECRET);

    // First attempt in dev: succeeds via in-memory fallback
    const req1 = createRequest(body, { "x-hub-signature-256": signature });
    const res1: any = await POST(req1);
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(json1.success, true);

    // Second attempt in dev: deduplicated via in-memory fallback
    const req2 = createRequest(body, { "x-hub-signature-256": signature });
    const res2: any = await POST(req2);
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(json2.message, "Duplicate event ignored");
  });

  it("9. Different event IDs are both processed and claimed independently", async () => {
    const eventIdA = "wamid.DISTINCT_A_007";
    const eventIdB = "wamid.DISTINCT_B_008";

    const bodyA = createWebhookPayload(eventIdA);
    const bodyB = createWebhookPayload(eventIdB);

    const sigA = computeSignature(bodyA, TEST_APP_SECRET);
    const sigB = computeSignature(bodyB, TEST_APP_SECRET);

    const resA: any = await POST(createRequest(bodyA, { "x-hub-signature-256": sigA }));
    const resB: any = await POST(createRequest(bodyB, { "x-hub-signature-256": sigB }));

    assert.strictEqual(resA.status, 200);
    assert.strictEqual(resB.status, 200);
    assert.strictEqual(mockRedisStore.has(`whatsapp:webhook:${eventIdA}`), true);
    assert.strictEqual(mockRedisStore.has(`whatsapp:webhook:${eventIdB}`), true);
  });
});
