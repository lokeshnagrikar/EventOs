"use client";

import React from "react";
import AIScheduleResolver from "@/components/ai/AIScheduleResolver";
import PageShell from "@/components/ui/PageShell";

export default function AutoSchedulerPage() {
  return (
    <PageShell
      title="AI Auto Event Scheduler"
      subtitle="Optimize vendor setup schedules and resolve timeline overlaps in 1 click."
    >
      <AIScheduleResolver />
    </PageShell>
  );
}
