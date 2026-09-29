import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);

// Regex for valid hostname / domain name (RFC 1123)
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawDomain = body.domain;

    if (!rawDomain || typeof rawDomain !== "string") {
      return NextResponse.json(
        { valid: false, message: "Please provide a valid domain name." },
        { status: 400 }
      );
    }

    // Clean domain: strip http/https and trailing slashes
    const domain = rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");

    if (!DOMAIN_REGEX.test(domain)) {
      return NextResponse.json(
        {
          valid: false,
          domain,
          message: "Invalid domain format. Example: portal.youragency.com",
        },
        { status: 400 }
      );
    }

    // Disallow pointing root domain of EventOS itself as a custom white-label domain
    if (domain === "eventosapp.in" || domain === "www.eventosapp.in") {
      return NextResponse.json(
        {
          valid: false,
          domain,
          message: "eventosapp.in is the primary platform domain, not an external custom domain.",
        },
        { status: 400 }
      );
    }

    const expectedTargets = [
      "cname.eventosapp.in",
      "cname.vercel-dns.com",
      "eventosapp.in",
      "www.eventosapp.in",
    ];

    let cnameRecords: string[] = [];
    try {
      cnameRecords = await resolveCname(domain);
    } catch (dnsErr: any) {
      // ENODATA or ENOTFOUND means no CNAME record found
      return NextResponse.json({
        valid: false,
        domain,
        expectedTarget: "cname.eventosapp.in",
        foundRecords: [],
        status: "NOT_CONFIGURED",
        message: `No CNAME record found for ${domain}. Please add a CNAME record pointing to cname.eventosapp.in in your DNS provider (GoDaddy, Cloudflare, etc.). DNS changes may take a few minutes to propagate.`,
      });
    }

    // Check if any resolved CNAME matches our targets
    const isTargetMatch = cnameRecords.some((record) => {
      const cleanRecord = record.toLowerCase().replace(/\.$/, "");
      return expectedTargets.some(
        (target) => cleanRecord === target || cleanRecord.endsWith(".eventosapp.in") || cleanRecord.endsWith(".vercel-dns.com")
      );
    });

    if (isTargetMatch) {
      return NextResponse.json({
        valid: true,
        domain,
        expectedTarget: "cname.eventosapp.in",
        foundRecords: cnameRecords,
        status: "ACTIVE",
        message: `✅ CNAME successfully verified! ${domain} is pointing to ${cnameRecords[0]}.`,
      });
    } else {
      return NextResponse.json({
        valid: false,
        domain,
        expectedTarget: "cname.eventosapp.in",
        foundRecords: cnameRecords,
        status: "MISCONFIGURED",
        message: `CNAME is currently pointing to "${cnameRecords.join(", ")}" instead of "cname.eventosapp.in". Please update your DNS records.`,
      });
    }
  } catch (error: any) {
    console.error("[Domain Verification Error]:", error);
    return NextResponse.json(
      {
        valid: false,
        message: "Internal error during DNS verification. Please try again in a few moments.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
