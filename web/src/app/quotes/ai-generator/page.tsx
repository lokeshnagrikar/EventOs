"use client";

import React from "react";
import AIProposalGenerator from "@/components/ai/AIProposalGenerator";
import PageShell from "@/components/ui/PageShell";

export default function AIProposalPage() {
  return (
    <PageShell
      title="AI Proposal & Quote Generator"
      subtitle="Synthesize custom branded proposals and line-item estimates from lead notes in 30 seconds."
    >
      <AIProposalGenerator />
    </PageShell>
  );
}
