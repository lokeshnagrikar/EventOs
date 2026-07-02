"use client";

import React from "react";
import { useParams } from "next/navigation";
import InvoiceWorkspace from "@/components/finance/InvoiceWorkspace";
import QuickActionsFAB from "@/components/finance/QuickActionsFAB";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Main Workspace content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full z-10">
        <InvoiceWorkspace invoiceId={invoiceId} />
      </main>

      <QuickActionsFAB />
    </div>
  );
}
