"use client";

import React from "react";
import EventsDashboard from "@/components/events/EventsDashboard";
import PageShell from "@/components/ui/PageShell";

export default function EventsPage() {
  return (
    <PageShell
      title="Events Operations Hub"
      subtitle="Schedule tasks, manage venue spaces, and coordinate logistics pipelines."
    >
      <EventsDashboard />
    </PageShell>
  );
}
