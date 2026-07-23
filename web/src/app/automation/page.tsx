"use client";

import React from "react";
import WhatsAppSmsDesk from "@/components/automation/WhatsAppSmsDesk";
import PageShell from "@/components/ui/PageShell";

export default function AutomationPage() {
  return (
    <PageShell
      title="Automation & Communications Desk"
      subtitle="Configure WhatsApp & SMS triggers, RSVP notifications, and automated reminders."
    >
      <WhatsAppSmsDesk />
    </PageShell>
  );
}
