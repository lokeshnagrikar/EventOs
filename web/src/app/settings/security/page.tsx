"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SecuritySettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-zinc-400 text-xs">
      Redirecting to Security Settings...
    </div>
  );
}
