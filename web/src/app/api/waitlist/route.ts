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

// Background alert for Slack & Email (awaited so Vercel does not terminate early)
async function notifyFounder(lead: WaitlistRecord, spotNumber: number) {
  // 1. Slack Webhook Notification
  const slackWebhook =
    process.env.SLACK_WEBHOOK_URL ||
    Buffer.from(
      "aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDBCRFhDMUhYUzgvQjBCRENFUUVSNjMvTXF5bXpQNjJmbEptY29FZ3pxcnhKalFU",
      "base64"
    ).toString("utf-8");

  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚀 *New EventOS Waitlist Lead (#${spotNumber}/25)*\n• *Agency:* ${lead.agencyName}\n• *Contact:* ${lead.name}\n• *WhatsApp:* ${lead.whatsapp}\n• *Email:* ${lead.email}\n• *Event Focus:* ${lead.eventType}\n• *Current Tools:* ${lead.currentTools || "None"}\n• *WhatsApp Direct Link:* https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`,
        }),
      });
    } catch (err) {
      console.warn("[Slack Notification Failed]", err);
    }
  }

  // 2. Resend Email Alert (Sent from verified domain support@eventosapp.in)
  const resendKey =
    process.env.RESEND_API_KEY ||
    process.env.SMTP_PASSWORD ||
    Buffer.from("cmVfQTQxblZnYm1fTGN0NENwa0RBc0tLc1pZNFdHZjNtd2dY", "base64").toString("utf-8");

  if (resendKey) {
    const recipients = [
      "nagrikarlokesh24468@gmail.com",
      "devloperonly@gmail.com",
    ];

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EventOS Beta Alerts <support@eventosapp.in>",
          to: recipients,
          subject: `🔥 New VIP Beta Lead (#${spotNumber}): ${lead.agencyName} (${lead.name})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background: #0A0A0E; color: #E4E4E7; border-radius: 16px; border: 1px solid #27272A;">
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); font-size: 11px; font-weight: 700; color: #C084FC; text-transform: uppercase; letter-spacing: 1px;">
                  Private Beta Cohort #1 • Spot #${spotNumber} of 25
                </span>
              </div>
              <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 900; margin: 0 0 8px;">
                🎉 New Agency Waitlist Signup!
              </h2>
              <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 24px; line-height: 1.5;">
                A new prospective event agency just claimed a priority founding spot on EventOS.
              </p>
              
              <table width="100%" cellpadding="8" cellspacing="0" style="background: #12131A; border: 1px solid #27272E; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="color: #71717A; font-size: 12px; border-bottom: 1px solid #1C1D24;">Agency / Studio:</td>
                  <td style="color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: right; border-bottom: 1px solid #1C1D24;">${lead.agencyName}</td>
                </tr>
                <tr>
                  <td style="color: #71717A; font-size: 12px; border-bottom: 1px solid #1C1D24;">Founder / Contact:</td>
                  <td style="color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: right; border-bottom: 1px solid #1C1D24;">${lead.name}</td>
                </tr>
                <tr>
                  <td style="color: #71717A; font-size: 12px; border-bottom: 1px solid #1C1D24;">WhatsApp Number:</td>
                  <td style="color: #10B981; font-size: 14px; font-weight: 700; text-align: right; border-bottom: 1px solid #1C1D24;">
                    <a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}" style="color: #10B981; text-decoration: none;">${lead.whatsapp}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #71717A; font-size: 12px; border-bottom: 1px solid #1C1D24;">Work Email:</td>
                  <td style="color: #38BDF8; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #1C1D24;">
                    <a href="mailto:${lead.email}" style="color: #38BDF8; text-decoration: none;">${lead.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #71717A; font-size: 12px; border-bottom: 1px solid #1C1D24;">Primary Focus:</td>
                  <td style="color: #C084FC; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #1C1D24;">${lead.eventType}</td>
                </tr>
                <tr>
                  <td style="color: #71717A; font-size: 12px;">Current Tools:</td>
                  <td style="color: #E4E4E7; font-size: 13px; text-align: right;">${lead.currentTools || "None specified"}</td>
                </tr>
              </table>

              <div style="text-align: center; margin: 28px 0 16px;">
                <a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${lead.name}, this is Lokesh from EventOS. Thanks for claiming your founding spot for ${lead.agencyName}!`)}" 
                   style="display: inline-block; padding: 14px 28px; background: #10B981; color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 10px; margin-right: 8px;">
                  💬 Open WhatsApp Chat
                </a>
                <a href="https://eventosapp.in/founder/waitlist" 
                   style="display: inline-block; padding: 14px 24px; background: #27272A; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">
                  📊 Open Mini-CRM
                </a>
              </div>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.warn("[Resend Notification Failed]", err);
    }
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

    // Ensure notifications complete before Vercel serverless lambda finishes
    await notifyFounder(entry, spotNumber);

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
