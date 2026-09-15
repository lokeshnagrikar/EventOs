import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { claimDistributedWebhookEvent } from "../../../../../lib/redis";

const DEFAULT_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "eventos_meta_verify_token";

// In-memory fallback cache only for development/testing when Redis is unavailable
const devFallbackEventCache = new Map<string, number>();
const REPLAY_WINDOW_MS = 10 * 60 * 1000;

function cleanupDevFallbackEvents() {
  const now = Date.now();
  devFallbackEventCache.forEach((timestamp, id) => {
    if (now - timestamp > REPLAY_WINDOW_MS) {
      devFallbackEventCache.delete(id);
    }
  });
}

/**
 * GET handler: Meta WhatsApp Cloud API Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === DEFAULT_VERIFY_TOKEN) {
    console.log("[WHATSAPP_WEBHOOK] Verification handshake successful");
    return new Response(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden. Invalid verification token." }, { status: 403 });
}

/**
 * POST handler: Inbound WhatsApp messages and message delivery statuses with HMAC verification & atomic Redis replay protection
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // 1. Mandatory HMAC verification - MUST succeed BEFORE any event claiming
    if (process.env.NODE_ENV === "production" || appSecret) {
      if (!appSecret) {
        console.error("[WHATSAPP_WEBHOOK_ERROR] WHATSAPP_APP_SECRET is not configured in production");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
      }

      if (!signature || !signature.startsWith("sha256=")) {
        return NextResponse.json({ error: "Unauthorized. Missing or invalid signature." }, { status: 401 });
      }

      const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        return NextResponse.json({ error: "Unauthorized. Signature verification failed." }, { status: 401 });
      }
    }

    // 2. Parse and validate webhook payload structure
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Bad Request. Malformed JSON payload." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // 3. Extract stable event ID
    const eventId = value?.messages?.[0]?.id || value?.statuses?.[0]?.id || (entry?.id && entry?.time ? `${entry.id}_${entry.time}` : null);

    if (eventId) {
      // 4. Atomic Redis claim via SET key value EX 600 NX
      const claimResult = await claimDistributedWebhookEvent(eventId, 600);

      if (claimResult.status === "duplicate") {
        // Return 200 duplicate response WITHOUT executing business logic
        return NextResponse.json({ success: true, message: "Duplicate event ignored" }, { status: 200 });
      }

      if (claimResult.status === "unavailable") {
        // Production MUST fail closed if replay protection is unavailable
        if (process.env.NODE_ENV === "production") {
          console.error("[WHATSAPP_WEBHOOK_ERROR] Redis replay protection unavailable in production - failing closed");
          return NextResponse.json({ error: "Replay protection service unavailable" }, { status: 500 });
        }

        // In dev/test, fallback to in-memory deduplication with a warning
        console.warn("[WHATSAPP_WEBHOOK_WARN] Redis unavailable in dev/test - falling back to in-memory deduplication");
        cleanupDevFallbackEvents();
        if (devFallbackEventCache.has(eventId)) {
          return NextResponse.json({ success: true, message: "Duplicate event ignored" }, { status: 200 });
        }
        devFallbackEventCache.set(eventId, Date.now());
      }
    }

    // 5. Execute business logic only if event was claimed
    if (value?.statuses && value.statuses.length > 0) {
      const statusUpdate = value.statuses[0];
      console.log(`[WHATSAPP_STATUS] Message ID: ${statusUpdate.id}, Status: ${statusUpdate.status}, Recipient: ${statusUpdate.recipient_id}`);
    }

    if (value?.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const from = message.from;
      const text = message.text?.body;
      console.log(`[WHATSAPP_INBOUND] Message from ${from}: ${text ? "[REDACTED_TEXT]" : "none"}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[WHATSAPP_WEBHOOK_ERROR] Failed to process webhook event:", error.message);
    return NextResponse.json({ success: false, error: "Internal processing error" }, { status: 500 });
  }
}
