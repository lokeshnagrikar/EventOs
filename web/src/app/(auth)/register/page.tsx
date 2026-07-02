"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("register", "true");
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="text-xs text-zinc-555 text-center py-8">
      Redirecting to registration...
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-555 text-center py-8">Loading...</div>}>
      <RegisterRedirect />
    </Suspense>
  );
}
