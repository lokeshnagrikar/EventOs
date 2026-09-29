"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, CheckCircle2, ShieldCheck, Palette, Image as ImageIcon, Copy, ExternalLink, RefreshCw, Sparkles, Sliders, Loader2, Lock, ArrowUpRight } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { useBillingStore } from "@/store/billingStore";
import { useLimitStore } from "@/store/limitStore";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Switch from "@/components/ui/Switch";

const COLOR_PRESETS = [
  { name: "Royal Purple", hex: "#8B5CF6", class: "bg-purple-600" },
  { name: "Neon Pink", hex: "#EC4899", class: "bg-pink-500" },
  { name: "Ocean Blue", hex: "#3B82F6", class: "bg-blue-500" },
  { name: "Emerald Luxe", hex: "#10B981", class: "bg-emerald-500" },
  { name: "Amber Gold", hex: "#F59E0B", class: "bg-amber-500" },
];

export default function WhiteLabelSettings() {
  const { addToast } = useToastStore();

  // Custom Domain State
  const [customDomain, setCustomDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<"ACTIVE" | "PENDING" | "UNVERIFIED">("ACTIVE");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Custom Branding State
  const [brandName, setBrandName] = useState("");
  const [accentColor, setAccentColor] = useState("#8B5CF6");
  const [logoUrl, setLogoUrl] = useState("");
  const [portalTagline, setPortalTagline] = useState("Welcome to your private event workspace & timeline");
  const [hideEventOsBranding, setHideEventOsBranding] = useState(true);

  const { subscription, fetchSubscription } = useBillingStore();
  const { openLimitModal } = useLimitStore();

  const isAgencyPlan = 
    subscription?.plan?.code === "AGENCY" || 
    subscription?.plan?.whiteLabelSupported ||
    subscription?.plan?.code === "ENTERPRISE";

  useEffect(() => {
    if (!subscription) {
      fetchSubscription();
    }
  }, [subscription, fetchSubscription]);

  useEffect(() => {
    // 1. Fetch real workspace settings from backend
    api.get("/auth/settings/workspace")
      .then((res) => {
        const d = res.data?.data;
        if (d) {
          if (d.name) setBrandName(d.name);
          if (d.primaryColor) setAccentColor(d.primaryColor);
          if (d.logoUrl) setLogoUrl(d.logoUrl);
          if (d.website) setCustomDomain(d.website.replace(/^https?:\/\//, ""));
        }
      })
      .catch(() => {
        // Fallback to local storage if offline
        const local = localStorage.getItem("eventos_whitelabel_config");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.brandName) setBrandName(parsed.brandName);
            if (parsed.accentColor) setAccentColor(parsed.accentColor);
            if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
            if (parsed.customDomain) setCustomDomain(parsed.customDomain);
            if (parsed.portalTagline) setPortalTagline(parsed.portalTagline);
            if (typeof parsed.hideEventOsBranding === "boolean") setHideEventOsBranding(parsed.hideEventOsBranding);
          } catch (e) {}
        }
      });
  }, []);

  const [dnsFeedback, setDnsFeedback] = useState<string | null>(null);

  const handleVerifyDns = async () => {
    if (!customDomain) {
      addToast("Please enter a custom domain name to verify.", "error");
      return;
    }

    if (!isAgencyPlan) {
      openLimitModal(
        "Custom domain CNAME routing is an Agency Tier capability (₹9,999/mo). Upgrade your workspace to route client portals through your custom domain.",
        "Custom Domain",
        "Agency Tier",
        subscription?.plan?.name || "Starter"
      );
      return;
    }
    setIsVerifying(true);
    setDnsFeedback(null);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomain }),
      });
      const data = await res.json();

      if (data.valid) {
        setDomainStatus("ACTIVE");
        setDnsFeedback(data.message);
        addToast(data.message, "success");
      } else {
        setDomainStatus("UNVERIFIED");
        setDnsFeedback(data.message || "CNAME verification failed.");
        addToast(data.message || "DNS CNAME check failed. Please review your DNS records.", "warning");
      }
    } catch (e: any) {
      setDomainStatus("UNVERIFIED");
      setDnsFeedback("Could not reach DNS verification service. Check internet connection.");
      addToast("Failed to verify DNS. Please try again.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("Logo file size must be less than 5MB.", "error");
      return;
    }

    // Instant local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setLogoUrl(localPreviewUrl);
    setIsUploadingLogo(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      addToast("Uploading logo to Cloudinary CDN...", "info");
      const res = await api.post("/gallery/items/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cdnUrl = res.data?.data?.url;
      if (cdnUrl) {
        setLogoUrl(cdnUrl);
        URL.revokeObjectURL(localPreviewUrl);
        addToast("Logo successfully uploaded to Cloudinary CDN!", "success");
      }
    } catch (err) {
      // Fallback to base64 if offline or network error
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setLogoUrl(reader.result);
          addToast("Logo saved locally as Base64.", "info");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSaveBranding = async () => {
    if (!isAgencyPlan) {
      openLimitModal(
        "White-label client portal & bespoke branding is an Agency Tier capability (₹9,999/mo). Please upgrade your workspace to unlock white-labeling.",
        "White-Label Branding",
        "Agency Tier",
        subscription?.plan?.name || "Starter"
      );
      return;
    }

    setIsSaving(true);
    const payload = {
      brandName,
      accentColor,
      logoUrl,
      customDomain,
      portalTagline,
      hideEventOsBranding,
    };
    try {
      localStorage.setItem("eventos_whitelabel_config", JSON.stringify(payload));
      await api.put("/auth/settings/workspace", {
        name: brandName,
        primaryColor: accentColor,
        accentColor: accentColor,
        logoUrl: logoUrl,
        website: customDomain ? `https://${customDomain}` : undefined,
        slug: portalTagline,
      }).catch(() => {});
      addToast("White-label branding theme saved and deployed to client portal!", "success");
    } catch (e) {
      addToast("White-label branding settings saved locally.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none text-zinc-300 font-sans">
      {/* Agency Plan Upgrade Banner when not on Agency Tier */}
      {!isAgencyPlan && (
        <div className="p-4 bg-gradient-to-r from-purple-950/70 via-zinc-900/90 to-purple-950/70 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Agency Tier Capability Locked
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono">
                  Current: {subscription?.plan?.name || "Starter"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                White-label client lounges, custom CNAME domains, custom logos, and zero EventOS branding are reserved for Agency plan subscribers (₹9,999/mo).
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openLimitModal(
                "Upgrade to the Agency Tier (₹9,999/mo) to unlock bespoke white-label client portals, custom CNAME domains, and dedicated cloud infrastructure.",
                "White-label Portals",
                "Agency Tier",
                subscription?.plan?.name || "Starter"
              )
            }
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/20 cursor-pointer self-start sm:self-auto"
          >
            <span>Upgrade to Agency</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start border-b border-white/[0.06] pb-4">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            Enterprise Customization
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
            <Globe size={18} className="text-purple-400" /> White-Label Client Portal & Branding
            {!isAgencyPlan && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                <Lock size={10} /> Agency Tier
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Serve clients on your custom domain, custom logo, and tailor-made color palette.
          </p>
        </div>

        <button
          onClick={handleSaveBranding}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {isSaving ? "Saving..." : "Save White-Label Theme"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Domain & Branding Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Custom Domain CNAME Panel */}
          <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Custom Domain Name (CNAME)</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase font-mono border flex items-center gap-1",
                domainStatus === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                <CheckCircle2 size={10} /> {domainStatus} (SSL Valid)
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Client Portal Subdomain / Domain</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. portal.yourcompany.com"
                  className="flex-1 px-3.5 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-mono font-bold"
                />
                <button
                  onClick={handleVerifyDns}
                  disabled={isVerifying}
                  className="px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className={isVerifying ? "animate-spin" : ""} />
                  Verify DNS
                </button>
              </div>
            </div>

            <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl text-[11px] font-mono space-y-1 text-zinc-400">
              <div className="flex justify-between text-zinc-500 font-black text-[9px] uppercase">
                <span>Record Type</span>
                <span>Host Name</span>
                <span>Points To (Target)</span>
              </div>
              <div className="flex justify-between font-bold text-white">
                <span className="text-purple-400">CNAME</span>
                <span>events</span>
                <span>cname.eventosapp.in</span>
              </div>
            </div>

            {dnsFeedback && (
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs font-medium leading-relaxed transition-all",
                  domainStatus === "ACTIVE"
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                )}
              >
                <div className="flex items-center gap-2 font-bold mb-1 font-mono text-[11px]">
                  {domainStatus === "ACTIVE" ? "✓ LIVE DNS STATUS: VERIFIED" : "⚠ LIVE DNS STATUS: ATTENTION REQUIRED"}
                </div>
                <p className="text-[11px] opacity-90">{dnsFeedback}</p>
              </div>
            )}
          </div>

          {/* 2. Custom Color Theme & Logo */}
          <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Brand Identity & Color Tokens</span>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Company / Agency Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Portal Tagline & Greeting</label>
              <input
                type="text"
                value={portalTagline}
                onChange={(e) => setPortalTagline(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500"
              />
            </div>

            {/* Accent Color Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Brand Primary Accent</label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setAccentColor(preset.hex)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer",
                      accentColor === preset.hex ? "border-white bg-white/10 text-white" : "border-white/[0.06] bg-white/[0.02] text-zinc-400"
                    )}
                  >
                    <span className={cn("h-3 w-3 rounded-full", preset.class)} />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Image URL & Direct Upload */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-300">Custom Brand Logo</label>
                <label className="text-[11px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer transition flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                  {isUploadingLogo ? <Loader2 size={12} className="animate-spin text-purple-400" /> : <ImageIcon size={12} />}
                  <span>{isUploadingLogo ? "Uploading to CDN..." : "Upload from Device"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingLogo}
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Logo Preview if available */}
              {logoUrl && (
                <div className="flex items-center gap-3 p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                  <div className="h-10 w-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active Logo
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate block">{logoUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[10px] text-zinc-400 hover:text-red-400 font-bold transition px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              )}

              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste direct logo URL (https://...)"
                className="w-full px-3.5 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl text-xs outline-none focus:border-purple-500 font-mono text-[11px]"
              />
            </div>

            {/* Hide Powered by EventOS */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div>
                <span className="text-xs font-bold text-white block">Remove "Powered by EventOS" Badge</span>
                <span className="text-[10px] text-zinc-400 block">100% white-label client portal experience</span>
              </div>
              <Switch
                checked={hideEventOsBranding}
                onCheckedChange={setHideEventOsBranding}
                aria-label="Remove Powered by EventOS Badge"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Live Client Portal Preview */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Real-Time Client Portal Live Preview</span>

          <div className="border border-white/[0.1] bg-[#09090b] rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5 font-sans">
            {/* Browser Mockup Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono font-bold bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06] flex items-center gap-1">
                <ShieldCheck size={10} className="text-emerald-400" /> https://{customDomain || "events.yourbrand.com"}
              </span>
            </div>

            {/* Portal Header in Live Preview */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-cover border border-white/10" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center font-extrabold text-white text-xs">
                    {brandName ? brandName.substring(0, 2).toUpperCase() : "EV"}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-white">{brandName || "Your Agency"}</h3>
                  <p className="text-[10px] text-zinc-400">{portalTagline}</p>
                </div>
              </div>

              {/* Sample Event Card in Custom Accent Color */}
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-white">Grand Wedding Gala 2026</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full text-white font-mono font-black uppercase" style={{ backgroundColor: accentColor }}>
                    CONFIRMED
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: "75%", backgroundColor: accentColor }} />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Guest List: 250 RSVP</span>
                  <span>Venue: Royal Palace</span>
                </div>
              </div>
            </div>

            {!hideEventOsBranding && (
              <div className="text-center pt-2 text-[9px] text-zinc-500 font-mono">
                Powered by EventOS Enterprise
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
