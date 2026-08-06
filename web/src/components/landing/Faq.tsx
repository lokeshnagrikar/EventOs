"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Icon } from "@iconify/react";

const faqs = [
  {
    value: "q1",
    icon: "solar:shield-check-bold-duotone",
    question: "Is my customer and transaction data isolated?",
    answer: "Yes, 100%. EventOS is engineered with a strict multi-tenant architecture. Every single table in our PostgreSQL database has a tenant_id column, and Hibernate enforces tenant isolation filters on every SQL query. A user from Tenant A can never view records from Tenant B.",
  },
  {
    value: "q2",
    icon: "solar:palette-bold-duotone",
    question: "Can I use my own brand logo and custom domain?",
    answer: "Absolutely. On our Professional and Enterprise plans, you can map your own domain (e.g., proposals.yourbrand.com) and customize email templates via SMTP, so your clients see a fully branded, professional portal — zero EventOS branding visible.",
  },
  {
    value: "q3",
    icon: "solar:gallery-bold-duotone",
    question: "How secure are the client galleries?",
    answer: "Galleries are cloud-hosted with unique, cryptographically signed share links. You can configure passcode protection, restrict image downloads (e.g., view-only vs high-res download), and set expiration dates on public access links. All assets are served over CDN with signed URLs.",
  },
  {
    value: "q4",
    icon: "solar:buildings-bold-duotone",
    question: "Can I manage multiple event agencies or client workspaces?",
    answer: "Yes. The premium workspace switcher lets you register and transition between different agency profiles or isolated tenant environments without having to log out and log back in.",
  },
  {
    value: "q5",
    icon: "solar:bell-bing-bold-duotone",
    question: "Does EventOS support automatic payment reminders?",
    answer: "Yes, our background workers monitor invoice due dates and automatically trigger payment reminders to clients via webhooks or RabbitMQ events, keeping your cash flow consistent and reducing late payments.",
  },
  {
    value: "q6",
    icon: "solar:users-group-bold-duotone",
    question: "What team roles and permissions are available?",
    answer: "EventOS supports Owner, Admin, Manager, Staff, and Client roles. Each role has scoped access — for example, Staff can only view events they're assigned to, while Owners have full workspace control. All role checks are enforced at the API level.",
  },
];

export function Faq() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="py-24 border-b border-[#E5E7EB] bg-[#FFFFFF] w-full relative z-10"
      id="faq"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
            <Icon icon="solar:question-circle-bold-duotone" className="text-[#7C3AED] text-sm" />
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827] font-heading">
            Frequently Asked{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]">
              Questions
            </span>
          </h2>
          <p className="text-[#4B5563] text-sm leading-relaxed font-medium">
            Everything you need to know about EventOS security, billing, white-label options, and team management.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-[#E5E7EB] shadow-md rounded-2xl p-4 sm:p-6"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={faq.value}
                value={faq.value}
                className="border-b border-slate-200/80 py-1 last:border-0 group/item"
              >
                <AccordionTrigger className="text-sm sm:text-base font-bold text-slate-900 hover:text-purple-600 hover:no-underline focus:text-purple-600 py-4 flex items-center gap-3 [&>svg]:text-slate-500">
                  <div className="flex items-center gap-3 text-left">
                    <Icon
                      icon={faq.icon}
                      className="text-purple-600 text-xl shrink-0 group-data-[state=open]/item:text-purple-600 transition-colors"
                    />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pt-1 pb-5 pl-9 border-l-2 border-purple-500/30 ml-3 group-data-[state=open]/item:border-purple-500/60 transition-colors">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10 text-center"
        >
          <p className="text-slate-600 font-medium text-sm">
            Still have questions?{" "}
            <a
              href="mailto:support@eventos.io"
              className="text-purple-400 font-bold hover:text-purple-300 transition-colors hover:underline"
            >
              Chat with our team →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
