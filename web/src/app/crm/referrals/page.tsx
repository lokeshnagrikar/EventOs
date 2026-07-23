"use client";

import React from "react";
import ReferralAffiliateEngine from "@/components/marketing/ReferralAffiliateEngine";
import PageShell from "@/components/ui/PageShell";

export default function ReferralsPage() {
  return (
    <PageShell
      title="Referral & Affiliate Engine"
      subtitle="Track partner vendor referrals, past client rewards, and commission payouts."
    >
      <ReferralAffiliateEngine />
    </PageShell>
  );
}
