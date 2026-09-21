import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwtVerify";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get("hasSession")?.value || request.cookies.get("accessToken")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/register");

  const isSuperAdminRoute = pathname.startsWith("/superadmin") && pathname !== "/superadmin/login";

  const PLATFORM_ROLES = new Set([
    "SUPER_ADMIN",
    "PLATFORM_SUPER_ADMIN",
    "SUPERADMIN",
    "PLATFORM_ADMIN",
    "OPERATIONS_LEAD",
    "OPERATIONS",
    "OPERATION",
    "OPERATIONS_MANAGER",
    "OPS",
    "SUPPORT_LEAD",
    "SUPPORT_AGENT",
    "SUPPORT",
    "SUPPORT_ADMIN",
    "TECH_SUPPORT",
    "CUSTOMER_SUPPORT",
    "FINANCE_OFFICER",
    "FINANCE_ADMIN",
    "FINANCE",
    "DEVOPS_ENGINEER",
    "DEVOPS",
    "DEVELOPER",
    "COMPLIANCE_AUDITOR",
    "AUDITOR",
    "COMPLIANCE",
  ]);

  // --- 1. SUPERADMIN ROUTE PROTECTION (PHASE 2D/2E) ---
  // Cryptographically verify accessToken JWT for all protected /superadmin/* routes.
  // Never trust client-controlled cookies (hasSession, user_role) as proof of authorization.
  if (isSuperAdminRoute) {
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken) {
      const loginUrl = new URL("/superadmin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const verifiedPayload = await verifyAccessToken(accessToken);
    const rawRole = typeof verifiedPayload?.roles === "string"
      ? verifiedPayload.roles
      : (Array.isArray(verifiedPayload?.roles) ? (verifiedPayload?.roles as string[])[0] : (typeof verifiedPayload?.role === "string" ? verifiedPayload.role : ""));
    const normalizedRole = (rawRole || "").replace(/^ROLE_/, "").toUpperCase();

    if (!verifiedPayload || !normalizedRole || !PLATFORM_ROLES.has(normalizedRole)) {
      const loginUrl = new URL("/superadmin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }
                      
  const isProtectedRoute = pathname.startsWith("/portal") || 
                            pathname.startsWith("/onboarding") || 
                            pathname.startsWith("/settings") || 
                            pathname.startsWith("/dashboard") || 
                            pathname.startsWith("/crm") || 
                            pathname.startsWith("/events") || 
                            pathname.startsWith("/bookings") || 
                            pathname.startsWith("/quotes") || 
                            pathname.startsWith("/payments") || 
                            pathname.startsWith("/invoices") || 
                            pathname.startsWith("/gallery") || 
                            pathname.startsWith("/activity") || 
                            pathname.startsWith("/ai") || 
                            pathname.startsWith("/chat") || 
                            pathname.startsWith("/developer") || 
                            pathname.startsWith("/import") || 
                            pathname.startsWith("/automation") || 
                            pathname.startsWith("/finance") || 
                            pathname.startsWith("/reports");

  // Direct /login and /register visitors to the unified landing modal
  if (pathname === "/login") {
    const url = new URL("/", request.url);
    url.searchParams.set("login", "true");
    request.nextUrl.searchParams.forEach((val, key) => {
      url.searchParams.set(key, val);
    });
    return NextResponse.redirect(url);
  }

  if (pathname === "/register") {
    const url = new URL("/", request.url);
    url.searchParams.set("register", "true");
    request.nextUrl.searchParams.forEach((val, key) => {
      url.searchParams.set(key, val);
    });
    return NextResponse.redirect(url);
  }

  // Extract cryptographically verified role from accessToken when present
  const accessToken = request.cookies.get("accessToken")?.value;
  const verifiedPayload = accessToken ? await verifyAccessToken(accessToken) : null;
  const verifiedRole = (verifiedPayload?.roles as string) || null;
  const effectiveRole = verifiedRole || userRole;

  // Require session for protected routes
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("login", "true");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Client role boundary: CLIENT accounts must only access the client portal
  if (hasSession && effectiveRole === "CLIENT" && !pathname.startsWith("/portal") && isProtectedRoute) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  const normalizedEffectiveRole = (effectiveRole || "").replace(/^ROLE_/, "").toUpperCase();

  // 3. Agency staff/admin boundary: Non-clients navigating directly to /portal get sent to their workspace
  if (hasSession && pathname.startsWith("/portal") && normalizedEffectiveRole && normalizedEffectiveRole !== "CLIENT") {
    if (PLATFORM_ROLES.has(normalizedEffectiveRole)) {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect authenticated users away from public auth routes
  if (isAuthRoute && hasSession) {
    if (normalizedEffectiveRole && PLATFORM_ROLES.has(normalizedEffectiveRole)) {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    } else if (normalizedEffectiveRole === "CLIENT") {
      return NextResponse.redirect(new URL("/portal", request.url));
    } else {
      return NextResponse.redirect(new URL("/workspace-select", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/portal/:path*",
    "/onboarding",
    "/workspace-select",
    "/settings/:path*",
    "/dashboard/:path*",
    "/crm/:path*",
    "/events/:path*",
    "/bookings/:path*",
    "/quotes/:path*",
    "/payments/:path*",
    "/invoices/:path*",
    "/calculator/:path*",
    "/gallery/:path*",
    "/activity/:path*",
    "/ai/:path*",
    "/chat/:path*",
    "/developer/:path*",
    "/import/:path*",
    "/automation/:path*",
    "/superadmin/:path*",
    "/finance/:path*",
    "/reports/:path*",
  ],
};
