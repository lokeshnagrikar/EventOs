import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get("hasSession")?.value;

  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/register") || 
                      pathname.startsWith("/forgot-password") || 
                      pathname.startsWith("/reset-password");
                      
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
                            pathname.startsWith("/reports");

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/workspace-select", request.url));
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
    "/reports/:path*",
  ],
};
