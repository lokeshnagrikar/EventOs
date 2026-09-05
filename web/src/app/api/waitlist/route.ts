import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    console.log(`[EventOS Waitlist] New lead captured: ${entry.name} (${entry.agencyName}) - ${entry.whatsapp} - Spot #${spotNumber}`);

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
    console.error("Waitlist submission error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again or WhatsApp us directly." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || req.headers.get("x-founder-key");

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
  if (key === "eventos2026" || key === process.env.FOUNDER_SECRET_KEY) {
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
    const body = await req.json();
    const { key, id, updates } = body;

    if (key !== "eventos2026" && key !== process.env.FOUNDER_SECRET_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || req.headers.get("x-founder-key");
    const id = searchParams.get("id");

    if (key !== "eventos2026" && key !== process.env.FOUNDER_SECRET_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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

