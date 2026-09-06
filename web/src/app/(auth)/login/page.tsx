"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("login", "true");
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      <span className="text-xs text-zinc-400 font-mono tracking-wide">Redirecting to login...</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-500 text-center py-8">Loading EventOS...</div>}>
      <LoginContent />
    </Suspense>
  );
}
