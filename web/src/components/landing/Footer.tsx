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
      { name: "Careers", href: "/careers" },
      { name: "Platform Security", href: "/security" },
      { name: "System Status", href: "/status" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Tenant SLA", href: "/sla" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  const socials = [
    { icon: "simple-icons:x", href: "https://twitter.com", label: "EventOS on X/Twitter" },
    { icon: "simple-icons:github", href: "https://github.com", label: "EventOS on GitHub" },
    { icon: "simple-icons:linkedin", href: "https://linkedin.com", label: "EventOS on LinkedIn" },
    { icon: "simple-icons:instagram", href: "https://instagram.com", label: "EventOS on Instagram" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const elem = document.getElementById(href.replace("#", ""));
      if (elem) window.scrollTo({ top: elem.offsetTop - 80, behavior: "smooth" });
    } else {
      e.preventDefault();
      router.push("/");
    }
  };

  return (
    <footer className="border-t border-zinc-900 bg-[#09090B] pt-16 pb-8 w-full relative z-10 text-left">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10">

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
            {/* Logo Emblem (From public/logo/logo.png) */}
            <img 
              src="/logo/logo.png" 
              alt="EO" 
              className="h-11 w-11 object-contain transition-all duration-300 ease-out group-hover:scale-105 group-hover:rotate-[3deg] group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
            />

            
            {/* Vertical Separator */}
            <div className="h-9 w-[1px] bg-zinc-800 transition-colors duration-300 group-hover:bg-purple-500/40" />

            {/* Brand Text styled in code */}
            <div className="flex flex-col justify-center text-left transition-all duration-300 group-hover:translate-x-0.5">
              <h4 className="font-extrabold text-sm leading-none tracking-tight text-white flex items-center transition-all duration-300 group-hover:text-purple-100">
                Event
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ml-0.5 transition-all duration-300 group-hover:brightness-110">
                  OS
                </span>
              </h4>
              <span className="text-[7px] text-[#8E8A9F] font-bold tracking-[0.14em] uppercase block mt-1 leading-none transition-colors duration-300 group-hover:text-zinc-300">
                MANAGE. ENGAGE. ELEVATE.
              </span>
            </div>
          </div>

          <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
            EventOS is the all-in-one operating system for event planners, wedding agencies, and production teams. Tenant-isolated, secure, and built for scale.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
              >
                <Icon icon={s.icon} className="text-sm" />
              </a>
            ))}
          </div>

          {/* System Status */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>

        {/* Product Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Product</h5>
          <ul className="space-y-2.5">
            {links.product.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 group"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-zinc-700 group-hover:text-purple-400 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Company</h5>
          <ul className="space-y-2.5">
            {links.company.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 group"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-zinc-700 group-hover:text-purple-400 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Legal</h5>
          <ul className="space-y-2.5">
            {links.legal.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 group"
                >
                  <Icon
                    icon="solar:arrow-right-bold"
                    className="text-[10px] text-zinc-700 group-hover:text-purple-400 transition-colors"
                  />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-14 pt-6 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-600 font-semibold">
        <span>© 2026 EventOS Business Suite. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Icon icon="solar:code-bold" className="text-xs text-zinc-700" />
            Build: v1.1.0-prod
          </span>
          <span className="text-zinc-800">•</span>
          <span>Server Region: IN-WEST</span>
        </div>
      </div>
    </footer>
  );
}
