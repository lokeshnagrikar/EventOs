import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function verifyFounderKey(suppliedKey: string | null | undefined): boolean {
  if (!suppliedKey || typeof suppliedKey !== "string" || suppliedKey.trim().length === 0) {
    return false;
  }
  const cleanSupplied = suppliedKey.trim();
  const configuredKey = (process.env.FOUNDER_SECRET_KEY || "").trim();

  // Valid secret keys: configured env key + default founder keys
  const validKeys = [
    ...(configuredKey ? [configuredKey] : []),
    "eventos2026",
    "eventos@founder2026",
    "lokesh2026"
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
  } catch {}
  return null;
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

    const entry = {
      id: "wtl_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      agencyName: agencyName.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      eventType: eventType || "Both",
      currentTools: currentTools?.trim() || "Not specified",
      joinedAt: new Date().toISOString(),
      isFoundingMember: true,
      status: "WAITLIST",
    };

    // Safe dual storage (local project data + /tmp fallback for serverless)
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "waitlist.json");
    const tmpFilePath = path.join("/tmp", "eventos_waitlist.json");

    let waitlistData: any[] = [];
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        waitlistData = JSON.parse(raw);
      } else if (fs.existsSync(tmpFilePath)) {
        const raw = fs.readFileSync(tmpFilePath, "utf-8");
        waitlistData = JSON.parse(raw);
      }
    } catch {
      waitlistData = [];
    }

    // Check if email or whatsapp already exists
    const existingIndex = waitlistData.findIndex(
      (w) => w.email === entry.email || w.whatsapp === entry.whatsapp
    );

    if (existingIndex >= 0) {
      waitlistData[existingIndex] = { ...waitlistData[existingIndex], ...entry };
    } else {
      waitlistData.unshift(entry);
    }

    // Write to disk
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(waitlistData, null, 2), "utf-8");
    } catch {
      // Ignore if local fs is read-only (e.g. Vercel)
    }

    try {
      fs.writeFileSync(tmpFilePath, JSON.stringify(waitlistData, null, 2), "utf-8");
    } catch {
      // Ignore fallback errors
    }

    // Real spot calculation based on actual leads
    const spotNumber = Math.min(waitlistData.length, 25);

    console.log(`[EventOS Waitlist] New lead captured: ${entry.name} (${entry.agencyName}) - Spot #${spotNumber}`);

    return NextResponse.json({
      success: true,
      message: "Founding member waitlist spot secured.",
      spotNumber,
      totalCap: 25,
      entry: {
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

  // Read waitlist data
  const filePath = path.join(process.cwd(), "data", "waitlist.json");
  const tmpFilePath = path.join("/tmp", "eventos_waitlist.json");

  let waitlistData: any[] = [];
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      waitlistData = JSON.parse(raw);
    } else if (fs.existsSync(tmpFilePath)) {
      const raw = fs.readFileSync(tmpFilePath, "utf-8");
      waitlistData = JSON.parse(raw);
    }
  } catch {
    waitlistData = [];
  }

  // If founder secret matches, return full lead list
  if (verifyFounderKey(key)) {
    return NextResponse.json({
      success: true,
      totalLeads: waitlistData.length,
      claimedSpots: Math.min(waitlistData.length, 25),
      leads: waitlistData,
    });
  }

  // Otherwise return public safe stats
  return NextResponse.json({
    active: true,
    cohort: "Founding Member Private Beta",
    cap: 25,
    claimed: Math.min(waitlistData.length, 25),
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

    const filePath = path.join(process.cwd(), "data", "waitlist.json");
    const tmpFilePath = path.join("/tmp", "eventos_waitlist.json");

    let waitlistData: any[] = [];
    try {
      if (fs.existsSync(filePath)) {
        waitlistData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } else if (fs.existsSync(tmpFilePath)) {
        waitlistData = JSON.parse(fs.readFileSync(tmpFilePath, "utf-8"));
      }
    } catch {
      waitlistData = [];
    }

    const idx = waitlistData.findIndex((w) => w.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    waitlistData[idx] = { ...waitlistData[idx], ...updates, updatedAt: new Date().toISOString() };

    try {
      fs.writeFileSync(filePath, JSON.stringify(waitlistData, null, 2), "utf-8");
    } catch {}
    try {
      fs.writeFileSync(tmpFilePath, JSON.stringify(waitlistData, null, 2), "utf-8");
    } catch {}

    return NextResponse.json({ success: true, lead: waitlistData[idx] });
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

    const filePath = path.join(process.cwd(), "data", "waitlist.json");
    const tmpFilePath = path.join("/tmp", "eventos_waitlist.json");

    let waitlistData: any[] = [];
    try {
      if (fs.existsSync(filePath)) {
        waitlistData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } else if (fs.existsSync(tmpFilePath)) {
        waitlistData = JSON.parse(fs.readFileSync(tmpFilePath, "utf-8"));
      }
    } catch {
      waitlistData = [];
    }

    const initialLength = waitlistData.length;
    waitlistData = waitlistData.filter((w) => w.id !== id);

    if (waitlistData.length === initialLength) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(waitlistData, null, 2), "utf-8");
    } catch {}
    try {
      fs.writeFileSync(tmpFilePath, JSON.stringify(waitlistData, null, 2), "utf-8");
    } catch {}

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

