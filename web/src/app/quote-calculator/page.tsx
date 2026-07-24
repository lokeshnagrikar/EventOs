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
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6">
        <EventQuoteCalculator />
      </main>
      <Footer />
    </div>
  );
}
