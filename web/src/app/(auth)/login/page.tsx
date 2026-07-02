"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectUrl = searchParams.get("redirect") || "";
    const expired = searchParams.get("expired") || "";
    const params = new URLSearchParams();
    params.set("login", "true");
    if (redirectUrl) {
      params.set("redirect", redirectUrl);
    }
    if (expired) {
      params.set("expired", expired);
    }
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="text-xs text-zinc-550 text-center py-8">
      Redirecting to secure login...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-550 text-center py-8">Loading...</div>}>
      <LoginRedirect />
    </Suspense>
  );
}
