"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  QrCode,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  Download,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  KeyRound,
  Loader2,
  Trash2
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, getAppBaseUrl } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";

interface Album {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  visibility: "PUBLIC" | "PRIVATE";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

interface ShareLinkItem {
  id: string;
  token: string;
  expiresAt: string | null;
  passwordProtected: boolean;
  allowDownload?: boolean;
}

interface ShareQrModalProps {
  album: Album;
  isOpen: boolean;
  onClose: () => void;
  onUpdateVisibility: (vis: "PUBLIC" | "PRIVATE") => void;
}

export default function ShareQrModal({
  album,
  isOpen,
  onClose,
  onUpdateVisibility
}: ShareQrModalProps) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "advanced">("quick");

  // Advanced link creation states
  const [expiryHours, setExpiryHours] = useState("168"); // 7 days
  const [passcode, setPasscode] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [applyWatermark, setApplyWatermark] = useState(false);

  // Fetch active share links for this album
  const { data: shareLinksResponse, refetch: refetchLinks } = useQuery<{ data: ShareLinkItem[] }>({
    queryKey: ["albumShareLinks", album.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/gallery/share/album/${album.id}`);
        return response.data;
      } catch (e) {
        return { data: [] };
      }
    },
    enabled: isOpen && !!album.id
  });

  const activeLinks = shareLinksResponse?.data || [];
  const latestToken = activeLinks.length > 0 ? activeLinks[0].token : null;

  // Create share link mutation
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/gallery/share", {
        albumId: album.id,
        expiresInHours: parseInt(expiryHours) > 0 ? parseInt(expiryHours) : undefined,
        password: requirePasscode && passcode.trim() ? passcode.trim() : undefined,
        allowDownload,
        watermark: applyWatermark,
        watermarkText: applyWatermark ? "EventOS Client Portal" : undefined
      });
      return response.data;
    },
    onSuccess: () => {
      refetchLinks();
      addToast("Secure share link generated ✓", "success");
      setPasscode("");
      setRequirePasscode(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to generate link.";
      addToast(msg, "error");
    }
  });

  // Revoke share link mutation
  const revokeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/gallery/share/${linkId}`);
    },
    onSuccess: () => {
      refetchLinks();
      addToast("Link revoked successfully", "success");
    }
  });

  if (!isOpen) return null;

  const baseUrl = getAppBaseUrl();
  // If active share token exists, use direct /share/[token], otherwise direct album preview link
  const currentShareUrl = latestToken
    ? `${baseUrl}/share/${latestToken}`
    : `${baseUrl}/gallery/${album.id}`;

  // Real QR Code API URL (280x280, clean scannable high contrast)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    currentShareUrl
  )}&color=09090b&bgcolor=ffffff&qzone=2`;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast("Share link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleDownloadQr = async () => {
    try {
      const res = await fetch(qrCodeUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${album.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_qrcode.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      addToast("QR Code PNG downloaded!", "success");
    } catch {
      window.open(qrCodeUrl, "_blank");
      addToast("QR Code opened in new tab", "info");
    }
  };

  const isPrivate = album.visibility === "PRIVATE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#111114] border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden relative text-zinc-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-purple-600/15 via-purple-900/5 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-6 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">{album.name}</h3>
                <span
                  className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                    isPrivate
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}
                >
                  {isPrivate ? "Private Album" : "Public Album"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-450 mt-0.5">
                Shareable web link, scannable QR code & client download controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-850 hover:bg-zinc-750 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Visibility & Download Guard Banner */}
        <div className="px-6 pt-4 pb-2">
          {isPrivate ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">Downloads Are Locked (Private Mode)</div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                    External clients & guests cannot view or download photos. Switch to Public to enable album downloads.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateVisibility("PUBLIC")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shrink-0 transition-all shadow cursor-pointer flex items-center gap-1.5 justify-center"
              >
                <Eye size={12} /> Make Public & Allow Downloads
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-300">Downloads Are Enabled (Public Mode)</div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                    Anyone with the QR code or link can view high-res memories and download full albums.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateVisibility("PRIVATE")}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/20 rounded-lg font-bold text-[11px] shrink-0 transition-all cursor-pointer flex items-center gap-1.5 justify-center"
              >
                <EyeOff size={12} /> Make Private (Lock)
              </button>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-zinc-850">
          <button
            onClick={() => setActiveTab("quick")}
            className={cn(
              "px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer",
              activeTab === "quick"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Quick Share & Live QR Code
          </button>
          <button
            onClick={() => setActiveTab("advanced")}
            className={cn(
              "px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5",
              activeTab === "advanced"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Lock size={11} /> Passcode & Expiry Controls
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {activeTab === "quick" ? (
            <div className="space-y-5">
              {/* QR Code & Preview Box */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="p-2.5 bg-white rounded-xl shadow-lg shrink-0 group relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Album QR Code"
                    className="w-36 h-36 object-contain block select-none"
                  />
                </div>

                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-black">
                      Live Scannable QR Code
                    </span>
                    <h4 className="font-extrabold text-sm text-white">Scan with any phone camera</h4>
                    <p className="text-[11px] text-zinc-450 leading-relaxed">
                      Instant mobile access for guests, clients, and wedding invites. Open directly in standard browsers without app download.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Download size={13} /> Save QR PNG
                    </button>
                    <a
                      href={currentShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-zinc-200 border border-zinc-750 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ExternalLink size={13} /> Test Link
                    </a>
                  </div>
                </div>
              </div>

              {/* Share URL Box */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-black tracking-wider flex items-center justify-between">
                  <span>Direct Share URL</span>
                  <span className="text-zinc-550 font-normal">Ready to paste in WhatsApp / Email</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 bg-[#141416] border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 truncate select-all">
                    {currentShareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentShareUrl)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md",
                      copiedLink
                        ? "bg-emerald-600 text-white"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                    )}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Advanced Security Generator */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lifespan */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Link Lifespan</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-bold"
                    >
                      <option value="24">24 Hours (1 Day)</option>
                      <option value="168">7 Days (1 Week)</option>
                      <option value="720">30 Days (1 Month)</option>
                      <option value="0">Never Expire (Permanent)</option>
                    </select>
                  </div>

                  {/* Allow Downloads Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Download Permissions</label>
                    <button
                      type="button"
                      onClick={() => setAllowDownload(!allowDownload)}
                      className={cn(
                        "w-full px-3 py-2 border rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer",
                        allowDownload
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Download size={13} /> {allowDownload ? "Downloads Allowed" : "View-Only Preview"}
                      </span>
                      <span className="text-[10px]">{allowDownload ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>

                {/* Passcode Lock */}
                <div className="space-y-2 border-t border-zinc-850/60 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requirePasscode}
                        onChange={(e) => setRequirePasscode(e.target.checked)}
                        className="accent-purple-600 rounded"
                      />
                      <span>Require Secure Passcode</span>
                    </label>
                  </div>
                  {requirePasscode && (
                    <input
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="e.g. 2026VIP"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:border-purple-500 outline-none"
                    />
                  )}
                </div>

                {/* Watermark toggle */}
                <div className="flex items-center justify-between border-t border-zinc-850/60 pt-3">
                  <div>
                    <div className="font-bold text-zinc-300">Agency Preview Watermark</div>
                    <div className="text-[10px] text-zinc-500">Overlays diagonal studio protection watermark</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyWatermark}
                    onChange={(e) => setApplyWatermark(e.target.checked)}
                    className="accent-purple-600 rounded h-4 w-4"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={createLinkMutation.isPending}
                    onClick={() => createLinkMutation.mutate()}
                    className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {createLinkMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                    Create Secured Share Token
                  </button>
                </div>
              </div>

              {/* Active Tokens List */}
              {activeLinks.length > 0 && (
                <div className="space-y-2 border-t border-zinc-850 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-450 block">
                    Active Share Tokens ({activeLinks.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-mono text-purple-400 text-[11px] block truncate">
                            {baseUrl}/share/{link.token}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {link.expiresAt
                              ? `Expires: ${new Date(link.expiresAt).toLocaleDateString()}`
                              : "Permanent Link"}
                            {link.passwordProtected && " • 🔒 Passcode Protected"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(`${baseUrl}/share/${link.token}`)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg cursor-pointer"
                            title="Copy link"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeLinkMutation.mutate(link.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer"
                            title="Revoke token"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950/70 border-t border-zinc-850 flex items-center justify-between text-xs">
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-400" />
            <span>Encrypted Cloudinary CDN delivery</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
