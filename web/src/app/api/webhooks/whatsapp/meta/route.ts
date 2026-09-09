import { NextRequest, NextResponse } from "next/server";

const DEFAULT_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "eventos_meta_verify_token";

/**
 * GET handler: Meta WhatsApp Cloud API Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === DEFAULT_VERIFY_TOKEN) {
    console.log("[WHATSAPP_WEBHOOK] Verification successful for challenge:", challenge);
    return new Response(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden. Invalid verification token." }, { status: 403 });
}

/**
 * POST handler: Inbound WhatsApp messages and message delivery statuses (sent, delivered, read)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Handle delivery status updates (sent, delivered, read, failed)
      if (value?.statuses && value.statuses.length > 0) {
        const statusUpdate = value.statuses[0];
        console.log(`[WHATSAPP_STATUS] Message ID: ${statusUpdate.id}, Status: ${statusUpdate.status}, Recipient: ${statusUpdate.recipient_id}`);
      }

      // Handle incoming messages from clients/vendors
      if (value?.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const from = message.from;
        const text = message.text?.body;
        console.log(`[WHATSAPP_INBOUND] Message from ${from}: ${text}`);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ status: "ignored" }, { status: 200 });
  } catch (error: any) {
    console.error("[WHATSAPP_WEBHOOK_ERROR] Failed to process webhook event:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 }); // Always 200 to prevent Meta retry loops
  }
}
