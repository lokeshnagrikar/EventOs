import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get("hasSession")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/register");

  const isSuperAdminRoute = pathname.startsWith("/superadmin") && pathname !== "/superadmin/login";
                      
  const isProtectedRoute = pathname.startsWith("/portal") || 
                            pathname.startsWith("/onboarding") || 
                            pathname.startsWith("/settings") || 
                            pathname.startsWith("/workspace-select") ||
                            pathname.startsWith("/dashboard") ||
                            pathname.startsWith("/crm") ||
                            pathname.startsWith("/events") ||
                            pathname.startsWith("/bookings") ||
                            pathname.startsWith("/quotes") ||
                            pathname.startsWith("/payments") ||
                            pathname.startsWith("/invoices") ||
                            pathname.startsWith("/calculator") ||
                            pathname.startsWith("/gallery") ||
                            pathname.startsWith("/activity") ||
                            pathname.startsWith("/ai") ||
                            pathname.startsWith("/chat") ||
                            pathname.startsWith("/developer") ||
                            pathname.startsWith("/import") ||
                            pathname.startsWith("/automation") ||
                            isSuperAdminRoute ||
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

  // Require session for protected routes
  if (isProtectedRoute && !hasSession) {
    const redirectPath = pathname.startsWith("/superadmin") ? "/superadmin/login" : "/";
    const loginUrl = new URL(redirectPath, request.url);
    if (!pathname.startsWith("/superadmin")) {
      loginUrl.searchParams.set("login", "true");
    }
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 1. Superadmin console role enforcement
  if (isSuperAdminRoute && userRole !== "SUPER_ADMIN") {
    const loginUrl = new URL("/superadmin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Client role boundary: CLIENT accounts must only access the client portal
  if (hasSession && userRole === "CLIENT" && !pathname.startsWith("/portal") && isProtectedRoute) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // 3. Agency staff/admin boundary: Non-clients navigating directly to /portal get sent to their workspace
  if (hasSession && pathname.startsWith("/portal") && userRole && userRole !== "CLIENT") {
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect authenticated users away from public auth routes
  if (isAuthRoute && hasSession) {
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    } else if (userRole === "CLIENT") {
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
