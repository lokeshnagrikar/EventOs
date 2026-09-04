"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export function Footer() {
  const router = useRouter();

  const links = {
    product: [
      { name: "CRM & Leads", href: "#features" },
      { name: "Smart Quotes", href: "#features" },
      { name: "Task Timelines", href: "#workflow" },
      { name: "Modules Suite", href: "#modules" },
      { name: "Gallery Delivery", href: "#features" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Contact Us", href: "/contact" },
      { name: "Templates Center", href: "/resources" },
      { name: "Platform Security", href: "/security" },
      { name: "System Status", href: "/status" },
    ],
    developer: [
      { name: "Developer Center", href: "/developer" },
      { name: "REST API Specs", href: "/developer" },
      { name: "Webhooks Engine", href: "/automation" },
      { name: "Platform Security", href: "/security" },
      { name: "Founder Story", href: "/about" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Refund & Cancellation", href: "/refund" },
      { name: "Tenant SLA", href: "/sla" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  const socials = [
    { icon: "simple-icons:x", href: "https://twitter.com", label: "EventOS on X/Twitter" },
    { icon: "simple-icons:github", href: "https://github.com/lokeshnagrikar", label: "EventOS on GitHub" },
    { icon: "simple-icons:linkedin", href: "https://linkedin.com", label: "EventOS on LinkedIn" },
    { icon: "simple-icons:instagram", href: "https://instagram.com", label: "EventOS on Instagram" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const elem = document.getElementById(href.replace("#", ""));
      if (elem) {
        const lenis = (window as any).lenis;
        if (lenis) {
          lenis.scrollTo(elem, { offset: -80, duration: 1.2 });
        } else {
          window.scrollTo({ top: elem.offsetTop - 80, behavior: "smooth" });
        }
      }
    } else {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <footer suppressHydrationWarning className="border-t border-slate-800 bg-[#0B0F19] text-slate-300 pt-20 pb-24 sm:pb-20 w-full relative z-10 text-left overflow-hidden">
      {/* Top Gradient Accent Line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 opacity-90" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[180px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-6 gap-8 relative z-10" suppressHydrationWarning>

        {/* Brand Column */}
        <div className="md:col-span-2 space-y-5">
          <div
            className="group flex items-center gap-3 cursor-pointer select-none focus:outline-none rounded-lg p-1 w-fit transition-all duration-300"
            onClick={() => router.push("/")}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && router.push("/")}
            aria-label="EventOS Home"
          >
            {/* Logo Emblem */}
            <img 
              src="/logo/logo.png" 
              alt="EventOS Logo" 
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              suppressHydrationWarning
              className="h-11 w-11 object-contain transition-all duration-300 ease-out group-hover:scale-105 group-hover:rotate-[3deg]"
            />

            {/* Vertical Separator */}
            <div className="h-9 w-[1px] bg-slate-700/80 transition-colors duration-300 group-hover:bg-purple-500/40" />

            {/* Brand Text */}
            <div className="flex flex-col justify-center text-left transition-all duration-300 group-hover:translate-x-0.5">
              <h4 className="font-extrabold text-base leading-none tracking-tight text-white flex items-center transition-all duration-300">
                Event
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ml-0.5 font-black">
                  OS
                </span>
              </h4>
              <span className="text-[7.5px] text-slate-400 font-extrabold tracking-[0.14em] uppercase block mt-1 leading-none">
                MANAGE. ENGAGE. ELEVATE.
              </span>
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-medium">
            EventOS is the all-in-one operating system for event planners, wedding agencies, and production teams. Tenant-isolated, secure, and built for scale.
          </p>

          {/* SaaS Architecture Badge */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1 max-w-sm shadow-inner">
            <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider block">
              SaaS Engine Architecture
            </span>
            <p className="text-[10.5px] text-slate-300 font-semibold leading-snug">
              Next.js 14 • Spring Boot Microservices • Docker Multi-Tenant Isolation
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2 pt-1">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/60 hover:bg-purple-950/40 transition-all cursor-pointer flex items-center justify-center shadow-xs"
              >
                <Icon icon={s.icon} className="text-sm" />
              </a>
            ))}
          </div>

          {/* System Status */}
          <a
            href="/status"
            onClick={(e) => handleLinkClick(e, "/status")}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10.5px] text-emerald-300 font-bold hover:bg-emerald-900/50 transition-colors w-fit cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            All systems operational (99.9% Uptime) →
          </a>
        </div>

        {/* Product Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-black text-white uppercase tracking-widest">Product</h5>
          <ul className="space-y-2.5">
            {links.product.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group font-medium"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-purple-400 group-hover:text-purple-300 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-black text-white uppercase tracking-widest">Company</h5>
          <ul className="space-y-2.5">
            {links.company.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group font-medium"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-purple-400 group-hover:text-purple-300 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Developer Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-black text-white uppercase tracking-widest">Developer</h5>
          <ul className="space-y-2.5">
            {links.developer.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group font-medium"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-purple-400 group-hover:text-purple-300 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-black text-white uppercase tracking-widest">Legal</h5>
          <ul className="space-y-2.5">
            {links.legal.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group font-medium"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-purple-400 group-hover:text-purple-300 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span>© 2026 EventOS Business Suite. All rights reserved.</span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="text-slate-300 font-semibold">
            Crafted with ❤️ by{" "}
            <a 
              href="/founder-story" 
              onClick={(e) => handleLinkClick(e, "/founder-story")}
              className="text-purple-400 hover:text-purple-300 underline font-extrabold transition-colors cursor-pointer"
            >
              Lokesh Nagrikar
            </a>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Icon icon="solar:code-bold" className="text-xs text-purple-400" />
            Build: v1.1.0-prod
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">Server Region: IN-WEST</span>
        </div>
      </div>
    </footer>
  );
}
