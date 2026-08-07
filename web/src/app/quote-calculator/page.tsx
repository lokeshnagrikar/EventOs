import React from "react";
import { EventQuoteCalculator } from "@/components/quote/EventQuoteCalculator";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Instant Event Quote Calculator & Proposal Generator | EventOS",
  description: "Calculate live itemized event production costs, customize line items, apply promo discounts, and export official PDF proposals instantly."
};

export default function QuoteCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <EventQuoteCalculator />
      </main>
      <Footer />
    </div>
  );
}
