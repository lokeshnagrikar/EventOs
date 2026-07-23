"use client";

import React from "react";
import LeadScoringChurnPredictor from "@/components/ai/LeadScoringChurnPredictor";
import PageShell from "@/components/ui/PageShell";

export default function LeadScoringPage() {
  return (
    <PageShell
      title="AI Lead Scoring & Churn Predictor"
      subtitle="Evaluate conversion probabilities and preemptively retain high-risk client accounts."
    >
      <LeadScoringChurnPredictor />
    </PageShell>
  );
}
