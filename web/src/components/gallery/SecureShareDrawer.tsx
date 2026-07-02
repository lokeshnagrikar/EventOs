"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Shield, Clock, Eye, Download, ShieldCheck, Mail, Send, Copy, Check, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecureShareDrawerProps {
  albumId: string;
  onGenerateLink: (settings: { expiresInHours: number; password?: string; viewOnly: boolean; downloadAllowed: boolean; watermark: boolean }) => void;
  activeLinks: { id: string; token: string; expiresAt: string | null; passwordProtected: boolean }[];
  onRevokeLink: (linkId: string) => void;
}

export default function SecureShareDrawer({
  albumId,
  onGenerateLink,
  activeLinks,
  onRevokeLink
}: SecureShareDrawerProps) {
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [expiryHours, setExpiryHours] = useState("168"); // Default 7 days
  const [viewOnly, setViewOnly] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [watermark, setWatermark] = useState(false);
  
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateLink({
      expiresInHours: parseFloat(expiryHours),
      password: requirePasscode && passcode.trim() ? passcode : undefined,
      viewOnly,
      downloadAllowed,
      watermark
    });
    setPasscode("");
  };

  const handleCopyLink = (linkId: string, token: string) => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/share/${token}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  return (
    <div className="p-5 border border-zinc-800 bg-[#141416]/40 rounded-2xl space-y-6 text-xs text-zinc-350 select-none">
      <div className="border-b border-zinc-850 pb-3">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-300">Secure Link Engine</h3>
        <p className="text-[10px] text-zinc-550 mt-0.5">Configure access tokens, watermarks, and expiry limits.</p>
      </div>

      {/* Share Creator Form */}
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-550 uppercase font-black">Link Lifespan</label>
            <select
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300"
            >
              <option value="1">1 Hour</option>
              <option value="24">24 Hours</option>
              <option value="168">7 Days</option>
              <option value="720">30 Days</option>
              <option value="0">Never Expire</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-550 uppercase font-black">Watermarking</label>
            <div className="flex items-center h-8">
              <input
                type="checkbox"
                id="watermark-chk"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="watermark-chk" className="font-bold text-zinc-400">Apply Overlays</label>
            </div>
          </div>
        </div>

        {/* Security parameters */}
        <div className="space-y-3 p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-400">Enable Passcode Lock</span>
            <input
              type="checkbox"
              checked={requirePasscode}
              onChange={(e) => setRequirePasscode(e.target.checked)}
            />
          </div>
          {requirePasscode && (
            <input
              type="text"
              required
              placeholder="Enter secure passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
            />
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
            Generate Share Link
          </button>
        </div>
      </form>

      {/* Active Links list */}
      {activeLinks.length > 0 && (
        <div className="border-t border-zinc-850 pt-5 space-y-3">
          <span className="text-[9.5px] text-zinc-550 uppercase font-black tracking-widest block">Active Share Links</span>
          <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none">
            {activeLinks.map((link) => {
              const isCopied = copiedLinkId === link.id;

              return (
                <div key={link.id} className="p-3 border border-zinc-850 bg-zinc-950/30 rounded-xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-mono text-[9px] text-zinc-450 block truncate">.../share/{link.token}</span>
                    <span className="text-[8px] text-zinc-550 block font-bold mt-0.5">
                      {link.expiresAt ? `Expires: ${new Date(link.expiresAt).toLocaleDateString()}` : "Permanent Link"}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyLink(link.id, link.token)}
                      className={cn("p-1.5 rounded-lg border", isCopied ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-450" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-850")}
                      title="Copy URL"
                    >
                      {isCopied ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={() => onRevokeLink(link.id)}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg"
                      title="Revoke Link"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
