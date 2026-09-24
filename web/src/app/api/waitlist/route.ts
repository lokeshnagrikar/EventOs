import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getAllWaitlistLeads,
  saveWaitlistLead,
  updateWaitlistLead,
  deleteWaitlistLead,
  WaitlistRecord,
} from "@/lib/waitlist-storage";

function verifyFounderKey(suppliedKey: string | null | undefined): boolean {
  if (!suppliedKey || typeof suppliedKey !== "string" || suppliedKey.trim().length === 0) {
    return false;
  }
  const cleanSupplied = suppliedKey.trim();
  const configuredKey = (process.env.FOUNDER_SECRET_KEY || "").trim();

  // Valid secret keys: configured env key + default founder keys
  const validKeys: string[] = [
    ...(configuredKey ? [configuredKey] : []),
    "eventos2026",
    "eventos@founder2026",
    "lokesh2026",
  ];

  return validKeys.some((k) => {
    if (k.length !== cleanSupplied.length) return false;
    return crypto.timingSafeEqual(Buffer.from(cleanSupplied), Buffer.from(k));
  });
}

function extractFounderKey(req: NextRequest): string | null {
  const headerKey = req.headers.get("x-founder-key");
  if (headerKey) return headerKey;
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  try {
    const url = new URL(req.url);
    const queryKey = url.searchParams.get("key");
    if (queryKey) return queryKey;
  } catch { }
  return null;
}

// Background fire-and-forget alert for Slack & Email
async function notifyFounder(lead: WaitlistRecord, spotNumber: number) {
  // 1. Slack Webhook Notification
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚀 *New EventOS Waitlist Lead (#${spotNumber}/25)*\n• *Agency:* ${lead.agencyName}\n• *Contact:* ${lead.name}\n• *WhatsApp:* ${lead.whatsapp}\n• *Email:* ${lead.email}\n• *Event Focus:* ${lead.eventType}\n• *Current Tools:* ${lead.currentTools || "None"}\n• *WhatsApp Direct Link:* https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`,
        }),
      }).catch((err) => console.warn("[Slack Notification Failed]", err));
    } catch { }
  }

  // 2. Resend Email Alert if API key exists
  const resendKey = process.env.RESEND_API_KEY || (process.env.SMTP_PASSWORD?.startsWith("re_") ? process.env.SMTP_PASSWORD : null);
  if (resendKey) {
    try {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EventOS Alerts <onboarding@resend.dev>",
          to: ["lokeshnagrikar2405@gmail.com"],
          subject: `🔥 New VIP Beta Lead: ${lead.agencyName} (${lead.name})`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; padding: 20px; background: #0A0A0C; color: #fff; border-radius: 12px;">
              <h2 style="color: #A855F7; margin-top: 0;">🎉 New Private Beta Signup!</h2>
              <p><strong>Spot Claimed:</strong> #${spotNumber} of 25</p>
              <hr style="border: 0; border-top: 1px solid #27272A; margin: 16px 0;" />
              <p><strong>Agency Name:</strong> ${lead.agencyName}</p>
              <p><strong>Owner Name:</strong> ${lead.name}</p>
              <p><strong>WhatsApp:</strong> <a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}" style="color: #10B981;">${lead.whatsapp}</a></p>
              <p><strong>Email:</strong> ${lead.email}</p>
              <p><strong>Event Focus:</strong> ${lead.eventType}</p>
              <p><strong>Current Tools:</strong> ${lead.currentTools || "Not specified"}</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <div style="margin-top: 20px;">
                <a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}" style="display: inline-block; padding: 10px 18px; background: #10B981; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Message on WhatsApp</a>
              </div>
            </div>
          `,
        }),
      }).catch((err) => console.warn("[Resend Notification Failed]", err));
    } catch { }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, agencyName, email, whatsapp, eventType, currentTools } = body;

    // Validation
    if (!name?.trim() || !agencyName?.trim() || !email?.trim() || !whatsapp?.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide all required fields: Name, Agency Name, Work Email, and WhatsApp number." },
        { status: 400 }
      );
    }

    const entry: WaitlistRecord = {
      id: "wtl_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      agencyName: agencyName.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      eventType: eventType || "Both",
      currentTools: currentTools?.trim() || "Not specified",
      joinedAt: new Date().toISOString(),
      isFoundingMember: true,
      status: "NEW",
    };

    await saveWaitlistLead(entry);
    const allLeads = await getAllWaitlistLeads();
    const spotNumber = Math.min(allLeads.length, 25);

    // Fire notifications asynchronously
    notifyFounder(entry, spotNumber);

    return NextResponse.json({
      success: true,
      message: "Founding member waitlist spot secured.",
      spotNumber,
      totalCap: 25,
      entry: {
        id: entry.id,
        name: entry.name,
        agencyName: entry.agencyName,
      },
    });
  } catch (error: any) {
    console.error("Waitlist submission error:", error?.message || "unknown");
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again or WhatsApp us directly." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const key = extractFounderKey(req);
  const leads = await getAllWaitlistLeads();

  // If founder secret matches, return full lead list
  if (verifyFounderKey(key)) {
    return NextResponse.json({
      success: true,
      totalLeads: leads.length,
      claimedSpots: Math.min(leads.length, 25),
      leads,
    });
  }

  // Otherwise return public safe stats
  return NextResponse.json({
    active: true,
    cohort: "Founding Member Private Beta",
    cap: 25,
    claimed: Math.min(leads.length, 25),
  });
}

export async function PUT(req: NextRequest) {
  try {
    const key = extractFounderKey(req);

    if (!verifyFounderKey(key)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 });
    }

    const updated = await updateWaitlistLead(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const key = extractFounderKey(req);

    if (!verifyFounderKey(key)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 });
    }

    const deleted = await deleteWaitlistLead(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
