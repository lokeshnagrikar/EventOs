"use client";

import React from "react";
import BookingsDashboard from "@/components/bookings/BookingsDashboard";
import QuickActionsFAB from "@/components/finance/QuickActionsFAB";
import PageShell from "@/components/ui/PageShell";

export default function BookingsPage() {
  return (
    <PageShell
      title="Bookings & Financial Contracts"
      subtitle="Monitor event reservation ledgers, payment progress, and contract milestones."
    >
      <BookingsDashboard />
      <QuickActionsFAB />
    </PageShell>
  );
}
